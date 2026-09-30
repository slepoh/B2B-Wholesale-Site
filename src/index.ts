import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import type { Env } from './types';
import products from './api/products';
import categories from './api/categories';
import inquiries from './api/inquiries';
import settings from './api/settings';
import translations from './api/translations';
import admin from './api/admin';
import upload from './api/upload';
import pages from './api/pages';
import solutions from './api/solutions';
import cases from './api/cases';
import news from './api/news';
import leads from './api/leads';
import slides from './api/slides';
import jsonLd from './api/jsonld';
import robots from './api/robots';
import { authMiddleware } from './middleware/auth';
import { Database, generateRobotsTxt, generateLLMsTxt } from './db';

const app = new Hono<{ Bindings: Env }>();

// Static files handler - must be registered before other routes
app.get('/js/*', async (c) => {
  if (c.env.ASSETS) {
    const assetPath = c.req.path;
    const asset = await c.env.ASSETS.fetch(new Request(`https://example.com${assetPath}`));
    if (asset.status === 200) {
      return asset;
    }
  }
  return c.notFound();
});

app.get('/css/*', async (c) => {
  if (c.env.ASSETS) {
    const assetPath = c.req.path;
    const asset = await c.env.ASSETS.fetch(new Request(`https://example.com${assetPath}`));
    if (asset.status === 200) {
      return asset;
    }
  }
  return c.notFound();
});

app.get('/images/*', async (c) => {
  if (c.env.ASSETS) {
    const assetPath = c.req.path;
    const asset = await c.env.ASSETS.fetch(new Request(`https://example.com${assetPath}`));
    if (asset.status === 200) {
      return asset;
    }
  }
  return c.notFound();
});

app.use('*', logger());
app.use('*', prettyJSON());
app.use('/api/*', cors());

// 后台 API 需要鉴权；上传接口的鉴权在 upload 路由内部单独处理
// （图片读取 /api/upload/image/* 必须公开，否则前台无法展示图片）
app.use('/api/admin/*', authMiddleware);

function getIconifyIcon(platform: string): string {
  const icons: { [key: string]: string } = {
    'facebook': 'fa6-brands:facebook',
    'tiktok': 'fa6-brands:tiktok',
    'x': 'fa6-brands:x-twitter',
    'youtube': 'fa6-brands:youtube',
    'instagram': 'fa6-brands:instagram',
    'linkedin': 'fa6-brands:linkedin',
  };
  return icons[platform] || 'mdi:link';
}

function getContactIcon(type: string): string {
  const icons: { [key: string]: string } = {
    'email': 'mdi:email',
    'phone': 'mdi:phone',
    'whatsapp': 'fa6-brands:whatsapp',
  };
  return icons[type] || 'mdi:circle';
}

