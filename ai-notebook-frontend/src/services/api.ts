import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Notebook,
  Note,
  Tag,
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  SearchRequest,
  SearchResult,
  Notification,
  UserSettings,
  UserStats,
  AICompletion,
  AIAnalysis,
  Comment,
  Share,
  Attachment,
} from '../types';

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
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

// 响应拦截器 - 处理错误和token刷新
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { token } = response.data.data;
          localStorage.setItem('token', token);
          
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // 刷新失败，清除本地存储并跳转到登录页
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  // 用户登录
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data!;
  },

  // 用户注册
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data!;
  },

  // 刷新token
  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data.data!;
  },

  // 用户登出
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },
};

// 用户相关API
export const userAPI = {
  // 更新用户信息
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>('/users/profile', data);
    return response.data.data!;
  },

  // 更改密码
  changePassword: async (data: { current_password: string; new_password: string }): Promise<void> => {
    await apiClient.put('/users/password', data);
  },

  // 获取用户设置
  getSettings: async (): Promise<UserSettings> => {
    const response = await apiClient.get<ApiResponse<UserSettings>>('/users/settings');
    return response.data.data!;
  },

  // 更新用户设置
  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await apiClient.put<ApiResponse<UserSettings>>('/users/settings', settings);
    return response.data.data!;
  },

  // 获取用户统计
  getStats: async (): Promise<UserStats> => {
    const response = await apiClient.get<ApiResponse<UserStats>>('/users/stats');
    return response.data.data!;
  },

  // 删除账户
  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/users/me');
  },

  // 导出数据
  exportData: async (): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>('/users/export');
    return response.data.data!;
  },

  // 上传头像
  uploadAvatar: async (formData: FormData): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },
};

