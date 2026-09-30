# B2B Wholesale Site

一个基于 Cloudflare Workers 的外贸 B2B 批发网站，支持产品目录、询盘管理、幻灯片管理、SEO 优化和完整的后台管理功能。

## 功能特性

### 前台功能
- **首页幻灯片** - 轮播展示，支持后台管理
- **产品展示** - 首页展示推荐产品，支持分页浏览
- **产品分类** - 多级分类浏览
- **产品详情** - 独立详情页（`/product/:slug`），含图片画廊、规格表、Product JSON-LD
- **解决方案** - 行业解决方案展示与详情页（`/solution/:slug`）
- **客户案例** - 成功案例展示与详情页（`/case/:slug`）
- **新闻博客** - 公司动态、行业资讯与详情页（`/news/:slug`）
- **自定义页面** - About / Contact 等页面（`/page/:slug`）
- **询盘功能** - 客户可以发送询盘，自动发送邮件通知
- **AI 智能客服** - 右下角气泡，基于站点内容回答，自动捕获购买意向为线索
- **悬浮客服** - Email、电话、WhatsApp 快速联系
- **Get a Quote 弹出框** - 快速询价弹窗
- **多语言** - 前台语言切换（需配置翻译 API）
- **SEO 优化** - JSON-LD、Sitemap、Robots.txt、Meta 标签
- **LLMs.txt** - AI 爬虫友好的站点内容文档

### 后台管理
- **幻灯片管理** - 首页轮播图管理
- **产品管理** - 添加、编辑、删除产品，支持图片上传
- **分类管理** - 管理产品分类
- **解决方案管理** - 行业解决方案 CRUD
- **案例管理** - 客户案例 CRUD
- **新闻管理** - 博客文章 CRUD
- **页面管理** - 自定义页面（如 About、Contact）
- **询盘管理** - 查看和回复客户询盘，状态管理
- **Leads 管理** - 收集 Get a Quote 弹窗的潜在客户
- **SEO 配置** - JSON-LD 结构化数据配置
- **Robots 配置** - 可配置的 robots.txt 规则
- **网站设置** - 站点名称、描述、Logo、联系方式等
- **弹窗设置** - Get a Quote 弹窗配置
- **社交媒体** - 社交媒体链接管理
- **图片上传** - 基于 R2 的产品图片存储
- **HTTP Basic 认证** - 安全的后台访问控制

### 技术栈

| 技术 | 用途 |
|------|------|
| **运行时** | Cloudflare Workers (Edge Computing) |
| **框架** | Hono (轻量 Web 框架) |
| **数据库** | Cloudflare D1 (SQLite, 全球分布式) |
| **存储** | Cloudflare R2 (对象存储，无流量费) |
| **邮件** | Mailchannels API (事务邮件) |
| **验证** | HTTP Basic Authentication |
| **类型校验** | Zod |
| **前端** | Tailwind CSS + jQuery + Iconify + Font Awesome |
| **缓存** | Cloudflare KV（跨请求读写缓存，写操作自动失效） |

## 架构说明（D1 + R2 + KV）

本项目采用 Cloudflare 三件套实现完整 CMS：

```
                    ┌──────────────────────────────┐
   前台页面 / API ──▶│  Cloudflare Worker (Hono)    │
                    └───────┬─────────────┬────────┘
                            │             │
             读（命中即返回）│             │ 写（写库后主动失效缓存）
                            ▼             ▼
                    ┌────────────┐  ┌────────────┐
                    │  KV CACHE  │  │  D1 (SQLite)│  ← 内容唯一事实来源
                    │  (读写缓存) │  │  内容/询盘   │
                    └────────────┘  └────────────┘
                                          │
                                          ▼
                                   ┌────────────┐
                                   │  R2 Bucket  │  ← 图片等媒体文件
                                   └────────────┘
```

**数据流**：
1. **读取**：优先 KV 命中 → 未命中回源 D1 → 回填 KV（带 TTL）
2. **写入**：后台任一增删改 → 写 D1 → **主动失效对应 KV key** → 前台立即可见
3. **图片**：上传到 R2 → 返回 `Worker 代理 URL`（`/api/upload/image/:key`）或自定义媒体域名

> **为什么用 KV 而不是内存缓存**：Cloudflare Workers 每个请求可能落在不同 isolate，内存缓存不跨请求。KV 是跨请求共享的边缘缓存，才能真正让「后台改 → 前台生效」并且不必每次穿透 D1。

