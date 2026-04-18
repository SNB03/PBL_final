// src/components/admin/ActiveOrders.jsx
import React, { useState, useEffect } from 'react';
import './ActiveOrders.css';

const ActiveOrders = ({ orders, setOrders }) => {
  const [viewMode, setViewMode] = useState('orders'); // 'orders' or 'picking'
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [verifyCodeInput, setVerifyCodeInput] = useState({});
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState({});
  const [deliveryStaff, setDeliveryStaff] = useState([]);

  // Modal State
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // 👉 NEW: Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // 👉 NEW: Toast Helper Function
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/config/staff`)
      .then(res => res.json())
      .then(data => setDeliveryStaff(data))
      .catch(err => {
        console.error("Failed to fetch staff", err);
        showToast("Failed to load delivery staff", "error");
      });
  }, []);

  const formatEnum = (status) => status?.replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
  const getStatusClass = (status) => {
    switch(status) {
      case 'PENDING': return 'status-pending';
      case 'PACKED': return 'status-packed';
      case 'OUT_FOR_DELIVERY': return 'status-out';
      case 'DELIVERED': return 'status-completed';
      default: return 'status-default';
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders/${orderId}/status?status=${newStatus}`, { method: 'PATCH' });
      if (res.ok) {
        setOrders(orders.map(o => (o.id === orderId) && newStatus!=="CANCELLED"? { ...o, status: newStatus } : o));
        showToast(`Order #${orderId.substring(0,6)} marked as ${formatEnum(newStatus)}`, "success");
      } else {
        showToast("Failed to update status.", "error");
      }
    } catch (err) {
      showToast("Server connection error.", "error");
    }
  };

  const handleAssignDelivery = async (orderId) => {
    const boyId = selectedDeliveryBoy[orderId];
    if (!boyId) return showToast("Please select a delivery partner first.", "warning");

    const boy = deliveryStaff.find(d => d.id === parseInt(boyId));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders/${orderId}/assign?boyId=D-0${boy.id}&boyName=${boy.name}`, { method: 'PATCH' });
      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'OUT_FOR_DELIVERY', assignedTo: `D-0${boy.id} - ${boy.name}` } : o));
        showToast(`Dispatched with ${boy.name}!`, "success");
      } else {
        showToast("Failed to assign delivery.", "error");
      }
    } catch (err) {
      showToast("Server connection error.", "error");
    }
  };

  const handleVerifyPickup = async (orderId) => {
    if(!verifyCodeInput[orderId]) return showToast("Please enter the PIN code.", "warning");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders/${orderId}/verify?pin=${verifyCodeInput[orderId]}`, { method: 'POST' });
      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'DELIVERED' } : o));
        showToast("✅ Verified! Handed to customer.", "success");
        setVerifyCodeInput(prev => ({ ...prev, [orderId]: '' }));
      } else {
        showToast("❌ Invalid PIN Code.", "error");
      }
    } catch (err) {
      showToast("Server connection error.", "error");
    }
  };

  const openQuickView = async (productId) => {
    setIsLoadingProduct(true);
    setQuickViewProduct({ id: productId, name: 'Loading...' });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}`);
      if (res.ok) {
        const data = await res.json();
        data.normalizedAttributes = data.attributes || data.attrs || data.specs || data.details || data.features || {};
        setQuickViewProduct(data);
      } else {
        setQuickViewProduct({ error: 'Product details not found.' });
      }
    } catch(err) {
      setQuickViewProduct({ error: 'Network error.' });
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const generatePickingList = () => {
    const list = {};
    orders.filter(o => o.status === 'PENDING').forEach(order => {
      order.itemsList.forEach(item => {
        const cat = item.category || 'All Items';
        const sub = item.subcategory || 'General';

        if (!list[cat]) list[cat] = {};
        if (!list[cat][sub]) list[cat][sub] = {};
        if (!list[cat][sub][item.productId]) {
          list[cat][sub][item.productId] = { name: item.name, qty: 0, id: item.productId };
        }
        list[cat][sub][item.productId].qty += item.qty;
      });
    });
    return list;
  };

  const pickingData = generatePickingList();

  return (
    <div className="admin-section animate-fade-in">

      {/* HEADER & TOGGLE */}
      <div className="admin-controls">
        <div>
          <h2>Active Orders & Logistics</h2>
          <p>Pack orders, assign delivery staff, and verify store pickups.</p>
        </div>
        <div className="view-toggle">
          <button className={`view-btn ${viewMode === 'orders' ? 'active' : ''}`} onClick={() => setViewMode('orders')}>
            🧾 Order View
          </button>
          <button className={`view-btn ${viewMode === 'picking' ? 'active' : ''}`} onClick={() => setViewMode('picking')}>
            📋 Master Picking List
          </button>
        </div>
      </div>

      {/* --- MASTER PICKING LIST VIEW --- */}
      {viewMode === 'picking' && (
        <div className="picking-list-container animate-fade-in">
          <p style={{ color: '#64748b', marginBottom: '20px' }}>
            This list aggregates all required items across all PENDING orders so you can fetch them from the warehouse at once.
          </p>

          {Object.keys(pickingData).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No pending items to pack!</div>
          ) : (
            Object.keys(pickingData).map(category => (
              <div key={category} className="category-group">
                <h3 className="category-title">{category}</h3>
                {Object.keys(pickingData[category]).map(subcat => (
                  <div key={subcat} className="subcategory-group">
                    <h4 className="subcategory-title">{subcat}</h4>
                    {Object.values(pickingData[category][subcat]).map(item => (
                      <div key={item.id} className="picking-item-row" onClick={() => openQuickView(item.id)}>
                        <div className="picking-qty">{item.qty}x</div>
                        <div style={{ flex: 1, fontWeight: 'bold', color: '#0f172a' }}>{item.name}</div>
                        <div style={{ color: '#3b82f6', fontSize: '0.9rem', fontWeight: 'bold' }}>Quick View ↗</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* --- TRADITIONAL ORDER TABLE VIEW --- */}
      {viewMode === 'orders' && (
        <div className="admin-table-wrapper animate-fade-in">
          <table className="admin-table">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Fulfillment</th><th>Status</th><th>Action / Assignment</th></tr>
            </thead>
            <tbody>
              {orders.filter(o => o.status !== 'DELIVERED' && o.status!=="CANCELLED").map(order => (
                <React.Fragment key={order.id}>

                  {/* MAIN ROW */}
                  <tr className={expandedOrder === order.id ? 'table-row-active' : ''}>
                    <td>
                      <span style={{ fontWeight: 'bold', color: '#0f172a' }}>#{order.id.substring(0, 8).toUpperCase()}</span><br/>
                      <button className="btn-toggle-details" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                        {expandedOrder === order.id ? 'Hide Details ▲' : 'Review Details ▼'}
                      </button>
                    </td>
                    <td style={{ fontWeight: '600', color: '#334155' }}>{order.customerName}</td>
                    <td>
                      <span className={`fulfillment-badge ${order.type === 'Store Pickup' ? 'badge-pickup' : 'badge-delivery'}`}>
                        {order.type === 'Store Pickup' ? '🏪 Pickup' : '🚚 Delivery'}
                      </span>
                    </td>
                    <td><span className={`status-badge ${getStatusClass(order.status)}`}>{formatEnum(order.status)}</span></td>

                    {/* ACTIONS */}
                    <td>
                      {order.status === 'PENDING' && <button className="action-btn btn-dark" onClick={() => handleOrderStatusUpdate(order.id, 'PACKED')}>📦 Mark as Packed</button>}

                      {order.type === 'Home Delivery' && order.status === 'PACKED' && (
                        <div className="action-group">
                          <select className="action-select" value={selectedDeliveryBoy[order.id] || ''} onChange={(e) => setSelectedDeliveryBoy({...selectedDeliveryBoy, [order.id]: e.target.value})}>
                            <option value="">Assign Rider...</option>
                            {deliveryStaff.filter(s => s.active).map(staff => (<option key={staff.id} value={staff.id}>{staff.name} (D-0{staff.id})</option>))}
                          </select>
                          <button className="action-btn btn-blue" onClick={() => handleAssignDelivery(order.id)}>Dispatch</button>
                        </div>
                      )}

                      {order.type === 'Home Delivery' && order.status === 'OUT_FOR_DELIVERY' && <span className="assigned-rider-badge">🏍️ Assigned: {order.assignedTo}</span>}

                      {order.type === 'Store Pickup' && order.status === 'PACKED' && (
                        <div className="action-group">
                          <input type="text" maxLength="4" placeholder="PIN" className="action-input" value={verifyCodeInput[order.id] || ''} onChange={(e) => setVerifyCodeInput({...verifyCodeInput, [order.id]: e.target.value.replace(/\D/g, '')})} />
                          <button className="action-btn btn-green" onClick={() => handleVerifyPickup(order.id)}>Verify ✅</button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* EXPANDED DETAILS */}
                  {expandedOrder === order.id && (
                    <tr className="expanded-drawer-row">
                      <td colSpan="5" style={{ padding: 0 }}>
                        <div className="expanded-drawer-content">
                          <div className="logistics-card">
                            <h4>🛒 Packing List</h4>
                            <ul className="logistics-list">
                              {order.itemsList.map((item, idx) => (
                                <li key={idx}>
                                  <span className="qty-pill">{item.qty}x</span>
                                  <button className="product-link-btn" onClick={() => openQuickView(item.productId)}>
                                    {item.name} ↗
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="logistics-card">
                            <h4>📍 Fulfillment Details</h4>
                            <p style={{ margin: '0 0 8px 0' }}><strong>Contact:</strong> {order.phone ? <a href={`tel:${order.phone}`}>{order.phone}</a> : 'N/A'}</p>
                            <p style={{ margin: '0 0 15px 0' }}><strong>Address:</strong> {order.address || 'Store Pickup'}</p>
                            <div style={{ borderTop: '1px solid #f1f5f9' }}>
                              <span className={`payment-tag ${order.paymentMethod === 'COD' ? 'tag-cod' : 'tag-online'}`}>
                                {order.paymentMethod === 'COD' ? `💵 Collect ₹${order.total.toLocaleString()}` : '💳 Pre-Paid Online'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- QUICK VIEW MODAL --- */}
      {quickViewProduct && (
        <div className="modal-overlay" onClick={() => setQuickViewProduct(null)}>
          <div className="quick-view-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setQuickViewProduct(null)}>✕</button>

            {isLoadingProduct ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
            ) : quickViewProduct.error ? (
              <div style={{ color: '#ef4444', textAlign: 'center', padding: '20px' }}>{quickViewProduct.error}</div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '25px', marginBottom: '30px', flexWrap: 'wrap' }}>
                  <div style={{ width: '160px', height: '160px', flexShrink: 0, backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                    {quickViewProduct.img ? (
                      <img src={quickViewProduct.img} alt={quickViewProduct.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>📦</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.6rem', color: '#0f172a' }}>{quickViewProduct.name}</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        ₹{quickViewProduct.price || quickViewProduct.discountPrice}
                      </span>
                      {(quickViewProduct.originalPrice || quickViewProduct.mrp) && (
                        <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 'bold' }}>
                          ₹{quickViewProduct.originalPrice || quickViewProduct.mrp}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '15px' }}>
                      <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', border: '1px solid #e2e8f0' }}>
                        {quickViewProduct.category} &gt; {quickViewProduct.subcategory}
                      </span>

                      {quickViewProduct.stock <= 0 && (
                        <span style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          Out of Stock
                        </span>
                      )}
                    </div>

                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', lineHeight: '1.4' }}>
                      {quickViewProduct.description || 'No description available for this item.'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '1.1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    Technical & Variant Attributes
                  </h4>

                  {Object.keys(quickViewProduct.normalizedAttributes).length > 0 ? (
                    <div className="product-attribute-grid">
                      {Object.entries(quickViewProduct.normalizedAttributes).map(([key, val]) => (
                        <div key={key} className="attribute-card">
                          <div className="attribute-label">{key}</div>
                          <div className="attribute-value">{val}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', padding: '10px 0' }}>
                      No technical specifications provided for this product.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          CUSTOM TOAST NOTIFICATION
          ========================================= */}
      {toast.visible && (
        <div className={`custom-toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '❌'} {toast.message}
        </div>
      )}

    </div>
  );
};

export default ActiveOrders;