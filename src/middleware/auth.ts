import { Context } from 'hono';
import type { Env } from '../types';

/**
 * 常量时间字符串比较，避免通过响应时间泄露密码信息。
 */
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  // 长度不同时依然做一次固定长度比较，避免提前返回泄露长度
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

/**
 * 校验 Basic Auth 凭据，成功返回 true。
 * 凭据来自环境变量 ADMIN_USERNAME / ADMIN_PASSWORD（生产环境请用 wrangler secret 配置）。
 */
export function checkBasicAuth(c: Context<{ Bindings: Env }>): boolean {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  let decoded: string;
  try {
    decoded = atob(authHeader.slice(6));
  } catch {
    return false;
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    return false;
  }

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  const adminUsername = c.env.ADMIN_USERNAME;
  const adminPassword = c.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return false;
  }

  // 两个比较都必须执行，避免短路导致的时间差异
  const userOk = timingSafeEqual(username, adminUsername);
  const passOk = timingSafeEqual(password, adminPassword);
  return userOk && passOk;
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  const adminUsername = c.env.ADMIN_USERNAME;
  const adminPassword = c.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error('Auth middleware: admin credentials are not configured');
    return c.json({ success: false, error: 'Admin not configured' }, 500);
  }

  if (!checkBasicAuth(c)) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  (c as any).set('admin', { id: 1, username: adminUsername, role: 'admin' });
  await next();
}

export async function optionalAuthMiddleware(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  if (checkBasicAuth(c)) {
    (c as any).set('admin', { id: 1, username: c.env.ADMIN_USERNAME, role: 'admin' });
  }
  await next();
}