## 快速开始（Git 自动部署）

### 1. Fork 仓库

将本仓库 Fork 到你的 GitHub 账号下：

```
https://github.com/你的用户名/B2B-Wholesale-Site
```

### 2. 在 Cloudflare 创建资源

#### 创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **D1** > **Create Database**
3. 输入数据库名称：`b2b_wholesale_db`
4. 点击 **Create**

#### 创建 R2 Bucket

1. 进入 **R2** > **Create Bucket**
2. 输入 Bucket 名称：`b2b-wholesale-media`
3. 点击 **Create Bucket**

#### 创建 KV Namespace（缓存层，必需）

KV 是前台性能与「后台改动即时生效」的关键，**强烈建议必配**（未配置时会降级为单请求内存缓存并打印警告）：

Dashboard 方式：
1. 进入 **Workers & Pages** > **KV** > **Create a namespace**
2. 名称填 `CACHE`，创建

命令行方式：
```bash
wrangler kv namespace create CACHE
# 输出中的 id 填入 wrangler.toml 的 [[kv_namespaces]] 段
```

> 未绑定 KV 时，缓存退化为单请求内存缓存：功能可用，但每次请求都会穿透 D1，且后台改动需等前台下次请求才生效。


#### 配置 R2 CORS

1. 进入 **R2** > **b2b-wholesale-media** > **Settings**
2. 找到 **CORS Policy**，点击 **Edit**
3. 添加以下配置：

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

> **注意**：生产环境建议将 `AllowedOrigins` 替换为你的实际域名。

#### 初始化数据库

1. 进入 **D1** > **b2b_wholesale_db** > **Query**
2. 复制 `src/db/schema.sql` 文件内容
3. 粘贴到查询框中执行

### 3. 配置管理员账户

后台采用 **HTTP Basic Auth**，凭据来自环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD`（不需要往数据库写 `admins` 表）。

生产环境请用 Secret 配置：

```bash
wrangler secret put ADMIN_USERNAME
wrangler secret put ADMIN_PASSWORD
```

本地开发时复制 `.dev.vars.example` 为 `.dev.vars` 并填入：

```bash
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars，设置 ADMIN_USERNAME / ADMIN_PASSWORD
```

> `.dev.vars` 已在 `.gitignore` 中，不会被提交。

密码校验使用**常量时间比较**（timing-safe），避免通过响应时间泄露信息。

### 4. 连接 GitHub 仓库

1. 进入 Cloudflare **Workers & Pages**
2. 点击 **Create application** > **Create Worker**
3. 输入 Worker 名称：`b2b-wholesale-site`
4. 点击 **Create**
5. 在 Worker 页面，点击 **Settings** > **Git** > **Connect GitHub**
6. 选择你 Fork 的仓库
7. **无需配置构建命令** - Cloudflare Workers 原生支持 TypeScript，会自动处理

### 5. 配置 Worker 绑定

> **注意**：数据库和存储绑定在 Cloudflare Dashboard 中配置，无需修改 wrangler.toml（本地开发时才需要）。

在 Worker 页面，点击 **Settings** > **Variables** > **Add binding**：

#### 添加 D1 数据库绑定

| 变量名 | 值 |
|--------|-----|
| 名称 | `DB` |
| 类型 | **D1 Database** |
| 数据库 | `b2b_wholesale_db` |

#### 添加 R2 存储绑定

| 变量名 | 值 |
|--------|-----|
| 名称 | `R2_BUCKET` |
| 类型 | **R2 Bucket** |
| Bucket | `b2b-wholesale-media` |

#### 添加 KV 缓存绑定

| 变量名 | 值 |
|--------|-----|
| 名称 | `CACHE` |
| 类型 | **KV Namespace** |
| Namespace | `CACHE` |

#### 添加环境变量

在 Worker 页面，点击 **Settings** > **Variables** > **Add variable**：

| 变量名 | 值 | 必需 |
|--------|-----|------|
| `ADMIN_USERNAME` | 管理员用户名 | ✅（建议设为 Secret） |
| `ADMIN_PASSWORD` | 管理员密码（请用强密码） | ✅（建议设为 Secret） |
| `SITE_URL` | 你的网站域名，如 `https://your-domain.com`（用于 canonical/sitemap） | 推荐 |
| `MEDIA_BASE_URL` | R2 自定义媒体域名（可选，留空则图片走 Worker 代理） | 可选 |
| `EMAIL_API_KEY` | Mailchannels API Key（用于发送邮件通知） | 可选 |
| `ADMIN_EMAIL` | 管理员接收询盘的邮箱 | 可选 |

