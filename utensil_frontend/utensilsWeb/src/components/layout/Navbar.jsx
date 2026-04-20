// src/components/layout/Navbar.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import MobileDrawer from './MobileDrawer';
import CategoryModal from '../ui/CategoryModal';
import CartDrawer from '../CartDrawer';
import './Navbar.css';

// Icons
import { FiShoppingCart, FiMenu, FiUser } from 'react-icons/fi';
import { BiCategory } from 'react-icons/bi';
import { FaUtensils } from 'react-icons/fa'; // 👉 NEW: Professional logo icon

const Navbar = () => {
  const { cartItems } = useCart();
  const { user } = useAuth();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const cartItemCount = cartItems.reduce((total, item) => total + item.qty, 0);

  return (
    <>
      <nav className="global-navbar">
        <div className="navbar-container">

          {/* 1. BRAND LOGO */}
          <Link to="/" className="nav-brand">
            <FaUtensils className="brand-icon" /> Utensil<span>Pro</span>
          </Link>

          {/* 2. DESKTOP LINKS (Hidden on Mobile) */}
          <div className="nav-links-desktop">
            <Link to="/" className="nav-item">Home</Link>
            <Link to="/shop" className="nav-item">Shop</Link>

            <button
              className="nav-item category-btn"
              onClick={() => setIsCategoryModalOpen(true)}
            >
              <BiCategory style={{ fontSize: '1.2rem' }}/> Categories
            </button>

            {/* My Orders link only visible if logged in */}
            {user && <Link to="/orders" className="nav-item">My Orders</Link>}

            {user?.role === 'ADMIN' && <Link to="/admin" className="nav-item">Admin</Link>}
            {user?.role === 'DELIVERY' && <Link to="/delivery" className="nav-item">Rider</Link>}
          </div>

          {/* 3. ACTIONS (Cart, Login, Hamburger) */}
          <div className="nav-actions">

            {/* Cart Button */}
            <button
              className="cart-icon-wrapper"
              onClick={() => setIsCartOpen(true)}
            >
              <FiShoppingCart className="cart-icon" />
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </button>

            {/* Desktop Profile / Login Button */}
            {user ? (
              <Link to="/profile" className="btn-nav-login login-flex">
                <FiUser style={{ fontSize: '1.1rem' }}/> {user.name.split(' ')[0]}
              </Link>
            ) : (
              <Link to="/login" className="btn-nav-login">Login</Link>
            )}

            {/* Hamburger Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsDrawerOpen(true)}
            >
              <FiMenu className="menu-icon" />
            </button>
          </div>

        </div>
      </nav>

      {/* 4. MODALS & DRAWERS */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
    </>
  );
};

export default Navbar;