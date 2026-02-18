/**
 * API Client using Axios
 * Handles all HTTP requests to the backend with authentication
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ Auth API ============

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },
};

// ============ Posts API ============

export const postsAPI = {
  create: async (postData) => {
    const response = await api.post('/api/posts/', postData);
    return response.data;
  },

  getAll: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/api/posts/', { params });
    return response.data;
  },

  getById: async (postId) => {
    const response = await api.get(`/api/posts/${postId}`);
    return response.data;
  },

  update: async (postId, updateData) => {
    const response = await api.patch(`/api/posts/${postId}`, updateData);
    return response.data;
  },

  publish: async (postId) => {
    const response = await api.post(`/api/posts/${postId}/publish`);
    return response.data;
  },

  delete: async (postId) => {
    const response = await api.delete(`/api/posts/${postId}`);
    return response.data;
  },
};

// ============ AI API ============

export const aiAPI = {
  generate: async (text, action = 'summarize') => {
    const response = await api.post('/api/ai/generate-sync', {
      text,
      action,
      max_tokens: 500,
    });
    return response.data;
  },

  generateStream: async (text, action, onChunk) => {
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(
      `${API_BASE_URL}/api/ai/generate?text=${encodeURIComponent(text)}&action=${action}&token=${token}`
    );

    return new Promise((resolve, reject) => {
      let fullText = '';

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          resolve(fullText);
        } else {
          fullText += event.data;
          onChunk(event.data);
        }
      };

      eventSource.onerror = (error) => {
        eventSource.close();
        reject(error);
      };
    });
  },
};

export default api;
