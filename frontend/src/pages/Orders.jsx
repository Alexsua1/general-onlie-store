import React, { useEffect, useState } from 'react';
import { PageHead, EmptyState, money } from '../components';
import { api } from '../api';

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered'];

function OrderCard({ o }) {
  const idx = STATUS_FLOW.indexOf(o.status);
  const cancelled = o.status === 'cancelled';
  return (
    <div className="order-card">
      <div className="head">
        <div>
          <div className="oid">{o.id}</div>
          <div className="date">{o.created_at?.slice(0, 10)} · {o.payment_method}</div>
        </div>
        <span className={`status-pill status-${o.status}`}>{o.status}</span>
      </div>
      {!cancelled && (
        <div className="track-row">
          {STATUS_FLOW.map((s, i) => (
            <div className={`track-step ${i <= idx ? 'done' : ''}`} key={s}>
              <div className="bar" />
              <div className="dot">{i <= idx ? '✓' : ''}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
      <div className="order-items-mini">
        {o.items.map((it) => `${it.qty}× ${it.product_name}`).join(', ')}
      </div>
      <div className="order-total"><span>Total</span><span>{money(o.total)}</span></div>
    </div>
  );
}

export function Orders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => { api.getMyOrders().then(setOrders); }, []);

  if (orders === null) return <div className="loading-block">Loading orders…</div>;

  return (
    <>
      <PageHead title="My Orders" />
      {orders.length
        ? orders.map((o) => <OrderCard o={o} key={o.id} />)
        : <EmptyState emoji="📦" title="No orders yet" sub="Your placed orders will show up here." />}
    </>
  );
}
