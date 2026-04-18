// src/components/recommendations/FSDPRecommendations.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './FSDPRecommendations.css';

const FSDPRecommendations = ({ currentCategory, currentProductId, showToast }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [seasonData, setSeasonData] = useState({ title: "Smart Recommendations", icon: "✨", subtitle: "Curated by UtensilPro AI" });

  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAIRecommendations = async () => {
      try {
        const userId = user ? user.id : 'guest';

        // 👉 UPGRADE: Combine current item's category WITH their global search history!
        const historyArray = JSON.parse(localStorage.getItem('search_history') || '[]');

        // Add the current category to the front of the list, then join with commas
        const combinedSearches = [currentCategory, ...historyArray]
          .filter(Boolean) // removes empty strings
          .join(',');

        // 👉 FIX: Changed 'recentSearch=' to 'recentSearches=' to match Spring Boot
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/storefront/dynamic-home/${userId}?recentSearches=${combinedSearches}`);

        if (res.ok) {
          const data = await res.json();

          // Combine personalized and trending items from the AI response
          let combinedProducts = [...(data.personalized || []), ...(data.trending_by_category || [])];

          // Filter out duplicates and the exact product the user is currently viewing
          let uniqueMap = new Map();
          combinedProducts.forEach(p => {
            if (p.id?.toString() !== currentProductId?.toString() && !uniqueMap.has(p.id)) {
              uniqueMap.set(p.id, p);
            }
          });

          // Take the top 6 best matches
          const finalRecs = Array.from(uniqueMap.values()).slice(0, 6);
          setRecommendations(finalRecs);

          // Dynamic Header Logic based on Season
          const currentMonth = new Date().getMonth(); // 0 = Jan, 3 = April
          let context = { title: "Customers Also Liked", icon: "⭐", subtitle: "AI-Curated picks based on your interest" };

          if (currentMonth >= 2 && currentMonth <= 5) {
            context = { title: "Summer & Festive Essentials", icon: "🍹", subtitle: "Trending categories for the current season" };
          } else if (currentMonth >= 9 && currentMonth <= 11) {
            context = { title: "Festive Season Top Picks", icon: "🪔", subtitle: "Highly requested items for celebrations" };
          }
          setSeasonData(context);
        }
      } catch (err) {
        console.error("Failed to fetch AI recommendations", err);
      }
    };

    if (currentCategory) {
      fetchAIRecommendations();
    }
  }, [currentCategory, currentProductId, user]);

  const handleQuickAdd = (product) => {
    addToCart({ ...product, price: Number(product.price) }, 1);
    showToast(`Added ${product.name} to cart!`);
  };

  const renderImage = (img) => {
    if (img && img.startsWith('http')) return <img src={img} alt="Product" style={{width: '80%', height: '80%', objectFit: 'contain'}} />;
    return <span style={{ fontSize: '3rem' }}>{img || '📦'}</span>;
  };

  if (recommendations.length === 0) return null;

  return (
    <div className="fsdp-container animate-fade-in">
      <div className="fsdp-header">
        <div className="fsdp-icon">{seasonData.icon}</div>
        <div className="fsdp-title">
          <h3>{seasonData.title}</h3>
          <p>{seasonData.subtitle}</p>
        </div>
      </div>

      <div className="fsdp-scroll-wrapper">
        {recommendations.map(product => (
          <div key={product.id} className="fsdp-card" style={{ position: 'relative' }}>

            {/* Display the smart AI Tagline if available */}
            {product.tagline && (
              <div style={{
                position: 'absolute', top: '10px', left: '10px', backgroundColor: '#eff6ff',
                color: '#1e40af', padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem',
                fontWeight: 'bold', zIndex: 10, border: '1px solid #bfdbfe'
              }}>
                ✨ {product.tagline.length > 25 ? product.tagline.substring(0, 25) + "..." : product.tagline}
              </div>
            )}

            <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
              <div className="fsdp-img-box" style={{ marginTop: product.tagline ? '20px' : '0' }}>
                {renderImage(product.img)}
              </div>
              <h4>{product.name}</h4>
              <div className="price">₹{product.price.toLocaleString()}</div>
            </Link>

            <button className="fsdp-btn" onClick={() => handleQuickAdd(product)}>
              Quick Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FSDPRecommendations;