// src/components/admin/InventoryManager.jsx
import React, { useState, useMemo } from 'react';
import './InventoryManager.css'; // 👉 IMPORT CSS

const InventoryManager = ({ inventory, setInventory, fetchInventory }) => {
  // --- FILTER STATES ---
  const [invSearch, setInvSearch] = useState('');
  const [invCat, setInvCat] = useState('All');
  const [invSubCat, setInvSubCat] = useState('All');
  const [dynamicFilters, setDynamicFilters] = useState({});
  const [stockFilter, setStockFilter] = useState('All');
const [deletingProduct, setDeletingProduct] = useState(null);
  // --- MODAL STATES ---
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // 2. Add this helper function right above your handlers
    const showToast = (message, type = 'success') => {
      setToast({ visible: true, message, type });
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'success' });
      }, 3000);
    };

  const clearFilters = () => {
    setInvSearch('');
    setInvCat('All');
    setInvSubCat('All');
    setDynamicFilters({});
    setStockFilter('All');
  };

  const hasActiveFilters =
    invSearch !== '' || invCat !== 'All' || invSubCat !== 'All' ||
    stockFilter !== 'All' || Object.values(dynamicFilters).some(val => val !== 'All');

  // --- CASCADING DYNAMIC FILTERS LOGIC ---
  const availableCategories = ['All', ...new Set(inventory.map(i => i.category).filter(Boolean))];
  const availableSubCats = invCat === 'All' ? [] : [...new Set(inventory.filter(i => i.category === invCat).map(i => i.subcategory).filter(Boolean))];

  const availableAttributes = useMemo(() => {
    if (invSubCat === 'All') return {};
    const attrsMap = {};
    const relevantProducts = inventory.filter(i => i.category === invCat && i.subcategory === invSubCat);
    relevantProducts.forEach(product => {
      if (product.attrs) {
        Object.entries(product.attrs).forEach(([key, value]) => {
          if (!attrsMap[key]) attrsMap[key] = new Set();
          attrsMap[key].add(value);
        });
      }
    });
    const finalMap = {};
    Object.keys(attrsMap).forEach(key => { finalMap[key] = ['All', ...Array.from(attrsMap[key])]; });
    return finalMap;
  }, [inventory, invCat, invSubCat]);

  // THE FINAL FILTER ENGINE
  const filteredInventory = inventory.filter(item => {
    if (invSearch && !item.name.toLowerCase().includes(invSearch.toLowerCase())) return false;
    if (invCat !== 'All' && item.category !== invCat) return false;
    if (invSubCat !== 'All' && item.subcategory !== invSubCat) return false;
    if (stockFilter === 'Out' && item.stock > 0) return false;
    if (stockFilter === 'Low' && (item.stock === 0 || item.stock > 5)) return false;
    for (const [attrKey, selectedValue] of Object.entries(dynamicFilters)) {
      if (selectedValue !== 'All') {
        if (!item.attrs || item.attrs[attrKey] !== selectedValue) return false;
      }
    }
    return true;
  });

  // --- HANDLERS ---
  const handleDynamicFilterChange = (key, value) => {
    setDynamicFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}/stock?stock=${newStock}`, { method: 'PATCH' });
      if (res.ok) {
        setInventory(inventory.map(i => i.id === productId ? { ...i, stock: Number(newStock) } : i));
        // 👉 REPLACED ALERT WITH TOAST
                showToast("Stock updated successfully!", "success");
      }
    } catch (err) { alert("Server error."); }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Delete "${productName}" from the catalog permanently?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) setInventory(inventory.filter(i => i.id !== productId));
    } catch (err) { alert("Server error."); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      if (res.ok) {
        const updatedProduct = await res.json();
        setInventory(inventory.map(i => i.id === updatedProduct.id ? updatedProduct : i));
        setEditingProduct(null);
        showToast("Product updated successfully!", "success");
      }
    } catch (err) { alert("Server error."); }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/bulk-upload`, { method: 'POST', body: formData });
      if (res.ok) { alert(`✅ Success!`); fetchInventory(); }
    } catch (error) { alert("Server error."); } finally { e.target.value = null; }
  };
const promptDeleteProduct = (product) => {
    setDeletingProduct(product);
  };
