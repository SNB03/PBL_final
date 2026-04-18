// src/components/CartDrawer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, cartItemCount } = useCart();

  // Smart image renderer just like in the ProductCard
  const renderImage = (img) => {
    if (img && img.startsWith('http')) {
      return <img src={img} alt="product" />;
    }
    return img || '📦';
  };

  return (
    <>
      {/* Dark overlay background */}
      <div
        className={`cart-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Sliding Drawer */}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>

        {/* Header */}
        <div className="cart-header">
          <h2>🛒 Your Cart ({cartItemCount})</h2>
          <button className="btn-close-cart" onClick={onClose}>✕</button>
        </div>

        {/* Scrollable Body */}
        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart-msg">
              <span>🫙</span>
              <h3>Your cart is empty</h3>
              <p>Looks like you haven't added anything yet.</p>
              <button
                onClick={onClose}
                style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="cart-item-row">

                <div className="cart-item-img">
                  {renderImage(item.img || item.image)}
                </div>

                <div className="cart-item-details">
                  <h4 className="cart-item-title">{item.name}</h4>
                  <div className="cart-item-price">₹{(item.price * item.qty).toLocaleString()}</div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="qty-controls">
                      <button
                        className="btn-qty"
                        onClick={() => updateQuantity(item.id, item.qty - 1)}
                      >-</button>
                      <span className="qty-number">{item.qty}</span>
                      <button
                        className="btn-qty"
                        onClick={() => updateQuantity(item.id, item.qty + 1)}
                      >+</button>
                    </div>

                    <button
                      className="btn-remove"
                      onClick={() => removeFromCart(item.id)}
                      title="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Fixed Footer (Only shows if there are items) */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span>Subtotal:</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>

            {/* Navigates to the full checkout/cart page while closing the drawer */}
            <Link to="/cart" className="btn-checkout" onClick={onClose}>
              Proceed to Checkout →
            </Link>
          </div>
        )}

      </div>
    </>
  );
};

export default CartDrawer;