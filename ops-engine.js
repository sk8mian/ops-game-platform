/* 运营状态引擎（演示版）：读 OPS_CONFIG，状态存 localStorage。
 * 正式版应把这里每个方法换成后端接口调用。 */
(function () {
  'use strict';
  const C = window.OPS_CONFIG;
  const KEY = C.storageKey;
  const INBOX = KEY + '_invite_inbox'; // 模拟“服务端”邀请记账
  const TEAM_KEY = KEY + '_teams'; // 队伍池（与玩家状态分开，同浏览器换身份仍可加入）
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const yesterday = () => { const d = new Date(Date.now() - 864e5); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const weekKey = () => { const d = new Date(); const day = (d.getDay() + 6) % 7; const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day); return 'W' + m.getFullYear() + '-' + (m.getMonth() + 1) + '-' + m.getDate(); };
  const rid = (n) => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < n; i++) s += a[(Math.random() * a.length) | 0]; return s; };

  function fresh() {
    return { uid: rid(10), code: rid(6), nick: '新芯玩家' + rid(3), points: 0, lifetime: 0, best: 0, games: 0,
      invitedBy: null, welcomed: false, checkin: { last: null, streak: 0 }, prizes: [], log: [], day: null };
  }
  function dayBlock() { return { date: today(), playsUsed: 0, sharePlays: 0, bonusPlays: 0, shares: 0, gamePts: 0, draws: 0, invites: 0 }; }

  let S;
  function load(reload) {
    if (!S || reload) {
      try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
    }
    if (!S.day || S.day.date !== today()) S.day = dayBlock();
    if (!S.week || S.week.id !== weekKey()) S.week = { id: weekKey(), stats: {}, claimed: {} };
    S.stats = S.stats || {}; S.claimed = S.claimed || {}; S.day.stats = S.day.stats || {}; S.day.claimed = S.day.claimed || {};
    return S;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} window.dispatchEvent(new CustomEvent('ops:change', { detail: S })); }
  function log(t) { S.log.unshift({ t: Date.now(), text: t }); S.log = S.log.slice(0, 40); }
  function earn(n, why) { n = Math.max(0, Math.round(n)); if (!n) return 0; S.points += n; S.lifetime += n; log('+' + n + ' 积分 · ' + why); return n; }
  load();

  const Ops = {
    cfg: C,
    get state() { load(); return S; },
    tier() { load(); let t = C.tiers[0]; C.tiers.forEach(x => { if (S.lifetime >= x.min) t = x; }); return t; },
    nextTier() { const t = this.tier(); const i = C.tiers.indexOf(t); return C.tiers[i + 1] || null; },
    tierProgress() { const t = this.tier(), n = this.nextTier(); if (!n) return 1; return Math.min(1, (S.lifetime - t.min) / (n.min - t.min)); },
    dailyPlays() { return C.plays.dailyFree + this.tier().extraDailyPlays; },
    playsLeft() { load(); return Math.max(0, this.dailyPlays() + S.day.sharePlays + S.day.bonusPlays - S.day.playsUsed); },
    consumePlay() { load(); if (this.playsLeft() <= 0) return false; S.day.playsUsed++; save(); return true; },

    /* 一局结束入账：raw=本局按规则算出的积分 */
    settleGame(raw, meta) {
      load();
      const P = C.points;
      const capped1 = Math.min(raw, P.perGameCap);
      const room = Math.max(0, P.dailyCap - S.day.gamePts);
      const granted = Math.min(capped1, room);
      S.day.gamePts += granted; S.games++;
      earn(granted, '游戏得分');
      if (raw > S.best) S.best = raw;
      meta = meta || {};
      this._track('games', 1); ['kills', 'bossKills', 'levelClears', 'allClear'].forEach(k => meta[k] && this._track(k, meta[k]));
      if (meta.procMax != null) this._track('procMax', meta.procMax, true);
      const teamRes = this.teamContribute({ kind: 'game', damage: meta.bossDamage || 0 });
      let welcome = 0, inviterCredited = false;
      if (S.invitedBy && !S.welcomed) {
        S.welcomed = true; welcome = earn(C.share.inviteeWelcome, '好友邀请新人礼');
        inviterCredited = this._creditInviter(S.invitedBy);
      }
      save();
      return { raw, granted, cappedByGame: raw > P.perGameCap, cappedByDay: capped1 > granted, welcome, inviterCredited, team: teamRes };
    },

    checkinStatus() { load(); const done = S.checkin.last === today(); const next = done ? S.checkin.streak : (S.checkin.last === yesterday() ? S.checkin.streak + 1 : 1); return { done, streak: S.checkin.streak, nextDay: next }; },
    checkin() {
      load();
      if (S.checkin.last === today()) return { ok: false, msg: '今天已经签过啦' };
      const streak = (S.checkin.last === yesterday() || !C.checkin.breakResets) ? S.checkin.streak + 1 : 1;
      const r = C.checkin.rewards; const pts = r[Math.min(streak, r.length) - 1];
      S.checkin = { last: today(), streak };
      this._track('checkins', 1); this._track('checkinStreak', streak, true);
      earn(pts, '连续签到第 ' + streak + ' 天');
      let play = 0; if (streak % 7 === 0) { play = C.checkin.day7ExtraPlay; S.day.bonusPlays += play; }
      save();
      return { ok: true, streak, points: pts, play };
    },

    shareLink(base) {
      load();
      const u = new URL(base || location.href); u.searchParams.delete('level'); u.searchParams.delete('boss'); u.searchParams.delete('god');
      u.searchParams.set(C.share.linkParam, S.code); return u.toString();
    },
    recordShare() {
      load(); S.day.shares++; this._track('shares', 1);
      let play = 0, pts = 0;
      if (S.day.sharePlays < C.plays.maxShareBonusPerDay) { S.day.sharePlays += C.plays.perShare; play = C.plays.perShare; }
      if (S.day.shares <= C.share.maxRewardedSharesPerDay) pts = earn(C.share.pointsPerShare, '分享活动');
      save();
      return { play, points: pts, capped: !play && !pts };
    },
    /* 打开链接时调用：?inviter=CODE */
    handleInviteParam() {
      load();
      const code = new URLSearchParams(location.search).get(C.share.linkParam);
      if (!code) return null;
      if (code === S.code) return { self: true };
      if (!S.invitedBy && S.games === 0) { S.invitedBy = code; save(); return { bound: true, code }; }
      return { bound: false, code };
    },
    _creditInviter(code) {
      // 演示：写入本机“收件箱”，邀请人下次打开时领取。正式版由服务端记账。
      let box = {}; try { box = JSON.parse(localStorage.getItem(INBOX)) || {}; } catch (e) {}
      box[code] = (box[code] || 0) + 1; localStorage.setItem(INBOX, JSON.stringify(box)); return true;
    },
    collectInvites() {
      load(); let box = {}; try { box = JSON.parse(localStorage.getItem(INBOX)) || {}; } catch (e) {}
      const n = box[S.code] || 0; if (!n) return 0;
      let credited = 0;
      for (let i = 0; i < n; i++) { if (S.day.invites >= C.share.maxInvitesPerDay) break; S.day.invites++; earn(C.share.inviterBonus, '好友通过你的链接完成首局'); credited++; }
      delete box[S.code]; localStorage.setItem(INBOX, JSON.stringify(box)); save();
      return credited;
    },
    simulateFriend() { load(); this._creditInviter(S.code); return this.collectInvites(); },

    drawCost() { return Math.round(C.lottery.costPerDraw * this.tier().drawDiscount); },
    canDraw() { load(); const c = this.drawCost(); if (S.day.draws >= C.lottery.dailyDrawCap) return { ok: false, msg: '今日抽奖次数已用完' }; if (S.points < c) return { ok: false, msg: '积分不足，还差 ' + (c - S.points) }; return { ok: true, cost: c }; },
    draw() {
      const chk = this.canDraw(); if (!chk.ok) return chk;
      S.points -= chk.cost; S.day.draws++; this._track('draws', 1); log('-' + chk.cost + ' 积分 · 抽奖');
      let r = Math.random(), prize = C.lottery.prizes[C.lottery.prizes.length - 1], idx = C.lottery.prizes.length - 1;
      for (let i = 0; i < C.lottery.prizes.length; i++) { r -= C.lottery.prizes[i].probability; if (r < 0) { prize = C.lottery.prizes[i]; idx = i; break; } }
      if (prize.kind === 'points') { S.points += prize.points; log('+' + prize.points + ' 积分 · 抽奖回馈'); }
      if (prize.kind !== 'none') S.prizes.unshift({ t: Date.now(), id: prize.id, tier: prize.tier, name: prize.name, code: 'DEMO-' + rid(8) });
      save();
      return { ok: true, prize, index: idx, cost: chk.cost };
    },

    /* 每日一次的任务奖励（到店打卡、完成测试等） */
    taskDone(id) { load(); return !!(S.day.tasks && S.day.tasks[id]); },
    doTask(id) {
      load(); const t = C.tasks[id]; if (!t) return { ok: false, msg: '未知任务' };
      S.day.tasks = S.day.tasks || {}; if (S.day.tasks[id]) return { ok: false, msg: '今日已完成' };
      S.day.tasks[id] = 1; const n = earn(t.points, t.name);
      const team = this.teamContribute({ kind: id }); save(); return { ok: true, points: n, team };
    },
    /* 积分兑换到店券（演示核销） */
    redeemCoupon() {
      load(); const c = C.store.couponCost; if (S.points < c) return { ok: false, msg: '积分不足，还差 ' + (c - S.points) };
      S.points -= c; log('-' + c + ' 积分 · 兑换到店券');
      const cp = { id: 'CP-' + rid(8), name: C.store.couponName, store: C.store.storeName, t: Date.now(), exp: Date.now() + C.store.couponValidDays * 864e5, used: false };
      S.coupons = S.coupons || []; S.coupons.unshift(cp); save(); return { ok: true, coupon: cp };
    },
    useCoupon(id) { load(); const cp = (S.coupons || []).find(c => c.id === id); if (!cp || cp.used) return false; cp.used = Date.now(); log('核销到店券 ' + id); save(); return true; },
    /* 平台口令：演示在前端比对，正式版服务端按天下发与校验 */
    redeemCode(code) {
      load(); const P = C.platformCode; code = String(code || '').trim();
      if (!code) return { ok: false, msg: '请先输入口令' };
      if ((S.day.stats.codeRedeems || 0) >= P.dailyCap) return { ok: false, msg: '今日口令已输入过' };
      if (!P.codes.some(c => c.toLowerCase() === code.toLowerCase())) return { ok: false, msg: '口令不对，去官方视频里再找找' };
      this._track('codeRedeems', 1); log('输入平台口令'); save(); return { ok: true };
    },
    /* 作品投稿：演示只校验链接域名并自动通过；正式版核验作品归属后再发奖 */
    submitWork(url) {
      load(); const W = C.works; let u;
      try { u = new URL(String(url || '').trim()); } catch (e) { return { ok: false, msg: '请粘贴完整的作品链接（https://…）' }; }
      if (!/^https?:$/.test(u.protocol) || !W.hosts.some(h => u.hostname === h || u.hostname.endsWith('.' + h))) return { ok: false, msg: '只支持抖音 / B站 / 小红书的作品链接' };
      S.works = S.works || [];
      if (S.works.some(w => w.url === u.href)) return { ok: false, msg: '这个作品已经提交过' };
      if ((S.week.stats.worksApproved || 0) >= W.weeklyCap) return { ok: false, msg: '本周投稿奖励已达上限' };
      S.works.unshift({ url: u.href, t: Date.now(), status: 'approved-demo' }); S.works = S.works.slice(0, 20);
      this._track('worksApproved', 1); log('提交作品 ' + u.hostname); save(); return { ok: true };
    },
    /* ---------- 任务中心 ---------- */
    _track(metric, n, isMax) {
      [S.stats, S.day.stats, S.week.stats].forEach(o => { o[metric] = isMax ? Math.max(o[metric] || 0, n) : (o[metric] || 0) + n; });
    },
    track(metric, n, isMax) { load(); this._track(metric, n == null ? 1 : n, isMax); save(); },
    missions() {
      load(); const M = C.missions, out = [];
      const add = (list, period, stats, claimed) => list.forEach(m => { const v = stats[m.metric] || 0; out.push(Object.assign({}, m, { period, progress: Math.min(v, m.target), done: v >= m.target, claimed: !!claimed[m.id] })); });
      add(M.daily, 'daily', S.day.stats, S.day.claimed); add(M.weekly, 'weekly', S.week.stats, S.week.claimed); add(M.achievements, 'achievement', S.stats, S.claimed);
      return out;
    },
    claimableCount() { return this.missions().filter(m => m.done && !m.claimed).length; },
    claimMission(id) {
      const m = this.missions().find(x => x.id === id);
      if (!m) return { ok: false, msg: '任务不存在' }; if (m.claimed) return { ok: false, msg: '已领取' }; if (!m.done) return { ok: false, msg: '任务未完成' };
      const box = m.period === 'daily' ? S.day.claimed : m.period === 'weekly' ? S.week.claimed : S.claimed;
      box[id] = Date.now(); const n = earn(m.points, '任务：' + m.name); save();
      return { ok: true, points: n, mission: m };
    },

    /* ---------- 组队（演示：队伍存在本机 TEAM_KEY，正式版换后端） ---------- */
    _teams: null,
    _loadTeams() { if (this._teams) return this._teams; try { this._teams = JSON.parse(localStorage.getItem(TEAM_KEY)) || {}; } catch (e) { this._teams = {}; } return this._teams; },
    _saveTeams() { try { localStorage.setItem(TEAM_KEY, JSON.stringify(this._teams || {})); } catch (e) {} window.dispatchEvent(new CustomEvent('ops:team', { detail: this.myTeam() })); },
    _teamBonus(n) { const b = (C.team && C.team.sizeBonus) || [1, 1]; return b[Math.min(n, b.length - 1)] || 1; },
    teamEffective(t) { if (!t) return 0; return Math.round(t.raw * this._teamBonus((t.members || []).length) * 10) / 10; },
    myTeam() { load(); this._loadTeams(); const code = S.teamCode; return (code && this._teams[code]) || null; },
    createTeam(name) {
      load(); const T = C.team; if (!T) return { ok: false, msg: '未配置组队' };
      if (S.teamCode && this._teams && this._teams[S.teamCode]) return { ok: false, msg: '你已经在一支队伍里' };
      this._loadTeams();
      let code = rid(T.codeLen || 6); while (this._teams[code]) code = rid(T.codeLen || 6);
      const team = { code, name: (name || (S.nick + '的队伍')).slice(0, 16), leader: S.uid, created: Date.now(), raw: 0, damage: 0, bossDown: false, claimed: {}, paid: {},
        members: [{ uid: S.uid, nick: S.nick, isBot: false, raw: 0, games: 0, quiz: 0, scan: 0, damage: 0, joined: Date.now() }] };
      this._teams[code] = team; S.teamCode = code; save(); this._saveTeams();
      return { ok: true, team };
    },
    joinTeam(code) {
      load(); const T = C.team; code = String(code || '').trim().toUpperCase();
      if (!code) return { ok: false, msg: '请输入队伍码' };
      this._loadTeams(); const team = this._teams[code];
      if (!team) return { ok: false, msg: '找不到这支队伍' };
      if (S.teamCode === code) return { ok: true, already: true, team, msg: '你已经在这支队伍里' };
      if (S.teamCode && this._teams[S.teamCode]) return { ok: false, msg: '先退出当前队伍再加入' };
      if (team.members.length >= T.maxMembers) return { ok: false, msg: '队伍已满（最多 ' + T.maxMembers + ' 人）' };
      if (team.members.some(m => m.uid === S.uid)) { S.teamCode = code; save(); return { ok: true, already: true, team }; }
      team.members.push({ uid: S.uid, nick: S.nick, isBot: false, raw: 0, games: 0, quiz: 0, scan: 0, damage: 0, joined: Date.now() });
      S.teamCode = code; save(); this._saveTeams();
      this.collectTeamRewards();
      return { ok: true, team };
    },
    leaveTeam() {
      load(); this._loadTeams(); const team = this.myTeam(); if (!team) return { ok: false, msg: '你不在队伍里' };
      if (team.leader === S.uid && team.members.filter(m => !m.isBot).length <= 1) return this.disbandTeam();
      team.members = team.members.filter(m => m.uid !== S.uid);
      if (team.leader === S.uid) { const next = team.members.find(m => !m.isBot); team.leader = next ? next.uid : (team.members[0] && team.members[0].uid); }
      S.teamCode = null; save(); this._saveTeams(); return { ok: true };
    },
    disbandTeam() {
      load(); this._loadTeams(); const team = this.myTeam(); if (!team) return { ok: false, msg: '你不在队伍里' };
      if (team.leader !== S.uid) return { ok: false, msg: '只有队长可以解散队伍' };
      delete this._teams[team.code]; S.teamCode = null; save(); this._saveTeams(); return { ok: true, disbanded: true };
    },
    teamLink(base) {
      load(); const T = C.team, team = this.myTeam(); if (!team) return '';
      const u = new URL(base || location.href); u.searchParams.delete('level'); u.searchParams.delete('boss'); u.searchParams.delete('god');
      u.searchParams.delete(C.share.linkParam); u.searchParams.set(T.linkParam, team.code);
      u.hash = 'team'; return u.toString();
    },
    handleTeamParam() {
      load(); const T = C.team; if (!T) return null;
      const code = new URLSearchParams(location.search).get(T.linkParam);
      if (!code) return null;
      return Object.assign({ via: 'link' }, this.joinTeam(code));
    },
    _member(team, uid) { return team.members.find(m => m.uid === uid); },
    teamContribute(opt) {
      load(); const T = C.team, team = this.myTeam(); if (!T || !team) return null;
      opt = opt || {}; const kind = opt.kind || 'game';
      const units = (T.contrib && T.contrib[kind]) || (kind === 'game' ? 1 : 0);
      const me = this._member(team, S.uid); if (!me) return null;
      if (units) {
        me.raw += units; team.raw += units;
        if (kind === 'game') { me.games++; this._track('teamGames', 1); }
        if (kind === 'quizDone') me.quiz++;
        if (kind === 'storeScan') me.scan++;
      }
      if (opt.damage) this._addDamage(team, me, opt.damage);
      this._saveTeams();
      const ev = this._bossEvent(team);
      return { team, units, effective: this.teamEffective(team), bonus: this._teamBonus(team.members.length), boss: ev };
    },
    teamAddDamage(n) {
      load(); const team = this.myTeam(); if (!team || !n) return null;
      const me = this._member(team, S.uid); if (!me) return null;
      this._addDamage(team, me, n); this._saveTeams(); return this._bossEvent(team);
    },
    _addDamage(team, me, n) { n = Math.max(0, Math.round(n)); if (!n) return; me.damage = (me.damage || 0) + n; team.damage = (team.damage || 0) + n; },
    _bossEvent(team) {
      const T = C.team, hp = T.bossHp || 0;
      if (!hp || team.bossDown || team.damage < hp) return { down: !!team.bossDown, hp, damage: team.damage || 0 };
      team.bossDown = true; this._saveTeams();
      /* 全队共享击破奖励：给当前玩家立即入账，其他真人队员下次打开时领取 */
      const pts = T.bossReward || 0;
      if (pts) earn(pts, '队伍共同击败 Boss');
      team.paid = team.paid || {}; team.paid.boss = team.paid.boss || [];
      if (team.paid.boss.indexOf(S.uid) < 0) team.paid.boss.push(S.uid);
      save(); this._saveTeams();
      return { down: true, just: true, points: pts, hp, damage: team.damage };
    },
    teamBoss() { const T = C.team, t = this.myTeam(); if (!T || !t) return null; return { hp: T.bossHp, damage: t.damage || 0, left: Math.max(0, T.bossHp - (t.damage || 0)), down: !!t.bossDown }; },
    claimTeamMilestone(id) {
      load(); const T = C.team, team = this.myTeam(); if (!team) return { ok: false, msg: '你不在队伍里' };
      const ms = (T.milestones || []).find(x => x.id === id); if (!ms) return { ok: false, msg: '没有这个里程碑' };
      if (this.teamEffective(team) < ms.progress) return { ok: false, msg: '队伍进度还没到' };
      team.claimed = team.claimed || {}; team.paid = team.paid || {}; team.paid[id] = team.paid[id] || [];
      if (team.paid[id].indexOf(S.uid) >= 0) return { ok: false, msg: '已经领过了' };
      team.claimed[id] = team.claimed[id] || Date.now();
      team.paid[id].push(S.uid);
      const n = earn(ms.points, '队伍里程碑：' + ms.name);
      save(); this._saveTeams();
      return { ok: true, points: n, milestone: ms };
    },
    collectTeamRewards() {
      load(); const T = C.team, team = this.myTeam(); if (!T || !team) return 0;
      let got = 0; team.paid = team.paid || {};
      (T.milestones || []).forEach(ms => {
        if (this.teamEffective(team) < ms.progress) return;
        team.claimed[ms.id] = team.claimed[ms.id] || Date.now();
        team.paid[ms.id] = team.paid[ms.id] || [];
        if (team.paid[ms.id].indexOf(S.uid) >= 0) return;
        team.paid[ms.id].push(S.uid); got += earn(ms.points, '队伍里程碑：' + ms.name);
      });
      if (team.bossDown) {
        team.paid.boss = team.paid.boss || [];
        if (team.paid.boss.indexOf(S.uid) < 0) { team.paid.boss.push(S.uid); got += earn(T.bossReward || 0, '队伍共同击败 Boss'); }
      }
      if (got) { save(); this._saveTeams(); }
      return got;
    },
    inviteMock() {
      load(); const T = C.team, team = this.myTeam(); if (!team) return { ok: false, msg: '先创建或加入一支队伍' };
      const used = team.members.filter(m => m.isBot).map(m => m.nick);
      const name = (T.mock.names || []).find(n => used.indexOf(n) < 0);
      if (!name) return { ok: false, msg: '模拟队友已经到齐' };
      if (team.members.length >= T.maxMembers) return { ok: false, msg: '队伍已满' };
      const bot = { uid: 'BOT-' + rid(6), nick: name, isBot: true, raw: 0, games: 0, quiz: 0, scan: 0, damage: 0, joined: Date.now() };
      const units = (T.contrib && T.contrib.game) || 1;
      bot.raw += units; bot.games += 1; team.raw += units;
      this._addDamage(team, bot, 500);
      team.members.push(bot); this._saveTeams();
      this._ensureMockTick();
      return { ok: true, member: bot, team };
    },
    /* 模拟队友过一会儿贡献进度 / 伤害（只加在 bot 身上，标明模拟） */
    _mockTimer: 0,
    _ensureMockTick() {
      if (this._mockTimer) return;
      const step = () => {
        const T = C.team, team = this.myTeam();
        if (!T || !team) { this._mockTimer = 0; return; }
        const bots = team.members.filter(m => m.isBot);
        if (!bots.length) { this._mockTimer = 0; return; }
        const bot = bots[(Math.random() * bots.length) | 0];
        const units = T.contrib.game || 1;
        bot.raw += units; bot.games++; team.raw += units;
        const dmg = 400 + ((Math.random() * 800) | 0);
        this._addDamage(team, bot, dmg);
        this._bossEvent(team);
        this._saveTeams();
        this._mockTimer = setTimeout(step, T.mock.contribEveryMs || 2400);
      };
      this._mockTimer = setTimeout(step, (C.team.mock && C.team.mock.joinDelayMs) || 1200);
    },
    teamBoard() {
      this._loadTeams();
      const mine = this.myTeam();
      const live = Object.values(this._teams).map(t => ({ name: t.name, members: t.members.length, progress: this.teamEffective(t), me: !!(mine && mine.code === t.code), code: t.code }));
      const mock = (C.team.leaderboard.mock || []).map(m => ({ ...m, me: false }));
      const rows = live.concat(mock).sort((a, b) => b.progress - a.progress);
      return rows.slice(0, C.team.leaderboard.size).map((r, i) => ({ ...r, rank: i + 1 }));
    },
    teamInfo() {
      const T = C.team, t = this.myTeam(); if (!t) return { team: null, cfg: T };
      const eff = this.teamEffective(t), bonus = this._teamBonus(t.members.length);
      const next = (T.milestones || []).find(ms => eff < ms.progress);
      return { team: t, cfg: T, effective: eff, bonus, next, boss: this.teamBoss(), board: this.teamBoard() };
    },

    leaderboard() {
      load();
      const t = this.tier();
      const rows = C.leaderboard.mock.map(m => ({ ...m, me: false }));
      rows.push({ name: S.nick + '（我）', score: S.best, me: true, gold: t.id === 'gold' });
      rows.sort((a, b) => b.score - a.score);
      return rows.slice(0, C.leaderboard.size).map((r, i) => ({ ...r, rank: i + 1 })).concat(rows.findIndex(r => r.me) >= C.leaderboard.size ? [{ ...rows.find(r => r.me), rank: rows.findIndex(r => r.me) + 1 }] : []);
    },
    reset() { localStorage.removeItem(KEY); localStorage.removeItem(INBOX); S = null; load(); save(); },
    resetTeams() { localStorage.removeItem(TEAM_KEY); this._teams = null; },
  };
  window.Ops = Ops;
})();
