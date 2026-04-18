// src/pages/Shop.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import './Shop.css';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [toast, setToast] = useState({ visible: false, message: '' });

  // 👉 NEW: Store single selected value for dropdowns
  const [activeAttributes, setActiveAttributes] = useState({});
  // 👉 NEW: Price Range State
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const selectedCategory = searchParams.get('category') || 'All';
  const selectedSubcategory = searchParams.get('subcategory') || 'All';

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products?size=500&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          const productsArray = Array.isArray(data) ? data : (data.content || []);

         // Shop.jsx - Update this mapping!
                   const formattedProducts = productsArray.map(p => ({
                     ...p, // 👉 THIS IS THE MAGIC LINE YOU MISSED!
                     id: p.id,
                     name: p.name || 'Unnamed',
                     category: p.category || 'General',
                     subcategory: p.subcategory || 'General',
                     price: p.price || 0,
                     img: p.img || p.imageUrl || p.image || '📦',
                     tag: p.tag || '',
                     stock: p.stock || 0,
                     attrs: p.attributes || p.attrs || p.specs || {}
                   }));
          setProducts(formattedProducts.filter(p => p.stock > 0));
        }
      } catch (err) { console.error("Failed to load catalog."); }
      finally { setIsLoading(false); }
    };
    fetchCatalog();
  }, []);

  // Reset attributes and price range when changing master categories
  useEffect(() => {
    setActiveAttributes({});
    setPriceRange({ min: '', max: '' });
  }, [selectedCategory, selectedSubcategory]);

  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category).filter(Boolean))].sort(), [products]);

  const subcategories = useMemo(() => {
    if (selectedCategory === 'All') return [];
    return ['All', ...new Set(products.filter(p => p.category === selectedCategory && p.subcategory).map(p => p.subcategory))].sort();
  }, [products, selectedCategory]);

