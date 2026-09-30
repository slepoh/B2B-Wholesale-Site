let currentPage = 'dashboard';
let credentials = null;
let currentLang = localStorage.getItem('adminLang') || 'en';

const translations = {
  en: {
    login: { title: 'Admin Login', username: 'Username', password: 'Password', loginBtn: 'Login', invalidCreds: 'Invalid username or password', loginFailed: 'Login failed. Please try again.' },
    nav: { dashboard: 'Dashboard', products: 'Products', categories: 'Categories', slides: 'Slides', solutions: 'Solutions', cases: 'Cases', news: 'News', pages: 'Pages', inquiries: 'Inquiries', leads: 'Leads', settings: 'Settings', seo: 'SEO & JSON-LD', robots: 'Robots.txt' },
    dashboard: { title: 'Dashboard', totalProducts: 'Total Products', totalInquiries: 'Total Inquiries', pendingInquiries: 'Pending Inquiries', totalLeads: 'Total Leads', totalCases: 'Total Cases', totalNews: 'Total News' },
    common: { add: 'Add', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel', actions: 'Actions', status: 'Status', active: 'Active', inactive: 'Inactive', active2: 'Active', inactive2: 'Inactive', featured: 'Featured', name: 'Name', title: 'Title', description: 'Description', image: 'Image', images: 'Images', url: 'URL', slug: 'Slug', sortOrder: 'Sort Order', selectCategory: 'Select Category', parent: 'Parent', noParent: 'No Parent', createdAt: 'Created', updatedAt: 'Updated', confirmDelete: 'Are you sure?', deleteSuccess: 'Deleted successfully', saveSuccess: 'Saved successfully', error: 'Error', loading: 'Loading...', noData: 'No data', viewAll: 'View All', addNew: 'Add New', uploadImage: 'Upload Image', imageUrl: 'Image URL', upload: 'Upload', logout: 'Logout', clearCache: 'Clear Cache', cacheCleared: 'Cache cleared successfully', cacheClearFailed: 'Failed to clear cache' },
    products: { title: 'Products', addProduct: 'Add Product', editProduct: 'Edit Product', productName: 'Product Name', shortDescription: 'Short Description', fullDescription: 'Full Description', price: 'Price', moq: 'MOQ (Min Order Qty)', category: 'Category', allCategories: 'All Categories', search: 'Search products...' },
    categories: { title: 'Categories', addCategory: 'Add Category', editCategory: 'Edit Category', categoryName: 'Category Name', parentCategory: 'Parent Category' },
    slides: { title: 'Slides', addSlide: 'Add Slide', editSlide: 'Edit Slide', slideTitle: 'Title', subtitle: 'Subtitle', slideDescription: 'Description', slideImage: 'Background Image', linkUrl: 'Link URL', linkText: 'Button Text' },
    solutions: { title: 'Solutions', addSolution: 'Add Solution', editSolution: 'Edit Solution' },
    cases: { title: 'Cases', addCase: 'Add Case', editCase: 'Edit Case', clientName: 'Client Name' },
    news: { title: 'News', addNews: 'Add News', editNews: 'Edit News', content: 'Content', author: 'Author' },
    pages: { title: 'Pages', editPage: 'Edit Page', metaTitle: 'Meta Title', metaDescription: 'Meta Description', content: 'Page Content' },
    inquiries: { title: 'Inquiries', reply: 'Reply', replySubject: 'Reply Subject', replyMessage: 'Reply Message', sendReply: 'Send Reply', company: 'Company', phone: 'Phone', read: 'Read', unread: 'Unread', pending: 'Pending', completed: 'Completed' },
    leads: { title: 'Leads', leadName: 'Name', phone: 'Phone', whatsapp: 'WhatsApp', message: 'Message' },
    settings: { title: 'Settings', generalSettings: 'General Settings', siteName: 'Site Name', siteTitle: 'Site Title', siteDescription: 'Site Description', siteKeywords: 'Site Keywords', logoUrl: 'Logo URL', popupSettings: 'Popup Settings', enablePopup: 'Enable Popup', popupDelay: 'Delay (seconds)', popupTitle: 'Popup Title', popupDescription: 'Popup Description', socialLinks: 'Social Links', contactInfo: 'Contact Info', addSocial: 'Add Social Link', platform: 'Platform', socialUrl: 'URL', contactType: 'Type', contactValue: 'Value', contactLabel: 'Label', email: 'Email', phone2: 'Phone', whatsapp2: 'WhatsApp', saveSettings: 'Save Settings' },
    seo: { title: 'JSON-LD Configuration', addConfig: 'Add Configuration', name: 'Name', schemaType: 'Schema Type', configValue: 'Configuration', extraData: 'Extra Data (JSON)' },
    robots: { title: 'Robots.txt Configuration', addRule: 'Add Rule', userAgent: 'User Agent', rule: 'Rule', allow: 'Allow', disallow: 'Disallow', preview: 'Preview robots.txt', robotRules: 'Robot Rules' },
    form: { required: 'Required', optional: 'Optional', selectOption: 'Select an option', enterText: 'Enter text', enterUrl: 'Enter URL', enterNumber: 'Enter number' }
  },
  zh: {
    login: { title: '管理员登录', username: '用户名', password: '密码', loginBtn: '登录', invalidCreds: '用户名或密码错误', loginFailed: '登录失败，请重试' },
    nav: { dashboard: '仪表盘', products: '产品', categories: '分类', slides: '幻灯片', solutions: '解决方案', cases: '案例', news: '新闻', pages: '页面', inquiries: '询盘', leads: '潜在客户', settings: '设置', seo: 'SEO 和 JSON-LD', robots: 'Robots.txt' },
    dashboard: { title: '仪表盘', totalProducts: '产品总数', totalInquiries: '询盘总数', pendingInquiries: '待处理询盘', totalLeads: '潜在客户', totalCases: '案例总数', totalNews: '新闻总数' },
    common: { add: '添加', edit: '编辑', delete: '删除', save: '保存', cancel: '取消', actions: '操作', status: '状态', active: '启用', inactive: '禁用', active2: '启用中', inactive2: '已禁用', featured: '推荐', name: '名称', title: '标题', description: '描述', image: '图片', images: '图片', url: '链接', slug: '别名', sortOrder: '排序', selectCategory: '选择分类', parent: '父级', noParent: '无父级', createdAt: '创建时间', updatedAt: '更新时间', confirmDelete: '确定要删除吗？', deleteSuccess: '删除成功', saveSuccess: '保存成功', error: '错误', loading: '加载中...', noData: '暂无数据', viewAll: '查看全部', addNew: '新增', uploadImage: '上传图片', imageUrl: '图片地址', upload: '上传', logout: '退出登录', clearCache: '清除缓存', cacheCleared: '缓存已清除成功', cacheClearFailed: '清除缓存失败' },
    products: { title: '产品', addProduct: '添加产品', editProduct: '编辑产品', productName: '产品名称', shortDescription: '简短描述', fullDescription: '完整描述', price: '价格', moq: '最小起订量', category: '分类', allCategories: '全部分类', search: '搜索产品...' },
    categories: { title: '分类', addCategory: '添加分类', editCategory: '编辑分类', categoryName: '分类名称', parentCategory: '父级分类' },
    slides: { title: '幻灯片', addSlide: '添加幻灯片', editSlide: '编辑幻灯片', slideTitle: '标题', subtitle: '副标题', slideDescription: '描述', slideImage: '背景图片', linkUrl: '链接地址', linkText: '按钮文字' },
    solutions: { title: '解决方案', addSolution: '添加解决方案', editSolution: '编辑解决方案' },
    cases: { title: '案例', addCase: '添加案例', editCase: '编辑案例', clientName: '客户名称' },
    news: { title: '新闻', addNews: '添加新闻', editNews: '编辑新闻', content: '内容', author: '作者' },
    pages: { title: '页面', editPage: '编辑页面', metaTitle: 'SEO 标题', metaDescription: 'SEO 描述', content: '页面内容' },
    inquiries: { title: '询盘', reply: '回复', replySubject: '回复主题', replyMessage: '回复内容', sendReply: '发送回复', company: '公司', phone: '电话', read: '已读', unread: '未读', pending: '处理中', completed: '已完成' },
    leads: { title: '潜在客户', leadName: '姓名', phone: '电话', whatsapp: 'WhatsApp', message: '留言' },
    settings: { title: '设置', generalSettings: '基本设置', siteName: '网站名称', siteTitle: '网站标题', siteDescription: '网站描述', siteKeywords: '网站关键词', logoUrl: 'Logo 地址', popupSettings: '弹窗设置', enablePopup: '启用弹窗', popupDelay: '延迟时间（秒）', popupTitle: '弹窗标题', popupDescription: '弹窗描述', socialLinks: '社交媒体链接', contactInfo: '联系方式', addSocial: '添加社交链接', platform: '平台', socialUrl: '链接地址', contactType: '类型', contactValue: '值', contactLabel: '标签', email: '邮箱', phone2: '电话', whatsapp2: 'WhatsApp', saveSettings: '保存设置' },
    seo: { title: 'JSON-LD 配置', addConfig: '添加配置', name: '名称', schemaType: 'Schema 类型', configValue: '配置内容', extraData: '额外数据 (JSON)' },
    robots: { title: 'Robots.txt 配置', addRule: '添加规则', userAgent: '用户代理', rule: '规则', allow: '允许', disallow: '禁止', preview: '预览 robots.txt', robotRules: '爬虫规则' },
    form: { required: '必填', optional: '选填', selectOption: '请选择', enterText: '请输入', enterUrl: '请输入链接', enterNumber: '请输入数字' }
  }
};

function t(key) {
  const keys = key.split('.');
  let value = translations[currentLang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

/** 轻量 Toast 提示，避免使用阻塞式 alert */
function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.textContent = message;
  const bg = type === 'success' ? '#16a34a' : '#dc2626';
  el.style.cssText = `position:fixed;top:24px;left:50%;transform:translateX(-50%);background:${bg};color:#fff;padding:12px 24px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;font-size:14px;opacity:0;transition:opacity .2s;`;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, 2200);
}

function applyTranslations() {
  currentLang = localStorage.getItem('adminLang') || 'en';
  $('#lang-select').val(currentLang);
  
  $('[data-i18n]').each(function() {
    const key = $(this).attr('data-i18n');
    const translated = t(key);
    if ($(this).is('input[placeholder]')) {
      $(this).attr('placeholder', translated);
    } else {
      $(this).text(translated);
    }
  });
}

$(document).ready(function() {
  applyTranslations();
  
  $('#lang-select').on('change', function() {
    currentLang = $(this).val();
    localStorage.setItem('adminLang', currentLang);
    location.reload();
  });
  
  const savedCreds = localStorage.getItem('adminCreds');
  if (savedCreds) {
    credentials = savedCreds;
    showAdminView();
  }
  
  $('#login-form').on('submit', async function(e) {
    e.preventDefault();
    const username = $(this).find('#username').val();
    const password = $(this).find('#password').val();

    const creds = btoa(`${username}:${password}`);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${creds}` }
      });

      if (res.ok) {
        credentials = creds;
        localStorage.setItem('adminCreds', creds);
        showAdminView();
      } else {
        $('#login-error').text(t('login.invalidCreds')).fadeIn();
      }
    } catch (err) {
      $('#login-error').text(t('login.loginFailed')).fadeIn();
    }
  });
  
  $('#logout-btn').on('click', function() {
    localStorage.removeItem('adminCreds');
    credentials = null;
    location.reload();
  });

  $('#clear-cache-btn').on('click', async function() {
    try {
      const res = await fetch('/api/admin/cache/clear', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${credentials}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(t('common.cacheCleared'), 'success');
      } else {
        showToast(data.error || t('common.cacheClearFailed'), 'error');
      }
    } catch (err) {
      showToast(t('common.cacheClearFailed'), 'error');
    }
  });
  
  $('.admin-nav .nav-item').on('click', function(e) {
    e.preventDefault();
    const page = $(this).attr('href').slice(1);
    switchPage(page);
  });
});

function showAdminView() {
  $('#login-view').hide();
  $('#admin-view').removeClass('hidden').addClass('flex');
  applyTranslations();
  loadDashboard();
}

function switchPage(page) {
  $('.nav-item').removeClass('active');
  $('.page').removeClass('active').addClass('hidden');
  
  $(`.nav-item[href="#${page}"]`).addClass('active');
  $(`#${page}-page`).removeClass('hidden').addClass('active');
  
  const titleKey = 'nav.' + page;
  $('#page-title').text(t(titleKey));
  currentPage = page;
  
  if (page === 'products') {
    loadProducts();
    $('#add-product-btn').off('click').on('click', showAddProductModal);
  }
  else if (page === 'categories') {
    loadCategories();
    $('#add-category-btn').off('click').on('click', showAddCategoryModal);
  }
  else if (page === 'solutions') {
    loadSolutions();
    $('#add-solution-btn').off('click').on('click', showAddSolutionModal);
  }
  else if (page === 'cases') {
    loadCases();
    $('#add-case-btn').off('click').on('click', showAddCaseModal);
  }
  else if (page === 'news') {
    loadNews();
    $('#add-news-btn').off('click').on('click', showAddNewsModal);
  }
  else if (page === 'pages') loadPages();
  else if (page === 'inquiries') loadInquiries();
  else if (page === 'leads') loadLeads();
  else if (page === 'settings') loadSettings();
}

async function loadDashboard() {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      $('#stat-products').text(data.data.totalProducts);
      $('#stat-inquiries').text(data.data.totalInquiries);
      $('#stat-pending').text(data.data.pendingInquiries);
      $('#stat-leads').text(data.data.totalLeads);
      $('#stat-cases').text(data.data.totalCases);
      $('#stat-news').text(data.data.totalNews);
    }
  } catch (err) {
    console.error('Failed to load dashboard');
  }
}

async function loadProducts() {
  const container = document.getElementById('product-table');
  if (!container) return;
  
  try {
    const res = await fetch(`/api/products?page=1&limit=50`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      renderProductsTable(data.data.items);
    }
  } catch (err) {
    console.error('Failed to load products');
  }
}

function renderProductsTable(products) {
  const container = document.getElementById('product-table');
  if (!container) return;
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Price</th>
          <th>MOQ</th>
          <th>Featured</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(p => `
          <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${p.price ? `$${p.price}` : '-'}</td>
            <td>${p.min_order_qty}</td>
            <td>${p.is_featured ? '✓' : '-'}</td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="editProduct(${p.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadCategories() {
  const container = document.getElementById('category-table');
  if (!container) return;
  
  try {
    const res = await fetch('/api/categories', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      renderCategoriesTable(data.data);
    }
  } catch (err) {
    console.error('Failed to load categories');
  }
}

function renderCategoriesTable(categories) {
  const container = document.getElementById('category-table');
  if (!container) return;
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Slug</th>
          <th>Sort</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${categories.map(c => `
          <tr>
            <td>${c.id}</td>
            <td>${c.name}</td>
            <td>${c.slug}</td>
            <td>${c.sort_order}</td>
            <td>
              <button class="btn btn-sm btn-warning">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadSolutions() {
  const container = document.getElementById('solution-table');
  if (!container) return;
  
  try {
    const res = await fetch('/api/solutions', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      renderSolutionsTable(data.data);
    }
  } catch (err) {
    console.error('Failed to load solutions');
  }
}

function renderSolutionsTable(solutions) {
  const container = document.getElementById('solution-table');
  if (!container) return;
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Featured</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${solutions.map(s => `
          <tr>
            <td>${s.id}</td>
            <td>${s.title}</td>
            <td>${s.is_featured ? '✓' : '-'}</td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="editSolution(${s.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteSolution(${s.id})">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadCases() {
  const container = document.getElementById('case-table');
  if (!container) return;
  
  try {
    const res = await fetch('/api/cases', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      renderCasesTable(data.data);
    }
  } catch (err) {
    console.error('Failed to load cases');
  }
}

function renderCasesTable(cases) {
  const container = document.getElementById('case-table');
  if (!container) return;
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Client</th>
          <th>Featured</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${cases.map(c => `
          <tr>
            <td>${c.id}</td>
            <td>${c.title}</td>
            <td>${c.client_name || '-'}</td>
            <td>${c.is_featured ? '✓' : '-'}</td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="editCase(${c.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteCase(${c.id})">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadNews() {
  const container = document.getElementById('news-table');
  if (!container) return;
  
  try {
    const res = await fetch('/api/news?limit=50', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      renderNewsTable(data.data.items);
    }
  } catch (err) {
    console.error('Failed to load news');
  }
}

function renderNewsTable(news) {
  const container = document.getElementById('news-table');
  if (!container) return;
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Author</th>
          <th>Views</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${news.map(n => `
          <tr>
            <td>${n.id}</td>
            <td>${n.title}</td>
            <td>${n.author || '-'}</td>
            <td>${n.view_count}</td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="editNews(${n.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteNews(${n.id})">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadPages() {
  const container = document.getElementById('pages-table');
  if (!container) return;
  
  try {
    const res = await fetch('/api/pages', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      renderPagesTable(data.data);
    }
  } catch (err) {
    console.error('Failed to load pages');
  }
}

function renderPagesTable(pages) {
  const container = document.getElementById('pages-table');
  if (!container) return;
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Slug</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${pages.map(p => `
          <tr>
            <td>${p.id}</td>
            <td>${p.title}</td>
            <td>${p.slug}</td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="editPage(${p.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deletePage(${p.id})">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadInquiries() {
  const container = document.getElementById('inquiry-table');
  if (!container) return;
  
  try {
    const res = await fetch('/api/inquiries?status=pending&limit=50', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      renderInquiriesTable(data.data.items);
    }
  } catch (err) {
    console.error('Failed to load inquiries');
  }
}

function renderInquiriesTable(inquiries) {
  const container = document.getElementById('inquiry-table');
  if (!container) return;
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Name</th>
          <th>Email</th>
          <th>Company</th>
          <th>Message</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${inquiries.map(i => `
          <tr>
            <td>${new Date(i.created_at).toLocaleDateString()}</td>
            <td>${i.name}</td>
            <td>${i.email}</td>
            <td>${i.company || '-'}</td>
            <td>${i.message.substring(0, 50)}...</td>
            <td>${i.status}</td>
            <td>
              <button class="btn btn-sm" onclick="viewInquiry(${i.id})">View</button>
              <button class="btn btn-sm" onclick="markInquiryReplied(${i.id})">Mark Replied</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadLeads() {
  const container = document.getElementById('leads-table');
  if (!container) return;
  
  try {
    const res = await fetch('/api/leads?limit=50', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      renderLeadsTable(data.data.items);
    }
  } catch (err) {
    console.error('Failed to load leads');
  }
}

function renderLeadsTable(leads) {
  const container = document.getElementById('leads-table');
  if (!container) return;
  
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Name</th>
          <th>Phone</th>
          <th>WhatsApp</th>
          <th>Email</th>
          <th>Source</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${leads.map(l => `
          <tr>
            <td>${new Date(l.created_at).toLocaleDateString()}</td>
            <td>${l.name}</td>
            <td>${l.phone || '-'}</td>
            <td>${l.whatsapp || '-'}</td>
            <td>${l.email || '-'}</td>
            <td>${l.source}</td>
            <td>${l.status}</td>
            <td>
              <button class="btn btn-sm" onclick="viewLead(${l.id})">View</button>
              <button class="btn btn-sm" onclick="markLeadContacted(${l.id})">Mark Contacted</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadSettings() {
  const page = document.querySelector(`[data-page="settings"]`);
  if (!page) return;
  
  loadSettingsForm();
  loadPopupSettings();
  loadSocialLinks();
  loadContactInfo();
  loadTranslationSettings();
}

async function loadGeneralSettings() {
  const container = document.getElementById('settings-form');
  if (!container) return;
  
  try {
    const res = await fetch('/api/settings', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      const fields = [
        { key: 'site_name', label: 'Site Name' },
        { key: 'site_title', label: 'Site Title (TDK)' },
        { key: 'site_description', label: 'Site Description (TDK)' },
        { key: 'site_keywords', label: 'Site Keywords (TDK)' },
        { key: 'contact_email', label: 'Contact Email' },
        { key: 'contact_phone', label: 'Contact Phone' },
        { key: 'whatsapp_number', label: 'WhatsApp Number' },
        { key: 'logo_url', label: 'Logo URL' },
        { key: 'favicon_url', label: 'Favicon URL' },
      ];
      
      container.innerHTML = `
        <form id="settings-form-content">
          ${fields.map(f => `
            <div class="form-group">
              <label for="${f.key}">${f.label}</label>
              <input type="text" id="${f.key}" name="${f.key}" value="${data.data[f.key] || ''}">
            </div>
          `).join('')}
          <button type="submit" class="btn">Save Settings</button>
        </form>
      `;
      
      document.getElementById('settings-form-content')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        for (const [key, value] of Object.entries(Object.fromEntries(formData))) {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Basic ${credentials}`
            },
            body: JSON.stringify({ key, value })
          });
        }
        alert('Settings saved successfully!');
      });
    }
  } catch (err) {
    console.error('Failed to load settings');
  }
}

async function loadPopupSettings() {
  const container = document.getElementById('popup-settings-form');
  if (!container) return;
  
  try {
    const res = await fetch('/api/settings/popup', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success && data.data) {
      const settings = data.data;
      container.innerHTML = `
        <form id="popup-settings-content">
          <div class="form-group">
            <label>
              <input type="checkbox" name="is_enabled" ${settings.is_enabled ? 'checked' : ''}> Enable Popup
            </label>
          </div>
          <div class="form-group">
            <label for="delay_seconds">Popup Delay (seconds)</label>
            <input type="number" id="delay_seconds" name="delay_seconds" value="${settings.delay_seconds || 15}">
          </div>
          <div class="form-group">
            <label for="popup_title">Popup Title</label>
            <input type="text" id="popup_title" name="title" value="${settings.title || ''}">
          </div>
          <div class="form-group">
            <label for="popup_description">Popup Description</label>
            <textarea id="popup_description" name="description" rows="3">${settings.description || ''}</textarea>
          </div>
          <button type="submit" class="btn">Save Popup Settings</button>
        </form>
      `;
      
      document.getElementById('popup-settings-content')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        await fetch('/api/settings/popup', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`
          },
          body: JSON.stringify({
            is_enabled: data.is_enabled ? 1 : 0,
            delay_seconds: parseInt(data.delay_seconds),
            title: data.title,
            description: data.description,
          })
        });
        alert('Popup settings saved successfully!');
      });
    }
  } catch (err) {
    console.error('Failed to load popup settings');
  }
}

async function loadSocialLinks() {
  const container = document.getElementById('social-links-form');
  if (!container) return;
  
  try {
    const res = await fetch('/api/settings/social');
    const data = await res.json();
    if (data.success) {
      container.innerHTML = `
        <div id="social-links-list">
          ${data.data.map(s => `
            <div class="form-group" style="display: flex; gap: 1rem; align-items: center;">
              <input type="text" value="${s.name}" style="flex: 1;">
              <input type="text" value="${s.url}" style="flex: 2;">
              <button class="btn btn-sm btn-danger" onclick="deleteSocialLink(${s.id})">Delete</button>
            </div>
          `).join('')}
        </div>
        <button class="btn" onclick="addSocialLink()">Add Social Link</button>
      `;
    }
  } catch (err) {
    console.error('Failed to load social links');
  }
}

window.addSocialLink = function() {
  const container = document.getElementById('social-links-list');
  if (container) {
    container.innerHTML += `
      <div class="form-group" style="display: flex; gap: 1rem; align-items: center;">
        <input type="text" placeholder="Platform Name" id="new-social-name" style="flex: 1;">
        <input type="text" placeholder="URL" id="new-social-url" style="flex: 2;">
        <button class="btn btn-sm" onclick="saveSocialLink()">Save</button>
      </div>
    `;
  }
};

window.saveSocialLink = async function() {
  const name = document.getElementById('new-social-name')?.value;
  const url = document.getElementById('new-social-url')?.value;
  
  if (name && url) {
    await fetch('/api/settings/social', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        platform: name.toLowerCase(),
        name,
        url,
      })
    });
    loadSocialLinks();
  }
};

window.deleteSocialLink = async function(id) {
  if (confirm('Are you sure you want to delete this social link?')) {
    await fetch(`/api/settings/social/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    loadSocialLinks();
  }
};

async function loadContactInfo() {
  const container = document.getElementById('contact-info-form');
  if (!container) return;
  
  try {
    const res = await fetch('/api/settings/contact');
    const data = await res.json();
    if (data.success) {
      container.innerHTML = `
        <div id="contact-info-list">
          ${data.data.map(c => `
            <div class="form-group" style="display: flex; gap: 1rem; align-items: center;">
              <select id="contact-type-${c.id}" style="width: 120px;">
                <option value="email" ${c.type === 'email' ? 'selected' : ''}>Email</option>
                <option value="phone" ${c.type === 'phone' ? 'selected' : ''}>Phone</option>
                <option value="whatsapp" ${c.type === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
              </select>
              <input type="text" value="${c.value}" id="contact-value-${c.id}" style="flex: 1;">
              <button class="btn btn-sm btn-warning" onclick="updateContactInfo(${c.id})">Update</button>
              <button class="btn btn-sm btn-danger" onclick="deleteContactInfo(${c.id})">Delete</button>
            </div>
          `).join('')}
        </div>
        <button class="btn" onclick="addContactInfo()">Add Contact Info</button>
      `;
    }
  } catch (err) {
    console.error('Failed to load contact info');
  }
}

window.addContactInfo = function() {
  const container = document.getElementById('contact-info-list');
  if (container) {
    container.innerHTML += `
      <div class="form-group" style="display: flex; gap: 1rem; align-items: center;">
        <select id="new-contact-type" style="width: 120px;">
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <input type="text" placeholder="Value" id="new-contact-value" style="flex: 1;">
        <button class="btn btn-sm" onclick="saveContactInfo()">Save</button>
      </div>
    `;
  }
};

window.saveContactInfo = async function() {
  const type = document.getElementById('new-contact-type')?.value;
  const value = document.getElementById('new-contact-value')?.value;
  
  if (type && value) {
    await fetch('/api/settings/contact', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({ type, value })
    });
    loadContactInfo();
  }
};

window.updateContactInfo = async function(id) {
  const type = document.getElementById(`contact-type-${id}`)?.value;
  const value = document.getElementById(`contact-value-${id}`)?.value;
  
  if (type && value) {
    await fetch('/api/settings/contact', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({ id, type, value })
    });
    alert('Contact info updated successfully!');
  }
};

window.deleteContactInfo = async function(id) {
  if (confirm('Are you sure you want to delete this contact info?')) {
    await fetch(`/api/settings/contact/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    loadContactInfo();
  }
};

// Product CRUD Modal Functions
window.showAddProductModal = function() {
  showProductModal();
};

window.editProduct = async function(id) {
  try {
    const res = await fetch(`/api/products/${id}`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      showProductModal(data.data);
    }
  } catch (err) {
    alert('Failed to load product');
  }
};

function showProductModal(product = null) {
  const modalHtml = `
    <div id="product-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">${product ? t('products.editProduct') : t('products.addProduct')}</h3>
        <form id="product-form">
          <input type="hidden" name="id" value="${product?.id || ''}">
          <div class="space-y-4">
            <div>
              <label class="block font-medium mb-1">${t('products.productName')}</label>
              <input type="text" name="name" value="${product?.name || ''}" required class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Slug</label>
              <input type="text" name="slug" value="${product?.slug || ''}" class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">${t('products.shortDescription')}</label>
              <textarea name="short_description" rows="2" class="w-full px-3 py-2 border rounded">${product?.short_description || ''}</textarea>
            </div>
            <div>
              <label class="block font-medium mb-1">${t('products.fullDescription')}</label>
              <textarea name="description" rows="4" class="w-full px-3 py-2 border rounded">${product?.description || ''}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-medium mb-1">${t('products.price')}</label>
                <input type="number" step="0.01" name="price" value="${product?.price || ''}" class="w-full px-3 py-2 border rounded">
              </div>
              <div>
                <label class="block font-medium mb-1">${t('products.moq')}</label>
                <input type="number" name="min_order_qty" value="${product?.min_order_qty || 1}" class="w-full px-3 py-2 border rounded">
              </div>
            </div>
            <div>
              <label class="block font-medium mb-1">${t('products.category')}</label>
              <select name="category_id" class="w-full px-3 py-2 border rounded">
                <option value="">${t('products.allCategories')}</option>
              </select>
            </div>
            <div>
              <label class="block font-medium mb-1">Images (URLs, comma separated)</label>
              <textarea name="images" rows="2" class="w-full px-3 py-2 border rounded">${product?.images ? product.images.join(',') : ''}</textarea>
            </div>
            <div>
              <label class="block font-medium mb-1">Specifications (JSON, e.g. {"Power":"22kW","Capacity":"1-2 t/h"})</label>
              <textarea name="specifications" rows="3" class="w-full px-3 py-2 border rounded font-mono text-sm">${product?.specifications ? (typeof product.specifications === 'string' ? product.specifications : JSON.stringify(product.specifications)) : ''}</textarea>
            </div>
            <div>
              <label class="flex items-center gap-2">
                <input type="checkbox" name="is_featured" ${product?.is_featured ? 'checked' : ''}>
                <span>${t('common.featured')}</span>
              </label>
            </div>
          </div>
          <div class="flex gap-4 mt-6">
            <button type="submit" class="btn btn-primary">${t('common.save')}</button>
            <button type="button" onclick="closeProductModal()" class="btn">${t('common.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('body').append(modalHtml);
  loadCategoriesForSelect();
  
  $('#product-form').off('submit').on('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const id = data.id;
    delete data.id;
    
    // Parse images
    if (data.images) {
      data.images = data.images.split(',').map(s => s.trim()).filter(s => s);
    }

    // Parse specifications JSON（用于产品详情页规格表）
    if (data.specifications && typeof data.specifications === 'string') {
      try {
        data.specifications = JSON.parse(data.specifications);
      } catch (err) {
        alert('Specifications 必须是合法 JSON');
        return;
      }
    }
    
    // Convert types
    data.min_order_qty = parseInt(data.min_order_qty) || 1;
    data.price = parseFloat(data.price) || null;
    data.is_featured = data.is_featured ? 1 : 0;
    data.category_id = data.category_id ? parseInt(data.category_id) : null;
    
    try {
      const response = await fetch(id ? `/api/admin/products/${id}` : '/api/admin/products', {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert(t('common.saveSuccess'));
        closeProductModal();
        loadProducts();
      } else {
        const result = await response.json();
        alert(result.error || 'Save failed');
      }
    } catch (err) {
      alert(t('common.error'));
    }
  });
}

window.closeProductModal = function() {
  $('#product-modal').remove();
};

async function loadCategoriesForSelect() {
  try {
    const res = await fetch('/api/categories', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      const options = data.data.items.map((c) => 
        `<option value="${c.id}">${c.name}</option>`
      ).join('');
      $('select[name="category_id"]').append(options);
    }
  } catch (err) {
    console.error('Failed to load categories');
  }
}

window.deleteProduct = async function(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  try {
    await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    loadProducts();
  } catch (err) {
    alert('Failed to delete product');
  }
};

window.deleteCategory = async function(id) {
  if (!confirm('Are you sure you want to delete this category?')) return;
  
  try {
    await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    loadCategories();
  } catch (err) {
    alert('Failed to delete category');
  }
};

// Category CRUD Modal Functions
window.showAddCategoryModal = function() {
  showCategoryModal();
};

function showCategoryModal(category = null) {
  const modalHtml = `
    <div id="category-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-xl w-full">
        <h3 class="text-xl font-bold mb-4">${category ? t('categories.editCategory') : t('categories.addCategory')}</h3>
        <form id="category-form">
          <input type="hidden" name="id" value="${category?.id || ''}">
          <div class="space-y-4">
            <div>
              <label class="block font-medium mb-1">${t('categories.categoryName')}</label>
              <input type="text" name="name" value="${category?.name || ''}" required class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Slug</label>
              <input type="text" name="slug" value="${category?.slug || ''}" class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Description</label>
              <textarea name="description" rows="3" class="w-full px-3 py-2 border rounded">${category?.description || ''}</textarea>
            </div>
            <div>
              <label class="block font-medium mb-1">${t('common.parent')}</label>
              <select name="parent_id" class="w-full px-3 py-2 border rounded">
                <option value="">${t('common.noParent')}</option>
              </select>
            </div>
            <div>
              <label class="block font-medium mb-1">${t('common.sortOrder')}</label>
              <input type="number" name="sort_order" value="${category?.sort_order || 0}" class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="flex items-center gap-2">
                <input type="checkbox" name="is_active" ${category?.is_active !== 0 ? 'checked' : ''}>
                <span>${t('common.active')}</span>
              </label>
            </div>
          </div>
          <div class="flex gap-4 mt-6">
            <button type="submit" class="btn btn-primary">${t('common.save')}</button>
            <button type="button" onclick="closeCategoryModal()" class="btn">${t('common.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('body').append(modalHtml);
  loadCategoriesForParentSelect();
  
  $('#category-form').off('submit').on('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const id = data.id;
    delete data.id;
    
    data.sort_order = parseInt(data.sort_order) || 0;
    data.is_active = data.is_active ? 1 : 0;
    data.parent_id = data.parent_id ? parseInt(data.parent_id) : null;
    
    try {
      const response = await fetch(id ? `/api/admin/categories/${id}` : '/api/admin/categories', {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert(t('common.saveSuccess'));
        closeCategoryModal();
        loadCategories();
      } else {
        const result = await response.json();
        alert(result.error || 'Save failed');
      }
    } catch (err) {
      alert(t('common.error'));
    }
  });
}

window.closeCategoryModal = function() {
  $('#category-modal').remove();
};

async function loadCategoriesForParentSelect() {
  try {
    const res = await fetch('/api/categories', {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      const options = data.data.items.map((c) => 
        `<option value="${c.id}">${c.name}</option>`
      ).join('');
      $('select[name="parent_id"]').append(options);
    }
  } catch (err) {
    console.error('Failed to load categories');
  }
}

window.deleteSolution = async function(id) {
  if (!confirm('Are you sure you want to delete this solution?')) return;
  
  try {
    await fetch(`/api/admin/solutions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    loadSolutions();
  } catch (err) {
    alert('Failed to delete solution');
  }
};

window.deleteCase = async function(id) {
  if (!confirm('Are you sure you want to delete this case?')) return;
  
  try {
    await fetch(`/api/admin/cases/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    loadCases();
  } catch (err) {
    alert('Failed to delete case');
  }
};

window.deleteNews = async function(id) {
  if (!confirm('Are you sure you want to delete this news?')) return;
  
  try {
    await fetch(`/api/admin/news/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    loadNews();
  } catch (err) {
    alert('Failed to delete news');
  }
};

window.deletePage = async function(id) {
  if (!confirm('Are you sure you want to delete this page?')) return;
  
  try {
    await fetch(`/api/admin/pages/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    loadPages();
  } catch (err) {
    alert('Failed to delete page');
  }
};

window.viewInquiry = async function(id) {
  try {
    const res = await fetch(`/api/inquiries/${id}`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      const i = data.data;
      alert(`Inquiry Details:\n\nName: ${i.name}\nEmail: ${i.email}\nCompany: ${i.company || 'N/A'}\n\nMessage:\n${i.message}\n\nStatus: ${i.status}`);
    }
  } catch (err) {
    alert('Failed to load inquiry details');
  }
};

window.markInquiryReplied = async function(id) {
  try {
    await fetch(`/api/inquiries/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({ status: 'replied' })
    });
    loadInquiries();
  } catch (err) {
    alert('Failed to update inquiry status');
  }
};

window.viewLead = async function(id) {
  try {
    const res = await fetch(`/api/leads/${id}`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      const l = data.data;
      alert(`Lead Details:\n\nName: ${l.name}\nPhone: ${l.phone || 'N/A'}\nWhatsApp: ${l.whatsapp || 'N/A'}\nEmail: ${l.email || 'N/A'}\n\nMessage:\n${l.message}\n\nSource: ${l.source}\nStatus: ${l.status}`);
    }
  } catch (err) {
    alert('Failed to load lead details');
  }
};

window.markLeadContacted = async function(id) {
  try {
    await fetch(`/api/leads/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({ status: 'contacted' })
    });
    loadLeads();
  } catch (err) {
    alert('Failed to update lead status');
  }
};

// Solution CRUD Modal Functions
window.showAddSolutionModal = function() {
  showSolutionModal();
};

window.editSolution = async function(id) {
  try {
    const res = await fetch(`/api/solutions/${id}`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      showSolutionModal(data.data);
    }
  } catch (err) {
    alert('Failed to load solution');
  }
};

function showSolutionModal(solution = null) {
  const modalHtml = `
    <div id="solution-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">${solution ? t('solutions.editSolution') : t('solutions.addSolution')}</h3>
        <form id="solution-form">
          <input type="hidden" name="id" value="${solution?.id || ''}">
          <div class="space-y-4">
            <div>
              <label class="block font-medium mb-1">Title</label>
              <input type="text" name="title" value="${solution?.title || ''}" required class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Slug</label>
              <input type="text" name="slug" value="${solution?.slug || ''}" class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Short Description</label>
              <textarea name="short_description" rows="2" class="w-full px-3 py-2 border rounded">${solution?.short_description || ''}</textarea>
            </div>
            <div>
              <label class="block font-medium mb-1">Content</label>
              <textarea name="content" rows="6" class="w-full px-3 py-2 border rounded">${solution?.content || ''}</textarea>
            </div>
            <div>
              <label class="block font-medium mb-1">Industries</label>
              <input type="text" name="industries" value="${solution?.industries || ''}" class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Images (URLs, comma separated)</label>
              <textarea name="images" rows="2" class="w-full px-3 py-2 border rounded">${solution?.images ? solution.images.join(',') : ''}</textarea>
            </div>
            <div>
              <label class="flex items-center gap-2">
                <input type="checkbox" name="is_featured" ${solution?.is_featured ? 'checked' : ''}>
                <span>Featured</span>
              </label>
            </div>
            <div>
              <label class="flex items-center gap-2">
                <input type="checkbox" name="is_active" ${solution?.is_active !== 0 ? 'checked' : ''}>
                <span>Active</span>
              </label>
            </div>
          </div>
          <div class="flex gap-4 mt-6">
            <button type="submit" class="btn btn-primary">${t('common.save')}</button>
            <button type="button" onclick="closeSolutionModal()" class="btn">${t('common.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('body').append(modalHtml);
  
  $('#solution-form').off('submit').on('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const id = data.id;
    delete data.id;
    
    if (data.images) {
      data.images = data.images.split(',').map(s => s.trim()).filter(s => s);
    }
    data.is_featured = data.is_featured ? 1 : 0;
    data.is_active = data.is_active ? 1 : 0;
    
    try {
      const response = await fetch(id ? `/api/admin/solutions/${id}` : '/api/admin/solutions', {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert(t('common.saveSuccess'));
        closeSolutionModal();
        loadSolutions();
      } else {
        const result = await response.json();
        alert(result.error || 'Save failed');
      }
    } catch (err) {
      alert(t('common.error'));
    }
  });
}

window.closeSolutionModal = function() {
  $('#solution-modal').remove();
};

// Case CRUD Modal Functions
window.showAddCaseModal = function() {
  showCaseModal();
};

window.editCase = async function(id) {
  try {
    const res = await fetch(`/api/cases/${id}`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      showCaseModal(data.data);
    }
  } catch (err) {
    alert('Failed to load case');
  }
};

function showCaseModal(caseItem = null) {
  const modalHtml = `
    <div id="case-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">${caseItem ? t('cases.editCase') : t('cases.addCase')}</h3>
        <form id="case-form">
          <input type="hidden" name="id" value="${caseItem?.id || ''}">
          <div class="space-y-4">
            <div>
              <label class="block font-medium mb-1">Title</label>
              <input type="text" name="title" value="${caseItem?.title || ''}" required class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Slug</label>
              <input type="text" name="slug" value="${caseItem?.slug || ''}" class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Client Name</label>
              <input type="text" name="client_name" value="${caseItem?.client_name || ''}" class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Industry</label>
              <input type="text" name="industry" value="${caseItem?.industry || ''}" class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Challenge</label>
              <textarea name="challenge" rows="3" class="w-full px-3 py-2 border rounded">${caseItem?.challenge || ''}</textarea>
            </div>
            <div>
              <label class="block font-medium mb-1">Solution</label>
              <textarea name="solution" rows="3" class="w-full px-3 py-2 border rounded">${caseItem?.solution || ''}</textarea>
            </div>
            <div>
              <label class="block font-medium mb-1">Results</label>
              <textarea name="results" rows="3" class="w-full px-3 py-2 border rounded">${caseItem?.results || ''}</textarea>
            </div>
            <div>
              <label class="block font-medium mb-1">Testimonial</label>
              <textarea name="testimonial" rows="3" class="w-full px-3 py-2 border rounded">${caseItem?.testimonial || ''}</textarea>
            </div>
            <div>
              <label class="block font-medium mb-1">Images (URLs, comma separated)</label>
              <textarea name="images" rows="2" class="w-full px-3 py-2 border rounded">${caseItem?.images ? caseItem.images.join(',') : ''}</textarea>
            </div>
            <div>
              <label class="flex items-center gap-2">
                <input type="checkbox" name="is_featured" ${caseItem?.is_featured ? 'checked' : ''}>
                <span>Featured</span>
              </label>
            </div>
            <div>
              <label class="flex items-center gap-2">
                <input type="checkbox" name="is_active" ${caseItem?.is_active !== 0 ? 'checked' : ''}>
                <span>Active</span>
              </label>
            </div>
          </div>
          <div class="flex gap-4 mt-6">
            <button type="submit" class="btn btn-primary">${t('common.save')}</button>
            <button type="button" onclick="closeCaseModal()" class="btn">${t('common.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('body').append(modalHtml);
  
  $('#case-form').off('submit').on('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const id = data.id;
    delete data.id;
    
    if (data.images) {
      data.images = data.images.split(',').map(s => s.trim()).filter(s => s);
    }
    data.is_featured = data.is_featured ? 1 : 0;
    data.is_active = data.is_active ? 1 : 0;
    
    try {
      const response = await fetch(id ? `/api/admin/cases/${id}` : '/api/admin/cases', {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert(t('common.saveSuccess'));
        closeCaseModal();
        loadCases();
      } else {
        const result = await response.json();
        alert(result.error || 'Save failed');
      }
    } catch (err) {
      alert(t('common.error'));
    }
  });
}

window.closeCaseModal = function() {
  $('#case-modal').remove();
};

// News CRUD Modal Functions
window.showAddNewsModal = function() {
  showNewsModal();
};

window.editNews = async function(id) {
  try {
    const res = await fetch(`/api/news/${id}`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      showNewsModal(data.data);
    }
  } catch (err) {
    alert('Failed to load news');
  }
};

function showNewsModal(newsItem = null) {
  const modalHtml = `
    <div id="news-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">${newsItem ? t('news.editNews') : t('news.addNews')}</h3>
        <form id="news-form">
          <input type="hidden" name="id" value="${newsItem?.id || ''}">
          <div class="space-y-4">
            <div>
              <label class="block font-medium mb-1">Title</label>
              <input type="text" name="title" value="${newsItem?.title || ''}" required class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Slug</label>
              <input type="text" name="slug" value="${newsItem?.slug || ''}" class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Short Description</label>
              <textarea name="short_description" rows="2" class="w-full px-3 py-2 border rounded">${newsItem?.short_description || ''}</textarea>
            </div>
            <div>
              <label class="block font-medium mb-1">Content</label>
              <textarea name="content" rows="6" class="w-full px-3 py-2 border rounded">${newsItem?.content || ''}</textarea>
            </div>
            <div>
              <label class="block font-medium mb-1">Author</label>
              <input type="text" name="author" value="${newsItem?.author || ''}" class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Images (URLs, comma separated)</label>
              <textarea name="images" rows="2" class="w-full px-3 py-2 border rounded">${newsItem?.images ? newsItem.images.join(',') : ''}</textarea>
            </div>
            <div>
              <label class="flex items-center gap-2">
                <input type="checkbox" name="is_featured" ${newsItem?.is_featured ? 'checked' : ''}>
                <span>Featured</span>
              </label>
            </div>
            <div>
              <label class="flex items-center gap-2">
                <input type="checkbox" name="is_active" ${newsItem?.is_active !== 0 ? 'checked' : ''}>
                <span>Active</span>
              </label>
            </div>
          </div>
          <div class="flex gap-4 mt-6">
            <button type="submit" class="btn btn-primary">${t('common.save')}</button>
            <button type="button" onclick="closeNewsModal()" class="btn">${t('common.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('body').append(modalHtml);
  
  $('#news-form').off('submit').on('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const id = data.id;
    delete data.id;
    
    if (data.images) {
      data.images = data.images.split(',').map(s => s.trim()).filter(s => s);
    }
    data.is_featured = data.is_featured ? 1 : 0;
    data.is_active = data.is_active ? 1 : 0;
    
    try {
      const response = await fetch(id ? `/api/admin/news/${id}` : '/api/admin/news', {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert(t('common.saveSuccess'));
        closeNewsModal();
        loadNews();
      } else {
        const result = await response.json();
        alert(result.error || 'Save failed');
      }
    } catch (err) {
      alert(t('common.error'));
    }
  });
}

window.closeNewsModal = function() {
  $('#news-modal').remove();
};

// Page CRUD Modal Functions
window.editPage = async function(id) {
  try {
    const res = await fetch(`/api/pages/${id}`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    if (data.success) {
      showPageModal(data.data);
    }
  } catch (err) {
    alert('Failed to load page');
  }
};

function showPageModal(page = null) {
  const modalHtml = `
    <div id="page-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">${page ? t('pages.editPage') : 'Add Page'}</h3>
        <form id="page-form">
          <input type="hidden" name="id" value="${page?.id || ''}">
          <div class="space-y-4">
            <div>
              <label class="block font-medium mb-1">Title</label>
              <input type="text" name="title" value="${page?.title || ''}" required class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Slug</label>
              <input type="text" name="slug" value="${page?.slug || ''}" required class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Meta Title</label>
              <input type="text" name="meta_title" value="${page?.meta_title || ''}" class="w-full px-3 py-2 border rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Meta Description</label>
              <textarea name="meta_description" rows="2" class="w-full px-3 py-2 border rounded">${page?.meta_description || ''}</textarea>
            </div>
            <div>
              <label class="block font-medium mb-1">Content</label>
              <textarea name="content" rows="8" class="w-full px-3 py-2 border rounded">${page?.content || ''}</textarea>
            </div>
            <div>
              <label class="flex items-center gap-2">
                <input type="checkbox" name="is_active" ${page?.is_active !== 0 ? 'checked' : ''}>
                <span>Active</span>
              </label>
            </div>
          </div>
          <div class="flex gap-4 mt-6">
            <button type="submit" class="btn btn-primary">${t('common.save')}</button>
            <button type="button" onclick="closePageModal()" class="btn">${t('common.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  $('body').append(modalHtml);
  
  $('#page-form').off('submit').on('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const id = data.id;
    delete data.id;
    
    data.is_active = data.is_active ? 1 : 0;
    
    try {
      const response = await fetch(id ? `/api/admin/pages/${id}` : '/api/admin/pages', {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        alert(t('common.saveSuccess'));
        closePageModal();
        loadPages();
      } else {
        const result = await response.json();
        alert(result.error || 'Save failed');
      }
    } catch (err) {
      alert(t('common.error'));
    }
  });
}

window.closePageModal = function() {
  $('#page-modal').remove();
};

// Translation Settings
window.loadTranslationSettings = async function() {
  const container = document.getElementById('translation-settings-form');
  if (!container) return;
  
  try {
    const res = await fetch('/api/translations/config');
    const data = await res.json();
    if (data.success) {
      const config = data.data || {};
      const enabledLanguages = config.enabled_languages || [];
      const allLanguages = [
        { code: 'en', name: 'English' },
        { code: 'zh', name: '中文' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'ja', name: '日本語' },
        { code: 'ko', name: '한국어' },
        { code: 'ru', name: 'Русский' },
        { code: 'ar', name: 'العربية' },
        { code: 'pt', name: 'Português' },
      ];
      
      container.innerHTML = `
        <div class="form-group">
          <label>Enable Multi-language</label>
          <select id="translation-enabled" class="form-control">
            <option value="0" ${!config.is_enabled ? 'selected' : ''}>Disabled</option>
            <option value="1" ${config.is_enabled ? 'selected' : ''}>Enabled</option>
          </select>
        </div>
        <div class="form-group">
          <label>Translation API URL</label>
          <input type="text" id="translation-api-url" class="form-control" value="${config.api_url || ''}" placeholder="https://api.translation.com/translate">
        </div>
        <div class="form-group">
          <label>API Token</label>
          <input type="password" id="translation-api-token" class="form-control" value="${config.api_token || ''}" placeholder="Your API token">
        </div>
        <div class="form-group">
          <label>Enabled Languages</label>
          <div class="language-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem;">
            ${allLanguages.map(lang => `
              <label style="display: flex; align-items: center; gap: 0.5rem;">
                <input type="checkbox" value="${lang.code}" ${enabledLanguages.includes(lang.code) ? 'checked' : ''}>
                <span>${lang.name} (${lang.code})</span>
              </label>
            `).join('')}
          </div>
        </div>
        <button type="button" class="btn btn-primary" onclick="saveTranslationSettings()">Save Translation Settings</button>
      `;
    }
  } catch (err) {
    console.error('Failed to load translation settings');
  }
};

window.saveTranslationSettings = async function() {
  const enabled = document.getElementById('translation-enabled')?.value === '1';
  const apiUrl = document.getElementById('translation-api-url')?.value || '';
  const apiToken = document.getElementById('translation-api-token')?.value || '';
  
  const enabledLanguages = [];
  document.querySelectorAll('.language-grid input[type="checkbox"]:checked').forEach(cb => {
    enabledLanguages.push(cb.value);
  });
  
  try {
    const res = await fetch('/api/translations/config', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        is_enabled: enabled,
        api_url: apiUrl,
        api_token: apiToken,
        enabled_languages: enabledLanguages,
      })
    });
    
    const data = await res.json();
    if (data.success) {
      alert('Translation settings saved successfully!');
    } else {
      alert('Failed to save translation settings: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Failed to save translation settings');
  }
};
