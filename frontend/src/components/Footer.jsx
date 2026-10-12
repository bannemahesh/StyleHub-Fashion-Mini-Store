import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <Link className="logo" to="/">
        STYLE<span>HUB</span>
      </Link>

      <p>Fashion for every version of you.</p>

      <div className="footer-links">
        <Link to="/">Home</Link>
        <Link to="/products">Shop</Link>
        <Link to="/categories">Categories</Link>
      </div>

      <small>© 2026 StyleHub. All rights reserved.</small>
    </footer>
  );
}

export default Footer;