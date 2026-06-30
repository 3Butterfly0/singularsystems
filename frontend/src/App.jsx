import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { PageShell } from "./components/PageShell";
import ErrorBoundary from "./components/ErrorBoundary";
import ChatBot from "./components/chat/ChatBot";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Builder from "./pages/Builder";
import SummaryPage from "./pages/SummaryPage";
import Prebuilts from "./pages/Prebuilts";
import About from "./pages/About";
import ProductPage from "./pages/ProductPage";
import Login from "./pages/Login";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import "./App.css";

import { useEffect, useState } from "react";
import useAuthStore from "./store/useAuthStore";
import useCartStore from "./store/useCartStore";
import AuthModal from "./components/AuthModal";

function App() {
  const { fetchUser, logout, isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      if (localStorage.getItem("access_token")) {
        const success = await fetchUser();
        if (!success) {
          logout();
          setShowAuthModal(true);
        }
      } else {
        setShowAuthModal(true);
      }
      fetchCart();
      setInitialCheckDone(true);
    };
    initialize();
  }, [fetchUser, logout, fetchCart]);

  return (
    <Router>
      <ErrorBoundary>
        <AuthModal
          isOpen={showAuthModal && !isAuthenticated}
          onClose={() => setShowAuthModal(false)}
        />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontFamily: "system-ui, sans-serif",
              fontSize: "14px",
            },
          }}
        />
        <Routes>
          {/* Aurora UI pages — each manages its own PageShell (header + footer) */}
          <Route path="/" element={<Home />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/prebuilts" element={<Prebuilts />} />
          <Route path="/about" element={<About />} />
          <Route path="/product/:id" element={<ProductPage />} />
          {/* Existing pages — wrapped with aurora PageShell for consistent nav/footer */}
          <Route
            path="/login"
            element={
              <PageShell>
                <Login />
              </PageShell>
            }
          />
          <Route
            path="/cart"
            element={
              <PageShell>
                <Cart />
              </PageShell>
            }
          />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
        {/* Floating chatbot — rendered outside routes so it persists across navigation */}
        <ChatBot />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