// 笔记本相关API
export const notebookAPI = {
  // 获取笔记本列表
  getNotebooks: async (): Promise<Notebook[]> => {
    const response = await apiClient.get<ApiResponse<Notebook[]>>('/notebooks');
    return response.data.data!;
  },

  // 获取单个笔记本
  getNotebook: async (id: string): Promise<Notebook> => {
    const response = await apiClient.get<ApiResponse<Notebook>>(`/notebooks/${id}`);
    return response.data.data!;
  },

  // 创建笔记本
  createNotebook: async (data: Omit<Notebook, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Notebook> => {
    const response = await apiClient.post<ApiResponse<Notebook>>('/notebooks', data);
    return response.data.data!;
  },

  // 更新笔记本
  updateNotebook: async (id: string, data: Partial<Notebook>): Promise<Notebook> => {
    const response = await apiClient.put<ApiResponse<Notebook>>(`/notebooks/${id}`, data);
    return response.data.data!;
  },

  // 删除笔记本
  deleteNotebook: async (id: string): Promise<void> => {
    await apiClient.delete(`/notebooks/${id}`);
  },
};

// 笔记相关API
export const noteAPI = {
  // 获取笔记列表
  getNotes: async (params?: { notebook_id?: string; page?: number; limit?: number; favorite?: boolean; archived?: boolean }): Promise<{ notes: Note[]; pagination: any }> => {
    const response = await apiClient.get<ApiResponse<{ notes: Note[]; pagination: any }>>('/notes', { params });
    return response.data.data!;
  },

  // 获取单个笔记
  getNote: async (id: string): Promise<Note> => {
    const response = await apiClient.get<ApiResponse<Note>>(`/notes/${id}`);
    return response.data.data!;
  },

  // 创建笔记
  createNote: async (data: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'tags'>): Promise<Note> => {
    const response = await apiClient.post<ApiResponse<Note>>('/notes', data);
    return response.data.data!;
  },

  // 更新笔记
  updateNote: async (id: string, data: Partial<Note>): Promise<Note> => {
    const response = await apiClient.put<ApiResponse<Note>>(`/notes/${id}`, data);
    return response.data.data!;
  },

  // 删除笔记
  deleteNote: async (id: string): Promise<void> => {
    await apiClient.delete(`/notes/${id}`);
  },

  // 收藏/取消收藏笔记
  toggleFavorite: async (id: string): Promise<Note> => {
    const response = await apiClient.post<ApiResponse<Note>>(`/notes/${id}/favorite`);
    return response.data.data!;
  },

  // 归档/取消归档笔记
  toggleArchive: async (id: string): Promise<Note> => {
    const response = await apiClient.post<ApiResponse<Note>>(`/notes/${id}/archive`);
    return response.data.data!;
  },
};

// 标签相关API
export const tagAPI = {
  // 获取标签列表
  getTags: async (): Promise<Tag[]> => {
    const response = await apiClient.get<ApiResponse<Tag[]>>('/tags');
    return response.data.data!;
  },

  // 创建标签
  createTag: async (data: Omit<Tag, 'id' | 'user_id' | 'created_at' | 'usage_count'>): Promise<Tag> => {
    const response = await apiClient.post<ApiResponse<Tag>>('/tags', data);
    return response.data.data!;
  },

  // 更新标签
  updateTag: async (id: string, data: Partial<Tag>): Promise<Tag> => {
    const response = await apiClient.put<ApiResponse<Tag>>(`/tags/${id}`, data);
    return response.data.data!;
  },

  // 删除标签
  deleteTag: async (id: string): Promise<void> => {
    await apiClient.delete(`/tags/${id}`);
  },

  // 为笔记添加标签
  addTagToNote: async (noteId: string, tagId: string): Promise<void> => {
    await apiClient.post(`/notes/${noteId}/tags/${tagId}`);
  },

  // 从笔记移除标签
  removeTagFromNote: async (noteId: string, tagId: string): Promise<void> => {
    await apiClient.delete(`/notes/${noteId}/tags/${tagId}`);
  },
};

// 搜索相关API
export const searchAPI = {
  // 搜索内容
  search: async (params: SearchRequest): Promise<{ results: SearchResult[]; pagination: any }> => {
    const response = await apiClient.get<ApiResponse<{ results: SearchResult[]; pagination: any }>>('/search', { params });
    return response.data.data!;
  },
};

// AI功能相关API
export const aiAPI = {
  // AI文本补全
  complete: async (prompt: string, context?: string): Promise<AICompletion> => {
    const response = await apiClient.post<ApiResponse<AICompletion>>('/ai/complete', { prompt, context });
    return response.data.data!;
  },

  // AI内容分析
  analyze: async (content: string): Promise<AIAnalysis> => {
    const response = await apiClient.post<ApiResponse<AIAnalysis>>('/ai/analyze', { content });
    return response.data.data!;
  },

  // AI标签建议
  suggestTags: async (content: string): Promise<string[]> => {
    const response = await apiClient.post<ApiResponse<string[]>>('/ai/suggest-tags', { content });
    return response.data.data!;
  },

  // AI翻译
  translate: async (text: string, target_language: string): Promise<{ translated_text: string }> => {
    const response = await apiClient.post<ApiResponse<{ translated_text: string }>>('/ai/translate', {
      text,
      target_language,
    });
    return response.data.data!;
  },
};

// 文件上传相关API
export const fileAPI = {
  // 上传文件
  uploadFile: async (file: File, noteId?: string): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);
    if (noteId) {
      formData.append('note_id', noteId);
    }

    const response = await apiClient.post<ApiResponse<Attachment>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },

  // 删除文件
  deleteFile: async (id: string): Promise<void> => {
    await apiClient.delete(`/files/${id}`);
  },
};