function getPageLayout(
  pageTitle: string,
  content: string,
  settingsData: Record<string, string>,
  socialLinks: any[],
  contactInfo: any[],
  jsonLdScript: string = ''
): string {
  const siteName = settingsData.site_name || 'B2B Wholesale';
  const siteDescription = settingsData.site_description || 'Your trusted B2B wholesale platform';
  const siteTitle = settingsData.site_title || `${siteName} - Quality Products at Wholesale Prices`;
  const siteKeywords = settingsData.site_keywords || 'B2B, wholesale, bulk order, manufacturer, supplier';
  const logoUrl = settingsData.logo_url || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${siteDescription}">
  <meta name="keywords" content="${siteKeywords}">
  <meta name="author" content="${siteName}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${siteTitle}">
  <meta property="og:description" content="${siteDescription}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${siteTitle}">
  <meta name="twitter:description" content="${siteDescription}">
  <link rel="canonical" href="https://b2bwholesale.com/${pageTitle.toLowerCase().replace(/\s+/g, '-')}">
  ${logoUrl ? `<link rel="icon" href="${logoUrl}">` : ''}
  <title>${pageTitle} - ${siteName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script src="https://code.iconify.design/iconify-icon/1.0.8/iconify-icon.min.js"></script>
  <link rel="stylesheet" href="/css/styles.css">
  ${jsonLdScript}
  <style>
    .nav-link:hover { color: #3b82f6; }
    @media (max-width: 768px) {
      .nav-menu { display: none; }
      .nav-menu.active { display: flex; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0; background: white; padding: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    }
  </style>
</head>
<body class="font-sans text-gray-800">
  <div class="hidden md:flex bg-gray-100 border-b border-gray-200 text-sm py-2">
    <div class="container mx-auto px-4 flex justify-between items-center">
      <div class="flex gap-6">
        ${contactInfo.filter(i => i.type === 'email').map((i: any) => `<a href="mailto:${i.value}" class="text-gray-600 hover:text-blue-600 flex items-center gap-2"><iconify-icon icon="mdi:email"></iconify-icon> ${i.value}</a>`).join('')}
        ${contactInfo.filter(i => i.type === 'phone').map((i: any) => `<a href="tel:${i.value}" class="text-gray-600 hover:text-blue-600 flex items-center gap-2"><iconify-icon icon="mdi:phone"></iconify-icon> ${i.value}</a>`).join('')}
      </div>
      <div class="flex gap-4">
        ${socialLinks.map((s: any) => `<a href="${s.url}" target="_blank" rel="noopener" class="text-gray-600 hover:text-blue-600"><iconify-icon icon="${getIconifyIcon(s.platform)}" width="18"></iconify-icon></a>`).join('')}
      </div>
    </div>
  </div>

  <header class="sticky top-0 z-50 bg-white shadow-md">
    <nav class="container mx-auto px-4 py-4 flex justify-between items-center relative">
      ${logoUrl ? `<a href="/" class="flex items-center gap-2"><img src="${logoUrl}" alt="${siteName}" class="h-10 w-auto"></a>` : `<a href="/" class="text-2xl font-bold text-blue-600">${siteName}</a>`}
      <button class="md:hidden" id="mobile-menu-btn">
        <iconify-icon icon="mdi:menu" width="28"></iconify-icon>
      </button>
      <ul class="hidden md:flex items-center gap-8 nav-menu" id="nav-menu">
        <li><a href="/" class="nav-link font-medium">Home</a></li>
        <li><a href="/about" class="nav-link font-medium">About Us</a></li>
        <li><a href="/products" class="nav-link font-medium">Products</a></li>
        <li><a href="/solutions" class="nav-link font-medium">Solutions</a></li>
        <li><a href="/cases" class="nav-link font-medium">Cases</a></li>
        <li><a href="/news" class="nav-link font-medium">Blogs</a></li>
        <li><a href="/contact" class="nav-link font-medium">Contact Us</a></li>
        <li class="relative" id="language-switcher-container" style="display: none;">
          <button id="language-switcher-btn" class="nav-link font-medium flex items-center gap-1">
            <iconify-icon icon="mdi:web"></iconify-icon> <span id="current-language">EN</span>
            <iconify-icon icon="mdi:chevron-down"></iconify-icon>
          </button>
          <div id="language-dropdown" class="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 hidden">
            <ul id="language-list" class="py-2"></ul>
          </div>
        </li>
        <li><a href="#" onclick="showPopup(); return false;" class="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-semibold transition">Get a Quote</a></li>
      </ul>
    </nav>
  </header>

  <main>
    ${content}
  </main>

  <footer class="bg-gray-900 text-white py-12">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 class="text-xl font-bold mb-4">${siteName}</h3>
          <p class="text-gray-400">${siteDescription}</p>
        </div>
        <div>
          <h4 class="text-lg font-semibold mb-4">Quick Links</h4>
          <ul class="space-y-2">
            <li><a href="/products" class="text-gray-400 hover:text-white">Products</a></li>
            <li><a href="/solutions" class="text-gray-400 hover:text-white">Solutions</a></li>
            <li><a href="/cases" class="text-gray-400 hover:text-white">Cases</a></li>
            <li><a href="/news" class="text-gray-400 hover:text-white">Blogs</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-lg font-semibold mb-4">Contact</h4>
          ${contactInfo.map((i: any) => `<p class="text-gray-400 flex items-center gap-2 mb-2"><iconify-icon icon="${getContactIcon(i.type)}"></iconify-icon> ${i.value}</p>`).join('')}
        </div>
        <div>
          <h4 class="text-lg font-semibold mb-4">Follow Us</h4>
          <div class="flex gap-4">
            ${socialLinks.map((s: any) => `<a href="${s.url}" target="_blank" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition"><iconify-icon icon="${getIconifyIcon(s.platform)}" width="20"></iconify-icon></a>`).join('')}
          </div>
        </div>
        <div>
          <h4 class="text-lg font-semibold mb-4">Newsletter</h4>
          <p class="text-gray-400 text-sm mb-4">Subscribe to get updates and offers</p>
          <form id="newsletter-form" class="flex flex-col gap-3">
            <input type="email" id="newsletter-email" placeholder="Your email" required class="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500">
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">Subscribe</button>
          </form>
          <div id="newsletter-message" class="mt-2 text-sm hidden"></div>
        </div>
      </div>
      <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
        <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <div class="fixed right-5 bottom-28 flex flex-col gap-3 z-40">
    ${contactInfo.filter((i: any) => i.type === 'email').map((i: any) => `<a href="mailto:${i.value}" class="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:scale-110 transition" title="Email"><iconify-icon icon="mdi:email" width="24"></iconify-icon></a>`).join('')}
    ${contactInfo.filter((i: any) => i.type === 'whatsapp').map((i: any) => `<a href="https://wa.me/${i.value.replace(/[^0-9]/g, '')}" class="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-green-500 hover:bg-green-50 hover:scale-110 transition" title="WhatsApp"><iconify-icon icon="fa6-brands:whatsapp" width="24"></iconify-icon></a>`).join('')}
    ${contactInfo.filter((i: any) => i.type === 'phone').map((i: any) => `<a href="tel:${i.value}" class="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:scale-110 transition" title="Phone"><iconify-icon icon="mdi:phone" width="24"></iconify-icon></a>`).join('')}
    <a href="#" id="back-to-top" class="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:scale-110 transition" title="Back to Top">
      <iconify-icon icon="mdi:arrow-up" width="24"></iconify-icon>
    </a>
  </div>

  <div id="inquiry-popup" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden">
    <div class="bg-white rounded-xl max-w-lg w-full mx-4 p-8 relative max-h-[90vh] overflow-y-auto">
      <button class="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-3xl leading-none" onclick="closePopup()">×</button>
      <h2 class="text-2xl font-bold mb-2">Get a Quick Quote</h2>
      <p class="text-gray-600 mb-6">Fill out the form below and we will get back to you within 24 hours.</p>
      <form id="popup-form">
        <input type="hidden" name="product_id" id="inquiry-product-id" value="">
        <div class="mb-4">
          <label class="block font-medium mb-2">Name *</label>
          <input type="text" name="name" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
        </div>
        <div class="mb-4">
          <label class="block font-medium mb-2">Phone</label>
          <input type="tel" name="phone" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
        </div>
        <div class="mb-4">
          <label class="block font-medium mb-2">WhatsApp</label>
          <input type="tel" name="whatsapp" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
        </div>
        <div class="mb-4">
          <label class="block font-medium mb-2">Message *</label>
          <textarea name="message" required rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>
        </div>
        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">Submit Inquiry</button>
      </form>
    </div>
  </div>

  <script>
    document.getElementById('mobile-menu-btn')?.addEventListener('click', function() {
      document.getElementById('nav-menu')?.classList.toggle('active');
    });
    document.getElementById('back-to-top')?.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    function showPopup() { document.getElementById('inquiry-popup')?.classList.remove('hidden'); }
    function closePopup() { document.getElementById('inquiry-popup')?.classList.add('hidden'); }
    document.getElementById('popup-form')?.addEventListener('submit', async function(e) {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);
      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(formData))
        });
        const data = await res.json();
        if (data.success) {
          alert('Thank you! We will contact you soon.');
          closePopup();
          form.reset();
        } else {
          alert(data.error || 'Failed to submit');
        }
      } catch (err) { alert('Error submitting form'); }
    });
    document.getElementById('newsletter-form')?.addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('newsletter-email')?.value;
      if (!email) return;
      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, message: 'Newsletter subscription', source: 'newsletter' })
        });
        const data = await res.json();
        const msgEl = document.getElementById('newsletter-message');
        if (data.success) {
          if (msgEl) { msgEl.textContent = 'Thank you for subscribing!'; msgEl.className = 'mt-2 text-sm text-green-500'; msgEl.classList.remove('hidden'); }
          document.getElementById('newsletter-email').value = '';
        } else {
          if (msgEl) { msgEl.textContent = data.error || 'Failed to subscribe'; msgEl.className = 'mt-2 text-sm text-red-500'; msgEl.classList.remove('hidden'); }
        }
      } catch (err) {
        const msgEl = document.getElementById('newsletter-message');
        if (msgEl) { msgEl.textContent = 'Error subscribing'; msgEl.className = 'mt-2 text-sm text-red-500'; msgEl.classList.remove('hidden'); }
      }
    });
  </script>
