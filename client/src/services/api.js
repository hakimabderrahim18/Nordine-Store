import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request interceptor for API calls
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls to handle expired tokens
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    return response.data;
  },
  getProfile: async () => {
    const response = await API.get('/auth/profile');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await API.put('/auth/profile', profileData);
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await API.post('/auth/forgotpassword', { email });
    return response.data;
  },
  resetPassword: async (data) => {
    const response = await API.put('/auth/resetpassword', data);
    return response.data;
  },
  verifyEmail: async (token) => {
    const response = await API.get(`/auth/verifyemail?token=${token}`);
    return response.data;
  },
  addAddress: async (address) => {
    const response = await API.post('/auth/address', address);
    return response.data;
  },
  updateAddress: async (addressId, address) => {
    const response = await API.put(`/auth/address/${addressId}`, address);
    return response.data;
  },
  deleteAddress: async (addressId) => {
    const response = await API.delete(`/auth/address/${addressId}`);
    return response.data;
  }
};

// Product Services
export const productService = {
  getProducts: async (params = {}) => {
    const response = await API.get('/products', { params });
    return response.data;
  },
  getDevices: async () => {
    const response = await API.get('/products/devices');
    return response.data;
  },
  getProductById: async (id) => {
    const response = await API.get(`/products/${id}`);
    return response.data;
  },
  createProduct: async (productData) => {
    // Uses multipart/form-data for image uploads
    const response = await API.post('/products', productData);
    return response.data;
  },
  updateProduct: async (id, productData) => {
    const response = await API.put(`/products/${id}`, productData);
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await API.delete(`/products/${id}`);
    return response.data;
  },
  bulkDeleteProducts: async (ids) => {
    const response = await API.post('/products/bulk-delete', { ids });
    return response.data;
  },
  createReview: async (productId, review) => {
    const response = await API.post(`/products/${productId}/reviews`, review);
    return response.data;
  },
  getReviews: async (productId) => {
    const response = await API.get(`/products/${productId}/reviews`);
    return response.data;
  },
  respondToReview: async (reviewId, responseText) => {
    const response = await API.put(`/products/reviews/${reviewId}/respond`, { response: responseText });
    return response.data;
  },
  importProducts: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  exportProducts: async () => {
    const response = await API.get('/products/export', {
      responseType: 'blob'
    });
    return response.data;
  }
};

// Category and Brand Services
export const categoryService = {
  getCategories: async () => {
    const response = await API.get('/categories');
    return response.data;
  },
  getAdminCategories: async () => {
    const response = await API.get('/categories/admin');
    return response.data;
  },
  createCategory: async (categoryData) => {
    const response = await API.post('/categories', categoryData);
    return response.data;
  },
  updateCategory: async (id, categoryData) => {
    const response = await API.put(`/categories/${id}`, categoryData);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await API.delete(`/categories/${id}`);
    return response.data;
  }
};

export const brandService = {
  getBrands: async () => {
    const response = await API.get('/brands');
    return response.data;
  },
  getAdminBrands: async () => {
    const response = await API.get('/brands/admin');
    return response.data;
  },
  createBrand: async (brandData) => {
    const response = await API.post('/brands', brandData);
    return response.data;
  },
  updateBrand: async (id, brandData) => {
    const response = await API.put(`/brands/${id}`, brandData);
    return response.data;
  },
  deleteBrand: async (id) => {
    const response = await API.delete(`/brands/${id}`);
    return response.data;
  }
};

// Cart Services
export const cartService = {
  getCart: async () => {
    const response = await API.get('/cart');
    return response.data;
  },
  addToCart: async (productId, quantity = 1, variant = null) => {
    const response = await API.post('/cart', { productId, quantity, variant });
    return response.data;
  },
  updateQuantity: async (productId, quantity, variant = null) => {
    const response = await API.put('/cart', { productId, quantity, variant });
    return response.data;
  },
  removeFromCart: async (productId, variant = null) => {
    const response = await API.post('/cart/remove', { productId, variant });
    return response.data;
  },
  clearCart: async () => {
    const response = await API.delete('/cart');
    return response.data;
  }
};

// Wishlist Services
export const wishlistService = {
  getWishlist: async () => {
    const response = await API.get('/wishlist');
    return response.data;
  },
  toggleItem: async (productId) => {
    const response = await API.post(`/wishlist/${productId}`);
    return response.data;
  }
};

// Coupon Services
export const couponService = {
  validate: async (code, purchaseAmount) => {
    const response = await API.get(`/coupons/validate/${code}`, { params: { purchaseAmount } });
    return response.data;
  },
  getCoupons: async () => {
    const response = await API.get('/coupons');
    return response.data;
  },
  createCoupon: async (couponData) => {
    const response = await API.post('/coupons', couponData);
    return response.data;
  },
  deleteCoupon: async (id) => {
    const response = await API.delete(`/coupons/${id}`);
    return response.data;
  }
};

