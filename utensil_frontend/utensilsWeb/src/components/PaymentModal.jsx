// src/components/PaymentModal.jsx
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaCreditCard, FaQrcode, FaCheckCircle, FaTimes, FaSpinner } from 'react-icons/fa';

const PaymentModal = ({ totalAmount, onPaymentSuccess, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // =================================================================
  // 🛑 PUT YOUR ACTUAL STORE UPI DETAILS HERE 🛑
  // This will generate a live QR code that pays directly to your bank
  // =================================================================
  const MERCHANT_UPI_ID = import.meta.env.VITE_MERCHANT_UPI_ID;
  const MERCHANT_NAME = import.meta.env.VITE_MERCHANT_NAME;
  // =================================================================

  // The official string format that Google Pay, PhonePe, and Paytm use to read QR codes
  const upiString = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${totalAmount}&cu=INR`;

 // Inside src/components/PaymentModal.jsx

   const handlePay = (e) => {
     if(e) e.preventDefault();
     setIsProcessing(true);

     // Simulate a 2-second processing delay
     setTimeout(() => {
       setIsProcessing(false);
       // 👉 THE FIX: Pass the selected method back to the Cart!
       onPaymentSuccess(paymentMethod);
     }, 2000);
   };
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
      <div className="animate-slide-up" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔒 Secure Checkout
          </h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>
            <FaTimes />
          </button>
        </div>

        {/* AMOUNT DISPLAY */}
        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 5px 0', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Amount to Pay</p>
          <h3 style={{ margin: 0, fontSize: '2.2rem', color: '#10b981', fontWeight: '900' }}>₹{totalAmount.toLocaleString()}</h3>
        </div>

        {isProcessing ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <FaSpinner className="spinner-icon" style={{ fontSize: '3rem', color: '#3b82f6', marginBottom: '15px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '1.2rem' }}>Verifying Payment...</p>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Please do not close this window.</p>
          </div>
        ) : (
          <>
            {/* METHOD TOGGLE */}
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '5px', marginBottom: '25px' }}>
              <button
                onClick={() => setPaymentMethod('UPI')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: paymentMethod === 'UPI' ? 'white' : 'transparent', color: paymentMethod === 'UPI' ? '#0f172a' : '#64748b', boxShadow: paymentMethod === 'UPI' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
              >
                <FaQrcode /> Scan QR
              </button>
              <button
                onClick={() => setPaymentMethod('CARD')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: paymentMethod === 'CARD' ? 'white' : 'transparent', color: paymentMethod === 'CARD' ? '#0f172a' : '#64748b', boxShadow: paymentMethod === 'CARD' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
              >
                <FaCreditCard /> Card
              </button>
            </div>

            {/* UPI QR CODE VIEW */}
            {paymentMethod === 'UPI' && (
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '16px', border: '2px solid #e2e8f0', marginBottom: '20px' }}>
                  <QRCodeSVG value={upiString} size={200} level={"H"} />
                </div>
                <p style={{ margin: '0 0 5px 0', color: '#0f172a', fontWeight: 'bold', fontSize: '1.1rem' }}>Scan with any UPI App</p>
                <p style={{ margin: '0 0 25px 0', color: '#64748b', fontSize: '0.9rem' }}>GPay, PhonePe, Paytm, BHIM</p>

                <button onClick={() => handlePay()} style={{ width: '100%', padding: '16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                  <FaCheckCircle /> I have completed the payment
                </button>
              </div>
            )}

            {/* CARD VIEW */}
            {paymentMethod === 'CARD' && (
              <form onSubmit={handlePay} style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>Card Number</label>
                  <div style={{ position: 'relative' }}>
                    <FaCreditCard style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.2rem' }} />
                    <input type="text" placeholder="0000 0000 0000 0000" required maxLength="16" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '14px 14px 14px 45px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1.1rem', letterSpacing: '2px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>Expiry</label>
                    <input type="text" placeholder="MM/YY" required maxLength="5" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>CVV</label>
                    <input type="password" placeholder="•••" required maxLength="3" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', letterSpacing: '3px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <button type="submit" style={{ width: '100%', padding: '16px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  Pay ₹{totalAmount.toLocaleString()}
                </button>
              </form>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default PaymentModal;