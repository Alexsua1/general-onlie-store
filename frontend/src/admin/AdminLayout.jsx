import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', ic: '📊', end: true },
  { to: '/admin/products', label: 'Products', ic: '🏷️' },
  { to: '/admin/categories', label: 'Categories', ic: '▦' },
  { to: '/admin/orders', label: 'Orders', ic: '📦' },
  { to: '/admin/customers', label: 'Customers', ic: '👥' },
  { to: '/admin/reports', label: 'Sales Reports', ic: '📈' },
  { to: '/admin/inventory', label: 'Inventory', ic: '📋' },
];

export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div id="app" className="admin-mode">
      <div className="admin-shell">
        <div className="admin-sidebar">
          <div className="admin-brand">🛒 Admin</div>
          <div>
            {ADMIN_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
                {n.ic} {n.label}
              </NavLink>
            ))}
          </div>
          <div className="admin-exit">
            <div className="admin-nav-item" onClick={() => navigate('/')}>🏬 View Storefront</div>
            <div className="admin-nav-item" onClick={() => { logout(); navigate('/login'); }}>↩ Log Out</div>
          </div>
        </div>
        <div className="admin-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
