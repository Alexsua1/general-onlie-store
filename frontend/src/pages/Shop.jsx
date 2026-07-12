import React, { useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { TopBar, BottomNav, ProductCard, EmptyState, PageHead, money } from '../components';
import { useShopData } from '../ShopData';
import { useCart } from '../context';
import { api } from '../api';

export function CustomerLayout() {
  return (
    <div id="app">
      <div className="screen active">
        <TopBar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 78, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export function Home() {
  const { categories, products, isWished, toggleWish, loading } = useShopData();
  const { add } = useCart();
  const navigate = useNavigate();
  if (loading) return <div className="loading-block">Loading products…</div>;

  const deals = products.filter((p) => p.is_deal);
  const featured = products.slice(0, 8);

  return (
    <>
      <div className="search-wrap">
        <div className="search-box" onClick={() => navigate('/search')}>
          <span className="lens">🔍</span>
          <input placeholder="Search products" readOnly />
        </div>
      </div>

      <div className="section"><div className="section-head"><h2>Categories</h2></div></div>
      <div className="cat-rail">
        {categories.map((c) => (
          <div className="cat-chip" key={c.id} onClick={() => navigate(`/category/${c.id}`)}>
            <div className="circle">{c.icon}</div>
            <span>{c.name}</span>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head">
          <div><span className="eyebrow">Ends tonight</span><h2>🔥 Deals of the Day</h2></div>
        </div>
      </div>
      <div className="deals-strip">
        {deals.map((p) => (
          <div className="deal-card" key={p.id} onClick={() => navigate(`/product/${p.id}`)}>
            <div className="pct">-{Math.round((1 - p.price / p.old_price) * 100)}%</div>
            <div className="icon">{p.icon}</div>
            <div className="name">{p.name}</div>
            <div className="price-row"><span className="old">{money(p.old_price)}</span>{money(p.price)}</div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-head"><h2>Featured Products</h2><span className="see-all" onClick={() => navigate('/categories')}>See all</span></div>
      </div>
      <div className="grid">
        {featured.map((p) => (
          <ProductCard key={p.id} product={p} categoryName={categories.find((c) => c.id === p.category_id)?.name}
            wished={isWished(p.id)} onToggleWish={toggleWish} onAdd={(prod) => add(prod.id)} />
        ))}
      </div>
    </>
  );
}

export function Categories() {
  const { categories, products } = useShopData();
  const navigate = useNavigate();
  return (
    <>
      <PageHead title="Categories" />
      <div className="grid">
        {categories.map((c) => (
          <div className="p-card" key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/category/${c.id}`)}>
            <div className="thumb" style={{ fontSize: 44 }}>{c.icon}</div>
            <div className="body">
              <div className="name" style={{ minHeight: 'auto' }}>{c.name}</div>
              <div className="cat">{products.filter((p) => p.category_id === c.id).length} items</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function CategoryProducts() {
  const navigate = useNavigate();
  const { categories, products, isWished, toggleWish } = useShopData();
  const { catId } = useParams();
  const cat = categories.find((c) => c.id === catId);
  const items = products.filter((p) => p.category_id === catId);
  return (
    <>
      <PageHead title={`${cat ? cat.icon + ' ' + cat.name : 'Category'}`} onBack={() => navigate('/categories')} />
      {items.length ? (
        <div className="grid">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} categoryName={cat?.name}
              wished={isWished(p.id)} onToggleWish={toggleWish} onAdd={() => {}} />
          ))}
        </div>
      ) : <EmptyState emoji="📭" title="Nothing here yet" sub="Check back soon for new arrivals." />}
    </>
  );
}

export function Search() {
  const [term, setTerm] = useState('');
  const { categories, isWished, toggleWish } = useShopData();
  const { add } = useCart();
  const [results, setResults] = useState([]);

  const onChange = async (v) => {
    setTerm(v);
    if (!v) { setResults([]); return; }
    const data = await api.getProducts({ search: v });
    setResults(data);
  };

  return (
    <>
      <PageHead title="Search" onBack={() => window.history.back()} />
      <div className="search-wrap">
        <div className="search-box">
          <span className="lens">🔍</span>
          <input placeholder="Search products" value={term} onChange={(e) => onChange(e.target.value)} autoFocus />
        </div>
      </div>
      {term ? (
        results.length ? (
          <div className="grid">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} categoryName={categories.find((c) => c.id === p.category_id)?.name}
                wished={isWished(p.id)} onToggleWish={toggleWish} onAdd={(prod) => add(prod.id)} />
            ))}
          </div>
        ) : <EmptyState emoji="🔍" title="No matches" sub={`Nothing found for "${term}"`} />
      ) : (
        <div className="empty-state"><div className="em">🔎</div><p>Start typing to search products</p></div>
      )}
    </>
  );
}
