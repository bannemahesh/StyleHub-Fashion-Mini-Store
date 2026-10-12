import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";

const API_URL = "http://127.0.0.1:8000";

function Navbar() {
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkLogin() {
      const token = localStorage.getItem("stylehub_token");

      if (!token) {
        if (active) {
          setIsLoggedIn(false);
          setCheckingAuth(false);
        }
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("stylehub_token");

          if (active) {
            setIsLoggedIn(false);
          }
        } else if (active) {
          setIsLoggedIn(true);
        }
      } catch {
        // Keep the saved token if the server is temporarily unavailable.
        if (active) {
          setIsLoggedIn(true);
        }
      } finally {
        if (active) {
          setCheckingAuth(false);
        }
      }
    }

    checkLogin();

    function handleAuthChange() {
      checkLogin();
    }

    window.addEventListener("stylehub-auth-change", handleAuthChange);

    return () => {
      active = false;
      window.removeEventListener(
        "stylehub-auth-change",
        handleAuthChange
      );
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("stylehub_token");

    setIsLoggedIn(false);

    window.dispatchEvent(new Event("stylehub-auth-change"));

    navigate("/");
  }

  return (
    <>
      <div className="announcement">
        NEW SEASON, NEW STYLE — DISCOVER YOUR LOOK
      </div>

      <header className="navbar">
        <Link to="/" className="logo">
          STYLE<span>HUB</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>

          <NavLink to="/products">Shop</NavLink>

          <NavLink to="/categories">Categories</NavLink>

          {!checkingAuth && !isLoggedIn && (
            <>
              <NavLink to="/login">Login</NavLink>

              <NavLink to="/register">Register</NavLink>
            </>
          )}

          {!checkingAuth && isLoggedIn && (
            <>
              <NavLink to="/orders">Orders</NavLink>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}
        </nav>

        <Link to="/cart" className="shop-button">
          Cart ({cartCount})
        </Link>
      </header>
    </>
  );
}

export default Navbar;