</body>
</html>`;
}

app.get('/', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const settingsData = await db.getSettings();
  const siteName = settingsData.site_name || 'B2B Wholesale';
  const siteDescription = settingsData.site_description || 'Your trusted B2B wholesale platform';
  const siteTitle = settingsData.site_title || `${siteName} - Quality Products at Wholesale Prices`;
  const siteKeywords = settingsData.site_keywords || 'B2B, wholesale, bulk order, manufacturer, supplier';
  const logoUrl = settingsData.logo_url || '';

  const socialLinks = await db.getSocialLinks();
  const contactInfo = await db.getContactInfo();
  const slidesData = await db.getSlides();
  const newsData = await db.getNews(false, 1, 6);

  const jsonLdConfigs = await db.getJsonLdConfigs();
  const jsonLdScript = jsonLdConfigs.map(config => {
    try {
      let ldData: any = { "@context": "https://schema.org" };
      if (config.extra_data) {
        const extra = JSON.parse(config.extra_data);
        ldData = { ...ldData, ...extra };
      }
      if (config.name) ldData.name = config.name;
      if (config.description) ldData.description = config.description;
      if (config.url) ldData.url = config.url;
      if (config.logo) ldData.logo = { url: config.logo };
      return `<script type="application/ld+json">${JSON.stringify(ldData)}</script>`;
    } catch (e) {
      return '';
    }
  }).join('\n');
  
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${siteDescription}">
  <meta name="keywords" content="${siteKeywords}">
  <meta name="author" content="${siteName}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${siteTitle}">
  <meta property="og:description" content="${siteDescription}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${siteTitle}">
  <meta name="twitter:description" content="${siteDescription}">
  <link rel="canonical" href="https://b2bwholesale.com/">
  ${logoUrl ? `<link rel="icon" href="${logoUrl}">` : ''}
  <title>${siteTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script src="https://code.iconify.design/iconify-icon/1.0.8/iconify-icon.min.js"></script>
  <link rel="stylesheet" href="/css/styles.css">
  ${jsonLdScript}
  <style>
    .slider-bg { background-size: cover; background-position: center; }
    .slider-dot.active { background-color: #3b82f6; }
    .slide { opacity: 0; transition: opacity 0.5s ease-in-out; }
    .slide.active { opacity: 1; }
    .nav-link:hover { color: #3b82f6; }
    @media (max-width: 768px) {
      .nav-menu { display: none; }
      .nav-menu.active { display: flex; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0; background: white; padding: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    }
  </style>
</head>
<body class="font-sans text-gray-800">
  <div class="hidden md:flex bg-gray-100 border-b border-gray-200 text-sm py-2">
    <div class="container mx-auto px-4 flex justify-between items-center">
      <div class="flex gap-6">
        ${contactInfo.filter(i => i.type === 'email').map(i => `<a href="mailto:${i.value}" class="text-gray-600 hover:text-blue-600 flex items-center gap-2"><iconify-icon icon="mdi:email"></iconify-icon> ${i.value}</a>`).join('')}
        ${contactInfo.filter(i => i.type === 'phone').map(i => `<a href="tel:${i.value}" class="text-gray-600 hover:text-blue-600 flex items-center gap-2"><iconify-icon icon="mdi:phone"></iconify-icon> ${i.value}</a>`).join('')}
      </div>
      <div class="flex gap-4">
        ${socialLinks.map(s => `<a href="${s.url}" target="_blank" rel="noopener" class="text-gray-600 hover:text-blue-600"><iconify-icon icon="${getIconifyIcon(s.platform)}" width="18"></iconify-icon></a>`).join('')}
      </div>
    </div>
  </div>

  <header class="sticky top-0 z-50 bg-white shadow-md">
    <nav class="container mx-auto px-4 py-4 flex justify-between items-center relative">
      ${logoUrl ? `<a href="/" class="flex items-center gap-2"><img src="${logoUrl}" alt="${siteName}" class="h-10 w-auto"></a>` : `<a href="/" class="text-2xl font-bold text-blue-600">${siteName}</a>`}
      <button class="md:hidden" id="mobile-menu-btn">
        <iconify-icon icon="mdi:menu" width="28"></iconify-icon>
      </button>
      <ul class="hidden md:flex items-center gap-8 nav-menu" id="nav-menu">
        <li><a href="/" class="nav-link font-medium">Home</a></li>
        <li><a href="/about" class="nav-link font-medium">About Us</a></li>
        <li><a href="/products" class="nav-link font-medium">Products</a></li>
        <li><a href="/solutions" class="nav-link font-medium">Solutions</a></li>
        <li><a href="/cases" class="nav-link font-medium">Cases</a></li>
        <li><a href="/news" class="nav-link font-medium">Blogs</a></li>
        <li><a href="/contact" class="nav-link font-medium">Contact Us</a></li>
        <li class="relative" id="language-switcher-container" style="display: none;">
          <button id="language-switcher-btn" class="nav-link font-medium flex items-center gap-1">
            <iconify-icon icon="mdi:web"></iconify-icon> <span id="current-language">EN</span>
            <iconify-icon icon="mdi:chevron-down"></iconify-icon>
          </button>
          <div id="language-dropdown" class="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 hidden">
            <ul id="language-list" class="py-2"></ul>
          </div>
        </li>
        <li><a href="#" onclick="showPopup(); return false;" class="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-semibold transition">Get a Quote</a></li>
      </ul>
    </nav>
  </header>

  <main>
    ${slidesData.length > 0 ? `
    <div class="relative h-[500px] md:h-[600px] overflow-hidden" id="slider">
      <div class="slides-container h-full">
        ${slidesData.map((slide: any, index: number) => `
          <div class="slide absolute inset-0 ${index === 0 ? 'active' : ''}" data-index="${index}">
            <div class="slider-bg absolute inset-0" style="background-image: url('${slide.image_url || '/images/placeholder.jpg'}');"></div>
            <div class="absolute inset-0 bg-black bg-opacity-40"></div>
            <div class="container mx-auto px-4 h-full flex items-center relative z-10">
              <div class="text-white max-w-2xl">
                <h1 class="text-4xl md:text-5xl font-bold mb-4">${slide.title}</h1>
                ${slide.subtitle ? `<h2 class="text-xl md:text-2xl mb-4 text-gray-200">${slide.subtitle}</h2>` : ''}
                ${slide.description ? `<p class="text-lg mb-6 text-gray-300">${slide.description}</p>` : ''}
                ${slide.link_url ? `<a href="${slide.link_url}" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition">${slide.link_text || 'Learn More'}</a>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-3 rounded-full shadow-lg transition" onclick="slidePrev()">
        <iconify-icon icon="mdi:chevron-left" width="24"></iconify-icon>
      </button>
      <button class="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-3 rounded-full shadow-lg transition" onclick="slideNext()">
        <iconify-icon icon="mdi:chevron-right" width="24"></iconify-icon>
      </button>
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        ${slidesData.map((_: any, index: number) => `<button class="slider-dot w-3 h-3 rounded-full bg-white bg-opacity-60 hover:bg-opacity-100 transition ${index === 0 ? 'active bg-blue-500' : ''}" onclick="goToSlide(${index})"></button>`).join('')}
      </div>
    </div>
    ` : `
    <section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24 text-center">
      <div class="container mx-auto px-4">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">Your Trusted B2B Wholesale Partner</h1>
        <p class="text-xl mb-8 text-blue-100">${siteDescription}</p>
        <div class="flex justify-center gap-4">
          <a href="/products" class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">Browse Products</a>
          <a href="/contact" class="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">Contact Us</a>
        </div>
      </div>
    </section>
    `}

    <section id="products" class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Featured Products</h2>
        <div id="product-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"></div>
        <div class="text-center mt-8">
          <a href="/products" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">View All Products</a>
        </div>
      </div>
    </section>

    <section id="solutions" class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Application Solutions</h2>
        <div id="solution-list" class="grid grid-cols-1 md:grid-cols-3 gap-8"></div>
        <div class="text-center mt-8">
          <a href="/solutions" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">View All Solutions</a>
        </div>
      </div>
    </section>

    <section id="cases" class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Customer Cases</h2>
        <div id="case-list" class="grid grid-cols-1 md:grid-cols-3 gap-8"></div>
        <div class="text-center mt-8">
          <a href="/cases" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">View All Cases</a>
        </div>
      </div>
    </section>

    <section id="blogs" class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Latest News</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          ${newsData.items.slice(0, 3).map((n: any) => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
              <div class="h-48 bg-gray-200 flex items-center justify-center">
                ${firstImage(n.images) ? `<img src="${firstImage(n.images)}" alt="${n.title}" class="w-full h-full object-cover">` : '<iconify-icon icon="mdi:newspaper-variant-outline" width="64" class="text-gray-400"></iconify-icon>'}
              </div>
              <div class="p-6">
                <p class="text-gray-500 text-sm mb-2">${n.published_at ? new Date(n.published_at).toLocaleDateString() : ''}</p>
                <h3 class="text-lg font-semibold mb-2">${n.title}</h3>
                <p class="text-gray-600 mb-4 line-clamp-2">${n.short_description || ''}</p>
                <a href="/news/${n.slug}" class="text-blue-600 hover:text-blue-800 font-medium">Read More →</a>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="text-center mt-8">
          <a href="/news" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">View All News</a>
        </div>
      </div>
    </section>

    <section id="contact" class="py-16 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Send Inquiry</h2>
        <form id="inquiry-form" class="max-w-xl mx-auto">
          <div class="mb-6">
            <label for="name" class="block font-medium mb-2">Name *</label>
            <input type="text" id="name" name="name" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
          </div>
          <div class="mb-6">
            <label for="email" class="block font-medium mb-2">Email *</label>
            <input type="email" id="email" name="email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
          </div>
          <div class="mb-6">
            <label for="company" class="block font-medium mb-2">Company</label>
            <input type="text" id="company" name="company" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
          </div>
          <div class="mb-6">
            <label for="message" class="block font-medium mb-2">Message *</label>
            <textarea id="message" name="message" rows="5" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Submit Inquiry</button>
        </form>
      </div>
    </section>
  </main>

  <footer class="bg-gray-900 text-white py-12">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 class="text-xl font-bold mb-4">${siteName}</h3>
          <p class="text-gray-400">${siteDescription}</p>
        </div>
        <div>
          <h4 class="text-lg font-semibold mb-4">Quick Links</h4>
          <ul class="space-y-2">
            <li><a href="/products" class="text-gray-400 hover:text-white">Products</a></li>
            <li><a href="/solutions" class="text-gray-400 hover:text-white">Solutions</a></li>
            <li><a href="/cases" class="text-gray-400 hover:text-white">Cases</a></li>
            <li><a href="/news" class="text-gray-400 hover:text-white">Blogs</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-lg font-semibold mb-4">Contact</h4>
          ${contactInfo.map(i => `<p class="text-gray-400 flex items-center gap-2 mb-2"><iconify-icon icon="${getContactIcon(i.type)}"></iconify-icon> ${i.value}</p>`).join('')}
        </div>
        <div>
          <h4 class="text-lg font-semibold mb-4">Follow Us</h4>
          <div class="flex gap-4">
            ${socialLinks.map(s => `<a href="${s.url}" target="_blank" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition"><iconify-icon icon="${getIconifyIcon(s.platform)}" width="20"></iconify-icon></a>`).join('')}
          </div>
        </div>
      </div>
      <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
        <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <div class="fixed right-5 bottom-28 flex flex-col gap-3 z-40">
    ${contactInfo.filter(i => i.type === 'email').map(i => `<a href="mailto:${i.value}" class="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:scale-110 transition" title="Email"><iconify-icon icon="mdi:email" width="24"></iconify-icon></a>`).join('')}
    ${contactInfo.filter(i => i.type === 'whatsapp').map(i => `<a href="https://wa.me/${i.value.replace(/[^0-9]/g, '')}" class="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-green-500 hover:bg-green-50 hover:scale-110 transition" title="WhatsApp"><iconify-icon icon="fa6-brands:whatsapp" width="24"></iconify-icon></a>`).join('')}
    ${contactInfo.filter(i => i.type === 'phone').map(i => `<a href="tel:${i.value}" class="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 hover:scale-110 transition" title="Phone"><iconify-icon icon="mdi:phone" width="24"></iconify-icon></a>`).join('')}
    <a href="#" id="back-to-top" class="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:scale-110 transition" title="Back to Top">
      <iconify-icon icon="mdi:arrow-up" width="24"></iconify-icon>
    </a>
  </div>

  <div id="inquiry-popup" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden">
    <div class="bg-white rounded-xl max-w-lg w-full mx-4 p-8 relative max-h-[90vh] overflow-y-auto">
      <button class="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-3xl leading-none" onclick="closePopup()">×</button>
      <h2 id="popup-title" class="text-2xl font-bold mb-2">Get a Quick Quote</h2>
      <p id="popup-description" class="text-gray-600 mb-6">Fill out the form below and we will get back to you within 24 hours.</p>
      <form id="popup-form">
        <div class="mb-4">
          <label for="popup-name" class="block font-medium mb-2">Name *</label>
          <input type="text" id="popup-name" name="name" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
        </div>
        <div class="mb-4">
          <label for="popup-phone" class="block font-medium mb-2">Phone</label>
          <input type="tel" id="popup-phone" name="phone" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
        </div>
        <div class="mb-4">
          <label for="popup-whatsapp" class="block font-medium mb-2">WhatsApp</label>
          <input type="tel" id="popup-whatsapp" name="whatsapp" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
        </div>
        <div class="mb-4">
          <label for="popup-message" class="block font-medium mb-2">Message *</label>
          <textarea id="popup-message" name="message" rows="4" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Submit</button>
      </form>
    </div>
  </div>

  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script>
    window.popupSettings = ${JSON.stringify(await db.getPopupSettings() || {})};
  </script>
  <script src="/js/main.js"></script>
</body>
</html>
  `);
});

app.get('/sitemap.xml', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const products = await db.getProducts(undefined, 1, 1000);
  const categories = await db.getCategories();
  const solutions = await db.getSolutions();
  const cases = await db.getCases();
  const news = await db.getNews(undefined, 1, 1000);
  const pages = await db.getPages();
  
  const baseUrl = 'https://b2bwholesale.com';
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += '  <url>\n    <loc>https://b2bwholesale.com/</loc>\n    <lastmod>2026-01-01</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n';
  xml += '  <url>\n    <loc>https://b2bwholesale.com/products</loc>\n    <priority>0.9</priority>\n  </url>\n';
  xml += '  <url>\n    <loc>https://b2bwholesale.com/solutions</loc>\n    <priority>0.8</priority>\n  </url>\n';
  xml += '  <url>\n    <loc>https://b2bwholesale.com/cases</loc>\n    <priority>0.8</priority>\n  </url>\n';
  xml += '  <url>\n    <loc>https://b2bwholesale.com/news</loc>\n    <priority>0.8</priority>\n  </url>\n';
  xml += '  <url>\n    <loc>https://b2bwholesale.com/about</loc>\n    <priority>0.8</priority>\n  </url>\n';
  xml += '  <url>\n    <loc>https://b2bwholesale.com/contact</loc>\n    <priority>0.8</priority>\n  </url>\n';
  
  for (const category of categories) {
    xml += `  <url>\n    <loc>${baseUrl}/category/${category.slug}</loc>\n    <lastmod>${category.updated_at}</lastmod>\n    <priority>0.7</priority>\n  </url>\n`;
  }
  for (const product of products.items) {
    xml += `  <url>\n    <loc>${baseUrl}/product/${product.slug}</loc>\n    <lastmod>${product.updated_at}</lastmod>\n    <priority>0.6</priority>\n  </url>\n`;
  }
  for (const solution of solutions) {
    xml += `  <url>\n    <loc>${baseUrl}/solution/${solution.slug}</loc>\n    <lastmod>${solution.updated_at}</lastmod>\n    <priority>0.6</priority>\n  </url>\n`;
  }
  for (const item of cases) {
    xml += `  <url>\n    <loc>${baseUrl}/case/${item.slug}</loc>\n    <lastmod>${item.updated_at}</lastmod>\n    <priority>0.6</priority>\n  </url>\n`;
  }
  for (const item of news.items) {
    xml += `  <url>\n    <loc>${baseUrl}/news/${item.slug}</loc>\n    <lastmod>${item.updated_at}</lastmod>\n    <priority>0.6</priority>\n  </url>\n`;
  }
  for (const page of pages) {
    xml += `  <url>\n    <loc>${baseUrl}/${page.slug}</loc>\n    <lastmod>${page.updated_at}</lastmod>\n    <priority>0.5</priority>\n  </url>\n`;
  }
  xml += '</urlset>';
  
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  });
});

app.get('/robots.txt', async (c) => {
  const content = await generateRobotsTxt(c.env.DB);
  return new Response(content, {
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=3600' },
  });
});

app.get('/LLMs.txt', async (c) => {
  const content = await generateLLMsTxt(c.env.DB);
  return new Response(content, {
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=3600' },
  });
});

app.route('/api/products', products);
app.route('/api/categories', categories);
app.route('/api/inquiries', inquiries);
app.route('/api/settings', settings);
app.route('/api/translations', translations);
app.route('/api/admin', admin);
app.route('/api/upload', upload);
app.route('/api/pages', pages);
app.route('/api/solutions', solutions);
app.route('/api/cases', cases);
app.route('/api/news', news);
app.route('/api/leads', leads);
app.route('/api/slides', slides);
app.route('/api/jsonld', jsonLd);
app.route('/api/robots', robots);

app.get('/admin/*', async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Admin Panel - B2B Wholesale</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script src="https://code.iconify.design/iconify-icon/1.0.8/iconify-icon.min.js"></script>
  <link rel="stylesheet" href="/css/admin.css">
  <style>
    .login-bg {
      background-image: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/images/login-bg.png');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
  </style>
</head>
<body class="bg-gray-100">
  <div id="app">
    <div id="login-view" class="min-h-screen flex items-center justify-center login-bg">
      <div class="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 class="text-2xl font-bold text-center mb-6" data-i18n="login.title">Admin Login</h1>
        <form id="login-form">
          <div class="mb-4">
            <label for="username" class="block font-medium mb-2" data-i18n="login.username">Username</label>
            <input type="text" id="username" name="username" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
          </div>
          <div class="mb-6">
            <label for="password" class="block font-medium mb-2" data-i18n="login.password">Password</label>
            <input type="password" id="password" name="password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition" data-i18n="login.loginBtn">Login</button>
        </form>
        <div id="login-error" class="error-message mt-4"></div>
      </div>
    </div>
    <div id="admin-view" class="admin-layout hidden">
      <aside class="sidebar bg-gray-900 text-white w-64 min-h-screen fixed">
        <h2 class="p-4 text-xl font-bold border-b border-gray-700">Admin Panel</h2>
        <nav class="admin-nav py-4">
          <a href="#dashboard" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.dashboard"><iconify-icon icon="mdi:tachometer"></iconify-icon> Dashboard</a>
          <a href="#products" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.products"><iconify-icon icon="mdi:package-variant"></iconify-icon> Products</a>
          <a href="#categories" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.categories"><iconify-icon icon="mdi:tag-multiple"></iconify-icon> Categories</a>
          <a href="#slides" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.slides"><iconify-icon icon="mdi:image-multiple"></iconify-icon> Slides</a>
          <a href="#solutions" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.solutions"><iconify-icon icon="mdi:lightbulb"></iconify-icon> Solutions</a>
          <a href="#cases" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.cases"><iconify-icon icon="mdi:briefcase"></iconify-icon> Cases</a>
          <a href="#news" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.news"><iconify-icon icon="mdi:newspaper"></iconify-icon> News</a>
          <a href="#pages" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.pages"><iconify-icon icon="mdi:file-document"></iconify-icon> Pages</a>
          <a href="#inquiries" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.inquiries"><iconify-icon icon="mdi:email"></iconify-icon> Inquiries</a>
          <a href="#leads" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.leads"><iconify-icon icon="mdi:account-group"></iconify-icon> Leads</a>
          <a href="#settings" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.settings"><iconify-icon icon="mdi:cog"></iconify-icon> Settings</a>
          <a href="#seo" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.seo"><iconify-icon icon="mdi:magnify"></iconify-icon> SEO & JSON-LD</a>
          <a href="#robots" class="nav-item flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition" data-i18n="nav.robots"><iconify-icon icon="mdi:robot"></iconify-icon> Robots.txt</a>
        </nav>
      </aside>
      <main class="main-content ml-64 p-8">
        <header class="flex justify-between items-center mb-8">
          <h1 id="page-title" class="text-2xl font-bold">Dashboard</h1>
          <div class="flex items-center gap-4">
            <select id="lang-select" class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
            <button id="clear-cache-btn" class="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition" data-i18n="common.clearCache">Clear Cache</button>
            <button id="logout-btn" class="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition" data-i18n="common.logout">Logout</button>
          </div>
        </header>
        <div id="dashboard-page" class="page active">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div class="bg-white p-6 rounded-lg shadow"><h3 class="text-gray-500 text-sm" data-i18n="dashboard.totalProducts">Total Products</h3><p id="stat-products" class="text-2xl font-bold">-</p></div>
            <div class="bg-white p-6 rounded-lg shadow"><h3 class="text-gray-500 text-sm" data-i18n="dashboard.totalInquiries">Total Inquiries</h3><p id="stat-inquiries" class="text-2xl font-bold">-</p></div>
            <div class="bg-white p-6 rounded-lg shadow"><h3 class="text-gray-500 text-sm" data-i18n="dashboard.pendingInquiries">Pending Inquiries</h3><p id="stat-pending" class="text-2xl font-bold">-</p></div>
            <div class="bg-white p-6 rounded-lg shadow"><h3 class="text-gray-500 text-sm" data-i18n="dashboard.totalLeads">Total Leads</h3><p id="stat-leads" class="text-2xl font-bold">-</p></div>
            <div class="bg-white p-6 rounded-lg shadow"><h3 class="text-gray-500 text-sm" data-i18n="dashboard.totalCases">Total Cases</h3><p id="stat-cases" class="text-2xl font-bold">-</p></div>
            <div class="bg-white p-6 rounded-lg shadow"><h3 class="text-gray-500 text-sm" data-i18n="dashboard.totalNews">Total News</h3><p id="stat-news" class="text-2xl font-bold">-</p></div>
          </div>
        </div>
        <div id="products-page" class="page hidden"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold" data-i18n="products.title">Products</h2><button id="add-product-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" data-i18n="products.addProduct">Add Product</button></div><div id="product-table"></div></div>
        <div id="categories-page" class="page hidden"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold" data-i18n="categories.title">Categories</h2><button id="add-category-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" data-i18n="categories.addCategory">Add Category</button></div><div id="category-table"></div></div>
        <div id="slides-page" class="page hidden"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold" data-i18n="slides.title">Slides</h2><button id="add-slide-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" data-i18n="slides.addSlide">Add Slide</button></div><div id="slide-table"></div></div>
        <div id="solutions-page" class="page hidden"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold" data-i18n="solutions.title">Solutions</h2><button id="add-solution-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" data-i18n="solutions.addSolution">Add Solution</button></div><div id="solution-table"></div></div>
        <div id="cases-page" class="page hidden"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold" data-i18n="cases.title">Cases</h2><button id="add-case-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" data-i18n="cases.addCase">Add Case</button></div><div id="case-table"></div></div>
        <div id="news-page" class="page hidden"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold" data-i18n="news.title">News</h2><button id="add-news-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" data-i18n="news.addNews">Add News</button></div><div id="news-table"></div></div>
        <div id="pages-page" class="page hidden"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold" data-i18n="pages.title">Pages</h2></div><div id="pages-table"></div></div>
        <div id="inquiries-page" class="page hidden"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold" data-i18n="inquiries.title">Inquiries</h2></div><div id="inquiry-table"></div></div>
        <div id="leads-page" class="page hidden"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-semibold" data-i18n="leads.title">Leads</h2></div><div id="leads-table"></div></div>
        <div id="settings-page" class="page hidden">
          <h2 class="text-xl font-semibold mb-4" data-i18n="settings.generalSettings">General Settings</h2><form id="settings-form"></form>
          <h2 class="text-xl font-semibold mt-8 mb-4" data-i18n="settings.popupSettings">Popup Settings</h2><form id="popup-settings-form"></form>
          <h2 class="text-xl font-semibold mt-8 mb-4" data-i18n="settings.socialLinks">Social Links</h2><div id="social-links-form"></div>
          <h2 class="text-xl font-semibold mt-8 mb-4" data-i18n="settings.contactInfo">Contact Info</h2><div id="contact-info-form"></div>
          <h2 class="text-xl font-semibold mt-8 mb-4" data-i18n="settings.translationSettings">Translation Settings</h2><div id="translation-settings-form"></div>
        </div>
        <div id="seo-page" class="page hidden"><h2 class="text-xl font-semibold mb-4" data-i18n="seo.title">JSON-LD Configuration</h2><div id="jsonld-form"></div></div>
        <div id="robots-page" class="page hidden"><h2 class="text-xl font-semibold mb-4" data-i18n="robots.title">Robots.txt Configuration</h2><div id="robots-form"></div><button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" onclick="previewRobots()" data-i18n="robots.preview">Preview robots.txt</button></div>
      </main>
    </div>
  </div>
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="/js/admin.js"></script>
</body>
</html>`);
});

