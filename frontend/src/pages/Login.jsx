import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(
    location.state?.email || ""
  );

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registered = location.state?.registered;

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Login failed. Please check your details."
        );
      }

      if (!data.access_token) {
        throw new Error("The server did not return an access token.");
      }

      localStorage.setItem("stylehub_token", data.access_token);

      window.dispatchEvent(new Event("stylehub-auth-change"));

      const destination = location.state?.from || "/";

      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          STYLE<span>HUB</span>
        </Link>

        <p className="eyebrow">WELCOME BACK</p>

        <h1>Login to StyleHub</h1>

        <p className="auth-description">
          Log in to continue shopping and discover your favourite styles.
        </p>

        {registered && (
          <div className="auth-success" role="status">
            Your account was created successfully. Please log in.
          </div>
        )}

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register">Register</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Back to StyleHub
        </Link>
      </section>
    </main>
  );
}

export default Login;