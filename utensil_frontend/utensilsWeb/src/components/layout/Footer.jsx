// src/components/layout/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // 👉 NEW: Import Auth Context
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaCcVisa,
  FaCcMastercard,
  FaCcPaypal,
  FaCcAmazonPay
} from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const { user } = useAuth(); // 👉 NEW: Get user state

  // 👉 This ensures the page snaps to the top when a footer link is clicked
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // 👉 NEW: If the user is an Admin, do not render the footer at all
  if (user?.role === 'ADMIN') {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="footer-newsletter">
        <div className="newsletter-content">
          <h3>Join Our Kitchen Community</h3>
          <p>Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
        </div>
        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Enter your email address" required />
          <button type="submit">Subscribe</button>
        </form>
      </div>

      <div className="footer-main">
        <div className="footer-col brand-col">
          <h2>UtensilPro</h2>
          <p>Your trusted neighborhood shop for premium quality kitchenware. We bring the best tools to your culinary adventures.</p>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noreferrer"><FaFacebookF /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer"><FaInstagram /></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer"><FaTwitter /></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/shop?category=cookware" onClick={scrollToTop}>Cookware</Link></li>
            <li><Link to="/shop?category=serveware" onClick={scrollToTop}>Serveware</Link></li>

            <li><Link to="/shop" onClick={scrollToTop}>New Arrivals</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Customer Service</h4>
          <ul>
            <li><Link to="/about" onClick={scrollToTop}>About Us</Link></li>
            <li><Link to="/contact" onClick={scrollToTop}>Contact Us</Link></li>
            <li><Link to="/shipping" onClick={scrollToTop}>Shipping Policy</Link></li>
            <li><Link to="/returns" onClick={scrollToTop}>Returns & Exchanges</Link></li>
            <li><Link to="/faq" onClick={scrollToTop}>FAQs</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Store Info</h4>
          <ul className="store-info-list">
            <li>📍 Market Yard, Pune, 411037</li>
            <li>📞 +91 98765 43210</li>
            <li>✉️ support@utensilpro.com</li>
            <li>🕒 Mon - Sun: 9:00 AM - 9:00 PM</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} UtensilPro. All Rights Reserved.</p>
        <div className="payment-icons">
          <FaCcVisa />
          <FaCcMastercard />
          <FaCcPaypal />
          <FaCcAmazonPay />
        </div>
      </div>
    </footer>
  );
};

export default Footer;