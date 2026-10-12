import { Link } from "react-router-dom";

function PaymentSuccess() {
  return (
    <main className="page-container payment-result-page">
      <div className="payment-result-card">
        <div className="payment-success-icon">✓</div>

        <p className="eyebrow">STYLEHUB CHECKOUT</p>

        <h1>Thank You for Your Order!</h1>

        <p>
          You've returned from Stripe Checkout. We're checking your
          order status.
        </p>

        <p className="payment-result-note">
          Your order will be marked as paid after our server verifies
          the payment confirmation from Stripe.
        </p>

        <Link to="/products" className="hero-button">
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}

export default PaymentSuccess;