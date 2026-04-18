// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

// Import our newly extracted components
import LiveOverview from '../components/admin/LiveOverview';
import InventoryManager from '../components/admin/InventoryManager';
import ActiveOrders from '../components/admin/ActiveOrders';
import StoreSettings from '../components/admin/StoreSettings';
import StaffManagement from '../components/admin/StaffManagement';
import Analytics from '../components/admin/Analytics';
import PastOrders from '../components/admin/PastOrders';
import NotificationBell from '../components/admin/NotificationBell';


const AdminDashboard = () => {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active-orders');
  const [showNotifications, setShowNotifications] = useState(false);

  // --- SHARED DATA (Needed by multiple tabs or the notification bell) ---
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);

  // Security Check
  useEffect(() => {
    if (role !== 'admin') navigate('/');
  }, [role, navigate]);

  // Fetch Orders (For ActiveOrders tab AND Bell Alerts)
  useEffect(() => {
    const fetchActiveOrders = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders/active`);
        if (res.ok) setOrders(await res.json());
      } catch (err) { console.error(err); }
    };
    if (role === 'admin') {
      fetchActiveOrders();
      const interval = setInterval(fetchActiveOrders, 15000);
      return () => clearInterval(interval);
    }
  }, [role]);

  // Fetch Inventory (For Inventory tab AND Bell Alerts)
  const fetchInventory = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products?size=500`);
      if (res.ok) {
        const data = await res.json();
        setInventory(data.content ? data.content : data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (role === 'admin') fetchInventory();
  }, [role]);

  // --- NOTIFICATION BELL LOGIC ---
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const removeAlert = (id) => setDismissedAlerts(prev => new Set(prev).add(id));

  const allAlerts = [
    ...(orders.filter(o => o.status === 'PENDING').length > 0 ? [{ id: 'p1', type: 'order', msg: 'New orders waiting to be packed!', time: 'Live' }] : []),
    ...inventory.filter(i => i.stock === 0).map(item => ({ id: `out-${item.id}`, type: 'danger', msg: `CRITICAL: ${item.name} is out of stock.`, time: 'Live' })),
    ...inventory.filter(i => i.stock > 0 && i.stock <= 5).map(item => ({ id: `low-${item.id}`, type: 'warning', msg: `Low Stock: Only ${item.stock} left of ${item.name}.`, time: 'Live' }))
  ];
  const alerts = allAlerts.filter(alert => !dismissedAlerts.has(alert.id));
const clearAllAlerts = () => {
    setDismissedAlerts(new Set([...dismissedAlerts, ...allAlerts.map(a => a.id)]));
  };
  if (role !== 'admin') return null;

  return (

    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-brand"><h2>Utensil<span>Admin</span></h2></div>
        <nav className="admin-nav">
          <div className="nav-section-title">Daily Operations</div>
          <button className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Live Overview</button>
          <button className={`admin-nav-btn ${activeTab === 'active-orders' ? 'active' : ''}`} onClick={() => setActiveTab('active-orders')}>📦 Active Orders</button>
          <button className={`admin-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>📋 Inventory & Stock</button>

          <div className="nav-section-title">Configuration</div>
          <button className={`admin-nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ Logistics Settings</button>


          <button className={`admin-nav-btn ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>🛵 Delivery Staff</button>
<div className="nav-section-title">Business Intelligence</div>

<button className={`admin-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>📈 Analytics & Trends</button>

<button className={`admin-nav-btn ${activeTab === 'past-orders' ? 'active' : ''}`} onClick={() => setActiveTab('past-orders')}>✅ Past Orders Log</button>
        </nav>
        <button className="admin-logout-btn" onClick={() => { logout(); navigate('/login'); }}>🚪 Logout</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        {/* TOPBAR (Contains the Bell) */}
        <header className="admin-topbar">
          <div className="topbar-search"><span className="icon">🔍</span><input type="text" placeholder="Quick search..." /></div>
          <div className="topbar-actions">
             {/* THE NEW MODULAR BELL COMPONENT */}
                         <NotificationBell
                           alerts={alerts}
                           removeAlert={removeAlert}
                           clearAllAlerts={clearAllAlerts}
                           setActiveTab={setActiveTab}
                         />
                         <div className="admin-profile-snippet">
                                       <div className="avatar">A</div>
                                       <span>Admin</span>
                                     </div>

          </div>

        </header>

        {/* COMPONENT ROUTER */}
        <div className="admin-content-area">
                  {activeTab === 'dashboard' && <LiveOverview />}
                  {activeTab === 'inventory' && <InventoryManager inventory={inventory} setInventory={setInventory} fetchInventory={fetchInventory} />}
                  {activeTab === 'active-orders' && <ActiveOrders orders={orders} setOrders={setOrders} />}
                  {activeTab === 'staff' && <StaffManagement />}
                  {activeTab === 'settings' && <StoreSettings />}
                  {activeTab === 'analytics' && <Analytics />}
                            {activeTab === 'past-orders' && <PastOrders />}
                </div>
      </main>
    </div>
  );
};

export default AdminDashboard;









