import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHead, EmptyState, money } from '../components';
import { useShopData } from '../ShopData';
import { useCart, useAuth } from '../context';
import { api } from '../api';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories, isWished, toggleWish } = useShopData();
  const { add } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api.getProduct(id).then(setProduct);
    api.getReviews(id).then(setReviews);
    setQty(1);
  }, [id]);

  if (!product) return <div className="loading-block">Loading…</div>;
  const wished = isWished(product.id);
  const catName = categories.find((c) => c.id === product.category_id)?.name;

  return (
    <>
      <PageHead title="Product Details" onBack={() => navigate(-1)} />
      <div className="pd-hero">{product.icon}</div>
      <div className="pd-body">
        <div className="pd-cat">{catName}</div>
        <div className="pd-name">{product.name}</div>
        <div className="pd-rating">⭐ {product.rating} · {product.reviews_count} reviews · {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>
        <div className="pd-price">
          {money(product.price)}
          {product.old_price ? <span className="old">{money(product.old_price)}</span> : null}
        </div>
        <div className="pd-desc">{product.description}</div>
        <div className="qty-row">
          <div className="qty-box">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span className="val">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))}>+</button>
          </div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{product.stock} available</span>
        </div>

        <div className="section-head" style={{ padding: 0 }}><h2>Reviews</h2></div>
        {reviews.length ? reviews.map((r) => (
          <div className="review" key={r.id}>
            <div className="stars">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
            <div className="who">{r.user_name}</div>
            <div className="txt">{r.text}</div>
          </div>
        )) : <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>No reviews yet — be the first to buy and review.</p>}
      </div>
      <div className="pd-actions">
        <button className="ghost-btn" style={{ flex: '0 0 52px', fontSize: 18, color: wished ? 'var(--red)' : 'var(--ink)' }}
          onClick={() => user && toggleWish(product)}>
          {wished ? '❤' : '♡'}
        </button>
        <button className="primary-btn" disabled={product.stock === 0}
          style={product.stock === 0 ? { opacity: 0.5 } : {}}
          onClick={() => user ? add(product.id, qty) : navigate('/login')}>
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </>
  );
}

export function Cart() {
  const navigate = useNavigate();
  const { items, subtotal, updateQty, remove, clear } = useCart();

  if (!items.length) {
    return (
      <>
        <div className="page-head"><h1>Cart</h1></div>
        <EmptyState emoji="🛒" title="Your cart is empty" sub="Browse products and add your first item." />
      </>
    );
  }

  const shipping = 3.99;
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      <PageHead title={`Cart (${count})`} />
      {items.map((line) => (
        <div className="cart-item" key={line.product_id}>
          <div className="thumb">{line.product.icon}</div>
          <div className="info">
            <div className="name">{line.product.name}</div>
            <div className="cat">{line.product.category_name}</div>
            <div className="row-bottom">
              <div className="qty-box">
                <button onClick={() => updateQty(line.product_id, line.qty - 1)}>−</button>
                <span className="val">{line.qty}</span>
                <button onClick={() => updateQty(line.product_id, line.qty + 1)}>+</button>
              </div>
              <span className="price">{money(line.product.price * line.qty)}</span>
            </div>
          </div>
        </div>
      ))}
      <div style={{ padding: '8px 16px 0', textAlign: 'right' }}>
        <span className="remove-x" style={{ cursor: 'pointer' }} onClick={clear}>Clear cart</span>
      </div>
      <div className="summary-box">
        <div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="summary-row"><span>Delivery</span><span>{money(shipping)}</span></div>
        <div className="summary-row total"><span>Total</span><span>{money(subtotal + shipping)}</span></div>
      </div>
      <div className="sticky-bottom">
        <button className="primary-btn" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
      </div>
    </>
  );
}

export function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, isWished, toggleWish, categories } = useShopData();
  const { add } = useCart();

  return (
    <>
      <PageHead title="Wishlist" onBack={() => navigate('/')} />
      {wishlist.length ? (
        <div className="grid">
          {wishlist.map((p) => (
            <div className="p-card" key={p.id} onClick={() => navigate(`/product/${p.id}`)}>
              <div className="thumb">
                {p.is_deal && <span className="tag">DEAL</span>}
                {p.icon}
                <span className="wish active" onClick={(e) => { e.stopPropagation(); toggleWish(p); }}>❤</span>
              </div>
              <div className="body">
                <div className="cat">{categories.find((c) => c.id === p.category_id)?.name}</div>
                <div className="name">{p.name}</div>
                <div className="price-row">
                  <span className="price">{money(p.price)}</span>
                  <span className="add-btn" onClick={(e) => { e.stopPropagation(); add(p.id); }}>+</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState emoji="♡" title="Your wishlist is empty" sub="Tap the heart on any product to save it here." />}
    </>
  );
}
