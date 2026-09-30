import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';
import { authMiddleware } from '../middleware/auth';

const robots = new Hono<{ Bindings: Env }>();

robots.get('/', async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const configs = await db.getRobotsConfigs();
    return c.json({ success: true, data: configs });
  } catch (err) {
    return c.json({ success: false, error: 'Failed to get robots configs' }, 500);
  }
});

robots.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    const id = await db.createRobotsConfig(body);
    return c.json({ success: true, data: { id } });
  } catch (err) {
    return c.json({ success: false, error: 'Failed to create robots config' }, 500);
  }
});

robots.put('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    await db.updateRobotsConfig(id, body);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: 'Failed to update robots config' }, 500);
  }
});

robots.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const db = new Database(c.env.DB, c.env.CACHE);
    await db.deleteRobotsConfig(id);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: 'Failed to delete robots config' }, 500);
  }
});

export default robots;
