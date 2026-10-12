import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProducts } from "../services/api";

const categoryDetails = [
  {
    name: "Men",
    number: "01",
    description: "Everyday essentials and modern menswear.",
    className: "men-category",
  },
  {
    name: "Women",
    number: "02",
    description: "Discover contemporary styles for every occasion.",
    className: "women-category",
  },
  {
    name: "Footwear",
    number: "03",
    description: "Complete your look with the right pair.",
    className: "footwear-category",
  },
  {
    name: "Accessories",
    number: "04",
    description: "The finishing touches that define your style.",
    className: "accessories-category",
  },
];

function Categories() {
  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((error) => console.error(error));
  }, []);

  const selectedCategory = searchParams.get("category");

  return (
    <main className="page-container categories-page">
      <div className="page-heading">
        <p className="eyebrow">EXPLORE YOUR STYLE</p>
        <h1>Shop by Category</h1>
        <p>Explore collections made for your individual style.</p>
      </div>

      {selectedCategory && (
        <p className="selected-category">
          Selected category: <strong>{selectedCategory}</strong>
        </p>
      )}

      <div className="category-grid category-page-grid">
        {categoryDetails.map((category) => {
          const productCount = products.filter(
            (product) => product.category === category.name
          ).length;

          return (
            <Link
              key={category.name}
              to={`/products?category=${encodeURIComponent(
                category.name
              )}`}
              className={`category-card ${category.className}`}
            >
              <span>{category.number}</span>

              <strong>{category.name}</strong>

              <small>{category.description}</small>

              <small>{productCount} products →</small>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

export default Categories;