// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import Navbar from '../components/layout/Navbar'

const Register = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', otp: '' });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match!");
    if (formData.password.length < 6) return setError("Password must be at least 6 characters.");

    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email })
      });

      if (res.ok) {
        setStep(2);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Server error. Ensure Spring Boot is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('🎉 Account verified and created successfully! Please log in.');
        navigate('/login');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Server error during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>    <Navbar/>
    <div className="auth-container">
    
      <div className="auth-card animate-slide-up">
        <Link to="/" className="auth-back-link">← Back to Store</Link>

        <div className="auth-header">
          <h2 onClick={() => navigate('/')} style={{cursor: 'pointer'}}>Utensil<span>Pro</span></h2>
          <p>{step === 1 ? "Create your customer profile." : "Verify your email address."}</p>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        {/* --- STEP 1: DETAILS FORM --- */}
        {step === 1 && (
          <form className="auth-form animate-fade-in" onSubmit={handleSendOTP}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" name="phone" placeholder="10-digit mobile number" value={formData.phone} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password" placeholder="Create a strong password"
                  value={formData.password} onChange={handleChange} required
                />
                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword" placeholder="Confirm your password"
                  value={formData.confirmPassword} onChange={handleChange} required
                />
                <button type="button" className="password-toggle-btn" onClick={() => setShowConfirm(!showConfirm)} tabIndex="-1">
                  {showConfirm ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-auth-primary" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Send Verification OTP'}
            </button>
          </form>
        )}

        {/* --- STEP 2: OTP FORM --- */}
        {step === 2 && (
          <form className="auth-form animate-fade-in" onSubmit={handleRegister}>
            <div className="otp-info-box">
              We've sent a 6-digit verification code to <strong>{formData.email}</strong>.<br/><br/>
              </div>

            <div className="form-group">
              <label style={{ textAlign: 'center' }}>Enter 6-Digit OTP</label>
              <input
                type="text"
                name="otp"
                placeholder="000000"
                value={formData.otp}
                onChange={handleChange}
                required
                maxLength="6"
                className="otp-input"
              />
            </div>

            <button type="submit" className="btn-auth-primary" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            <button type="button" className="btn-back-edit" onClick={() => setStep(1)}>
              ← Back to Edit Details
            </button>
          </form>
        )}

        {step === 1 && (
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Register;