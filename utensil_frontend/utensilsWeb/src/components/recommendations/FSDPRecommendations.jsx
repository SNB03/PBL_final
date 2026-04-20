// src/components/recommendations/FSDPRecommendations.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { FaStar, FaGlassMartiniAlt, FaFireAlt, FaShoppingCart } from 'react-icons/fa';
import './FSDPRecommendations.css';

const FSDPRecommendations = ({ currentCategory, currentProductId, showToast }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [seasonData, setSeasonData] = useState({
    title: "Smart Recommendations",
    icon: <FaStar style={{color: '#8b5cf6'}}/>,
    subtitle: "Curated by UtensilPro AI"
  });

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

          // Dynamic Header Logic based on Season using React Icons!
          const currentMonth = new Date().getMonth(); // 0 = Jan, 3 = April
          let context = {
            title: "Customers Also Liked",
            icon: <FaStar style={{color: '#f59e0b'}}/>,
            subtitle: "AI-Curated picks based on your interest"
          };

          if (currentMonth >= 2 && currentMonth <= 5) {
            context = {
              title: "Summer & Festive Essentials",
              icon: <FaGlassMartiniAlt style={{color: '#10b981'}}/>,
              subtitle: "Trending categories for the current season"
            };
          } else if (currentMonth >= 9 && currentMonth <= 11) {
            context = {
              title: "Festive Season Top Picks",
              icon: <FaFireAlt style={{color: '#ef4444'}}/>,
              subtitle: "Highly requested items for celebrations"
            };
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

  const handleQuickAdd = (e, product) => {
    e.preventDefault(); // Prevents the link from triggering when clicking "Quick Add"
    addToCart({ ...product, price: Number(product.price) }, 1);
    showToast(`Added ${product.name} to cart!`);
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
        {recommendations.map(product => {
          // 👉 NEW: Discount Calculation Logic
          let sellingPrice = Number(product.price) || 0;
          let rawMrp = product.originalPri || product.originalPrice || product.mrp || 0;
          let mrp = Number(rawMrp);
          let discountPct = 0;

          if (mrp > 0 && mrp !== sellingPrice) {
            if (sellingPrice > mrp) {
              let temp = sellingPrice;
              sellingPrice = mrp;
              mrp = temp;
            }
            discountPct = Math.round(((mrp - sellingPrice) / mrp) * 100);
          } else {
            mrp = 0;
          }

          return (
            <Link to={`/product/${product.id}`} key={product.id} className="fsdp-card">

              {/* Smart AI Tagline */}
              {product.tagline && (
                <div className="fsdp-ai-badge">
                  <FaStar style={{fontSize: '0.65rem'}}/> {product.tagline.length > 25 ? product.tagline.substring(0, 25) + "..." : product.tagline}
                </div>
              )}

              <div className="fsdp-img-box">
                {product.img && product.img.startsWith('http') ? (
                  <img src={product.img} alt={product.name} className="fsdp-img-actual" />
                ) : (
                  <span className="fsdp-emoji-fallback">{product.img || '📦'}</span>
                )}
              </div>

              <div className="fsdp-card-content">
                <h4 className="fsdp-card-title">{product.name}</h4>

                {/* 👉 NEW: Refined Price Row with Discount */}
                <div className="fsdp-price-row">
                  <span className="fsdp-current-price">₹{sellingPrice.toLocaleString()}</span>
                  {discountPct > 0 && (
                    <div className="fsdp-discount-group">
                      <span className="fsdp-strike-mrp">₹{mrp.toLocaleString()}</span>
                      <span className="fsdp-discount-tag">{discountPct}% OFF</span>
                    </div>
                  )}
                </div>

                <button className="fsdp-btn" onClick={(e) => handleQuickAdd(e, product)}>
                  <FaShoppingCart /> Quick Add
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default FSDPRecommendations;