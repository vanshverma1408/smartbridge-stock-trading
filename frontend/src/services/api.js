import axios from 'axios';

const api = axios.create({
  baseURL: 'https://smartbridge-stock-trading.onrender.com/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const stocksAPI = {
  getAll: (params) => api.get('/stocks', { params }),
  getOne: (symbol) => api.get(`/stocks/${symbol}`),
  getLivePrices: (symbols) => api.get('/stocks/prices/live', { params: { symbols: symbols.join(',') } }),
  getHistory: (symbol) => api.get(`/stocks/${symbol}/history`),
  create: (data) => api.post('/stocks', data),
  update: (symbol, data) => api.put(`/stocks/${symbol}`, data),
  delete: (symbol) => api.delete(`/stocks/${symbol}`),
  seed: () => api.post('/stocks/seed/all'),
};

export const transactionsAPI = {
  trade: (data) => api.post('/transactions/trade', data),
  getAll: (params) => api.get('/transactions', { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
};

export const portfolioAPI = {
  get: () => api.get('/portfolio'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  getTransactions: (params) => api.get('/admin/transactions', { params }),
};

export default api;
