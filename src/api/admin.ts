import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';
import { ALL_CACHE_PREFIXES } from '../db/cache';
import { checkBasicAuth } from '../middleware/auth';

const admin = new Hono<{ Bindings: Env }>();

admin.post('/login', async (c) => {
  const adminUsername = c.env.ADMIN_USERNAME;
  const adminPassword = c.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return c.json({ success: false, error: 'Admin not configured' }, 500);
  }

  if (!checkBasicAuth(c)) {
    return c.json({ success: false, error: 'Invalid credentials' }, 401);
  }

  return c.json({ success: true, data: { username: adminUsername } });
});

/** 手动清空所有 KV 缓存（后台「清除缓存」按钮） */
admin.post('/cache/clear', async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    await db.invalidateCache(ALL_CACHE_PREFIXES);
    return c.json({ success: true, message: 'Cache cleared' });
  } catch (err) {
    console.error('Clear cache error:', err);
    return c.json({ success: false, error: 'Failed to clear cache' }, 500);
  }
});

admin.post('/products', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const body = await c.req.json();
  const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const id = await db.createProduct({ ...body, slug });
  return c.json({ success: true, data: { id }, message: 'Product created' }, 201);
});

admin.put('/products/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const body = await c.req.json();
  const updated = await db.updateProduct(id, body);
  if (!updated) {
    return c.json({ success: false, error: 'Failed to update' }, 500);
  }
  return c.json({ success: true, message: 'Product updated' });
});

admin.delete('/products/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const deleted = await db.deleteProduct(id);
  if (!deleted) {
    return c.json({ success: false, error: 'Failed to delete' }, 500);
  }
  return c.json({ success: true, message: 'Product deleted' });
});

admin.post('/categories', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const body = await c.req.json();
  const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const id = await db.createCategory({ ...body, slug });
  return c.json({ success: true, data: { id }, message: 'Category created' }, 201);
});

admin.put('/categories/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const body = await c.req.json();
  const updated = await db.updateCategory(id, body);
  if (!updated) {
    return c.json({ success: false, error: 'Failed to update' }, 500);
  }
  return c.json({ success: true, message: 'Category updated' });
});

admin.delete('/categories/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const deleted = await db.deleteCategory(id);
  if (!deleted) {
    return c.json({ success: false, error: 'Failed to delete' }, 500);
  }
  return c.json({ success: true, message: 'Category deleted' });
});

admin.post('/solutions', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const body = await c.req.json();
  const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const id = await db.createSolution({ ...body, slug });
  return c.json({ success: true, data: { id }, message: 'Solution created' }, 201);
});

admin.put('/solutions/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const body = await c.req.json();
  const updated = await db.updateSolution(id, body);
  if (!updated) {
    return c.json({ success: false, error: 'Failed to update' }, 500);
  }
  return c.json({ success: true, message: 'Solution updated' });
});

admin.delete('/solutions/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const deleted = await db.deleteSolution(id);
  if (!deleted) {
    return c.json({ success: false, error: 'Failed to delete' }, 500);
  }
  return c.json({ success: true, message: 'Solution deleted' });
});

admin.post('/cases', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const body = await c.req.json();
  const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const id = await db.createCase({ ...body, slug });
  return c.json({ success: true, data: { id }, message: 'Case created' }, 201);
});

admin.put('/cases/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const body = await c.req.json();
  const updated = await db.updateCase(id, body);
  if (!updated) {
    return c.json({ success: false, error: 'Failed to update' }, 500);
  }
  return c.json({ success: true, message: 'Case updated' });
});

admin.delete('/cases/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const deleted = await db.deleteCase(id);
  if (!deleted) {
    return c.json({ success: false, error: 'Failed to delete' }, 500);
  }
  return c.json({ success: true, message: 'Case deleted' });
});

admin.post('/news', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const body = await c.req.json();
  const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const id = await db.createNews({ ...body, slug });
  return c.json({ success: true, data: { id }, message: 'News created' }, 201);
});

admin.put('/news/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const body = await c.req.json();
  const updated = await db.updateNews(id, body);
  if (!updated) {
    return c.json({ success: false, error: 'Failed to update' }, 500);
  }
  return c.json({ success: true, message: 'News updated' });
});

admin.delete('/news/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const deleted = await db.deleteNews(id);
  if (!deleted) {
    return c.json({ success: false, error: 'Failed to delete' }, 500);
  }
  return c.json({ success: true, message: 'News deleted' });
});

admin.get('/inquiries', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const status = c.req.query('status') || undefined;
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('limit') || '20');
  const result = await db.getInquiries(status, page, pageSize);
  return c.json({
    success: true,
    data: {
      items: result.items,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize)
    }
  });
});

admin.get('/inquiries/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const inquiry = await db.getInquiryById(id);
  if (!inquiry) {
    return c.json({ success: false, error: 'Inquiry not found' }, 404);
  }
  return c.json({ success: true, data: inquiry });
});

admin.patch('/inquiries/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const { status, notes } = await c.req.json();
  const updated = await db.updateInquiryStatus(id, status, notes);
  if (!updated) {
    return c.json({ success: false, error: 'Failed to update' }, 500);
  }
  return c.json({ success: true, message: 'Inquiry updated' });
});

admin.post('/pages', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const body = await c.req.json();
  const id = await db.createPage(body);
  return c.json({ success: true, data: { id }, message: 'Page created' }, 201);
});

admin.put('/pages/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const body = await c.req.json();
  const updated = await db.updatePage(id, body);
  if (!updated) {
    return c.json({ success: false, error: 'Failed to update' }, 500);
  }
  return c.json({ success: true, message: 'Page updated' });
});

admin.delete('/pages/:id', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const id = parseInt(c.req.param('id') || '0');
  const deleted = await db.deletePage(id);
  if (!deleted) {
    return c.json({ success: false, error: 'Failed to delete' }, 500);
  }
  return c.json({ success: true, message: 'Page deleted' });
});

admin.get('/stats', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const stats = await db.getStats();
  return c.json({
    success: true,
    data: stats,
  });
});

export default admin;
