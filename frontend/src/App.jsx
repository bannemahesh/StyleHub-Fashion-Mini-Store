import { useEffect } from "react";
import "./pages/Orders.css";

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { CartProvider } from "./components/CartContext";

import Home from "./pages/Home";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import OrderDetails from "./OrderDetails";

import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";

import "./App.css";


function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}


function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ScrollToTop />

        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/products" element={<Products />} />

          <Route path="/categories" element={<Categories />} />

          <Route
            path="/products/:id"
            element={<ProductDetails />}
          />

          <Route path="/cart" element={<Cart />} />

          <Route path="/register" element={<Register />} />

          <Route path="/login" element={<Login />} />

          <Route path="/orders" element={<Orders />} />

          <Route path="/orders/:orderId" element={<OrderDetails />} />

          <Route
            path="/payment-success"
            element={<PaymentSuccess />}
          />

          <Route
            path="/payment-cancelled"
            element={<PaymentCancelled />}
          />

          <Route
            path="*"
            element={
              <main className="page-container not-found">
                <h1>Page not found</h1>
                <p>
                  The page you're looking for doesn't exist.
                </p>
              </main>
            }
          />
        </Routes>

        <Footer />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;