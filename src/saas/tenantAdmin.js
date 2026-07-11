import './saasStyles.css';

const app = document.querySelector('#tenant-app');

// ==================== State ====================
const state = {
  authed: !!sessionStorage.getItem('tenant-token'),
  token: sessionStorage.getItem('tenant-token') || '',
  admin: null,
  tenant: null,
  loading: false,
  section: 'dashboard',
  // 看板数据
  dashboard: null,
  // 广告配置
  adConfig: { ad_unit_id: '', ad_name: '激励视频广告', status: 1 },
  saveAdMsg: '',
  // 支付配置
  payConfig: { mch_id: '', mch_key: '', app_id: '', app_secret: '', notify_url: '', pay_enabled: 0 },
  savePayMsg: '',
  // 小程序配置
  miniappMsg: '',
};

const API_BASE = '/api/tenant_admin';

// ==================== Helpers ====================
function money(cents) {
  return `¥${(Number(cents || 0) / 100).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function formatTime(ts) {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString('zh-CN');
}

function setState(patch) {
  Object.assign(state, patch);
  render();
}

async function apiCall(method, path, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (state.token) opts.headers['Authorization'] = `Bearer ${state.token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json();
  if (data.code === 1) return data.data || data;
  if (res.status === 401) {
    sessionStorage.removeItem('tenant-token');
    setState({ authed: false, token: '' });
  }
  throw new Error(data.msg || '请求失败');
}

// ==================== API ====================
async function doLogin(tenantCode, username, password) {
  const data = await apiCall('POST', '/login', { tenant_code: tenantCode, username, password });
  const token = data.token;
  sessionStorage.setItem('tenant-token', token);
  setState({ authed: true, token, admin: data.admin, tenant: data.tenant });
  loadDashboard();
}

async function loadProfile() {
  try {
    const data = await apiCall('GET', '/profile');
    setState({ admin: data.admin, tenant: data.tenant });
  } catch (e) { /* ignore */ }
}

async function loadDashboard() {
  setState({ loading: true });
  try {
    const data = await apiCall('GET', '/dashboard');
    setState({ dashboard: data, loading: false });
  } catch (e) {
    setState({ loading: false });
  }
}

async function loadAdConfig() {
  try {
    const data = await apiCall('GET', '/getAdConfig');
    setState({ adConfig: data });
  } catch (e) { /* ignore */ }
}

async function loadPayConfig() {
  try {
    const data = await apiCall('GET', '/getPayConfig');
    setState({ payConfig: data });
  } catch (e) { /* ignore */ }
}

// ==================== Render ====================
function renderLogin() {
  app.innerHTML = `
    <main class="saas-login">
      <form class="saas-login-card" onsubmit="window.tenantApp.login(event)">
        <h1>🔑 租户管理中心</h1>
        <p>登录管理你的小程序后台</p>
        <label>租户标识<input name="tenant_code" placeholder="由平台管理员提供" autocomplete="off" /></label>
        <label>账号<input name="username" autocomplete="username" /></label>
        <label>密码<input name="password" type="password" autocomplete="current-password" /></label>
        <button type="submit">登录</button>
      </form>
    </main>
  `;
}

function renderSidebar() {
  const items = [
    ['dashboard', '📊 数据看板'],
    ['miniapp', '📱 小程序配置'],
    ['settings', '⚙️ 运营设置'],
    ['ads', '📺 广告配置'],
    ['payment', '💳 支付配置'],
  ];
  return `
    <aside class="saas-sidebar">
      <div class="saas-sidebar-header">
        <strong>${escapeHtml(state.tenant?.tenant_name || '租户中心')}</strong>
        <small>${escapeHtml(state.admin?.nickname || state.admin?.username || '')}</small>
      </div>
      <nav>
        ${items.map(([id, label]) => `
          <a class="${state.section === id ? 'active' : ''}" onclick="window.tenantApp.openSection('${id}')">${label}</a>
        `).join('')}
      </nav>
      <div class="saas-sidebar-footer">
        <button onclick="window.tenantApp.logout()">退出登录</button>
      </div>
    </aside>
  `;
}

function renderDashboard() {
  const d = state.dashboard;
  if (!d) return '<div class="saas-content-loading">加载中...</div>';

  return `
    <div class="saas-dashboard">
      <h2>📊 数据看板</h2>
      <div class="saas-metric-grid">
        <article><small>总用户数</small><strong>${d.counters.total_users}</strong></article>
        <article><small>今日新增</small><strong>${d.counters.today_users || 0}</strong></article>
        <article><small>会员用户</small><strong>${d.counters.paid_users}</strong></article>
        <article><small>累计营收</small><strong>${money(d.counters.revenue_cents)}</strong></article>
        <article><small>邀请人数</small><strong>${d.counters.invite_count}</strong></article>
        <article><small>广告次数</small><strong>${d.counters.ad_watch_count}</strong></article>
        <article><small>发放分钟</small><strong>${d.counters.granted_minutes}</strong></article>
      </div>

      ${d.settings ? `
        <div class="saas-panel" style="margin-top:20px;">
          <h3>当前运营配置</h3>
          <div class="saas-detail-grid">
            <div><label>新用户免费时长</label><span>${d.settings.new_user_free_minutes} 分钟</span></div>
            <div><label>邀请好友奖励</label><span>${d.settings.invite_reward_minutes} 分钟</span></div>
            <div><label>观看广告奖励</label><span>${d.settings.ad_reward_minutes} 分钟</span></div>
          </div>
        </div>
      ` : ''}

      ${d.plans && d.plans.length > 0 ? `
        <div class="saas-panel" style="margin-top:20px;">
          <h3>会员套餐</h3>
          <div class="saas-plan-grid">
            ${d.plans.map(p => `
              <div class="saas-plan-card">
                <strong>${escapeHtml(p.name)}</strong>
                <span>${money(p.price_cents)} / ${p.duration_days} 天</span>
                <small>${p.status ? '已启用' : '已停用'}</small>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderMiniappConfig() {
  const t = state.tenant;
  const { miniappMsg, loading } = state;
  return `
    <div class="saas-section">
      <h2>📱 小程序配置</h2>
      <p style="color:#64748b;margin-bottom:20px;">
        填写你的微信小程序 AppID 和 AppSecret，配置后小程序即可连接到此后台。
      </p>
      <div class="saas-panel">
        <form onsubmit="window.tenantApp.saveMiniappConfig(event)">
          <div class="saas-form-grid">
            <label>
              <span>小程序 AppID</span>
              <input name="miniapp_appid" value="${escapeHtml(t?.miniapp_appid || '')}" placeholder="wx..." />
            </label>
            <label>
              <span>小程序 AppSecret</span>
              <input name="miniapp_secret" type="password" value="${escapeHtml(t?.miniapp_secret || '')}" placeholder="小程序密钥" />
            </label>
          </div>
          <div class="saas-form-actions" style="margin-top:16px;">
            <button type="submit" class="saas-btn-primary">${loading ? '保存中...' : '保存小程序配置'}</button>
            ${miniappMsg ? `<span class="saas-form-msg" style="color:#087443;">${miniappMsg}</span>` : ''}
          </div>
        </form>
        <div style="margin-top:16px;padding:14px;background:#f0f7ff;border-radius:8px;font-size:13px;color:#475569;">
          <strong>💡 部署指引：</strong>
          <ol style="margin:8px 0 0 16px;padding:0;">
            <li>在微信公众平台注册小程序，获取 AppID 和 AppSecret</li>
            <li>将上述信息填入并保存</li>
            <li>在小程序后台配置服务器域名白名单（request合法域名）</li>
            <li>将小程序代码中的 API 地址指向本服务器</li>
            <li>提交小程序审核发布</li>
          </ol>
        </div>
      </div>
    </div>
  `;
}

function renderSettings() {
  const d = state.dashboard;
  const settings = d?.settings || { new_user_free_minutes: 70, invite_reward_minutes: 20, ad_reward_minutes: 10 };
  return `
    <div class="saas-section">
      <h2>⚙️ 运营设置</h2>
      <div class="saas-panel">
        <form onsubmit="window.tenantApp.saveSettings(event)">
          <div class="saas-form-grid">
            <label>
              <span>新用户免费时长（分钟）</span>
              <input name="newUserFreeMinutes" type="number" min="0" value="${settings.new_user_free_minutes}" />
            </label>
            <label>
              <span>邀请好友奖励（分钟）</span>
              <input name="inviteRewardMinutes" type="number" min="0" value="${settings.invite_reward_minutes}" />
            </label>
            <label>
              <span>观看广告奖励（分钟）</span>
              <input name="adRewardMinutes" type="number" min="0" value="${settings.ad_reward_minutes}" />
            </label>
          </div>
          <div class="saas-form-actions" style="margin-top:16px;">
            <button type="submit" class="saas-btn-primary">${state.loading ? '保存中...' : '保存设置'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderAdSettings() {
  const { adConfig, saveAdMsg, loading } = state;
  return `
    <div class="saas-section">
      <h2>📺 广告配置</h2>
      <p style="color:#64748b;margin-bottom:20px;">
        在微信公众平台 → 流量主 → 广告管理中创建激励视频广告，获取广告单元ID。
      </p>
      <div class="saas-panel">
        <form onsubmit="window.tenantApp.saveAdConfig(event)">
          <div class="saas-form-grid">
            <label>
              <span>广告单元ID</span>
              <input name="ad_unit_id" value="${escapeHtml(adConfig.ad_unit_id)}" placeholder="adunit-xxxxxxxxxxxxxxxx" />
            </label>
            <label>
              <span>广告名称</span>
              <input name="ad_name" value="${escapeHtml(adConfig.ad_name)}" />
            </label>
            <label>
              <span>启用状态</span>
              <select name="status">
                <option value="1" ${adConfig.status === 1 ? 'selected' : ''}>已启用</option>
                <option value="0" ${adConfig.status === 0 ? 'selected' : ''}>已停用</option>
              </select>
            </label>
          </div>
          <div class="saas-form-actions" style="margin-top:16px;">
            <button type="submit" class="saas-btn-primary">${loading ? '保存中...' : '保存广告配置'}</button>
            ${saveAdMsg ? `<span style="color:#087443;font-weight:700;margin-left:12px;">${saveAdMsg}</span>` : ''}
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderPaySettings() {
  const { payConfig, savePayMsg, loading } = state;
  return `
    <div class="saas-section">
      <h2>💳 支付配置</h2>
      <p style="color:#64748b;margin-bottom:20px;">
        在微信支付商户平台获取商户号和API密钥，配置后即可接入真实支付。
      </p>
      <div class="saas-panel">
        <form onsubmit="window.tenantApp.savePayConfig(event)">
          <div class="saas-form-grid">
            <label>
              <span>商户号 (MchID)</span>
              <input name="mch_id" value="${escapeHtml(payConfig.mch_id)}" placeholder="微信支付商户号" />
            </label>
            <label>
              <span>API 密钥</span>
              <input name="mch_key" type="password" value="${escapeHtml(payConfig.mch_key)}" placeholder="APIv2/v3密钥" />
            </label>
            <label>
              <span>小程序 AppID</span>
              <input name="app_id" value="${escapeHtml(payConfig.app_id)}" placeholder="自动同步小程序配置" />
            </label>
            <label>
              <span>AppSecret</span>
              <input name="app_secret" type="password" value="${escapeHtml(payConfig.app_secret)}" placeholder="自动同步小程序配置" />
            </label>
            <label>
              <span>支付回调地址</span>
              <input name="notify_url" value="${escapeHtml(payConfig.notify_url)}" placeholder="https://你的域名/api/callback" />
            </label>
          </div>
          <div class="saas-pay-toggle" style="margin:16px 0;padding:14px 0;border-top:1px solid #edf1f6;border-bottom:1px solid #edf1f6;display:flex;align-items:center;gap:12px;">
            <span style="font-weight:700;color:#475569;">微信支付开关</span>
            <button type="button" class="saas-toggle ${payConfig.pay_enabled ? 'on' : 'off'}" onclick="window.tenantApp.togglePay()">
              <span class="saas-toggle-dot"></span>
            </button>
            <input type="hidden" name="pay_enabled" value="${payConfig.pay_enabled ? '1' : '0'}" />
            <span style="color:#64748b;font-size:13px;">${payConfig.pay_enabled ? '已开启' : '已关闭'}</span>
          </div>
          <div class="saas-form-actions">
            <button type="submit" class="saas-btn-primary">${loading ? '保存中...' : '保存支付配置'}</button>
            ${savePayMsg ? `<span style="color:#087443;font-weight:700;margin-left:12px;">${savePayMsg}</span>` : ''}
          </div>
        </form>
        <div style="margin-top:16px;padding:14px;background:#fffbe6;border-radius:8px;font-size:13px;color:#92400e;">
          <strong>⚠️ 注意：</strong>密钥信息仅保存在服务器数据库。关闭支付开关后，小程序端不显示支付入口。
        </div>
      </div>
    </div>
  `;
}

function render() {
  if (!state.authed) {
    renderLogin();
    return;
  }

  let body = '';
  if (state.section === 'dashboard') body = renderDashboard();
  else if (state.section === 'miniapp') body = renderMiniappConfig();
  else if (state.section === 'settings') body = renderSettings();
  else if (state.section === 'ads') body = renderAdSettings();
  else if (state.section === 'payment') body = renderPaySettings();

  app.innerHTML = `
    <main class="saas-shell">
      ${renderSidebar()}
      <section class="saas-content">
        ${body}
      </section>
    </main>
  `;
}

// ==================== Global handlers ====================
window.tenantApp = {
  login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    doLogin(
      form.get('tenant_code'),
      form.get('username'),
      form.get('password')
    ).catch(e => alert('登录失败：' + e.message));
  },
  logout() {
    sessionStorage.removeItem('tenant-token');
    setState({ authed: false, token: '', admin: null, tenant: null, dashboard: null });
  },
  openSection(section) {
    setState({ section, saveAdMsg: '', savePayMsg: '', miniappMsg: '' });
    if (section === 'dashboard') loadDashboard();
    else if (section === 'miniapp') loadProfile();
    else if (section === 'settings') loadDashboard();
    else if (section === 'ads') loadAdConfig();
    else if (section === 'payment') loadPayConfig();
  },
  async saveMiniappConfig(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true, miniappMsg: '' });
    try {
      await apiCall('POST', '/saveMiniappConfig', {
        miniapp_appid: form.get('miniapp_appid'),
        miniapp_secret: form.get('miniapp_secret'),
      });
      await loadProfile();
      setState({ loading: false, miniappMsg: '保存成功 ✓' });
      setTimeout(() => setState({ miniappMsg: '' }), 3000);
    } catch (e) {
      setState({ loading: false, miniappMsg: '保存失败：' + e.message });
    }
  },
  async saveSettings(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true });
    try {
      await apiCall('POST', '/saveSettings', {
        new_user_free_minutes: form.get('newUserFreeMinutes'),
        invite_reward_minutes: form.get('inviteRewardMinutes'),
        ad_reward_minutes: form.get('adRewardMinutes'),
      });
      await loadDashboard();
      setState({ loading: false });
    } catch (e) {
      setState({ loading: false });
      alert('保存失败：' + e.message);
    }
  },
  async saveAdConfig(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true, saveAdMsg: '保存中...' });
    try {
      await apiCall('POST', '/saveAdConfig', {
        ad_unit_id: form.get('ad_unit_id'),
        ad_name: form.get('ad_name') || '激励视频广告',
        status: parseInt(form.get('status')),
      });
      await loadAdConfig();
      setState({ loading: false, saveAdMsg: '广告配置已保存 ✓' });
      setTimeout(() => setState({ saveAdMsg: '' }), 3000);
    } catch (e) {
      setState({ loading: false, saveAdMsg: '保存失败：' + e.message });
    }
  },
  async savePayConfig(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true, savePayMsg: '保存中...' });
    try {
      await apiCall('POST', '/savePayConfig', {
        mch_id: form.get('mch_id'),
        mch_key: form.get('mch_key'),
        app_id: form.get('app_id'),
        app_secret: form.get('app_secret'),
        notify_url: form.get('notify_url'),
        pay_enabled: parseInt(form.get('pay_enabled')),
      });
      await loadPayConfig();
      setState({ loading: false, savePayMsg: '支付配置已保存 ✓' });
      setTimeout(() => setState({ savePayMsg: '' }), 3000);
    } catch (e) {
      setState({ loading: false, savePayMsg: '保存失败：' + e.message });
    }
  },
  togglePay() {
    const newVal = state.payConfig.pay_enabled ? 0 : 1;
    setState({ payConfig: { ...state.payConfig, pay_enabled: newVal } });
  },
};

render();
if (state.authed) {
  loadDashboard();
}