// 👉 NEW: The actual API call happens when they click "Yes, Delete" inside the modal
  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${deletingProduct.id}`, { method: 'DELETE' });

      if (res.ok || res.status === 204) {
        setInventory(inventory.filter(i => i.id !== deletingProduct.id));
        showToast(`Deleted "${deletingProduct.name}"`, "success");
      } else {
        showToast("Failed to delete product.", "error");
      }
    } catch (err) {
      showToast("Server error.", "error");
    } finally {
      setDeletingProduct(null); // Close the modal regardless of success/fail
    }
  };
  return (
    <div className="admin-section animate-fade-in relative">

      {/* HEADER */}
      <div className="admin-header flex-between">
        <h2>Inventory Management</h2>
        <div className="bulk-upload-area">
          <input type="file" id="csv-upload" accept=".csv" onChange={handleBulkUpload} style={{ display: 'none' }} />
          <label htmlFor="csv-upload" className="btn-bulk-upload">📄 Bulk Upload (CSV)</label>
        </div>
      </div>

      {/* QUICK STOCK FILTERS */}
      <div className="quick-stock-tabs">
        <button className={`m-tab ${stockFilter === 'All' ? 'active' : ''}`} onClick={() => setStockFilter('All')}>
          Full Catalog ({inventory.length})
        </button>
        <button className={`m-tab ${stockFilter === 'Low' ? 'active' : ''}`} onClick={() => setStockFilter('Low')} style={{ color: stockFilter === 'Low' ? '#f59e0b' : '' }}>
          Low Stock ({inventory.filter(i => i.stock > 0 && i.stock <= 5).length})
        </button>
        <button className={`m-tab ${stockFilter === 'Out' ? 'active' : ''}`} onClick={() => setStockFilter('Out')} style={{ color: stockFilter === 'Out' ? '#ef4444' : '' }}>
          Out of Stock ({inventory.filter(i => i.stock === 0).length})
        </button>
      </div>

      {/* CASCADING FILTER PANEL */}
      <div className="deep-filter-panel">
        <div className="filter-header">
          <h3>🔍 Search & Filter</h3>
          {hasActiveFilters ? (
            <button onClick={clearFilters} className="btn-clear-filters">✖ Clear All Filters</button>
          ) : (
            <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Showing all products</span>
          )}
        </div>

        <div className="filter-row">
          <div className="filter-search-box">
            <span className="icon" style={{position:'absolute', left:'10px', top:'10px'}}>🔍</span>
            <input type="text" className="filter-search-input" placeholder="Search product name..." value={invSearch} onChange={(e) => setInvSearch(e.target.value)} />
          </div>

          <select className="filter-select" value={invCat} onChange={(e) => { setInvCat(e.target.value); setInvSubCat('All'); setDynamicFilters({}); }}>
            {availableCategories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>)}
          </select>

          {availableSubCats.length > 0 && (
            <select className="filter-select" value={invSubCat} onChange={(e) => { setInvSubCat(e.target.value); setDynamicFilters({}); }}>
              <option value="All">All Subcategories</option>
              {availableSubCats.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          )}

          {Object.keys(availableAttributes).map(attrKey => (
            <select key={attrKey} className="filter-select dynamic-attr" value={dynamicFilters[attrKey] || 'All'} onChange={(e) => handleDynamicFilterChange(attrKey, e.target.value)}>
              <option value="All">Any {attrKey}</option>
              {availableAttributes[attrKey].filter(val => val !== 'All').map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead><tr><th>Product Details</th><th>Category</th><th>Stock</th><th>Quick Actions</th></tr></thead>
          <tbody>
            {filteredInventory.map(item => (
              <tr key={item.id}>
                <td className="font-bold">
                  {item.name}<br/>
                  <span className="sub-text text-orange">₹{item.price}</span>
                </td>
                <td><span className="category-pill">{item.category} {item.subcategory ? `> ${item.subcategory}` : ''}</span></td>
                <td>
                  {item.stock === 0 ? <span className="stock-badge out">Out</span> :
                   item.stock <= 5 ? <span className="stock-badge low">{item.stock} Left</span> :
                   <span className="stock-badge good">{item.stock} in Stock</span>}
                </td>
                <td>
                  <div className="quick-update-group">
                    <input type="number" defaultValue={item.stock} min="0" id={`stock-${item.id}`} className="stock-input" />
                    <button className="btn-update" onClick={() => handleStockUpdate(item.id, document.getElementById(`stock-${item.id}`).value)}>Save</button>

                    <button className="btn-icon btn-view" onClick={() => setViewingProduct(item)} title="View Full Details">👁️</button>
                    <button className="btn-icon btn-edit" onClick={() => setEditingProduct(item)} title="Edit Product">✏️</button>
                   <button className="btn-icon btn-delete" onClick={() => promptDeleteProduct(item)} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* =========================================
          MODAL 1: VIEW FULL PRODUCT DETAILS
          ========================================= */}
      {viewingProduct && (
        <div className="modal-overlay" onClick={() => setViewingProduct(null)}>
          <div className="modal-content-large animate-slide-up" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <h2>Product Specifications</h2>
              <button className="btn-close" onClick={() => setViewingProduct(null)}>✖</button>
            </div>

            <div className="modal-body-split">
              <div className="modal-img-container">
                {viewingProduct.img ? (viewingProduct.img.startsWith('http') ? <img src={viewingProduct.img} alt={viewingProduct.name} /> : viewingProduct.img) : '📦'}
              </div>

              <div className="modal-details">
                <h1>{viewingProduct.name}</h1>
                <p className="modal-price-row">
                  ₹{viewingProduct.price}
                  {viewingProduct.originalPrice && <span className="modal-old-price">₹{viewingProduct.originalPrice}</span>}
                </p>

                <div className="modal-stock-row">
                  <span className="category-pill">{viewingProduct.category} {viewingProduct.subcategory ? `> ${viewingProduct.subcategory}` : ''}</span>
                  {viewingProduct.stock === 0 ? <span className="stock-badge out">Out of Stock</span> :
                   viewingProduct.stock <= 5 ? <span className="stock-badge low">{viewingProduct.stock} Left in Warehouse</span> :
                   <span className="stock-badge good">{viewingProduct.stock} Available in Warehouse</span>}
                </div>

                <p className="modal-desc">{viewingProduct.shortDesc || "No description provided."}</p>
              </div>
            </div>

            <div className="modal-attributes-section">
              <h3>Technical & Variant Attributes</h3>
              {viewingProduct.attrs && Object.keys(viewingProduct.attrs).length > 0 ? (
                <div className="attributes-grid">
                  {Object.entries(viewingProduct.attrs).map(([key, value]) => (
                    <div key={key} className="attr-card">
                      <span className="attr-label">{key}</span>
                      <span className="attr-value">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8' }}>No specific variant attributes recorded for this product.</p>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-action primary" onClick={() => { setEditingProduct(viewingProduct); setViewingProduct(null); }}>✏️ Edit Product</button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: EDIT PRODUCT
          ========================================= */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-content-small" onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Edit Product</h2>
              <button className="btn-close" onClick={() => setEditingProduct(null)}>✖</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" className="form-input" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                <div className="form-group flex-1">
                  <label>Price (₹)</label>
                  <input type="number" className="form-input" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} required />
                </div>
                <div className="form-group flex-1">
                  <label>Original Price (₹)</label>
                  <input type="number" className="form-input" value={editingProduct.originalPrice || ''} onChange={e => setEditingProduct({...editingProduct, originalPrice: e.target.value})} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Short Description</label>
                <textarea className="form-textarea" value={editingProduct.shortDesc || ''} onChange={e => setEditingProduct({...editingProduct, shortDesc: e.target.value})} rows="3" />
              </div>

              <button type="submit" className="btn-action primary" style={{ width: '100%', marginTop: '25px', padding: '15px', fontSize: '1.1rem' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}
  {/* =========================================
            MODAL 3: DELETE CONFIRMATION
            ========================================= */}
        {deletingProduct && (
          <div className="modal-overlay" onClick={() => setDeletingProduct(null)}>
            <div className="modal-content-mini animate-slide-up" onClick={e => e.stopPropagation()}>

              <div className="warning-icon">🗑️</div>
              <h2>Delete Product?</h2>

              <p>
                Are you sure you want to permanently delete <strong>"{deletingProduct.name}"</strong>?
                This action cannot be undone.
              </p>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeletingProduct(null)}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={confirmDeleteProduct}>
                  Yes, Delete
                </button>
              </div>

            </div>
          </div>
        )}
  {/* =========================================
            CUSTOM TOAST NOTIFICATION
            ========================================= */}
        {toast.visible && (
          <div className={`custom-toast toast-${toast.type}`}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.message}
          </div>
        )}
    </div>
  );
};

export default InventoryManager;