// Order Services
export const orderService = {
  createOrder: async (orderData) => {
    const response = await API.post('/orders', orderData);
    return response.data;
  },
  getOrderById: async (id, params = {}) => {
    const response = await API.get(`/orders/${id}`, { params });
    return response.data;
  },
  payOrder: async (id, paymentResult) => {
    const response = await API.put(`/orders/${id}/pay`, paymentResult);
    return response.data;
  },
  deliverOrder: async (id, deliveryData) => {
    const response = await API.put(`/orders/${id}/deliver`, deliveryData);
    return response.data;
  },
  updateOrderPrices: async (id, updatedItems) => {
    const response = await API.put(`/orders/${id}/update-prices`, { updatedItems });
    return response.data;
  },
  getMyOrders: async () => {
    const response = await API.get('/orders/myorders');
    return response.data;
  },
  getOrders: async () => {
    const response = await API.get('/orders');
    return response.data;
  },
  getStats: async (params = {}) => {
    const response = await API.get('/orders/stats', { params });
    return response.data;
  },
  deleteOrder: async (id) => {
    const response = await API.delete(`/orders/${id}`);
    return response.data;
  },
  exportOrders: async () => {
    const response = await API.get('/orders/export', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'commandes_nordinestore.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    return { success: true };
  },
  getInvoiceUrl: (id, phone = '') => {
    const token = localStorage.getItem('token');
    let url = `${API.defaults.baseURL}/orders/${id}/invoice?`;
    if (token) url += `token=${token}`;
    if (phone) url += `${token ? '&' : ''}phone=${encodeURIComponent(phone)}`;
    return url;
  }
};

// User Services (Admin)
export const userService = {
  getUsers: async () => {
    const response = await API.get('/auth/users');
    return response.data;
  },
  createUser: async (userData) => {
    const response = await API.post('/auth/users', userData);
    return response.data;
  },
  updateUser: async (id, userData) => {
    const response = await API.put(`/auth/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await API.delete(`/auth/users/${id}`);
    return response.data;
  },
  importUsers: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/auth/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  exportUsers: async () => {
    const response = await API.get('/auth/users/export', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'clients_nordinestore.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    return { success: true };
  }
};

// Notification Services
export const notificationService = {
  getNotifications: async () => {
    const response = await API.get('/notifications');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await API.put(`/notifications/${id}/read`);
    return response.data;
  },
  readAll: async () => {
    const response = await API.put('/notifications/read-all');
    return response.data;
  },
  clearAll: async () => {
    const response = await API.delete('/notifications');
    return response.data;
  }
};

// Yalidine Services
export const yalidineService = {
  getWilayas: async () => {
    const response = await API.get('/yalidine/wilayas');
    return response.data;
  },
  getCommunes: async (wilayaId) => {
    const response = await API.get(`/yalidine/communes?wilaya_id=${wilayaId}`);
    return response.data;
  },
  getFees: async (toWilayaId, fromWilayaId = '16') => {
    const response = await API.get(`/yalidine/fees?from_wilaya_id=${fromWilayaId}&to_wilaya_id=${toWilayaId}`);
    return response.data;
  }
};

// Carousel Services
export const carouselService = {
  getImages: async () => {
    const response = await API.get('/carousel');
    return response.data;
  },
  addImage: async (formData) => {
    const response = await API.post('/carousel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  deleteImage: async (id) => {
    const response = await API.delete(`/carousel/${id}`);
    return response.data;
  }
};

// Contact Services
export const contactService = {
  submitContactForm: async (formData) => {
    const response = await API.post('/contact', formData);
    return response.data;
  }
};

// Helper to resolve technical category code to a clean readable display name
export const getCategoryDisplayName = (name) => {
  const upper = (name || '').toUpperCase();
  if (upper === 'BAT') return 'Batteries';
  if (upper === 'ACC') return 'Accessoires';
  if (upper === 'POCH') return 'Pochettes';
  if (upper === 'T GLASS') return 'Verre Trempé';
  if (upper === 'GLASS') return 'Vitres / Tactiles';
  if (upper === 'PIECE') return 'Pièces Détachées';
  if (upper === 'MATERIEL') return 'Matériel & Outillage';
  return name;
};

// Helper to resolve image paths to backend URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://via.placeholder.com/300';
  if (imagePath.startsWith('http')) return imagePath;
  
  if (import.meta.env.VITE_API_URL) {
    const backendUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    return `${backendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }

  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
};

export default API;
