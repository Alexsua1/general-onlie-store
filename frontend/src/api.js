const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('gos_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('gos_token', token);
  else localStorage.removeItem('gos_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errBody = await res.json();
      detail = errBody.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // auth
  signup: (data) => request('/auth/signup', { method: 'POST', body: data, auth: false }),
  login: (data) => request('/auth/login', { method: 'POST', body: data, auth: false }),
  me: () => request('/auth/me'),

  // categories
  getCategories: () => request('/categories', { auth: false }),
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return request(`/products${qs ? `?${qs}` : ''}`, { auth: false });
  },
  getProduct: (id) => request(`/products/${id}`, { auth: false }),
  createProduct: (data) => request('/products', { method: 'POST', body: data }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  getReviews: (id) => request(`/products/${id}/reviews`, { auth: false }),
  addReview: (id, data) => request(`/products/${id}/reviews`, { method: 'POST', body: data }),

  // cart
  getCart: () => request('/cart'),
  addToCart: (productId, qty = 1) => request('/cart', { method: 'POST', body: { product_id: productId, qty } }),
  updateCartItem: (productId, qty) => request(`/cart/${productId}`, { method: 'PUT', body: { qty } }),
  removeCartItem: (productId) => request(`/cart/${productId}`, { method: 'DELETE' }),
  clearCart: () => request('/cart', { method: 'DELETE' }),

  // wishlist
  getWishlist: () => request('/wishlist'),
  addWishlist: (productId) => request('/wishlist', { method: 'POST', body: { product_id: productId } }),
  removeWishlist: (productId) => request(`/wishlist/${productId}`, { method: 'DELETE' }),

  // orders
  getMyOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),
  checkout: (data) => request('/orders', { method: 'POST', body: data }),
  verifyPayment: (data) => request('/orders/verify-payment', { method: 'POST', body: data }),
  adminGetAllOrders: () => request('/orders/admin/all'),
  adminUpdateOrderStatus: (id, status) => request(`/orders/admin/${id}/status`, { method: 'PUT', body: { status } }),

  // notifications
  getNotifications: () => request('/notifications'),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // admin
  getDashboard: () => request('/admin/dashboard'),
  getCustomers: () => request('/admin/customers'),
  getSalesByCategory: () => request('/admin/reports/sales-by-category'),
  getInventory: () => request('/admin/inventory'),
};

export { API_URL };
