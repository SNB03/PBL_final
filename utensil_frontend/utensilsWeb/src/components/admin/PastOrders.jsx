import React, { useState, useEffect } from 'react';

const PastOrders = () => {
  const [pastOrders, setPastOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [salesTimeframe, setSalesTimeframe] = useState('Month');

  useEffect(() => {
    const fetchPastOrders = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders/past`);
        if (res.ok) setPastOrders(await res.json());
      } catch (err) {
        console.error("Failed to fetch past orders", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPastOrders();
  }, []);

  // Simple aggregation for the sales log based on the fetched orders
  const calculateTotalRevenue = () => {
    return pastOrders.reduce((sum, order) => sum + order.total, 0);
  };

  return (
    <div className="admin-section animate-fade-in">
      <div className="admin-header">
        <h2>Past Orders Log</h2>
        <p>History of all verified and completed orders.</p>
      </div>

      <div className="sales-log-section" style={{marginTop: '0', marginBottom: '30px'}}>
        <div className="flex-between" style={{marginBottom: '15px'}}>
          <h3>Sales & Revenue Logs</h3>
          <select value={salesTimeframe} onChange={(e) => setSalesTimeframe(e.target.value)} className="log-filter">
            <option value="AllTime">All Time</option>
            <option value="Month">This Month</option>
          </select>
        </div>
        <table className="admin-table">
          <thead><tr><th>Metric</th><th>Orders Processed</th><th>Total Revenue</th></tr></thead>
          <tbody>
            <tr>
              <td className="font-bold">Total Aggregate</td>
              <td>{pastOrders.length}</td>
              <td className="font-bold text-green">₹{calculateTotalRevenue().toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead><tr><th>Order ID</th><th>Customer</th><th>Fulfillment</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>Loading history...</td></tr> : null}
            {pastOrders.map(order => (
              <tr key={order.id}>
                <td className="font-bold">{order.id}<br/><span className="sub-text">{new Date(order.orderDate).toLocaleDateString()}</span></td>
                <td>{order.customerName}</td>
                <td><span className={`fulfillment-badge ${order.type === 'Store Pickup' ? 'pickup' : 'delivery'}`}>{order.type}</span></td>
                <td className="font-bold">₹{order.total}</td>
                <td><span className="status-indicator completed">✔️ Completed</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PastOrders;