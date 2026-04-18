// src/pages/DeliveryDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DeliveryDashboard.css';

const DeliveryDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  const [riderId, setRiderId] = useState(null); // 👉 NEW: Store the actual Staff ID

  // Modal State
  const [verifyingOrder, setVerifyingOrder] = useState(null);
  const [otpInput, setOtpInput] = useState('');

  // Security Check
  useEffect(() => {
    if (!user || user.role !== 'DELIVERY') return navigate('/login');
    fetchMyTasks();
  }, [user, navigate]);

  const fetchMyTasks = async () => {
    try {
      // 👉 STEP 1: Fetch the Staff List to find our REAL Rider ID using the phone number
      const staffRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/config/staff`);
      const staffList = await staffRes.json();

      const myStaffProfile = staffList.find(staff => staff.phone === user.phone);

      if (!myStaffProfile) {
        console.error("Staff profile not found for this phone number.");
        setIsLoading(false);
        return;
      }

      // Save the real Rider ID so we can display it in the Header
      setRiderId(myStaffProfile.id);

      // 👉 STEP 2: Fetch Orders and filter using the REAL Rider ID
      const orderRes = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`);
      if (orderRes.ok) {
        const allOrders = await orderRes.json();

        const myAssignedOrders = allOrders.filter(o => {
          // Note the added 'return' keyword which was missing in your snippet!
          return o.assignedTo && o.assignedTo.startsWith(`D-0${myStaffProfile.id}`);
        });

        setOrders(myAssignedOrders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openGoogleMaps = (address) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
  };

  const handleVerifyDelivery = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${verifyingOrder.id}/verify-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: otpInput })
      });

      if (res.ok) {
        alert("✅ Order Delivered Successfully!");
        setVerifyingOrder(null);
        setOtpInput('');
        fetchMyTasks(); // Refresh the list to move it to Completed
      } else {
        const errData = await res.json();
        alert(`❌ ${errData.error || 'Invalid PIN'}`);
      }
    } catch (err) {
      alert("Server error connecting to verification system.");
    }
  };

  if (!user || user.role !== 'DELIVERY') return null;

  // Split orders for the tabs
  const activeTasks = orders.filter(o => o.status === 'OUT_FOR_DELIVERY');
  const completedTasks = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED');
  const displayOrders = activeTab === 'active' ? activeTasks : completedTasks;

  return (
    <div className="delivery-app-container">

      {/* HEADER */}
      <header className="delivery-header">
        <div>
          <h1>Rider Portal</h1>
          {/* 👉 Display the true Rider ID if we found it, otherwise fallback to User ID */}
          <p>ID: D-0{riderId || user.id} • {user.name}</p>
        </div>
        <button className="delivery-logout-btn" onClick={() => { logout(); navigate('/login'); }}>
          Logout
        </button>
      </header>

      {/* TABS */}
      <div className="delivery-tabs">
        <button
          className={`delivery-tab-btn ${activeTab === 'active' ? 'active' : 'inactive'}`}
          onClick={() => setActiveTab('active')}
        >
          Active Tasks ({activeTasks.length})
        </button>
        <button
          className={`delivery-tab-btn ${activeTab === 'completed' ? 'active' : 'inactive'}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({completedTasks.length})
        </button>
      </div>

      {/* MAIN CONTENT */}
      <main className="delivery-main">
        {isLoading ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
        ) : displayOrders.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '80px', color: '#64748b' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '15px' }}>
              {activeTab === 'active' ? '☕' : '🛵'}
            </span>
            <h3>{activeTab === 'active' ? 'No active tasks' : 'No deliveries completed yet'}</h3>
            <p>{activeTab === 'active' ? 'Wait at the store for the manager to assign your next delivery.' : 'Your completed deliveries will appear here.'}</p>
          </div>
        ) : (
          <div>
            {displayOrders.map(order => (
              <div key={order.id} className="task-card animate-slide-up">

                {/* STATUS BAR */}
                <div className={`task-status-bar ${activeTab === 'completed' ? 'status-completed' : order.paymentMethod === 'COD' ? 'status-cod' : 'status-prepaid'}`}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                    {activeTab === 'completed' ? '✅ DELIVERED' : order.paymentMethod === 'COD' ? `💵 COLLECT ₹${order.total.toLocaleString()}` : '💳 PRE-PAID (No Cash)'}
                  </span>
                </div>

                {/* TASK DETAILS */}
                <div className="task-body">
                  <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>Order #{order.id.substring(0, 8).toUpperCase()}</p>
                  <h3 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '1.4rem' }}>{order.customerName}</h3>

                  <div className="address-box">
                    <p style={{ margin: '0 0 10px 0', color: '#334155', lineHeight: '1.5' }}>{order.address}</p>
                    <button className="btn-map" onClick={() => openGoogleMaps(order.address)}>
                      🗺️ Open in Google Maps
                    </button>
                  </div>

                  <a href={`tel:${order.phone}`} className="btn-call">
                    📞 Call Customer ({order.phone})
                  </a>

                  {/* ONLY SHOW VERIFY BUTTON IF ACTIVE */}
                  {activeTab === 'active' && (
                    <button className="btn-verify" onClick={() => setVerifyingOrder(order)}>
                      Enter PIN to Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 🔐 OTP VERIFICATION MODAL */}
      {verifyingOrder && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-content animate-slide-up">
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', color: '#0f172a' }}>Verify Delivery</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.9rem' }}>Ask {verifyingOrder.customerName} for their 4-digit PIN.</p>

            <form onSubmit={handleVerifyDelivery}>
              <input
                type="text"
                maxLength="4"
                placeholder="0000"
                className="otp-input"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                autoFocus
                required
              />

              <button type="submit" className="btn-verify" style={{ marginBottom: '10px' }}>
                Verify & Complete
              </button>
              <button
                type="button"
                onClick={() => { setVerifyingOrder(null); setOtpInput(''); }}
                style={{ width: '100%', padding: '15px', backgroundColor: 'transparent', color: '#64748b', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeliveryDashboard;