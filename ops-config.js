/* =============================================================================
 * 运营规则总配置（平台页 + 所有游戏共用）
 * -----------------------------------------------------------------------------
 * 改积分、加场、抽奖、奖品、权益等级、签到奖励，都只改这个文件。
 * ⚠ 演示用：所有状态存在浏览器 localStorage，可被用户篡改。
 *   正式活动必须由后端记账、防刷、风控、发奖，前端只做展示。
 * ⚠ 奖品与概率均为「示例」，请替换为经法务/财务审核的正式配置，
 *   并按当地法规公示中奖概率与奖品数量。
 * ⚠ 本演示不收集手机号、身份证等个人信息，不涉及支付，不发放真实奖品。
 * ========================================================================== */
window.OPS_CONFIG = {
  version: '2026.11-demo',
  campaignName: '芯片争霸 · Intel 新品上市季',
  demoBanner: '演示用，正式活动需后端防刷与发奖',
  storageKey: 'ops_demo_state_v1',

  /* ---------- 1. 游戏内积分 ---------- */
  points: {
    perKill: 10,          // 击落普通杂讯
    perElite: 30,         // 击落精英（会射击的）
    perPowerup: 5,        // 拾取强化道具
    perBoss: 500,         // 击败 Boss
    perLevelClear: 200,   // 通关一关
    noHitBonus: 300,      // 一关内未受伤
    perGameCap: 3000,     // 单局最多入账
    dailyCap: 6000,       // 每日游戏积分最多入账（签到/分享/邀请奖励不占此额度）
  },

  /* ---------- 2. 每日场次 ---------- */
  plays: {
    dailyFree: 3,             // 每日免费场次（铜牌）
    perShare: 1,              // 每次分享 +1 场
    maxShareBonusPerDay: 3,   // 每日最多通过分享加 3 场
  },

  /* ---------- 3. 分享与邀请（裂变） ---------- */
  share: {
    pointsPerShare: 50,          // 分享奖励积分
    maxRewardedSharesPerDay: 3,  // 每日前 3 次分享有奖励
    inviterBonus: 200,           // 好友经你的链接完成首局 → 你得 200
    inviteeWelcome: 100,         // 被邀请的新玩家首局完成得 100 新人礼
    maxInvitesPerDay: 10,        // 每日最多计 10 位有效邀请
    linkParam: 'inviter',        // 分享链接参数：?inviter=邀请码
  },

  /* ---------- 4. 每日签到（连续） ---------- */
  checkin: {
    rewards: [20, 30, 40, 50, 60, 80, 150], // 第 1~7 天；第 8 天起按第 7 天发放
    day7ExtraPlay: 1,                        // 连签满 7 天当天额外 +1 场
    breakResets: true,                       // 断签从第 1 天重新算
  },

  /* ---------- 5. 积分抽奖 ---------- */
  lottery: {
    costPerDraw: 300,     // 每次抽奖消耗积分（银/金有折扣，见权益）
    dailyDrawCap: 10,     // 每日最多抽 10 次
    disclaimer: '示例奖品与概率，请替换为正式配置',
    /* probability 之和必须为 1；kind: points=积分直接回馈, virtual=数字权益, coupon=券, physical=实物, none=未中奖 */
    prizes: [
      { id: 'p0', tier: '特等奖', name: '示例：新品 AI PC 一台', kind: 'physical', probability: 0.001, color: '#ffd166' },
      { id: 'p1', tier: '一等奖', name: '示例：品牌机械键盘',     kind: 'physical', probability: 0.009, color: '#ff6bd6' },
      { id: 'p2', tier: '二等奖', name: '示例：50 元电商满减券',  kind: 'coupon',   probability: 0.05,  color: '#a78bfa' },
      { id: 'p3', tier: '三等奖', name: '示例：限定芯片壁纸包',   kind: 'virtual',  probability: 0.14,  color: '#00c7fd' },
      { id: 'p4', tier: '四等奖', name: '积分回馈 +150',          kind: 'points',   probability: 0.25,  color: '#3dff9a', points: 150 },
      { id: 'p5', tier: '谢谢参与', name: '再接再厉，芯火不灭',   kind: 'none',     probability: 0.55,  color: '#5b6b8c' },
    ],
  },

  /* ---------- 6. 权益等级（按累计获得积分，花掉不降级） ---------- */
  tiers: [
    { id: 'bronze', name: '铜芯玩家', min: 0,    color: '#d08a4f', icon: '🥉',
      perks: ['每日 3 场免费', '积分抽奖原价'], extraDailyPlays: 0, drawDiscount: 1 },
    { id: 'silver', name: '银芯玩家', min: 2000, color: '#c9d6ea', icon: '🥈',
      perks: ['每日 +1 免费场', '抽奖 9 折', '解锁银色芯片皮肤'], extraDailyPlays: 1, drawDiscount: 0.9 },
    { id: 'gold',   name: '金芯玩家', min: 6000, color: '#ffd166', icon: '🥇',
      perks: ['每日 +2 免费场', '抽奖 8 折', '金色芯片皮肤', '排行榜金色标识'], extraDailyPlays: 2, drawDiscount: 0.8 },
  ],

  /* ---------- 7. 排行榜（演示为本地 + 模拟数据） ---------- */
  leaderboard: {
    size: 10,
    mock: [
      { name: '摩尔定律守门员', score: 9820 },
      { name: '18A 冲冲冲', score: 8640 },
      { name: '晶圆上的猫', score: 7710 },
      { name: '超频不加电', score: 6520 },
      { name: '散热硅脂侠', score: 5480 },
      { name: '能效比狂魔', score: 4390 },
      { name: '小核也有梦', score: 3260 },
      { name: '封装艺术家', score: 2150 },
      { name: '待机功耗 0W', score: 1240 },
    ],
  },

  /* ---------- 8. 运营策略（展示在「活动规则」里，供方案沟通） ---------- */
  strategy: {
    phases: [
      { name: '预热期（D-7 ~ D-1）', text: '发布会倒计时 + 签到攒积分，提前锁定种子用户；分享海报带邀请码。' },
      { name: '爆发期（D0 ~ D+7）', text: '新品上线当天开放全部 3 关，Boss 战掉落双倍积分；每日排行榜前 10 送示例数字权益。' },
      { name: '长尾期（D+8 ~ D+30）', text: '抽奖持续开放，银/金权益拉复访；把高分玩家导向官方商城/门店核销。' },
    ],
    kpis: ['参与人数 / 新增', '人均局数与时长', '分享率与 K 因子（每人带来的新玩家）', '抽奖参与率', '券核销率 / 进店量'],
    antiAbuse: [
      '正式版积分由服务端按局校验（时长、击杀数合理区间、签名）',
      '同设备/同账号每日上限，邀请需好友真实完成首局才计',
      '抽奖结果服务端生成，前端只播动画；奖品库存与发放在后端',
    ],
  },

  /* ---------- 9. 任务中心（每日 / 每周 / 成就） ----------
   * metric 由 ops-engine 自动统计：
   *   games 完成局数 | kills 击落数 | bossKills 击败 Boss 数 | levelClears 通关关数 | allClear 全通关次数
   *   procMax 本局最高制程档位（0=Intel 7 … 4=18A，取最大值）| shares 分享次数 | checkins 签到次数
   *   checkinStreak 连续签到天数（取最大值）| draws 抽奖次数 | productViewed 看完产品介绍
   *   codeRedeems 输入平台口令次数 | worksApproved 投稿作品审核通过数
   * action: 'code' / 'post' 的任务在任务中心里直接带输入框（口令 / 作品链接）。
   * 合规：奖励只挂在「完成动作」（找到口令、发布作品）上，不挂在分享、关注上。
   * 任务奖励积分不占「每日游戏积分上限」。 */
  missions: {
    daily: [
      { id: 'd_play1',  name: '今日出战',       desc: '完成 1 局游戏',       metric: 'games',    target: 1,  points: 30 },
      { id: 'd_kill50', name: '杂讯清道夫',     desc: '累计击落 50 个杂讯',  metric: 'kills',    target: 50, points: 50 },
      { id: 'd_code',   name: '平台口令',       desc: '去抖音 / B站官方号视频里找到今日口令并输入', metric: 'codeRedeems', target: 1, points: 40, action: 'code' },
      { id: 'd_check',  name: '每日签到',       desc: '完成今日签到',         metric: 'checkins', target: 1,  points: 20 },
    ],
    weekly: [
      { id: 'w_play10', name: '本周勤练',       desc: '本周完成 10 局',       metric: 'games',     target: 10, points: 200 },
      { id: 'w_boss5',  name: 'Boss 猎人',      desc: '本周击败 5 个 Boss',   metric: 'bossKills', target: 5,  points: 300 },
      { id: 'w_post',   name: '作品投稿',       desc: '发布带活动话题的录屏 / 图文，提交作品链接', metric: 'worksApproved', target: 1, points: 300, action: 'post' },
    ],
    achievements: [
      { id: 'a_boss1',   name: '首胜',          desc: '击败首个 Boss',              metric: 'bossKills',     target: 1, points: 200 },
      { id: 'a_18a',     name: '制程登顶',      desc: '一局内把制程升级到 18A',     metric: 'procMax',       target: 4, points: 300, max: true },
      { id: 'a_allclr',  name: '新芯制霸',      desc: '通关全部 3 关',              metric: 'allClear',      target: 1, points: 500 },
      { id: 'a_streak3', name: '连续打卡 3 天', desc: '连续签到 3 天',              metric: 'checkinStreak', target: 3, points: 150, max: true },
      { id: 'a_product', name: '懂芯玩家',      desc: '看完产品介绍（6 张卖点卡）', metric: 'productViewed', target: 1, points: 100 },
      { id: 'a_draw1',   name: '试试手气',      desc: '完成首次抽奖',               metric: 'draws',         target: 1, points: 50 },
    ],
  },

  /* ---------- 9b. 平台口令 / 作品投稿（任务中心用） ----------
   * 演示：口令在前端比对、作品链接只校验域名并自动通过。
   * 正式版：口令由运营后台按天下发、服务端校验；作品由平台接口或人工核验归属后再发奖。 */
  platformCode: {
    codes: ['芯运2026', 'KAIROS'],                    // 示例口令（不区分大小写）
    hint: '在抖音 / B站搜索「Kairos 芯运」，官方视频结尾或置顶评论里有今日口令（演示口令：芯运2026）',
    dailyCap: 1,
  },
  works: {
    topic: '#新芯争霸#',
    hosts: ['douyin.com', 'iesdouyin.com', 'bilibili.com', 'b23.tv', 'xiaohongshu.com', 'xhslink.com'],
    hint: '在抖音 / B站 / 小红书发布带 #新芯争霸# 的游戏录屏或图文，把作品链接贴到这里',
    weeklyCap: 3,
  },

  /* ---------- 10. 门店引流 / 测试裂变 玩法的任务奖励 ---------- */
  tasks: {
    storeScan:  { name: '到店扫码打卡（演示）', points: 100 },   // 每日 1 次
    quizDone:   { name: '完成芯片人格测试',     points: 50 },    // 每日 1 次
  },
  store: {
    couponCost: 200,                                   // 积分兑换到店券
    couponName: '示例：到店体验满 300 减 50 券',
    couponValidDays: 7,
    storeName: '示例：Intel 体验店（XX 广场店）',
  },

  /* ---------- 11. 平台可推荐的玩法模板 ---------- */
  formats: {
    'chip-3d':      { name: '3D 芯片闯关', url: 'games/chip-3d.html',      goals: ['新品上市', '拉新', '促活', '发布会'], tag: '3D · 闯关 · Boss 战' },
    'store-coupon': { name: '签到积分抽奖 + 门店核销券', url: 'games/store-coupon.html', goals: ['门店引流', '到店', '核销', '线下'], tag: '签到 · 抽奖 · 核销' },
    'poster-quiz':  { name: 'AI 芯片人格测试 + 分享海报', url: 'games/poster-quiz.html',  goals: ['品牌曝光', '裂变', '转发', '传播'], tag: '测试 · 海报 · 裂变' },
  },
};
