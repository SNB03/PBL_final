import React, { useState, useEffect, useRef } from 'react';

const NotificationBell = ({ alerts, removeAlert, clearAllAlerts, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if the admin clicks anywhere outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="notification-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>

      {/* THE BELL BUTTON */}
      <button
        className="bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', position: 'relative' }}
      >
        🔔
        {alerts.length > 0 && (
          <span className="bell-badge" style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '50%' }}>
            {alerts.length}
          </span>
        )}
      </button>

      {/* THE DROPDOWN PANEL */}
      {isOpen && (
        <div className="notification-dropdown animate-fade-in" style={{ position: 'absolute', top: '100%', right: '0', width: '320px', backgroundColor: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden', zIndex: 1000, border: '1px solid #e2e8f0', marginTop: '10px' }}>

          <div className="dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: 0, color: '#0f172a' }}>System Alerts</h4>
            {alerts.length > 0 && (
              <span className="clear-all" onClick={clearAllAlerts} style={{ fontSize: '0.85rem', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold' }}>Clear All</span>
            )}
          </div>

          <div className="dropdown-body" style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 0' }}>
            {alerts.length === 0 ? (
              <p className="no-alerts" style={{ textAlign: 'center', padding: '20px', color: '#64748b', margin: 0 }}>You're all caught up!</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={`notification-item ${alert.type}`} style={{ display: 'flex', alignItems: 'flex-start', padding: '12px 20px', borderBottom: '1px solid #f1f5f9', gap: '12px', transition: 'background 0.2s' }}>
                  <div className="notif-icon" style={{ fontSize: '1.2rem' }}>
                    {alert.type === 'danger' ? '🚨' : alert.type === 'warning' ? '⚠️' : '📦'}
                  </div>
                  <div className="notif-content" style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>{alert.msg}</p>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{alert.time}</span>
                  </div>
                  <button className="notif-close" onClick={() => removeAlert(alert.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '1rem' }}>✖</button>
                </div>
              ))
            )}
          </div>

          <div className="dropdown-footer" style={{ padding: '12px', textAlign: 'center', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <button
              className="btn-view-all-alerts"
              onClick={() => { setIsOpen(false); setActiveTab('dashboard'); }}
              style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
            >
              View Dashboard Overview →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;