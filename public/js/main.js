$(document).ready(async function() {
  // Initialize language switcher
  try {
    const res = await fetch('/api/translations/config');
    const data = await res.json();
    if (data.success && data.data && data.data.is_enabled) {
      const config = data.data;
      const languages = config.enabled_languages || [];
      
      if (languages.length > 1) {
        const langNames = {
          'en': 'English', 'zh': '中文', 'es': 'Español', 'fr': 'Français',
          'de': 'Deutsch', 'ja': '日本語', 'ko': '한국어', 'ru': 'Русский',
          'ar': 'العربية', 'pt': 'Português'
        };
        
        const langList = $('#language-list');
        languages.forEach(code => {
          langList.append(`
            <li>
              <button onclick="switchLanguage('${code}')" class="w-full text-left px-4 py-2 hover:bg-gray-100">
                ${langNames[code] || code}
              </button>
            </li>
          `);
        });
        
        $('#language-switcher-container').show();
        window.currentLanguage = languages[0] || 'en';
        $('#current-language').text(window.currentLanguage.toUpperCase());
        
        $('#language-switcher-btn').on('click', function(e) {
          e.stopPropagation();
          $('#language-dropdown').toggleClass('hidden');
        });
        
        $(document).on('click', function() {
          $('#language-dropdown').addClass('hidden');
        });
      }
    }
  } catch (err) {
    console.error('Failed to load translation config');
  }
  
  loadProducts();
  loadSolutions();
  loadCases();
  
  $('#inquiry-form').on('submit', handleInquirySubmit);
  $('#popup-form').on('submit', handlePopupSubmit);
  
  $('#back-to-top').on('click', function(e) {
    e.preventDefault();
    $('html, body').animate({ scrollTop: 0 }, 'smooth');
  });
  
  $('#mobile-menu-btn').on('click', function() {
    $('#nav-menu').toggleClass('active');
  });
  
  if (window.popupSettings && window.popupSettings.is_enabled) {
    const delay = (window.popupSettings.delay_seconds || 15) * 1000;
    setTimeout(showPopup, delay);
  }
  
  if ($('#slider').length > 0) {
    initSlider();
  }
});

window.switchLanguage = async function(targetLang) {
  const currentLang = window.currentLanguage || 'en';
  
  try {
    // 先测试翻译 API 是否可用
    const res = await fetch('/api/translations/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'test',
        source_locale: currentLang === 'en' ? 'auto' : currentLang,
        target_locale: targetLang
      })
    });
    
    const data = await res.json();
    if (!data.success) {
      alert(data.error || '翻译 API 接口错误，请联系管理员配置正确的参数');
      return;
    }
    
    window.currentLanguage = targetLang;
    $('#current-language').text(targetLang.toUpperCase());
    $('#language-dropdown').addClass('hidden');
    
    // 加载目标语言的翻译
    await loadTranslations(targetLang);
    
    alert('语言已切换为 ' + (targetLang === 'zh' ? '中文' : targetLang.toUpperCase()));
  } catch (err) {
    alert('翻译 API 接口错误，请联系管理员配置正确的参数');
    console.error('Switch language error:', err);
  }
};

// 加载翻译文本
async function loadTranslations(locale) {
  try {
    const res = await fetch(`/api/translations/${locale}`);
    const data = await res.json();
    if (data.success && data.data) {
      const translations = data.data;
      const translationsMap = {};
      
      translations.forEach((t) => {
        translationsMap[t.key] = t.value;
      });
      
      // 更新所有带 data-i18n 属性的元素
      $('[data-i18n]').each(function() {
        const key = $(this).attr('data-i18n');
        if (translationsMap[key]) {
          $(this).text(translationsMap[key]);
        }
      });
      
      // 更新 placeholder
      $('[data-i18n-placeholder]').each(function() {
        const key = $(this).attr('data-i18n-placeholder');
        if (translationsMap[key]) {
          $(this).attr('placeholder', translationsMap[key]);
        }
      });
    }
  } catch (err) {
    console.error('Load translations error:', err);
  }
}

let popupShown = false;
let currentSlide = 0;
let slideInterval;
const slides = $('.slide');

function showPopup() {
  if (popupShown) return;
  $('#inquiry-popup').fadeIn(300);
  if (window.popupSettings) {
    if (window.popupSettings.title) $('#popup-title').text(window.popupSettings.title);
    if (window.popupSettings.description) $('#popup-description').text(window.popupSettings.description);
  }
  popupShown = true;
}

function closePopup() {
  $('#inquiry-popup').fadeOut(300);
}

window.showPopup = showPopup;
window.closePopup = closePopup;

function initSlider() {
  if (slides.length <= 1) return;
  
  currentSlide = 0;
  slideInterval = setInterval(slideNext, 5000);
  
  $('.slider-btn, .slider-dot').on('click', function() {
    clearInterval(slideInterval);
    slideInterval = setInterval(slideNext, 5000);
  });
}

