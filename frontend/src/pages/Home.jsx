import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../services/api";

function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((error) => console.error(error));
  }, []);

  const featuredProducts = products.slice(0, 4);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <main>
      <section className="hero" id="home">
        <div className="hero-content">
          <p className="eyebrow">YOUR STYLE, YOUR STORY</p>

          <h1>
            Wear Your
            <br />
            <span>Confidence.</span>
          </h1>

          <p className="hero-description">
            Discover fashion that feels like you. Explore
            timeless essentials and trending styles for every
            moment.
          </p>

          <Link to="/products" className="hero-button">
            Shop the Collection <span>→</span>
          </Link>

          <div className="hero-stats">
            <div>
              <strong>{products.length}+</strong>
              <span>Products</span>
            </div>

            <div>
              <strong>4</strong>
              <span>Categories</span>
            </div>
          </div>
        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85"
            alt="Fashion boutique"
          />

          <div className="image-label">
            <span>THE STYLE EDIT</span>
            <strong>Find your everyday look.</strong>
          </div>
        </div>
      </section>

      <section className="home-categories">
        <div className="section-heading">
          <div>
            <p className="eyebrow">EXPLORE YOUR STYLE</p>
            <h2>Shop by Category</h2>
          </div>

          <Link to="/categories" className="text-link">
            View all categories →
          </Link>
        </div>

        <div className="category-grid">
          <Link
            to="/categories?category=Men"
            className="category-card men-category"
          >
            <span>01</span>
            <strong>Men</strong>
            <small>Explore collection →</small>
          </Link>

          <Link
            to="/categories?category=Women"
            className="category-card women-category"
          >
            <span>02</span>
            <strong>Women</strong>
            <small>Explore collection →</small>
          </Link>

          <Link
            to="/categories?category=Footwear"
            className="category-card footwear-category"
          >
            <span>03</span>
            <strong>Footwear</strong>
            <small>Explore collection →</small>
          </Link>

          <Link
            to="/categories?category=Accessories"
            className="category-card accessories-category"
          >
            <span>04</span>
            <strong>Accessories</strong>
            <small>Explore collection →</small>
          </Link>
        </div>
      </section>

      <section className="featured-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CURATED FOR YOU</p>
            <h2>Featured Products</h2>
          </div>

          <Link to="/products" className="text-link">
            View all products →
          </Link>
        </div>

        {products.length === 0 ? (
          <p>Loading featured products...</p>
        ) : (
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <article className="product-card" key={product.id}>
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

                    <span className="stock available">
                      {product.stock > 0
                        ? "In Stock"
                        : "Out of Stock"}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="newsletter">
        <p className="eyebrow">STAY IN STYLE</p>

        <h2>Your next favourite look awaits.</h2>

        <p>
          Discover versatile fashion for everyday life and
          special occasions.
        </p>

        <Link to="/products" className="hero-button">
          Explore Products <span>→</span>
        </Link>
      </section>
    </main>
  );
}

export default Home;