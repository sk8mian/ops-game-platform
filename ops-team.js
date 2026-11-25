/* 组队面板（平台壳 + 游戏内入口）。规则读 OPS_CONFIG.team，状态走 Ops。 */
(function () {
  'use strict';
  const C = () => window.OPS_CONFIG && OPS_CONFIG.team;
  const esc = (s) => window.OpsUI ? OpsUI.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $=id=>document.getElementById(id);

  const css = `
  .ot-banner{font-size:12px;color:var(--ou-warn,var(--amber,#f6c887));background:color-mix(in srgb,var(--ou-warn,var(--amber,#f6c887)) 8%,transparent);border:1px solid color-mix(in srgb,var(--ou-warn,var(--amber,#f6c887)) 28%,transparent);border-left:3px solid var(--ou-warn,var(--amber,#f6c887));border-radius:8px;padding:8px 10px;margin:0 0 12px}
  .ot-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .ot-code{font:600 18px/1.2 var(--ou-mono,ui-monospace,Menlo,monospace);letter-spacing:2px;color:var(--ou-accent-text,var(--brand-text,#ff8095));background:var(--ou-panel2,var(--panel2,#222229));border:1px solid var(--ou-line,var(--line,#33333e));border-radius:8px;padding:8px 12px}
  .ot-bar{height:6px;background:var(--ou-panel2,var(--panel2,#222229));border-radius:3px;overflow:hidden;margin:8px 0}
  .ot-bar i{display:block;height:100%;background:var(--ou-accent,var(--brand,#ff4d6a));border-radius:3px;width:0;transition:width .35s cubic-bezier(.2,.8,.2,1)}
  .ot-mem{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--ou-line,var(--line,#33333e));font-size:13px}
  .ot-mem:first-of-type{border-top:0}
  .ot-mem .who{font-weight:600}
  .ot-mem .bot{font-size:11px;color:var(--ou-warn,var(--amber,#f6c887));font-weight:500;margin-left:6px}
  .ot-mem .cap{font-size:11px;color:var(--ou-accent-text,var(--brand-text,#ff8095));margin-left:6px}
  .ot-ms{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--ou-line,var(--line,#33333e))}
  .ot-ms .t{flex:1;min-width:0}
  .ot-ms b{font-size:14px}
  .ot-hint{font-size:12px;color:var(--ou-dim,var(--muted,#a6a6b4));margin:6px 0}
  .ot-join{display:flex;gap:8px;margin:8px 0}
  .ot-join input{flex:1;min-width:0;min-height:44px;border-radius:7px;border:1px solid var(--ou-line,var(--line,#33333e));background:var(--ou-panel2,var(--panel2,#222229));color:inherit;padding:0 12px;font-size:16px}
  .team-hud{position:absolute;left:12px;right:12px;top:max(96px,calc(env(safe-area-inset-top) + 84px));margin:0;padding:8px 10px;border:1px solid var(--vi-line,rgba(120,170,255,.25));border-radius:10px;background:rgba(6,14,36,.72);color:var(--vi-text,#e8f0ff);font-size:12px;pointer-events:none;z-index:6}
  .team-hud .nm{display:flex;justify-content:space-between;gap:8px;margin-bottom:4px}
  .team-hud .bar{height:5px;background:rgba(255,255,255,.12);border-radius:3px;overflow:hidden}
  .team-hud .bar i{display:block;height:100%;background:var(--vi-primary,#00c7fd);width:0}
  .ot-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--vi-line,var(--line,#33333e));border-radius:8px;padding:6px 10px;font-size:12px;margin:8px 0;cursor:pointer;background:transparent;color:inherit;min-height:36px}
  `;
  function inject() {
    if ($('ot-css')) return;
    const s = document.createElement('style'); s.id = 'ot-css'; s.textContent = css; document.head.appendChild(s);
  }

  function barPct(info) {
    const T = info.cfg, eff = info.effective, last = (T.milestones || [])[T.milestones.length - 1];
    const cap = last ? last.progress : 1; return Math.min(100, Math.round(eff / cap * 100));
  }
  function memberLine(m, team) {
    const cap = m.uid === team.leader ? '<span class="cap">队长</span>' : '';
    const bot = m.isBot ? '<span class="bot">模拟队友</span>' : '';
    return `<div class="ot-mem"><div><span class="who">${esc(m.nick)}</span>${cap}${bot}<div class="ou-small">完局 ${m.games || 0} · 贡献 ${m.raw || 0} · 伤害 ${m.damage || 0}</div></div><span class="ou-small">${m.isBot ? '演示' : '本人行为'}</span></div>`;
  }
  function milestonesHTML(info) {
    const T = info.cfg, me = Ops.state.uid;
    return (T.milestones || []).map(ms => {
      const reached = info.effective >= ms.progress;
      const paid = ((info.team.paid || {})[ms.id] || []).indexOf(me) >= 0;
      const btn = !reached ? `<button class="ou-claim" disabled>未达成</button>` : paid ? `<button class="ou-claim" disabled>已领取</button>` : `<button class="ou-claim" data-ms="${ms.id}">领取 +${ms.points}</button>`;
      return `<div class="ot-ms"><div class="t"><b>${esc(ms.name)}</b><small>全队进度 ${ms.progress} · 全队共享 +${ms.points}</small></div>${btn}</div>`;
    }).join('');
  }
  function emptyHTML() {
    const T = C();
    return `<p class="ot-banner">⚠ ${esc(T.compliance)}</p>
      <div class="ou-sec"><h4>创建队伍</h4>
        <p class="ot-hint">你当队长，生成队伍码和邀请链接。队员实际打完一局或完成任务才计进度，只点开链接不算。人越多，进度加成越高（${T.maxMembers} 人封顶）。</p>
        <div class="ot-row"><input class="ot-join" id="otName" maxlength="16" placeholder="队伍名称（可留空）" style="flex:1;min-height:44px;border-radius:7px;border:1px solid var(--ou-line,var(--line));background:var(--ou-panel2,var(--panel2));color:inherit;padding:0 12px;font-size:16px"><button class="ou-btn" data-act="create">创建队伍</button></div>
      </div>
      <div class="ou-sec"><h4>加入队伍</h4>
        <div class="ot-join"><input id="otCode" maxlength="8" placeholder="输入队伍码" autocomplete="off" autocapitalize="characters"><button class="ou-btn ghost" data-act="join">加入</button></div>
      </div>`;
  }
  function teamHTML(info) {
    const t = info.team, T = info.cfg, boss = info.boss;
    const bonusPct = Math.round((info.bonus - 1) * 100);
    const hpLeft = boss ? Math.max(0, boss.hp - boss.damage) : 0;
    const hpPct = boss ? Math.min(100, Math.round((boss.damage / boss.hp) * 100)) : 0;
    return `<p class="ot-banner">⚠ ${esc(T.compliance)}</p>
      <div class="ou-sec">
        <h4>${esc(t.name)}</h4>
        <div class="ot-row" style="margin:8px 0"><span class="ot-code" id="otCodeVal">${esc(t.code)}</span>
          <button class="ou-btn ghost" data-act="copy-code">复制队伍码</button>
          <button class="ou-btn ghost" data-act="copy-link">复制邀请链接</button></div>
        <p class="ot-hint">发给队友打开链接即可加入（同一浏览器换身份也能加入）。人数 ${t.members.length} / ${T.maxMembers} · 加成 ${bonusPct > 0 ? '+' + bonusPct + '%' : '暂无（满 2 人起）'}</p>
        <div class="ot-hint">有效进度 <b>${info.effective}</b>（原始 ${t.raw} × ${info.bonus}）${info.next ? ' · 下一里程碑 ' + info.next.name + ' ' + info.next.progress : ' · 已达全部里程碑'}</div>
        <div class="ot-bar"><i style="width:${barPct(info)}%"></i></div>
      </div>
      <div class="ou-sec"><h4>队员与贡献</h4>${t.members.map(m => memberLine(m, t)).join('')}
        ${t.members.length < T.maxMembers ? '<div class="ot-row" style="margin-top:8px"><button class="ou-btn ghost" data-act="mock">邀请模拟队友（演示）</button></div><p class="ot-hint">没有真实后端时，用「模拟队友」演示加入和过一会儿贡献进度，均标明模拟。</p>' : ''}
      </div>
      <div class="ou-sec"><h4>队伍共同 Boss（3D 闯关累计伤害）</h4>
        <div class="ot-hint">${boss.down ? '已共同击败，全队共享奖励' : `剩余 ${hpLeft} / ${boss.hp}`} · 已累计伤害 ${boss.damage}</div>
        <div class="ot-bar"><i style="width:${Math.min(100, hpPct)}%;background:${boss.down ? 'var(--ou-ok,var(--green,#73d7b1))' : 'var(--ou-accent,var(--brand))'}"></i></div>
      </div>
      <div class="ou-sec"><h4>里程碑（全队共享，每人领一次）</h4>${milestonesHTML(info)}</div>
      <div class="ou-sec"><h4>队伍榜</h4><ul class="ou-lb">${info.board.map(r => `<li class="${r.me ? 'me' : ''}"><span>${r.rank}. ${esc(r.name)}${r.me ? '（我）' : ''}</span><span>${r.progress} · ${r.members} 人</span></li>`).join('')}</ul><p class="ot-hint">含演示用的模拟队伍，仅供展示榜单形态。</p></div>
      <div class="ot-row"><button class="ou-btn ghost" data-act="leave">${t.leader === Ops.state.uid ? '解散队伍' : '退出队伍'}</button></div>`;
  }

  function paint(root) {
    inject();
    const info = Ops.teamInfo();
    root.innerHTML = info.team ? teamHTML(info) : emptyHTML();
    root.querySelectorAll('[data-act]').forEach(b => b.onclick = () => act(root, b.dataset.act));
    root.querySelectorAll('[data-ms]').forEach(b => b.onclick = () => { const r = Ops.claimTeamMilestone(b.dataset.ms); OpsUI.toast(r.ok ? `🎉 ${r.milestone.name} +${r.points} 积分（全队共享）` : r.msg); paint(root); });
    if (info.team && info.team.members.some(m => m.isBot)) Ops._ensureMockTick();
  }
  function act(root, a) {
    if (a === 'create') {
      const name = (root.querySelector('#otName') || {}).value;
      const r = Ops.createTeam(name); OpsUI.toast(r.ok ? '队伍已创建，把队伍码发给队友' : r.msg); if (r.ok) paint(root);
    }
    if (a === 'join') {
      const code = (root.querySelector('#otCode') || {}).value;
      const r = Ops.joinTeam(code); OpsUI.toast(r.ok ? (r.already ? '你已经在这支队伍里' : '已加入队伍') : r.msg); if (r.ok) paint(root);
    }
    if (a === 'copy-code') { const t = Ops.myTeam(); OpsUI.copyText(t && t.code).then(ok => OpsUI.toast(ok ? '队伍码已复制' : '复制失败')); }
    if (a === 'copy-link') { OpsUI.copyText(Ops.teamLink()).then(ok => OpsUI.toast(ok ? '邀请链接已复制' : '复制失败')); }
    if (a === 'mock') { const r = Ops.inviteMock(); OpsUI.toast(r.ok ? r.member.nick + ' 已加入（模拟队友）' : r.msg); if (r.ok) paint(root); }
    if (a === 'leave') {
      const t = Ops.myTeam(), mine = t && t.leader === Ops.state.uid;
      const r = mine ? Ops.disbandTeam() : Ops.leaveTeam(); OpsUI.toast(r.ok ? (mine ? '队伍已解散' : '已退出队伍') : r.msg); if (r.ok) paint(root);
    }
  }

  let liveRoot = null, liveT = 0;
  function openTeam(opts) {
    opts = opts || {};
    if (!window.OpsUI) return;
    const exist = document.querySelector('.ou-sheet[aria-label="我的队伍"]');
    if (exist) { if (liveRoot) paint(liveRoot); return; }
    return OpsUI.sheet('我的队伍', '<div data-team></div>', (api) => {
      liveRoot = api.body.querySelector('[data-team]'); paint(liveRoot);
      const on = () => { if (liveRoot) paint(liveRoot); };
      window.addEventListener('ops:team', on);
      liveT = setInterval(() => { if (liveRoot && Ops.myTeam()) paint(liveRoot); }, 2000);
      api.el.addEventListener('ou-close', () => { liveRoot = null; clearInterval(liveT); window.removeEventListener('ops:team', on); opts.onClose && opts.onClose(); });
    });
  }

  function handleLaunch() {
    if (!window.Ops || !C()) return;
    const r = Ops.handleTeamParam();
    if (r && r.ok) {
      const msg = r.already ? '你已经在这支队伍里' : '已通过邀请链接加入队伍（只加入不计进度，打完一局才贡献）';
      if (window.OpsUI) { OpsUI.injectStyles(); OpsUI.toast(msg); setTimeout(() => openTeam(), 400); }
    } else if (r && !r.ok && window.OpsUI) { OpsUI.injectStyles(); OpsUI.toast(r.msg); }
    else if (location.hash === '#team' && window.OpsUI) setTimeout(() => openTeam(), 300);
    if (Ops.myTeam() && (Ops.myTeam().members || []).some(m => m.isBot)) Ops._ensureMockTick();
    Ops.collectTeamRewards();
    mountGameChip();
  }

  function mountGameChip() {
    const info = Ops.teamInfo && Ops.teamInfo();
    const path = location.pathname;
    const inGame = /chip-3d|store-coupon|poster-quiz/.test(path);
    if (!inGame) return;
    inject();
    if (!$('otGameChip')) {
      const b = document.createElement('button'); b.id = 'otGameChip'; b.className = 'ot-chip'; b.type = 'button';
      b.onclick = () => openTeam();
      const host = document.querySelector('.hero, .menu-card .mc-act, .mc-info, #vStart, body');
      if (host && host !== document.body) host.appendChild(b); else { b.style.position = 'fixed'; b.style.top = '48px'; b.style.right = '10px'; b.style.zIndex = '20'; document.body.appendChild(b); }
    }
    const lab = info && info.team ? `组队 ${info.team.members.length} 人 · 进度 ${info.effective}` : '组队一起更快';
    const el = $('otGameChip'); if (el) el.textContent = '👥 ' + lab;
  }

  function syncHud() {
    const hud = $('teamHud'); if (!hud) return;
    const boss = Ops.teamBoss && Ops.teamBoss();
    if (!boss) { hud.hidden = true; return; }
    hud.hidden = false;
    const left = boss.left, pct = Math.min(100, Math.round(boss.damage / boss.hp * 100));
    const name = $('teamBossNm'), bar = $('teamBossBar');
    if (name) name.textContent = boss.down ? '队伍 Boss 已击败' : ('队伍 Boss 剩余 ' + left);
    if (bar) bar.style.width = (boss.down ? 100 : pct) + '%';
  }

  window.OpsTeam = { open: openTeam, paint, syncHud, mountGameChip };
  if (window.OpsUI) {
    OpsUI.openTeam = openTeam;
    const prev = OpsUI.rulesHTML;
    if (prev && !OpsUI._teamRules) {
      OpsUI._teamRules = true;
      OpsUI.rulesHTML = function () {
        const T = C() || {};
        const extra = `<div class="ou-sec"><h4>👥 拉人组队</h4>
          <p>队长创建队伍，队员用队伍码或邀请链接加入，上限 ${T.maxMembers || 5} 人。进度只计实际打完一局或完成任务，点开链接不算。人越多有效进度加成越高。里程碑奖励全队共享。3D 闯关累计全队伤害打共同 Boss。</p>
          <div class="ou-warn">${esc(T.compliance || '')}</div></div>`;
        return prev() + extra;
      };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', handleLaunch);
  else handleLaunch();
  window.addEventListener('ops:team', () => { mountGameChip(); syncHud(); });
  window.addEventListener('ops:change', () => mountGameChip());
})();
