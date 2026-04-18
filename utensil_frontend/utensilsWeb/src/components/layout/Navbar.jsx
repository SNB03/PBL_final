// src/components/layout/Navbar.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import MobileDrawer from './MobileDrawer';
import './Navbar.css';
import CategoryModal from '../ui/CategoryModal';
import CartDrawer from '../CartDrawer';

// Icons
import { FiShoppingCart, FiMenu, FiUser } from 'react-icons/fi';
import { BiCategory } from 'react-icons/bi';

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
            <span style={{ fontSize: '1.5rem', marginRight: '5px' }}>🍳</span> Utensil<span>Pro</span>
          </Link>

          {/* 2. DESKTOP LINKS (Hidden on Mobile) */}
          <div className="nav-links-desktop">
            <Link to="/" className="nav-item">Home</Link>
            <Link to="/shop" className="nav-item">Shop</Link>

            <button
              className="nav-item"
              onClick={() => setIsCategoryModalOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <BiCategory style={{ fontSize: '1.1rem' }}/> Categories
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 10px', position: 'relative', display: 'flex', alignItems: 'center' }}
            >
              <FiShoppingCart style={{ fontSize: '1.4rem', color: '#0f172a' }} />
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </button>

            {/* Desktop Profile / Login Button */}
            {user ? (
              <Link to="/profile" className="btn-nav-login" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiUser style={{ fontSize: '1.1rem' }}/> {user.name.split(' ')[0]}
              </Link>
            ) : (
              <Link to="/login" className="btn-nav-login">Login</Link>
            )}

            {/* 👉 THE FIX: Removed inline 'display' styles so CSS can handle visibility */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsDrawerOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
            >
              <FiMenu style={{ fontSize: '1.5rem', color: '#0f172a' }} />
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