const availableAttributes = useMemo(() => {
    let baseProducts = products;
    if (selectedCategory !== 'All') baseProducts = baseProducts.filter(p => p.category === selectedCategory);
    if (selectedSubcategory !== 'All') baseProducts = baseProducts.filter(p => p.subcategory === selectedSubcategory);

    const attrMap = {};

    // 👉 NEW: Keys to explicitly ignore when building the dropdown filters
    const ignoredKeys = ['longdesc','shortdesc','description','originalpri', 'original price', 'originalprice', 'price', 'sku', 'id', 'info'];

    baseProducts.forEach(p => {
      Object.entries(p.attrs).forEach(([key, val]) => {
        // 1. Skip ignored keys
        if (ignoredKeys.includes(key.toLowerCase())) return;

        // 2. Skip complex objects or excessively long text (like paragraphs)
        if (typeof val === 'object' || String(val).length > 30) return;

        if (!attrMap[key]) attrMap[key] = new Set();
        attrMap[key].add(val);
      });
    });

    const finalAttrs = {};
    // Only turn it into a dropdown if there is more than 1 option to choose from!
    for (let key in attrMap) {
      if (attrMap[key].size > 1) finalAttrs[key] = Array.from(attrMap[key]).sort();
    }
    return finalAttrs;
  }, [products, selectedCategory, selectedSubcategory]);

  const displayedProducts = useMemo(() => {
    let result = [...products];

    // 1. Category Filters
    if (selectedCategory !== 'All') result = result.filter(p => p.category === selectedCategory);
    if (selectedSubcategory !== 'All') result = result.filter(p => p.subcategory === selectedSubcategory);

    // 2. Search Filter
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.category && p.category.toLowerCase().includes(lowerQuery)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(lowerQuery))
      );
    }

    // 👉 3. Updated Attribute Filter (Exact Match)
    if (Object.keys(activeAttributes).length > 0) {
      result = result.filter(p => Object.entries(activeAttributes).every(([attrKey, selectedVal]) => {
        return p.attrs[attrKey] === selectedVal;
      }));
    }

    // 👉 4. NEW: Price Range Filter
    if (priceRange.min !== '') {
      result = result.filter(p => p.price >= Number(priceRange.min));
    }
    if (priceRange.max !== '') {
      result = result.filter(p => p.price <= Number(priceRange.max));
    }

    // 5. Sorting
    if (sortOrder === 'price-low') result.sort((a, b) => a.price - b.price);
    else if (sortOrder === 'price-high') result.sort((a, b) => b.price - a.price);
    else if (sortOrder === 'default') {
      const isSummerFestive = new Date().getMonth() >= 2 && new Date().getMonth() <= 5;
      const userFav = user ? "Cookware" : null;

      result.sort((a, b) => {
        let scoreA = 0; let scoreB = 0;
        if (isSummerFestive) {
          if (a.category === 'Serveware') scoreA += 10;
          if (b.category === 'Serveware') scoreB += 10;
        }
        if (userFav) {
          if (a.category === userFav) scoreA += 5;
          if (b.category === userFav) scoreB += 5;
        }
        if (a.tag) scoreA += 2;
        if (b.tag) scoreB += 2;
        return scoreB - scoreA;
      });
    }

    return result;
  }, [products, selectedCategory, selectedSubcategory, searchQuery, activeAttributes, priceRange, sortOrder, user]);

  const groupedProducts = useMemo(() => {
    const groups = {};
    if (displayedProducts.length === 0) return groups;

    if (selectedCategory === 'All') {
      displayedProducts.forEach(p => {
        const groupName = p.category || 'Uncategorized';
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(p);
      });
    } else {
      displayedProducts.forEach(p => {
        const groupName = p.subcategory || 'General Items';
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(p);
      });
    }

    return groups;
  }, [displayedProducts, selectedCategory]);

  // --- HANDLERS ---
  const handleCategorySelect = (cat) => {
    if (cat === 'All') setSearchParams({});
    else setSearchParams({ category: cat });
  };

  const handleSubcategorySelect = (subcat) => {
    if (subcat === 'All') setSearchParams({ category: selectedCategory });
    else setSearchParams({ category: selectedCategory, subcategory: subcat });
  };

  const handleAttributeSelect = (attrKey, val) => {
    setActiveAttributes(prev => {
      const newAttrs = { ...prev };
      if (val === 'All') delete newAttrs[attrKey];
      else newAttrs[attrKey] = val;
      return newAttrs;
    });
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({ ...prev, [name]: value }));
  };

  const clearAllFilters = () => {
    setActiveAttributes({});
    setPriceRange({ min: '', max: '' });
  };


  return (
    <div className="shop-page-wrapper">
      <Navbar/>

      <div className="shop-container animate-fade-in">
        <div className="shop-header">
          <h1>Store Catalog</h1>
          <p>Discover premium kitchenware tailored to your exact needs.</p>
        </div>

        <div className="shop-layout">

          <aside className="shop-sidebar">
            <div className="filter-card">

              <div className="filter-group">
                <label htmlFor="category-select">Department</label>
                <select
                  id="category-select"
                  className="shop-filter-select"
                  value={selectedCategory}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'All' ? 'All Departments' : cat} ({cat === 'All' ? products.length : products.filter(p => p.category === cat).length})
                    </option>
                  ))}
                </select>
              </div>

              {subcategories.length > 1 && (
                <div className="filter-group animate-fade-in">
                  <label htmlFor="subcategory-select">Product Type</label>
                  <select
                    id="subcategory-select"
                    className="shop-filter-select"
                    value={selectedSubcategory}
                    onChange={(e) => handleSubcategorySelect(e.target.value)}
                  >
                    {subcategories.map(subcat => (
                      <option key={subcat} value={subcat}>
                        {subcat === 'All' ? `All ${selectedCategory}` : subcat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 👉 NEW: Price Range Filter */}
              <div className="filter-group animate-fade-in" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                <label>Price Range (₹)</label>
                <div className="price-range-inputs">
                  <input
                    type="number"
                    name="min"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={handlePriceChange}
                    className="price-input"
                    min="0"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    name="max"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={handlePriceChange}
                    className="price-input"
                    min="0"
                  />
                </div>
              </div>

              {/* 👉 UPDATED: Dynamic Attributes rendered as Dropdowns */}
              {Object.keys(availableAttributes).length > 0 && (
                <div className="attribute-section animate-fade-in" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                  {Object.entries(availableAttributes).map(([attrKey, values]) => (
                    <div key={attrKey} className="filter-group">
                      <label htmlFor={`attr-${attrKey}`}>{attrKey}</label>
                      <select
                        id={`attr-${attrKey}`}
                        className="shop-filter-select"
                        value={activeAttributes[attrKey] || 'All'}
                        onChange={(e) => handleAttributeSelect(attrKey, e.target.value)}
                      >
                        <option value="All">Any {attrKey}</option>
                        {values.map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Clear Filters Button */}
              {(Object.keys(activeAttributes).length > 0 || priceRange.min !== '' || priceRange.max !== '') && (
                <button
                  onClick={clearAllFilters}
                  style={{ width: '100%', marginTop: '10px', padding: '12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Clear Adjustments
                </button>
              )}

            </div>
          </aside>

          <main className="shop-main">
            <div className="shop-controls">
              <div className="shop-search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="shop-search-input"
                  placeholder="Search for cookers, tawas, knives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select className="shop-sort-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="default">✨ Smart Recommended (FSDP)</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}><h2 style={{ color: '#64748b' }}>Loading Catalog...</h2></div>
            ) : displayedProducts.length > 0 ? (
              <div>
                {Object.entries(groupedProducts).map(([groupName, groupItems]) => (
                  <div key={groupName} className="category-group-section animate-fade-in" style={{ marginBottom: '50px' }}>

                    <div className="category-group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>
                      <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>{groupName}</h2>
                      <span style={{ color: '#64748b', fontWeight: 'bold' }}>{groupItems.length} Items</span>
                    </div>

                    <div className="shop-product-grid">
                      {groupItems.map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAdd={(p) => { addToCart(p, 1); showToast(`${p.name} added!`); }}
                          onExplore={(p) => navigate(`/product/${p.id}`)}
                        />
                      ))}
                    </div>

                  </div>
                ))}
              </div>

            ) : (
              <div className="shop-empty-state" style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '3rem' }}>🤔</span>
                <h3 style={{ color: '#0f172a', margin: '15px 0' }}>No products match your exact filters.</h3>
                <button
                  onClick={() => { setSearchQuery(''); clearAllFilters(); handleCategorySelect('All'); }}
                  style={{ marginTop: '10px', padding: '12px 25px', backgroundColor: '#0f172a', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {toast.visible && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', backgroundColor: '#10b981', color: 'white', padding: '15px 25px', borderRadius: '12px', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s ease-out' }}>
          ✅ {toast.message}
        </div>
      )}
    </div>
  );
};

export default Shop;