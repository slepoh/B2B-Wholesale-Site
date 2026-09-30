import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';
import { authMiddleware } from '../middleware/auth';

const translations = new Hono<{ Bindings: Env }>();

// 静态路由必须注册在动态路由 /:locale 之前，否则会被抢先匹配
translations.get('/config', authMiddleware, async (c) => {
  try {
    const db = new Database(c.env.DB, c.env.CACHE);
    const config = await db.getTranslationConfig();
    
    return c.json({
      success: true,
      data: config,
    });
  } catch (err) {
    console.error('Get translation config error:', err);
    return c.json({ success: false, error: 'Failed to get translation config' }, 500);
  }
});

translations.post('/config', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const db = new Database(c.env.DB, c.env.CACHE);
    
    const result = await db.updateTranslationConfig({
      api_url: body.api_url,
      api_token: body.api_token,
      enabled_languages: JSON.stringify(body.enabled_languages || []),
      is_enabled: body.is_enabled !== undefined ? (body.is_enabled ? 1 : 0) : undefined,
    });
    
    if (result) {
      return c.json({ success: true, message: 'Translation config updated' });
    } else {
      return c.json({ success: false, error: 'Failed to update translation config' }, 500);
    }
  } catch (err) {
    console.error('Update translation config error:', err);
    return c.json({ success: false, error: 'Failed to update translation config' }, 500);
  }
});

translations.post('/translate', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { text, target_locale, source_locale = 'zh' } = body;
    
    if (!text || !target_locale) {
      return c.json({ success: false, error: 'Missing required parameters' }, 400);
    }
    
    const db = new Database(c.env.DB, c.env.CACHE);
    const config = await db.getTranslationConfig();
    
    if (!config || !config.is_enabled || !config.api_url) {
      return c.json({ success: false, error: 'Translation API not configured' }, 400);
    }
    
    // 构建标准的翻译 API 请求（JSON 格式）
    const requestBody: any = {
      q: text,
      source: source_locale,
      target: target_locale,
      format: 'text',
    };
    
    // 移除空值
    if (!requestBody.source) {
      delete requestBody.source;
    }
    
    try {
      const response = await fetch(config.api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.api_token ? { 'Authorization': `Bearer ${config.api_token}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(`API response status: ${response.status} - ${errorData.error || errorData.message || 'Unknown error'}`);
      }
      
      const result = await response.json() as any;
      
      // 支持多种翻译 API 的响应格式
      const translatedText = 
        result.translated_text || 
        result.translation || 
        result.data?.translations?.[0]?.translatedText ||
        result.data?.[0]?.translations?.[0]?.translatedText ||
        result.result ||
        result.text ||
        result;
      
      return c.json({
        success: true,
        data: {
          translated_text: typeof translatedText === 'string' ? translatedText : JSON.stringify(translatedText),
          source_locale,
          target_locale,
        },
      });
    } catch (fetchError) {
      console.error('Translation API call error:', fetchError);
      return c.json({ 
        success: false, 
        error: '翻译 API 接口错误，请联系管理员配置正确的参数',
        detail: fetchError instanceof Error ? fetchError.message : 'Unknown error',
      }, 500);
    }
  } catch (err) {
    console.error('Translate error:', err);
    return c.json({ success: false, error: 'Failed to translate' }, 500);
  }
});

// 公开的翻译文案查询接口（放在最后，避免与 /config 等静态路由冲突）
translations.get('/:locale', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const locale = c.req.param('locale');
  const data = await db.getTranslations(locale);
  return c.json({ success: true, data });
});

export default translations;