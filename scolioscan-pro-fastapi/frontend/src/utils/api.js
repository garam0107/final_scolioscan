import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
// sessionStorage를 먼저 확인 (관리자가 다른 사용자로 모니터링하는 경우)
// 없으면 localStorage 확인 (일반 로그인)
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 로그인 요청인 경우 리다이렉트하지 않음
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        // Unauthorized - 모니터링 세션이면 sessionStorage, 아니면 localStorage 제거
        if (sessionStorage.getItem('access_token')) {
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('impersonate_name');
        } else {
          localStorage.removeItem('access_token');
        }
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  passwordReset: (data) => api.post('/auth/password-reset', data),
  checkEmail: (email) => api.get(`/auth/check-email/${encodeURIComponent(email)}`),
};

// User API
export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  updateSettings: (settings) => api.put('/users/me/settings', settings),
  changePassword: (data) => api.put('/users/me/password', data),
  uploadProfileImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/me/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Alarm API
export const alarmAPI = {
  getAlarms: () => api.get('/alarms/'),
  getUnreadCount: () => api.get('/alarms/unread-count'),
  markAsRead: (alarmId) => api.post(`/alarms/${alarmId}/read`),
  markAllAsRead: () => api.post('/alarms/read-all'),
};

// Analysis API
export const analysisAPI = {
  getAnalyses: (params) => api.get('/analysis/', { params }),
  getAnalysis: (id) => api.get(`/analysis/${id}`),
  createAnalysis: (data) => api.post('/analysis/', data),
  getTypes: () => api.get('/analysis/types/'),
};

// Subscribe API
export const subscribeAPI = {
  getTypes: () => api.get('/subscribe/types'),
  getCurrent: () => api.get('/subscribe/current'),
  create: (data) => api.post('/subscribe/', data),
  cancel: () => api.post('/subscribe/cancel'),
};

// Contact API
export const contactAPI = {
  send: (data) => api.post('/contact/', data),
};

// Admin API
export const adminAPI = {
  // 고객 관리
  getCustomers: (params) => api.get('/admin/customers', { params }),
  getCustomer: (id) => api.get(`/admin/customers/${id}`),
  updateCustomer: (id, data) => api.put(`/admin/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/admin/customers/${id}`),
  loginAsCustomer: (id) => api.post(`/admin/customers/${id}/login-as`),

  // 분석 결과 관리
  getAnalyses: (params) => api.get('/admin/analyses', { params }),
  getAnalysis: (id) => api.get(`/admin/analyses/${id}`),
  createAnalysis: (data) => api.post('/admin/analyses', data),
  deleteAnalysis: (id) => api.delete(`/admin/analyses/${id}`),

  // 이메일 발송
  sendEmail: (data) => api.post('/admin/email/send', data),
  sendBulkEmail: (data) => api.post('/admin/email/send-bulk', data),
  checkEmailConsent: (userId) => api.get(`/admin/email/check-consent/${userId}`),
};

export default api;
