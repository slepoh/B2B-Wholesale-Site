# API 接口文档

## API 概览

所有 API 端点都遵循 RESTful 设计规范，返回统一的 JSON 格式响应。

### 基础 URL
- 开发环境：`http://localhost:8787/api`
- 生产环境：`https://<your-worker-name>.workers.dev/api`

### 响应格式

成功响应：
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

失败响应：
```json
{
  "success": false,
  "error": "错误信息",
  "details": { ... }  // 可选，验证错误详情
}
```

### 认证

后台 API (`/api/admin/*`) 需要 HTTP Basic Authentication：

```
Authorization: Basic BASE64(username:password)
```

---

## 前台 API

### 产品相关 API

#### 获取产品列表
获取产品分页列表，支持按分类筛选。

**请求**
```
GET /api/products?category={categoryId}&page={page}&limit={limit}
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | number | 否 | 分类 ID |
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 12 |

**响应**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "工业机床 A100",
        "slug": "industrial-machine-a100",
        "price": 5000,
        "min_order_qty": 10,
        "images": ["url1", "url2"],
        "is_active": 1,
        "is_featured": 1,
        "view_count": 150
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 12,
    "totalPages": 9
  }
}
```

#### 获取推荐产品
获取首页推荐产品展示。

**请求**
```
GET /api/products/featured?limit={limit}
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | 否 | 数量，默认 6 |

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "工业机床 A100",
      "price": 5000,
      "images": ["url1", "url2"]
    }
  ]
}
```

#### 获取产品详情
根据产品 slug 获取详细信息。

**请求**
```
GET /api/products/:slug
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "工业机床 A100",
    "slug": "industrial-machine-a100",
    "description": "详细说明...",
    "short_description": "简短说明",
    "price": 5000,
    "min_order_qty": 10,
    "images": ["url1", "url2"],
    "specifications": {
      "功率": "500W",
      "尺寸": "100x50x30cm"
    },
    "category": {
      "id": 1,
      "name": "机械设备"
    }
  }
}
```

---

### 分类相关 API

#### 获取分类列表
获取所有产品分类。

**请求**
```
GET /api/categories?parent={parentId}
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| parent | number | 否 | 父分类 ID，用于获取子分类 |

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "机械设备",
      "slug": "machinery",
      "description": "工业机械分类",
      "parent_id": null,
      "sort_order": 1,
      "is_active": 1
    }
  ]
}
```

#### 获取分类详情
根据 slug 获取分类详情。

**请求**
```
GET /api/categories/:slug
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "机械设备",
    "slug": "machinery",
    "description": "工业机械分类"
  }
}
```

---

### 询盘相关 API

#### 提交询盘
客户提交询盘表单。

**请求**
```
POST /api/inquiries
Content-Type: application/json
```

**请求体**
```json
{
  "product_id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Company Name",
  "country": "USA",
  "message": "我对贵公司的产品很感兴趣..."
}
```

**验证规则**
- `name`: 必填，最小长度 1
- `email`: 必填，有效邮箱格式
- `message`: 必填，最小长度 1
- `product_id`: 可选
- `company`: 可选
- `country`: 可选

**响应**
```json
{
  "success": true,
  "data": { "id": 123 },
  "message": "Inquiry submitted successfully"
}
```

---

### 设置相关 API

#### 获取所有设置
获取网站配置信息。

**请求**
```
GET /api/settings
```

**响应**
```json
{
  "success": true,
  "data": {
    "site_name": "B2B Wholesale",
    "site_description": "Your trusted B2B wholesale platform",
    "contact_email": "info@example.com",
    "default_locale": "en",
    "currency": "USD"
  }
}
```

#### 获取单个设置
```
GET /api/settings/:key
```

#### 更新设置
```
PUT /api/settings/:key
Content-Type: application/json

{
  "value": "新值"
}
```

---

### 翻译相关 API

#### 获取翻译
获取指定语言的所有翻译。

**请求**
```
GET /api/translations/:locale
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| locale | string | 是 | 语言代码 (en, zh, es...) |

**响应**
```json
{
  "success": true,
  "data": {
    "home": "首页",
    "products": "产品",
    "categories": "分类",
    "contact": "联系我们"
  }
}
```

---

## 后台管理 API

**需要认证**: 所有 `/api/admin/*` 端点都需要 HTTP Basic Authentication。

### 产品管理

#### 创建产品
```
POST /api/admin/products
Content-Type: application/json
Authorization: Basic BASE64(username:password)
```

**请求体**
```json
{
  "category_id": 1,
  "name": "新产品",
  "slug": "new-product",
  "description": "详细描述",
  "short_description": "简短说明",
  "price": 99.99,
  "min_order_qty": 100,
  "images": ["url1", "url2"],
  "specifications": {
    "key": "value"
  },
  "is_active": true,
  "is_featured": false
}
```

**响应**
```json
{
  "success": true,
  "data": { "id": 123 },
  "message": "Product created"
}
```

#### 更新产品
```
PUT /api/admin/products/:id
Content-Type: application/json
Authorization: Basic BASE64(username:password)
```

#### 删除产品
```
DELETE /api/admin/products/:id
Authorization: Basic BASE64(username:password)
```

---

### 分类管理

#### 创建分类
```
POST /api/admin/categories
Content-Type: application/json
Authorization: Basic BASE64(username:password)
```

**请求体**
```json
{
  "name": "新分类",
  "slug": "new-category",
  "description": "分类描述",
  "parent_id": null,
  "sort_order": 1,
  "is_active": true
}
```

#### 更新分类
```
PUT /api/admin/categories/:id
```

#### 删除分类
```
DELETE /api/admin/categories/:id
```

---

### 询盘管理

#### 获取询盘列表
```
GET /api/admin/inquiries?status={status}&page={page}&limit={limit}
Authorization: Basic BASE64(username:password)
```

**参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | pending/replied/completed/archived |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

#### 获取询盘详情
```
GET /api/admin/inquiries/:id
Authorization: Basic BASE64(username:password)
```

#### 更新询盘状态
```
PATCH /api/admin/inquiries/:id
Content-Type: application/json
Authorization: Basic BASE64(username:password)

{
  "status": "replied",
  "notes": "已回复客户"
}
```

---

### 统计信息

#### 获取统计数据
```
GET /api/admin/stats
Authorization: Basic BASE64(username:password)
```

**响应**
```json
{
  "success": true,
  "data": {
    "totalProducts": 150,
    "totalInquiries": 89,
    "pendingInquiries": 12
  }
}
```

---

## 错误码

| HTTP 状态码 | 说明 |
|------------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（认证失败） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 使用示例

### JavaScript Fetch 示例

```javascript
// 获取产品列表
const res = await fetch('/api/products?limit=10');
const data = await res.json();
console.log(data.data.items);

// 提交询盘
const inquiry = {
  name: 'John',
  email: 'john@example.com',
  message: 'Interested in your products'
};
const res = await fetch('/api/inquiries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(inquiry)
});

// 后台 API（带认证）
const creds = btoa('username:password');
const res = await fetch('/api/admin/stats', {
  headers: { 'Authorization': `Basic ${creds}` }
});
```

### cURL 示例

```bash
# 获取产品
curl https://your-worker.workers.dev/api/products

# 提交询盘
curl -X POST https://your-worker.workers.dev/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","message":"Hello"}'

# 后台 API
curl https://your-worker.workers.dev/api/admin/stats \
  -H "Authorization: Basic $(echo -n 'admin:password' | base64)"
```