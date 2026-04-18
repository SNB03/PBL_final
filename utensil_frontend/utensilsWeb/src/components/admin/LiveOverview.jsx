// src/components/admin/LiveOverview.jsx
import React, { useState, useEffect } from 'react';

const LiveOverview = () => {
  const [liveMetrics, setLiveMetrics] = useState({ revenueToday: 0, ordersToPack: 0, actionRequired: 0 });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dashboard/live-overview`);
        if (response.ok) {
          const data = await response.json();
          setLiveMetrics(data);
        }
      } catch (error) {
        console.error("Backend not running or unreachable:", error);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchDashboardMetrics();
    const intervalId = setInterval(fetchDashboardMetrics, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="admin-section animate-fade-in">
      <div className="admin-header"><h2>Today's Operations</h2></div>
      {isLoadingMetrics ? (
        <p>Loading live data from server...</p>
      ) : (
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Revenue (Today)</h3>
            <p className="metric-value">₹{liveMetrics.revenueToday.toLocaleString()}</p>
          </div>
          <div className="metric-card">
            <h3>Orders to Pack</h3>
            <p className="metric-value text-orange">{liveMetrics.ordersToPack}</p>
          </div>
          <div className="metric-card">
            <h3>Action Required</h3>
            <p className="metric-value text-red">{liveMetrics.actionRequired} Alerts</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveOverview;