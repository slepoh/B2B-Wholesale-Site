# 开发者指南

## 开发环境搭建

### 前置要求

1. **Node.js** >= 18.0.0
2. **npm** >= 9.0.0
3. **Cloudflare 账号**（已注册）
4. **Wrangler CLI** 已安装并登录

### 安装步骤

#### 1. 克隆项目

```bash
git clone <repository-url>
cd b2b-wholesale-site
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 安装 Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

#### 4. 创建 D1 数据库

```bash
wrangler d1 create b2b_wholesale_db
```

输出示例：
```
✅ Successfully created database 'b2b_wholesale_db' in region US
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**复制 `database_id`，更新 `wrangler.toml` 中的 `database_id` 字段。**

#### 5. 创建 R2 Bucket

```bash
wrangler r2 bucket create b2b-wholesale-media
```

#### 6. 初始化数据库

```bash
# 本地开发
npm run db:create

# 生产环境
npm run db:push
```

#### 7. 创建管理员账户

首先生成密码哈希，使用以下 Node.js 脚本：

```javascript
// generate-hash.js
const crypto = require('crypto');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

const password = process.argv[2] || 'admin123';
hashPassword(password).then(hash => {
  console.log('Password hash:', hash);
  console.log('\nRun this SQL:');
  console.log(`INSERT INTO admins (username, password_hash) VALUES ('admin', '${hash}');`);
});
```

执行：
```bash
node generate-hash.js your_password
```

然后执行 SQL：
```bash
wrangler d1 execute b2b_wholesale_db --command "INSERT INTO admins (username, password_hash) VALUES ('admin', '<YOUR_HASH>');"
```

---

## 开发工作流

### 启动开发服务器

```bash
npm run dev
```

访问：
- 前台：http://localhost:8787
- 后台：http://localhost:8787/admin（使用 admin/your_password 登录）

### 代码结构

```
src/
├── api/              # API 路由
│   ├── products.ts   # 产品 API（增删改查）
│   ├── categories.ts # 分类 API
│   ├── inquiries.ts  # 询盘 API
│   ├── settings.ts   # 设置 API
│   ├── translations.ts # 翻译 API
│   └── admin.ts      # 后台管理 API
├── db/
│   ├── index.ts      # 数据库操作类（Database 类）
│   └── schema.sql    # 数据库表结构
├── middleware/
│   └── auth.ts       # HTTP Basic Auth 中间件
├── utils/
│   └── auth.ts       # 密码哈希/验证工具
├── types.ts          # TypeScript 类型定义
└── index.ts          # 主入口（Hono 应用）

public/
├── css/
│   ├── styles.css    # 前台样式
│   └── admin.css     # 后台样式
├── js/
│   ├── main.js       # 前台 JavaScript
│   └── admin.js      # 后台 JavaScript
└── images/           # 静态图片
```

### 添加新 API 端点

#### 1. 创建 API 文件

在 `src/api/` 目录下创建新的 API 文件，例如 `src/api/reviews.ts`：

```typescript
import { Hono } from 'hono';
import type { Env } from '../types';
import { createDatabase } from '../db';

const reviews = new Hono<{ Bindings: Env }>();

reviews.get('/', async (c) => {
  const db = createDatabase(c.get('DB'));
  // 实现逻辑
  return c.json({ success: true, data: [] });
});

export default reviews;
```

#### 2. 注册路由

在 `src/index.ts` 中导入并注册新路由：

```typescript
import reviews from './api/reviews';

// ...
app.route('/api/reviews', reviews);
```

#### 3. 添加数据库操作

在 `src/db/index.ts` 中添加数据库方法：

```typescript
async function getReviews(productId: number): Promise<Review[]> {
  const result = await db.prepare('SELECT * FROM reviews WHERE product_id = ?')
    .bind(productId)
    .all();
  return result.results as Review[];
}
```

---

## 数据库操作

### 使用 D1

D1 是 Cloudflare 的 SQLite 数据库，支持标准 SQL 语法。

#### 查询示例

```typescript
// 在 API 中使用
const db = createDatabase(c.get('DB'));

// 查询单个记录
const product = await db.getProductBySlug('my-product');

// 查询列表（分页）
const { items, total } = await db.getProducts(undefined, 1, 20);

// 创建记录
const id = await db.createProduct({
  name: 'New Product',
  slug: 'new-product',
  price: 99.99
});

// 更新记录
await db.updateProduct(id, { price: 89.99 });

// 删除记录
await db.deleteProduct(id);
```

#### 直接执行 SQL

```typescript
// 在 src/db/index.ts 中
const result = await c.get('DB')
  .prepare('SELECT * FROM products WHERE id = ?')
  .bind(productId)
  .first();
```

### 数据库迁移

#### 添加新表

1. 编辑 `src/db/schema.sql`，添加新表定义
2. 执行迁移：

```bash
# 本地
wrangler d1 execute b2b_wholesale_db --local --file=./src/db/schema.sql

# 远程
wrangler d1 execute b2b_wholesale_db --remote --file=./src/db/schema.sql
```

#### 添加字段

```sql
ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
```

---

## 前端开发

### 自定义前台页面

编辑 `src/index.ts` 中的 HTML 模板，或创建独立的路由：