app.get('/products', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const settingsData = await db.getSettings();
  const socialLinks = await db.getSocialLinks();
  const contactInfo = await db.getContactInfo();
  const productsData = await db.getProducts(undefined, 1, 12);
  const categories = await db.getCategories();

  const content = `
    <section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
      <div class="container mx-auto px-4">
        <h1 class="text-4xl font-bold mb-4">Products Center</h1>
        <p class="text-xl text-blue-100">Browse our quality products at wholesale prices</p>
      </div>
    </section>
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="mb-8">
          <select id="category-filter" class="px-4 py-2 border border-gray-300 rounded-lg" onchange="filterProducts(this.value)">
            <option value="">All Categories</option>
            ${categories.map((c: any) => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div id="product-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          ${productsData.items.length > 0 ? productsData.items.map((p: any) => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
              <div class="h-48 bg-gray-200 flex items-center justify-center">
                ${firstImage(p.images) ? `<img src="${firstImage(p.images)}" alt="${p.name}" class="w-full h-full object-cover">` : '<iconify-icon icon="mdi:package-variant" width="64" class="text-gray-400"></iconify-icon>'}
              </div>
              <div class="p-4">
                <h3 class="text-lg font-semibold mb-2">${p.name}</h3>
                <p class="text-gray-600 text-sm mb-3">${p.short_description || ''}</p>
                <div class="flex justify-between items-center">
                  ${p.price ? `<span class="text-blue-600 font-bold">$${p.price}</span>` : ''}
                  <a href="/product/${p.slug}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details</a>
                </div>
              </div>
            </div>
          `).join('') : '<p class="text-gray-500 col-span-full text-center py-8">No products found</p>'}
        </div>
        ${productsData.total > 12 ? `<div class="mt-8 text-center"><button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Load More</button></div>` : ''}
      </div>
    </section>
  `;

  return c.html(getPageLayout('Products', content, settingsData, socialLinks, contactInfo));
});

app.get('/solutions', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const settingsData = await db.getSettings();
  const socialLinks = await db.getSocialLinks();
  const contactInfo = await db.getContactInfo();
  const solutions = await db.getSolutions();

  const content = `
    <section class="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
      <div class="container mx-auto px-4">
        <h1 class="text-4xl font-bold mb-4">Solutions</h1>
        <p class="text-xl text-green-100">Industry-specific solutions for your business</p>
      </div>
    </section>
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${solutions.length > 0 ? solutions.map((s: any) => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
              <div class="h-48 bg-gray-200 flex items-center justify-center">
                ${firstImage(s.images) ? `<img src="${firstImage(s.images)}" alt="${s.title}" class="w-full h-full object-cover">` : '<iconify-icon icon="mdi:lightbulb-outline" width="64" class="text-gray-400"></iconify-icon>'}
              </div>
              <div class="p-6">
                <h3 class="text-xl font-semibold mb-2">${s.title}</h3>
                <p class="text-gray-600 mb-4">${s.short_description || ''}</p>
                <a href="/solution/${s.slug}" class="text-green-600 hover:text-green-800 font-medium">Learn More →</a>
              </div>
            </div>
          `).join('') : '<p class="text-gray-500 col-span-full text-center py-8">No solutions available</p>'}
        </div>
      </div>
    </section>
  `;

  return c.html(getPageLayout('Solutions', content, settingsData, socialLinks, contactInfo));
});

