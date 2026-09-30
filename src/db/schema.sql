-- B2B Wholesale Site Database Schema

-- 产品分类表
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 产品表
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  price REAL,
  min_order_qty INTEGER DEFAULT 1,
  images TEXT,
  specifications TEXT,
  is_active INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 询盘表
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  country TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 网站询盘线索表（弹窗表单）
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'popup',
  product_id INTEGER,
  status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 多语言翻译表
CREATE TABLE IF NOT EXISTS translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  locale TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(locale, key)
);

-- 网站设置表
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'admin',
  last_login TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 页面管理表（关于我们、联系我们等）
CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 应用方案表
CREATE TABLE IF NOT EXISTS solutions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  content TEXT,
  images TEXT,
  industries TEXT,
  is_featured INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 客户案例表
CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  client_name TEXT,
  industry TEXT,
  challenge TEXT,
  solution TEXT,
  results TEXT,
  images TEXT,
  testimonial TEXT,
  is_featured INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 新闻动态表
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  content TEXT,
  images TEXT,
  author TEXT,
  is_featured INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  view_count INTEGER DEFAULT 0,
  published_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 弹窗设置表
CREATE TABLE IF NOT EXISTS popup_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  is_enabled INTEGER DEFAULT 1,
  delay_seconds INTEGER DEFAULT 15,
  show_on_exit INTEGER DEFAULT 0,
  title TEXT,
  description TEXT,
  form_fields TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 社交媒体链接表
CREATE TABLE IF NOT EXISTS social_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 联系方式表
CREATE TABLE IF NOT EXISTS contact_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  label TEXT,
  value TEXT NOT NULL,
  icon TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 初始化默认数据

-- 默认分类
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Electronics', 'electronics', 'Electronic products and components', 1),
  ('Machinery', 'machinery', 'Industrial machinery and equipment', 2),
  ('Textiles', 'textiles', 'Fabric and textile products', 3),
  ('Tools', 'tools', 'Hand tools and power tools', 4),
  ('Packaging', 'packaging', 'Packaging materials and solutions', 5);

-- 默认设置
INSERT INTO settings (key, value) VALUES
  ('site_name', 'B2B Wholesale'),
  ('site_description', 'Your trusted B2B wholesale platform'),
  ('site_title', 'B2B Wholesale - Quality Products at Wholesale Prices'),
  ('site_keywords', 'B2B, wholesale, bulk order, manufacturer, supplier'),
  ('contact_email', 'info@example.com'),
  ('contact_phone', '+1 234 567 8900'),
  ('whatsapp_number', '+1234567890'),
  ('default_locale', 'en'),
  ('currency', 'USD'),
  ('email_notifications_enabled', 'true'),
  ('admin_email', 'admin@example.com'),
  ('logo_url', ''),
  ('favicon_url', '');

-- 默认页面
INSERT INTO pages (title, slug, content, meta_title, meta_description, meta_keywords) VALUES
  ('About Us', 'about', '<h1>About Us</h1><p>Welcome to our company. We are a leading B2B wholesale provider...</p>', 'About Us - B2B Wholesale', 'Learn more about our company and mission.', 'about, company, B2B'),
  ('Contact Us', 'contact', '<h1>Contact Us</h1><p>Get in touch with us for any inquiries...</p>', 'Contact Us - B2B Wholesale', 'Contact us for business inquiries and support.', 'contact, inquiry, support');

-- 默认弹窗设置
INSERT INTO popup_settings (is_enabled, delay_seconds, show_on_exit, title, description, form_fields) VALUES
  (1, 15, 0, 'Get a Quick Quote', 'Fill out the form below and we will get back to you within 24 hours.', '["name", "phone", "whatsapp", "message"]');

-- 默认社交媒体
INSERT INTO social_links (platform, name, url, icon, sort_order) VALUES
  ('facebook', 'Facebook', 'https://facebook.com', 'facebook', 1),
  ('tiktok', 'TikTok', 'https://tiktok.com', 'tiktok', 2),
  ('x', 'X (Twitter)', 'https://x.com', 'x-twitter', 3),
  ('youtube', 'YouTube', 'https://youtube.com', 'youtube', 4);

