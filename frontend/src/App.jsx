import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Builder from './pages/Builder';
import SummaryPage from './pages/SummaryPage';
import Prebuilts from './pages/Prebuilts';
import About from './pages/About';
import ProductPage from './pages/ProductPage';
import Login from './pages/Login';
import Cart from './pages/Cart';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/prebuilts" element={<Prebuilts />} />
          <Route path="/about" element={<About />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/parts" element={<div>Components Discovery (Coming Soon)</div>} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

