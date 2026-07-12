import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';
import { useAuth } from './context';

const ShopDataContext = createContext(null);

export function ShopDataProvider({ children }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]); // array of product objects
  const [loading, setLoading] = useState(true);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([api.getCategories(), api.getProducts()]);
      setCategories(cats);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWishlist = useCallback(async () => {
    if (!user) { setWishlist([]); return; }
    try {
      const w = await api.getWishlist();
      setWishlist(w);
    } catch (_) { setWishlist([]); }
  }, [user]);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);
  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  const isWished = (productId) => wishlist.some((p) => p.id === productId);

  const toggleWish = async (product) => {
    if (!user) return;
    if (isWished(product.id)) {
      const w = await api.removeWishlist(product.id);
      setWishlist(w);
    } else {
      const w = await api.addWishlist(product.id);
      setWishlist(w);
    }
  };

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || '';

  return (
    <ShopDataContext.Provider value={{
      categories, products, wishlist, loading,
      reloadProducts: loadCatalog, isWished, toggleWish, categoryName,
    }}>
      {children}
    </ShopDataContext.Provider>
  );
}

export const useShopData = () => useContext(ShopDataContext);