-- 默认联系方式
INSERT INTO contact_info (type, label, value, icon, sort_order) VALUES
  ('email', 'Email', 'info@example.com', 'envelope', 1),
  ('phone', 'Phone', '+1 234 567 8900', 'phone', 2),
  ('whatsapp', 'WhatsApp', '+1234567890', 'whatsapp', 3);

-- 默认翻译
INSERT INTO translations (locale, key, value) VALUES
  ('en', 'home', 'Home'),
  ('en', 'products', 'Products Center'),
  ('en', 'solutions', 'Solutions'),
  ('en', 'cases', 'Cases'),
  ('en', 'news', 'News'),
  ('en', 'about', 'About Us'),
  ('en', 'contact', 'Contact Us'),
  ('en', 'get_quote', 'Get a Quote'),
  ('en', 'submit', 'Submit'),
  ('en', 'inquiry', 'Send Inquiry'),
  ('zh', 'home', '首页'),
  ('zh', 'products', '产品中心'),
  ('zh', 'solutions', '应用方案'),
  ('zh', 'cases', '客户案例'),
  ('zh', 'news', '新闻动态'),
  ('zh', 'about', '关于我们'),
  ('zh', 'contact', '联系我们'),
  ('zh', 'get_quote', '获取报价'),
  ('zh', 'submit', '提交'),
  ('zh', 'inquiry', '发送询盘');

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_inquiries_product ON inquiries(product_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_translations_locale ON translations(locale);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_solutions_featured ON solutions(is_featured);
CREATE INDEX IF NOT EXISTS idx_cases_featured ON cases(is_featured);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_contact_info_type ON contact_info(type);

-- 幻灯片表
CREATE TABLE IF NOT EXISTS slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- JSON-LD 结构化数据表
CREATE TABLE IF NOT EXISTS json_ld_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_type TEXT NOT NULL,
  name TEXT,
  description TEXT,
  url TEXT,
  logo TEXT,
  same_as TEXT,
  contact_point TEXT,
  extra_data TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Robots 配置表
CREATE TABLE IF NOT EXISTS robots_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_agent TEXT NOT NULL,
  allow_paths TEXT,
  disallow_paths TEXT,
  sitemap_url TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 默认幻灯片
INSERT INTO slides (title, subtitle, description, image_url, link_url, link_text, sort_order) VALUES
  ('Quality Products', 'Wholesale Prices', 'Find the best products at competitive prices', '/images/slide1.jpg', '/products', 'Browse Products', 1),
  ('Global Shipping', 'Fast & Reliable', 'We ship to over 100 countries worldwide', '/images/slide2.jpg', '/contact', 'Contact Us', 2),
  ('24/7 Support', 'Always Here for You', 'Our team is ready to assist you anytime', '/images/slide3.jpg', '/contact', 'Get Support', 3);

-- 默认 JSON-LD 配置
INSERT INTO json_ld_configs (page_type, name, description, url, extra_data) VALUES
  ('organization', 'B2B Wholesale', 'Your trusted B2B wholesale platform', 'https://b2bwholesale.com', '{"@type": "Organization", "contactPoint": {"@type": "ContactPoint", "telephone": "+1-234-567-8900", "contactType": "customer service"}}'),
  ('web_site', 'B2B Wholesale', 'B2B Wholesale Platform', 'https://b2bwholesale.com', '{"potentialAction": {"@type": "SearchAction", "target": "https://b2bwholesale.com/search?q={search_term_string}", "query-input": "required name=search_term_string"}}');

-- 默认 Robots 配置
INSERT INTO robots_configs (user_agent, disallow_paths, sitemap_url, sort_order) VALUES
  ('*', '/admin/private,/api', 'https://b2bwholesale.com/sitemap.xml', 1);

-- 多语言翻译配置表
CREATE TABLE IF NOT EXISTS translation_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_url TEXT,
  api_token TEXT,
  enabled_languages TEXT,
  is_enabled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 默认翻译配置
INSERT INTO translation_config (api_url, api_token, enabled_languages, is_enabled) VALUES
  ('', '', '["en", "zh"]', 0);
