import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PageShell } from './components/PageShell';
import ErrorBoundary from './components/ErrorBoundary';
import ChatBot from './components/chat/ChatBot';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Builder from './pages/Builder';
import SummaryPage from './pages/SummaryPage';
import Prebuilts from './pages/Prebuilts';
import About from './pages/About';
import ProductPage from './pages/ProductPage';
import Login from './pages/Login';
import Cart from './pages/Cart';
import './App.css';

import { useEffect } from 'react';
import useAuthStore from './store/useAuthStore';
import useCartStore from './store/useCartStore';

function App() {
  const { fetchUser } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    if (localStorage.getItem('is_logged_in') === 'true') {
      fetchUser();
    }
    fetchCart();
  }, [fetchUser, fetchCart]);

  return (
    <Router>
      <ErrorBoundary>
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '14px',
            }
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
          <Route path="/login" element={<PageShell><Login /></PageShell>} />
          <Route path="/cart" element={<PageShell><Cart /></PageShell>} />
        </Routes>
        {/* Floating chatbot — rendered outside routes so it persists across navigation */}
        <ChatBot />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
