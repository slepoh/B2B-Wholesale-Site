/**
 * AI 智能客服前台 widget
 * - 读取服务端注入的 window.aiChatConfig（避免首屏额外请求）
 * - is_enabled 时才渲染右下角气泡与对话面板
 * - 依赖：无（原生 JS，不依赖 jQuery）
 */
(function () {
  'use strict';

  var API_BASE = '/api/ai-chat';

  // 优先用服务端注入的配置；没有则请求接口（保持 getPageLayout 同步渲染）
  var cfg = window.aiChatConfig || null;

  if (cfg) {
    init(cfg);
  } else {
    fetch(API_BASE + '/config')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.success && data.data && data.data.is_enabled) {
          init(data.data);
        }
      })
      .catch(function () { /* 静默失败：客服不可用不应影响页面 */ });
  }

  function init(cfg) {
    if (!cfg || !cfg.is_enabled) return;

    var themeColor = cfg.theme_color || '#2563eb';
    var position = cfg.position === 'left' ? 'left' : 'right';
    var sessionKey = 'aiChatSessionId';

    // 会话 ID（存 localStorage，刷新后延续上下文）
    var sessionId = localStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(sessionKey, sessionId);
    }

    var sending = false;
    var panelOpen = false;

    var panelPosClass = position === 'left' ? 'left-5' : 'right-5';

    // ---------- 构建 DOM ----------
    var root = document.createElement('div');
    root.id = 'ai-chat-widget';
    root.innerHTML =
      // 气泡按钮
      '<button id="ai-chat-bubble" class="ai-chat-bubble" aria-label="Open chat" ' +
      'style="position:fixed;bottom:24px;' + (position === 'left' ? 'left:24px;' : 'right:24px;') +
      'width:56px;height:56px;border-radius:9999px;background:' + themeColor + ';color:#fff;' +
      'display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.18);' +
      'cursor:pointer;border:none;z-index:60;transition:transform .2s;">' +
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
      '</button>' +
      // 对话面板
      '<div id="ai-chat-panel" style="display:none;position:fixed;bottom:92px;' + panelPosClass + ':24px;' +
      'width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 140px);' +
      'background:#fff;border-radius:16px;box-shadow:0 20px 48px rgba(0,0,0,.22);z-index:60;' +
      'flex-direction:column;overflow:hidden;">' +
      '  <div style="background:' + themeColor + ';color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;">' +
      '    <div style="font-weight:600;">' + escapeHtml(cfg.title || 'AI Assistant') + '</div>' +
      '    <button id="ai-chat-close" style="background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;">&times;</button>' +
      '  </div>' +
      '  <div id="ai-chat-messages" style="flex:1;overflow-y:auto;padding:16px;background:#f9fafb;"></div>' +
      '  <form id="ai-chat-form" style="display:flex;gap:8px;padding:12px;border-top:1px solid #e5e7eb;background:#fff;">' +
      '    <input id="ai-chat-input" type="text" autocomplete="off" placeholder="Type your message..." ' +
      '      style="flex:1;padding:10px 12px;border:1px solid #d1d5db;border-radius:10px;outline:none;font-size:14px;">' +
      '    <button type="submit" id="ai-chat-send" style="padding:0 16px;border-radius:10px;border:none;background:' + themeColor + ';color:#fff;font-weight:600;cursor:pointer;">' +
      '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>' +
      '    </button>' +
      '  </form>' +
      '</div>';
    document.body.appendChild(root);

    var bubble = document.getElementById('ai-chat-bubble');
    var panel = document.getElementById('ai-chat-panel');
    var closeBtn = document.getElementById('ai-chat-close');
    var messagesEl = document.getElementById('ai-chat-messages');
    var form = document.getElementById('ai-chat-form');
    var input = document.getElementById('ai-chat-input');
    var sendBtn = document.getElementById('ai-chat-send');

    // 欢迎语
    var welcome = cfg.welcome_message || 'Hi! How can I help you today?';
    appendMessage('assistant', welcome);

    // ---------- 交互 ----------
    bubble.addEventListener('click', function () {
      panelOpen = !panelOpen;
      panel.style.display = panelOpen ? 'flex' : 'none';
      if (panelOpen) {
        setTimeout(function () { input.focus(); }, 50);
        scrollToBottom();
      }
    });

    closeBtn.addEventListener('click', function () {
      panelOpen = false;
      panel.style.display = 'none';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = (input.value || '').trim();
      if (!text || sending) return;
      input.value = '';
      appendMessage('user', text);
      sendMessage(text);
    });

    // ---------- 发送 ----------
    function sendMessage(text) {
      sending = true;
      sendBtn.disabled = true;
      var typingEl = appendTyping();

      fetch(API_BASE + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          typingEl.remove();
          if (data && data.success && data.data && data.data.reply) {
            appendMessage('assistant', data.data.reply);
          } else {
            var msg = (data && data.error) ? data.error : 'Sorry, something went wrong.';
            appendMessage('assistant', msg);
          }
        })
        .catch(function () {
          typingEl.remove();
          appendMessage('assistant', 'Sorry, I am having trouble connecting. Please try again later.');
        })
        .finally(function () {
          sending = false;
          sendBtn.disabled = false;
          input.focus();
        });
    }

    // ---------- 渲染 ----------
    function appendMessage(role, content) {
      var bubbleEl = document.createElement('div');
      var isUser = role === 'user';
      bubbleEl.style.cssText =
        'display:flex;margin-bottom:10px;' + (isUser ? 'justify-content:flex-end;' : 'justify-content:flex-start;');
      var inner = document.createElement('div');
      inner.style.cssText =
        'max-width:80%;padding:10px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word;' +
        (isUser
          ? 'background:' + themeColor + ';color:#fff;border-bottom-right-radius:4px;'
          : 'background:#fff;color:#111827;border:1px solid #e5e7eb;border-bottom-left-radius:4px;');
      inner.textContent = content;
      bubbleEl.appendChild(inner);
      messagesEl.appendChild(bubbleEl);
      scrollToBottom();
      return bubbleEl;
    }

    function appendTyping() {
      var el = document.createElement('div');
      el.style.cssText = 'display:flex;justify-content:flex-start;margin-bottom:10px;';
      el.innerHTML =
        '<div style="padding:10px 14px;border-radius:14px;background:#fff;border:1px solid #e5e7eb;color:#9ca3af;font-size:14px;">typing…</div>';
      messagesEl.appendChild(el);
      scrollToBottom();
      return el;
    }

    function scrollToBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
