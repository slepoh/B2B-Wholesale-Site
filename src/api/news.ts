import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';
import { authMiddleware } from '../middleware/auth';

const news = new Hono<{ Bindings: Env }>();

news.get('/', async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const featured = c.req.query('featured') === 'true';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    
    const result = await db.getNews(featured ? true : undefined, page, limit);
    
    return c.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    console.error('Get news error:', err);
    return c.json({ success: false, error: 'Failed to get news' }, 500);
  }
});

news.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const db = new Database(c.env.DB, c.env.CACHE);
    const item = await db.getNewsBySlug(slug);
    
    if (!item) {
      return c.json({ success: false, error: 'News not found' }, 404);
    }
    
    return c.json({
      success: true,
      data: item,
    });
  } catch (err) {
    console.error('Get news error:', err);
    return c.json({ success: false, error: 'Failed to get news' }, 500);
  }
});

news.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    const id = await db.createNews({
      title: body.title,
      slug: body.slug,
      short_description: body.short_description,
      content: body.content,
      images: body.images ? JSON.stringify(body.images) : null,
      author: body.author,
      is_featured: body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : 0,
      is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      published_at: body.published_at || new Date().toISOString(),
    });
    
    return c.json({
      success: true,
      data: { id },
      message: 'News created successfully',
    });
  } catch (err) {
    console.error('Create news error:', err);
    return c.json({ success: false, error: 'Failed to create news' }, 500);
  }
});

news.put('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    const updates: any = {
      title: body.title,
      slug: body.slug,
      short_description: body.short_description,
      content: body.content,
      author: body.author,
      published_at: body.published_at,
    };
    
    if (body.images !== undefined) {
      updates.images = body.images ? JSON.stringify(body.images) : null;
    }
    if (body.is_featured !== undefined) {
      updates.is_featured = body.is_featured ? 1 : 0;
    }
    if (body.is_active !== undefined) {
      updates.is_active = body.is_active ? 1 : 0;
    }
    
    const updated = await db.updateNews(id, updates);
    
    if (!updated) {
      return c.json({ success: false, error: 'Failed to update news' }, 400);
    }
    
    return c.json({
      success: true,
      message: 'News updated successfully',
    });
  } catch (err) {
    console.error('Update news error:', err);
    return c.json({ success: false, error: 'Failed to update news' }, 500);
  }
});

news.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const db = new Database(c.env.DB, c.env.CACHE);
    const deleted = await db.deleteNews(id);
    
    if (!deleted) {
      return c.json({ success: false, error: 'Failed to delete news' }, 400);
    }
    
    return c.json({
      success: true,
      message: 'News deleted successfully',
    });
  } catch (err) {
    console.error('Delete news error:', err);
    return c.json({ success: false, error: 'Failed to delete news' }, 500);
  }
});

export default news;