> **安全提示**：`ADMIN_USERNAME` / `ADMIN_PASSWORD` 请在 Dashboard 中勾选 **Encrypt / Secret**，或使用命令行：
> ```bash
> wrangler secret put ADMIN_USERNAME
> wrangler secret put ADMIN_PASSWORD
> ```
> **不要**把明文密码写进 `wrangler.toml`。

### 6. 后台管理登录

访问 `/admin` 并输入环境变量中配置的 ADMIN_USERNAME 和 ADMIN_PASSWORD 登录。

### 7. 自动部署

1. 在 GitHub 上修改代码并提交推送
2. Cloudflare 会自动触发部署
3. 等待部署完成（约 1-2 分钟）
4. 访问 Worker 提供的默认域名测试

### 8. 绑定自定义域名

1. 在 Worker 页面点击 **Triggers** > **Custom Domains**
2. 添加你的域名（如 `www.yourdomain.com`）

---

## 详细使用指南

### 1. 访问后台管理

1. 打开浏览器访问 `/admin`（如 `https://yourdomain.com/admin`）
2. 使用环境变量中配置的 ADMIN_USERNAME 和 ADMIN_PASSWORD 登录
3. 登录后可管理所有内容

### 2. 基础设置

进入 **Settings** 页面配置：

- **Site Name**：网站名称
- **Site Title**：网站标题（SEO）
- **Site Description**：网站描述（SEO）
- **Site Keywords**：网站关键词（SEO）
- **Logo URL**：网站 Logo 图片地址
- **Popup Settings**：Get a Quote 弹窗设置
  - 是否启用弹窗
  - 延迟显示时间（秒）
  - 弹窗标题和描述

### 3. 社交媒体和联系方式

在 **Settings** 页面底部：

- **Social Links**：添加 Facebook、TikTok、YouTube、Instagram、LinkedIn、X 等社交媒体链接
- **Contact Info**：添加 Email、电话、WhatsApp 等联系方式

### 4. 管理幻灯片

1. 进入 **Slides** 页面
2. 点击 **Add Slide** 添加新幻灯片
3. 填写以下内容：
   - **Title**：幻灯片主标题
   - **Subtitle**：副标题
   - **Description**：描述文字
   - **Image URL**：背景图片地址（建议尺寸 1920x600）
   - **Link URL**：点击跳转链接（可选）
   - **Link Text**：按钮文字
   - **Sort Order**：排序（数字越小越靠前）
   - **Status**：是否启用

### 5. 管理产品

1. 进入 **Products** 页面
2. 点击 **Add Product** 添加产品
3. 填写产品信息：
   - **Name**：产品名称
   - **Slug**：URL 友好的别名（如 `wire-harness-assembly`）
   - **Category**：选择分类
   - **Short Description**：简短描述（列表页显示）
   - **Description**：完整描述（详情页显示，支持 HTML）
   - **Price**：价格
   - **MOQ**：最小起订量
   - **Images**：产品图片（先上传到 R2，获取 URL）
   - **Featured**：是否推荐到首页
   - **Status**：是否发布

### 6. 上传图片

1. 进入任意支持图片的内容管理页面
2. 点击图片上传按钮
3. 选择本地图片文件
4. 图片会自动上传到 R2 并返回 URL
5. 复制 URL 填入对应字段

### 7. 管理分类

1. 进入 **Categories** 页面
2. 添加产品分类：
   - **Name**：分类名称
   - **Slug**：URL 别名
   - **Parent**：父分类（可选，支持多级）
   - **Description**：分类描述
   - **Sort Order**：排序

### 8. 管理解决方案和案例

与产品管理类似：

- **Solutions**：行业解决方案
- **Cases**：客户成功案例
- **News**：博客新闻

### 9. 查看询盘和 Leads

- **Inquiries**：客户通过联系表单发送的询盘
- **Leads**：客户通过 Get a Quote 弹窗提交的潜在客户信息

### 10. SEO 配置

