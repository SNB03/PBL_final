// src/components/profile/OrderDetailsModal.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './OrderDetailsModal.css';

const OrderDetailsModal = ({ order, onClose, onCancel, onDelete, onPrint }) => {
  if (!order) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span style={{ background: '#fef3c7', color: '#d97706', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>⏳ Processing</span>;
      case 'PACKED': return <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>📦 Packed</span>;
      case 'OUT_FOR_DELIVERY': return <span style={{ background: '#dbeafe', color: '#2563eb', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>🚚 Out for Delivery</span>;
      case 'COMPLETED':
      case 'DELIVERED': return <span style={{ background: '#d1fae5', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>✅ Delivered</span>;
      case 'CANCELLED': return <span style={{ background: '#fee2e2', color: '#ef4444', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>❌ Cancelled</span>;
      default: return <span>{status}</span>;
    }
  };

  // Prevent clicks inside the modal from closing it
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('custom-modal-overlay')) {
      onClose();
    }
  };

  return (
    <div className="custom-modal-overlay" onClick={handleOverlayClick}>
      <div className="custom-modal-box">

        {/* HEADER */}
        <div className="custom-modal-header">
          <h2>Order Details <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: 'normal', marginLeft: '10px' }}>#{order.id.toString().substring(0,8).toUpperCase()}</span></h2>
          <button className="btn-close-custom" onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div className="custom-modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ color: '#64748b', fontWeight: 'bold' }}>Placed: {new Date(order.orderDate).toLocaleDateString()}</span>
            {getStatusBadge(order.status)}
          </div>

          {(order.status === 'PACKED' || order.status === 'OUT_FOR_DELIVERY') && (
            <div style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '15px', borderRadius: '4px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#1e40af', fontWeight: '600' }}>🔒 {order.type === 'Store Pickup' ? "Store Pickup OTP" : "Delivery OTP"}</p>
                <span style={{ fontSize: '0.85rem', color: '#3b82f6' }}>Provide this code to the {order.type === 'Store Pickup' ? 'counter' : 'rider'}.</span>
              </div>
              <span style={{ fontSize: '1.3rem', letterSpacing: '3px', fontWeight: '900', background: 'white', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                {order.verificationPin || order.id.toString().slice(-4)}
              </span>
            </div>
          )}

          <div className="detail-grid">
            <div className="detail-block"><h4>Fulfillment</h4><p>{order.type}</p></div>
            <div className="detail-block"><h4>Payment Method</h4><p>{order.paymentMethod}</p></div>
            <div className="detail-block" style={{ gridColumn: '1 / -1' }}>
              <h4>Delivery Address</h4>
              <p>{order.type === 'Store Pickup' ? 'Self Pickup at Store Counter' : order.address}</p>
            </div>
          </div>

          <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Purchased Items</h4>
          <table className="modal-table">
            <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>
              {order.itemsList.map((item, idx) => (
                <tr key={idx}>
                  <td><Link to={`/product/${item.productId}`} style={{ color: '#0f172a', fontWeight: 'bold', textDecoration: 'none' }}>{item.name}</Link></td>
                  <td>{item.qty}</td>
                  <td>₹{item.price.toLocaleString()}</td>
                  <td>₹{(item.price * item.qty).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="modal-billing">
            <div className="modal-billing-row"><span>Subtotal:</span> <span>₹{(order.total - order.deliveryFee - 5).toLocaleString()}</span></div>
            <div className="modal-billing-row"><span>Delivery Fee:</span> <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span></div>
            <div className="modal-billing-row"><span>Platform Fee:</span> <span>₹5</span></div>
            <div className="modal-billing-row modal-billing-total"><span>Grand Total:</span> <span style={{ color: '#10b981' }}>₹{order.total.toLocaleString()}</span></div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="custom-modal-footer">
          <button style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onPrint(order)}>
            🖨️ Print Invoice
          </button>

          {order.status === 'PENDING' && (
            <button style={{ background: 'white', border: '1px solid #fca5a5', color: '#ef4444', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onCancel(order)}>
              ✕ Cancel Order
            </button>
          )}

          {['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(order.status) && (
            <button style={{ background: 'white', border: '1px solid #fca5a5', color: '#ef4444', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onDelete(order)}>
              🗑️ Delete History
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default OrderDetailsModal;