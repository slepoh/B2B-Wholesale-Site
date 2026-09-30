#!/usr/bin/env node

/**
 * 管理员密码哈希生成工具
 * 
 * 使用方法:
 *   node scripts/generate-admin-hash.js [password]
 * 
 * 如果不指定密码，默认使用 'admin123'
 */

const crypto = require('crypto');

const SALT_LENGTH = 16;
const HASH_LENGTH = 64;
const ITERATIONS = 100000;

async function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, HASH_LENGTH, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const password = process.argv[2] || 'admin123';
  
  console.log(`Generating hash for password: "${password}"\n`);
  
  const hash = await hashPassword(password);
  
  console.log('Password hash:');
  console.log(hash);
  console.log('\n');
  console.log('Execute this SQL command to create admin user:');
  console.log('─'.repeat(60));
  console.log(`wrangler d1 execute b2b_wholesale_db --command "INSERT INTO admins (username, password_hash) VALUES ('admin', '${hash}');"`);
  console.log('─'.repeat(60));
  console.log('\n');
  console.log('⚠️  重要提示:');
  console.log('  1. 请将此哈希值保存到安全的地方');
  console.log('  2. 建议在生产环境使用更强的密码');
  console.log('  3. 此脚本生成的密码哈希使用 PBKDF2 + SHA256 算法');
  console.log('\n');
}

main().catch(console.error);