#### JSON-LD 配置

进入 **SEO & JSON-LD** 页面，可以添加结构化数据：

- **Organization**：组织信息
- **Website**：网站信息
- **Product**：产品信息
- **BreadcrumbList**：面包屑导航

#### Robots.txt 配置

进入 **Robots.txt** 页面，可以配置爬虫规则：

- 按用户代理（User-Agent）分组
- 设置 Allow/Disallow 规则
- 支持 Sitemap 声明

### 11. 多语言翻译配置

进入 **Translation Settings** 页面，可以配置多国语言功能：

- **启用多语言**：开启或关闭前台多语言切换功能
- **Translation API URL**：填写翻译 API 接口地址（JSON 格式）
- **API Token**：填写翻译 API 的认证 Token
- **Enabled Languages**：选择启用的语言（English、中文、Español 等）

启用后，前台导航栏会显示语言切换按钮，用户可以切换不同语言。切换时会调用配置的翻译 API 进行翻译。

如果 API 配置无效，切换语言时会显示错误提示："翻译 API 接口错误，请联系管理员配置正确的参数"。

#### 翻译 API 要求

翻译 API 应该接收 JSON POST 请求：

```json
{
  "text": "要翻译的文本",
  "source_lang": "源语言代码",
  "target_lang": "目标语言代码"
}
```

返回 JSON 响应：

```json
{
  "translated_text": "翻译后的文本"
}
```

### 12. AI 智能客服

前台右下角提供 AI 客服气泡，能基于站点真实内容（产品、分类、方案、案例、新闻、联系方式）回答访客问题，并**自动识别购买意向**——当访客留下邮箱或电话时，自动写入 `Leads` 并发送邮件通知。

#### 配置步骤

**1. 配置 LLM 密钥（必需）**

客服需要一个 OpenAI 兼容的 LLM 接口。密钥走 Secret，**不要**写进配置文件或数据库：

```bash
wrangler secret put AI_API_KEY
```

可选：设置默认接口地址（未在后台填写 `API URL` 时使用）

```toml
# wrangler.toml [vars]
AI_API_URL = "https://api.deepseek.com/v1"
```

**2. 在后台配置**

进入后台 **AI Chat** 页面：

| 配置项 | 说明 |
|--------|------|
| **Enable AI Chat** | 开启/关闭前台客服（默认关闭） |
| **Welcome Message** | 打开面板时的欢迎语 |
| **System Prompt** | 系统提示词，定义客服人设与回答风格 |
| **Model** | 模型名，如 `deepseek-chat`、`gpt-4o-mini` |
| **API URL** | OpenAI 兼容端点，如 `https://api.deepseek.com/v1` |
| **Theme Color** | 气泡与面板主色 |
| **Bubble Position** | 气泡位置（左/右） |
| **Collect Contact Info** | 是否在对话中收集联系方式（开启后自动落 Leads） |
| **Answer Technical Questions** | 是否允许回答行业技术问题（默认关闭，只答产品/公司/联系） |
| **Context History Length** | 送入模型的历史消息条数（0-20） |

页面顶部会显示 API Key 状态（已配置 / 未配置）。

**3. 验证**

打开前台任意页面，右下角出现客服气泡。提问产品相关问题，客服会基于站点内容回答。

#### 工作原理

```
访客提问 → POST /api/ai-chat/chat
         → 读取配置 + 组装知识上下文（D1 产品/方案/案例/新闻）
         → 调用 LLM（OpenAI 兼容）
         → 保存会话到 ai_chat_messages
         → 命中邮箱/电话 → 写入 leads（source='ai_chat'）+ 邮件通知
```

- **知识来源**：实时从 D1 读取站点内容拼进 system prompt，后台增删改产品后客服自动使用最新数据（缓存随产品变更失效）
- **多轮对话**：同一会话保留上下文，`session_id` 存于前端 localStorage
- **限流**：每会话每小时最多 30 条，防止公开接口被滥用
- **降级**：未配置 `AI_API_KEY` 或未启用时，前台不渲染客服气泡

> **兼容性**：任何提供 OpenAI 兼容 `/chat/completions` 接口的服务都可使用（DeepSeek / OpenRouter / 通义 / Moonshot / 自建代理等），只需改后台的 `API URL` 与 `Model`。

---

## 项目结构

