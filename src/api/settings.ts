import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';
import { authMiddleware } from '../middleware/auth';

const settings = new Hono<{ Bindings: Env }>();

settings.get('/', async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const settings = await db.getSettings();
    
    return c.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    console.error('Get settings error:', err);
    return c.json({ success: false, error: 'Failed to get settings' }, 500);
  }
});

settings.get('/popup', async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const popup = await db.getPopupSettings();
    
    return c.json({
      success: true,
      data: popup,
    });
  } catch (err) {
    console.error('Get popup settings error:', err);
    return c.json({ success: false, error: 'Failed to get popup settings' }, 500);
  }
});

settings.get('/social', async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const social = await db.getSocialLinks();
    
    return c.json({
      success: true,
      data: social,
    });
  } catch (err) {
    console.error('Get social links error:', err);
    return c.json({ success: false, error: 'Failed to get social links' }, 500);
  }
});

settings.get('/contact', async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const contact = await db.getContactInfo();
    
    return c.json({
      success: true,
      data: contact,
    });
  } catch (err) {
    console.error('Get contact info error:', err);
    return c.json({ success: false, error: 'Failed to get contact info' }, 500);
  }
});

settings.post('/', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    await db.updateSetting(body.key, body.value);
    
    return c.json({
      success: true,
      message: 'Setting updated successfully',
    });
  } catch (err) {
    console.error('Update setting error:', err);
    return c.json({ success: false, error: 'Failed to update setting' }, 500);
  }
});

settings.post('/popup', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    await db.updatePopupSettings({
      is_enabled: body.is_enabled !== undefined ? (body.is_enabled ? 1 : 0) : undefined,
      delay_seconds: body.delay_seconds,
      show_on_exit: body.show_on_exit !== undefined ? (body.show_on_exit ? 1 : 0) : undefined,
      title: body.title,
      description: body.description,
      form_fields: body.form_fields ? JSON.stringify(body.form_fields) : undefined,
    });
    
    return c.json({
      success: true,
      message: 'Popup settings updated successfully',
    });
  } catch (err) {
    console.error('Update popup settings error:', err);
    return c.json({ success: false, error: 'Failed to update popup settings' }, 500);
  }
});

settings.post('/social', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    if (body.id) {
      await db.updateSocialLink(body.id, {
        platform: body.platform,
        name: body.name,
        url: body.url,
        icon: body.icon,
        is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : undefined,
        sort_order: body.sort_order,
      });
    } else {
      await db.createSocialLink({
        platform: body.platform,
        name: body.name,
        url: body.url,
        icon: body.icon,
        is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
        sort_order: body.sort_order || 0,
      });
    }
    
    return c.json({
      success: true,
      message: 'Social link saved successfully',
    });
  } catch (err) {
    console.error('Save social link error:', err);
    return c.json({ success: false, error: 'Failed to save social link' }, 500);
  }
});

settings.delete('/social/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const db = new Database(c.env.DB, c.env.CACHE);
    await db.deleteSocialLink(id);
    
    return c.json({
      success: true,
      message: 'Social link deleted successfully',
    });
  } catch (err) {
    console.error('Delete social link error:', err);
    return c.json({ success: false, error: 'Failed to delete social link' }, 500);
  }
});

settings.post('/contact', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    if (body.id) {
      await db.updateContactInfo(body.id, {
        type: body.type,
        label: body.label,
        value: body.value,
        icon: body.icon,
        is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : undefined,
        sort_order: body.sort_order,
      });
    } else {
      await db.createContactInfo({
        type: body.type,
        label: body.label,
        value: body.value,
        icon: body.icon,
        is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
        sort_order: body.sort_order || 0,
      });
    }
    
    return c.json({
      success: true,
      message: 'Contact info saved successfully',
    });
  } catch (err) {
    console.error('Save contact info error:', err);
    return c.json({ success: false, error: 'Failed to save contact info' }, 500);
  }
});

settings.delete('/contact/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const db = new Database(c.env.DB, c.env.CACHE);
    await db.deleteContactInfo(id);
    
    return c.json({
      success: true,
      message: 'Contact info deleted successfully',
    });
  } catch (err) {
    console.error('Delete contact info error:', err);
    return c.json({ success: false, error: 'Failed to delete contact info' }, 500);
  }
});

export default settings;
