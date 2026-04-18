// src/components/admin/StaffManagement.jsx
import React, { useState, useEffect } from 'react';
import './StaffManagement.css';

const StaffManagement = () => {
  const [deliveryStaff, setDeliveryStaff] = useState([]);

  // 👉 NEW: Tab State
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'add'

  // 👉 NEW: Added 'role' to state (defaulting to RIDER)
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', alternatePhone: '', role: 'RIDER' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingStaff, setDeletingStaff] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [pinModal, setPinModal] = useState({ visible: false, data: null });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/config/staff`);
      if (res.ok) setDeliveryStaff(await res.json());
    } catch (err) {
      showToast("Failed to fetch staff list.", "error");
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  // Strict Phone Validation
  const validatePhoneNumbers = () => {
    if (!/^\d{10}$/.test(newStaff.phone)) {
      showToast("Primary phone must be exactly 10 digits.", "error");
      return false;
    }
    if (newStaff.alternatePhone) {
      if (!/^\d{10}$/.test(newStaff.alternatePhone)) {
        showToast("Alternate phone must be exactly 10 digits.", "error");
        return false;
      }
      if (newStaff.phone === newStaff.alternatePhone) {
        showToast("Primary and Alternate numbers cannot be the same.", "warning");
        return false;
      }
    }

    const isDuplicate = deliveryStaff.some(staff => {
      const allExistingNumbers = [staff.phone, staff.alternatePhone].filter(Boolean);
      return allExistingNumbers.includes(newStaff.phone) ||
             (newStaff.alternatePhone && allExistingNumbers.includes(newStaff.alternatePhone));
    });

    if (isDuplicate) {
      showToast("This phone number is already registered to another staff member.", "error");
      return false;
    }
    return true;
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!validatePhoneNumbers()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/config/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff)
      });

      if (res.ok) {
        const savedData = await res.json();
        setPinModal({ visible: true, data: savedData });
        showToast(`${savedData.name} registered successfully!`, "success");

        // Reset form and switch back to manage tab
        setNewStaff({ name: '', phone: '', alternatePhone: '', role: 'RIDER' });
        fetchStaff();
        setActiveTab('manage');
      } else {
        showToast("Failed to register. Server rejected the request.", "error");
      }
    } catch (err) {
      showToast("Server connection error.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteStaff = async () => {
    if (!deletingStaff) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/config/staff/${deletingStaff.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeliveryStaff(deliveryStaff.filter(s => s.id !== deletingStaff.id));
        showToast(`Removed ${deletingStaff.name} from the system.`, "success");
      } else {
        showToast("Failed to delete staff member.", "error");
      }
    } catch (err) {
      showToast("Server error.", "error");
    } finally {
      setDeletingStaff(null);
    }
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="admin-section animate-fade-in relative">

      <div className="admin-header">
        <h2>Personnel Management</h2>
        <p>Register new employees, assign roles, and track active staff.</p>
      </div>

      {/* 👉 NEW: TAB NAVIGATION */}
      <div className="staff-tabs">
        <button
          className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          👥 View & Manage Staff
        </button>
        <button
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          ➕ Register New Employee
        </button>
      </div>

      {/* ==============================================
          TAB 1: MANAGE STAFF (TABLE & STATS)
          ============================================== */}
      {activeTab === 'manage' && (
        <div className="animate-fade-in">
          <div className="fleet-summary">
            <div className="stat-card">
              <div className="stat-icon icon-blue">👥</div>
              <div className="stat-details">
                <h4>Total Staff</h4>
                <p>{deliveryStaff.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-green">🛵</div>
              <div className="stat-details">
                <h4>Delivery Riders</h4>
                <p>{deliveryStaff.filter(s => s.role === 'RIDER' || !s.role).length}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-purple">🏪</div>
              <div className="stat-details">
                <h4>Shop Workers</h4>
                <p>{deliveryStaff.filter(s => s.role === 'SHOP_WORKER').length}</p>
              </div>
            </div>
          </div>

          <div className="staff-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Employee Profile</th>
                  <th>Role</th>
                  <th>Contact Information</th>
                  <th>Login PIN</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {deliveryStaff.map(staff => (
                  <tr key={staff.id}>
                    <td>
                      <div className="rider-profile">
                        <div className="rider-avatar">{getInitials(staff.name)}</div>
                        <div className="rider-name-box">
                          <span className="rider-id">ID: E-0{staff.id}</span>
                          <span className="rider-name">{staff.name}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${staff.role === 'SHOP_WORKER' ? 'role-worker' : 'role-rider'}`}>
                        {staff.role === 'SHOP_WORKER' ? '🏪 Shop Worker' : '🛵 Rider'}
                      </span>
                    </td>
                    <td>
                      <div className="contact-box">
                        <span className="rider-phone">📞 {staff.phone}</span>
                        {staff.alternatePhone && <span className="rider-alt-phone">Alt: {staff.alternatePhone}</span>}
                      </div>
                    </td>
                    <td><span className="pin-badge">{staff.pin}</span></td>
                    <td>
                      <span className={`status-badge ${staff.active ? 'status-active' : 'status-inactive'}`}>
                        {staff.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-delete-icon" onClick={() => setDeletingStaff(staff)} title="Remove Employee">Remove</button>
                    </td>
                  </tr>
                ))}
                {deliveryStaff.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      No staff registered yet. Go to the "Register" tab to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==============================================
          TAB 2: ADD STAFF (FORM)
          ============================================== */}
      {activeTab === 'add' && (
        <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="staff-form-panel">
            <form onSubmit={handleAddStaff}>
              <h3>➕ Register New Employee</h3>

              {/* 👉 NEW: Role Selector */}
              <div className="form-group">
                <label>Job Role</label>
                <div className="input-icon-wrapper">
                  <span>💼</span>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                    required
                  >
                    <option value="RIDER">Delivery Rider (On-field)</option>
                    <option value="SHOP_WORKER">Shop Worker (In-store)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <div className="input-icon-wrapper">
                  <span>👤</span>
                  <input
                    type="text"
                    placeholder="e.g., Ramesh Kumar"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Primary Phone Number (Login ID)</label>
                <div className="input-icon-wrapper">
                  <span>📱</span>
                  <input
                    type="tel"
                    maxLength="10"
                    placeholder="10-digit mobile number"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value.replace(/\D/g, '')})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Alternate Number (Optional)</label>
                <div className="input-icon-wrapper">
                  <span>☎️</span>
                  <input
                    type="tel"
                    maxLength="10"
                    placeholder="Backup contact number"
                    value={newStaff.alternatePhone}
                    onChange={(e) => setNewStaff({...newStaff, alternatePhone: e.target.value.replace(/\D/g, '')})}
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Generating Credentials...' : 'Register & Generate PIN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODALS & TOASTS
          ========================================= */}

      {/* PIN SUCCESS MODAL */}
      {pinModal.visible && (
        <div className="modal-overlay" onClick={() => setPinModal({ visible: false, data: null })}>
          <div className="modal-content-mini animate-slide-up" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>🎉</div>
            <h2>{pinModal.data.role === 'SHOP_WORKER' ? 'Worker' : 'Rider'} Registered!</h2>
            <p style={{ marginBottom: '15px' }}>Provide these credentials to <strong>{pinModal.data.name}</strong> so they can log into their portal.</p>

            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '25px', textAlign: 'left' }}>
              <p style={{ margin: '0 0 10px 0', color: '#475569' }}><strong>Login ID (Phone):</strong> <br/><span style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 'bold' }}>{pinModal.data.phone}</span></p>
              <p style={{ margin: 0, color: '#475569' }}><strong>Password (PIN):</strong> <br/><span className="pin-badge" style={{ fontSize: '1.5rem', display: 'inline-block', marginTop: '5px' }}>{pinModal.data.pin}</span></p>
            </div>

            <button className="btn-submit" style={{ marginTop: 0 }} onClick={() => setPinModal({ visible: false, data: null })}>
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingStaff && (
        <div className="modal-overlay" onClick={() => setDeletingStaff(null)}>
          <div className="modal-content-mini animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="warning-icon">🗑️</div>
            <h2>Remove Employee?</h2>
            <p>
              Are you sure you want to permanently remove <strong>{deletingStaff.name}</strong> from the system? They will no longer be able to log in.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeletingStaff(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDeleteStaff}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast.visible && (
        <div className={`custom-toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '❌'} {toast.message}
        </div>
      )}

    </div>
  );
};

export default StaffManagement;