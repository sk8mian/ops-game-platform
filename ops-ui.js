/* 运营组件（平台页与游戏共用）：活动规则、我的权益、抽奖转盘、分享海报、提示条。
 * 依赖：ops-config.js、ops-engine.js、vendor/qrcode.js（可选，用于海报二维码） */
(function () {
  'use strict';
  const C = window.OPS_CONFIG, Ops = window.Ops;
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/ops-ui\.js.*$/, '');
  const IN_APP = /MicroMessenger|QQ\/|Weibo|AlipayClient|DingTalk|Lark/i.test(navigator.userAgent), WECHAT = /MicroMessenger/i.test(navigator.userAgent);
  const vib = (p) => { try { const ua = navigator.userActivation; if (navigator.vibrate && (!ua || ua.hasBeenActive) && matchMedia('(pointer:coarse)').matches) navigator.vibrate(p); } catch (e) {} };
  const pct = (p) => { const v = p * 100; return (v < 1 ? v.toFixed(1) : (Math.round(v * 10) / 10)) + '%'; };

  const CSS = `
  /* 运营组件 v2：平台壳用 theme.css 变量；游戏里由 brand-vi.js 提供 --vi-* 变量（品牌 VI） */
  .ou-root{--ou-accent:var(--vi-primary,var(--brand,#ff4d6a));--ou-accent-text:var(--vi-primary-light,var(--brand-text,#ff8095));--ou-accent-2:var(--vi-accent,var(--blue,#76baff));--ou-on-accent:var(--vi-on-primary,var(--on-brand,#16060a));--ou-bg:var(--vi-bg,var(--bg,#121216));--ou-card:var(--vi-surface,var(--panel,#1b1b21));--ou-panel2:var(--vi-surface-2,var(--panel2,#222229));--ou-line:var(--vi-line,var(--line,#33333e));--ou-text:var(--vi-text,var(--text,#f3f3f6));--ou-dim:var(--vi-muted,var(--muted,#a6a6b4));--ou-warn:var(--vi-warning,var(--amber,#f6c887));--ou-ok:var(--vi-success,var(--green,#73d7b1));--ou-r:var(--vi-radius,8px);--ou-r-lg:var(--vi-radius-lg,11px);--ou-r-xl:var(--vi-radius-xl,16px);--ou-font:var(--vi-font,var(--font,-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif));--ou-mono:var(--vi-mono,var(--mono,'SF Mono',Consolas,monospace));--ou-ease:cubic-bezier(.2,.8,.2,1);font-family:var(--ou-font);color:var(--ou-text)}
  .ou-banner{position:fixed;left:50%;transform:translateX(-50%);top:max(6px,env(safe-area-inset-top));z-index:9000;font-size:11px;padding:3px 9px;border-radius:5px;background:color-mix(in srgb,var(--ou-warn) 12%,var(--ou-bg));border:1px solid color-mix(in srgb,var(--ou-warn) 35%,transparent);color:var(--ou-warn);pointer-events:none;white-space:nowrap}
  .ou-toast{position:fixed;left:50%;bottom:calc(90px + env(safe-area-inset-bottom));transform:translate(-50%,12px);opacity:0;z-index:9600;background:var(--ou-card);border:1px solid var(--ou-line);color:var(--ou-text);padding:10px 16px;border-radius:var(--ou-r);font-size:14px;transition:opacity .24s var(--ou-ease),transform .24s var(--ou-ease);box-shadow:0 14px 30px #0004;max-width:86vw;text-align:center;pointer-events:none}
  .ou-toast.on{opacity:1;transform:translate(-50%,0)}
  .ou-mask{position:fixed;inset:0;z-index:9100;background:#050508b8;opacity:0;transition:opacity .26s var(--ou-ease);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}
  .ou-mask.on{opacity:1}
  .ou-sheet{width:100%;max-width:560px;max-height:90vh;overflow:auto;background:var(--ou-bg);border:1px solid var(--ou-line);border-bottom:none;border-radius:var(--ou-r-xl) var(--ou-r-xl) 0 0;padding:0 18px calc(22px + env(safe-area-inset-bottom));transform:translateY(100%);transition:transform .3s var(--ou-ease);box-shadow:0 18px 50px #0005}
  .ou-mask.on .ou-sheet{transform:none}
  @media (min-width:760px){.ou-mask{align-items:center}.ou-sheet{border-radius:var(--ou-r-xl);border-bottom:1px solid var(--ou-line);max-height:86vh;transform:translateY(15px) scale(.985);opacity:0;transition:transform .26s var(--ou-ease),opacity .26s var(--ou-ease)}.ou-mask.on .ou-sheet{opacity:1}}
  .ou-head{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 -18px 14px;padding:16px 18px 14px;border-bottom:1px solid var(--ou-line);background:var(--ou-bg)}
  .ou-head .ou-eb{display:block;font-size:9px;letter-spacing:2px;font-weight:650;color:var(--ou-accent-text);margin-bottom:3px}
  .ou-head h3{margin:0;font-size:19px;font-weight:650;letter-spacing:-.3px;color:var(--ou-text)}
  .ou-x{border:1px solid var(--ou-line);background:none;color:var(--ou-text);width:42px;height:42px;border-radius:var(--ou-r);font-size:22px;line-height:1;cursor:pointer;display:grid;place-items:center;flex:none;transition:background .16s,border-color .16s}
  .ou-x:hover{background:var(--ou-panel2);border-color:var(--ou-accent)}
  .ou-sec{background:var(--ou-card);border:1px solid var(--ou-line);border-radius:var(--ou-r-lg);padding:14px 16px;margin:10px 0}
  .ou-sec h4{margin:0 0 9px;font-size:13px;font-weight:600;color:var(--ou-text);display:flex;align-items:center;gap:6px}
  .ou-sec p,.ou-sec li{font-size:13px;line-height:1.65;color:var(--ou-dim);margin:0}
  .ou-sec p b,.ou-sec li b{color:var(--ou-text);font-weight:600}
  .ou-sec ul{margin:0;padding-left:18px}
  .ou-table{width:100%;border-collapse:collapse;font-size:12px}
  .ou-table td,.ou-table th{padding:8px 6px;border-top:1px solid var(--ou-line);text-align:left;vertical-align:top}
  .ou-table th{color:var(--ou-dim);font-weight:500;font-size:11px;background:var(--ou-panel2);border-top:0}
  .ou-warn{font-size:12px;color:var(--ou-warn);background:color-mix(in srgb,var(--ou-warn) 7%,transparent);border:1px solid color-mix(in srgb,var(--ou-warn) 25%,transparent);border-left:3px solid var(--ou-warn);border-radius:var(--ou-r);padding:7px 10px;margin:6px 0}
  .ou-btn{appearance:none;border:1px solid var(--ou-accent);cursor:pointer;font-weight:650;font-size:14px;color:var(--ou-on-accent);padding:12px 20px;border-radius:var(--ou-r);background:var(--ou-accent);transition:filter .16s,border-color .16s,background .16s}
  .ou-btn:hover{filter:brightness(1.08)}
  .ou-btn:active{transform:translateY(1px)}
  .ou-btn[disabled]{opacity:.4;cursor:default;filter:none}
  .ou-btn.ghost{background:var(--ou-card);color:var(--ou-text);border:1px solid var(--ou-line);font-weight:500}
  .ou-btn.ghost:hover{border-color:var(--ou-accent);filter:none}
  .ou-row{display:flex;gap:10px;flex-wrap:wrap}
  .ou-row>.ou-btn{flex:1}
  .ou-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
  .ou-kpi{background:var(--ou-card);border:1px solid var(--ou-line);border-radius:10px;padding:12px 10px}
  .ou-kpi b{display:block;font-size:22px;font-weight:550;color:var(--ou-text);font-family:var(--ou-mono);font-variant-numeric:tabular-nums;line-height:1.3}
  .ou-kpi span{font-size:11px;color:var(--ou-dim)}
  .ou-bar{height:6px;background:var(--ou-panel2);border-radius:3px;overflow:hidden;margin:6px 0}
  .ou-bar i{display:block;height:100%;background:var(--ou-accent);border-radius:3px;transition:width .35s var(--ou-ease)}
  .ou-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:5px;font-size:11px;font-weight:600;border:1px solid currentColor}
  .ou-days{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin:8px 0}
  .ou-day{border-radius:var(--ou-r);padding:6px 0;text-align:center;font-size:11px;background:var(--ou-panel2);border:1px solid var(--ou-line);color:var(--ou-dim)}
  .ou-day b{display:block;font-size:13px;color:var(--ou-text);font-family:var(--ou-mono)}
  .ou-day.done{background:color-mix(in srgb,var(--ou-accent) 10%,transparent);border-color:var(--ou-accent);color:var(--ou-text)}
  .ou-day.next{border-color:var(--ou-accent-text);border-style:dashed}
  .ou-wheel-wrap{position:relative;width:min(300px,76vw);aspect-ratio:1;margin:6px auto 12px}
  .ou-wheel-wrap canvas{width:100%;height:100%;display:block}
  .ou-pointer{position:absolute;left:50%;top:-6px;transform:translateX(-50%);width:0;height:0;border-left:13px solid transparent;border-right:13px solid transparent;border-top:24px solid var(--ou-text);z-index:2}
  .ou-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:28%;aspect-ratio:1;border-radius:50%;background:var(--ou-bg);border:1px solid var(--ou-line);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;color:var(--ou-text);text-align:center;line-height:1.2}
  .ou-result{text-align:center;padding:10px;border-radius:var(--ou-r);margin:8px 0;font-size:14px;background:var(--ou-card);border:1px solid var(--ou-line);min-height:44px}
  .ou-result b{font-size:17px}
  .ou-poster{display:block;width:min(300px,70vw);margin:6px auto 12px;border-radius:var(--ou-r-lg);border:1px solid var(--ou-line)}
  .ou-lb{padding:0!important;margin:0}
  .ou-lb li{list-style:none;display:flex;justify-content:space-between;padding:8px 2px;border-top:1px solid var(--ou-line);font-size:13px;color:var(--ou-text)}
  .ou-lb li:first-child{border-top:0}
  .ou-lb li.me{color:var(--ou-accent-text);font-weight:600;background:color-mix(in srgb,var(--ou-accent) 8%,transparent);border-radius:6px;padding-left:8px;padding-right:8px}
  .ou-small{font-size:11.5px;color:var(--ou-dim)}
  .ou-code{font-family:var(--ou-mono);background:var(--ou-panel2);padding:2px 6px;border-radius:5px;color:var(--ou-accent-text)}
  .ou-tabs{display:flex;gap:22px;margin:0 0 14px;border-bottom:1px solid var(--ou-line)}
  .ou-tab{flex:none;min-width:44px;border:0;background:none;color:var(--ou-dim);padding:12px 4px;font-size:13px;font-weight:500;cursor:pointer;position:relative;transition:color .16s}
  .ou-tab:hover{color:var(--ou-text)}
  .ou-tab.on{color:var(--ou-text)}
  .ou-tab.on:after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--ou-accent)}
  .ou-tab i{display:inline-block;margin-left:5px;min-width:16px;height:16px;border-radius:8px;background:var(--ou-accent);color:var(--ou-on-accent);font:600 10px/16px var(--ou-mono);font-style:normal;padding:0 4px;vertical-align:1px}
  .ou-ms{display:flex;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--ou-line)}
  .ou-ms:first-child{border-top:0}
  .ou-act{padding:0 0 12px}
  .ou-act small{display:block;font-size:12px;color:var(--ou-dim);margin-bottom:6px}
  .ou-act-row{display:flex;gap:8px}
  .ou-act-row input{flex:1;min-width:0;min-height:44px;border-radius:7px;border:1px solid var(--ou-line);background:var(--ou-panel2);color:var(--ou-text);padding:0 12px;font-size:16px;outline:none;transition:border-color .16s}
  .ou-act-row input:focus{border-color:var(--ou-accent)}
  .ou-act-row .ou-btn{flex:0 0 auto;padding:0 16px}
  .ou-ms .t{flex:1;min-width:0}
  .ou-ms b{font-size:14px;font-weight:600}
  .ou-ms small{display:block;font-size:12px;color:var(--ou-dim)}
  .ou-ms .ou-bar{height:4px;margin:6px 0 0}
  .ou-ms .rw{font:600 12px var(--ou-mono);color:var(--ou-warn);white-space:nowrap}
  .ou-claim{border:1px solid var(--ou-accent);border-radius:var(--ou-r);padding:7px 12px;font-weight:650;font-size:12.5px;cursor:pointer;color:var(--ou-on-accent);background:var(--ou-accent);white-space:nowrap;transition:filter .16s}
  .ou-claim:hover{filter:brightness(1.08)}
  .ou-claim[disabled]{background:var(--ou-panel2);border-color:var(--ou-line);color:var(--ou-dim);cursor:default;filter:none}
  .ou-root button{touch-action:manipulation;font-family:inherit}
  .ou-x{width:44px;height:44px}
  .ou-btn,.ou-tab,.ou-claim{min-height:44px}
  .ou-claim{min-width:64px}
  .ou-mask{touch-action:none}
  .ou-sheet{touch-action:pan-y;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding-left:max(18px,env(safe-area-inset-left));padding-right:max(18px,env(safe-area-inset-right))}
  .ou-grab{display:block;height:20px;margin:0 -18px -6px;position:relative;touch-action:none;cursor:grab}
  .ou-grab::before{content:'';position:absolute;left:50%;top:8px;width:36px;height:4px;margin-left:-18px;border-radius:2px;background:var(--ou-line)}
  .ou-grab+.ou-head{padding-top:10px}
  @media (min-width:760px){.ou-grab{display:none}.ou-grab+.ou-head{padding-top:16px}}
  .ou-poster{width:auto!important;height:min(50vh,440px);max-width:82vw;aspect-ratio:750/1334;object-fit:contain;-webkit-touch-callout:default!important;user-select:auto;-webkit-user-select:auto;pointer-events:auto;touch-action:auto}
  .ou-lp{display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;color:var(--ou-warn);margin:-2px 0 4px}
  .ou-lp i{display:inline-block;width:20px;height:20px;border-radius:50%;border:2px solid var(--ou-warn);animation:ou-press 1.4s infinite}
  @keyframes ou-press{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(.7);opacity:1}}
  .ou-wx{font-size:12.5px;color:var(--ou-accent-text);background:color-mix(in srgb,var(--ou-accent) 6%,transparent);border:1px solid var(--ou-line);border-radius:var(--ou-r);padding:7px 10px;margin:0 0 10px;text-align:center}
  [data-hud=glass] .ou-sheet,[data-hud=glass] .ou-head{background:color-mix(in srgb,var(--ou-bg) 90%,transparent)}
  [data-hud=glass] .ou-sec{background:color-mix(in srgb,var(--ou-card) 80%,transparent)}
  @media (prefers-reduced-motion:reduce){.ou-sheet,.ou-mask,.ou-toast{transition:none!important}}
  `;

  /* 画布用色：读取已解析的 --ou-* 变量（平台壳=theme.css，游戏=brand-vi.js 的品牌 VI） */
  function P() { const cs = getComputedStyle(document.body); const v = (k, d) => (cs.getPropertyValue(k).trim() || d);
    return { accent: v('--ou-accent', '#ff4d6a'), accentText: v('--ou-accent-text', '#ff8095'), accent2: v('--ou-accent-2', '#76baff'), bg: v('--ou-bg', '#121216'), card: v('--ou-card', '#1b1b21'), text: v('--ou-text', '#f3f3f6'), dim: v('--ou-dim', '#a6a6b4'), line: v('--ou-line', '#33333e'), font: v('--ou-font', 'sans-serif') }; }
  function injectStyles() { if (document.getElementById('ou-css')) return; const s = document.createElement('style'); s.id = 'ou-css'; s.textContent = CSS; document.head.appendChild(s); document.body.classList.add('ou-root'); }

  function banner(text) { injectStyles(); if (document.querySelector('.ou-banner')) return; const b = document.createElement('div'); b.className = 'ou-banner'; b.textContent = '⚠ ' + (text || C.demoBanner); document.body.appendChild(b); }
  let toastT;
  function toast(msg, ms) { injectStyles(); let t = document.querySelector('.ou-toast'); if (!t) { t = document.createElement('div'); t.className = 'ou-toast'; document.body.appendChild(t); } t.innerHTML = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms || 2200); }

  const EYEBROW = {"活动规则": "RULES", "任务中心": "MISSIONS", "我的权益": "WALLET", "积分抽奖": "LUCKY DRAW", "分享得加场": "SHARE", "模型设置": "SETTINGS", "我的队伍": "TEAM"};
  function sheet(title, html, onMount) {
    injectStyles();
    const m = document.createElement('div'); m.className = 'ou-mask ou-root';
    m.innerHTML = `<div class="ou-sheet" role="dialog" aria-label="${esc(title)}"><div class="ou-grab" aria-hidden="true"></div><div class="ou-head"><div><span class="ou-eb">${esc(EYEBROW[title] || '运营组件')}</span><h3>${esc(title)}</h3></div><button class="ou-x" aria-label="关闭">×</button></div><div class="ou-body">${html}</div></div>`;
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('on'));
    const close = () => { m.classList.remove('on'); setTimeout(() => m.remove(), 300); m.dispatchEvent(new Event('ou-close')); };
    m.addEventListener('click', e => { if (e.target === m) close(); });
    m.querySelector('.ou-x').onclick = close;
    swipeToClose(m.querySelector('.ou-sheet'), close);
    const api = { el: m, body: m.querySelector('.ou-body'), close };
    if (onMount) onMount(api);
    return api;
  }

  /* 下滑关闭底部抽屉：从把手/标题开始，或内容已滚到顶时下拉 */
  function swipeToClose(sh, close) {
    let y0 = null, dy = 0, t0 = 0;
    sh.addEventListener('touchstart', e => { if (e.touches.length !== 1 || innerWidth >= 760) return; if (!e.target.closest('.ou-grab, .ou-head') && sh.scrollTop > 0) return; if (e.target.closest('canvas')) return; y0 = e.touches[0].clientY; dy = 0; t0 = performance.now(); }, { passive: true });
    sh.addEventListener('touchmove', e => { if (y0 === null) return; dy = e.touches[0].clientY - y0; if (dy > 0) { e.preventDefault(); sh.style.transition = 'none'; sh.style.transform = `translateY(${dy}px)`; } else if (dy < -10) { y0 = null; sh.style.transform = ''; } }, { passive: false });
    const end = () => { if (y0 === null) return; y0 = null; sh.style.transition = ''; if (dy > 110 || (dy > 40 && performance.now() - t0 < 250)) { sh.style.transform = 'translateY(110%)'; vib(8); close(); } else sh.style.transform = ''; };
    sh.addEventListener('touchend', end); sh.addEventListener('touchcancel', end);
  }

  /* ---------- 活动规则 ---------- */
  function rulesHTML() {
    const P = C.points, L = C.lottery, S = C.share;
    return `
    <div class="ou-warn">⚠ ${esc(C.demoBanner)}。本页规则即 ops-config.js 的实时渲染。</div>
    <div class="ou-sec"><h4>🎮 游戏积分</h4><table class="ou-table">
      <tr><td>击落普通杂讯</td><td>+${P.perKill}</td></tr><tr><td>击落精英单位</td><td>+${P.perElite}</td></tr>
      <tr><td>拾取强化道具</td><td>+${P.perPowerup}</td></tr><tr><td>击败 Boss</td><td>+${P.perBoss}</td></tr>
      <tr><td>通关一关</td><td>+${P.perLevelClear}</td></tr><tr><td>一关内零受伤</td><td>+${P.noHitBonus}</td></tr>
      <tr><th>单局入账上限</th><th>${P.perGameCap}</th></tr><tr><th>每日游戏积分上限</th><th>${P.dailyCap}</th></tr></table></div>
    <div class="ou-sec"><h4>⏱ 场次</h4><ul>
      <li>每日免费 <b>${C.plays.dailyFree}</b> 场（银牌 +1、金牌 +2），次日 0 点重置</li>
      <li>每分享 1 次 <b>+${C.plays.perShare}</b> 场，每日最多加 <b>${C.plays.maxShareBonusPerDay}</b> 场</li>
      <li>连续签到满 7 天当天额外 <b>+${C.checkin.day7ExtraPlay}</b> 场</li></ul></div>
    <div class="ou-sec"><h4>📣 分享与邀请</h4><ul>
      <li>分享活动：<b>+${S.pointsPerShare}</b> 积分（每日前 ${S.maxRewardedSharesPerDay} 次）</li>
      <li>好友通过你的专属链接完成首局：你得 <b>+${S.inviterBonus}</b>，好友得新人礼 <b>+${S.inviteeWelcome}</b></li>
      <li>每日最多计 ${S.maxInvitesPerDay} 位有效邀请；不能邀请自己</li></ul></div>
    <div class="ou-sec"><h4>📅 连续签到</h4><div class="ou-days">${C.checkin.rewards.map((r, i) => `<div class="ou-day"><b>+${r}</b>第${i + 1}天</div>`).join('')}</div>
      <p class="ou-small">断签从第 1 天重新计算；第 8 天起每天按第 7 天奖励。</p></div>
    <div class="ou-sec"><h4>🎁 积分抽奖</h4><p>每次消耗 <b>${L.costPerDraw}</b> 积分（银牌 9 折、金牌 8 折），每日最多 ${L.dailyDrawCap} 次。</p>
      <div class="ou-warn">${esc(L.disclaimer)}</div>
      <table class="ou-table"><tr><th>奖级</th><th>奖品</th><th>概率</th></tr>${L.prizes.map(p => `<tr><td style="color:${p.color}">${esc(p.tier)}</td><td>${esc(p.name)}</td><td>${pct(p.probability)}</td></tr>`).join('')}</table></div>
    <div class="ou-sec"><h4>✅ 任务中心</h4><table class="ou-table"><tr><th>类型</th><th>任务</th><th>奖励</th></tr>${['daily', 'weekly', 'achievements'].map(k => C.missions[k].map(m => `<tr><td>${k === 'daily' ? '每日' : k === 'weekly' ? '每周' : '成就'}</td><td>${esc(m.desc)}</td><td>+${m.points}</td></tr>`).join('')).join('')}</table></div>
    <div class="ou-sec"><h4>🏅 权益等级（按累计获得积分）</h4><table class="ou-table"><tr><th>等级</th><th>门槛</th><th>权益</th></tr>
      ${C.tiers.map(t => `<tr><td style="color:${t.color}">${t.icon} ${esc(t.name)}</td><td>${t.min}</td><td>${t.perks.map(esc).join('、')}</td></tr>`).join('')}</table>
      <p class="ou-small">消耗积分抽奖不会降级。</p></div>
    <div class="ou-sec"><h4>🧭 运营节奏</h4><ul>${C.strategy.phases.map(p => `<li><b>${esc(p.name)}</b>：${esc(p.text)}</li>`).join('')}</ul></div>
    <div class="ou-sec"><h4>📊 核心指标</h4><p>${C.strategy.kpis.map(esc).join(' · ')}</p></div>
    <div class="ou-sec"><h4>🛡 正式上线防刷要求</h4><ul>${C.strategy.antiAbuse.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>
    <p class="ou-small">本演示不收集手机号、身份证等个人信息，不涉及支付，不发放真实奖品。规则版本 ${esc(C.version)}。</p>`;
  }
  function openRules() { return sheet('活动规则', rulesHTML()); }

  /* ---------- 我的权益 ---------- */
  function walletHTML() {
    const s = Ops.state, t = Ops.tier(), n = Ops.nextTier(), ck = Ops.checkinStatus();
    const filled = ck.done ? ((ck.streak - 1) % 7) + 1 : (ck.nextDay - 1) % 7;
    const days = C.checkin.rewards.map((r, i) => { const d = i + 1; return `<div class="ou-day ${d <= filled ? 'done' : ''} ${!ck.done && d === filled + 1 ? 'next' : ''}"><b>+${r}</b>D${d}</div>`; }).join('');
    return `
    <div class="ou-sec"><div style="display:flex;justify-content:space-between;align-items:center"><span class="ou-badge" style="color:${t.color}">${t.icon} ${esc(t.name)}</span><span class="ou-small">邀请码 <span class="ou-code">${esc(s.code)}</span></span></div>
      <div class="ou-bar"><i style="width:${Math.round(Ops.tierProgress() * 100)}%"></i></div>
      <p class="ou-small">${n ? `累计 ${s.lifetime} / ${n.min}，再得 ${n.min - s.lifetime} 积分升级 ${n.icon}${esc(n.name)}` : '已达最高等级 🥇'}</p>
      <p class="ou-small">当前权益：${t.perks.map(esc).join('、')}</p></div>
    <div class="ou-kpis"><div class="ou-kpi"><b>${s.points}</b><span>可用积分</span></div><div class="ou-kpi"><b>${Ops.playsLeft()}</b><span>今日剩余场次</span></div><div class="ou-kpi"><b>${s.best}</b><span>最佳单局</span></div></div>
    <div class="ou-sec"><h4>📅 连续签到 · 已连签 ${ck.streak} 天</h4><div class="ou-days">${days}</div>
      <button class="ou-btn" data-act="checkin" ${ck.done ? 'disabled' : ''} style="width:100%">${ck.done ? '今日已签到 ✓' : `签到领 +${C.checkin.rewards[Math.min(ck.nextDay, 7) - 1]} 积分`}</button></div>
    <button class="ou-btn ghost" data-act="missions" style="width:100%;margin-top:10px">✅ 任务中心${Ops.claimableCount() ? `（${Ops.claimableCount()} 个可领取）` : ''}</button>
    <div class="ou-row" style="margin:10px 0"><button class="ou-btn" data-act="draw">去抽奖（${Ops.drawCost()}/次）</button><button class="ou-btn ghost" data-act="share">分享得加场</button></div>
    <div class="ou-sec"><h4>🤝 邀请好友</h4><p class="ou-small">好友打开你的链接并完成首局，你得 +${C.share.inviterBonus}。演示环境无后端，可点下方按钮模拟一次。</p>
      <button class="ou-btn ghost" data-act="friend" style="width:100%;margin-top:8px">模拟：一位好友通过我的链接完成首局</button></div>
    <div class="ou-sec"><h4>🏆 排行榜（本地 + 模拟数据）</h4><ul class="ou-lb">${Ops.leaderboard().map(r => `<li class="${r.me ? 'me' : ''}"><span>${r.rank}. ${esc(r.name)}${r.gold ? ' 🥇' : ''}</span><span>${r.score}</span></li>`).join('')}</ul></div>
    <div class="ou-sec"><h4>🎁 我的奖品</h4>${s.prizes.length ? `<table class="ou-table">${s.prizes.slice(0, 8).map(p => `<tr><td>${esc(p.tier)}</td><td>${esc(p.name)}</td><td class="ou-code">${p.code}</td></tr>`).join('')}</table><p class="ou-small">演示码，不可兑换。</p>` : '<p class="ou-small">还没有奖品，去抽一把？</p>'}</div>
    <div class="ou-sec"><h4>🧾 积分明细</h4>${s.log.length ? s.log.slice(0, 8).map(l => `<p class="ou-small">${new Date(l.t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} ${esc(l.text)}</p>`).join('') : '<p class="ou-small">暂无</p>'}</div>
    <button class="ou-btn ghost" data-act="reset" style="width:100%;font-size:12px">重置演示数据</button>`;
  }
  function openWallet(opts) {
    opts = opts || {};
    return sheet('我的权益', walletHTML(), (api) => {
      const rerender = () => { api.body.innerHTML = walletHTML(); };
      api.body.addEventListener('click', (e) => {
        const a = e.target.closest('[data-act]'); if (!a) return;
        const act = a.dataset.act;
        if (act === 'checkin') { const r = Ops.checkin(); toast(r.ok ? `签到成功 +${r.points} 积分${r.play ? `，+${r.play} 场` : ''}` : r.msg); rerender(); }
        if (act === 'friend') { const n = Ops.simulateFriend(); toast(n ? `好友完成首局，+${C.share.inviterBonus * n} 积分` : '今日邀请奖励已达上限'); rerender(); }
        if (act === 'draw') { api.close(); openLottery({ onClose: opts.onChange }); }
        if (act === 'missions') { api.close(); openMissions({ onClose: opts.onChange }); }
        if (act === 'share') { api.close(); openShare(Object.assign({ onClose: opts.onChange }, opts.share || {})); }
        if (act === 'reset') { if (confirm('清空本机演示数据？')) { Ops.reset(); rerender(); toast('已重置'); } }
        opts.onChange && opts.onChange();
      });
      api.el.addEventListener('ou-close', () => opts.onChange && opts.onChange());
    });
  }

  /* ---------- 任务中心 ---------- */
  const PERIOD = { daily: '每日任务', weekly: '每周任务', achievement: '成就' };
  function renderMissions(el, opts) {
    opts = opts || {}; let tab = opts.tab || 'daily';
    const draw = () => {
      const all = Ops.missions(); const cnt = (p) => all.filter(m => m.period === p && m.done && !m.claimed).length;
      el.innerHTML = `<div class="ou-tabs">${Object.keys(PERIOD).map(p => `<button class="ou-tab ${p === tab ? 'on' : ''}" data-tab="${p}">${PERIOD[p]}${cnt(p) ? `<i>${cnt(p)}</i>` : ''}</button>`).join('')}</div>
        <div class="ou-sec" style="margin:0">${all.filter(m => m.period === tab).map(m => `<div class="ou-ms" data-mid="${m.id}"><div class="t"><b>${esc(m.name)}</b><small>${esc(m.desc)} · ${m.progress}/${m.target}</small><div class="ou-bar"><i style="width:${Math.round(m.progress / m.target * 100)}%"></i></div></div><span class="rw">+${m.points}</span><button class="ou-claim" data-claim="${m.id}" ${m.done && !m.claimed ? '' : 'disabled'}>${m.claimed ? '已领取' : m.done ? '领取' : '进行中'}</button></div>${actForm(m)}`).join('')}</div>
        <p class="ou-small" style="margin-top:8px">每日任务 0 点刷新，每周任务周一刷新；任务奖励不占每日游戏积分上限。</p>`;
      el.querySelectorAll('[data-act-go]').forEach(b => b.onclick = () => {
        const inp = el.querySelector(`[data-act-in="${b.dataset.actGo}"]`); const kind = b.dataset.kind;
        const r = kind === 'code' ? Ops.redeemCode(inp.value) : Ops.submitWork(inp.value);
        toast(r.ok ? (kind === 'code' ? '口令正确 ✅ 去领取奖励' : '作品已提交 ✅（演示自动通过）去领取奖励') : r.msg); if (r.ok) draw();
      });
      el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; draw(); });
      el.querySelectorAll('[data-claim]').forEach(b => b.onclick = () => { const r = Ops.claimMission(b.dataset.claim); toast(r.ok ? `🎉 ${esc(r.mission.name)} +${r.points} 积分` : r.msg); draw(); opts.onChange && opts.onChange(r); });
    };
    draw(); return { refresh: draw };
  }
  function actForm(m) {
    if (!m.action || m.done) return '';
    const code = m.action === 'code', cfg = code ? C.platformCode : C.works;
    return `<div class="ou-act"><small>${esc(cfg.hint)}</small><div class="ou-act-row"><input data-act-in="${m.id}" type="${code ? 'text' : 'url'}" placeholder="${code ? '输入口令' : '粘贴作品链接 https://…'}" autocomplete="off"><button class="ou-btn" data-act-go="${m.id}" data-kind="${m.action}">${code ? '验证' : '提交'}</button></div></div>`;
  }
  function openMissions(opts) { opts = opts || {}; return sheet('任务中心', '<div data-ms></div>', (api) => { renderMissions(api.body.querySelector('[data-ms]'), opts); api.el.addEventListener('ou-close', () => opts.onClose && opts.onClose()); }); }

  /* ---------- 抽奖转盘 ---------- */
  function drawWheel(cv, rot) {
    const pal = P(), ctx = cv.getContext('2d'), W = cv.width, R = W / 2, prizes = C.lottery.prizes, n = prizes.length, seg = Math.PI * 2 / n;
    ctx.clearRect(0, 0, W, W); ctx.save(); ctx.translate(R, R); ctx.rotate(rot);
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * seg - seg / 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R - 8, a0, a0 + seg); ctx.closePath();
      const g = ctx.createRadialGradient(0, 0, R * .2, 0, 0, R); g.addColorStop(0, pal.card); g.addColorStop(1, prizes[i].color + (i % 2 ? 'aa' : '66'));
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = pal.line; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.rotate(a0 + seg / 2); ctx.textAlign = 'right'; ctx.fillStyle = pal.text; ctx.font = `bold ${W * .05}px system-ui,"PingFang SC",sans-serif`;
      ctx.shadowColor = prizes[i].color; ctx.shadowBlur = 0; ctx.fillText(prizes[i].tier, R - 22, W * .018); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, R - 5, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = pal.accentText; ctx.shadowColor = pal.accent; ctx.shadowBlur = 0; ctx.stroke();
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * (R - 5), Math.sin(a) * (R - 5), 3.5, 0, Math.PI * 2); ctx.fillStyle = i % 2 ? pal.accent2 : '#fff'; ctx.fill(); }
    ctx.restore();
  }
  function openLottery(opts) {
    opts = opts || {};
    const L = C.lottery;
    const html = `<div class="ou-warn">${esc(L.disclaimer)}</div>
      <div class="ou-wheel-wrap"><div class="ou-pointer"></div><canvas width="600" height="600"></canvas><div class="ou-hub">芯运<br>转盘</div></div>
      <div class="ou-result" data-r>每次 <b>${Ops.drawCost()}</b> 积分 · 当前 <b data-pts>${Ops.state.points}</b> 积分</div>
      <button class="ou-btn" data-spin style="width:100%">抽一次（-${Ops.drawCost()} 积分）</button>
      <p class="ou-small" style="margin-top:8px;text-align:center">今日已抽 <span data-dc>${Ops.state.day.draws}</span>/${L.dailyDrawCap} 次 · 结果正式版应由服务端生成</p>
      <div class="ou-sec"><table class="ou-table">${L.prizes.map(p => `<tr><td style="color:${p.color}">${esc(p.tier)}</td><td>${esc(p.name)}</td><td>${pct(p.probability)}</td></tr>`).join('')}</table></div>`;
    return sheet('积分抽奖', html, (api) => {
      const cv = api.body.querySelector('canvas'), btn = api.body.querySelector('[data-spin]'), out = api.body.querySelector('[data-r]');
      let rot = 0, spinning = false; drawWheel(cv, rot);
      const refresh = () => { const c = Ops.canDraw(); btn.disabled = !c.ok; btn.textContent = c.ok ? `抽一次（-${Ops.drawCost()} 积分）` : c.msg; api.body.querySelector('[data-dc]').textContent = Ops.state.day.draws; };
      refresh();
      btn.onclick = () => {
        if (spinning) return;
        const r = Ops.draw(); if (!r.ok) { toast(r.msg); refresh(); return; }
        spinning = true; btn.disabled = true; out.innerHTML = '转盘加速中…';
        const n = L.prizes.length, seg = Math.PI * 2 / n;
        const target = -r.index * seg + (Math.random() - .5) * seg * .6;
        const base = rot - (rot % (Math.PI * 2));
        const end = base + Math.PI * 2 * 6 + ((target % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const start = rot, t0 = performance.now(), dur = 3600;
        const step = (now) => {
          const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
          rot = start + (end - start) * e; drawWheel(cv, rot);
          if (k < 1) return requestAnimationFrame(step);
          spinning = false;
          const p = r.prize;
          out.innerHTML = p.kind === 'none' ? `😅 ${esc(p.name)}` : `🎉 <b style="color:${p.color}">${esc(p.tier)}</b> · ${esc(p.name)}${p.kind === 'points' ? '（已到账）' : '<br><span class="ou-small">演示奖品，不发放</span>'}`;
          window.dispatchEvent(new CustomEvent('ops:draw', { detail: r }));
          refresh(); opts.onDraw && opts.onDraw(r);
        };
        requestAnimationFrame(step);
      };
      window.addEventListener('ops:change', function h() { const el = api.body.querySelector('[data-pts]'); if (!document.body.contains(api.el)) return window.removeEventListener('ops:change', h); if (el) el.textContent = Ops.state.points; });
      api.el.addEventListener('ou-close', () => opts.onClose && opts.onClose());
    });
  }

  /* ---------- 分享海报 ---------- */
  function loadImg(src) { return new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
  /* 二维码库按需加载，首屏少 56KB */
  let qrP = null;
  function loadQR() { if (window.qrcode) return Promise.resolve(); if (!qrP) qrP = new Promise(res => { const sc = document.createElement('script'); sc.src = BASE + 'vendor/qrcode.js'; sc.onload = sc.onerror = () => res(); document.head.appendChild(sc); }); return qrP; }
  async function makePoster(o) { const pal = P();
    await loadQR();
    const W = 750, H = 1334, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, pal.card); bg.addColorStop(.6, pal.bg); bg.addColorStop(1, pal.bg); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = pal.line; g.lineWidth = 1; for (let x = 0; x < W; x += 38) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 38) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const img = await loadImg(o.image);
    if (img) { const ih = 560, iw = W - 80; g.save(); g.beginPath(); g.roundRect ? g.roundRect(40, 230, iw, ih, 28) : g.rect(40, 230, iw, ih); g.clip(); const s = Math.max(iw / img.width, ih / img.height); g.drawImage(img, 40 + (iw - img.width * s) / 2, 230 + (ih - img.height * s) / 2, img.width * s, img.height * s); g.restore(); g.strokeStyle = pal.accentText; g.lineWidth = 3; g.strokeRect(40, 230, iw, ih); }
    g.textAlign = 'center'; g.fillStyle = pal.text; g.shadowColor = pal.accent; g.shadowBlur = 0;
    g.font = 'bold 64px system-ui,"PingFang SC","Noto Sans SC",sans-serif'; g.fillText(o.title || C.campaignName, W / 2, 120);
    g.shadowBlur = 0; g.fillStyle = pal.dim; g.font = '30px system-ui,"PingFang SC",sans-serif'; g.fillText(o.subtitle || '', W / 2, 175);
    const y0 = img ? 860 : 360;
    g.fillStyle = pal.accentText; g.font = 'bold 30px system-ui,"PingFang SC",sans-serif'; g.fillText(o.scoreLabel || '本局战力', W / 2, y0);
    const sg = g.createLinearGradient(200, 0, 550, 0); sg.addColorStop(0, pal.accent); sg.addColorStop(1, pal.accent2); g.fillStyle = sg; g.shadowColor = pal.accent2; g.shadowBlur = 0;
    g.font = 'bold 120px system-ui,sans-serif'; g.fillText(String(o.score != null ? o.score : Ops.state.best), W / 2, y0 + 120); g.shadowBlur = 0;
    const t = Ops.tier(); g.fillStyle = t.color; g.font = 'bold 32px system-ui,"PingFang SC",sans-serif'; g.fillText(t.icon + ' ' + t.name + (o.extra ? ' · ' + o.extra : ''), W / 2, y0 + 180);
    const link = o.link || Ops.shareLink(o.base);
    const qy = H - 230;
    if (window.qrcode) { try { const q = window.qrcode(0, 'M'); q.addData(link); q.make(); const n = q.getModuleCount(), cell = Math.floor(170 / n), qs = cell * n, qx = 60; g.fillStyle = pal.text; g.fillRect(qx - 10, qy - 10, qs + 20, qs + 20); g.fillStyle = '#000'; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect(qx + c * cell, qy + r * cell, cell, cell); } catch (e) {} }
    g.textAlign = 'left'; g.fillStyle = pal.text; g.font = 'bold 34px system-ui,"PingFang SC",sans-serif'; g.fillText(o.cta || '扫码来挑战我！', 270, qy + 50);
    g.fillStyle = pal.dim; g.font = '24px system-ui,"PingFang SC",sans-serif'; g.fillText('邀请码 ' + Ops.state.code + ' · 好友首局你得 +' + C.share.inviterBonus, 270, qy + 100);
    g.fillStyle = pal.dim; g.font = '20px system-ui,"PingFang SC",sans-serif'; g.fillText(o.note || '战力对比仅供娱乐 · 演示活动', 270, qy + 140);
    return { url: cv.toDataURL('image/jpeg', 0.9), link };
  }
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove(); return ok;
    }
  }
  function openShare(opts) {
    opts = opts || {};
    let rewarded = false;
    const reward = () => { if (rewarded) return; rewarded = true; const r = Ops.recordShare(); toast(r.capped ? '分享成功（今日分享奖励已领满）' : `分享成功 ${r.play ? `+${r.play} 场 ` : ''}${r.points ? `+${r.points} 积分` : ''}`); opts.onShare && opts.onShare(r); };
    return sheet('分享得加场', `${WECHAT ? '<div class="ou-wx">↗ 点右上角「···」可直接分享给朋友 / 朋友圈</div>' : ''}<div class="ou-lp"><i></i>长按下方海报 →「保存图片」或「发送给朋友」</div><img class="ou-poster" alt="分享海报（长按保存）" data-poster><div class="ou-row"><button class="ou-btn" data-copy>复制邀请链接</button><button class="ou-btn ghost" data-sys>${navigator.share && !IN_APP ? '系统分享' : IN_APP || matchMedia('(pointer:coarse)').matches ? '怎么保存？' : '下载海报'}</button></div><p class="ou-small" style="margin-top:10px;text-align:center" data-link></p><p class="ou-small" style="text-align:center">每次分享 +${C.plays.perShare} 场（日上限 ${C.plays.maxShareBonusPerDay}）+${C.share.pointsPerShare} 积分</p>`, async (api) => {
      const p = await makePoster(opts);
      api.body.querySelector('[data-poster]').src = p.url; api.body.querySelector('[data-link]').innerHTML = `<span class="ou-code" style="word-break:break-all">${esc(p.link)}</span>`;
      api.body.querySelector('[data-copy]').onclick = async () => { const ok = await copyText(p.link); toast(ok ? '链接已复制' : '复制失败，请手动复制'); reward(); };
      api.body.querySelector('[data-sys]').onclick = async () => {
        if (IN_APP || (!navigator.share && matchMedia('(pointer:coarse)').matches)) { toast('长按上方海报图片，选择「保存图片」即可存到相册'); vib(15); }
        else if (navigator.share) { try { await navigator.share({ title: opts.title || C.campaignName, text: opts.cta || '来挑战我！', url: p.link }); reward(); } catch (e) {} }
        else { const a = document.createElement('a'); a.href = p.url; a.download = 'share-poster.png'; a.click(); reward(); }
      };
      api.el.addEventListener('ou-close', () => opts.onClose && opts.onClose());
    });
  }

  window.OpsUI = { renderMissions, openMissions, injectStyles, banner, toast, sheet, rulesHTML, openRules, openWallet, openLottery, openShare, makePoster, copyText, esc };
})();
