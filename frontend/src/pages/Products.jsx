import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { getProducts } from "../services/api";
import { useCart } from "../components/CartContext";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [addingProduct, setAddingProduct] = useState(null);

  const { addToCart, cartError } = useCart();

  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || "All";

  useEffect(() => {
    let active = true;

    getProducts()
      .then((data) => {
        if (active) {
          setProducts(data);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to load products. Please try again.");
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
  }, []);

  const categories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  function handleCategoryChange(event) {
    const selectedCategory = event.target.value;

    if (selectedCategory === "All") {
      setSearchParams({});
    } else {
      setSearchParams({ category: selectedCategory });
    }

    setMessage("");
  }

  async function handleAddToCart(product) {
    setMessage("");
    setAddingProduct(product.id);

    try {
      const added = await addToCart(product);

      if (added) {
        setMessage(`${product.name} added to your cart!`);
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
      setAddingProduct(null);
    }
  }

  return (
    <main className="page-container products-page">
      <div className="page-heading">
        <p className="eyebrow">DISCOVER YOUR STYLE</p>

        <h1>Our Collection</h1>

        <p>Find your next favourite piece from StyleHub.</p>
      </div>

      <div className="product-controls">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setMessage("");
          }}
          aria-label="Search products"
        />

        <select
          value={category}
          onChange={handleCategoryChange}
          aria-label="Filter by category"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All Categories" : item}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <p className="cart-feedback" role="status">
          {message}

          {message.includes("added to your cart") && (
            <>
              {" "}
              <Link to="/cart">View Cart</Link>
            </>
          )}
        </p>
      )}

      <div className="results-heading">
        <span>{filteredProducts.length} products found</span>
      </div>

      {loading && (
        <p className="page-message">Loading products...</p>
      )}

      {!loading && error && (
        <p className="page-message error-message">{error}</p>
      )}

      {!loading && !error && filteredProducts.length === 0 && (
        <p className="page-message">
          No products found. Try another search or category.
        </p>
      )}

      {!loading && !error && (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <Link
                to={`/products/${product.id}`}
                className="product-card-link"
              >
                <div className="product-image">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="no-image">
                      Image unavailable
                    </div>
                  )}

                  <span className="product-category">
                    {product.category}
                  </span>
                </div>

                <div className="product-info">
                  <h3>{product.name}</h3>

                  <p className="product-description">
                    {product.description}
                  </p>

                  <div className="product-bottom">
                    <strong>{formatPrice(product.price)}</strong>

                    <span
                      className={
                        product.stock > 0
                          ? "stock available"
                          : "stock unavailable"
                      }
                    >
                      {product.stock > 0
                        ? "In Stock"
                        : "Out of Stock"}
                    </span>
                  </div>

                  <span className="view-details">
                    View Details →
                  </span>
                </div>
              </Link>

              <div className="product-card-actions">
                <button
                  type="button"
                  className="add-to-cart-button"
                  disabled={
                    product.stock <= 0 ||
                    addingProduct === product.id
                  }
                  onClick={() => handleAddToCart(product)}
                >
                  {product.stock <= 0
                    ? "Out of Stock"
                    : addingProduct === product.id
                      ? "Adding..."
                      : "Add to Cart"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default Products;