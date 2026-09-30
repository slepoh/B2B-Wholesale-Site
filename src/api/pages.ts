import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';
import { authMiddleware } from '../middleware/auth';

const pages = new Hono<{ Bindings: Env }>();

pages.get('/', async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const pages = await db.getPages();
    
    return c.json({
      success: true,
      data: pages,
    });
  } catch (err) {
    console.error('Get pages error:', err);
    return c.json({ success: false, error: 'Failed to get pages' }, 500);
  }
});

pages.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const db = new Database(c.env.DB, c.env.CACHE);
    const page = await db.getPageBySlug(slug);
    
    if (!page) {
      return c.json({ success: false, error: 'Page not found' }, 404);
    }
    
    return c.json({
      success: true,
      data: page,
    });
  } catch (err) {
    console.error('Get page error:', err);
    return c.json({ success: false, error: 'Failed to get page' }, 500);
  }
});

pages.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    const id = await db.createPage({
      title: body.title,
      slug: body.slug,
      content: body.content,
      meta_title: body.meta_title,
      meta_description: body.meta_description,
      meta_keywords: body.meta_keywords,
      is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
    });
    
    return c.json({
      success: true,
      data: { id },
      message: 'Page created successfully',
    });
  } catch (err) {
    console.error('Create page error:', err);
    return c.json({ success: false, error: 'Failed to create page' }, 500);
  }
});

pages.put('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    const updated = await db.updatePage(id, {
      title: body.title,
      slug: body.slug,
      content: body.content,
      meta_title: body.meta_title,
      meta_description: body.meta_description,
      meta_keywords: body.meta_keywords,
      is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : undefined,
    });
    
    if (!updated) {
      return c.json({ success: false, error: 'Failed to update page' }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Page updated successfully',
    });
  } catch (err) {
    console.error('Update page error:', err);
    return c.json({ success: false, error: 'Failed to update page' }, 500);
  }
});

pages.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const db = new Database(c.env.DB, c.env.CACHE);
    const deleted = await db.deletePage(id);
    
    if (!deleted) {
      return c.json({ success: false, error: 'Failed to delete page' }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (err) {
    console.error('Delete page error:', err);
    return c.json({ success: false, error: 'Failed to delete page' }, 500);
  }
});

export default pages;
