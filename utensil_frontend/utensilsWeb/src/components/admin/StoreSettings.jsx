// src/components/admin/StoreSettings.jsx
import React, { useState, useEffect } from 'react';
import './StoreSettings.css';

const StoreSettings = () => {
  const [settings, setSettings] = useState({
    maxRadius: 10,
    ratePerKm: 10,
    freeDeliveryThreshold: 999
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/config/settings`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setSettings(data);
      })
      .catch(err => {
        console.error(err);
        showToast("Failed to load current settings", "error");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/config/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        showToast("Logistics Configuration Saved Successfully!", "success");
      } else {
        showToast("Failed to save settings to database.", "error");
      }
    } catch (err) {
      showToast("Server connection error.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-container animate-fade-in relative">

      <div className="settings-header">
        <h2>Store Logistics & Configuration</h2>
        <p>Control delivery boundaries, dynamic pricing, and checkout thresholds.</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '15px', color: '#64748b' }}>Loading configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSettingsSave}>

          <div className="settings-card">
            <h3>🚚 Delivery Boundaries & Pricing</h3>

            <div className="settings-grid">

              {/* Max Radius */}
              <div className="form-group">
                <label className="form-label">Maximum Delivery Radius</label>
                <p className="form-helper">Customers beyond this distance will only see the "Store Pickup" option.</p>
                <div className="input-with-addon">
                  <input
                    type="number"
                    min="1"
                    className="settings-input"
                    value={settings.maxRadius}
                    onChange={(e) => setSettings({...settings, maxRadius: Number(e.target.value)})}
                    required
                  />
                  <span className="input-addon right">km</span>
                </div>
              </div>

              {/* Rate per KM */}
              <div className="form-group">
                <label className="form-label">Dynamic Delivery Rate</label>
                <p className="form-helper">Base fee charged per kilometer to calculate total delivery cost.</p>
                <div className="input-with-addon">
                  <span className="input-addon">₹</span>
                  <input
                    type="number"
                    min="0"
                    className="settings-input"
                    value={settings.ratePerKm}
                    onChange={(e) => setSettings({...settings, ratePerKm: Number(e.target.value)})}
                    required
                  />
                  <span className="input-addon right">/ km</span>
                </div>
              </div>

            </div>
          </div>

          <div className="settings-card">
            <h3>🎁 Promotional Settings</h3>

            <div className="form-group">
              <label className="form-label">Free Delivery Threshold</label>
              <p className="form-helper">If a customer's cart total exceeds this amount, delivery is completely free.</p>
              <div className="input-with-addon" style={{ maxWidth: '400px' }}>
                <span className="input-addon">₹</span>
                <input
                  type="number"
                  min="0"
                  className="settings-input"
                  value={settings.freeDeliveryThreshold}
                  onChange={(e) => setSettings({...settings, freeDeliveryThreshold: Number(e.target.value)})}
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-save-settings" disabled={isSaving}>
            {isSaving ? 'Saving Configuration...' : 'Save Configuration'}
          </button>
        </form>
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

export default StoreSettings;