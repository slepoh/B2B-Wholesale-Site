import type { Env } from '../db';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

export async function sendEmail(env: Env, options: SendEmailOptions): Promise<boolean> {
  try {
    const apiUrl = `https://api.mailchannels.com/transactions`;
    
    const payload = {
      personalizations: [
        {
          to: Array.isArray(options.to) 
            ? options.to.map(email => ({ email }))
            : [{ email: options.to }],
        },
      ],
      from: {
        email: options.from || 'noreply@b2bwholesale.com',
        name: 'B2B Wholesale',
      },
      subject: options.subject,
      content: [
        {
          type: 'text/plain',
          value: options.text,
        },
        ...(options.html
          ? [
              {
                type: 'text/html',
                value: options.html,
              },
            ]
          : []),
      ],
    };

    const apiKey = env.EMAIL_API_KEY;
    if (!apiKey) {
      console.warn('Email API key not configured, skipping email send');
      return false;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send email:', error);
      return false;
    }

    console.log('Email sent successfully');
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
}

export function generateInquiryNotificationEmail(
  inquiry: {
    name: string;
    email: string;
    company?: string | null;
    country?: string | null;
    message: string;
    created_at: string;
  },
  productName?: string
): { subject: string; text: string; html: string } {
  const subject = `New Inquiry from ${inquiry.name}${productName ? ` - ${productName}` : ''}`;
  
  const text = `
New Inquiry Received

Customer Information:
- Name: ${inquiry.name}
- Email: ${inquiry.email}
- Company: ${inquiry.company || 'Not provided'}
- Country: ${inquiry.country || 'Not provided'}
- Product: ${productName || 'General inquiry'}

Message:
${inquiry.message}

Received at: ${inquiry.created_at}

---
This is an automated notification from B2B Wholesale Site
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066cc; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .label { font-weight: bold; color: #666; }
    .message { background: white; padding: 15px; border-left: 4px solid #0066cc; margin: 15px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📬 New Inquiry Received</h1>
    </div>
    <div class="content">
      <div class="info-box">
        <h3>Customer Information</h3>
        <p><span class="label">Name:</span> ${inquiry.name}</p>
        <p><span class="label">Email:</span> ${inquiry.email}</p>
        <p><span class="label">Company:</span> ${inquiry.company || 'Not provided'}</p>
        <p><span class="label">Country:</span> ${inquiry.country || 'Not provided'}</p>
        <p><span class="label">Product:</span> ${productName || 'General inquiry'}</p>
      </div>
      <div class="message">
        <h3>Message</h3>
        <p>${inquiry.message.replace(/\n/g, '<br>')}</p>
      </div>
      <p><small>Received at: ${inquiry.created_at}</small></p>
      <p><small>B2B Wholesale Site</small></p>
    </div>
    <div class="footer">
      <p>This is an automated notification from B2B Wholesale Site</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}

export function generateInquiryConfirmationEmail(
  inquiry: {
    name: string;
    email: string;
    message: string;
  },
  productName?: string
): { subject: string; text: string; html: string } {
  const subject = `Thank you for your inquiry${productName ? ` - ${productName}` : ''}`;
  
  const text = `
Dear ${inquiry.name},

Thank you for your inquiry. We have received your message and will get back to you shortly.

Your inquiry details:
${inquiry.message}

${productName ? `Product: ${productName}` : ''}

Our team will review your inquiry and respond within 24-48 hours.

Best regards,
B2B Wholesale Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .message { background: white; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Inquiry Received</h1>
    </div>
    <div class="content">
      <p>Dear ${inquiry.name},</p>
      <p>Thank you for your inquiry. We have received your message and will get back to you shortly.</p>
      <div class="message">
        <p>${inquiry.message.replace(/\n/g, '<br>')}</p>
      </div>
      ${productName ? `<p><strong>Product:</strong> ${productName}</p>` : ''}
      <p>Our team will review your inquiry and respond within <strong>24-48 hours</strong>.</p>
      <p>Best regards,<br><strong>B2B Wholesale Team</strong></p>
    </div>
    <div class="footer">
      <p>You received this email because you submitted an inquiry on our website.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}
