import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken } from './api';

// ---------------- Toast ----------------
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const show = useCallback((text) => {
    setMsg(text);
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => setMsg(null), 1800);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast ${msg ? 'show' : ''}`}>{msg}</div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);

// ---------------- Auth ----------------
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gos_token');
    if (!token) { setLoading(false); return; }
    api.me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (name, email, password) => {
    const data = await api.signup({ name, email, password });
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);

// ---------------- Cart ----------------
const CartContext = createContext(null);
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const toast = useToast();

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); return; }
    try {
      const data = await api.getCart();
      setItems(data);
    } catch (_) {
      setItems([]);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (productId, qty = 1) => {
    const data = await api.addToCart(productId, qty);
    setItems(data);
    toast && toast('Added to cart');
  };
  const updateQty = async (productId, qty) => {
    const data = await api.updateCartItem(productId, qty);
    setItems(data);
  };
  const remove = async (productId) => {
    const data = await api.removeCartItem(productId);
    setItems(data);
  };
  const clear = async () => {
    await api.clearCart();
    setItems([]);
  };

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, refresh, add, updateQty, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext);
