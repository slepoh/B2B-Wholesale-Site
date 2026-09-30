import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';
import { sendEmail } from '../utils/email';
import { authMiddleware } from '../middleware/auth';

const aiChat = new Hono<{ Bindings: Env }>();

/** 默认 LLM 端点（OpenAI 兼容），可在后台 ai_chat_config.api_url 覆盖 */
const DEFAULT_API_URL = 'https://api.deepseek.com/v1';
/** 单会话每小时的提问上限，防止公开接口被刷爆 API 额度 */
const RATE_LIMIT_PER_HOUR = 30;

/** 从文本中提取邮箱 / 电话 / WhatsApp，用于识别是否包含联系方式 */
function extractContacts(text: string): { email?: string; phone?: string; whatsapp?: string } {
  const result: { email?: string; phone?: string; whatsapp?: string } = {};
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.email = emailMatch[0];
  // 匹配 7 位以上的连续数字（可含 + - 空格括号）
  const phoneMatch = text.match(/(\+?\d[\d\s\-()]{6,}\d)/);
  if (phoneMatch) {
    const digits = phoneMatch[0].replace(/[^\d+]/g, '');
    if (digits.replace(/\D/g, '').length >= 7) {
      result.phone = phoneMatch[0].trim();
      result.whatsapp = result.phone;
    }
  }
  return result;
}

/** 从对话中猜测称呼（简单取用户第一条消息里的 "I'm xxx" / "My name is xxx" 等） */
function guessName(text: string): string | undefined {
  const m = text.match(/(?:i am|i'm|my name is|this is|name[:：]\s*)\s*([A-Za-z][A-Za-z .'-]{1,40})/i);
  return m ? m[1].trim() : undefined;
}

/**
 * 公开接口：前台 widget 拉取配置。
 * 只返回渲染所需字段，绝不返回 system_prompt / api_url / 任何密钥。
 */
aiChat.get('/config', async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const config = await db.getAiChatConfig();

    if (!config) {
      return c.json({
        success: true,
        data: { is_enabled: 0, welcome_message: null, theme_color: '#2563eb', position: 'right' },
      });
    }

    return c.json({
      success: true,
      data: {
        is_enabled: config.is_enabled,
        welcome_message: config.welcome_message,
        theme_color: config.theme_color,
        position: config.position,
      },
    });
  } catch (err) {
    console.error('Get AI chat config error:', err);
    return c.json({ success: false, error: 'Failed to get AI chat config' }, 500);
  }
});

/**
 * 公开接口：多轮对话。
 * 流程：读配置 → 组装 system(提示词+知识) + 历史 → 调 LLM → 存消息 → 命中联系方式则落 leads
 */
aiChat.post('/chat', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const message: string = (body.message || '').toString().trim();
    const sessionId: string = (body.session_id || '').toString().trim();

    if (!message || !sessionId) {
      return c.json({ success: false, error: 'message and session_id are required' }, 400);
    }
    if (message.length > 1000) {
      return c.json({ success: false, error: 'Message too long (max 1000 chars)' }, 400);
    }

    const db = new Database(c.env.DB, c.env.CACHE);

    // 简单限流：KV 计数（未绑定 KV 时跳过，功能可用即可）
    if (c.env.CACHE) {
      const bucketKey = `ai_rl:${sessionId}:${Math.floor(Date.now() / 3600000)}`;
      const used = parseInt((await c.env.CACHE.get(bucketKey)) || '0');
      if (used >= RATE_LIMIT_PER_HOUR) {
        return c.json({ success: false, error: 'Too many messages, please try again later' }, 429);
      }
      await c.env.CACHE.put(bucketKey, String(used + 1), { expirationTtl: 3600 });
    }

    const config = await db.getAiChatConfig();
    if (!config || !config.is_enabled) {
      return c.json({ success: false, error: 'AI chat is not enabled' }, 400);
    }

    const apiKey = c.env.AI_API_KEY;
    if (!apiKey) {
      return c.json({ success: false, error: 'AI service is not configured' }, 500);
    }

    const apiUrl = (config.api_url && config.api_url.trim()) || c.env.AI_API_URL || DEFAULT_API_URL;
    const endpoint = `${apiUrl.replace(/\/$/, '')}/chat/completions`;

    // 组装上下文
    const knowledge = await db.getKnowledgeContext();
    let systemPrompt = config.system_prompt || 'You are a helpful B2B sales assistant.';
    systemPrompt += `\n\n--- Site knowledge (use this as the source of truth) ---\n${knowledge}`;
    if (!config.answer_tech_questions) {
      systemPrompt +=
        '\n\nImportant: Only answer questions about our products, company and contact info. ' +
        'For deep technical / engineering questions outside our product info, politely decline and offer to connect the visitor with our team.';
    }
    if (config.collect_lead) {
      systemPrompt +=
        '\n\nIf the visitor shows buying intent (price, MOQ, shipping, ordering), warmly invite them to leave their email or WhatsApp so our team can follow up.';
    }
    systemPrompt += '\n\nReply in the same language as the visitor. Keep replies concise (under 120 words unless asked for detail).';

    // 历史上下文（不含本次新消息）
    const historyLimit = Math.max(0, Math.min(config.max_history || 10, 20));
    const history = historyLimit > 0 ? await db.getAiChatMessages(sessionId, historyLimit) : [];

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    // 调用 LLM
    let reply = '';
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages,
          temperature: 0.5,
          max_tokens: 600,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        console.error('LLM API error:', resp.status, errText.slice(0, 300));
        return c.json({ success: false, error: 'AI service temporarily unavailable' }, 502);
      }

      const data = (await resp.json()) as any;
      reply = data?.choices?.[0]?.message?.content?.trim() || '';
    } catch (fetchErr) {
      console.error('LLM fetch error:', fetchErr);
      return c.json({ success: false, error: 'AI service temporarily unavailable' }, 502);
    }

    if (!reply) {
      return c.json({ success: false, error: 'Empty response from AI service' }, 502);
    }

    // 留存消息
    await db.saveAiChatMessage(sessionId, 'user', message);
    await db.saveAiChatMessage(sessionId, 'assistant', reply);

    // 识别购买意向 + 联系方式 → 落 leads（复用现有流转与邮件通知）
    let leadCaptured = false;
    if (config.collect_lead) {
      const contacts = extractContacts(message);
      if (contacts.email || contacts.phone) {
        try {
          const leadId = await db.createLead({
            name: guessName(message) || 'AI Chat Visitor',
            email: contacts.email,
            phone: contacts.phone,
            whatsapp: contacts.whatsapp,
            message: `[AI Chat]\nVisitor: ${message}\n\nAssistant: ${reply}`,
            source: 'ai_chat',
            status: 'new',
          });

          if (c.env.EMAIL_API_KEY) {
            const adminEmail = c.env.ADMIN_EMAIL || 'admin@b2bwholesale.com';
            await sendEmail(
              {
                DB: c.env.DB,
                R2_BUCKET: c.env.R2_BUCKET,
                EMAIL_API_KEY: c.env.EMAIL_API_KEY,
                ADMIN_EMAIL: c.env.ADMIN_EMAIL,
              },
              {
                to: adminEmail,
                subject: 'New Lead from AI Chat',
                text: `
New Lead from AI Chat

Name: ${guessName(message) || 'AI Chat Visitor'}
Email: ${contacts.email || 'Not provided'}
Phone: ${contacts.phone || 'Not provided'}
WhatsApp: ${contacts.whatsapp || 'Not provided'}

Visitor message:
${message}

Assistant reply:
${reply}
                `.trim(),
              }
            );
          }
          leadCaptured = true;
          console.log('AI chat captured lead:', leadId);
        } catch (leadErr) {
          // 线索落库失败不应影响对话返回
          console.error('Failed to capture lead from AI chat:', leadErr);
        }
      }
    }

    return c.json({
      success: true,
      data: { reply, lead_captured: leadCaptured },
    });
  } catch (err) {
    console.error('AI chat error:', err);
    return c.json({ success: false, error: 'Failed to process chat message' }, 500);
  }
});

