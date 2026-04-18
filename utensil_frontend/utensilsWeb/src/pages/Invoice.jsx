import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaPrint, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import './Invoice.css';

const Invoice = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        // Fetch all orders for this user and find the specific one
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/customer/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          const foundOrder = data.find(o => o.id.toString() === orderId);
          setOrder(foundOrder);
        }
      } catch (err) {
        console.error("Failed to fetch order for invoice", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
    window.scrollTo(0, 0);
  }, [user, orderId, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <div className="invoice-loading">Generating Invoice...</div>;
  if (!order) return <div className="invoice-loading">Order not found.</div>;

  const itemTotal = order.itemsList?.reduce((sum, item) => sum + (item.price * item.qty), 0) || 0;

  return (
    <div className="invoice-page-wrapper">

      {/* Non-Printable Actions */}
      <div className="invoice-actions no-print">
        <Link to="/orders" className="btn-invoice-back"><FaArrowLeft /> Back to Orders</Link>
        <button onClick={handlePrint} className="btn-invoice-print"><FaPrint /> Download PDF / Print</button>
      </div>

      <div className="invoice-success-banner no-print">
        <FaCheckCircle style={{fontSize: '2rem'}} />
        <div>
          <h2 style={{margin: '0 0 5px 0'}}>Payment Successful!</h2>
          <p style={{margin: 0}}>Your order has been placed. Here is your receipt.</p>
        </div>
      </div>

      {/* The Printable A4 Invoice Document */}
      <div className="invoice-document" id="printable-invoice">

        {/* Header */}
        <div className="invoice-header">
          <div className="invoice-brand">
            <h1>🍳 UtensilPro</h1>
            <p>Market Yard, Pune, Maharashtra 411037<br/>GSTIN: 27AAAAA0000A1Z5<br/>support@utensilpro.com</p>
          </div>
          <div className="invoice-title">
            <h2>TAX INVOICE</h2>
            <div className="invoice-meta-row"><strong>Invoice No:</strong> INV-{order.id.toString().padStart(6, '0')}</div>
            <div className="invoice-meta-row"><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</div>
            <div className="invoice-meta-row"><strong>Payment:</strong> <span className={`payment-badge ${order.status === 'PAID' ? 'paid' : 'pending'}`}>{order.status}</span></div>
          </div>
        </div>

        {/* Addresses */}
        <div className="invoice-addresses">
          <div className="address-box">
            <h3>Billed To:</h3>
            <p><strong>{order.customerName}</strong><br/>Phone: {order.phone}</p>
          </div>
          <div className="address-box">
            <h3>Shipped To:</h3>
            <p>{order.type === 'Store Pickup' ? 'Customer will pick up at store.' : order.address}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item Description</th>
              <th className="text-center">Qty</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.itemsList?.map((item, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td><strong>{item.name}</strong></td>
                <td className="text-center">{item.qty}</td>
                <td className="text-right">₹{item.price.toLocaleString()}</td>
                <td className="text-right">₹{(item.price * item.qty).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="invoice-totals-wrapper">
          <div className="invoice-totals">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>₹{itemTotal.toLocaleString()}</span>
            </div>
            <div className="totals-row">
              <span>GST Tax</span>
              <span>₹{order.taxAmount?.toLocaleString() || 0}</span>
            </div>
            <div className="totals-row">
              <span>Delivery Fee</span>
              <span>{order.deliveryFee > 0 ? `₹${order.deliveryFee}` : 'FREE'}</span>
            </div>
            <div className="totals-row grand-total">
              <span>Grand Total</span>
              <span>₹{order.total?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="invoice-footer">
          <p>Thank you for shopping with UtensilPro!</p>
          <p style={{fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px'}}>This is a computer-generated invoice and requires no signature.</p>
        </div>

      </div>
    </div>
  );
};

export default Invoice;