app.get('/cases', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const settingsData = await db.getSettings();
  const socialLinks = await db.getSocialLinks();
  const contactInfo = await db.getContactInfo();
  const cases = await db.getCases();

  const content = `
    <section class="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-16">
      <div class="container mx-auto px-4">
        <h1 class="text-4xl font-bold mb-4">Success Cases</h1>
        <p class="text-xl text-purple-100">See how we've helped our clients succeed</p>
      </div>
    </section>
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="space-y-8">
          ${cases.length > 0 ? cases.map((item: any) => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition flex flex-col md:flex-row">
              <div class="md:w-1/3 h-48 md:h-auto bg-gray-200 flex items-center justify-center">
                ${firstImage(item.images) ? `<img src="${firstImage(item.images)}" alt="${item.title}" class="w-full h-full object-cover">` : '<iconify-icon icon="mdi:briefcase-outline" width="64" class="text-gray-400"></iconify-icon>'}
              </div>
              <div class="p-6 md:w-2/3">
                <h3 class="text-xl font-semibold mb-2">${item.title}</h3>
                ${item.client_name ? `<p class="text-gray-500 mb-2">Client: ${item.client_name}</p>` : ''}
                ${item.industry ? `<p class="text-gray-500 mb-2">Industry: ${item.industry}</p>` : ''}
                <p class="text-gray-600 mb-4">${item.short_description || item.challenge || ''}</p>
                <a href="/case/${item.slug}" class="text-purple-600 hover:text-purple-800 font-medium">Read More →</a>
              </div>
            </div>
          `).join('') : '<p class="text-gray-500 text-center py-8">No cases available</p>'}
        </div>
      </div>
    </section>
  `;

  return c.html(getPageLayout('Cases', content, settingsData, socialLinks, contactInfo));
});

app.get('/news', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const settingsData = await db.getSettings();
  const socialLinks = await db.getSocialLinks();
  const contactInfo = await db.getContactInfo();
  const newsData = await db.getNews(false, 1, 10);

  const content = `
    <section class="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-16">
      <div class="container mx-auto px-4">
        <h1 class="text-4xl font-bold mb-4">News & Updates</h1>
        <p class="text-xl text-orange-100">Latest news and industry insights</p>
      </div>
    </section>
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          ${newsData.items.length > 0 ? newsData.items.map((n: any) => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
              <div class="h-48 bg-gray-200 flex items-center justify-center">
                ${firstImage(n.images) ? `<img src="${firstImage(n.images)}" alt="${n.title}" class="w-full h-full object-cover">` : '<iconify-icon icon="mdi:newspaper-variant-outline" width="64" class="text-gray-400"></iconify-icon>'}
              </div>
              <div class="p-6">
                <p class="text-gray-500 text-sm mb-2">${n.published_at ? new Date(n.published_at).toLocaleDateString() : ''}</p>
                <h3 class="text-lg font-semibold mb-2">${n.title}</h3>
                <p class="text-gray-600 mb-4 line-clamp-3">${n.short_description || ''}</p>
                <a href="/news/${n.slug}" class="text-orange-600 hover:text-orange-800 font-medium">Read More →</a>
              </div>
            </div>
          `).join('') : '<p class="text-gray-500 col-span-full text-center py-8">No news available</p>'}
        </div>
      </div>
    </section>
  `;

  return c.html(getPageLayout('News', content, settingsData, socialLinks, contactInfo));
});

