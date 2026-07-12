import React, { useEffect, useState } from 'react';
import { money } from '../components';
import { api } from '../api';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.getDashboard().then(setStats);
    api.adminGetAllOrders().then((o) => setOrders(o.slice(0, 5)));
  }, []);

  if (!stats) return <div className="loading-block">Loading dashboard…</div>;

  return (
    <>
      <div className="admin-header"><div><h1>Dashboard</h1><p>Store overview at a glance</p></div></div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="lbl">Total Sales</div>
          <div className="val">{money(stats.total_sales)}</div>
          <div className="delta">↑ across {stats.total_orders} orders</div>
        </div>
        <div className="stat-card">
          <div className="lbl">Orders</div>
          <div className="val">{stats.total_orders}</div>
          <div className="delta">{stats.pending_orders} pending</div>
        </div>
        <div className="stat-card">
          <div className="lbl">Customers</div>
          <div className="val">{stats.total_customers}</div>
          <div className="delta">registered accounts</div>
        </div>
        <div className="stat-card">
          <div className="lbl">Low Stock Alerts</div>
          <div className="val">{stats.low_stock_count}</div>
          <div className={`delta ${stats.low_stock_count ? 'down' : ''}`}>
            {stats.low_stock_count ? 'needs restock' : 'all healthy'}
          </div>
        </div>
      </div>
      <div className="admin-panel">
        <div className="panel-title">Recent Orders</div>
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.customer_name || '—'}</td>
                <td>{o.created_at?.slice(0, 10)}</td>
                <td><span className={`status-pill status-${o.status}`}>{o.status}</span></td>
                <td>{money(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
