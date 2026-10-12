import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./pages/Orders.css";

const API_URL = "http://127.0.0.1:8000";

function OrderDetails() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [productImages, setProductImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchOrderDetails() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("stylehub_token");

        if (!token) {
          setError("Please log in to view your order.");
          return;
        }

        const response = await fetch(`${API_URL}/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Please log in again to view this order.");
          }

          if (response.status === 404) {
            throw new Error("Order not found.");
          }

          throw new Error("Unable to load order details.");
        }

        const data = await response.json();

        if (active) {
          setOrder(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchOrderDetails();

    return () => {
      active = false;
    };
  }, [orderId]);

  // Fetch product images separately because order items
  // may not include image_url.
  useEffect(() => {
    if (!order || !Array.isArray(order.items)) {
      return;
    }

    let active = true;

    async function fetchProductImages() {
      const imageMap = {};

      await Promise.all(
        order.items.map(async (item) => {
          if (!item.product_id) {
            return;
          }

          try {
            // First, try fetching an individual product.
            let response = await fetch(
              `${API_URL}/products/${item.product_id}`
            );

            // If that route does not exist, try the product list.
            if (!response.ok) {
              response = await fetch(`${API_URL}/products/`);

              if (!response.ok) {
                return;
              }

              const products = await response.json();

              const product = Array.isArray(products)
                ? products.find(
                    (p) => Number(p.id) === Number(item.product_id)
                  )
                : null;

              if (product?.image_url) {
                imageMap[item.product_id] = product.image_url;
              }

              return;
            }

            const product = await response.json();

            if (product?.image_url) {
              imageMap[item.product_id] = product.image_url;
            }
          } catch (err) {
            console.error(
              `Could not load image for product ${item.product_id}:`,
              err
            );
          }
        })
      );

      if (active) {
        setProductImages(imageMap);
      }
    }

    fetchProductImages();

    return () => {
      active = false;
    };
  }, [order]);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return "Date unavailable";
    }

    // Handle timestamps without an explicit timezone.
    // Assumes timestamps without a timezone are stored in UTC.
    let normalizedDate = dateString;

    if (
      typeof dateString === "string" &&
      !/(Z|[+-]\d{2}:\d{2})$/i.test(dateString)
    ) {
      normalizedDate = `${dateString}Z`;
    }

    const date = new Date(normalizedDate);

    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatus = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (
      normalized === "paid" ||
      normalized === "confirmed" ||
      normalized === "processing" ||
      normalized === "shipped" ||
      normalized === "delivered"
    ) {
      return "confirmed";
    }

    if (
      normalized === "cancelled" ||
      normalized === "canceled" ||
      normalized === "failed"
    ) {
      return "cancelled";
    }

    return "pending";
  };

  const getStatusLabel = (status) => {
    const normalized = String(status || "").toLowerCase();

    const labels = {
      pending_payment: "Awaiting Payment",
      pending: "Pending",
      paid: "Payment Successful",
      confirmed: "Confirmed",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      canceled: "Cancelled",
      failed: "Payment Failed",
    };

    return labels[normalized] || status || "Unknown";
  };

  const getProgressStep = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (["cancelled", "canceled", "failed", "pending_payment"].includes(normalized)) {
      return 0;
    }

    if (normalized === "paid" || normalized === "confirmed") {
      return 1;
    }

    if (normalized === "processing") {
      return 2;
    }

    if (normalized === "shipped") {
      return 3;
    }

    if (normalized === "delivered") {
      return 4;
    }

    return 0;
  };

  if (loading) {
    return (
      <div className="od-page">
        <div className="od-loading">
          <div className="od-spinner"></div>
          <p>Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="od-page">
        <div className="od-message-card">
          <div className="od-message-icon">!</div>
          <h2>Unable to Open Order</h2>
          <p>{error}</p>

          <Link to="/orders" className="od-primary-button">
            View My Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const status = getStatus(order.status);
  const progressStep = getProgressStep(order.status);

  const items = Array.isArray(order.items) ? order.items : [];

  const subtotal = items.reduce((total, item) => {
    return (
      total +
      (Number(item.unit_price) || 0) * (Number(item.quantity) || 0)
    );
  }, 0);

  const total = Number(order.total_amount) || 0;

  return (
    <div className="od-page">
      <div className="od-container">
        {/* Breadcrumb */}
        <div className="od-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/orders">My Orders</Link>
          <span>/</span>
          <span>Order #{order.id}</span>
        </div>

        {/* Header */}
        <div className="od-header">
          <div>
            <span className="od-eyebrow">ORDER INFORMATION</span>
            <h1>Order Details</h1>
            <p className="od-header-description">
              Thank you for shopping with StyleHub.
            </p>
          </div>

          <Link to="/orders" className="od-back-button">
            ← Back to Orders
          </Link>
        </div>

        {/* Order confirmation banner */}
        <section className={`od-hero od-hero-${status}`}>
          <div className="od-hero-icon">
            {status === "confirmed" ? "✓" : status === "cancelled" ? "×" : "…"}
          </div>

          <div className="od-hero-content">
            <h2>
              {status === "confirmed"
                ? "Your order is confirmed!"
                : status === "cancelled"
                ? "Order cancelled or payment failed"
                : "Your order is awaiting payment"}
            </h2>

            <p>
              {status === "confirmed"
                ? "Your order has been recorded successfully. Check the status below for updates."
                : status === "cancelled"
                ? "This order cannot proceed in its current state. Contact support if you need assistance."
                : "Your order has been created, but payment may still need to be completed."}
            </p>
          </div>

          <div className={`od-status-badge od-status-${status}`}>
            {getStatusLabel(order.status)}
          </div>
        </section>

        {/* Order metadata */}
        <section className="od-info-grid">
          <div className="od-info-card">
            <span className="od-info-icon">📦</span>
            <div>
              <span className="od-info-label">Order Number</span>
              <strong>#{order.id}</strong>
            </div>
          </div>

          <div className="od-info-card">
            <span className="od-info-icon">📅</span>
            <div>
              <span className="od-info-label">Order Date</span>
              <strong>{formatDate(order.created_at)}</strong>
            </div>
          </div>

          <div className="od-info-card">
            <span className="od-info-icon">🛍️</span>
            <div>
              <span className="od-info-label">Items Ordered</span>
              <strong>
                {items.reduce(
                  (sum, item) => sum + (Number(item.quantity) || 0),
                  0
                )}{" "}
                items
              </strong>
            </div>
          </div>
        </section>

        {/* Order progress */}
        {status !== "cancelled" && (
          <section className="od-card od-progress-card">
            <div className="od-section-heading">
              <div>
                <span className="od-eyebrow">TRACKING</span>
                <h2>Order Progress</h2>
              </div>
            </div>

            {progressStep === 0 ? (
              <div className="od-pending-notice">
                <span>ⓘ</span>
                <p>
                  Your order is waiting for successful payment before processing
                  can begin.
                </p>
              </div>
            ) : (
              <div className="od-progress">
                {[
                  { label: "Confirmed", icon: "✓" },
                  { label: "Processing", icon: "⚙" },
                  { label: "Shipped", icon: "🚚" },
                  { label: "Delivered", icon: "⌂" },
                ].map((step, index) => {
                  const completed = index + 1 <= progressStep;

                  return (
                    <div className="od-progress-step" key={step.label}>
                      <div
                        className={`od-progress-circle ${
                          completed ? "completed" : ""
                        }`}
                      >
                        {completed ? "✓" : step.icon}
                      </div>

                      <span
                        className={`od-progress-label ${
                          completed ? "completed" : ""
                        }`}
                      >
                        {step.label}
                      </span>

                      {index < 3 && (
                        <div
                          className={`od-progress-line ${
                            index + 1 < progressStep ? "completed" : ""
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="od-progress-note">
              Tracking information will update when your order status changes.
            </p>
          </section>
        )}

        {/* Main layout */}
        <div className="od-main-grid">
          {/* Products */}
          <section className="od-card od-items-card">
            <div className="od-section-heading">
              <div>
                <span className="od-eyebrow">YOUR PURCHASE</span>
                <h2>Items in Your Order</h2>
              </div>

              <span className="od-item-count">
                {items.length} {items.length === 1 ? "product" : "products"}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="od-empty-items">
                <span>🛍️</span>
                <p>No items were found for this order.</p>
              </div>
            ) : (
              <div className="od-item-list">
                {items.map((item) => {
                  const imageUrl =
                    productImages[item.product_id] ||
                    item.image_url ||
                    null;

                  const quantity = Number(item.quantity) || 0;
                  const price = Number(item.unit_price) || 0;
                  const lineTotal =
                    item.line_total !== undefined &&
                    item.line_total !== null
                      ? Number(item.line_total)
                      : price * quantity;

                  return (
                    <div className="od-product" key={item.id}>
                      <div className="od-product-image">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.product_name || "StyleHub product"}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                              event.currentTarget.nextElementSibling.style.display =
                                "flex";
                            }}
                          />
                        ) : null}

                        <div
                          className="od-image-placeholder"
                          style={{
                            display: imageUrl ? "none" : "flex",
                          }}
                        >
                          👕
                        </div>
                      </div>

                      <div className="od-product-details">
                        <h3>{item.product_name || "Fashion Product"}</h3>
                        <p className="od-product-meta">
                          Product ID: {item.product_id ?? "N/A"}
                        </p>
                        <p className="od-product-quantity">
                          Quantity: <strong>{quantity}</strong>
                        </p>
                        <p className="od-product-unit-price">
                          {formatPrice(price)} each
                        </p>
                      </div>

                      <div className="od-product-total">
                        <span>Item total</span>
                        <strong>{formatPrice(lineTotal)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Summary */}
          <aside className="od-card od-summary-card">
            <div className="od-section-heading">
              <div>
                <span className="od-eyebrow">PAYMENT</span>
                <h2>Order Summary</h2>
              </div>
            </div>

            <div className="od-summary-row">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <div className="od-summary-row">
              <span>Shipping</span>
              <strong className="od-free-shipping">FREE</strong>
            </div>

            <div className="od-summary-row">
              <span>Discount</span>
              <strong>{formatPrice(0)}</strong>
            </div>

            <div className="od-summary-divider"></div>

            <div className="od-summary-total">
              <span>Total Amount</span>
              <strong>{formatPrice(total)}</strong>
            </div>

            <div className="od-payment-info">
              <span className="od-payment-icon">🔒</span>
              <div>
                <strong>Secure Checkout</strong>
                <p>
                  Payment is processed securely through our payment provider.
                </p>
              </div>
            </div>

            <div className="od-summary-status">
              <span>Current Status</span>
              <strong>{getStatusLabel(order.status)}</strong>
            </div>
          </aside>
        </div>

        {/* Support */}
        <section className="od-support-card">
          <div className="od-support-icon">💬</div>

          <div className="od-support-content">
            <h3>Need help with your order?</h3>
            <p>
              Keep your order number handy when contacting the StyleHub team.
            </p>
          </div>

          <a
            className="od-support-button"
            href="mailto:support@stylehub.com"
          >
            Contact Support
          </a>
        </section>

        {/* Bottom actions */}
        <div className="od-bottom-actions">
          <Link to="/orders" className="od-secondary-button">
            View All Orders
          </Link>

          <Link to="/products" className="od-primary-button">
            Continue Shopping →
          </Link>
        </div>

        <p className="od-footer-note">
          Thank you for choosing <strong>StyleHub</strong> ♡
        </p>
      </div>
    </div>
  );
}

export default OrderDetails;