```
B2B-Wholesale-Site/
├── src/
│   ├── api/                    # API 路由
│   │   ├── products.ts         # 产品 API
│   │   ├── categories.ts       # 分类 API
│   │   ├── inquiries.ts        # 询盘 API
│   │   ├── settings.ts         # 设置 API
│   │   ├── translations.ts     # 翻译 API
│   │   ├── admin.ts            # 后台统计 API
│   │   ├── upload.ts           # 图片上传 API
│   │   ├── pages.ts            # 页面 API
│   │   ├── solutions.ts        # 解决方案 API
│   │   ├── cases.ts            # 案例 API
│   │   ├── news.ts             # 新闻 API
│   │   ├── leads.ts            # Leads API
│   │   ├── slides.ts           # 幻灯片 API
│   │   ├── jsonld.ts           # JSON-LD API
│   │   ├── robots.ts           # Robots API
│   │   └── ai-chat.ts          # AI 客服 API（对话/配置/会话）
│   ├── db/                     # 数据库相关
│   │   ├── index.ts            # 数据库操作类（读写 KV 缓存 + 失效）
│   │   ├── cache.ts            # 缓存后端抽象（KV / Memory 双实现，前缀失效）
│   │   └── schema.sql          # 数据库结构
│   ├── middleware/             # 中间件
│   │   └── auth.ts             # 认证中间件
│   ├── utils/                  # 工具函数
│   │   ├── auth.ts             # 认证工具
│   │   └── email.ts            # 邮件发送工具
│   ├── types.ts                # TypeScript 类型定义
│   └── index.ts                # 主入口（前台+后台 HTML）
├── public/
│   ├── css/                    # 样式文件
│   │   ├── styles.css          # 前台样式（Tailwind 补充）
│   │   └── admin.css           # 后台样式
│   ├── js/                     # JavaScript 文件
│   │   ├── main.js             # 前台逻辑（jQuery）
│   │   ├── admin.js            # 后台逻辑（jQuery）
│   │   └── ai-chat-widget.js   # 前台 AI 客服 widget（原生 JS）
│   └── images/                 # 静态图片（如占位图）
├── scripts/
│   └── generate-admin-hash.js  # 密码哈希生成脚本
├── .dev.vars.example           # 本地开发环境变量模板（复制为 .dev.vars）
├── wrangler.toml               # Cloudflare 配置（D1 / R2 / KV 绑定）
├── package.json                # 项目配置
└── tsconfig.json               # TypeScript 配置
```

### 详情页路由

前台为各内容类型提供独立的详情页路由，均带 SEO 元信息与 JSON-LD：

| 路由 | 内容 |
|------|------|
| `/product/:slug` | 产品详情（图片画廊、规格表、Product JSON-LD、询盘按钮） |
| `/solution/:slug` | 解决方案详情 |
| `/case/:slug` | 客户案例详情 |
| `/news/:slug` | 新闻 / 博客详情 |
| `/page/:slug` | 自定义页面详情 |

---

## 常用命令

### 本地开发

```bash
# 安装依赖
npm install

# 启动本地开发（wrangler dev 会自动读取 .dev.vars）
npm run dev

# TypeScript 类型检查
npm run typecheck

# 部署到 Cloudflare
npm run deploy
```

> **提示**：Workers 原生支持 TypeScript，无需额外的构建步骤。
> 本地首次运行前：`cp .dev.vars.example .dev.vars` 并填入凭据。
> 若 `wrangler dev` 启动后 curl 首页卡住，可显式指定 `--ip 127.0.0.1 --port 8787`。

### 首次部署资源初始化

```bash
# 创建 KV 缓存命名空间（把返回的 id 填入 wrangler.toml）
wrangler kv namespace create CACHE

# 创建 D1 数据库（把返回的 database_id 填入 wrangler.toml）
wrangler d1 create b2b_wholesale_db

# 初始化表结构
wrangler d1 execute b2b_wholesale_db --remote --file=src/db/schema.sql

# 配置密钥
wrangler secret put ADMIN_USERNAME
wrangler secret put ADMIN_PASSWORD
```

### Git 自动部署

```bash
git add .
git commit -m "描述你的修改"
git push origin main      # Cloudflare 会自动触发部署
```

---

## SEO 功能详解

### 自动生成的文件

