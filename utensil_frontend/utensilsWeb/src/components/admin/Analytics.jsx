// src/components/admin/Analytics.jsx
import React, { useState, useEffect } from 'react';
import './Analytics.css';

const Analytics = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAiInsights = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/ai-insights`);
        if (res.ok) setAiInsight(await res.json());
      } catch (e) {
        console.error("AI Engine disconnected.");
      }
    };
    fetchAiInsights();
  }, []);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/orders`),
          fetch(`${import.meta.env.VITE_API_URL}/api/products?size=500`)
        ]);

        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (productsRes.ok) {
          const pData = await productsRes.json();
          setProducts(pData.content || pData);
        }
      } catch (err) {
        console.error("Failed to fetch analytics data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalyticsData();
  }, []);

  // ==========================================
  // DATA CRUNCHING: REVENUE TREND
  // ==========================================
  const monthlyRevenue = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const d = new Date();
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const targetMonth = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const label = monthNames[targetMonth.getMonth()];
    last6Months.push(label);
    monthlyRevenue[label] = 0;
  }

  orders.forEach(order => {
    if (['COMPLETED', 'DELIVERED'].includes(order.status)) {
      const orderDate = new Date(order.orderDate);
      const label = monthNames[orderDate.getMonth()];
      if (monthlyRevenue[label] !== undefined) {
        monthlyRevenue[label] += order.total;
      }
    }
  });

  // Calculate dynamic Y-Axis Grid
  const maxRev = Math.max(...Object.values(monthlyRevenue), 1000);
  // Round up to nearest nice number for the graph (e.g., 42000 -> 50000)
  const chartMax = Math.ceil(maxRev / 10000) * 10000;
  const yAxisLabels = [chartMax, chartMax * 0.75, chartMax * 0.5, chartMax * 0.25, 0];

  // ==========================================
  // DATA CRUNCHING: TOP SELLERS
  // ==========================================
  const productSales = {};
  orders.forEach(order => {
    if (['COMPLETED', 'DELIVERED'].includes(order.status)) {
      order.itemsList.forEach(item => {
        if (!productSales[item.name]) productSales[item.name] = 0;
        productSales[item.name] += item.qty;
      });
    }
  });

  const topSellers = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStockItems = products.filter(p => p.stock === 0);

  // --- UI RENDER HELPER ---
  const formatCurrency = (num) => `₹${num >= 1000 ? (num/1000).toFixed(1) + 'k' : num}`;

  return (
    <div className="analytics-container">

      <div className="analytics-header">
        <h2>Business Analytics & Trends</h2>
        <p>Real-time revenue tracking and predictive FSDP insights.</p>
      </div>

      <div className="analytics-layout">

        {/* LEFT COLUMN: CHARTS & TABLES */}
        <div className="analytics-left">

          <div className="analytics-card">
            <h3>Revenue Trend (Last 6 Months)</h3>

            {isLoading ? (
              <div className="skeleton-pulse" style={{ height: '250px' }}></div>
            ) : (
              <div className="pro-chart-container">
                {/* Y-Axis Labels */}
                <div className="chart-y-axis">
                  {yAxisLabels.map((val, idx) => <span key={idx}>{formatCurrency(val)}</span>)}
                </div>

                {/* Plot Area */}
                <div className="chart-plot-area">
                  {/* Grid Lines */}
                  {yAxisLabels.slice(0,4).map((_, idx) => (
                    <div key={idx} className="grid-line" style={{ top: `${idx * 25}%` }}></div>
                  ))}

                  {/* Bars */}
                  {last6Months.map((monthLabel, index) => {
                    const revenue = monthlyRevenue[monthLabel];
                    // Height percentage relative to our rounded chartMax
                    const heightPct = Math.max((revenue / chartMax) * 100, 2); // Minimum 2% visibility
                    const isCurrentMonth = index === 5;

                    return (
                      <div key={monthLabel} className="bar-group">
                        <div className="chart-tooltip">₹{revenue.toLocaleString()}</div>
                        <div
                          className="bar-fill"
                          style={{
                            height: `${heightPct}%`,
                            backgroundColor: isCurrentMonth ? '#10b981' : '#3b82f6'
                          }}
                        ></div>
                        <span className="x-axis-label">{monthLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="analytics-card">
            <h3>Top Selling Products (All Time)</h3>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton-pulse" style={{ height: '30px' }}></div>)}
              </div>
            ) : topSellers.length > 0 ? (
              <table className="simple-table">
                <tbody>
                  {topSellers.map(([name, qty], index) => (
                    <tr key={name}>
                      <td><span style={{color: '#94a3b8', marginRight: '10px'}}>{index + 1}.</span> {name}</td>
                      <td className="text-right font-bold">{qty} Units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#64748b' }}>Not enough sales data yet.</p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: AI & INVENTORY INSIGHTS */}
        <div className="analytics-right">

          {/* 1. Live AI FSDP Output */}
          {isLoading ? (
             <div className="skeleton-pulse" style={{ height: '200px', borderRadius: '12px' }}></div>
          ) : aiInsight ? (
            <div className="insight-box ai-insight">
              <div className="insight-icon">🧠</div>
              <div className="insight-content">

                <div className="ai-header-row">
                  <h4 style={{ margin: 0 }}>Live FSDP Model Output</h4>
                  <span className={`confidence-badge ${aiInsight.ai_confidence > 0.8 ? 'high' : 'medium'}`}>
                    {Math.round(aiInsight.ai_confidence * 100)}% Confidence
                  </span>
                </div>

                <div className="ai-reasoning">
                  <strong>Reasoning:</strong> {aiInsight.fsdp_reasoning}
                </div>

                <div className="ai-restock-section">
                  <span className="ai-restock-title">Recommended Restock Actions:</span>
                  <div className="ai-tag-container">
                    {aiInsight.recommended_product_ids.map(id => (
                      <span key={id} className="ai-product-tag">{id}</span>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="insight-box offline">
              <div className="insight-icon">⚙️</div>
              <div className="insight-content">
                <h4>AI Engine Offline</h4>
                <p>Connecting to Python FSDP microservice...</p>
              </div>
            </div>
          )}

          {/* 2. Critical Inventory Warnings */}
          {!isLoading && outOfStockItems.length > 0 ? (
            <div className="insight-box danger">
              <div className="insight-icon">🚨</div>
              <div className="insight-content">
                <h4>Revenue Loss Alert</h4>
                <p><strong>{outOfStockItems.length} products</strong> are out of stock. <br/><em>Action: Immediate restock required.</em></p>
              </div>
            </div>
          ) : !isLoading && lowStockItems.length > 0 ? (
             <div className="insight-box warning">
              <div className="insight-icon">📉</div>
              <div className="insight-content">
                <h4>Inventory Depletion Alert</h4>
                <p><strong>{lowStockItems.length} products</strong> are critically low on stock (Under 5 units). <br/><em>Action: Contact suppliers soon.</em></p>
              </div>
            </div>
          ) : !isLoading && (
             <div className="insight-box healthy">
              <div className="insight-icon">✅</div>
              <div className="insight-content">
                <h4>Healthy Inventory</h4>
                <p>All active products have healthy stock levels. No immediate actions required.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Analytics;