app.get('/about', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const settingsData = await db.getSettings();
  const socialLinks = await db.getSocialLinks();
  const contactInfo = await db.getContactInfo();
  const page = await db.getPageBySlug('about');

  const content = `
    <section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
      <div class="container mx-auto px-4">
        <h1 class="text-4xl font-bold mb-4">About Us</h1>
        <p class="text-xl text-blue-100">Learn more about our company</p>
      </div>
    </section>
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="max-w-3xl mx-auto">
          ${page?.content || `
            <div class="prose max-w-none">
              <h2 class="text-2xl font-bold mb-4">Who We Are</h2>
              <p class="text-gray-600 mb-6">We are a leading B2B wholesale provider dedicated to connecting buyers with quality manufacturers and suppliers worldwide.</p>
              <h2 class="text-2xl font-bold mb-4">Our Mission</h2>
              <p class="text-gray-600 mb-6">To provide businesses with access to high-quality products at competitive wholesale prices, backed by exceptional service.</p>
              <h2 class="text-2xl font-bold mb-4">Why Choose Us</h2>
              <ul class="list-disc list-inside text-gray-600 space-y-2">
                <li>Quality products from verified suppliers</li>
                <li>Competitive wholesale pricing</li>
                <li>Global shipping to 100+ countries</li>
                <li>24/7 customer support</li>
              </ul>
            </div>
          `}
        </div>
      </div>
    </section>
  `;

  return c.html(getPageLayout('About Us', content, settingsData, socialLinks, contactInfo));
});

