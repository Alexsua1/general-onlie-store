import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, CartProvider, ToastProvider, useAuth } from './context';
import { ShopDataProvider } from './ShopData';
import { RequireAuth, RequireAdmin } from './components';

import Login from './pages/Login';
import { CustomerLayout, Home, Categories, CategoryProducts, Search } from './pages/Shop';
import { ProductDetail, Cart, Wishlist } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { Profile, Notifications } from './pages/Profile';

import { AdminLayout } from './admin/AdminLayout';
import { Dashboard } from './admin/Dashboard';
import { AdminProducts } from './admin/Products';
import { AdminCategories } from './admin/Categories';
import { AdminOrders, AdminCustomers, AdminReports, AdminInventory } from './admin/OrdersCustomersReportsInventory';

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <div className="loading-block">Loading…</div>;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth><CustomerLayout /></RequireAuth>}>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:catId" element={<CategoryProducts />} />
        <Route path="/search" element={<Search />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="inventory" element={<AdminInventory />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ShopDataProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </ShopDataProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
