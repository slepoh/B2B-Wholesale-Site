import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';
import { authMiddleware } from '../middleware/auth';

const cases = new Hono<{ Bindings: Env }>();

cases.get('/', async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const featured = c.req.query('featured') === 'true';
    const items = await db.getCases(featured ? true : undefined);
    
    return c.json({
      success: true,
      data: items,
    });
  } catch (err) {
    console.error('Get cases error:', err);
    return c.json({ success: false, error: 'Failed to get cases' }, 500);
  }
});

cases.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const db = new Database(c.env.DB, c.env.CACHE);
    const item = await db.getCaseBySlug(slug);
    
    if (!item) {
      return c.json({ success: false, error: 'Case not found' }, 404);
    }
    
    return c.json({
      success: true,
      data: item,
    });
  } catch (err) {
    console.error('Get case error:', err);
    return c.json({ success: false, error: 'Failed to get case' }, 500);
  }
});

cases.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    const id = await db.createCase({
      title: body.title,
      slug: body.slug,
      client_name: body.client_name,
      industry: body.industry,
      challenge: body.challenge,
      solution: body.solution,
      results: body.results,
      images: body.images ? JSON.stringify(body.images) : null,
      testimonial: body.testimonial,
      is_featured: body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : 0,
      is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      sort_order: body.sort_order || 0,
    });
    
    return c.json({
      success: true,
      data: { id },
      message: 'Case created successfully',
    });
  } catch (err) {
    console.error('Create case error:', err);
    return c.json({ success: false, error: 'Failed to create case' }, 500);
  }
});

cases.put('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    const updates: any = {
      title: body.title,
      slug: body.slug,
      client_name: body.client_name,
      industry: body.industry,
      challenge: body.challenge,
      solution: body.solution,
      results: body.results,
      testimonial: body.testimonial,
      sort_order: body.sort_order,
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
    
    const updated = await db.updateCase(id, updates);
    
    if (!updated) {
      return c.json({ success: false, error: 'Failed to update case' }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Case updated successfully',
    });
  } catch (err) {
    console.error('Update case error:', err);
    return c.json({ success: false, error: 'Failed to update case' }, 500);
  }
});

cases.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const db = new Database(c.env.DB, c.env.CACHE);
    const deleted = await db.deleteCase(id);
    
    if (!deleted) {
      return c.json({ success: false, error: 'Failed to delete case' }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Case deleted successfully',
    });
  } catch (err) {
    console.error('Delete case error:', err);
    return c.json({ success: false, error: 'Failed to delete case' }, 500);
  }
});

export default cases;
