// src/components/admin/AdminSidebar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = ({ activeTab, setActiveTab, isMobileOpen, closeSidebar, pendingOrdersCount = 0 }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleNavClick = (id) => {
    setActiveTab(id);
    closeSidebar(); // Auto-close drawer on mobile after clicking
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Dark overlay for mobile */}
      <div
        className={`admin-sidebar-overlay ${isMobileOpen ? 'mobile-open' : ''}`}
        onClick={closeSidebar}
      />

      {/* The Sidebar */}
      <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>

        {/* BRAND & BADGE */}
        <div className="admin-brand">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              <h2>Utensil<span>Pro</span></h2>
            </Link>

            {/* Mobile Close Button (Hidden on Desktop via CSS) */}
            <button
              className="btn-close-sidebar"
              onClick={closeSidebar}
              style={{ position: 'absolute', right: '-10px', background: 'none', border: 'none', color: '#cbd5e1', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <span className="admin-badge">Admin Panel</span>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="admin-nav">

          <div className="nav-section-title">Daily Operations</div>
          <button
            className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <span>📊 Live Overview</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'active-orders' ? 'active' : ''}`}
            onClick={() => handleNavClick('active-orders')}
          >
            <span>📦 Active Orders</span>
            {/* Renders the red badge if there are pending orders */}
            {pendingOrdersCount > 0 && <span className="alert-count">{pendingOrdersCount}</span>}
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => handleNavClick('inventory')}
          >
            <span>📋 Inventory & Stock</span>
          </button>


          <div className="nav-section-title">Configuration</div>
          <button
            className={`admin-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            <span>⚙️ Logistics Settings</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => handleNavClick('staff')}
          >
            <span>🛵 Delivery Staff</span>
          </button>


          <div className="nav-section-title">Business Intelligence</div>
          <button
            className={`admin-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => handleNavClick('analytics')}
          >
            <span>📈 Analytics & Trends</span>
          </button>

          <button
            className={`admin-nav-btn ${activeTab === 'past-orders' ? 'active' : ''}`}
            onClick={() => handleNavClick('past-orders')}
          >
            <span>✅ Past Orders Log</span>
          </button>

        </nav>

        {/* BOTTOM LOGOUT */}
        <button className="admin-logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>
    </>
  );
};

export default AdminSidebar;