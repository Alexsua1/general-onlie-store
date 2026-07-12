import React, { useEffect, useState } from 'react';
import { money } from '../components';
import { api } from '../api';
import { useToast } from '../context';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const toast = useToast();
  const load = () => api.adminGetAllOrders().then(setOrders);
  useEffect(load, []);

  const changeStatus = async (id, status) => {
    await api.adminUpdateOrderStatus(id, status);
    toast(`${id} marked ${status}`);
    load();
  };

  return (
    <>
      <div className="admin-header"><div><h1>Orders</h1><p>{orders.length} total orders</p></div></div>
      <div className="admin-panel">
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.customer_name || '—'}</td>
                <td>{o.created_at?.slice(0, 10)}</td>
                <td>{o.items.reduce((s, i) => s + i.qty, 0)} items</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{money(o.total)}</td>
                <td>
                  <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => { api.getCustomers().then(setCustomers); }, []);

  return (
    <>
      <div className="admin-header"><div><h1>Customers</h1><p>{customers.length} registered</p></div></div>
      <div className="admin-panel">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Total Spent</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.order_count}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{money(c.total_spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminReports() {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getSalesByCategory().then(setSales);
    api.getDashboard().then(setStats);
  }, []);

  const max = Math.max(1, ...sales.map((s) => s.sales));
  const avgOrder = stats && stats.total_orders ? stats.total_sales / stats.total_orders : 0;

  return (
    <>
      <div className="admin-header"><div><h1>Sales Reports</h1><p>Performance by category</p></div></div>
      {stats && (
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="stat-card"><div className="lbl">Total Revenue</div><div className="val">{money(stats.total_sales)}</div></div>
          <div className="stat-card"><div className="lbl">Avg Order Value</div><div className="val">{money(avgOrder)}</div></div>
          <div className="stat-card"><div className="lbl">Orders Placed</div><div className="val">{stats.total_orders}</div></div>
        </div>
      )}
      <div className="admin-panel">
        <div className="panel-title">Revenue by Category</div>
        <div className="bar-chart">
          {sales.map((b) => (
            <div className="col" key={b.category_id}>
              <div className="bar" style={{ height: `${Math.max(4, (b.sales / max) * 100)}%` }}>
                <span>{money(b.sales)}</span>
              </div>
              <div className="lbl">{b.icon} {b.category_name}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function stockBadge(n) {
  if (n === 0) return <span className="stock-badge stock-out">Out</span>;
  if (n < 5) return <span className="stock-badge stock-warn">{n} low</span>;
  return <span className="stock-badge stock-ok">{n} in stock</span>;
}

export function AdminInventory() {
  const [products, setProducts] = useState([]);
  useEffect(() => { api.getInventory().then(setProducts); }, []);

  return (
    <>
      <div className="admin-header"><div><h1>Inventory</h1><p>Stock levels across all products</p></div></div>
      <div className="admin-panel">
        <table>
          <thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Status</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><div className="pcell"><div className="th">{p.icon}</div>{p.name}</div></td>
                <td>{p.category_name}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{p.stock}</td>
                <td>{stockBadge(p.stock)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