```typescript
app.get('/about', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>About Us</title>
      <link rel="stylesheet" href="/css/styles.css">
    </head>
    <body>
      <h1>About Our Company</h1>
      <!-- 内容 -->
    </body>
    </html>
  `);
});
```

### 自定义后台页面

编辑 `public/js/admin.js` 添加新功能：

```javascript
// 添加新的页面加载函数
async function loadReviews() {
  const res = await fetch('/api/admin/reviews', {
    headers: { 'Authorization': `Basic ${credentials}` }
  });
  const data = await res.json();
  // 渲染数据
}

// 在 switchPage 中添加 case
else if (page === 'reviews') loadReviews();
```

---

## 部署

### 部署到生产环境

```bash
npm run deploy
```

### 配置生产数据库

1. 更新 `wrangler.toml` 中 `[env.production]` 的 `database_id`
2. 在生产数据库执行迁移：

```bash
wrangler d1 execute b2b_wholesale_db --remote
```

### 配置域名

在 Cloudflare Dashboard 中：
1. 进入 Workers & Pages
2. 选择你的 Worker
3. 点击 "Add Custom Domain"
4. 按照提示配置域名

---

## 测试

### API 测试

使用 Postman 或 curl 测试 API：

```bash
# 测试产品列表
curl http://localhost:8787/api/products

# 测试询盘提交
curl -X POST http://localhost:8787/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Hello"}'

# 测试后台 API
curl http://localhost:8787/api/admin/stats \
  -H "Authorization: Basic $(echo -n 'admin:password' | base64)"
```

### 类型检查

```bash
npm run typecheck
```

---

## 常见问题

### 1. D1 数据库连接失败

确保 `wrangler.toml` 中的 `database_id` 正确，并且已执行：

```bash
wrangler d1 execute b2b_wholesale_db --local --file=./src/db/schema.sql
```

### 2. R2 上传失败

确保已创建 bucket 并在 `wrangler.toml` 中正确配置：

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "b2b-wholesale-media"
```

### 3. 认证失败

检查密码哈希是否正确生成并插入数据库：

```sql
SELECT * FROM admins WHERE username = 'admin';
```

### 4. 本地开发正常但部署后失败

- 检查 `wrangler.toml` 的生产环境配置
- 确认远程数据库已执行迁移
- 查看 Workers 日志：

```bash
wrangler tail
```

---

## 性能优化

### 缓存产品列表

在 `src/api/products.ts` 中添加缓存：

```typescript
import { Cache } from '@cloudflare/cache';

products.get('/', async (c) => {
  const cache = caches.default;
  const cacheKey = new Request(c.req.url);
  
  let response = await cache.match(cacheKey);
  if (response) return response;
  
  // 查询数据库
  const db = createDatabase(c.get('DB'));
  const result = await db.getProducts();
  
  response = c.json({ success: true, data: result });
  
  // 缓存 5 分钟
  const cachedResponse = new Response(response.body, response);
  cachedResponse.headers.set('Cache-Control', 'max-age=300');
  c.executionCtx.waitUntil(cache.put(cacheKey, cachedResponse.clone()));
  
  return response;
});
```

### 数据库索引优化

常用查询字段添加索引：

```sql
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
```

---

## 安全建议

### 1. 启用 HTTPS

Cloudflare Workers 默认使用 HTTPS，自定义域名需配置 SSL。

### 2. 强化认证

- 定期更换管理员密码
- 使用强密码（长度 >= 12，包含大小写字母、数字、特殊字符）
- 考虑添加 IP 白名单

### 3. 输入验证

所有 API 请求都应验证输入：

```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

const body = await c.req.json();
const parsed = schema.safeParse(body);
if (!parsed.success) {
  return c.json({ success: false, error: 'Invalid input' }, 400);
}
```

### 4. 防止 SQL 注入

使用参数化查询：

```typescript
// ✅ 正确
await db.prepare('SELECT * FROM products WHERE slug = ?').bind(slug).first();

// ❌ 错误
await db.prepare(`SELECT * FROM products WHERE slug = '${slug}'`).first();
```

### 5. 定期备份

使用 Wrangler 备份 D1 数据：

```bash
wrangler d1 export b2b_wholesale_db --output=backup.sql
```

---

## 后续开发建议

### 待实现功能

1. **图片上传**: 使用 R2 存储产品图片
2. **邮件通知**: 新询盘邮件通知
3. **多语言前台**: 根据用户语言切换界面
4. **搜索功能**: 产品全文搜索
5. **用户系统**: 客户注册登录
6. **订单管理**: 在线下单和支付
7. **数据分析**: 访问统计和询盘分析

### 技术升级

1. **前端框架**: 使用 React/Vue 重构前台
2. **UI 库**: 使用 Tailwind CSS 或 Ant Design
3. **状态管理**: 后台引入 Redux/Zustand
4. **构建工具**: 使用 Vite 构建前端
5. **测试框架**: 添加 Vitest 单元测试

---

## 资源链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Hono 文档](https://hono.dev/)
- [D1 文档](https://developers.cloudflare.com/d1/)
- [R2 文档](https://developers.cloudflare.com/r2/)
- [Zod 文档](https://zod.dev/)