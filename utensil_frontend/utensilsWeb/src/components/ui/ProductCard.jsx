// src/components/ui/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, onAdd, onExplore }) => {
  // Normalize attributes to extract distinguishing factors
  const attrs = product.attributes || product.attrs || product.specs || {};

  // Filter out long descriptions from the card specs to keep it clean
  const cleanAttrs = Object.entries(attrs).filter(([key, val]) =>
    key.toLowerCase() !== 'description' && String(val).length <= 30
  );
  const distinguishingFactors = cleanAttrs.slice(0, 2); // Get first 2 clean specs

 // ==========================================
   // 🧠 SMART PRICING LOGIC
   // Automatically fixes bad DB entries and catches variable typos
   // ==========================================
   let sellingPrice = Number(product.price) || 0;

   // 👉 THE FIX: We tell React to look for "originalPri", "originalPrice", or "mrp"
   let rawMrp = product.originalPri || product.originalPrice || product.mrp || 0;
   let mrp = Number(rawMrp);

   let discountPct = 0;

   if (mrp > 0 && mrp !== sellingPrice) {
     if (sellingPrice > mrp) {
       // Admin swapped them by mistake in the DB, let's fix it on the fly
       let temp = sellingPrice;
       sellingPrice = mrp;
       mrp = temp;
     }
     // Calculate precise discount percentage
     discountPct = Math.round(((mrp - sellingPrice) / mrp) * 100);
   } else {
     // No valid discount exists
     mrp = 0;
   }

  const renderImage = () => {
    if (product.img && product.img.startsWith('http')) {
      return <img src={product.img} alt={product.name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />;
    }
    return <span style={{ fontSize: '4rem' }}>{product.img || '📦'}</span>;
  };

  return (
    <div className="item-card">
      {/* Dynamic AI / Quality Tag */}
      {product.tag && <span className="quality-tag">{product.tag}</span>}

      <Link to={`/product/${product.id}`} className="clickable-product-link">
        <div className="item-img">
          {renderImage()}
        </div>
      </Link>

      <div className="item-details">
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
            {product.category} {product.subcategory && `• ${product.subcategory}`}
          </span>
          <Link to={`/product/${product.id}`} className="clickable-product-link">
            <h4 style={{ margin: '4px 0 8px 0', fontSize: '1.1rem' }}>{product.name}</h4>
          </Link>
        </div>

        {distinguishingFactors.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
            {distinguishingFactors.map(([key, val]) => (
              <span key={key} style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <strong>{key}:</strong> {val}
              </span>
            ))}
          </div>
        )}

        {/* 👉 NEW: Smart Pricing UI inside the Card */}
        <div className="card-price-row">
          <span className="card-current-price">₹{sellingPrice.toLocaleString()}</span>
          {discountPct > 0 && (
            <>
              <span className="card-strike-mrp">₹{mrp.toLocaleString()}</span>
              <span className="card-discount-tag">{discountPct}% OFF</span>
            </>
          )}
        </div>
      </div>

      <div className="card-actions">
        <button
          className="btn-add-small"
          onClick={() => onAdd(product)}
          disabled={product.stock <= 0}
          style={{ opacity: product.stock <= 0 ? 0.5 : 1, cursor: product.stock <= 0 ? 'not-allowed' : 'pointer' }}
        >
          {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
        <button className="btn-explore" onClick={() => onExplore(product)}>Explore</button>
      </div>
    </div>
  );
};

export default ProductCard;