import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { api } from '../api';

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initials = user.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  const doLogout = () => { logout(); navigate('/login'); };

  const rows = [
    { ic: '📦', label: 'My Orders', to: '/orders' },
    { ic: '♡', label: 'Wishlist', to: '/wishlist' },
    { ic: '🔔', label: 'Notifications', to: '/notifications' },
    { ic: '📍', label: 'Saved Addresses' },
    { ic: '💳', label: 'Payment Methods' },
    { ic: '🛟', label: 'Help & Support' },
  ];

  return (
    <>
      <div className="profile-head">
        <div className="avatar">{initials}</div>
        <div><div className="nm">{user.name}</div><div className="em">{user.email}</div></div>
      </div>
      <div className="menu-list">
        {rows.map((r) => (
          <div className="menu-row" key={r.label} onClick={() => r.to && navigate(r.to)}>
            <span className="ic">{r.ic}</span>{r.label}<span className="chev">›</span>
          </div>
        ))}
        <div className="menu-row" style={{ color: 'var(--red)' }} onClick={doLogout}>
          <span className="ic">↩</span>Log Out
        </div>
      </div>
    </>
  );
}

export function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.getNotifications().then((data) => {
      setItems(data);
      api.markAllRead();
    });
  }, []);

  return (
    <>
      <div className="page-head">
        <span className="back-btn" onClick={() => navigate('/profile')}>←</span>
        <h1>Notifications</h1>
      </div>
      {items.map((n) => (
        <div className={`notif-item ${!n.is_read ? 'unread' : ''}`} key={n.id}>
          <span className="ic">{n.icon}</span>
          <div>
            <div className="tt">{n.title}</div>
            <div>{n.body}</div>
            <div className="tm">{new Date(n.created_at).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </>
  );
}
