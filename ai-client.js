/* 模型接入（OpenAI 兼容 /chat/completions）。
 * 设置只存本机 localStorage。⚠ 前端页面放 API Key 仅限演示；
 * 正式上线请把调用放到你自己的后端代理里，前端不接触 Key。 */
(function () {
  'use strict';
  const KEY = 'ops_ai_settings_v2';
  const PRESETS = [
    { id: 'astra', label: 'GPT-6.2 Astra', short: 'Astra 6.2', model: 'gpt-6.2-astra', base: 'https://api.openai.com/v1', note: '默认 · 3D 玩法策划最强' },
    { id: 'sol', label: 'GPT-6.2 Sol', short: 'Sol 6.2', model: 'gpt-6.2-sol', base: 'https://api.openai.com/v1', note: '便宜' },
    { id: 'fable', label: 'Claude Fable 5.2', short: 'Fable 5.2', model: 'claude-fable-5-2', base: 'https://api.anthropic.com/v1/', note: 'OpenAI 兼容层，仅建议测试' },
    { id: 'opus', label: 'Claude Opus 5.5', short: 'Opus 5.5', model: 'claude-opus-5-5', base: 'https://api.anthropic.com/v1/', note: 'OpenAI 兼容层' },
    { id: 'qwen', label: 'Qwen4-Max', short: 'Qwen4-Max', model: 'qwen4-max', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', note: '国内可用' },
    { id: 'kimi', label: 'Kimi K3.1 Pro', short: 'Kimi K3.1', model: 'kimi-k3.1-pro', base: 'https://api.moonshot.cn/v1', note: '国内可用' },
    { id: 'deepseek', label: 'DeepSeek Flash', short: 'DS Flash', model: 'deepseek-flash', base: 'https://api.deepseek.com', note: '预算档' },
    { id: 'custom', label: '自定义（任意 OpenAI 兼容接口）', short: '自定义', model: '', base: '', note: '自建代理 / 其他厂商' },
  ];
  const DEFAULTS = { preset: 'astra', base: PRESETS[0].base, model: PRESETS[0].model, key: '', temperature: 0.7, enabled: true };

  function get() { try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return Object.assign({}, DEFAULTS); } }
  function set(v) { localStorage.setItem(KEY, JSON.stringify(Object.assign(get(), v))); }
  function configured() { const s = get(); return !!(s.enabled && s.key && s.base && s.model); }
  function label() { const s = get(); const p = PRESETS.find(x => x.id === s.preset); return p && p.id !== 'custom' && p.model === s.model ? p.short : (s.model || '未设置'); }
  function endpoint(base) { return base.replace(/\/+$/, '') + '/chat/completions'; }

  async function chat(messages, opts) {
    opts = opts || {};
    const s = get();
    if (!configured()) { const e = new Error('未配置模型（缺少 API Key）'); e.kind = 'config'; throw e; }
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), opts.timeout || 30000);
    const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.key };
    if (/anthropic\.com/.test(s.base)) headers['anthropic-dangerous-direct-browser-access'] = 'true';
    let res;
    try {
      res = await fetch(endpoint(s.base), { method: 'POST', headers, signal: ctrl.signal, body: JSON.stringify({ model: s.model, messages, temperature: +s.temperature || 0.7, max_tokens: opts.maxTokens || 1200 }) });
    } catch (err) {
      clearTimeout(to);
      const e = new Error(err.name === 'AbortError' ? '请求超时' : '网络错误或被浏览器 CORS 拦截（该厂商可能不允许网页直连，请改用自己的后端代理）');
      e.kind = 'network'; throw e;
    }
    clearTimeout(to);
    if (!res.ok) { let t = ''; try { t = (await res.text()).slice(0, 200); } catch (x) {} const e = new Error('HTTP ' + res.status + (res.status === 401 ? '（Key 无效）' : res.status === 404 ? '（模型名或地址不对）' : res.status === 429 ? '（限流/额度不足）' : '') + (t ? '：' + t : '')); e.kind = 'http'; throw e; }
    const j = await res.json();
    const c = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!c) { const e = new Error('返回格式不是 OpenAI 兼容格式'); e.kind = 'format'; throw e; }
    return c;
  }
  function extractJSON(text) {
    const m = String(text).replace(/```json|```/g, '').match(/\{[\s\S]*\}/); if (!m) throw new Error('模型没有返回 JSON');
    return JSON.parse(m[0]);
  }
  window.AIClient = { PRESETS, get, set, configured, label, chat, extractJSON, endpoint };
})();