| 路径 | 说明 |
|------|------|
| `/sitemap.xml` | 站点地图，包含所有产品、分类、页面等 |
| `/robots.txt` | 爬虫规则，可后台配置 |
| `/LLMs.txt` | AI 爬虫友好的站点内容摘要 |

### JSON-LD 结构化数据

系统在首页自动注入以下 JSON-LD：

- **Organization**：组织信息
- **WebSite**：网站信息
- **BreadcrumbList**：面包屑导航

可在后台 **SEO & JSON-LD** 页面自定义配置。

### Meta 标签

- `<title>`：动态生成
- `<meta name="description">`：后台设置
- `<meta name="keywords">`：后台设置
- Open Graph 标签
- Twitter Card 标签

---

## 缓存机制

缓存由 **Cloudflare KV** 提供，跨请求共享（而非进程内内存）。各实体 TTL 配置见 `src/db/cache.ts` 的 `CACHE_CONFIG`：

| 数据类型 | 缓存时间 |
|----------|----------|
| 产品列表 / Featured 产品 | 5 分钟 |
| 产品详情 | 5 分钟 |
| 分类列表 | 10 分钟 |
| 网站设置 | 5 分钟 |
| 翻译数据 | 10 分钟 |
| 解决方案 / 案例 | 10 分钟 |
| 新闻 | 5 分钟 |
| 页面 | 10 分钟 |
| 幻灯片 | 5 分钟 |
| SEO（JSON-LD / robots） | 60 分钟 |

**缓存失效**：后台任一增删改操作完成后，会**主动删除**对应实体的所有缓存 key（含列表、按 slug、按 id 等关联 key），因此**后台改动对前台立即可见**。

> **未绑定 KV 时**会降级为单请求内存缓存：功能可用，但不跨请求，后台改动不即时生效，且每次请求都会穿透 D1。生产环境请务必绑定 `CACHE`。

后台侧边栏提供 **清除缓存** 按钮，可一键 flush 全部缓存前缀。

---

## 性能优化建议

### 1. 启用 Cloudflare 缓存

在 Worker 设置中启用 **Cache API**：

1. **Workers & Pages** > 你的 Worker > **Settings** > **Caching**
2. 配置合适的缓存规则

### 2. 压缩图片

上传前压缩图片，建议：
- 产品图片：不超过 200KB
- 幻灯片背景：不超过 500KB
- 使用 WebP 格式

### 3. 合理使用 CDN

- 静态资源使用 R2 + Cloudflare CDN
- 图片使用 Cloudflare Images（可选）

---

## 故障排除

### 常见问题

#### 1. 部署失败

在 Cloudflare Dashboard 查看部署状态和错误：

1. 进入 **Workers & Pages** > 你的 Worker
2. 点击 **Deployments** 查看部署历史
3. 点击具体部署查看错误日志

#### 2. 数据库连接失败

1. 确认 D1 绑定已正确配置（名称必须为 `DB`）
2. 确认数据库已初始化（执行了 schema.sql）

#### 3. 图片上传失败

1. 检查 R2 CORS 配置
2. 检查 R2 绑定名称是否正确（必须为 `R2_BUCKET`）
3. 检查写接口的认证头是否正确（`POST /api/upload/image` 需要 Basic Auth）
4. 查看 Worker 日志排查问题

#### 4. 图片上传成功但访问返回 401

图片读接口 `GET /api/upload/image/*` 是**公开**的，无需认证。若仍 401：

1. 确认 `src/index.ts` 中**没有**对 `/api/upload/*` 注册全局 `authMiddleware`（鉴权应只在 `POST`/`DELETE` 上）
2. 若不希望走 Worker 代理，可配置 `MEDIA_BASE_URL` 指向 R2 自定义域名

#### 5. 静态文件 404（/js/admin.js 等）

确保 `wrangler.toml` 包含 `[assets]` 配置：

```toml
[assets]
directory = "./public"
```

Worker 会自动从 `public` 目录提供静态资源，无需额外配置。

#### 6. 后台无法登录

