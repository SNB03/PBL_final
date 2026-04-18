// src/pages/TrackOrder.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';

import {
  FaClipboardList,
  FaBoxOpen,
  FaTruck,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimesCircle
} from 'react-icons/fa';

import './TrackOrder.css';

const TrackOrder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [productImages, setProductImages] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // 👉 NEW: Custom Modal States (Replacing Alerts and Toasts)
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchOrdersAndProducts = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/orders/customer/${user.id}`),
          fetch(`${import.meta.env.VITE_API_URL}/api/products?size=1000`)
        ]);

        if (productsRes.ok) {
          const pData = await productsRes.json();
          const productsArray = Array.isArray(pData) ? pData : (pData.content || []);

          const imageMap = {};
          productsArray.forEach(p => {
            if (p.img) imageMap[p.id] = p.img;
          });
          setProductImages(imageMap);
        }

        if (ordersRes.ok) {
          const oData = await ordersRes.json();
          oData.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
          setOrders(oData);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrdersAndProducts();
    window.scrollTo(0, 0);
  }, [user, navigate]);

  const getStepStatus = (orderStatus, stepIndex) => {
    const statusMap = {
      'PENDING': 1,
      'PLACED': 1,
      'PROCESSING': 2,
      'SHIPPED': 3,
      'DELIVERED': 4,
      'COMPLETED': 4
    };
    const currentStep = statusMap[orderStatus?.toUpperCase()] || 1;
    if (currentStep > stepIndex) return 'completed';
    if (currentStep === stepIndex) return 'active';
    return 'pending';
  };

  const getEstimatedDelivery = (dateString) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 5);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // 👉 NEW: This handles the actual cancellation after the user clicks "Yes" in the modal
  const confirmCancelOrder = async () => {
    if(!orderToCancel) return;
    setIsCancelling(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${orderToCancel.id}/status?status=CANCELLED`, {
        method: 'PATCH',
      });

      if (res.ok) {
        // Shorten the ID to the last 6 characters for a clean look
        const shortId = orderToCancel.id.slice(-6).toUpperCase();

        // Instantly remove it from the screen
        setOrders(orders.map(o => o.id === orderToCancel.id ? { ...o, status: 'CANCELLED' } : o));

        // Close the warning modal and open the success modal
        setOrderToCancel(null);
        setSuccessMessage(shortId);
      } else {
        alert("Failed to cancel order. It may have already been shipped.");
        setOrderToCancel(null);
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("Server error. Please check your connection.");
      setOrderToCancel(null);
    } finally {
      setIsCancelling(false);
    }
  };

  // Automatically hide cancelled orders
  const activeAndPastOrders = orders.filter(order => order.status?.toUpperCase() !== 'CANCELLED');

  if (isLoading) {
    return (
      <div className="orders-page-wrapper">
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <h2 style={{color: '#64748b'}}>Loading your orders...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-wrapper">
      <Navbar />

      <div className="orders-container animate-fade-in">
        <div className="orders-header">
          <h1>My Orders</h1>
          <p>Track your recent shipments and view your purchase history.</p>
        </div>

        {activeAndPastOrders.length === 0 ? (
          <div className="no-orders">
            <span style={{ fontSize: '3rem' }}>🛍️</span>
            <h3 style={{ margin: '15px 0 10px 0', color: '#0f172a' }}>No active orders.</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>Looks like you don't have any current or past purchases.</p>
            <Link to="/shop" className="btn-start-shopping">Start Shopping</Link>
          </div>
        ) : (
          activeAndPastOrders.map((order) => {
            const isDelivered = order.status?.toUpperCase() === 'DELIVERED' || order.status?.toUpperCase() === 'COMPLETED';
            const isCancellable = order.status?.toUpperCase() === 'PENDING' || order.status?.toUpperCase() === 'PLACED';
            const orderTotal = order.totalAmount || order.itemsList?.reduce((sum, item) => sum + (item.price * item.qty), 0) || 0;

            // 👉 Shorten the ugly MongoDB ID to 6 uppercase characters!
            const shortOrderId = order.id?.toString().slice(-6).toUpperCase();

            return (
              <div key={order.id} className="order-card">

                {/* HEADER INFO */}
                <div className="order-header-row">
                  <div className="order-meta">
                    <div>Order Placed</div>
                    <span>{new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="order-meta">
                    <div>Total Amount</div>
                    <span className="text-highlight">₹{orderTotal.toLocaleString()}</span>
                  </div>
                  <div className="order-meta">
                    <div>Order ID</div>
                    <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0f172a' }}>#{shortOrderId}</span>
                  </div>
                </div>

                {/* TRACKING PROGRESS */}
                <div className="order-tracking-section">
                  {!isDelivered && (
                    <p className="delivery-estimate">
                      Estimated Delivery: <span>{getEstimatedDelivery(order.orderDate)}</span>
                    </p>
                  )}
                  <div className="progress-track">
                    <div className={`step ${getStepStatus(order.status, 1)}`}>
                      <div className="step-icon"><FaClipboardList /></div>
                      <span className="step-label">Order<br/>Placed</span>
                    </div>
                    <div className={`step ${getStepStatus(order.status, 2)}`}>
                      <div className="step-icon"><FaBoxOpen /></div>
                      <span className="step-label">Processing</span>
                    </div>
                    <div className={`step ${getStepStatus(order.status, 3)}`}>
                      <div className="step-icon"><FaTruck /></div>
                      <span className="step-label">Shipped</span>
                    </div>
                    <div className={`step ${getStepStatus(order.status, 4)}`}>
                      <div className="step-icon"><FaCheckCircle /></div>
                      <span className="step-label">Delivered</span>
                    </div>
                  </div>
                </div>

                {/* ITEMS IN THIS ORDER */}
                <div className="order-items-section">
                  <div className="order-items-header">
                    <h4>Items in your package</h4>

                    {isCancellable && (
                      <button onClick={() => setOrderToCancel(order)} className="btn-cancel-order">
                        Cancel Order
                      </button>
                    )}
                  </div>

                  <div className="items-list-container">
                    {order.itemsList?.map((item, idx) => {
                      const itemImage = productImages[item.productId];

                      return (
                        <div key={idx} className="order-item-row">
                          <div className="item-thumbnail">
                            {itemImage && itemImage.startsWith('http') ? <img src={itemImage} alt={item.name} /> : '📦'}
                          </div>
                          <div className="item-details">
                            <h5>{item.name || 'UtensilPro Item'}</h5>
                            <p>Qty: <strong>{item.qty}</strong> × ₹{item.price?.toLocaleString()}</p>
                          </div>
                          <div className="item-actions">
                            <div className="item-line-price">₹{(item.price * item.qty).toLocaleString()}</div>
                            {isDelivered && (
                              <Link to={`/product/${item.productId}`} className="btn-review-link">Write a Review</Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ========================================= */}
      {/* 👉 NEW: CANCEL CONFIRMATION MODAL */}
      {/* ========================================= */}
      {orderToCancel && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content animate-slide-up">
            <FaExclamationCircle style={{fontSize: '4rem', color: '#f59e0b', marginBottom: '15px'}} />
            <h2>Cancel Order?</h2>
            <p>Are you sure you want to cancel Order <strong>#{orderToCancel.id.slice(-6).toUpperCase()}</strong>?<br/>This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setOrderToCancel(null)} className="btn-modal-safe" disabled={isCancelling}>No, Keep It</button>
              <button onClick={confirmCancelOrder} className="btn-modal-danger" disabled={isCancelling}>
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 👉 NEW: SUCCESS MODAL (Replaces the Toast) */}
      {/* ========================================= */}
      {successMessage && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content animate-slide-up">
            <FaCheckCircle style={{fontSize: '4.5rem', color: '#10b981', marginBottom: '15px'}} />
            <h2 style={{color: '#0f172a', marginBottom: '10px'}}>Order Cancelled</h2>
            <p>Your order <strong>#{successMessage}</strong> has been successfully cancelled and removed from your active tracking list.</p>
            <button onClick={() => setSuccessMessage(null)} className="btn-modal-success">Got it</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrackOrder;