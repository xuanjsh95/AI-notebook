// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

// 笔记本类型
export interface Notebook {
  id: string;
  title: string;
  description?: string;
  color?: string;
  user_id: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  note_count?: number;
}

// 笔记类型
export interface Note {
  id: string;
  title: string;
  content: string;
  content_text?: string; // 纯文本内容，用于搜索和显示
  excerpt?: string; // 内容摘要
  notebook_id: string;
  user_id: string;
  tags: string[]; // 后端返回的是字符串数组
  is_favorite: boolean;
  is_archived: boolean;
  is_deleted?: boolean; // 软删除标记
  created_at: string;
  updated_at: string;
  deleted_at?: string; // 删除时间
  word_count?: number;
  reading_time?: number;
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  color?: string;
  user_id: string;
  usage_count?: number;
  created_at: string;
}

// 附件类型
export interface Attachment {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  note_id: string;
  user_id: string;
  url: string;
  created_at: string;
}

// 分享类型
export interface Share {
  id: string;
  note_id?: string;
  notebook_id?: string;
  shared_by: string;
  shared_with?: string;
  share_type: 'public' | 'private' | 'link';
  permissions: 'read' | 'write' | 'admin';
  share_token?: string;
  expires_at?: string;
  created_at: string;
}

// 评论类型
export interface Comment {
  id: string;
  content: string;
  note_id: string;
  user_id: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  replies?: Comment[];
}

// AI功能相关类型
export interface AICompletion {
  id: string;
  prompt: string;
  completion: string;
  model: string;
  tokens_used: number;
  user_id: string;
  created_at: string;
}

export interface AIAnalysis {
  summary: string;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  suggestions: string[];
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 认证相关类型
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
  expires_in: number;
}

// 搜索相关类型
export interface SearchRequest {
  query: string;
  type?: 'notes' | 'notebooks' | 'tags' | 'all';
  notebook_id?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  type: 'note' | 'notebook' | 'tag';
  id: string;
  title: string;
  content?: string;
  highlight?: string;
  score: number;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'share' | 'comment' | 'system' | 'ai';
  title: string;
  message: string;
  user_id: string;
  is_read: boolean;
  data?: any;
  created_at: string;
}

// 设置类型
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  notifications: {
    email: boolean;
    push: boolean;
    mentions: boolean;
    updates: boolean;
  };
  editor: {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    autoSave: boolean;
    spellCheck: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
    searchable: boolean;
  };
}

// 统计类型
export interface UserStats {
  total_notes: number;
  total_notebooks: number;
  total_words: number;
  storage_used?: number;
  notes_this_month: number;
  words_this_month: number;
  most_used_tags: Tag[];
  recent_activity: {
    date: string;
    notes_created: number;
    words_written: number;
  }[];
}

// 编辑器相关类型
export interface EditorState {
  content: string;
  selection?: {
    start: number;
    end: number;
  };
  history: {
    undo: string[];
    redo: string[];
  };
}

// 侧边栏状态类型
export interface SidebarState {
  isOpen: boolean;
  activeTab: 'notebooks' | 'tags' | 'recent' | 'favorites';
  selectedNotebook?: string;
  selectedTags: string[];
}

// 应用状态类型
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  sidebar: SidebarState;
  currentNote: Note | null;
  currentNotebook: Notebook | null;
  settings: UserSettings;
}