// ============================================================
// 管理端（显式鉴权：/api/admin/* 的通配中间件不会覆盖本路径）
// ============================================================

aiChat.get('/admin/config', authMiddleware, async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const config = await db.getAiChatConfig();
    return c.json({
      success: true,
      data: {
        ...(config || {}),
        // 仅告知前端密钥是否已配置，绝不回传密钥本身
        api_key_configured: Boolean(c.env.AI_API_KEY),
      },
    });
  } catch (err) {
    console.error('Get AI chat admin config error:', err);
    return c.json({ success: false, error: 'Failed to get AI chat config' }, 500);
  }
});

aiChat.post('/admin/config', authMiddleware, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const db = new Database(c.env.DB, c.env.CACHE);

    const clampInt = (v: any, min: number, max: number, fallback: number) => {
      const n = parseInt(v, 10);
      if (Number.isNaN(n)) return fallback;
      return Math.max(min, Math.min(max, n));
    };

    const result = await db.updateAiChatConfig({
      is_enabled: body.is_enabled !== undefined ? (body.is_enabled ? 1 : 0) : undefined,
      welcome_message: body.welcome_message,
      system_prompt: body.system_prompt,
      model: body.model,
      api_url: body.api_url,
      theme_color: body.theme_color,
      position: body.position === 'left' ? 'left' : 'right',
      collect_lead: body.collect_lead !== undefined ? (body.collect_lead ? 1 : 0) : undefined,
      answer_tech_questions:
        body.answer_tech_questions !== undefined ? (body.answer_tech_questions ? 1 : 0) : undefined,
      max_history: body.max_history !== undefined ? clampInt(body.max_history, 0, 20, 10) : undefined,
    });

    if (!result) {
      return c.json({ success: false, error: 'No changes applied' }, 400);
    }
    return c.json({ success: true, message: 'AI chat config updated' });
  } catch (err) {
    console.error('Update AI chat config error:', err);
    return c.json({ success: false, error: 'Failed to update AI chat config' }, 500);
  }
});

aiChat.get('/admin/sessions', authMiddleware, async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const limit = parseInt(c.req.query('limit') || '50');
    const sessions = await db.getRecentAiChatSessions(Math.max(1, Math.min(limit, 200)));
    return c.json({ success: true, data: sessions });
  } catch (err) {
    console.error('Get AI chat sessions error:', err);
    return c.json({ success: false, error: 'Failed to get sessions' }, 500);
  }
});

aiChat.get('/admin/messages/:sessionId', authMiddleware, async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const sessionId = c.req.param('sessionId') || '';
    const messages = await db.getAiChatMessages(sessionId, 200);
    return c.json({ success: true, data: messages });
  } catch (err) {
    console.error('Get AI chat messages error:', err);
    return c.json({ success: false, error: 'Failed to get messages' }, 500);
  }
});

export default aiChat;
