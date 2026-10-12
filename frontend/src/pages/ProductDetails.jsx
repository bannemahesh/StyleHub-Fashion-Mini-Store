import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getProductById } from "../services/api";
import { useCart } from "../components/CartContext";

function ProductDetails() {
  const { id } = useParams();

  const { addToCart, cartError } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setProduct(null);
    setMessage("");

    getProductById(id)
      .then((data) => {
        if (active) {
          setProduct(data);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to load this product. Please try again.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  async function handleAddToCart() {
    if (!product || product.stock <= 0 || addingToCart) {
      return;
    }

    setMessage("");
    setAddingToCart(true);

    try {
      const added = await addToCart(product);

      if (added) {
        setMessage("Product added to your cart successfully!");
      } else if (product.stock <= 0) {
        setMessage("This product is out of stock.");
      } else if (localStorage.getItem("stylehub_token")) {
        setMessage(
          cartError || "Unable to add this product. Please try again."
        );
      }
    } catch {
      setMessage("Unable to add this product. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <main className="page-container product-details-page">
        <div className="product-loading">
          <div className="loading-indicator"></div>
          <p>Loading product details...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="page-container product-details-page">
        <div className="product-error">
          <p className="eyebrow">STYLEHUB COLLECTION</p>
          <h1>Product unavailable</h1>
          <p>{error || "This product does not exist."}</p>

          <Link to="/products" className="hero-button">
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container product-details-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/products">Shop</Link>
        <span>/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      <section className="product-details">
        <div className="product-details-image">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.nextElementSibling?.classList.remove(
                  "image-fallback-hidden"
                );
              }}
            />
          ) : null}

          <div
            className={`product-image-fallback ${
              product.image_url ? "image-fallback-hidden" : ""
            }`}
          >
            <span>STYLEHUB</span>
            <p>Product image unavailable</p>
          </div>

          <span className="details-image-category">
            {product.category}
          </span>
        </div>

        <div className="product-details-info">
          <p className="eyebrow">DISCOVER YOUR STYLE</p>

          <h1>{product.name}</h1>

          <p className="details-price">
            {formatPrice(product.price)}
          </p>

          <p className="details-tax-note">
            Inclusive of all applicable taxes.
          </p>

          <div className="details-divider"></div>

          <div className="details-description-section">
            <h2>Product Description</h2>

            <p className="details-description">
              {product.description}
            </p>
          </div>

          <div className="details-stock-panel">
            <span
              className={
                product.stock > 0
                  ? "details-stock-indicator in-stock"
                  : "details-stock-indicator out-of-stock"
              }
            >
              <span className="stock-dot"></span>

              {product.stock > 0
                ? "Available"
                : "Currently unavailable"}
            </span>

            {product.stock > 0 && (
              <span className="details-stock-count">
                {product.stock} units available
              </span>
            )}
          </div>

          <button
            type="button"
            className="hero-button details-cart-button"
            disabled={product.stock <= 0 || addingToCart}
            onClick={handleAddToCart}
          >
            {product.stock <= 0
              ? "Out of Stock"
              : addingToCart
                ? "Adding to Cart..."
                : "Add to Cart"}
          </button>

          {message && (
            <div
              className={`details-cart-message ${
                message.includes("successfully")
                  ? "details-cart-success"
                  : "details-cart-error"
              }`}
              role="status"
            >
              <span>{message}</span>

              {message.includes("successfully") && (
                <Link to="/cart">View Cart →</Link>
              )}
            </div>
          )}

          <div className="details-benefits">
            <div className="details-benefit">
              <span className="benefit-icon">✓</span>

              <div>
                <strong>Quality Collection</strong>
                <p>Explore styles selected for you.</p>
              </div>
            </div>

            <div className="details-benefit">
              <span className="benefit-icon">♡</span>

              <div>
                <strong>Your Personal Cart</strong>
                <p>Your cart is saved to your account.</p>
              </div>
            </div>
          </div>

          <p className="details-note">
            Product information is provided by the StyleHub store.
          </p>
        </div>
      </section>

      <div className="back-to-products">
        <Link to="/products">← Continue Shopping</Link>
      </div>
    </main>
  );
}

export default ProductDetails;