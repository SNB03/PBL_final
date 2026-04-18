// src/components/layout/MobileDrawer.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CategoryModal from '../ui/CategoryModal';

// 👉 Import the professional icons
import { FiHome, FiShoppingBag, FiPackage, FiSettings, FiTruck, FiUser, FiLogIn, FiLogOut } from 'react-icons/fi';
import { BiCategory } from 'react-icons/bi';

const MobileDrawer = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const handleCategoryClick = () => {
    setIsCategoryModalOpen(true);
    onClose();
  };

  return (
    <>
      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      <div className={`mobile-drawer ${isOpen ? 'open' : ''}`}>

        <div className="drawer-header">
          <span className="nav-brand">Utensil<span>Pro</span></span>
          <button className="btn-close-drawer" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-links">
          <Link to="/" className="drawer-item" onClick={onClose}>
            <FiHome style={{ fontSize: '1.2rem' }} /> Home
          </Link>

          <Link to="/shop" className="drawer-item" onClick={onClose}>
            <FiShoppingBag style={{ fontSize: '1.2rem' }} /> Shop All
          </Link>

          <button className="drawer-item" onClick={handleCategoryClick}>
            <BiCategory style={{ fontSize: '1.2rem' }} /> Categories
          </button>

          {user && (
            <Link to="/orders" className="drawer-item" onClick={onClose}>
              <FiPackage style={{ fontSize: '1.2rem' }} /> My Orders
            </Link>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />

          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="drawer-item" onClick={onClose}>
                  <FiSettings style={{ fontSize: '1.2rem' }} /> Admin Panel
                </Link>
              )}
              {user.role === 'DELIVERY' && (
                <Link to="/delivery" className="drawer-item" onClick={onClose}>
                  <FiTruck style={{ fontSize: '1.2rem' }} /> Rider App
                </Link>
              )}
              <Link to="/profile" className="drawer-item" onClick={onClose}>
                <FiUser style={{ fontSize: '1.2rem' }} /> My Profile
              </Link>
            </>
          ) : (
            <Link to="/login" className="drawer-item" onClick={onClose}>
              <FiLogIn style={{ fontSize: '1.2rem' }} /> Login / Register
            </Link>
          )}
        </div>

        {user && (
          <div className="drawer-footer">
            <button className="btn-drawer-logout" onClick={handleLogout}>
              <FiLogOut style={{ fontSize: '1.2rem', marginBottom: '-2px' }} /> Logout
            </button>
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </>
  );
};

export default MobileDrawer;