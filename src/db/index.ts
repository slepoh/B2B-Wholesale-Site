import { D1Database, R2Bucket, KVNamespace } from '@cloudflare/workers-types';
import type { Category, Product, Inquiry, AiChatConfig, AiChatMessage, AiChatSessionSummary } from '../types';
import { createCache, CACHE_CONFIG, type CacheBackend } from './cache';

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  CACHE?: KVNamespace;
  EMAIL_API_KEY?: string;
  ADMIN_EMAIL?: string;
}

export { CACHE_CONFIG };

/** 把数组/对象安全序列化为 JSON 字符串；已是字符串则原样返回 */
function serializeJson(value: any): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

class Database {
  private cache: CacheBackend;

  constructor(private db: D1Database, cache?: KVNamespace) {
    this.cache = createCache(cache);
  }

  private getCacheKey(prefix: string, params: any[]): string {
    return `${prefix}:${params.join(':')}`;
  }

  private getFromCache<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
  }

  private setCache<T>(key: string, data: T, ttl: number): Promise<void> {
    return this.cache.set<T>(key, data, ttl);
  }

  /** 失效一个或多个缓存前缀。写操作后必须调用，保证前台读到最新数据。 */
  invalidateCache(prefix: string | string[]): Promise<void> {
    const prefixes = Array.isArray(prefix) ? prefix : [prefix];
    return this.cache.invalidate(prefixes);
  }

  async getCategories(parentId?: number): Promise<Category[]> {
    const cacheKey = this.getCacheKey('categories', [parentId ?? 'all']);
    const cached = await this.getFromCache<Category[]>(cacheKey);
    if (cached) return cached;

    let query = 'SELECT * FROM categories WHERE is_active = 1';
    const params: any[] = [];
    if (parentId !== undefined) {
      query += ' AND parent_id = ?';
      params.push(parentId);
    }
    query += ' ORDER BY sort_order ASC, id ASC';
    
    const result = await this.db.prepare(query).bind(...params).all();
    const categories = result.results as any;
    
    await this.setCache(cacheKey, categories, CACHE_CONFIG.categories);
    return categories;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const cacheKey = this.getCacheKey('category_slug', [slug]);
    const cached = await this.getFromCache<Category>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM categories WHERE slug = ? AND is_active = 1').bind(slug).first();
    const category = result as any;
    
    if (category) {
      await this.setCache(cacheKey, category, CACHE_CONFIG.categories);
    }
    
    return category;
  }

  async getCategoryById(id: number): Promise<Category | null> {
    const cacheKey = this.getCacheKey('category_id', [id]);
    const cached = await this.getFromCache<Category>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
    const category = result as any;
    
    if (category) {
      await this.setCache(cacheKey, category, CACHE_CONFIG.categories);
    }
    
    return category;
  }

  async createCategory(category: Partial<Category>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      category.name,
      category.slug,
      category.description || null,
      category.parent_id || null,
      category.sort_order || 0,
      category.is_active !== undefined ? (category.is_active ? 1 : 0) : 1
    ).run();
    
    await this.invalidateCache(['categories', 'category_slug', 'category_id', 'ai_knowledge']);
    return result.meta!.last_row_id as number;
  }

  async updateCategory(id: number, category: Partial<Category>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    if (category.name !== undefined) { updates.push('name = ?'); params.push(category.name); }
    if (category.slug !== undefined) { updates.push('slug = ?'); params.push(category.slug); }
    if (category.description !== undefined) { updates.push('description = ?'); params.push(category.description); }
    if (category.parent_id !== undefined) { updates.push('parent_id = ?'); params.push(category.parent_id); }
    if (category.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(category.sort_order); }
    if (category.is_active !== undefined) { updates.push('is_active = ?'); params.push(category.is_active ? 1 : 0); }
    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    const result = await this.db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    
    await this.invalidateCache(['categories', 'category_slug', 'category_id', 'ai_knowledge']);
    return result.success;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    await this.invalidateCache(['categories', 'category_slug', 'category_id', 'ai_knowledge']);
    return result.success;
  }

  async getProducts(categoryId?: number, page = 1, pageSize = 12, featured?: boolean): Promise<{ items: Product[]; total: number }> {
    const cacheKey = this.getCacheKey('products', [categoryId ?? 'all', page, pageSize, featured ? 'featured' : 'all']);
    const cached = await this.getFromCache<{ items: Product[]; total: number }>(cacheKey);
    if (cached) return cached;

    let whereClause = 'WHERE is_active = 1';
    const params: any[] = [];
    if (categoryId) {
      whereClause += ' AND category_id = ?';
      params.push(categoryId);
    }
    if (featured) {
      whereClause += ' AND is_featured = 1';
    }
    
    const countResult = await this.db.prepare(`SELECT COUNT(*) as total FROM products ${whereClause}`).bind(...params).first() as any;
    const total = countResult?.total || 0;
    const offset = (page - 1) * pageSize;
    
    const result = await this.db.prepare(`
      SELECT * FROM products ${whereClause}
      ORDER BY is_featured DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();
    
    const productsData = { items: result.results as any, total };
    
    await this.setCache(cacheKey, productsData, CACHE_CONFIG.products);
    return productsData;
  }

  async getFeaturedProducts(limit = 6): Promise<Product[]> {
    const cacheKey = this.getCacheKey('featured_products', [limit]);
    const cached = await this.getFromCache<Product[]>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare(`
      SELECT * FROM products WHERE is_active = 1 AND is_featured = 1
      ORDER BY created_at DESC LIMIT ?
    `).bind(limit).all();
    
    const products = result.results as any;
    await this.setCache(cacheKey, products, CACHE_CONFIG.products);
    return products;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const cacheKey = this.getCacheKey('product_slug', [slug]);
    const cached = await this.getFromCache<Product>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM products WHERE slug = ? AND is_active = 1').bind(slug).first();
    const product = result as any;
    
    if (product) {
      this.db.prepare('UPDATE products SET view_count = view_count + 1 WHERE id = ?').bind(product.id).run();
      await this.setCache(cacheKey, product, CACHE_CONFIG.products);
    }
    
    return product;
  }

  async getProductById(id: number): Promise<Product | null> {
    const cacheKey = this.getCacheKey('product_id', [id]);
    const cached = await this.getFromCache<Product>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
    const product = result as any;
    
    if (product) {
      await this.setCache(cacheKey, product, CACHE_CONFIG.products);
    }
    
    return product;
  }

  async createProduct(product: Partial<Product>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO products (category_id, name, slug, description, short_description, price, min_order_qty, images, specifications, is_active, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      product.category_id || null,
      product.name,
      product.slug,
      product.description || null,
      product.short_description || null,
      product.price || null,
      product.min_order_qty || 1,
      serializeJson(product.images),
      serializeJson(product.specifications),
      product.is_active !== undefined ? (product.is_active ? 1 : 0) : 1,
      product.is_featured !== undefined ? (product.is_featured ? 1 : 0) : 0
    ).run();
    
    await this.invalidateCache(['products', 'product_slug', 'product_id', 'featured_products', 'ai_knowledge']);
    return result.meta!.last_row_id as number;
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    if (product.category_id !== undefined) { updates.push('category_id = ?'); params.push(product.category_id); }
    if (product.name !== undefined) { updates.push('name = ?'); params.push(product.name); }
    if (product.slug !== undefined) { updates.push('slug = ?'); params.push(product.slug); }
    if (product.description !== undefined) { updates.push('description = ?'); params.push(product.description); }
    if (product.short_description !== undefined) { updates.push('short_description = ?'); params.push(product.short_description); }
    if (product.price !== undefined) { updates.push('price = ?'); params.push(product.price); }
    if (product.min_order_qty !== undefined) { updates.push('min_order_qty = ?'); params.push(product.min_order_qty); }
    if (product.images !== undefined) { updates.push('images = ?'); params.push(serializeJson(product.images)); }
    if (product.specifications !== undefined) { updates.push('specifications = ?'); params.push(serializeJson(product.specifications)); }
    if (product.is_active !== undefined) { updates.push('is_active = ?'); params.push(product.is_active ? 1 : 0); }
    if (product.is_featured !== undefined) { updates.push('is_featured = ?'); params.push(product.is_featured ? 1 : 0); }
    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    const result = await this.db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    
    await this.invalidateCache(['products', 'product_slug', 'product_id', 'featured_products', 'ai_knowledge']);
    return result.success;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    await this.invalidateCache(['products', 'product_slug', 'product_id', 'featured_products', 'ai_knowledge']);
    return result.success;
  }

  async getInquiries(status?: string, page = 1, pageSize = 20): Promise<{ items: Inquiry[]; total: number }> {
    let whereClause = '';
    const params: any[] = [];
    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }
    
    const countResult = await this.db.prepare(`SELECT COUNT(*) as total FROM inquiries ${whereClause}`).bind(...params).first() as any;
    const total = countResult?.total || 0;
    const offset = (page - 1) * pageSize;
    
    const result = await this.db.prepare(`
      SELECT * FROM inquiries ${whereClause}
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();
    
    return { items: result.results as any, total };
  }

  async getInquiryById(id: number): Promise<Inquiry | null> {
    const result = await this.db.prepare('SELECT * FROM inquiries WHERE id = ?').bind(id).first();
    return result as any;
  }

  async createInquiry(inquiry: Partial<Inquiry>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO inquiries (product_id, name, email, company, country, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      inquiry.product_id || null,
      inquiry.name,
      inquiry.email,
      inquiry.company || null,
      inquiry.country || null,
      inquiry.message
    ).run();
    
    return result.meta!.last_row_id as number;
  }

  async updateInquiryStatus(id: number, status: string, notes?: string): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE inquiries SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(status, notes || null, id).run();
    return result.success;
  }

  async deleteInquiry(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run();
    return result.success;
  }

  async getTranslations(locale: string): Promise<Record<string, string>> {
    const cacheKey = this.getCacheKey('translations', [locale]);
    const cached = await this.getFromCache<Record<string, string>>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT key, value FROM translations WHERE locale = ?').bind(locale).all();
    const translations: Record<string, string> = {};
    for (const row of result.results as any) {
      translations[row.key] = row.value;
    }
    
    await this.setCache(cacheKey, translations, CACHE_CONFIG.translations);
    return translations;
  }

  async getSetting(key: string): Promise<string | null> {
    const cacheKey = this.getCacheKey('setting', [key]);
    const cached = await this.getFromCache<string>(cacheKey);
    if (cached) return cached;

    const result: any = await this.db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
    const value = result?.value || null;
    
    if (value !== null) {
      await this.setCache(cacheKey, value, CACHE_CONFIG.settings);
    }
    
    return value;
  }

  async getSettings(): Promise<Record<string, string>> {
    const cacheKey = 'settings:all';
    const cached = await this.getFromCache<Record<string, string>>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT key, value FROM settings').all();
    const settings: Record<string, string> = {};
    for (const row of result.results as any) {
      settings[row.key] = row.value || '';
    }
    
    await this.setCache(cacheKey, settings, CACHE_CONFIG.settings);
    return settings;
  }

  async updateSetting(key: string, value: string): Promise<boolean> {
    const result = await this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).bind(key, value).run();
    
    await this.invalidateCache(['settings', 'setting']);
    return result.success;
  }

  async getAdminByUsername(username: string): Promise<any> {
    const result = await this.db.prepare('SELECT * FROM admins WHERE username = ?').bind(username).first();
    return result as any;
  }

  async updateAdminLastLogin(id: number): Promise<boolean> {
    const result = await this.db.prepare('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
    return result.success;
  }

  async getStats(): Promise<any> {
    const productsCount = await this.db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').first() as any;
    const inquiriesCount = await this.db.prepare('SELECT COUNT(*) as count FROM inquiries').first() as any;
    const pendingInquiries = await this.db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'pending'").first() as any;
    const leadsCount = await this.db.prepare('SELECT COUNT(*) as count FROM leads').first() as any;
    const casesCount = await this.db.prepare('SELECT COUNT(*) as count FROM cases WHERE is_active = 1').first() as any;
    const newsCount = await this.db.prepare('SELECT COUNT(*) as count FROM news WHERE is_active = 1').first() as any;
    
    return {
      totalProducts: productsCount?.count || 0,
      totalInquiries: inquiriesCount?.count || 0,
      pendingInquiries: pendingInquiries?.count || 0,
      totalLeads: leadsCount?.count || 0,
      totalCases: casesCount?.count || 0,
      totalNews: newsCount?.count || 0,
    };
  }

  async getPages(): Promise<any[]> {
    const cacheKey = this.getCacheKey('pages', ['active']);
    const cached = await this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM pages WHERE is_active = 1 ORDER BY id ASC').all();
    const items = result.results as any;
    await this.setCache(cacheKey, items, CACHE_CONFIG.pages);
    return items;
  }

  async getPageBySlug(slug: string): Promise<any> {
    const cacheKey = this.getCacheKey('page_slug', [slug]);
    const cached = await this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM pages WHERE slug = ? AND is_active = 1').bind(slug).first();
    if (result) await this.setCache(cacheKey, result, CACHE_CONFIG.pages);
    return result as any;
  }

  async createPage(page: Partial<any>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO pages (title, slug, content, meta_title, meta_description, meta_keywords, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      page.title,
      page.slug,
      page.content || null,
      page.meta_title || null,
      page.meta_description || null,
      page.meta_keywords || null,
      page.is_active !== undefined ? page.is_active : 1
    ).run();
    
    await this.invalidateCache(['pages', 'page_slug']);
    return result.meta!.last_row_id as number;
  }

  async updatePage(id: number, page: Partial<any>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (page.title !== undefined) { updates.push('title = ?'); params.push(page.title); }
    if (page.slug !== undefined) { updates.push('slug = ?'); params.push(page.slug); }
    if (page.content !== undefined) { updates.push('content = ?'); params.push(page.content); }
    if (page.meta_title !== undefined) { updates.push('meta_title = ?'); params.push(page.meta_title); }
    if (page.meta_description !== undefined) { updates.push('meta_description = ?'); params.push(page.meta_description); }
    if (page.meta_keywords !== undefined) { updates.push('meta_keywords = ?'); params.push(page.meta_keywords); }
    if (page.is_active !== undefined) { updates.push('is_active = ?'); params.push(page.is_active); }
    
    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const result = await this.db.prepare(`UPDATE pages SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    await this.invalidateCache(['pages', 'page_slug']);
    return result.success;
  }

  async deletePage(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM pages WHERE id = ?').bind(id).run();
    await this.invalidateCache(['pages', 'page_slug']);
    return result.success;
  }

  async getSolutions(featured?: boolean): Promise<any[]> {
    const cacheKey = this.getCacheKey('solutions', [featured === undefined ? 'all' : String(featured)]);
    const cached = await this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    let query = 'SELECT * FROM solutions WHERE is_active = 1';
    const params: any[] = [];
    
    if (featured !== undefined) {
      query += ' AND is_featured = ?';
      params.push(featured ? 1 : 0);
    }
    
    query += ' ORDER BY sort_order ASC, id ASC';
    const result = await this.db.prepare(query).bind(...params).all();
    const items = result.results as any;
    await this.setCache(cacheKey, items, CACHE_CONFIG.solutions);
    return items;
  }

  async getSolutionBySlug(slug: string): Promise<any> {
    const cacheKey = this.getCacheKey('solution_slug', [slug]);
    const cached = await this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM solutions WHERE slug = ? AND is_active = 1').bind(slug).first();
    if (result) await this.setCache(cacheKey, result, CACHE_CONFIG.solutions);
    return result as any;
  }

  async createSolution(solution: Partial<any>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO solutions (title, slug, short_description, content, images, industries, is_featured, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      solution.title,
      solution.slug,
      solution.short_description || null,
      solution.content || null,
      solution.images || null,
      solution.industries || null,
      solution.is_featured !== undefined ? solution.is_featured : 0,
      solution.is_active !== undefined ? solution.is_active : 1,
      solution.sort_order || 0
    ).run();
    
    await this.invalidateCache(['solutions', 'solution_slug', 'ai_knowledge']);
    return result.meta!.last_row_id as number;
  }

  async updateSolution(id: number, solution: Partial<any>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (solution.title !== undefined) { updates.push('title = ?'); params.push(solution.title); }
    if (solution.slug !== undefined) { updates.push('slug = ?'); params.push(solution.slug); }
    if (solution.short_description !== undefined) { updates.push('short_description = ?'); params.push(solution.short_description); }
    if (solution.content !== undefined) { updates.push('content = ?'); params.push(solution.content); }
    if (solution.images !== undefined) { updates.push('images = ?'); params.push(solution.images); }
    if (solution.industries !== undefined) { updates.push('industries = ?'); params.push(solution.industries); }
    if (solution.is_featured !== undefined) { updates.push('is_featured = ?'); params.push(solution.is_featured); }
    if (solution.is_active !== undefined) { updates.push('is_active = ?'); params.push(solution.is_active); }
    if (solution.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(solution.sort_order); }
    
    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const result = await this.db.prepare(`UPDATE solutions SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    await this.invalidateCache(['solutions', 'solution_slug', 'ai_knowledge']);
    return result.success;
  }

  async deleteSolution(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM solutions WHERE id = ?').bind(id).run();
    await this.invalidateCache(['solutions', 'solution_slug', 'ai_knowledge']);
    return result.success;
  }

  async getCases(featured?: boolean): Promise<any[]> {
    const cacheKey = this.getCacheKey('cases', [featured === undefined ? 'all' : String(featured)]);
    const cached = await this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    let query = 'SELECT * FROM cases WHERE is_active = 1';
    const params: any[] = [];
    
    if (featured !== undefined) {
      query += ' AND is_featured = ?';
      params.push(featured ? 1 : 0);
    }
    
    query += ' ORDER BY sort_order ASC, id ASC';
    const result = await this.db.prepare(query).bind(...params).all();
    const items = result.results as any;
    await this.setCache(cacheKey, items, CACHE_CONFIG.cases);
    return items;
  }

  async getCaseBySlug(slug: string): Promise<any> {
    const cacheKey = this.getCacheKey('case_slug', [slug]);
    const cached = await this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM cases WHERE slug = ? AND is_active = 1').bind(slug).first();
    if (result) await this.setCache(cacheKey, result, CACHE_CONFIG.cases);
    return result as any;
  }

  async createCase(item: Partial<any>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO cases (title, slug, client_name, industry, challenge, solution, results, images, testimonial, is_featured, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      item.title,
      item.slug,
      item.client_name || null,
      item.industry || null,
      item.challenge || null,
      item.solution || null,
      item.results || null,
      item.images || null,
      item.testimonial || null,
      item.is_featured !== undefined ? item.is_featured : 0,
      item.is_active !== undefined ? item.is_active : 1,
      item.sort_order || 0
    ).run();
    
    await this.invalidateCache(['cases', 'case_slug', 'ai_knowledge']);
    return result.meta!.last_row_id as number;
  }

  async updateCase(id: number, item: Partial<any>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (item.title !== undefined) { updates.push('title = ?'); params.push(item.title); }
    if (item.slug !== undefined) { updates.push('slug = ?'); params.push(item.slug); }
    if (item.client_name !== undefined) { updates.push('client_name = ?'); params.push(item.client_name); }
    if (item.industry !== undefined) { updates.push('industry = ?'); params.push(item.industry); }
    if (item.challenge !== undefined) { updates.push('challenge = ?'); params.push(item.challenge); }
    if (item.solution !== undefined) { updates.push('solution = ?'); params.push(item.solution); }
    if (item.results !== undefined) { updates.push('results = ?'); params.push(item.results); }
    if (item.images !== undefined) { updates.push('images = ?'); params.push(item.images); }
    if (item.testimonial !== undefined) { updates.push('testimonial = ?'); params.push(item.testimonial); }
    if (item.is_featured !== undefined) { updates.push('is_featured = ?'); params.push(item.is_featured); }
    if (item.is_active !== undefined) { updates.push('is_active = ?'); params.push(item.is_active); }
    if (item.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(item.sort_order); }
    
    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const result = await this.db.prepare(`UPDATE cases SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    await this.invalidateCache(['cases', 'case_slug', 'ai_knowledge']);
    return result.success;
  }

  async deleteCase(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM cases WHERE id = ?').bind(id).run();
    await this.invalidateCache(['cases', 'case_slug', 'ai_knowledge']);
    return result.success;
  }

  async getNews(featured?: boolean, page = 1, pageSize = 10): Promise<{ items: any[]; total: number }> {
    const cacheKey = this.getCacheKey('news', [featured === undefined ? 'all' : String(featured), page, pageSize]);
    const cached = await this.getFromCache<{ items: any[]; total: number }>(cacheKey);
    if (cached) return cached;

    let query = 'SELECT * FROM news WHERE is_active = 1';
    const params: any[] = [];
    
    if (featured !== undefined) {
      query += ' AND is_featured = ?';
      params.push(featured ? 1 : 0);
    }
    
    const countResult = await this.db.prepare(`SELECT COUNT(*) as total FROM news WHERE is_active = 1 ${featured !== undefined ? 'AND is_featured = ?' : ''}`).bind(...(featured !== undefined ? [featured ? 1 : 0] : [])).first() as any;
    const total = countResult?.total || 0;
    
    query += ' ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * pageSize;
    
    const result = await this.db.prepare(query).bind(...params, pageSize, offset).all();
    const data = { items: result.results as any, total };
    await this.setCache(cacheKey, data, CACHE_CONFIG.news);
    return data;
  }

  async getNewsBySlug(slug: string): Promise<any> {
    const cacheKey = this.getCacheKey('news_slug', [slug]);
    const cached = await this.getFromCache<any>(cacheKey);
    if (cached) {
      // 浏览量计数不阻塞查询，异步累加
      this.db.prepare('UPDATE news SET view_count = view_count + 1 WHERE id = ?').bind(cached.id).run().catch(() => {});
      return cached;
    }

    const result = await this.db.prepare('SELECT * FROM news WHERE slug = ? AND is_active = 1').bind(slug).first();
    
    if (result) {
      await this.setCache(cacheKey, result, CACHE_CONFIG.news);
      await this.db.prepare('UPDATE news SET view_count = view_count + 1 WHERE id = ?').bind((result as any).id).run();
    }
    
    return result as any;
  }

  async createNews(item: Partial<any>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO news (title, slug, short_description, content, images, author, is_featured, is_active, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      item.title,
      item.slug,
      item.short_description || null,
      item.content || null,
      item.images || null,
      item.author || null,
      item.is_featured !== undefined ? item.is_featured : 0,
      item.is_active !== undefined ? item.is_active : 1,
      item.published_at || new Date().toISOString()
    ).run();
    
    await this.invalidateCache(['news', 'news_slug', 'ai_knowledge']);
    return result.meta!.last_row_id as number;
  }

  async updateNews(id: number, item: Partial<any>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (item.title !== undefined) { updates.push('title = ?'); params.push(item.title); }
    if (item.slug !== undefined) { updates.push('slug = ?'); params.push(item.slug); }
    if (item.short_description !== undefined) { updates.push('short_description = ?'); params.push(item.short_description); }
    if (item.content !== undefined) { updates.push('content = ?'); params.push(item.content); }
    if (item.images !== undefined) { updates.push('images = ?'); params.push(item.images); }
    if (item.author !== undefined) { updates.push('author = ?'); params.push(item.author); }
    if (item.is_featured !== undefined) { updates.push('is_featured = ?'); params.push(item.is_featured); }
    if (item.is_active !== undefined) { updates.push('is_active = ?'); params.push(item.is_active); }
    if (item.published_at !== undefined) { updates.push('published_at = ?'); params.push(item.published_at); }
    
    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const result = await this.db.prepare(`UPDATE news SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    await this.invalidateCache(['news', 'news_slug', 'ai_knowledge']);
    return result.success;
  }

  async deleteNews(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM news WHERE id = ?').bind(id).run();
    await this.invalidateCache(['news', 'news_slug', 'ai_knowledge']);
    return result.success;
  }

  async getLeads(status?: string, page = 1, pageSize = 20): Promise<{ items: any[]; total: number }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }
    
    const countResult = await this.db.prepare(`SELECT COUNT(*) as total FROM leads ${whereClause}`).bind(...params).first() as any;
    const total = countResult?.total || 0;
    const offset = (page - 1) * pageSize;
    
    const result = await this.db.prepare(`
      SELECT * FROM leads ${whereClause}
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();
    
    return { items: result.results as any, total };
  }

  async getLeadById(id: number): Promise<any> {
    const result = await this.db.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();
    return result as any;
  }

  async createLead(lead: Partial<any>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO leads (name, phone, whatsapp, email, message, source, product_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      lead.name,
      lead.phone || null,
      lead.whatsapp || null,
      lead.email || null,
      lead.message,
      lead.source || 'popup',
      lead.product_id || null,
      lead.status || 'new'
    ).run();
    
    return result.meta!.last_row_id as number;
  }

  async updateLeadStatus(id: number, status: string, _notes?: string): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(status, id).run();
    return result.success;
  }

  async deleteLead(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM leads WHERE id = ?').bind(id).run();
    return result.success;
  }

  async getPopupSettings(): Promise<any> {
    const cacheKey = this.getCacheKey('settings', ['popup']);
    const cached = await this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM popup_settings LIMIT 1').first();
    if (result) await this.setCache(cacheKey, result, CACHE_CONFIG.settings);
    return result as any;
  }

  async updatePopupSettings(settings: Partial<any>): Promise<boolean> {
    const current = await this.getPopupSettings();
    
    if (current) {
      const updates: string[] = [];
      const params: any[] = [];
      
      if (settings.is_enabled !== undefined) { updates.push('is_enabled = ?'); params.push(settings.is_enabled); }
      if (settings.delay_seconds !== undefined) { updates.push('delay_seconds = ?'); params.push(settings.delay_seconds); }
      if (settings.show_on_exit !== undefined) { updates.push('show_on_exit = ?'); params.push(settings.show_on_exit); }
      if (settings.title !== undefined) { updates.push('title = ?'); params.push(settings.title); }
      if (settings.description !== undefined) { updates.push('description = ?'); params.push(settings.description); }
      if (settings.form_fields !== undefined) { updates.push('form_fields = ?'); params.push(settings.form_fields); }
      
      if (updates.length === 0) return false;
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(current.id);
      
      const result = await this.db.prepare(`UPDATE popup_settings SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
      await this.invalidateCache(['settings', 'setting']);
      return result.success;
    } else {
      const result = await this.db.prepare(`
        INSERT INTO popup_settings (is_enabled, delay_seconds, show_on_exit, title, description, form_fields)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        settings.is_enabled !== undefined ? settings.is_enabled : 1,
        settings.delay_seconds || 15,
        settings.show_on_exit !== undefined ? settings.show_on_exit : 0,
        settings.title || null,
        settings.description || null,
        settings.form_fields || null
      ).run();
      await this.invalidateCache(['settings', 'setting']);
      return result.success;
    }
  }

  async getSocialLinks(): Promise<any[]> {
    const cacheKey = this.getCacheKey('settings', ['social']);
    const cached = await this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM social_links WHERE is_active = 1 ORDER BY sort_order ASC').all();
    const items = result.results as any;
    await this.setCache(cacheKey, items, CACHE_CONFIG.settings);
    return items;
  }

  async createSocialLink(link: Partial<any>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO social_links (platform, name, url, icon, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      link.platform,
      link.name,
      link.url,
      link.icon || null,
      link.is_active !== undefined ? link.is_active : 1,
      link.sort_order || 0
    ).run();
    await this.invalidateCache(['settings', 'setting']);
    return result.meta!.last_row_id as number;
  }

  async updateSocialLink(id: number, link: Partial<any>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (link.platform !== undefined) { updates.push('platform = ?'); params.push(link.platform); }
    if (link.name !== undefined) { updates.push('name = ?'); params.push(link.name); }
    if (link.url !== undefined) { updates.push('url = ?'); params.push(link.url); }
    if (link.icon !== undefined) { updates.push('icon = ?'); params.push(link.icon); }
    if (link.is_active !== undefined) { updates.push('is_active = ?'); params.push(link.is_active); }
    if (link.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(link.sort_order); }
    
    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const result = await this.db.prepare(`UPDATE social_links SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    await this.invalidateCache(['settings', 'setting']);
    return result.success;
  }

  async deleteSocialLink(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM social_links WHERE id = ?').bind(id).run();
    await this.invalidateCache(['settings', 'setting']);
    return result.success;
  }

  async getContactInfo(): Promise<any[]> {
    const cacheKey = this.getCacheKey('settings', ['contact']);
    const cached = await this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM contact_info WHERE is_active = 1 ORDER BY sort_order ASC').all();
    const items = result.results as any;
    await this.setCache(cacheKey, items, CACHE_CONFIG.settings);
    return items;
  }

  async createContactInfo(info: Partial<any>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO contact_info (type, label, value, icon, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      info.type,
      info.label || null,
      info.value,
      info.icon || null,
      info.is_active !== undefined ? info.is_active : 1,
      info.sort_order || 0
    ).run();
    await this.invalidateCache(['settings', 'setting']);
    return result.meta!.last_row_id as number;
  }

  async updateContactInfo(id: number, info: Partial<any>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (info.type !== undefined) { updates.push('type = ?'); params.push(info.type); }
    if (info.label !== undefined) { updates.push('label = ?'); params.push(info.label); }
    if (info.value !== undefined) { updates.push('value = ?'); params.push(info.value); }
    if (info.icon !== undefined) { updates.push('icon = ?'); params.push(info.icon); }
    if (info.is_active !== undefined) { updates.push('is_active = ?'); params.push(info.is_active); }
    if (info.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(info.sort_order); }
    
    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const result = await this.db.prepare(`UPDATE contact_info SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    await this.invalidateCache(['settings', 'setting']);
    return result.success;
  }

  async deleteContactInfo(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM contact_info WHERE id = ?').bind(id).run();
    await this.invalidateCache(['settings', 'setting']);
    return result.success;
  }

  async getSlides(): Promise<any[]> {
    const cacheKey = this.getCacheKey('slides', ['active']);
    const cached = await this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM slides WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
    const items = result.results as any[];
    await this.setCache(cacheKey, items, CACHE_CONFIG.slides);
    return items;
  }

  async getSlideById(id: number): Promise<any> {
    const result = await this.db.prepare('SELECT * FROM slides WHERE id = ?').bind(id).first();
    return result as any;
  }

  async createSlide(slide: Partial<any>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO slides (title, subtitle, description, image_url, link_url, link_text, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      slide.title,
      slide.subtitle || null,
      slide.description || null,
      slide.image_url || null,
      slide.link_url || null,
      slide.link_text || null,
      slide.is_active !== undefined ? slide.is_active : 1,
      slide.sort_order || 0
    ).run();
    await this.invalidateCache(['slides']);
    return result.meta!.last_row_id as number;
  }

  async updateSlide(id: number, slide: Partial<any>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    if (slide.title !== undefined) { updates.push('title = ?'); params.push(slide.title); }
    if (slide.subtitle !== undefined) { updates.push('subtitle = ?'); params.push(slide.subtitle); }
    if (slide.description !== undefined) { updates.push('description = ?'); params.push(slide.description); }
    if (slide.image_url !== undefined) { updates.push('image_url = ?'); params.push(slide.image_url); }
    if (slide.link_url !== undefined) { updates.push('link_url = ?'); params.push(slide.link_url); }
    if (slide.link_text !== undefined) { updates.push('link_text = ?'); params.push(slide.link_text); }
    if (slide.is_active !== undefined) { updates.push('is_active = ?'); params.push(slide.is_active); }
    if (slide.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(slide.sort_order); }
    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    const result = await this.db.prepare(`UPDATE slides SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    await this.invalidateCache(['slides']);
    return result.success;
  }

  async deleteSlide(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM slides WHERE id = ?').bind(id).run();
    await this.invalidateCache(['slides']);
    return result.success;
  }

  async getJsonLdConfigs(): Promise<any[]> {
    const cacheKey = this.getCacheKey('jsonld', ['active']);
    const cached = await this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM json_ld_configs WHERE is_active = 1 ORDER BY id ASC').all();
    const items = result.results as any[];
    await this.setCache(cacheKey, items, CACHE_CONFIG.seo);
    return items;
  }

  async getJsonLdConfigById(id: number): Promise<any> {
    const result = await this.db.prepare('SELECT * FROM json_ld_configs WHERE id = ?').bind(id).first();
    return result as any;
  }

  async createJsonLdConfig(config: Partial<any>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO json_ld_configs (page_type, name, description, url, logo, same_as, contact_point, extra_data, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      config.page_type,
      config.name || null,
      config.description || null,
      config.url || null,
      config.logo || null,
      config.same_as || null,
      config.contact_point || null,
      config.extra_data || null,
      config.is_active !== undefined ? config.is_active : 1
    ).run();
    await this.invalidateCache(['jsonld']);
    return result.meta!.last_row_id as number;
  }

  async updateJsonLdConfig(id: number, config: Partial<any>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    if (config.page_type !== undefined) { updates.push('page_type = ?'); params.push(config.page_type); }
    if (config.name !== undefined) { updates.push('name = ?'); params.push(config.name); }
    if (config.description !== undefined) { updates.push('description = ?'); params.push(config.description); }
    if (config.url !== undefined) { updates.push('url = ?'); params.push(config.url); }
    if (config.logo !== undefined) { updates.push('logo = ?'); params.push(config.logo); }
    if (config.same_as !== undefined) { updates.push('same_as = ?'); params.push(config.same_as); }
    if (config.contact_point !== undefined) { updates.push('contact_point = ?'); params.push(config.contact_point); }
    if (config.extra_data !== undefined) { updates.push('extra_data = ?'); params.push(config.extra_data); }
    if (config.is_active !== undefined) { updates.push('is_active = ?'); params.push(config.is_active); }
    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    const result = await this.db.prepare(`UPDATE json_ld_configs SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    await this.invalidateCache(['jsonld']);
    return result.success;
  }

  async deleteJsonLdConfig(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM json_ld_configs WHERE id = ?').bind(id).run();
    await this.invalidateCache(['jsonld']);
    return result.success;
  }

  async getRobotsConfigs(): Promise<any[]> {
    const cacheKey = this.getCacheKey('robots', ['active']);
    const cached = await this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM robots_configs WHERE is_active = 1 ORDER BY sort_order ASC').all();
    const items = result.results as any[];
    await this.setCache(cacheKey, items, CACHE_CONFIG.seo);
    return items;
  }

  async getRobotsConfigById(id: number): Promise<any> {
    const result = await this.db.prepare('SELECT * FROM robots_configs WHERE id = ?').bind(id).first();
    return result as any;
  }

  async createRobotsConfig(config: Partial<any>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO robots_configs (user_agent, allow_paths, disallow_paths, sitemap_url, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      config.user_agent,
      config.allow_paths || null,
      config.disallow_paths || null,
      config.sitemap_url || null,
      config.is_active !== undefined ? config.is_active : 1,
      config.sort_order || 0
    ).run();
    await this.invalidateCache(['robots']);
    return result.meta!.last_row_id as number;
  }

  async updateRobotsConfig(id: number, config: Partial<any>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    if (config.user_agent !== undefined) { updates.push('user_agent = ?'); params.push(config.user_agent); }
    if (config.allow_paths !== undefined) { updates.push('allow_paths = ?'); params.push(config.allow_paths); }
    if (config.disallow_paths !== undefined) { updates.push('disallow_paths = ?'); params.push(config.disallow_paths); }
    if (config.sitemap_url !== undefined) { updates.push('sitemap_url = ?'); params.push(config.sitemap_url); }
    if (config.is_active !== undefined) { updates.push('is_active = ?'); params.push(config.is_active); }
    if (config.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(config.sort_order); }
    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    const result = await this.db.prepare(`UPDATE robots_configs SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    await this.invalidateCache(['robots']);
    return result.success;
  }

  async deleteRobotsConfig(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM robots_configs WHERE id = ?').bind(id).run();
    await this.invalidateCache(['robots']);
    return result.success;
  }

  async getTranslationConfig(): Promise<any> {
    const cacheKey = this.getCacheKey('translation_config', []);
    const cached = await this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM translation_config LIMIT 1').first();
    const config = result as any;
    
    if (config) {
      try {
        config.enabled_languages = JSON.parse(config.enabled_languages || '[]');
      } catch {
        config.enabled_languages = [];
      }
    }
    
    await this.setCache(cacheKey, config, CACHE_CONFIG.settings);
    return config;
  }

  async updateTranslationConfig(config: {
    api_url?: string;
    api_token?: string;
    enabled_languages?: string;
    is_enabled?: number;
  }): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (config.api_url !== undefined) { updates.push('api_url = ?'); params.push(config.api_url); }
    if (config.api_token !== undefined) { updates.push('api_token = ?'); params.push(config.api_token); }
    if (config.enabled_languages !== undefined) { updates.push('enabled_languages = ?'); params.push(config.enabled_languages); }
    if (config.is_enabled !== undefined) { updates.push('is_enabled = ?'); params.push(config.is_enabled); }
    
    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    const result = await this.db.prepare(`UPDATE translation_config SET ${updates.join(', ')} WHERE id = 1`).bind(...params).run();
    await this.invalidateCache('translation_config');
    return result.success;
  }

  // ============================================================
  // AI 智能客服
  // ============================================================

  async getAiChatConfig(): Promise<AiChatConfig | null> {
    const cacheKey = this.getCacheKey('ai_chat_config', []);
    const cached = await this.getFromCache<AiChatConfig>(cacheKey);
    if (cached) return cached;

    const result = await this.db.prepare('SELECT * FROM ai_chat_config LIMIT 1').first();
    const config = (result as unknown as AiChatConfig) || null;

    if (config) {
      await this.setCache(cacheKey, config, CACHE_CONFIG.settings);
    }
    return config;
  }

  async updateAiChatConfig(config: {
    is_enabled?: number;
    welcome_message?: string;
    system_prompt?: string;
    model?: string;
    api_url?: string;
    theme_color?: string;
    position?: string;
    collect_lead?: number;
    answer_tech_questions?: number;
    max_history?: number;
  }): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];

    const fields: Array<keyof typeof config> = [
      'is_enabled', 'welcome_message', 'system_prompt', 'model', 'api_url',
      'theme_color', 'position', 'collect_lead', 'answer_tech_questions', 'max_history',
    ];
    for (const field of fields) {
      const value = config[field];
      if (value !== undefined) {
        updates.push(`${field} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) return false;
    updates.push('updated_at = CURRENT_TIMESTAMP');

    const result = await this.db.prepare(
      `UPDATE ai_chat_config SET ${updates.join(', ')} WHERE id = 1`
    ).bind(...params).run();
    await this.invalidateCache('ai_chat_config');
    return result.success;
  }

  /** 保存一条会话消息（不做缓存，实时性优先） */
  async saveAiChatMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<number> {
    const result = await this.db.prepare(
      'INSERT INTO ai_chat_messages (session_id, role, content) VALUES (?, ?, ?)'
    ).bind(sessionId, role, content).run();
    return (result.meta!.last_row_id as number) || 0;
  }

  /** 取某个会话最近 N 条消息（时间正序返回，用于拼多轮上下文） */
  async getAiChatMessages(sessionId: string, limit = 10): Promise<AiChatMessage[]> {
    const result = await this.db.prepare(
      'SELECT * FROM ai_chat_messages WHERE session_id = ? ORDER BY id DESC LIMIT ?'
    ).bind(sessionId, limit).all();
    const rows = (result.results as unknown as AiChatMessage[]) || [];
    return rows.reverse();
  }

  /** 后台查看：最近会话概要 */
  async getRecentAiChatSessions(limit = 50): Promise<AiChatSessionSummary[]> {
    const result = await this.db.prepare(`
      SELECT session_id, COUNT(*) AS message_count, MAX(created_at) AS last_at,
             (SELECT content FROM ai_chat_messages m2 WHERE m2.session_id = m1.session_id ORDER BY id DESC LIMIT 1) AS last_message
      FROM ai_chat_messages m1
      GROUP BY session_id
      ORDER BY last_at DESC
      LIMIT ?
    `).bind(limit).all();
    return (result.results as unknown as AiChatSessionSummary[]) || [];
  }

  /**
   * 组装知识上下文：把 D1 里的产品/分类/方案/案例/新闻摘要拼成一段文本，
   * 供 AI 客服作为 system prompt 的事实依据。结果带缓存。
   */
  async getKnowledgeContext(): Promise<string> {
    const cacheKey = this.getCacheKey('ai_knowledge', []);
    const cached = await this.getFromCache<string>(cacheKey);
    if (cached) return cached;

    const settings = await this.db.prepare('SELECT key, value FROM settings').all();
    const siteName = settings.results?.find((s: any) => s.key === 'site_name')?.value || '';
    const siteDesc = settings.results?.find((s: any) => s.key === 'site_description')?.value || '';

    let ctx = '';
    if (siteName) ctx += `Company: ${siteName}\n`;
    if (siteDesc) ctx += `About: ${siteDesc}\n`;

    const contacts = await this.db.prepare(
      "SELECT type, label, value FROM contact_info WHERE is_active = 1 ORDER BY sort_order ASC"
    ).all();
    if (contacts.results?.length) {
      ctx += 'Contact information:\n';
      for (const row of contacts.results as any[]) {
        ctx += `- ${row.label || row.type}: ${row.value}\n`;
      }
    }

    const categories = await this.db.prepare(
      'SELECT name, description FROM categories WHERE is_active = 1 ORDER BY sort_order ASC'
    ).all();
    if (categories.results?.length) {
      ctx += 'Product categories:\n';
      for (const row of categories.results as any[]) {
        ctx += `- ${row.name}${row.description ? `: ${row.description}` : ''}\n`;
      }
    }

    const products = await this.db.prepare(
      'SELECT name, slug, short_description, price, min_order_qty FROM products WHERE is_active = 1 ORDER BY is_featured DESC, id DESC LIMIT 50'
    ).all();
    if (products.results?.length) {
      ctx += 'Products:\n';
      for (const row of products.results as any[]) {
        const parts = [`${row.name} (/${row.slug})`];
        if (row.short_description) parts.push(row.short_description);
        if (row.price) parts.push(`price: ${row.price}`);
        if (row.min_order_qty) parts.push(`MOQ: ${row.min_order_qty}`);
        ctx += `- ${parts.join(' | ')}\n`;
      }
    }

    const solutions = await this.db.prepare(
      'SELECT title, short_description FROM solutions WHERE is_active = 1 LIMIT 20'
    ).all();
    if (solutions.results?.length) {
      ctx += 'Solutions:\n';
      for (const row of solutions.results as any[]) {
        ctx += `- ${row.title}${row.short_description ? `: ${row.short_description}` : ''}\n`;
      }
    }

    const cases = await this.db.prepare(
      'SELECT title, industry, results FROM cases WHERE is_active = 1 LIMIT 20'
    ).all();
    if (cases.results?.length) {
      ctx += 'Customer cases:\n';
      for (const row of cases.results as any[]) {
        const parts = [row.title];
        if (row.industry) parts.push(`industry: ${row.industry}`);
        if (row.results) parts.push(row.results);
        ctx += `- ${parts.join(' | ')}\n`;
      }
    }

    const news = await this.db.prepare(
      'SELECT title, short_description FROM news WHERE is_active = 1 ORDER BY published_at DESC LIMIT 10'
    ).all();
    if (news.results?.length) {
      ctx += 'Latest news:\n';
      for (const row of news.results as any[]) {
        ctx += `- ${row.title}${row.short_description ? `: ${row.short_description}` : ''}\n`;
      }
    }

    await this.setCache(cacheKey, ctx, CACHE_CONFIG.settings);
    return ctx;
  }
}

export function createDatabase(db: D1Database, cache?: KVNamespace): Database {
  return new Database(db, cache);
}

export { Database };

export async function generateRobotsTxt(db: D1Database): Promise<string> {
  const configs = await db.prepare('SELECT * FROM robots_configs WHERE is_active = 1 ORDER BY sort_order ASC').all();
  const settings = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('site_url').first() as any;
  const siteUrl = settings?.value || '';

  let robots = '# Robots.txt\n';
  for (const config of (configs.results as any) || []) {
    robots += `User-agent: ${config.user_agent}\n`;
    if (config.allow_paths) {
      const paths = config.allow_paths.split('\n').filter((p: string) => p.trim());
      for (const path of paths) {
        robots += `Allow: ${path.trim()}\n`;
      }
    }
    if (config.disallow_paths) {
      const paths = config.disallow_paths.split('\n').filter((p: string) => p.trim());
      for (const path of paths) {
        robots += `Disallow: ${path.trim()}\n`;
      }
    }
    if (config.sitemap_url) {
      robots += `Sitemap: ${config.sitemap_url}\n`;
    } else if (siteUrl) {
      robots += `Sitemap: ${siteUrl}/sitemap.xml\n`;
    }
    robots += '\n';
  }
  return robots;
}

export async function generateLLMsTxt(db: D1Database): Promise<string> {
  const settings = await db.prepare('SELECT key, value FROM settings').all();
  const siteName = settings.results?.find((s: any) => s.key === 'site_name')?.value || 'B2B Wholesale';
  const siteDesc = settings.results?.find((s: any) => s.key === 'site_description')?.value || '';

  let content = `# ${siteName}\n\n`;
  content += `${siteDesc}\n\n`;

  const products = await db.prepare('SELECT name, short_description FROM products WHERE is_active = 1 LIMIT 20').all();
  if (products.results?.length) {
    content += `## Products\n\n`;
    for (const p of products.results as any[]) {
      content += `- ${p.name}: ${p.short_description || ''}\n`;
    }
    content += '\n';
  }

  const categories = await db.prepare('SELECT name, description FROM categories WHERE is_active = 1').all();
  if (categories.results?.length) {
    content += `## Categories\n\n`;
    for (const c of categories.results as any[]) {
      content += `- ${c.name}: ${c.description || ''}\n`;
    }
  }

  return content;
}
