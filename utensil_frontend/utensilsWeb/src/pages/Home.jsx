// src/pages/Home.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Home.css';
import Navbar from '../components/layout/Navbar'

const Home = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);

  const [aiData, setAiData] = useState({ personalized: [], trending_by_category: [] });
  const [isLoading, setIsLoading] = useState(true);

  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const recordSearchHistory = useCallback((term) => {
    if (!term || term.trim().length < 2) return;

    let history = JSON.parse(localStorage.getItem('search_history') || '[]');
    const cleanTerm = term.trim().toLowerCase();

    history = history.filter(t => t.toLowerCase() !== cleanTerm);
    history.unshift(cleanTerm);

    history = history.slice(0, 3);
    localStorage.setItem('search_history', JSON.stringify(history));
  }, []);

  const fetchStoreData = useCallback(async () => {
    setIsLoading(true);
    const userId = user ? user.id : 'guest';

    const historyArray = JSON.parse(localStorage.getItem('search_history') || '[]');
    const recentSearchesQuery = historyArray.join(',');

    try {
      // 👉 FIX 1: Added ?size=500 to fetch ALL products, not just the first 20.
      // Added &t=${Date.now()} to bust the browser cache so new items show instantly!
      const prodRes = await fetch(`${import.meta.env.VITE_API_URL}/api/products?size=500&t=${Date.now()}`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        const productsArray = Array.isArray(data) ? data : (data.content || []);
        // Home.jsx - Update this mapping!
                const formattedProducts = productsArray.map(p => ({
                  ...p, // 👉 THIS IS THE MAGIC LINE YOU MISSED! It keeps originalPri intact.
                  id: p.id,
                  name: p.name || 'Unnamed',
                  category: p.category || 'General',
                  subcategory: p.subcategory || '',
                  price: p.price || 0,
                  img: p.img || p.imageUrl || p.image || '📦',
                  tag: p.tag || '',
                  stock: p.stock || 0
                }));
        setProducts(formattedProducts);
      }

      // Fetch AI Data
      const aiRes = await fetch(`${import.meta.env.VITE_API_URL}/api/storefront/dynamic-home/${userId}?recentSearches=${recentSearchesQuery}&t=${Date.now()}`);
      if (aiRes.ok) {
        setAiData(await aiRes.json());
      }
    } catch (error) {
      console.error("Failed to connect to backend API:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial Load
  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  useEffect(() => {
    if (searchTerm === '') {
      fetchStoreData();
    }
  }, [searchTerm, fetchStoreData]);

  const displayedProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const availableCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const handleSearchSubmit = () => {
    recordSearchHistory(searchTerm);
  };

  const handleAddToCart = (product) => {
    recordSearchHistory(searchTerm);
    addToCart(product, 1);
    showToast(`${product.name} added to your cart!`);
  };

  const handleExplore = (product) => {
    recordSearchHistory(searchTerm);
    if (product.name.toLowerCase().includes('cooker')) navigate('/cookers');
    else navigate(`/shop?category=${product.category}`);
  };

  const renderAiCard = (product) => (
    <div key={product.id} style={{ position: 'relative', marginTop: '10px' }}>
      {product.tagline && (
        <div style={{
          position: 'absolute', top: '-12px', left: '10px', backgroundColor: '#eff6ff',
          color: '#1e40af', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem',
          fontWeight: '900', zIndex: 10, border: '1px solid #bfdbfe', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          ✨ {product.tagline}
        </div>
      )}
      <ProductCard product={product} onAdd={handleAddToCart} onExplore={handleExplore} />
    </div>
  );

  return (
    <div className="local-store-home relative">
      <Navbar/>

      <div className="shop-info-banner">
        <div className="shop-info-content">
          <span>📍 Market Yard, Pune</span>
          <span>📞 Store: +91 98765 43210</span>
          <span className="open-status">🟢 Open today until 9:00 PM</span>
        </div>
      </div>

      <div className="welcome-section">
        <h1>Welcome to UtensilPro</h1>
        <p>Your trusted neighborhood shop for premium quality kitchenware.</p>
        <div className="simple-search">
          <input
            type="text"
            placeholder="Search for Tawa, Knives, Plates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
          />
          <button onClick={handleSearchSubmit}>Search</button>
        </div>
      </div>

      {isLoading && searchTerm === '' ? (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2 style={{ color: '#64748b' }}>Loading Personalized Storefront...</h2>
        </div>
      ) : searchTerm !== '' ? (
        <div className="store-section">
          <div className="section-header-row">
            <h2>Search Results for "{searchTerm}"</h2>
          </div>
          <div className="simple-grid">
            {displayedProducts.length > 0 ? (
              displayedProducts.map(product => (
                <ProductCard key={product.id} product={product} onAdd={handleAddToCart} onExplore={handleExplore} />
              ))
            ) : (
              <p style={{ color: '#64748b' }}>Sorry, we couldn't find anything matching your search.</p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* PERSONALIZED RECOMMENDATIONS */}
          {aiData.personalized && aiData.personalized.length > 0 && (
            <div className="store-section category-preview-section" style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '40px' }}>
              <div className="section-header-row">
                <div>
                  <h2 style={{ color: '#0f172a' }}>{user ? `Picked for You, ${user.name.split(' ')[0]}` : 'Recommended For You'}</h2>
                  <p className="section-subtitle" style={{ color: '#3b82f6', fontWeight: 'bold' }}>Powered by UtensilPro AI</p>
                </div>
              </div>
              <div className="simple-grid">
                {aiData.personalized.map(product => renderAiCard(product))}
              </div>
            </div>
          )}

          {/* TRENDING GLOBALLY */}
          {aiData.trending_by_category && aiData.trending_by_category.length > 0 && (
            <div className="store-section category-preview-section">
              <div className="section-header-row">
                <div>
                  <h2>Trending Across Categories</h2>
                  <p className="section-subtitle">Highest demand items this season.</p>
                </div>
              </div>
              <div className="simple-grid">
                {aiData.trending_by_category.map(product => renderAiCard(product))}
              </div>
            </div>
          )}

          {/* 👉 FIX 2: Removed .slice(0, 4) so EVERY category dynamically renders! */}
          {availableCategories.map(category => {
            // Still limits to top 4 products *per category row* so the UI stays neat
            const categoryTopPicks = products.filter(p => p.category === category).slice(0, 4);
            if (categoryTopPicks.length === 0) return null;

            return (
              <div key={category} className="store-section category-preview-section">
                <div className="section-header-row">
                  <div>
                    <h2>Best in {category}</h2>
                    <p className="section-subtitle">Our top quality picks for your kitchen.</p>
                  </div>
                  <Link to={`/shop?category=${encodeURIComponent(category)}`} className="view-all-link">
                    See all {category} →
                  </Link>
                </div>
                <div className="simple-grid">
                  {categoryTopPicks.map(product => (
                    <ProductCard key={product.id} product={product} onAdd={handleAddToCart} onExplore={handleExplore} />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {toast.visible && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', backgroundColor: '#10b981', color: 'white', padding: '15px 25px', borderRadius: '8px', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', animation: 'slideInRight 0.3s ease-out' }}>
          ✅ {toast.message}
        </div>
      )}
    </div>
  );
};

export default Home;