from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.cart import CartItem
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse
from app.security import get_current_user


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


# --------------------------------------------------
# 1. CREATE AN ORDER FROM THE SHOPPING CART
# --------------------------------------------------

@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not order_data.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please confirm your order.",
        )

    try:
        # Get the logged-in user's cart.
        cart_items = (
            db.query(CartItem)
            .filter(CartItem.user_id == current_user.id)
            .all()
        )

        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your shopping cart is empty.",
            )

        total_amount = 0.0
        order_items_data = []

        # Validate products and calculate prices on the backend.
        for cart_item in cart_items:
            product = (
                db.query(Product)
                .filter(Product.id == cart_item.product_id)
                .first()
            )

            if product is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A product in your cart is no longer available.",
                )

            if cart_item.quantity > product.stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient stock for {product.name}. "
                        f"Available quantity: {product.stock}."
                    ),
                )

            if cart_item.quantity < 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid product quantity in your cart.",
                )

            unit_price = float(product.price)
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

        total_amount = round(total_amount, 2)

        # Create the order with a pending payment status.
        new_order = Order(
            user_id=current_user.id,
            total_amount=total_amount,
            status="pending_payment",
        )

        db.add(new_order)
        db.flush()

        # Save a snapshot of every purchased product.
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

        db.commit()

        # Load the order and its items for the API response.
        saved_order = (
            db.query(Order)
            .options(selectinload(Order.items))
            .filter(
                Order.id == new_order.id,
                Order.user_id == current_user.id,
            )
            .first()
        )

        return saved_order

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create your order. Please try again.",
        )


# --------------------------------------------------
# 2. GET THE LOGGED-IN USER'S ORDERS
# --------------------------------------------------

@router.get(
    "/",
    response_model=list[OrderResponse],
)
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    return orders


# --------------------------------------------------
# 3. GET ONE ORDER BY ID
# --------------------------------------------------

@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .options(selectinload(Order.items))
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    return order