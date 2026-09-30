import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';

const categories = new Hono<{ Bindings: Env }>();

categories.get('/', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const parentId = c.req.query('parent');
  const categories = await db.getCategories(parentId ? parseInt(parentId) : undefined);
  return c.json({ success: true, data: categories });
});

categories.get('/:slug', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const slug = c.req.param('slug');
  const category = await db.getCategoryBySlug(slug);
  if (!category) {
    return c.json({ success: false, error: 'Category not found' }, 404);
  }
  return c.json({ success: true, data: category });
});

export default categories;