1. 确认已配置 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`（环境变量或 Secret）
2. 若未配置，`authMiddleware` 会返回 `500 Admin not configured`
3. 凭据错误返回 `401 Unauthorized`

#### 7. 后台改动前台不生效

1. 确认已绑定 `CACHE`（KV Namespace）；未绑定时会打印降级警告，缓存不跨请求
2. 可在后台点击 **清除缓存** 强制刷新
3. 检查对应实体的写操作是否触发了 `invalidateCache`（关联 key 需一并失效）

#### 8. 邮件发送失败

1. 确认已配置 `EMAIL_API_KEY` 环境变量
2. 检查 `ADMIN_EMAIL` 是否正确
3. 查看 Worker 日志

### 查看日志

在 Cloudflare Dashboard：
1. **Workers & Pages** > 你的 Worker
2. 点击 **Logs** > **Real-time** 查看实时日志

---

## 域名配置

### 1. 添加域名到 Cloudflare

1. 登录 Cloudflare Dashboard
2. 点击 **Add a Site**
3. 按照指引添加域名

### 2. 绑定自定义域名到 Worker

1. 进入 **Workers & Pages** > 你的 Worker
2. 点击 **Triggers** > **Custom Domains**
3. 点击 **Add Custom Domain**
4. 输入你的域名（如 `www.yourdomain.com`）
5. Cloudflare 会自动配置必要的 DNS 记录

---

## 安全建议

1. **限制 R2 CORS**：生产环境将 `AllowedOrigins` 改为实际域名
2. **定期更换密码**：定期更新管理员密码
3. **启用 HTTPS**：Cloudflare 自动提供免费 HTTPS
4. **限制后台访问**：可通过 IP 白名单进一步限制

---

## 技术支持

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Hono 框架文档](https://hono.dev/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)

---

## 更新日志

### v1.4.0
- **新增前台 AI 智能客服**：右下角可折叠气泡，基于 D1 真实站点内容回答访客问题
- **购买意向自动捕获**：对话中出现邮箱/电话时自动写入 `Leads`（`source='ai_chat'`）并邮件通知
- 后台新增 **AI Chat** 配置页：开关、欢迎语、系统提示词、模型、接口地址、主题色、位置、收集线索、技术问答开关、上下文长度
- 新增 `ai_chat_config` / `ai_chat_messages` 表，会话消息留存并可在后台查看
- LLM 采用 **OpenAI 兼容协议**，`api_url` / `model` 后台可配，密钥走 `wrangler secret AI_API_KEY`；兼容 DeepSeek / OpenRouter / 通义 / Moonshot
- 公开接口 `/api/ai-chat/chat` 增加**限流**（每会话每小时 30 条）与输入长度校验
- 修复后台 `/stats` 仅返回 3 项导致仪表盘部分统计为空的问题（改用 `db.getStats()` 返回完整 6 项）

### v1.3.0
- **新增 KV 跨请求缓存层**（`src/db/cache.ts`），写操作主动失效前缀，打通「后台改 → 前台立即生效」的完整 CMS 闭环
- **补齐 5 个详情页路由**（`/product|solution|case|news|page/:slug`），修复列表页 "Read More" 全部 404
- 产品详情页支持图片画廊、规格表、Product JSON-LD 结构化数据
- **修复 R2 图片公开访问 401**：鉴权下沉到写接口，图片读接口公开；上传返回 URL 改走 `MEDIA_BASE_URL` 或 Worker 代理
- **修复缓存关联 key 失效**：删除产品后详情页不再残留（原先只失效 `products:*`）
- 所有写接口与敏感读接口（询盘 / Leads）补齐 `authMiddleware`
- 后台鉴权改用常量时间比较，移除明文密码与调试日志
- 修复 translations 路由顺序（`/config` 被 `/:locale` 吞掉）
- 后台新增 **清除缓存** 按钮 + toast 提示；产品表单新增 `specifications` 字段
- `wrangler.toml` 新增 KV 绑定，移除明文密码，D1 id 改为占位符；敏感项改用 `wrangler secret`
- 新增 `.dev.vars.example` 本地开发模板

### v1.2.0
- 新增多国语言翻译功能
- 新增翻译 API 配置（支持自定义翻译接口）
- 前台多语言切换按钮
- 后台翻译设置管理

### v1.1.0
- 新增首页幻灯片功能
- 新增 Get a Quote 弹出框
- 新增 JSON-LD 结构化数据
- 新增 LLMs.txt
- 新增可配置的 Robots.txt
- 迁移到 Tailwind CSS + jQuery + Iconify
- 新增 Leads 管理

### v1.0.0
- 初始版本
- 产品、分类、询盘管理
- 基础 SEO 功能

---

## License

MIT