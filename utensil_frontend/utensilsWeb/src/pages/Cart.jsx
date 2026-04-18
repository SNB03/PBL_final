// src/pages/Cart.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import PaymentModal from '../components/PaymentModal';

import {
  FaTrash, FaPlus, FaMinus, FaTruck, FaBox,
  FaShoppingCart, FaMapMarkerAlt, FaCheckCircle, FaExclamationCircle, FaShieldAlt
} from 'react-icons/fa';

import './Cart.css';

const Cart = () => {
  const { cartItems, cartTotal, clearCart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checkoutStep, setCheckoutStep] = useState(1);
  const [fulfillmentType, setFulfillmentType] = useState('Home Delivery');
  const [address, setAddress] = useState(user?.address || '');
  const [paymentType, setPaymentType] = useState('ONLINE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Modal State
  const [showFallbackPayment, setShowFallbackPayment] = useState(false);

  // Admin Settings & Delivery State
  const [storeSettings, setStoreSettings] = useState({ maxRadius: 55, ratePerKm: 10, freeDeliveryThreshold: 999 });
  const [distance, setDistance] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isDeliveryPossible, setIsDeliveryPossible] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  // --- 1. FETCH SETTINGS ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/config/settings`);
        if (res.ok) setStoreSettings(await res.json());
      } catch (err) {
        console.error("Using fallback store settings.");
      }
    };
    fetchSettings();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3500);
  };

  // --- 2. DISTANCE ---
  const handleCalculateDelivery = async () => {
    if (address.trim().length < 10) return showToast("Please type a detailed address first.", "error");
    setIsLocating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery/estimate?address=${encodeURIComponent(address)}&cartTotal=${cartTotal}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to calculate distance");

      setDistance(data.distance);
      setIsDeliveryPossible(data.deliverable);
      setDeliveryFee(data.fee);

      if (!data.deliverable) {
         showToast(`Sorry, home delivery is not possible at ${data.distance} km. We will expand soon!`, "error");
      } else {
         showToast(`Delivery available! Distance: ${data.distance} km`, "success");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setIsLocating(false);
    }
  };

  // --- 3. GST CALCULATION ---
  const calculateGST = () => {
    let totalTax = 0;
    cartItems.forEach(item => {
      let gstRate = 5;
      const rawGst = item.gst || (item.attrs && (item.attrs.gst || item.attrs.GST || item.attrs.Gst));
      if (rawGst) {
        const parsedRate = parseFloat(String(rawGst).replace('%', ''));
        if (!isNaN(parsedRate)) gstRate = parsedRate;
      }
      totalTax += (item.price * item.qty) * (gstRate / 100);
    });
    return Math.round(totalTax);
  };

  const totalGST = calculateGST();
  const finalTotal = cartTotal + totalGST + (fulfillmentType === 'Store Pickup' ? 0 : deliveryFee);

  // --- 4. QUANTITY CONTROL ---
  const handleDirectQtyInput = (item, value) => {
    let newQty = parseInt(value, 10);
    const maxStock = item.stock || 50;
    if (isNaN(newQty) || newQty < 1) newQty = 1;
    if (newQty > maxStock) {
        newQty = maxStock;
        showToast(`Only ${maxStock} items available in stock.`, "error");
    }
    updateQuantity(item.id, newQty);
  };

  const handleProceedToPayment = () => {
    if (fulfillmentType === 'Home Delivery') {
      if (address.trim().length < 10) return showToast("Please enter a complete delivery address.", "error");
      if (!isDeliveryPossible) return showToast("Delivery is not possible to this location.", "error");
      if (distance === 0) return showToast("Please click 'Verify Address' to calculate delivery distance.", "error");
    }
    setCheckoutStep(2);
    window.scrollTo(0, 0);
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // --- 5. MAIN CHECKOUT LOGIC (WITH FAILOVER) ---
  const handleFinalCheckout = async () => {
    setIsProcessing(true);

    const orderPayload = {
      customerId: user.id.toString(),
      customerName: user.name,
      phone: user.phone,
      type: fulfillmentType,
      address: fulfillmentType === 'Home Delivery' ? address : 'Store Pickup',
      paymentMethod: paymentType,
      deliveryFee: fulfillmentType === 'Home Delivery' ? deliveryFee : 0,
      taxAmount: totalGST,
      total: finalTotal,
      status: "PENDING",
      itemsList: cartItems.map(i => ({ productId: i.id, name: i.name, qty: i.qty, price: i.price }))
    };

    if (paymentType === 'ONLINE') {
      try {
        // 👉 1. Try hitting your Spring Boot Razorpay controller
        const rpRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: finalTotal })
        });

        if (!rpRes.ok) throw new Error("Razorpay backend configuration missing.");
        const rpData = await rpRes.json();

        // 👉 2. Load script
        const scriptLoaded = await loadRazorpay();
        if (!scriptLoaded) throw new Error("Razorpay script blocked by browser.");

        // 👉 3. Save order to MongoDB as PENDING first (so we have an ID to verify later)
        const dbRes = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
        const savedOrder = await dbRes.json();

        // 👉 4. Open Razorpay Window
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "fallback_key",
          amount: finalTotal * 100,
          currency: "INR",
          name: "UtensilPro",
          description: "Secure Online Payment",
          order_id: rpData.id,
          handler: async (response) => {
             // 👉 5. On Success, verify via Spring Boot
             await fetch(`${import.meta.env.VITE_API_URL}/api/payment/verify`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    mongo_order_id: savedOrder.id
                })
             });
             showToast("✅ Payment successful! Redirecting...", "success");
             clearCart();
             setTimeout(() => navigate(`/invoice/${savedOrder.id}`), 2000);
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
            showToast(`Payment Failed: ${response.error.description}`, "error");
        });
        rzp.open();
        setIsProcessing(false);

      } catch (err) {
        // 🚨 IF RAZORPAY FAILS FOR ANY REASON, TRIGGER THE FALLBACK MODAL!
        console.warn("Automated failover to QR Modal. Reason:", err.message);
        setIsProcessing(false);
        setShowFallbackPayment(true);
      }

    } else {
      // --- COD FLOW ---
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });

        if (res.ok) {
          const savedOrder = await res.json();
          showToast("🎉 Order Placed! Please keep cash ready at delivery.", "success");
          clearCart();
          setTimeout(() => navigate(`/invoice/${savedOrder.id}`), 2000);
        } else {
          showToast("Failed to place order. Please try again.", "error");
        }
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // --- 6. MODAL PAYMENT SUCCESS HANDLER ---
  const handleModalPaymentSuccess = async (methodUsed) => {
    setShowFallbackPayment(false);

    // 👉 DYNAMIC ADMIN VERIFICATION LOGIC
    let finalStatus = "PAID";
    if (methodUsed === 'UPI') {
      finalStatus = "PROCESSING"; // Puts the order in "Active Orders" for Admin to verify
      showToast("✅ Payment submitted! Our admin will cross-verify your transaction shortly.", "success");
    } else {
      showToast("✅ Card Payment verified! Finalizing order...", "success");
    }

    const orderPayload = {
      customerId: user.id.toString(),
      customerName: user.name,
      phone: user.phone,
      type: fulfillmentType,
      address: fulfillmentType === 'Home Delivery' ? address : 'Store Pickup',
      paymentMethod: methodUsed,
      deliveryFee: fulfillmentType === 'Home Delivery' ? deliveryFee : 0,
      taxAmount: totalGST,
      total: finalTotal,
      status: finalStatus,
      itemsList: cartItems.map(i => ({ productId: i.id, name: i.name, qty: i.qty, price: i.price }))
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const savedOrder = await res.json();
        clearCart();
        setTimeout(() => navigate(`/invoice/${savedOrder.id}`), 2500);
      } else {
        showToast("Payment succeeded, but order creation failed. Contact support.", "error");
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  // --- EMPTY CART VIEW ---
  if (cartItems.length === 0) {
    return (
      <div className="storefront-container">
        <Navbar/>
        <main className="store-main empty-cart-main">
          <div className="animate-fade-in empty-cart-content">
            <FaShoppingCart className="empty-cart-icon" />
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added any premium kitchenware yet.</p>
            <Link to="/shop" className="btn-return-shop">Return to Shop</Link>
          </div>
        </main>
      </div>
    );
  }

  // --- MAIN VIEW ---
  return (
    <div className="storefront-container">
      <Navbar/>
      <main className="store-main">

        {/* LEFT COLUMN */}
        <div className="checkout-left-column">
         {checkoutStep === 1 && (
           <div className="animate-fade-in">
             <h1 className="checkout-step-title">Checkout (Step 1 of 2)</h1>

             <section className="checkout-card">
               <h2 className="checkout-card-header"><FaTruck style={{color: '#3b82f6'}} /> Delivery Details</h2>

               <div className="fulfillment-options">
                 {['Home Delivery', 'Store Pickup'].map(t => (
                   <button key={t} onClick={() => {setFulfillmentType(t); setDistance(0); setDeliveryFee(0);}} className={`btn-fulfillment ${fulfillmentType === t ? 'active' : 'inactive'}`}>
                     {t}
                   </button>
                 ))}
               </div>

               {fulfillmentType === 'Home Delivery' && (
                 <div className="address-container animate-fade-in">
                   <label>Shipping Address & Pincode</label>
                   <textarea rows="3" placeholder="House No, Street, Landmark, Pincode..." value={address} onChange={(e) => setAddress(e.target.value)} className="address-textarea" />

                   <div className="distance-action-area">
                     <button onClick={handleCalculateDelivery} disabled={isLocating} className="btn-calculate-dist">
                       <FaMapMarkerAlt /> {isLocating ? 'Locating...' : 'Verify Address & Distance'}
                     </button>

                     {distance > 0 && isDeliveryPossible && (
                        <div className="distance-success">
                          <FaCheckCircle /> Delivery Approved: {distance.toFixed(1)} km away. (Fee: ₹{deliveryFee})
                        </div>
                     )}

                     {!isDeliveryPossible && (
                        <div className="distance-error">
                          <FaExclamationCircle /> Out of bounds ({distance.toFixed(1)} km). Max delivery radius is {storeSettings.maxRadius} km.
                        </div>
                     )}
                   </div>
                 </div>
               )}
             </section>

             <section className="checkout-card">
               <h2 className="checkout-card-header"><FaBox style={{color: '#3b82f6'}} /> Order Review</h2>

               <div className="review-items-list">
                 {cartItems.map(item => (
                   <div key={item.id} className="review-item-row">
                     <Link to={`/product/${item.id}`} className="review-item-link">
                       <div className="review-item-img">
                         {item.img && item.img.startsWith('http') ? <img src={item.img} alt={item.name} /> : <FaBox className="fallback-icon" />}
                       </div>
                     </Link>

                     <div className="review-item-details">
                       <div className="review-item-header">
                         <Link to={`/product/${item.id}`} className="review-item-title"><h3>{item.name}</h3></Link>
                         <span className="review-item-price">₹{(item.price * item.qty).toLocaleString()}</span>
                       </div>

                       <div className="review-item-footer">
                         <div className="qty-controls">
                           <button onClick={() => handleDirectQtyInput(item, item.qty - 1)} className="btn-qty-mod"><FaMinus /></button>
                           <input
                              type="number"
                              className="qty-input"
                              value={item.qty}
                              onChange={(e) => handleDirectQtyInput(item, e.target.value)}
                           />
                           <button onClick={() => handleDirectQtyInput(item, item.qty + 1)} disabled={item.qty >= (item.stock || 50)} className="btn-qty-mod"><FaPlus /></button>
                           <button onClick={() => removeFromCart(item.id)} className="btn-remove-item" title="Remove Item"><FaTrash /></button>
                         </div>
                         <span className="single-price">₹{item.price.toLocaleString()} / unit</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </section>
           </div>
         )}

          {checkoutStep === 2 && (
            <div className="animate-slide-up">
              <button onClick={() => setCheckoutStep(1)} className="btn-back">← Back to Address</button>
              <h1 className="checkout-step-title">Payment (Step 2 of 2)</h1>

              <section className="checkout-card">
                <h2 className="checkout-card-header">Select Payment Method</h2>
                <div className="payment-options-list">
                  <label className={`payment-option-label ${paymentType === 'ONLINE' ? 'active' : 'inactive'}`}>
                    <input type="radio" name="payment" checked={paymentType === 'ONLINE'} onChange={() => setPaymentType('ONLINE')} />
                    <div>
                      <span className="payment-title">Pay Online Securely</span>
                      <span className="payment-desc">UPI, Google Pay, PhonePe, Credit/Debit Cards</span>
                    </div>
                  </label>

                  <label className={`payment-option-label ${paymentType === 'COD' ? 'active' : 'inactive'}`}>
                    <input type="radio" name="payment" checked={paymentType === 'COD'} onChange={() => setPaymentType('COD')} />
                    <div>
                      <span className="payment-title">Cash on Delivery (COD)</span>
                      <span className="payment-desc">Pay with cash when your order arrives</span>
                    </div>
                  </label>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Static Billing Summary */}
        <aside className="checkout-right-column">
          <h2 className="summary-header">Order Summary</h2>

          <div className="summary-details">
            <div className="summary-row"><span>Item Total</span><span className="summary-val">₹{cartTotal.toLocaleString()}</span></div>
            <div className="summary-row"><span>Estimated GST</span><span className="summary-val">₹{totalGST.toLocaleString()}</span></div>

            {fulfillmentType === 'Home Delivery' && (
               <div className="summary-row">
                 <span>Delivery Fee</span>
                 <span className={`summary-val ${deliveryFee === 0 ? 'free' : ''}`}>
                   {deliveryFee === 0 && distance > 0 ? 'FREE' : `₹${deliveryFee}`}
                 </span>
               </div>
            )}

            <div className="summary-total-row">
              <span>Total Pay</span>
              <span className="final-price">₹{finalTotal.toLocaleString()}</span>
            </div>
          </div>

          {!user ? (
            <button className="btn-primary-action btn-login-prompt" onClick={() => navigate('/login', { state: { from: '/cart' } })}>
              Login to Checkout
            </button>
          ) : checkoutStep === 1 ? (
            <button className="btn-primary-action btn-proceed" onClick={handleProceedToPayment} disabled={cartItems.length === 0}>
              Proceed to Payment →
            </button>
          ) : (
            <button className={`btn-primary-action btn-pay ${paymentType === 'COD' ? 'cod' : 'online'} ${isProcessing ? 'processing' : ''}`} onClick={handleFinalCheckout} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : paymentType === 'COD' ? 'Confirm COD Order' : `Pay ₹${finalTotal.toLocaleString()} Securely`}
            </button>
          )}
        </aside>
      </main>

      {/* 👉 FALLBACK MODAL TRIGGER */}
      {showFallbackPayment && (
        <PaymentModal
          totalAmount={finalTotal}
          onCancel={() => setShowFallbackPayment(false)}
          onPaymentSuccess={handleModalPaymentSuccess}
        />
      )}

      {toast.visible && (
        <div className={`global-toast ${toast.type}`}>
          {toast.type === 'error' ? <FaExclamationCircle/> : <FaCheckCircle/>} {toast.message}
        </div>
      )}
    </div>
  );
};

export default Cart;