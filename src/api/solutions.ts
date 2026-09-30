import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';
import { authMiddleware } from '../middleware/auth';

const solutions = new Hono<{ Bindings: Env }>();

solutions.get('/', async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const featured = c.req.query('featured') === 'true';
    const solutions = await db.getSolutions(featured ? true : undefined);
    
    return c.json({
      success: true,
      data: solutions,
    });
  } catch (err) {
    console.error('Get solutions error:', err);
    return c.json({ success: false, error: 'Failed to get solutions' }, 500);
  }
});

solutions.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const db = new Database(c.env.DB, c.env.CACHE);
    const solution = await db.getSolutionBySlug(slug);
    
    if (!solution) {
      return c.json({ success: false, error: 'Solution not found' }, 404);
    }
    
    return c.json({
      success: true,
      data: solution,
    });
  } catch (err) {
    console.error('Get solution error:', err);
    return c.json({ success: false, error: 'Failed to get solution' }, 500);
  }
});

solutions.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    const id = await db.createSolution({
      title: body.title,
      slug: body.slug,
      short_description: body.short_description,
      content: body.content,
      images: body.images ? JSON.stringify(body.images) : null,
      industries: body.industries ? JSON.stringify(body.industries) : null,
      is_featured: body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : 0,
      is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      sort_order: body.sort_order || 0,
    });
    
    return c.json({
      success: true,
      data: { id },
      message: 'Solution created successfully',
    });
  } catch (err) {
    console.error('Create solution error:', err);
    return c.json({ success: false, error: 'Failed to create solution' }, 500);
  }
});

solutions.put('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    const updates: any = {
      title: body.title,
      slug: body.slug,
      short_description: body.short_description,
      content: body.content,
      sort_order: body.sort_order,
    };
    
    if (body.images !== undefined) {
      updates.images = body.images ? JSON.stringify(body.images) : null;
    }
    if (body.industries !== undefined) {
      updates.industries = body.industries ? JSON.stringify(body.industries) : null;
    }
    if (body.is_featured !== undefined) {
      updates.is_featured = body.is_featured ? 1 : 0;
    }
    if (body.is_active !== undefined) {
      updates.is_active = body.is_active ? 1 : 0;
    }
    
    const updated = await db.updateSolution(id, updates);
    
    if (!updated) {
      return c.json({ success: false, error: 'Failed to update solution' }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Solution updated successfully',
    });
  } catch (err) {
    console.error('Update solution error:', err);
    return c.json({ success: false, error: 'Failed to update solution' }, 500);
  }
});

solutions.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const db = new Database(c.env.DB, c.env.CACHE);
    const deleted = await db.deleteSolution(id);
    
    if (!deleted) {
      return c.json({ success: false, error: 'Failed to delete solution' }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Solution deleted successfully',
    });
  } catch (err) {
    console.error('Delete solution error:', err);
    return c.json({ success: false, error: 'Failed to delete solution' }, 500);
  }
});

export default solutions;
