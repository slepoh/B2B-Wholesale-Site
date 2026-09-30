export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  /** KV 缓存层：跨请求共享的读写缓存，后台写操作会主动失效对应 key */
  CACHE?: KVNamespace;
  ASSETS?: Fetcher;
  EMAIL_API_KEY?: string;
  ADMIN_EMAIL?: string;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  /** 站点对外域名，用于生成 canonical / sitemap / Open Graph 绝对地址，例如 https://example.com */
  SITE_URL?: string;
  /** R2 媒体公开访问前缀（可选）。配置后图片走自定义域名，否则回退到 Worker 代理 /api/upload/image/:key */
  MEDIA_BASE_URL?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number | null;
  min_order_qty: number;
  images: string | null;
  specifications: string | null;
  is_active: number;
  is_featured: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: number;
  product_id: number | null;
  name: string;
  email: string;
  company: string | null;
  country: string | null;
  message: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Translation {
  id: number;
  locale: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: number;
  username: string;
  password_hash: string;
  email: string | null;
  role: string;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type InquiryStatus = 'pending' | 'replied' | 'completed' | 'archived';

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface InquiryCreateRequest {
  product_id?: number;
  name: string;
  email: string;
  company?: string;
  country?: string;
  message: string;
}

export interface ProductCreateRequest {
  category_id?: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price?: number;
  min_order_qty?: number;
  images?: string[];
  specifications?: Record<string, string>;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface CategoryCreateRequest {
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Solution {
  id: number;
  title: string;
  slug: string;
  short_description: string | null;
  content: string | null;
  images: string | null;
  industries: string | null;
  is_featured: number;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: number;
  title: string;
  slug: string;
  client_name: string | null;
  industry: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  images: string | null;
  testimonial: string | null;
  is_featured: number;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface News {
  id: number;
  title: string;
  slug: string;
  short_description: string | null;
  content: string | null;
  images: string | null;
  author: string | null;
  is_featured: number;
  is_active: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: number;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  message: string;
  source: string;
  product_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PopupSettings {
  id: number;
  is_enabled: number;
  delay_seconds: number;
  show_on_exit: number;
  title: string | null;
  description: string | null;
  form_fields: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  id: number;
  platform: string;
  name: string;
  url: string;
  icon: string | null;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContactInfo {
  id: number;
  type: string;
  label: string | null;
  value: string;
  icon: string | null;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}