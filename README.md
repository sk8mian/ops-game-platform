# 运营游戏工坊 · AI 运营专家（演示版）

纯静态网页，无后端。用手机或电脑浏览器打开 `index.html` 即可（建议用任意静态服务器托管，如 `python3 -m http.server`；直接双击打开也能运行）。

## 文件
| 文件 | 作用 |
|---|---|
| `index.html` | 平台页：AI 运营专家对话。电脑版（≥1200px）三栏：左侧历史对话/我的活动/任务中心，中间对话，右侧手机预览；手机版为抽屉菜单 + 全屏预览 |
| `ops-config.js` | **全部运营规则**：积分、每日场次、分享/邀请、签到、抽奖奖品与概率、权益等级、排行榜、运营节奏、门店券、**任务中心 `missions`**（每日/每周/成就） |
| `ops-engine.js` | 规则执行引擎（localStorage 记账）。正式上线把这里的方法换成后端接口 |
| `ops-ui.js` | 共用组件：活动规则、我的权益、抽奖转盘、分享海报（含二维码） |
| `ai-client.js` | 模型接入（OpenAI 兼容 `/chat/completions`）与预设列表 |
| `games/chip-3d.html` | 3D 芯片闯关（three.js）：主菜单、暂停菜单、任务中心、产品介绍（可旋转/拆解 3D 芯片 + 卖点卡）、排行榜、我的权益、设置。顶部 `CONFIG` 改名字 / 文案 / 配色 / 难度，`CONFIG.product` 改产品介绍 |
| `games/store-coupon.html` | 门店引流：签到 + 到店打卡 + 积分换券 + 核销演示 |
| `games/poster-quiz.html` | 曝光裂变：芯片人格测试 + 分享海报（接入模型后 AI 生成解读） |
| `vendor/` | three.js r170（含 bloom 后处理，本地打包）、qrcode-generator，均 MIT |

## 对话流程（不反问）
1. 说一句需求（缺的信息按默认补齐，用一行写明假设）→ 立刻给 **3 张方向卡**：A 3D 动作闯关 / B AI 互动测试 / C 轻量签到抽奖裂变。每张含名称、一句话概念、为什么适合、核心循环、运营机制、包含模块、目标 KPI、工作量。
2. 点「选这个方向」→ 展开为完整活动配置 + 设计说明（菜单、任务清单、产品介绍、规则、奖励、运营节奏），并自动打开对应游戏预览（电脑版在右栏，另有「🖥 电脑版」宽屏预览）。
3. 接入模型后，模型按 `SYSTEM_PROMPT` 先返回 `{"type":"directions",...}`，用户选择后返回 `{"type":"campaign",...}`；演示引擎输出相同结构。

## 3D 游戏操作
- 手机：拖动移动，自动开火，点「NPU 爆发」清屏。
- 电脑：WASD/方向键移动，或鼠标跟随（设置里可关）；空格/右键 NPU；Esc/P 暂停；M 静音；主菜单按 Enter 开始。切到后台自动暂停。
- 每种道具本局首次拾取弹出卖点小卡，「了解」跳到产品介绍对应卖点（`CONFIG.product.powerupLink`）。

## 手机端（主场景）
- **操控**：触屏默认「左手浮动摇杆 + 右手 NPU 大按钮」，可同时按；设置 → 触屏操控 可切换「拖动」模式。左半屏任意位置按下即出现摇杆，超出半径底座跟随手指。
- **触控目标** ≥44px；`viewport-fit=cover` + `env(safe-area-inset-*)` 适配刘海 / 灵动岛 / Home 条 / 横屏左右安全区。
- **竖屏为主，横屏可玩**：横屏时 HUD 更紧凑、主菜单左右两栏、暂停菜单两列；开局尝试 `screen.orientation.lock('portrait')`（不支持时静默忽略）。
- **防误操作**：游戏页 `touch-action:none`、`overscroll-behavior:none`、`user-select:none`、屏蔽长按菜单 / 双击与双指缩放 / 下拉刷新；面板内仍可滚动。
- **微信 / App 内置浏览器**：不依赖全屏 API；首次触摸解锁音频（含 `WeixinJSBridgeReady`）；切后台 / 来电 / `pagehide` 自动暂停并挂起音频；微信内分享面板提示“右上角 ··· 分享”。
- **震动反馈**：受击、NPU、拾取道具、击败 Boss、下滑关闭抽屉时 `navigator.vibrate`（iOS 不支持则无；设置里可关）。
- **底部抽屉**：任务 / 排行 / 设置 / 暂停 / 抽奖 / 分享 / 规则 / 权益在手机上都是底部抽屉，按住把手或内容顶部下滑关闭。
- **海报保存**：海报为 `<img>`（JPEG），提示“长按海报 → 保存图片 / 发送给朋友”。
- **性能**：DPR 上限 2（手机自动档 1.75）；低端机（≤4 核 / ≤3GB / 360 宽小屏）自动 1.25 DPR、泛光 ¼ 分辨率、粒子减半；掉帧到 32fps 以下自动降级。three.js 改为按需打包（706KB → 530KB，gzip 134KB），二维码库改为分享时才加载。
- **平台页（手机）**：输入框用 `visualViewport` 贴在键盘上方；3 张方向卡为横向滑动轮播（带圆点指示，可点圆点切换）；极矮可视区（横屏 + 键盘）只保留对话和输入框。

## 任务中心
`ops-config.js` → `missions.daily / weekly / achievements`，每项 `{id, name, desc, metric, target, points}`。metric 由引擎自动统计：`games kills bossKills levelClears allClear procMax checkins checkinStreak shares draws productViewed`。每日 0 点、每周一重置；任务奖励不占每日游戏积分上限。完成后在任务中心点「领取」入账。

## 产品介绍文案
`games/chip-3d.html` 的 `CONFIG.product`：`name / tagline / disclaimer / features[]`（CPU、GPU、NPU、制程、能效、AI 算力，各含 title/short/text/spec）。当前均为 **示例文案，请替换为官方参数**。看完 6 个卖点解锁成就。

## 本机存储（localStorage）
`ops_demo_state_v1`（积分/任务进度）、`ops_sessions_v1`（历史对话）、`ops_campaigns_v1`（我的活动）、`ops_ai_settings_v2`（模型设置）、`chip3d_settings`（画质/震屏/鼠标跟随/触屏操控 stick|drag/震动）、`chip3d_product_seen`。

## 接模型
平台页右上角 ⚙ → 选预设（默认 **GPT-6.2 Astra / `gpt-6.2-astra` / `https://api.openai.com/v1`**）→ 填 API Key → 保存。
字段：API Base URL、模型 ID、API Key、Temperature、启用开关。请求 = `Base URL + /chat/completions`。
- Key 只存本机 localStorage；**前端放 Key 仅限演示**，正式请走自己的后端代理。
- 部分厂商禁止浏览器直连（CORS），失败时会显示原因并自动回退到内置演示规则引擎。
- 系统提示词在 `index.html` 的 `SYSTEM_PROMPT`，设置面板里也可查看。

## 调试参数（chip-3d.html）
`?level=3` 直接第 3 关；`&boss=1` 跳过小怪直接 Boss；`&god=1` 无敌；`?inviter=邀请码` 模拟好友通过邀请链接进入。

⚠ 演示用：积分、抽奖都在前端，可被篡改。正式活动需后端防刷、服务端抽奖与发奖；奖品与概率为示例，需替换并公示。不收集个人信息、无支付、无真实奖品。Boss 为戏仿代称，勿替换为真实竞品商标。
