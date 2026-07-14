
import React from 'react';
import { NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuth, useCart } from './context';

export function money(n) {
  return '$' + Number(n ?? 0).toFixed(2);
}

export function TopBar() {
  const navigate = useNavigate();
  return (
    <div className="topbar">
      <div className="brand"><div className="badge">🛒</div>General Store</div>
      <div className="topbar-actions">
        <span className="icon-btn" onClick={() => navigate('/notifications')}>🔔</span>
        <span className="icon-btn" onClick={() => navigate('/wishlist')}>♡</span>
      </div>
    </div>
  );
}

export function BottomNav() {
  const { count } = useCart();
  const items = [
    { to: '/', label: 'Home', ic: '🏠', end: true },
    { to: '/categories', label: 'Categories', ic: '▦' },
    { to: '/cart', label: 'Cart', ic: '🛒', badge: count },
    { to: '/orders', label: 'Orders', ic: '📦' },
    { to: '/profile', label: 'Profile', ic: '👤' },
  ];
  return (
    <div className="bottom-nav">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className={`ic ${it.badge ? 'cart-count' : ''}`}>
            {it.ic}
            {!!it.badge && <span className="n">{it.badge}</span>}
          </span>
          <span>{it.label}</span>
        </NavLink>
      ))}
    </div>
  );
}

export function EmptyState({ emoji, title, sub }) {
  return (
    <div className="empty-state">
      <div className="em">{emoji}</div>
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
  );
}

export function ProductCard({ product, categoryName, wished, onToggleWish, onAdd }) {
  const navigate = useNavigate();
  return (
    <div className="p-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="thumb">
        {product.is_deal && <span className="tag">DEAL</span>}
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : product.icon}
        <span className={`wish ${wished ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleWish && onToggleWish(product); }}>
          {wished ? '❤' : '♡'}
        </span>
      </div>
      <div className="body">
        <div className="cat">{categoryName}</div>
        <div className="name">{product.name}</div>
        <div className="price-row">
          <span className="price">
            {product.old_price ? <span className="old">{money(product.old_price)}</span> : null}
            {money(product.price)}
          </span>
          <span className="add-btn" onClick={(e) => { e.stopPropagation(); onAdd && onAdd(product); }}>+</span>
        </div>
        {product.stock === 0
          ? <div className="stock-low">Out of stock</div>
          : product.stock < 5 ? <div className="stock-low">Only {product.stock} left</div> : null}
      </div>
    </div>
  );
}

export function PageHead({ title, onBack }) {
  return (
    <div className="page-head">
      {onBack && <span className="back-btn" onClick={onBack}>←</span>}
      <h1>{title}</h1>
    </div>
  );
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e) => { if (e.target.className.includes('modal-overlay')) onClose(); }}>
      <div className="modal">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-block">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="loading-block">Loading…</div>;
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}