window.slidePrev = function() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  updateSlides();
};

window.slideNext = function() {
  currentSlide = (currentSlide + 1) % slides.length;
  updateSlides();
};

window.goToSlide = function(index) {
  currentSlide = index;
  updateSlides();
};

function updateSlides() {
  slides.removeClass('active').eq(currentSlide).addClass('active');
  $('.slider-dot').removeClass('active bg-blue-500').eq(currentSlide).addClass('active bg-blue-500');
}

async function loadProducts() {
  const container = $('#product-list');
  if (!container.length) return;

  try {
    const res = await fetch('/api/products?featured=true&limit=6');
    const data = await res.json();
    
    if (data.success && data.data.items && data.data.items.length > 0) {
      container.html(data.data.items.map(product => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
          <img src="${product.images?.[0] || '/images/placeholder.png'}" alt="${product.name}" class="w-full h-48 object-cover" onerror="this.src='/images/placeholder.png'">
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-2">${product.name}</h3>
            ${product.short_description ? `<p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.short_description}</p>` : ''}
            ${product.price ? `<p class="text-blue-600 font-bold text-xl mb-2">$${product.price}</p>` : ''}
            <p class="text-gray-500 text-sm mb-4">MOQ: ${product.min_order_qty} pcs</p>
            <a href="/products" class="inline-block border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition">View Details</a>
          </div>
        </div>
      `).join(''));
    } else {
      container.html('<p class="text-center text-gray-500 col-span-3">No products available.</p>');
    }
  } catch (err) {
    console.error('Failed to load products:', err);
    container.html('<p class="text-center text-red-500 col-span-3">Failed to load products.</p>');
  }
}

async function loadSolutions() {
  const container = $('#solution-list');
  if (!container.length) return;

  try {
    const res = await fetch('/api/solutions?featured=true');
    const data = await res.json();
    
    if (data.success && data.data && data.data.length > 0) {
      container.html(data.data.map(item => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
          <img src="${item.images?.[0] || '/images/placeholder.png'}" alt="${item.title}" class="w-full h-48 object-cover" onerror="this.src='/images/placeholder.png'">
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-2">${item.title}</h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">${item.short_description || ''}</p>
            <a href="/solutions" class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Learn More</a>
          </div>
        </div>
      `).join(''));
    }
  } catch (err) {
    console.error('Failed to load solutions:', err);
  }
}

async function loadCases() {
  const container = $('#case-list');
  if (!container.length) return;

  try {
    const res = await fetch('/api/cases?featured=true');
    const data = await res.json();
    
    if (data.success && data.data && data.data.length > 0) {
      container.html(data.data.map(item => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
          <img src="${item.images?.[0] || '/images/placeholder.png'}" alt="${item.title}" class="w-full h-48 object-cover" onerror="this.src='/images/placeholder.png'">
          <div class="p-6">
            <h3 class="text-lg font-semibold mb-2">${item.title}</h3>
            <p class="text-gray-600 text-sm mb-4">${item.client_name ? 'Client: ' + item.client_name : ''}</p>
            <a href="/cases" class="inline-block border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition">Read More</a>
          </div>
        </div>
      `).join(''));
    }
  } catch (err) {
    console.error('Failed to load cases:', err);
  }
}

async function handleInquirySubmit(e) {
  e.preventDefault();
  const form = $(e.target);
  const formData = new FormData(form[0]);
  const data = Object.fromEntries(formData);

  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      showSuccess(form, 'Inquiry submitted successfully! We will contact you soon.');
      form[0].reset();
    } else {
      showError(form, result.error || 'Failed to submit inquiry');
    }
  } catch (err) {
    console.error('Inquiry submit error:', err);
    showError(form, 'Failed to submit inquiry. Please try again.');
  }
}

async function handlePopupSubmit(e) {
  e.preventDefault();
  const form = $(e.target);
  const formData = new FormData(form[0]);
  const data = Object.fromEntries(formData);

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      alert('Thank you! We will contact you within 24 hours.');
      closePopup();
      form[0].reset();
    } else {
      alert(result.error || 'Failed to submit. Please try again.');
    }
  } catch (err) {
    console.error('Lead submit error:', err);
    alert('Failed to submit. Please try again.');
  }
}

function showError(form, message) {
  let errorEl = form.find('.error-message');
  if (!errorEl.length) {
    errorEl = $('<div class="error-message"></div>');
    form.prepend(errorEl);
  }
  
  errorEl.text(message).fadeIn();
  setTimeout(() => errorEl.fadeOut(), 5000);
}

function showSuccess(form, message) {
  let successEl = form.find('.success-message');
  if (!successEl.length) {
    successEl = $('<div class="success-message"></div>');
    form.prepend(successEl);
  }
  
  successEl.text(message).fadeIn();
  setTimeout(() => successEl.fadeOut(), 5000);
}