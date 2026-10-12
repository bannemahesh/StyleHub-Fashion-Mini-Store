import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Orders.css";

const API_URL = "http://127.0.0.1:8000";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("stylehub_token");

      if (!token) {
        setError("Please log in to view your orders.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/orders/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          throw new Error("Your session may have expired. Please log in again.");
        }

        if (!response.ok) {
          throw new Error("Unable to load your orders. Please try again.");
        }

        const data = await response.json();

        // Supports an API returning either an array or { orders: [...] }.
        setOrders(Array.isArray(data) ? data : data.orders || []);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) =>
    String(status || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-");

  if (loading) {
    return (
      <main className="orders-page">
        <div className="orders-message">
          <div className="orders-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <section className="orders-container">
        <div className="orders-heading">
          <div>
            <p className="orders-eyebrow">YOUR ACCOUNT</p>
            <h1>My Orders</h1>
            <p className="orders-subtitle">
              Track your purchases and check your payment status.
            </p>
          </div>

          <button
            className="orders-shop-button"
            onClick={() => navigate("/products")}
          >
            Continue Shopping
          </button>
        </div>

        {error && (
          <div className="orders-error">
            <p>{error}</p>

            <button onClick={() => navigate("/login")}>
              Go to Login
            </button>
          </div>
        )}

        {!error && orders.length === 0 && (
          <div className="orders-empty">
            <div className="orders-empty-icon">🛍️</div>
            <h2>No orders yet</h2>
            <p>
              Your purchased products will appear here after you place an order.
            </p>

            <button
              className="orders-shop-button"
              onClick={() => navigate("/products")}
            >
              Explore Products
            </button>
          </div>
        )}

        {!error && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <span className="order-label">ORDER NUMBER</span>
                    <h2>#{order.id}</h2>
                  </div>

                  <span
                    className={`order-status ${getStatusClass(order.status)}`}
                  >
                    {String(order.status || "unknown").replaceAll("_", " ")}
                  </span>
                </div>

                <div className="order-card-info">
                  <div>
                    <span className="order-label">ORDER DATE</span>
                    <p>{formatDate(order.created_at)}</p>
                  </div>

                  <div>
                    <span className="order-label">TOTAL AMOUNT</span>
                    <p className="order-total">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>

                  <div>
                    <span className="order-label">ITEMS</span>
                    <p>
                      {Array.isArray(order.items)
                        ? order.items.reduce(
                            (total, item) =>
                              total + Number(item.quantity || 0),
                            0
                          )
                        : 0}{" "}
                      item(s)
                    </p>
                  </div>
                </div>

                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="order-items">
                    {order.items.map((item) => (
                      <div className="order-item" key={item.id}>
                        <div className="order-item-icon">👕</div>

                        <div className="order-item-details">
                          <h3>{item.product_name}</h3>
                          <p>Quantity: {item.quantity}</p>
                        </div>

                        <p className="order-item-price">
                          {formatPrice(item.line_total)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="order-card-footer">
                  <span>
                    {String(order.status).toLowerCase() === "paid"
                      ? "✓ Payment completed"
                      : "Payment status: " + (order.status || "unknown")}
                  </span>

                  <button
                    className="order-details-button"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    View Details →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Orders;