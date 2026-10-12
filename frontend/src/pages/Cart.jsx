import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../components/CartContext";

const API_URL = "http://127.0.0.1:8000";

function Cart() {
  const {
    cartItems,
    cartCount,
    cartTotal,
    cartError,
    removeFromCart,
    updateQuantity,
  } = useCart();

  const navigate = useNavigate();

  const [loadingProduct, setLoadingProduct] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(price);

  async function handleRemove(productId) {
    setLoadingProduct(productId);
    await removeFromCart(productId);
    setLoadingProduct(null);
  }

  async function handleQuantityChange(productId, quantity) {
    setLoadingProduct(productId);
    await updateQuantity(productId, quantity);
    setLoadingProduct(null);
  }

  // Create a Stripe Checkout Session and redirect to Stripe.
  async function handleCheckout() {
    setCheckoutError("");

    const token = localStorage.getItem("stylehub_token");

    if (!token) {
      navigate("/login", {
        state: {
          from: "/cart",
        },
      });
      return;
    }

    if (cartItems.length === 0) {
      setCheckoutError("Your shopping cart is empty.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/payments/create-checkout-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("stylehub_token");

        window.dispatchEvent(
          new Event("stylehub-auth-change")
        );

        navigate("/login", {
          state: {
            from: "/cart",
          },
        });

        return;
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to start checkout. Please try again."
        );
      }

      if (!data.checkout_url) {
        throw new Error(
          "Stripe did not return a checkout URL."
        );
      }

      // Redirect the customer to Stripe's hosted checkout page.
      window.location.assign(data.checkout_url);
    } catch (error) {
      console.error("Checkout error:", error);

      setCheckoutError(
        error.message ||
          "Unable to start checkout. Please try again."
      );

      setCheckoutLoading(false);
    }
  }

  if (cartItems.length === 0) {
    return (
      <main className="page-container cart-page">
        <div className="page-heading">
          <p className="eyebrow">YOUR SHOPPING BAG</p>
          <h1>Shopping Cart</h1>
        </div>

        {cartError && (
          <div className="auth-error" role="alert">
            {cartError}
          </div>
        )}

        <div className="empty-cart">
          <h2>Your cart is empty</h2>

          <p>
            Discover something you love and add it to your cart.
          </p>

          <Link to="/products" className="hero-button">
            Start Shopping →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container cart-page">
      <div className="page-heading">
        <p className="eyebrow">YOUR SHOPPING BAG</p>

        <h1>Shopping Cart</h1>

        <p>
          {cartCount} {cartCount === 1 ? "item" : "items"} in your
          cart
        </p>
      </div>

      {cartError && (
        <div className="auth-error" role="alert">
          {cartError}
        </div>
      )}

      {checkoutError && (
        <div className="auth-error" role="alert">
          {checkoutError}
        </div>
      )}

      <div className="cart-layout">
        <section className="cart-items">
          {cartItems.map((item) => (
            <article className="cart-item" key={item.id}>
              <Link
                to={`/products/${item.id}`}
                className="cart-item-image"
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} />
                ) : (
                  <div className="no-image">No image</div>
                )}
              </Link>

              <div className="cart-item-info">
                <span className="eyebrow">
                  {item.category}
                </span>

                <Link to={`/products/${item.id}`}>
                  <h3>{item.name}</h3>
                </Link>

                <p>{formatPrice(item.price)}</p>

                <div className="quantity-controls">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.name} quantity`}
                    disabled={
                      item.quantity <= 1 ||
                      loadingProduct === item.id ||
                      checkoutLoading
                    }
                    onClick={() =>
                      handleQuantityChange(
                        item.id,
                        item.quantity - 1
                      )
                    }
                  >
                    −
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    type="button"
                    aria-label={`Increase ${item.name} quantity`}
                    disabled={
                      item.quantity >= item.stock ||
                      loadingProduct === item.id ||
                      checkoutLoading
                    }
                    onClick={() =>
                      handleQuantityChange(
                        item.id,
                        item.quantity + 1
                      )
                    }
                  >
                    +
                  </button>
                </div>

                {loadingProduct === item.id && (
                  <p className="cart-loading">
                    Updating cart...
                  </p>
                )}

                <button
                  type="button"
                  className="remove-item"
                  disabled={
                    loadingProduct === item.id ||
                    checkoutLoading
                  }
                  onClick={() => handleRemove(item.id)}
                >
                  Remove
                </button>
              </div>

              <strong className="cart-item-subtotal">
                {formatPrice(item.price * item.quantity)}
              </strong>
            </article>
          ))}
        </section>

        <aside className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Total items</span>
            <span>{cartCount}</span>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>

          <div className="summary-total">
            <span>Total</span>
            <strong>{formatPrice(cartTotal)}</strong>
          </div>

          <button
            type="button"
            className="checkout-button"
            onClick={handleCheckout}
            disabled={
              checkoutLoading || loadingProduct !== null
            }
          >
            {checkoutLoading
              ? "Connecting to Stripe..."
              : "Proceed to Checkout"}
          </button>

          <Link
            to="/products"
            className="continue-shopping"
          >
            ← Continue Shopping
          </Link>

          <p className="checkout-security-note">
            Secure checkout powered by Stripe.
          </p>
        </aside>
      </div>
    </main>
  );
}

export default Cart;