import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, User, LogOut, Menu } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Pre-Built PCs", path: "/prebuilts" },
    { name: "Custom Build", path: "/builder" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-50">
      <div className="mx-auto max-w-[1440px] flex items-center justify-between">
        {/* logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-[#9E00FF] p-2 rounded-lg group-hover:rotate-6 transition-transform">
            <div className="w-6 h-6 border-2 border-white rounded-sm" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black text-black tracking-tighter">
              SINGULAR
            </span>
            <span className="text-[10px] font-black text-[#9E00FF] tracking-[0.2em]">
              SYSTEMS
            </span>
          </div>
        </Link>
        {/* nav links */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-lg font-bold tracking-tight hover:text-[#9E00FF] transition-colors relative ${
                location.pathname === link.path
                  ? "text-[#9E00FF]"
                  : "text-gray-500"
              }`}
            >
              {link.name}
              {location.pathname === link.path && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#9E00FF]"
                />
              )}
            </Link>
          ))}
        </div>
        {/* actions */}
        <div className="flex items-center gap-6">
          <Link
            to="/cart"
            className="text-gray-500 hover:text-black transition-colors relative"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#9E00FF] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-5">
              <button className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center text-[#9E00FF] hover:bg-gray-100 transition-colors">
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-black px-6 py-2 rounded-md font-bold text-base hover:bg-gray-300 transition-all"
            >
              Login
            </Link>
          )}

          <button className="md:hidden p-2 text-black">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
