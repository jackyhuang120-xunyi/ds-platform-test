import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // 后端 Express 地址
  timeout: 5000,
});

// 请求拦截器：自动注入 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 如果返回 401 且当前不在登录页，自动跳转
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    console.error('API 请求失败:', error.response || error.message);
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
};

export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getRecords: (id, params) => api.get(`/users/${id}/records`, { params }),
  getTrend: (id, params) => api.get(`/users/${id}/trend`, { params }),
  getGloryMoments: (id) => api.get(`/users/${id}/glory`),
};

export const trainApi = {
  getRecords: (params) => api.get('/trains/records', { params }), // 确保支持 query 参数
  getDetail: (id) => api.get(`/trains/detail/${id}`),
  getRanking: (params) => api.get('/trains/ranking', { params }),
  getMetadata: () => api.get('/common/metadata')
};

export const commonApi = {
  getGroups: () => api.get('/common/groups')
};

export default api;