app.get('/contact', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const settingsData = await db.getSettings();
  const socialLinks = await db.getSocialLinks();
  const contactInfo = await db.getContactInfo();

  const content = `
    <section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
      <div class="container mx-auto px-4">
        <h1 class="text-4xl font-bold mb-4">Contact Us</h1>
        <p class="text-xl text-blue-100">We'd love to hear from you</p>
      </div>
    </section>
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 class="text-2xl font-bold mb-6">Get In Touch</h2>
            <div class="space-y-4">
              ${contactInfo.map((i: any) => `
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <iconify-icon icon="${getContactIcon(i.type)}" class="text-blue-600" width="24"></iconify-icon>
                  </div>
                  <div>
                    <p class="font-medium">${i.label || i.type}</p>
                    <p class="text-gray-600">${i.value}</p>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="mt-8">
              <h3 class="text-lg font-semibold mb-4">Follow Us</h3>
              <div class="flex gap-4">
                ${socialLinks.map((s: any) => `<a href="${s.url}" target="_blank" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition"><iconify-icon icon="${getIconifyIcon(s.platform)}" width="20"></iconify-icon></a>`).join('')}
              </div>
            </div>
          </div>
          <div>
            <h2 class="text-2xl font-bold mb-6">Send Us a Message</h2>
            <form id="contact-form" class="space-y-4">
              <div>
                <label class="block font-medium mb-2">Name *</label>
                <input type="text" name="name" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              </div>
              <div>
                <label class="block font-medium mb-2">Email *</label>
                <input type="email" name="email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              </div>
              <div>
                <label class="block font-medium mb-2">Company</label>
                <input type="text" name="company" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              </div>
              <div>
                <label class="block font-medium mb-2">Message *</label>
                <textarea name="message" required rows="5" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>
              </div>
              <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
    <script>
      document.getElementById('contact-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        try {
          const res = await fetch('/api/inquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(formData))
          });
          const data = await res.json();
          if (data.success) {
            alert('Thank you! We will contact you soon.');
            form.reset();
          } else {
            alert(data.error || 'Failed to send message');
          }
        } catch (err) { alert('Error sending message'); }
      });
    </script>
  `;

  return c.html(getPageLayout('Contact Us', content, settingsData, socialLinks, contactInfo));
});

// ============================================================
// 详情页：产品 / 解决方案 / 案例 / 新闻 / 自定义页面
// 这些路由让后台新增的内容在前台有对应的落地页
// ============================================================

/** 安全解析 JSON 数组，失败返回空数组 */
function safeParseArray(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 安全解析 JSON 对象 */
function safeParseObject(value: any): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** 取图片数组第一张的 URL，解析失败返回空字符串（用于列表页缩略图） */
function firstImage(value: any): string {
  const arr = safeParseArray(value);
  return arr.length ? String(arr[0]) : '';
}

/** 构建产品详情页的 JSON-LD 结构化数据（SEO） */
function buildProductJsonLd(product: any, images: string[], siteUrl: string): string {
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description || product.description || '',
    sku: `P${product.id}`,
    url: `${siteUrl}/product/${product.slug}`,
  };
  if (images.length) data.image = images;
  if (product.price) {
    data.offers = {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    };
  }
  return JSON.stringify(data);
}

/** 通用详情页头部（面包屑 + 标题） */
function detailHero(title: string, breadcrumb: { label: string; href?: string }[], gradient: string, subtitle = ''): string {
  return `
    <section class="bg-gradient-to-r ${gradient} text-white py-12">
      <div class="container mx-auto px-4">
        <nav class="text-sm mb-4 opacity-90">
          <a href="/" class="hover:underline">Home</a>
          ${breadcrumb.map((b) => ` <span class="mx-1">/</span> ${b.href ? `<a href="${b.href}" class="hover:underline">${b.label}</a>` : `<span>${b.label}</span>`}`).join('')}
        </nav>
        <h1 class="text-3xl md:text-4xl font-bold mb-2">${title}</h1>
        ${subtitle ? `<p class="text-lg opacity-90">${subtitle}</p>` : ''}
      </div>
    </section>
  `;
}

// 产品详情
app.get('/product/:slug', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const slug = c.req.param('slug');
  const product = await db.getProductBySlug(slug);
  if (!product) {
    return c.notFound();
  }
  const settingsData = await db.getSettings();
  const socialLinks = await db.getSocialLinks();
  const contactInfo = await db.getContactInfo();
  const category = product.category_id ? await db.getCategoryById(product.category_id) : null;
  const images = safeParseArray(product.images);
  const specs = safeParseObject(product.specifications);
  const siteUrl = c.env.SITE_URL || `https://${c.req.header('host') || 'example.com'}`;

  const gallery = images.length
    ? `<img id="main-image" src="${images[0]}" alt="${product.name}" class="w-full h-96 object-cover rounded-lg mb-4">
       ${images.length > 1 ? `<div class="grid grid-cols-4 gap-2">${images.map((img, i) => `<img src="${img}" data-index="${i}" class="gallery-thumb w-full h-20 object-cover rounded cursor-pointer border-2 ${i === 0 ? 'border-blue-600' : 'border-transparent'}" alt="${product.name}">`).join('')}</div>` : ''}`
    : '<div class="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg mb-4"><iconify-icon icon="mdi:package-variant" width="96" class="text-gray-400"></iconify-icon></div>';

  const specRows = Object.keys(specs).length
    ? `<table class="w-full text-sm"><tbody>${Object.entries(specs).map(([k, v]) => `<tr class="border-b"><td class="py-2 font-medium text-gray-600 w-1/3">${k}</td><td class="py-2">${v}</td></tr>`).join('')}</tbody></table>`
    : '<p class="text-gray-500">No specifications provided.</p>';

  const content = `
    ${detailHero(product.name, [
      { label: 'Products', href: '/products' },
      ...(category ? [{ label: category.name, href: `/products?category=${category.id}` }] : []),
      { label: product.name },
    ], 'from-blue-600 to-blue-800', product.short_description || '')}
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>${gallery}</div>
          <div>
            ${category ? `<span class="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full mb-3">${category.name}</span>` : ''}
            <h2 class="text-2xl font-bold mb-4">${product.name}</h2>
            <p class="text-gray-600 mb-6">${product.short_description || ''}</p>
            ${product.price ? `<p class="text-3xl font-bold text-blue-600 mb-2">$${product.price}</p>` : ''}
            ${product.min_order_qty ? `<p class="text-gray-500 mb-6">Min. Order: ${product.min_order_qty} units</p>` : ''}
            <button onclick="openInquiry(${product.id})" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition mb-6">Request a Quote</button>
            <div class="border-t pt-6">
              <h3 class="font-semibold mb-3">Specifications</h3>
              ${specRows}
            </div>
          </div>
        </div>
        <div class="mt-16">
          <h3 class="text-2xl font-bold mb-4">Product Description</h3>
          <div class="prose max-w-none text-gray-700">${product.description || '<p class="text-gray-500">No description provided.</p>'}</div>
        </div>
      </div>
    </section>
    <script>
      (function(){
        var images = ${JSON.stringify(images)};
        var main = document.getElementById('main-image');
        document.querySelectorAll('.gallery-thumb').forEach(function(el){
          el.addEventListener('click', function(){
            var i = parseInt(this.getAttribute('data-index'), 10);
            if (main && images[i]) main.src = images[i];
            document.querySelectorAll('.gallery-thumb').forEach(function(t){ t.classList.remove('border-blue-600'); t.classList.add('border-transparent'); });
            this.classList.remove('border-transparent'); this.classList.add('border-blue-600');
          });
        });
      })();
      function openInquiry(productId) {
        var idInput = document.getElementById('inquiry-product-id');
        if (idInput) idInput.value = productId;
        showPopup();
      }
    </script>
  `;

  return c.html(getPageLayout(product.name, content, settingsData, socialLinks, contactInfo,
    `<script type="application/ld+json">${buildProductJsonLd(product, images, siteUrl)}</script>`));
});

