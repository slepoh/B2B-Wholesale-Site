import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';
import { z } from 'zod';
import { sendEmail, generateInquiryNotificationEmail, generateInquiryConfirmationEmail } from '../utils/email';
import { authMiddleware } from '../middleware/auth';

const inquirySchema = z.object({
  product_id: z.number().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  country: z.string().optional(),
  message: z.string().min(1)
});

const inquiries = new Hono<{ Bindings: Env }>();

inquiries.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = inquirySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ 
        success: false, 
        error: 'Invalid input', 
        details: parsed.error.errors 
      }, 400);
    }

    const db = new Database(c.env.DB, c.env.CACHE);
    const id = await db.createInquiry(parsed.data);

    const inquiry = await db.getInquiryById(id);
    if (!inquiry) {
      throw new Error('Failed to retrieve created inquiry');
    }

    let productName: string | undefined;
    if (parsed.data.product_id) {
      const product = await db.getProductById(parsed.data.product_id);
      productName = product?.name;
    }

    if (c.env.EMAIL_API_KEY) {
      const adminEmail = c.env.ADMIN_EMAIL || 'admin@b2bwholesale.com';
      
      const notificationEmail = generateInquiryNotificationEmail(inquiry, productName);
      await sendEmail({ 
        DB: c.env.DB, 
        R2_BUCKET: c.env.R2_BUCKET, 
        EMAIL_API_KEY: c.env.EMAIL_API_KEY,
        ADMIN_EMAIL: c.env.ADMIN_EMAIL
      }, {
        to: adminEmail,
        subject: notificationEmail.subject,
        text: notificationEmail.text,
        html: notificationEmail.html,
      });

      const confirmationEmail = generateInquiryConfirmationEmail(inquiry, productName);
      await sendEmail({ 
        DB: c.env.DB, 
        R2_BUCKET: c.env.R2_BUCKET, 
        EMAIL_API_KEY: c.env.EMAIL_API_KEY,
        ADMIN_EMAIL: c.env.ADMIN_EMAIL
      }, {
        to: inquiry.email,
        subject: confirmationEmail.subject,
        text: confirmationEmail.text,
        html: confirmationEmail.html,
      });
    }

    return c.json({ 
      success: true, 
      data: { id }, 
      message: 'Inquiry submitted successfully' 
    }, 201);
  } catch (err) {
    console.error('Create inquiry error:', err);
    return c.json({ 
      success: false, 
      error: 'Failed to submit inquiry. Please try again.' 
    }, 500);
  }
});

inquiries.get('/', authMiddleware, async (c) => {
  try {
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
  } catch (err) {
    console.error('Get inquiries error:', err);
    return c.json({ 
      success: false, 
      error: 'Failed to get inquiries' 
    }, 500);
  }
});

inquiries.get('/:id', authMiddleware, async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const id = parseInt(c.req.param('id') || '0');
    const inquiry = await db.getInquiryById(id);
    
    if (!inquiry) {
      return c.json({ success: false, error: 'Inquiry not found' }, 404);
    }
    
    return c.json({ success: true, data: inquiry });
  } catch (err) {
    console.error('Get inquiry error:', err);
    return c.json({ 
      success: false, 
      error: 'Failed to get inquiry' 
    }, 500);
  }
});

inquiries.patch('/:id/status', authMiddleware, async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const id = parseInt(c.req.param('id') || '0');
    const { status, notes } = await c.req.json();
    
    if (!['pending', 'replied', 'completed', 'archived'].includes(status)) {
      return c.json({ success: false, error: 'Invalid status' }, 400);
    }
    
    const updated = await db.updateInquiryStatus(id, status, notes);
    if (!updated) {
      return c.json({ success: false, error: 'Failed to update' }, 500);
    }
    
    return c.json({ success: true, message: 'Status updated' });
  } catch (err) {
    console.error('Update inquiry error:', err);
    return c.json({ 
      success: false, 
      error: 'Failed to update inquiry' 
    }, 500);
  }
});

inquiries.delete('/:id', authMiddleware, async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const id = parseInt(c.req.param('id') || '0');
    const deleted = await db.deleteInquiry(id);
    
    if (!deleted) {
      return c.json({ success: false, error: 'Failed to delete' }, 500);
    }
    
    return c.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete inquiry error:', err);
    return c.json({ 
      success: false, 
      error: 'Failed to delete inquiry' 
    }, 500);
  }
});

export default inquiries;
