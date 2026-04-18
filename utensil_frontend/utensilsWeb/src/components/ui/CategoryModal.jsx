// src/components/ui/CategoryModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiCategory } from 'react-icons/bi'; // 👉 NEW: The single universal icon
import './CategoryModal.css';

const CategoryModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [storeCategories, setStoreCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || storeCategories.length > 0) return;

    const fetchDynamicCategories = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products?size=500&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          const productsArray = Array.isArray(data) ? data : (data.content || []);

          const categoryMap = {};

          productsArray.forEach(p => {
            const cat = p.category ? p.category.trim() : 'General';
            const subcat = p.subcategory ? p.subcategory.trim() : '';

            if (!categoryMap[cat]) categoryMap[cat] = new Set();
            if (subcat) categoryMap[cat].add(subcat);
          });

          // 👉 NEW: We apply the single React Icon here to every dynamic category
          const universalIcon = <BiCategory style={{ fontSize: '1.8rem', color: '#3b82f6' }} />;

          const formattedCategories = Object.keys(categoryMap).map(catName => ({
            id: catName,
            name: catName,
            icon: universalIcon,
            subcategories: Array.from(categoryMap[catName]).slice(0, 4)
          }));

          formattedCategories.sort((a, b) => a.name.localeCompare(b.name));
          setStoreCategories(formattedCategories);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic categories.", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDynamicCategories();
  }, [isOpen, storeCategories.length]);

  if (!isOpen) return null;

  const handleCategoryClick = (categoryName) => {
    navigate(`/shop?category=${encodeURIComponent(categoryName)}`);
    onClose();
  };

  const handleSubcategoryClick = (categoryName, subcategoryName) => {
    navigate(`/shop?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`);
    onClose();
  };

  return (
    <div className="cat-modal-overlay" onClick={onClose}>
      <div className="cat-modal-content" onClick={(e) => e.stopPropagation()}>

        <div className="mobile-drag-handle"></div>

        <div className="cat-modal-header">
          <h2>Explore Store</h2>
          <button className="btn-close-cat" onClick={onClose}>✕</button>
        </div>

        <div className="cat-modal-body">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading store catalog...
            </div>
          ) : (
            <div className="cat-grid">
              {storeCategories.map((cat) => (
                <div key={cat.id} className="cat-box">

                  <div className="cat-box-header" onClick={() => handleCategoryClick(cat.name)}>
                    <div className="cat-icon">{cat.icon}</div>
                    <h3>{cat.name}</h3>
                  </div>

                  <ul className="subcat-list">
                    {cat.subcategories.length > 0 ? (
                      cat.subcategories.map((sub, index) => (
                        <li key={index}>
                          <span className="subcat-link" onClick={() => handleSubcategoryClick(cat.name, sub)}>
                            {sub}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li><span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>General Items</span></li>
                    )}

                    <li style={{ marginTop: 'auto', paddingTop: '10px' }}>
                      <span
                        className="subcat-link"
                        onClick={() => handleCategoryClick(cat.name)}
                        style={{ color: '#3b82f6', fontWeight: 'bold' }}
                      >
                        View All {cat.name} →
                      </span>
                    </li>
                  </ul>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;