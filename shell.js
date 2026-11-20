/* 平台壳公共脚本：主题（深/浅）、左侧图标栏、滚动渐显。只用于 index.html / plan.html。 */
(function () {
  'use strict';
  var KEY = 'ops_theme';
  try { var saved = localStorage.getItem(KEY); if (saved === 'light' || saved === 'dark') document.documentElement.setAttribute('data-theme', saved); } catch (e) {}
  var I = {
    brand: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 28 10v12l-12 7-12-7V10z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M13 11.5v9l7.5-4.5z" fill="currentColor"/></svg>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    missions: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',
    wallet: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13.5h18M12 9C10 5 6 5 6 7.2S9 9 12 9s6 .4 6-1.8S14 5 12 9"/>',
    rules: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>',
    plan: '<path d="m3 17 6-6 4 3 8-10M3 21h18"/>',
    home: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    theme: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; }
  function item(it) {
    var tag = it.href ? 'a' : 'button', attrs = it.href ? ' href="' + it.href + '"' : ' type="button"';
    return '<' + tag + ' class="k-rail-btn' + (it.active ? ' active' : '') + '"' + attrs + (it.id ? ' id="' + it.id + '"' : '') + ' data-tip="' + it.label + '" aria-label="' + it.label + '"' + (it.active ? ' aria-current="page"' : '') + '>' + svg(it.icon) + (it.badge ? '<i id="' + it.badge + '"></i>' : '') + '</' + tag + '>';
  }
  function mountRail(el, opts) {
    el.innerHTML = '<a class="k-brand" href="' + (opts.home || 'index.html') + '" aria-label="运营游戏工坊首页">' + I.brand + '</a>' +
      opts.items.map(item).join('') +
      '<div class="k-rail-bottom"><span class="k-rail-ver">V2</span>' + item({ id: 'themeBtn', icon: 'theme', label: '切换深色/浅色' }) + (opts.bottom || []).map(item).join('') + '</div>';
    el.querySelector('#themeBtn').onclick = toggleTheme;
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', cur);
    try { localStorage.setItem(KEY, cur); } catch (e) {}
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', cur === 'light' ? '#f5f4f6' : '#121216');
    document.dispatchEvent(new CustomEvent('k-theme', { detail: cur }));
  }
  function setActive(rail, id) { rail.querySelectorAll('.k-rail-btn').forEach(function (b) { var on = b.id === id; b.classList.toggle('active', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }); }
  /* 滚动渐显：进入视口（底部留 6%）时 .35s 上移 9px 淡入；同组按 --i 每个延迟 30ms */
  function reveal(root) {
    var els = (root || document).querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (ents) { ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  window.KShell = { mountRail: mountRail, toggleTheme: toggleTheme, setActive: setActive, reveal: reveal, icon: svg };
})();
