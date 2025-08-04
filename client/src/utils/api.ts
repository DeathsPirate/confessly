import axios, { AxiosResponse } from 'axios';
import { 
  User, 
  Confession, 
  Comment, 
  Flag, 
  RegisterData, 
  LoginData, 
  CreateConfessionData,
  VoteData,
  FlagData,
  UserStats,
  ModerationStats,
  Pagination
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginData): Promise<{ token: string; user: User }> => {
    const response: AxiosResponse<{ token: string; user: User }> = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<{ token: string; user: User }> => {
    const response: AxiosResponse<{ token: string; user: User }> = await api.post('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response: AxiosResponse<{ user: User }> = await api.get('/auth/profile');
    return response.data.user;
  },

  updateProfile: async (data: Partial<User>): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.put('/auth/profile', data);
    return response.data;
  },
};

// Confessions API
export const confessionsAPI = {
  getConfessions: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    mood?: string;
    location?: string;
  }): Promise<{ confessions: Confession[]; pagination: Pagination }> => {
    const response: AxiosResponse<{ confessions: Confession[]; pagination: Pagination }> = await api.get('/confessions', { params });
    return response.data;
  },

  getConfession: async (id: number): Promise<{ confession: Confession }> => {
    const response: AxiosResponse<{ confession: Confession }> = await api.get(`/confessions/${id}`);
    return response.data;
  },

  createConfession: async (data: CreateConfessionData): Promise<{ message: string; confession_id: number }> => {
    const formData = new FormData();
    formData.append('content', data.content);
    if (data.mood) formData.append('mood', data.mood);
    if (data.location) formData.append('location', data.location);
    if (data.tagged_users) formData.append('tagged_users', data.tagged_users);
    if (data.image) formData.append('image', data.image);

    const response: AxiosResponse<{ message: string; confession_id: number }> = await api.post('/confessions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateConfession: async (id: number, data: Partial<CreateConfessionData>): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.put(`/confessions/${id}`, data);
    return response.data;
  },

  deleteConfession: async (id: number): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.delete(`/confessions/${id}`);
    return response.data;
  },

  voteConfession: async (id: number, data: VoteData): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post(`/confessions/${id}/vote`, data);
    return response.data;
  },
};

// Comments API
export const commentsAPI = {
  getComments: async (confessionId: number, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ comments: Comment[]; pagination: Pagination }> => {
    const response: AxiosResponse<{ comments: Comment[]; pagination: Pagination }> = await api.get(`/comments/confession/${confessionId}`, { params });
    return response.data;
  },

  createComment: async (confessionId: number, content: string): Promise<{ message: string; comment_id: number }> => {
    const response: AxiosResponse<{ message: string; comment_id: number }> = await api.post(`/comments/confession/${confessionId}`, { content });
    return response.data;
  },

  deleteComment: async (id: number): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.delete(`/comments/${id}`);
    return response.data;
  },

  voteComment: async (id: number, data: VoteData): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post(`/comments/${id}/vote`, data);
    return response.data;
  },
};

// Moderation API
export const moderationAPI = {
  flagContent: async (data: FlagData): Promise<{ message: string; flag_id: number }> => {
    const response: AxiosResponse<{ message: string; flag_id: number }> = await api.post('/moderation/flag', data);
    return response.data;
  },

  getFlags: async (params?: {
    status?: 'pending' | 'resolved' | 'dismissed';
    content_type?: 'confession' | 'comment';
    page?: number;
    limit?: number;
  }): Promise<{ flags: Flag[]; pagination: Pagination }> => {
    const response: AxiosResponse<{ flags: Flag[]; pagination: Pagination }> = await api.get('/moderation/flags', { params });
    return response.data;
  },

  resolveFlag: async (id: number, action: 'delete' | 'dismiss', reason?: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.put(`/moderation/flags/${id}/resolve`, { action, reason });
    return response.data;
  },

  getStats: async (): Promise<{ stats: ModerationStats }> => {
    const response: AxiosResponse<{ stats: ModerationStats }> = await api.get('/moderation/stats');
    return response.data;
  },
};

// User API
export const userAPI = {
  exportData: async (): Promise<Blob> => {
    const response: AxiosResponse<Blob> = await api.get('/user/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  getMyConfessions: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ confessions: Confession[]; pagination: Pagination }> => {
    const response: AxiosResponse<{ confessions: Confession[]; pagination: Pagination }> = await api.get('/user/confessions', { params });
    return response.data;
  },

  getMyComments: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ comments: Comment[]; pagination: Pagination }> => {
    const response: AxiosResponse<{ comments: Comment[]; pagination: Pagination }> = await api.get('/user/comments', { params });
    return response.data;
  },

  getStats: async (): Promise<{ stats: UserStats }> => {
    const response: AxiosResponse<{ stats: UserStats }> = await api.get('/user/stats');
    return response.data;
  },
};

export default api; 