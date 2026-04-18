// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';
import Navbar from '../components/layout/Navbar'

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (res.ok) {
        const userData = await res.json();
        login(userData);

        if (userData.role === 'ADMIN') {
          navigate('/admin');
        } else if (userData.role === 'DELIVERY') {
          navigate('/delivery');
        } else {
          const destination = location.state?.from || '/';
          navigate(destination);
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Server error. Ensure your Spring Boot backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <>
       <Navbar/>
    <div className="auth-container">

      <div className="auth-card animate-slide-up">

        <Link to="/" className="auth-back-link">
          ← Back to Store
        </Link>

        <div className="auth-header">
          <h2 onClick={() => navigate('/')} style={{cursor: 'pointer'}}>Utensil<span>Pro</span></h2>
          <p>Welcome back! Please enter your details.</p>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="text"
              name="email"
              placeholder="you@example.com or 9876543210"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-auth-primary" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Sign up for free</Link></p>
        </div>
      </div>
    </div>
    </>
  );

};

export default Login;