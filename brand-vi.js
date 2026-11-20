/* =============================================================================
 * 品牌 VI（游戏用）—— 示例 VI，换品牌改这里
 * -----------------------------------------------------------------------------
 * 平台壳（index / plan）用 theme.css 的平台规范；三个游戏（chip-3d / store-coupon /
 * poster-quiz）只读这里的品牌 VI：颜色、字体、Logo 位、圆角、HUD 风格。
 * 换品牌 = 只改本文件的 BRAND 对象；单个游戏要不同，就在 games['游戏名'] 里覆盖。
 * 当前默认：芯片新品的「戏仿 VI」（青蓝主色 #00c7fd 系），不含任何真实商标或 Logo。
 * ========================================================================== */
(function () {
  'use strict';
  var BRAND = {
    note: '示例 VI，换品牌改这里',
    name: '芯域科技（示例品牌）',
    /* Logo 位：src 填图片地址（svg/png，透明底）即可替换；留空则用 svg / text */
    logo: {
      src: '',
      svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="currentColor"/><path d="M9 2.5v3M12 2.5v3M15 2.5v3M9 18.5v3M12 18.5v3M15 18.5v3M2.5 9h3M2.5 12h3M2.5 15h3M18.5 9h3M18.5 12h3M18.5 15h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
      text: '示例品牌',
      alt: '示例品牌 Logo（占位）'
    },
    colors: {
      primary: '#00c7fd',      // 主色：按钮、高亮、主角发光
      primaryLight: '#7af3ff', // 主色浅：标题强调、数值
      secondary: '#7c8cff',    // 辅色：渐变第二段、次要强调
      deep: '#0068b5',         // 品牌深色：Logo 底、深色块
      accent: '#ff4fd8',       // 点缀色：渐变尾、特效
      accentLight: '#ff9be9',
      gold: '#ffd166',         // 奖励 / 积分
      success: '#3dff9a', warning: '#ffcf6e', danger: '#ff4f7b',
      bg: '#050816', bgDeep: '#030714', bgDeeper: '#02050d', surface: '#101630', surface2: '#0a1430',
      text: '#e8f0ff', muted: '#8c9cc4', onPrimary: '#041022', line: 'rgba(120,170,255,.18)'
    },
    fonts: {
      body: 'system-ui,-apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif',
      display: 'system-ui,-apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif',
      displayWeight: 900,
      mono: 'ui-monospace,Menlo,Consolas,monospace'
    },
    radius: { scale: 1, sm: 8, md: 13, lg: 18, xl: 22 },   // scale 乘到游戏内所有圆角上（0.4≈直角品牌，1=默认）
    hud: { style: 'glass', glow: true },                    // style: glass（半透明+模糊）| solid（实底）；glow: 霓虹光晕开/关
    games: {
      'chip-3d': {},        // 例：{ colors: { primary: '#ff6a00' }, hud: { glow: false } }
      'store-coupon': {},
      'poster-quiz': {}
    }
  };

  function merge(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in (b || {})) o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && typeof a[k] === 'object') ? merge(a[k], b[k]) : b[k]; return o; }
  function hexRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/(.)/g, '$1$1'); var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  var me = document.currentScript, game = (me && me.getAttribute('data-game')) || '';
  var V = merge(BRAND, (BRAND.games || {})[game]);
  var kebab = function (s) { return s.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); }); };
  var root = document.documentElement, k;
  for (k in V.colors) root.style.setProperty('--vi-' + kebab(k), V.colors[k]);
  /* 平台组件（ops-ui 弹层）读取的通用变量 */
  root.style.setProperty('--vi-surface-2', V.colors.surface2);
  root.style.setProperty('--vi-font', V.fonts.body);
  root.style.setProperty('--vi-font-display', V.fonts.display);
  root.style.setProperty('--vi-mono', V.fonts.mono);
  root.style.setProperty('--vi-radius-scale', String(V.radius.scale));
  root.style.setProperty('--vi-radius', Math.round(V.radius.md * V.radius.scale) + 'px');
  root.style.setProperty('--vi-radius-lg', Math.round(V.radius.lg * V.radius.scale) + 'px');
  root.style.setProperty('--vi-radius-xl', Math.round(V.radius.xl * V.radius.scale) + 'px');
  root.setAttribute('data-hud', V.hud.style);
  root.setAttribute('data-glow', V.hud.glow ? 'on' : 'off');
  root.setAttribute('data-vi-game', game);
  var css = 'body{font-family:var(--vi-font)}h1,.title,[data-vi-display]{font-family:var(--vi-font-display)}' +
    '[data-hud=solid] *{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
    '[data-glow=off] *{text-shadow:none!important}' +
    '.vi-logo{display:inline-flex;align-items:center;gap:6px;color:var(--vi-primary-light);font-size:11px;letter-spacing:1px;font-weight:700;vertical-align:middle}' +
    'div.vi-logo{display:flex;width:fit-content;margin:0 auto 8px}.vi-logo svg,.vi-logo img{width:18px;height:18px;flex:none}.vi-logo img{object-fit:contain}';
  var st = document.createElement('style'); st.id = 'vi-css'; st.textContent = css;
  function mountLogo() {
    document.head.appendChild(st);
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', V.colors.bg);
    document.querySelectorAll('[data-vi-logo]').forEach(function (el) {
      var L = V.logo; el.classList.add('vi-logo'); el.setAttribute('title', L.alt || V.name);
      el.innerHTML = L.src ? '<img src="' + L.src + '" alt="' + (L.alt || '') + '">' : (L.svg || '');
      if (L.text && !L.src) { var t = document.createElement('span'); t.textContent = L.text; el.appendChild(t); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountLogo); else mountLogo();
  /* 游戏脚本用：VI.c.primary、VI.rgba('primary', .3) */
  window.VI = { game: game, brand: V, c: V.colors, fonts: V.fonts, hud: V.hud, glow: !!V.hud.glow,
    rgba: function (name, a) { var c = hexRgb(V.colors[name] || '#000'); return 'rgba(' + c.join(',') + ',' + a + ')'; } };
  window.BRAND_VI = BRAND;
})();
