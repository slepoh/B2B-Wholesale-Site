import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';
import { sendEmail } from '../utils/email';
import { authMiddleware } from '../middleware/auth';

const leads = new Hono<{ Bindings: Env }>();

// 客户线索属于敏感数据，读取/修改/删除均需管理员鉴权
leads.get('/', authMiddleware, async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const status = c.req.query('status') || undefined;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    
    const result = await db.getLeads(status, page, limit);
    
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
    console.error('Get leads error:', err);
    return c.json({ success: false, error: 'Failed to get leads' }, 500);
  }
});

leads.get('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const db = new Database(c.env.DB, c.env.CACHE);
    const lead = await db.getLeadById(id);
    
    if (!lead) {
      return c.json({ success: false, error: 'Lead not found' }, 404);
    }
    
    return c.json({
      success: true,
      data: lead,
    });
  } catch (err) {
    console.error('Get lead error:', err);
    return c.json({ success: false, error: 'Failed to get lead' }, 500);
  }
});

// POST / 是前台公开表单提交入口，保持无需鉴权
leads.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { name, phone, whatsapp, email, message, product_id } = body;

    if (!name || !message) {
      return c.json({ 
        success: false, 
        error: 'Name and message are required' 
      }, 400);
    }

    const db = new Database(c.env.DB, c.env.CACHE);
    const leadId = await db.createLead({
      name,
      phone,
      whatsapp,
      email,
      message,
      product_id,
      source: 'popup',
      status: 'new',
    });

    if (c.env.EMAIL_API_KEY) {
      const adminEmail = c.env.ADMIN_EMAIL || 'admin@b2bwholesale.com';
      const lead = await db.getLeadById(leadId);
      
      if (lead) {
        const subject = `New Lead from ${lead.name}`;
        const text = `
New Lead Received

Name: ${lead.name}
Phone: ${lead.phone || 'Not provided'}
WhatsApp: ${lead.whatsapp || 'Not provided'}
Email: ${lead.email || 'Not provided'}

Message:
${lead.message}

Source: Popup Form
        `.trim();
        
        await sendEmail({ 
          DB: c.env.DB, 
          R2_BUCKET: c.env.R2_BUCKET, 
          EMAIL_API_KEY: c.env.EMAIL_API_KEY,
          ADMIN_EMAIL: c.env.ADMIN_EMAIL
        }, {
          to: adminEmail,
          subject,
          text,
        });
      }
    }

    return c.json({
      success: true,
      data: { id: leadId },
      message: 'Lead submitted successfully',
    });
  } catch (err) {
    console.error('Create lead error:', err);
    return c.json({ 
      success: false, 
      error: 'Failed to submit lead. Please try again.' 
    }, 500);
  }
});

leads.patch('/:id/status', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const { status, notes } = await c.req.json();
    
    if (!['new', 'contacted', 'qualified', 'converted', 'lost'].includes(status)) {
      return c.json({ success: false, error: 'Invalid status' }, 400);
    }
    
    const db = new Database(c.env.DB, c.env.CACHE);
    const updated = await db.updateLeadStatus(id, status, notes);
    
    if (!updated) {
      return c.json({ success: false, error: 'Failed to update lead' }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Lead status updated',
    });
  } catch (err) {
    console.error('Update lead error:', err);
    return c.json({ success: false, error: 'Failed to update lead' }, 500);
  }
});

leads.delete('/:id', authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '0');
    const db = new Database(c.env.DB, c.env.CACHE);
    const deleted = await db.deleteLead(id);
    
    if (!deleted) {
      return c.json({ success: false, error: 'Failed to delete lead' }, 400);
    }
    
    return c.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (err) {
    console.error('Delete lead error:', err);
    return c.json({ success: false, error: 'Failed to delete lead' }, 500);
  }
});

export default leads;
