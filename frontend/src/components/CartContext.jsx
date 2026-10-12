import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { Link, useLocation } from "react-router-dom";

const CartContext = createContext();

const API_URL = "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("stylehub_token");
}

function normalizeCartItem(item) {
  return {
    ...item.product,
    quantity: item.quantity,
  };
}

export function CartProvider({ children }) {
  const location = useLocation();

  const [cartItems, setCartItems] = useState([]);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [cartError, setCartError] = useState("");

  // Load the logged-in user's cart from the backend.
  async function loadCart() {
    const token = getToken();

    if (!token) {
      setCartItems([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/cart/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("stylehub_token");
        setCartItems([]);
        window.dispatchEvent(new Event("stylehub-auth-change"));
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load your shopping cart.");
      }

      const data = await response.json();

      setCartItems(data.map(normalizeCartItem));
      setCartError("");
    } catch (error) {
      console.error("Load cart error:", error);
      setCartError("Unable to load your cart. Please try again.");
    }
  }

  // Load the cart when the application starts and when login status changes.
  useEffect(() => {
    localStorage.removeItem("stylehub_cart");

    loadCart();

    function handleAuthChange() {
      loadCart();
    }

    window.addEventListener(
      "stylehub-auth-change",
      handleAuthChange
    );

    return () => {
      window.removeEventListener(
        "stylehub-auth-change",
        handleAuthChange
      );
    };
  }, []);

  // Add a product to the logged-in user's backend cart.
  async function addToCart(product) {
    const token = getToken();

    if (!token) {
      setShowAuthPrompt(true);
      return false;
    }

    if (product.stock <= 0) {
      setCartError("This product is out of stock.");
      return false;
    }

    setCartError("");

    try {
      const response = await fetch(`${API_URL}/cart/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("stylehub_token");
        setCartItems([]);
        window.dispatchEvent(new Event("stylehub-auth-change"));
        setCartError("Your session has expired. Please log in again.");
        return false;
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to add this product to your cart."
        );
      }

      const updatedItem = normalizeCartItem(data);

      setCartItems((currentItems) => {
        const exists = currentItems.some(
          (item) => item.id === updatedItem.id
        );

        if (exists) {
          return currentItems.map((item) =>
            item.id === updatedItem.id ? updatedItem : item
          );
        }

        return [...currentItems, updatedItem];
      });

      return true;
    } catch (error) {
      setCartError(error.message);
      return false;
    }
  }

  // Remove a product from the current user's cart.
  async function removeFromCart(productId) {
    const token = getToken();

    if (!token) {
      setCartItems([]);
      return false;
    }

    setCartError("");

    try {
      const response = await fetch(
        `${API_URL}/cart/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("stylehub_token");
        setCartItems([]);
        window.dispatchEvent(new Event("stylehub-auth-change"));
        return false;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to remove this product."
        );
      }

      setCartItems((items) =>
        items.filter((item) => item.id !== productId)
      );

      return true;
    } catch (error) {
      setCartError(error.message);
      return false;
    }
  }

  // Update quantity in the backend.
  async function updateQuantity(productId, quantity) {
    const token = getToken();

    if (!token || quantity < 1) {
      return false;
    }

    setCartError("");

    try {
      const response = await fetch(
        `${API_URL}/cart/${productId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("stylehub_token");
        setCartItems([]);
        window.dispatchEvent(new Event("stylehub-auth-change"));
        return false;
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to update the quantity."
        );
      }

      const updatedItem = normalizeCartItem(data);

      setCartItems((items) =>
        items.map((item) =>
          item.id === productId ? updatedItem : item
        )
      );

      return true;
    } catch (error) {
      setCartError(error.message);
      return false;
    }
  }

  // Clear only the logged-in user's cart.
  async function clearCart() {
    const token = getToken();

    if (!token) {
      setCartItems([]);
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/cart/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("stylehub_token");
        setCartItems([]);
        window.dispatchEvent(new Event("stylehub-auth-change"));
        return false;
      }

      if (!response.ok) {
        throw new Error("Unable to clear your cart.");
      }

      setCartItems([]);
      setCartError("");

      return true;
    } catch (error) {
      setCartError(error.message);
      return false;
    }
  }

  function closeAuthPrompt() {
    setShowAuthPrompt(false);
  }

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        cartError,
        loadCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}

      {showAuthPrompt && (
        <div
          className="auth-modal-overlay"
          onClick={closeAuthPrompt}
        >
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="auth-modal-close"
              type="button"
              onClick={closeAuthPrompt}
              aria-label="Close"
            >
              ×
            </button>

            <p className="eyebrow">WELCOME TO STYLEHUB</p>

            <h2 id="auth-modal-title">
              Join Our Style Community
            </h2>

            <p>
              Please log in or create an account before adding
              products to your shopping cart.
            </p>

            <div className="auth-modal-actions">
              <Link
                to="/login"
                state={{
                  from: location.pathname + location.search,
                }}
                className="auth-modal-login"
                onClick={closeAuthPrompt}
              >
                Login
              </Link>

              <Link
                to="/register"
                state={{
                  from: location.pathname + location.search,
                }}
                className="auth-modal-register"
                onClick={closeAuthPrompt}
              >
                Register
              </Link>
            </div>

            <button
              type="button"
              className="auth-modal-cancel"
              onClick={closeAuthPrompt}
            >
              Continue Browsing
            </button>
          </section>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}