// 解决方案详情
app.get('/solution/:slug', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const slug = c.req.param('slug');
  const solution = await db.getSolutionBySlug(slug);
  if (!solution) return c.notFound();
  const settingsData = await db.getSettings();
  const socialLinks = await db.getSocialLinks();
  const contactInfo = await db.getContactInfo();
  const images = safeParseArray(solution.images);

  const content = `
    ${detailHero(solution.title, [{ label: 'Solutions', href: '/solutions' }, { label: solution.title }], 'from-green-600 to-green-800', solution.short_description || '')}
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div class="lg:col-span-2">
            ${images.length ? `<img src="${images[0]}" alt="${solution.title}" class="w-full h-80 object-cover rounded-lg mb-8">` : ''}
            <div class="prose max-w-none text-gray-700">${solution.content || '<p class="text-gray-500">No content provided.</p>'}</div>
          </div>
          <aside class="lg:col-span-1">
            <div class="bg-gray-50 rounded-lg p-6 sticky top-24">
              <h3 class="font-bold text-lg mb-4">Interested in this solution?</h3>
              <p class="text-gray-600 text-sm mb-6">Contact us for a tailored proposal for your business.</p>
              <button onclick="showPopup()" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition">Get in Touch</button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  `;
  return c.html(getPageLayout(solution.title, content, settingsData, socialLinks, contactInfo));
});

// 案例详情
app.get('/case/:slug', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const slug = c.req.param('slug');
  const item = await db.getCaseBySlug(slug);
  if (!item) return c.notFound();
  const settingsData = await db.getSettings();
  const socialLinks = await db.getSocialLinks();
  const contactInfo = await db.getContactInfo();
  const images = safeParseArray(item.images);

  const content = `
    ${detailHero(item.title, [{ label: 'Cases', href: '/cases' }, { label: item.title }], 'from-purple-600 to-purple-800', item.client_name ? `Client: ${item.client_name}` : '')}
    <section class="py-16">
      <div class="container mx-auto px-4 max-w-4xl">
        ${images.length ? `<img src="${images[0]}" alt="${item.title}" class="w-full h-80 object-cover rounded-lg mb-8">` : ''}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          ${item.industry ? `<div class="bg-purple-50 rounded-lg p-4"><p class="text-sm text-purple-600 font-medium mb-1">Industry</p><p class="font-semibold">${item.industry}</p></div>` : ''}
          ${item.client_name ? `<div class="bg-purple-50 rounded-lg p-4"><p class="text-sm text-purple-600 font-medium mb-1">Client</p><p class="font-semibold">${item.client_name}</p></div>` : ''}
        </div>
        ${item.challenge ? `<div class="mb-8"><h3 class="text-xl font-bold mb-3">The Challenge</h3><div class="prose max-w-none text-gray-700">${item.challenge}</div></div>` : ''}
        ${item.solution ? `<div class="mb-8"><h3 class="text-xl font-bold mb-3">Our Solution</h3><div class="prose max-w-none text-gray-700">${item.solution}</div></div>` : ''}
        ${item.results ? `<div class="mb-8"><h3 class="text-xl font-bold mb-3">Results</h3><div class="prose max-w-none text-gray-700">${item.results}</div></div>` : ''}
        ${item.testimonial ? `<blockquote class="border-l-4 border-purple-600 pl-6 italic text-gray-700 my-8">${item.testimonial}</blockquote>` : ''}
        <div class="mt-12 text-center">
          <button onclick="showPopup()" class="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-lg transition">Start Your Project</button>
        </div>
      </div>
    </section>
  `;
  return c.html(getPageLayout(item.title, content, settingsData, socialLinks, contactInfo));
});

// 新闻详情
app.get('/news/:slug', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const slug = c.req.param('slug');
  const item = await db.getNewsBySlug(slug);
  if (!item) return c.notFound();
  const settingsData = await db.getSettings();
  const socialLinks = await db.getSocialLinks();
  const contactInfo = await db.getContactInfo();
  const images = safeParseArray(item.images);

  const content = `
    ${detailHero(item.title, [{ label: 'News', href: '/news' }, { label: item.title }], 'from-orange-600 to-orange-800')}
    <section class="py-16">
      <div class="container mx-auto px-4 max-w-3xl">
        <div class="flex items-center gap-4 text-sm text-gray-500 mb-6">
          ${item.published_at ? `<span>${new Date(item.published_at).toLocaleDateString()}</span>` : ''}
          ${item.author ? `<span>By ${item.author}</span>` : ''}
          <span>${item.view_count || 0} views</span>
        </div>
        ${images.length ? `<img src="${images[0]}" alt="${item.title}" class="w-full h-80 object-cover rounded-lg mb-8">` : ''}
        <div class="prose max-w-none text-gray-700">${item.content || item.short_description || '<p class="text-gray-500">No content provided.</p>'}</div>
        <div class="mt-12 pt-8 border-t">
          <a href="/news" class="text-orange-600 hover:text-orange-800 font-medium">← Back to News</a>
        </div>
      </div>
    </section>
  `;
  return c.html(getPageLayout(item.title, content, settingsData, socialLinks, contactInfo));
});

// 自定义页面（后台「页面管理」创建的任意 slug）
app.get('/page/:slug', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const slug = c.req.param('slug');
  const page = await db.getPageBySlug(slug);
  if (!page) return c.notFound();
  const settingsData = await db.getSettings();
  const socialLinks = await db.getSocialLinks();
  const contactInfo = await db.getContactInfo();

  const content = `
    ${detailHero(page.title, [{ label: page.title }], 'from-blue-600 to-blue-800')}
    <section class="py-16">
      <div class="container mx-auto px-4 max-w-3xl">
        <div class="prose max-w-none text-gray-700">${page.content || '<p class="text-gray-500">This page is empty.</p>'}</div>
      </div>
    </section>
  `;
  return c.html(getPageLayout(page.meta_title || page.title, content, settingsData, socialLinks, contactInfo));
});

app.notFound((c) => c.json({ success: false, error: 'Not Found' }, 404));
app.onError((err, c) => { console.error(err); return c.json({ success: false, error: err.message }, 500); });

export default app;