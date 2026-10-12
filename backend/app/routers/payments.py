import os

import stripe
from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    Request,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.security import get_current_user


load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


class CheckoutResponse(BaseModel):
    checkout_url: str
    order_id: int


# --------------------------------------------------
# 1. CREATE STRIPE CHECKOUT SESSION
# --------------------------------------------------

@router.post(
    "/create-checkout-session",
    response_model=CheckoutResponse,
)
def create_checkout_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not stripe.api_key:
        raise HTTPException(
            status_code=500,
            detail="Stripe secret key is not configured.",
        )

    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .all()
    )

    if not cart_items:
        raise HTTPException(
            status_code=400,
            detail="Your shopping cart is empty.",
        )

    order_items_data = []
    stripe_line_items = []
    total_amount = 0.0

    for cart_item in cart_items:
        product = (
            db.query(Product)
            .filter(Product.id == cart_item.product_id)
            .first()
        )

        if product is None:
            raise HTTPException(
                status_code=400,
                detail="A product in your cart is unavailable.",
            )

        if cart_item.quantity < 1:
            raise HTTPException(
                status_code=400,
                detail="Invalid product quantity.",
            )

        if product.price <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid price for {product.name}.",
            )

        if product.stock < cart_item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}.",
            )

        unit_price = round(float(product.price), 2)
        line_total = round(unit_price * cart_item.quantity, 2)

        total_amount += line_total

        order_items_data.append(
            {
                "product_id": product.id,
                "product_name": product.name,
                "unit_price": unit_price,
                "quantity": cart_item.quantity,
                "line_total": line_total,
            }
        )

        stripe_line_items.append(
            {
                "price_data": {
                    "currency": "inr",
                    "unit_amount": int(round(unit_price * 100)),
                    "product_data": {
                        "name": product.name,
                    },
                },
                "quantity": cart_item.quantity,
            }
        )

    total_amount = round(total_amount, 2)

    new_order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status="pending_payment",
    )

    try:
        db.add(new_order)
        db.flush()

        for item_data in order_items_data:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item_data["product_id"],
                product_name=item_data["product_name"],
                unit_price=item_data["unit_price"],
                quantity=item_data["quantity"],
                line_total=item_data["line_total"],
            )

            db.add(order_item)

        # Create the Stripe session before committing the order.
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=stripe_line_items,
            client_reference_id=str(current_user.id),
            metadata={
                "order_id": str(new_order.id),
                "user_id": str(current_user.id),
            },
            payment_intent_data={
                "metadata": {
                    "order_id": str(new_order.id),
                    "user_id": str(current_user.id),
                }
            },
            success_url=(
                f"{FRONTEND_URL}/payment-success"
                "?session_id={CHECKOUT_SESSION_ID}"
            ),
            cancel_url=f"{FRONTEND_URL}/payment-cancelled",
        )

        db.commit()

        return CheckoutResponse(
            checkout_url=session.url,
            order_id=new_order.id,
        )

    except stripe.StripeError as e:
        db.rollback()

        print("STRIPE ERROR:", str(e))
        print("ERROR TYPE:", type(e).__name__)

        raise HTTPException(
            status_code=502,
            detail="Unable to start Stripe Checkout. Check backend terminal.",
        )

    except Exception as e:
        db.rollback()

        print("CHECKOUT ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Unable to create checkout. Check backend terminal.",
        )


# --------------------------------------------------
# 2. VERIFY STRIPE WEBHOOK AND CONFIRM PAYMENT
# --------------------------------------------------

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(
        default=None,
        alias="Stripe-Signature",
    ),
    db: Session = Depends(get_db),
):
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Stripe webhook secret is not configured.",
        )

    if not stripe_signature:
        raise HTTPException(
            status_code=400,
            detail="Missing Stripe signature.",
        )

    payload = await request.body()

    # Verify that the event really came from Stripe.
    try:
        event = stripe.Webhook.construct_event(
            payload,
            stripe_signature,
            STRIPE_WEBHOOK_SECRET,
        )

    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(
            status_code=400,
            detail="Invalid Stripe webhook signature or payload.",
        )

    # We only process completed Checkout Sessions.
    if event["type"] != "checkout.session.completed":
        return {"received": True, "message": "Event ignored."}

    checkout_session = event["data"]["object"].to_dict()

    # Do not fulfill an order unless Stripe reports payment as paid.
    if checkout_session.get("payment_status") != "paid":
        return {
            "received": True,
            "message": "Payment is not complete.",
        }

    metadata = checkout_session.get("metadata") or {}

    try:
        order_id = int(metadata["order_id"])
        user_id = int(metadata["user_id"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Missing or invalid order metadata.",
        )

    # Find the order belonging to the customer in the signed event.
    order = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(
            Order.id == order_id,
            Order.user_id == user_id,
        )
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found.",
        )

    # Repeated webhook deliveries must not process an order twice.
    if order.status == "paid":
        return {
            "received": True,
            "message": "Order was already processed.",
        }

    if order.status != "pending_payment":
        return {
            "received": True,
            "message": "Order is not awaiting payment.",
        }

    # Verify the amount and currency against the saved order.
    expected_amount = int(round(order.total_amount * 100))
    actual_amount = checkout_session.get("amount_total")
    currency = checkout_session.get("currency")

    if (
        actual_amount != expected_amount
        or currency != "inr"
        or checkout_session.get("mode") != "payment"
    ):
        raise HTTPException(
            status_code=400,
            detail="Payment details do not match the order.",
        )

    try:
        # Check stock for every product before changing any stock.
        products_to_update = []

        for item in order.items:
            if item.product_id is None:
                order.status = "paid_stock_issue"
                db.commit()

                return {
                    "received": True,
                    "message": (
                        "Payment received, but a product is unavailable. "
                        "The order requires manual review and refund handling."
                    ),
                }

            product = (
                db.query(Product)
                .filter(Product.id == item.product_id)
                .first()
            )

            if product is None or product.stock < item.quantity:
                # Payment has already succeeded. Do not silently pretend
                # that this order can be fulfilled.
                order.status = "paid_stock_issue"
                db.commit()

                return {
                    "received": True,
                    "message": (
                        "Payment received, but stock is insufficient. "
                        "The order requires manual review and refund handling."
                    ),
                }

            products_to_update.append((product, item.quantity))

        # Stock is reduced only after verified payment.
        for product, quantity in products_to_update:
            product.stock -= quantity

        # Clear only this customer's cart.
        db.query(CartItem).filter(
            CartItem.user_id == user_id
        ).delete(synchronize_session=False)

        order.status = "paid"

        db.commit()

        return {
            "received": True,
            "message": "Payment confirmed and order processed.",
            "order_id": order.id,
            "status": order.status,
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to process the paid order.",
        )