// 分享相关API
export const shareAPI = {
  // 创建分享
  createShare: async (data: Omit<Share, 'id' | 'shared_by' | 'created_at'>): Promise<Share> => {
    const response = await apiClient.post<ApiResponse<Share>>('/shares', data);
    return response.data.data!;
  },

  // 获取分享列表
  getShares: async (): Promise<Share[]> => {
    const response = await apiClient.get<ApiResponse<Share[]>>('/shares');
    return response.data.data!;
  },

  // 删除分享
  deleteShare: async (id: string): Promise<void> => {
    await apiClient.delete(`/shares/${id}`);
  },

  // 通过分享token获取内容
  getSharedContent: async (token: string): Promise<{ note?: Note; notebook?: Notebook }> => {
    const response = await apiClient.get<ApiResponse<{ note?: Note; notebook?: Notebook }>>(`/shares/public/${token}`);
    return response.data.data!;
  },
};

// 评论相关API
export const commentAPI = {
  // 获取笔记评论
  getComments: async (noteId: string): Promise<Comment[]> => {
    const response = await apiClient.get<ApiResponse<Comment[]>>(`/notes/${noteId}/comments`);
    return response.data.data!;
  },

  // 创建评论
  createComment: async (noteId: string, content: string, parentId?: string): Promise<Comment> => {
    const response = await apiClient.post<ApiResponse<Comment>>(`/notes/${noteId}/comments`, {
      content,
      parent_id: parentId,
    });
    return response.data.data!;
  },

  // 更新评论
  updateComment: async (id: string, content: string): Promise<Comment> => {
    const response = await apiClient.put<ApiResponse<Comment>>(`/comments/${id}`, { content });
    return response.data.data!;
  },

  // 删除评论
  deleteComment: async (id: string): Promise<void> => {
    await apiClient.delete(`/comments/${id}`);
  },
};

// 通知相关API
export const notificationAPI = {
  // 获取通知列表
  getNotifications: async (params?: { page?: number; limit?: number }): Promise<{ notifications: Notification[]; pagination: any }> => {
    const response = await apiClient.get<ApiResponse<{ notifications: Notification[]; pagination: any }>>('/notifications', { params });
    return response.data.data!;
  },

  // 标记通知为已读
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
  },

  // 标记所有通知为已读
  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all');
  },

  // 删除通知
  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};

// 聊天相关API
export const chatAPI = {
  // 发送消息
  sendMessage: async (data: {
    message: string;
    model: string;
    history: any[];
  }): Promise<{ content: string; model: string }> => {
    const response = await apiClient.post<ApiResponse<{ content: string; model: string }>>('/chat/message', data);
    return response.data.data!;
  },

  // 获取可用模型列表
  getAvailableModels: async (): Promise<Array<{
    id: string;
    name: string;
    provider: string;
    description?: string;
  }>> => {
    const response = await apiClient.get<ApiResponse<Array<{
      id: string;
      name: string;
      provider: string;
      description?: string;
    }>>>('/chat/models');
    return response.data.data!;
  },

  // 获取API配置列表
  getApiConfigs: async (): Promise<Array<{
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    models: string[];
  }>> => {
    const response = await apiClient.get<ApiResponse<Array<{
      id: string;
      name: string;
      baseUrl: string;
      apiKey: string;
      models: string[];
    }>>>('/chat/configs');
    return response.data.data!;
  },

  // 添加API配置
  addApiConfig: async (config: {
    name: string;
    baseUrl: string;
    apiKey: string;
    models: string[];
  }): Promise<{
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    models: string[];
  }> => {
    const response = await apiClient.post<ApiResponse<{
      id: string;
      name: string;
      baseUrl: string;
      apiKey: string;
      models: string[];
    }>>('/chat/configs', config);
    return response.data.data!;
  },

  // 删除API配置
  deleteApiConfig: async (id: string): Promise<void> => {
    await apiClient.delete(`/chat/configs/${id}`);
  },

  // 更新API配置
  updateApiConfig: async (id: string, config: Partial<{
    name: string;
    baseUrl: string;
    apiKey: string;
    models: string[];
  }>): Promise<{
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    models: string[];
  }> => {
    const response = await apiClient.put<ApiResponse<{
      id: string;
      name: string;
      baseUrl: string;
      apiKey: string;
      models: string[];
    }>>(`/chat/configs/${id}`, config);
    return response.data.data!;
  },
};

export default apiClient;