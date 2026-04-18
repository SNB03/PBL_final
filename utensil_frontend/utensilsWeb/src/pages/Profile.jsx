// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OrderDetailsModal from '../components/profile/OrderDetailsModal';
import './Profile.css';
import Navbar from '../components/layout/Navbar'

const Profile = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  const [formData, setFormData] = useState({ name: '', phone: '', address: '', email: '', password: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // 👉 NEW: Viewing Details State
  const [viewingOrder, setViewingOrder] = useState(null);

  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    if (!user) navigate('/login');
    else setFormData({ name: user.name || '', phone: user.phone || '', address: user.address || '', email: user.email || '', password: '' });
  }, [user, navigate]);

  useEffect(() => {
    const fetchMyOrders = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/customer/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.sort((a, b) => b.id - a.id));
        }
      } catch (err) { console.error("Failed to fetch orders."); }
      finally { setIsLoading(false); }
    };
    fetchMyOrders();
  }, [user]);

  if (!user) return null;

  const activeOrders = orders.filter(o => ['PENDING', 'PACKED', 'OUT_FOR_DELIVERY'].includes(o.status));
  const pastOrders = orders.filter(o => ['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(o.status));

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = { ...formData };
    if (!payload.password) delete payload.password;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        login(updatedUser);
        setFormData(prev => ({ ...prev, password: '' }));
        showToast("Profile updated successfully!");
      } else showToast("Failed to update profile.", "error");
    } catch (err) { showToast("Server error.", "error"); }
    finally { setIsSaving(false); }
  };

  const confirmCancelOrder = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${cancellingOrder.id}/status?status=CANCELLED`, { method: 'PATCH' });
      if (res.ok) {
        setOrders(orders.map(o => o.id === cancellingOrder.id ? { ...o, status: 'CANCELLED' } : o));
        showToast("Order cancelled.");
        if (viewingOrder && viewingOrder.id === cancellingOrder.id) setViewingOrder(null);
      }
    } catch (err) { showToast("Failed to cancel order.", "error"); }
    finally { setCancellingOrder(null); }
  };

  const confirmDeleteOrder = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${deletingOrder.id}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== deletingOrder.id));
        showToast("Order deleted from history.");
        if (viewingOrder && viewingOrder.id === deletingOrder.id) setViewingOrder(null);
      }
    } catch (err) { showToast("Failed to delete order.", "error"); }
    finally { setDeletingOrder(null); }
  };

  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Invoice - ${order.id}</title>
      <style>body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; } .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; } .items { width: 100%; border-collapse: collapse; margin-top: 30px; } .items th, .items td { border-bottom: 1px solid #eee; padding: 12px; text-align: left; } .total { text-align: right; font-size: 1.5rem; font-weight: bold; margin-top: 20px; }</style>
      </head><body>
      <div class="header"><div><h1>UtensilPro</h1><p>Official Tax Invoice</p></div><div style="text-align: right;"><p><strong>Order ID:</strong> ${order.id}</p><p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p></div></div>
      <h3>Billed To: ${order.customerName}</h3><p>${order.address || 'Store Pickup'}</p>
      <table class="items"><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      ${order.itemsList.map(item => `<tr><td>${item.name}</td><td>${item.qty}</td><td>₹${item.price}</td><td>₹${item.price * item.qty}</td></tr>`).join('')}
      </table><div class="total">Grand Total: ₹${order.total}</div>
      </body></html>
    `);
    printWindow.document.close(); printWindow.print();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="prof-badge" style={{ background: '#fef3c7', color: '#d97706' }}>⏳ Processing</span>;
      case 'PACKED': return <span className="prof-badge" style={{ background: '#e0e7ff', color: '#4f46e5' }}>📦 Packed</span>;
      case 'OUT_FOR_DELIVERY': return <span className="prof-badge" style={{ background: '#dbeafe', color: '#2563eb' }}>🚚 Out for Delivery</span>;
      case 'COMPLETED':
      case 'DELIVERED': return <span className="prof-badge" style={{ background: '#d1fae5', color: '#059669' }}>✅ Delivered</span>;
      case 'CANCELLED': return <span className="prof-badge" style={{ background: '#fee2e2', color: '#ef4444' }}>❌ Cancelled</span>;
      default: return <span className="prof-badge">{status}</span>;
    }
  };

  return (

    <div className="profile-page-wrapper">
  <Navbar/>

      <div className="profile-container animate-fade-in">
        <div className="profile-dashboard">

          <aside className="profile-sidebar">
            <div className="sidebar-user-info">
              <div className="sidebar-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </div>
            <div className="sidebar-nav">
              <button className={`sidebar-nav-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
                Active Orders <span className="nav-badge">{activeOrders.length}</span>
              </button>
              <button className={`sidebar-nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                Order History <span className="nav-badge">{pastOrders.length}</span>
              </button>
              <button className={`sidebar-nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                Account Settings
              </button>
            </div>
            <button className="btn-sidebar-logout" onClick={handleLogout}>Sign Out</button>
          </aside>

          <main className="profile-main-content">

            {activeTab === 'settings' && (
              <div className="animate-slide-up">
                <div className="section-header">
                  <h1>Account Settings</h1>
                  <p>Update your personal details, email, and password.</p>
                </div>
                <form className="settings-form-grid" onSubmit={handleUpdateProfile}>
                  <div className="form-row">
                    <div className="form-group"><label>Full Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                    <div className="form-group"><label>Phone Number</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required /></div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>Default Delivery Address</label>
                    <textarea rows="3" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <h3 className="password-section-header">Login Credentials</h3>
                  <div className="form-row">
                    <div className="form-group"><label>Email Address</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
                    <div className="form-group"><label>New Password (Optional)</label><input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Leave blank to keep current" /></div>
                  </div>
                  <button type="submit" className="btn-save-profile" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Profile'}</button>
                </form>
              </div>
            )}

            {activeTab !== 'settings' && (
              <div className="animate-slide-up">
                <div className="section-header">
                  <h1>{activeTab === 'active' ? 'Active Orders' : 'Order History'}</h1>
                  <p>{activeTab === 'active' ? 'Track the live status of your deliveries.' : 'Review past purchases and print invoices.'}</p>
                </div>

                {isLoading ? <p>Loading orders...</p> : (activeTab === 'active' ? activeOrders : pastOrders).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #cbd5e1', borderRadius: '16px', background: 'white' }}>
                    <span style={{ fontSize: '4rem', display: 'block', marginBottom: '15px' }}>{activeTab === 'active' ? '🚚' : '🕰️'}</span>
                    <h3>Nothing here yet.</h3>
                    <Link to="/shop" style={{ display: 'inline-block', marginTop: '15px', background: '#0f172a', color: 'white', padding: '12px 25px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Browse Store</Link>
                  </div>
                ) : (
                  (activeTab === 'active' ? activeOrders : pastOrders).map(order => (

                    /* 👉 COMPACT ORDER CARD (Clicking "View Details" opens the modal) */
                    <div key={order.id} className="prof-order-card">
                      <div className="prof-order-header" style={{ border: 'none', padding: 0, margin: 0 }}>
                        <div>
                          <span className="prof-order-id">Order #{order.id.toString().substring(0, 8).toUpperCase()}</span>
                          <p className="prof-order-meta">{new Date(order.orderDate).toLocaleDateString()} • {order.itemsList.length} Items</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {getStatusBadge(order.status)}
                          <div className="prof-order-total">₹{order.total.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="prof-order-actions" style={{ marginTop: '20px' }}>
                        <button className="btn-save-profile" style={{ padding: '8px 20px', margin: 0, fontSize: '0.95rem' }} onClick={() => setViewingOrder(order)}>
                          👁️ View Details
                        </button>
                        {['COMPLETED', 'DELIVERED'].includes(order.status) && (
                          <button className="prof-btn-outline" onClick={() => handlePrintInvoice(order)}>🖨️ Invoice</button>
                        )}
                        {order.status === 'PENDING' && (
                          <button className="prof-btn-outline prof-btn-danger" onClick={() => setCancellingOrder(order)}>✕ Cancel</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </main>
        </div>
      </div>
{/* ================= DETAILED ORDER MODAL ================= */}
     {/* ================= SEPARATE UI: ORDER DETAILS MODAL ================= */}
           {viewingOrder && (
             <OrderDetailsModal
               order={viewingOrder}
               onClose={() => setViewingOrder(null)}
               onCancel={(order) => { setViewingOrder(null); setCancellingOrder(order); }}
               onDelete={(order) => { setViewingOrder(null); setDeletingOrder(order); }}
               onPrint={handlePrintInvoice}
             />
           )}
      {/* Warning Modals */}
      {cancellingOrder && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setCancellingOrder(null)}>
          <div className="modal-content-mini animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="warning-icon">✕</div>
            <h2 style={{ color: '#0f172a', fontSize: '1.5rem', marginBottom: '10px' }}>Cancel Order?</h2>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setCancellingOrder(null)}>Keep Order</button>
              <button className="btn-danger" onClick={confirmCancelOrder}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deletingOrder && (
        <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={() => setDeletingOrder(null)}>
          <div className="modal-content-mini animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="warning-icon">🗑️</div>
            <h2 style={{ color: '#0f172a', fontSize: '1.5rem', marginBottom: '10px' }}>Delete History?</h2>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeletingOrder(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDeleteOrder}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast.visible && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '15px 25px', borderRadius: '12px', fontWeight: 'bold', zIndex: 10000, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s ease-out' }}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.message}
        </div>
      )}
    </div>
  );
};

export default Profile;