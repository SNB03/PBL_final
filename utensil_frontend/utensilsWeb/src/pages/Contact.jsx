// src/pages/Contact.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; // 👉 Brings in user state

const Contact = () => {
  const { user } = useAuth(); // Check if logged in

  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  // Guest Verification State
  const [isVerified, setIsVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  // Auto-fill and auto-verify if user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, name: user.name, email: user.email }));
      setIsVerified(true); // Skip OTP step entirely!
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- GUEST OTP LOGIC ---
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.name) {
      return setStatus({ type: 'error', message: 'Please enter Name and Email first.' });
    }
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact/send-otp?email=${formData.email}`, { method: 'POST' });
      if (res.ok) {
        setOtpSent(true);
        setStatus({ type: 'success', message: 'Verification code sent to your email!' });
      } else {
        setStatus({ type: 'error', message: 'Failed to send OTP.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Server error. Try again.' });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact/verify-otp?email=${formData.email}&otp=${otp}`, { method: 'POST' });
      if (res.ok) {
        setIsVerified(true);
        setStatus({ type: 'success', message: 'Email verified! You can now type your message.' });
      } else {
        setStatus({ type: 'error', message: 'Invalid OTP. Please check your email and try again.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Server error. Try again.' });
    }
  };

  // --- SUBMIT MESSAGE ---
  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Thanks! Your message has been sent. Our team will email you shortly.' });
        if (!user) {
          // Reset form for guests
          setFormData({ name: '', email: '', message: '' });
          setIsVerified(false);
          setOtpSent(false);
          setOtp('');
        } else {
          // Only clear message for logged in users
          setFormData(prev => ({ ...prev, message: '' }));
        }
      } else {
        setStatus({ type: 'error', message: 'Failed to send message.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Server error. Please ensure you are connected.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
      <Navbar />

      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#0f172a', margin: '0 0 10px 0' }}>Get in Touch</h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>We'd love to hear from you. Our friendly team is always here to chat.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>

          {/* Left Side: Info */}
          <div>
            <h3 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '20px' }}>Contact Information</h3>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', color: '#475569' }}>
              <FaMapMarkerAlt style={{ color: '#3b82f6', fontSize: '1.3rem', marginTop: '3px' }} />
              <div><strong style={{ display: 'block', color: '#0f172a' }}>Store Address</strong>Market Yard, Pune<br/>Maharashtra, 411037</div>
            </div>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', color: '#475569' }}>
              <FaPhoneAlt style={{ color: '#3b82f6', fontSize: '1.3rem', marginTop: '3px' }} />
              <div><strong style={{ display: 'block', color: '#0f172a' }}>Phone</strong>+91 98765 43210</div>
            </div>
            <div style={{ display: 'flex', gap: '15px', color: '#475569' }}>
              <FaEnvelope style={{ color: '#3b82f6', fontSize: '1.3rem', marginTop: '3px' }} />
              <div><strong style={{ display: 'block', color: '#0f172a' }}>Email</strong>support@utensilpro.com</div>
            </div>
          </div>

          {/* Right Side: Smart Form */}
          <div>
            {status.message && (
              <div style={{ backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2', color: status.type === 'success' ? '#166534' : '#b91c1c', padding: '15px', borderRadius: '8px', fontWeight: 'bold', marginBottom: '20px' }}>
                {status.type === 'success' ? '✅' : '❌'} {status.message}
              </div>
            )}

            {/* STEP 1: IDENTITY */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={isVerified} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: isVerified ? '#f1f5f9' : 'white' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={isVerified} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: isVerified ? '#f1f5f9' : 'white' }} />
            </div>

            {/* STEP 2: VERIFICATION (Only for Guests) */}
            {!isVerified && !otpSent && (
              <button onClick={handleSendOtp} style={{ width: '100%', backgroundColor: '#3b82f6', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                Verify Email to Continue
              </button>
            )}

            {!isVerified && otpSent && (
              <div style={{ marginBottom: '20px', padding: '15px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#1e40af' }}>Enter Verification Code</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="e.g. 123456" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #93c5fd', outline: 'none' }} />
                  <button onClick={handleVerifyOtp} style={{ backgroundColor: '#1d4ed8', color: 'white', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Verify</button>
                </div>
              </div>
            )}

            {/* STEP 3: THE MESSAGE (Only visible once verified) */}
            {isVerified && (
              <form onSubmit={handleSubmitMessage}>
                {user && (
                   <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold', marginBottom: '15px', fontSize: '0.9rem' }}>
                     <FaCheckCircle /> Verified Customer Account
                   </p>
                )}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Message</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} rows="5" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}></textarea>
                </div>

                <button type="submit" disabled={isSubmitting} style={{ width: '100%', backgroundColor: isSubmitting ? '#94a3b8' : '#0f172a', color: 'white', padding: '15px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.05rem', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;