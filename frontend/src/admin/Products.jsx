import React, { useEffect, useState } from 'react';
import { money, Modal } from '../components';
import { api } from '../api';
import { useToast } from '../context';

function stockBadge(n) {
  if (n === 0) return <span className="stock-badge stock-out">Out</span>;
  if (n < 5) return <span className="stock-badge stock-warn">{n} low</span>;
  return <span className="stock-badge stock-ok">{n} in stock</span>;
}

const EMPTY_FORM = { name: '', category_id: '', price: '', stock: '', icon: '🛍️', description: '' };

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const toast = useToast();

  const load = () => {
    api.getProducts().then(setProducts);
    api.getCategories().then(setCategories);
  };
  useEffect(load, []);

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({ name: p.name, category_id: p.category_id, price: p.price, stock: p.stock, icon: p.icon, description: p.description });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast('Product name is required'); return; }
    const payload = {
      name: form.name, category_id: form.category_id || categories[0]?.id,
      price: parseFloat(form.price) || 0, stock: parseInt(form.stock) || 0,
      icon: form.icon || '🛍️', description: form.description, old_price: null, is_deal: false,
    };
    if (editingId) {
      await api.updateProduct(editingId, payload);
      toast('Product updated');
    } else {
      await api.createProduct(payload);
      toast('Product added');
    }
    setModalOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.deleteProduct(id);
    toast('Product deleted');
    load();
  };

  return (
    <>
      <div className="admin-header">
        <div><h1>Products</h1><p>{products.length} products across {categories.length} categories</p></div>
        <button className="primary-btn" style={{ width: 'auto', padding: '10px 18px' }} onClick={openAdd}>+ Add Product</button>
      </div>
      <div className="admin-panel">
        <table>
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><div className="pcell"><div className="th">{p.icon}</div>{p.name}</div></td>
                <td>{p.category_name}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{money(p.price)}</td>
                <td>{stockBadge(p.stock)}</td>
                <td>⭐ {p.rating}</td>
                <td>
                  <div className="row-actions">
                    <button className="mini-btn edit" onClick={() => openEdit(p)}>Edit</button>
                    <button className="mini-btn del" onClick={() => remove(p.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} title={editingId ? 'Edit Product' : 'Add Product'} onClose={() => setModalOpen(false)}>
        <div className="field"><label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field"><label>Category</label>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Price ($)</label>
          <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div className="field"><label>Stock Quantity</label>
          <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
        <div className="field"><label>Icon (emoji)</label>
          <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
        </div>
        <div className="field"><label>Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="modal-actions">
          <button className="ghost-btn" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="primary-btn" onClick={save}>{editingId ? 'Save Changes' : 'Add Product'}</button>
        </div>
      </Modal>
    </>
  );
}
