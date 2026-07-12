import React, { useEffect, useState } from 'react';
import { Modal } from '../components';
import { api } from '../api';
import { useToast } from '../context';

export function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '🏷️' });
  const toast = useToast();

  const load = () => api.getCategories().then(setCategories);
  useEffect(load, []);

  const openAdd = () => { setEditingId(null); setForm({ name: '', icon: '🏷️' }); setModalOpen(true); };
  const openEdit = (c) => { setEditingId(c.id); setForm({ name: c.name, icon: c.icon }); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast('Category name is required'); return; }
    if (editingId) {
      await api.updateCategory(editingId, form);
      toast('Category updated');
    } else {
      await api.createCategory(form);
      toast('Category added');
    }
    setModalOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.deleteCategory(id);
      toast('Category deleted');
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <>
      <div className="admin-header">
        <div><h1>Categories</h1><p>Organize your catalog</p></div>
        <button className="primary-btn" style={{ width: 'auto', padding: '10px 18px' }} onClick={openAdd}>+ Add Category</button>
      </div>
      <div className="admin-panel">
        <table>
          <thead><tr><th>Category</th><th>Products</th><th></th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td><div className="pcell"><div className="th">{c.icon}</div>{c.name}</div></td>
                <td>{c.product_count}</td>
                <td>
                  <div className="row-actions">
                    <button className="mini-btn edit" onClick={() => openEdit(c)}>Edit</button>
                    <button className="mini-btn del" onClick={() => remove(c.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} title={editingId ? 'Edit Category' : 'Add Category'} onClose={() => setModalOpen(false)}>
        <div className="field"><label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field"><label>Icon (emoji)</label>
          <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
        </div>
        <div className="modal-actions">
          <button className="ghost-btn" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="primary-btn" onClick={save}>{editingId ? 'Save Changes' : 'Add Category'}</button>
        </div>
      </Modal>
    </>
  );
}
