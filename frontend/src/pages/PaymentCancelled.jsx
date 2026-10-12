import { Link } from "react-router-dom";

function PaymentCancelled() {
  return (
    <main className="page-container payment-result-page">
      <div className="payment-result-card">
        <div className="payment-cancel-icon">×</div>

        <p className="eyebrow">STYLEHUB CHECKOUT</p>

        <h1>Payment Cancelled</h1>

        <p>
          Your checkout was cancelled. You can return to your cart
          and try again whenever you're ready.
        </p>

        <Link to="/cart" className="hero-button">
          Return to Cart
        </Link>
      </div>
    </main>
  );
}

export default PaymentCancelled;