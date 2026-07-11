import { formatDateTime, normalizeDashboard } from '../admin/adminData.js';
import {
  loginTenant,
  setTenantToken,
  clearTenantToken,
  fetchTenantDashboard,
  fetchTenantProfile,
  saveOperationSettings,
  saveUserProfile,
  saveAdConfig,
  savePayConfig,
  saveMiniappConfig,
  savePlans,
  listRedeemCodes,
  generateRedeemCode,
  fetchAdConfig,
  fetchPayConfig,
  uploadShareCover,
} from './tenantApi.js';
import '../admin/styles.css';

const app = document.querySelector('#tenant-app');

const state = {
  authed: !!sessionStorage.getItem('tenant-token'),
  loading: false,
  section: 'dashboard',
  admin: null,
  tenant: null,
  dashboard: normalizeDashboard(),
  plansDraft: [],
  redeemCodes: [],
  selectedPlanForRedeem: 0,
  adConfig: { ad_unit_id: '', ad_name: '激励视频广告', status: 1 },
  payConfig: { mch_id: '', mch_key: '', app_id: '', app_secret: '', notify_url: '', pay_enabled: 0 },
  saveAdMsg: '',
  savePayMsg: '',
    miniappMsg: '',
  planMsg: '',
  redeemMsg: '',
};

function money(cents) {
  return `¥${(Number(cents || 0) / 100).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function toDateTimeLocal(value) {
  const timestamp = Number(value || 0);
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value) {
  if (!value) return 0;
  const timestamp = Math.floor(new Date(value).getTime() / 1000);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function setState(patch) {
  Object.assign(state, patch);
  render();
}

async function loadDashboard() {
  setState({ loading: true });
  try {
    const payload = await fetchTenantDashboard();
    setState({
      dashboard: normalizeDashboard(payload),
      plansDraft: clonePlans(payload.plans || []),
      redeemCodes: Array.isArray(payload.redeem_codes) ? payload.redeem_codes : [],
      selectedPlanForRedeem: (payload.plans || [])[0]?.id || 0,
      loading: false,
    });
  } catch (e) {
    setState({ loading: false });
    alert('加载数据失败：' + e.message);
  }
}

function clonePlans(plans) {
  return plans.map((p) => ({ ...p }));
}

async function loadProfile() {
  try {
    const data = await fetchTenantProfile();
    setState({ admin: data.admin || null, tenant: data.tenant || null });
  } catch (e) {
    // ignore
  }
}

async function loadAdConfig() {
  try {
    const config = await fetchAdConfig();
    setState({ adConfig: config });
  } catch (e) {
    // ignore
  }
}

async function loadPayConfig() {
  try {
    const config = await fetchPayConfig();
    setState({ payConfig: config });
  } catch (e) {
    // ignore
  }
}

window.tenantApp = {
  openSection(section) {
    setState({ section, saveAdMsg: '', savePayMsg: '', miniappMsg: '', planMsg: '', redeemMsg: '' });
    if (section === 'ads') loadAdConfig();
    if (section === 'payment') loadPayConfig();
    if (section === 'miniapp') loadProfile();
    if (section === 'plans') window.tenantApp.loadRedeemCodes();
  },
  async login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const data = await loginTenant(
        form.get('tenant_code'),
        form.get('username'),
        form.get('password')
      );
      setTenantToken(data.token);
      setState({ authed: true, admin: data.admin || null, tenant: data.tenant || null });
      loadDashboard();
      loadProfile();
    } catch (e) {
      alert('登录失败：' + e.message);
    }
  },
  logout() {
    clearTenantToken();
    setState({ authed: false, admin: null, tenant: null, dashboard: normalizeDashboard() });
  },
  async saveSettings(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true });
    try {
      const payload = await saveOperationSettings({
        newUserFreeMinutes: form.get('newUserFreeMinutes'),
        inviteRewardMinutes: form.get('inviteRewardMinutes'),
        adRewardMinutes: form.get('adRewardMinutes'),
      });
      setState({ dashboard: normalizeDashboard(payload), loading: false });
    } catch (e) {
      setState({ loading: false });
      alert('保存失败：' + e.message);
    }
  },
  async saveUser(event, id) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true });
    try {
      const payload = await saveUserProfile(id, {
        nickname: form.get('nickname'),
        mobile: form.get('mobile'),
        currentBook: form.get('currentBook'),
        currentPage: Number(form.get('currentPage') || 0),
        memberState: form.get('memberState'),
        inviteCount: Number(form.get('inviteCount') || 0),
        adWatchCount: Number(form.get('adWatchCount') || 0),
        rewardMinutes: Number(form.get('rewardMinutes') || 0),
        remainingMinutes: Number(form.get('remainingMinutes') || 0),
        memberExchangeCount: Number(form.get('memberExchangeCount') || 0),
        lastLoginTime: fromDateTimeLocal(form.get('lastLoginTime')),
      });
      setState({ dashboard: normalizeDashboard(payload), loading: false });
    } catch (e) {
      setState({ loading: false });
      alert('保存失败：' + e.message);
    }
  },
  async saveAdSettings(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true, saveAdMsg: '保存中...' });
    try {
      await saveAdConfig({
        ad_unit_id: form.get('ad_unit_id'),
        ad_name: form.get('ad_name') || '激励视频广告',
        status: form.get('status') === '1' ? 1 : 0,
      });
      await loadAdConfig();
      setState({ loading: false, saveAdMsg: '广告配置已保存 ✓' });
      setTimeout(() => setState({ saveAdMsg: '' }), 2500);
    } catch (e) {
      setState({ loading: false, saveAdMsg: '保存失败：' + e.message });
    }
  },
  async savePaySettings(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true, savePayMsg: '保存中...' });
    try {
      await savePayConfig({
        mch_id: form.get('mch_id'),
        mch_key: form.get('mch_key'),
        app_id: form.get('app_id'),
        app_secret: form.get('app_secret'),
        notify_url: form.get('notify_url'),
        pay_enabled: form.get('pay_enabled') === '1' ? 1 : 0,
      });
      await loadPayConfig();
      setState({ loading: false, savePayMsg: '支付配置已保存 ✓' });
      setTimeout(() => setState({ savePayMsg: '' }), 2500);
    } catch (e) {
      setState({ loading: false, savePayMsg: '保存失败：' + e.message });
    }
  },
  async saveMiniappSettings(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true, miniappMsg: '保存中...' });
    try {
      await saveMiniappConfig({
        miniapp_appid: form.get('miniapp_appid'),
        miniapp_secret: form.get('miniapp_secret'),
        share_cover_url: form.get('share_cover_url'),
      });
      await loadProfile();
      setState({ loading: false, miniappMsg: '小程序配置已保存 ✓' });
      setTimeout(() => setState({ miniappMsg: '' }), 2500);
    } catch (e) {
      setState({ loading: false, miniappMsg: '保存失败：' + e.message });
    }
  },
  async uploadShareCover(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setState({ loading: true, miniappMsg: '上传中...' });
    try {
      const payload = await uploadShareCover(file);
      setState({
        loading: false,
        miniappMsg: '封面已上传，请点击保存小程序配置 ✓',
        tenant: { ...state.tenant, share_cover_url: payload.url || '' },
      });
    } catch (e) {
      setState({ loading: false, miniappMsg: '上传失败：' + e.message });
    } finally {
      event.target.value = '';
    }
  },
  async savePlans(event) {
    event.preventDefault();
    setState({ loading: true, planMsg: '保存中...' });
    try {
      const payload = await savePlans(state.plansDraft.map((p) => ({
        id: p.id,
        name: p.name,
        price_cents: p.price_cents,
        duration_days: p.duration_days,
        status: p.status ? 1 : 0,
      })));
      setState({
        loading: false,
        planMsg: '套餐已保存 ✓',
        dashboard: normalizeDashboard({ ...state.dashboard, plans: payload.plans || state.plansDraft }),
        plansDraft: clonePlans(payload.plans || state.plansDraft),
      });
      setTimeout(() => setState({ planMsg: '' }), 2500);
    } catch (e) {
      setState({ loading: false, planMsg: '保存失败：' + e.message });
    }
  },
  addPlan() {
    const nextId = Math.max(0, ...state.plansDraft.map((p) => p.id || 0)) + 1;
    setState({
      plansDraft: [...state.plansDraft, { id: nextId, name: '', price_cents: 0, duration_days: 30, status: 1 }],
    });
  },
  removePlan(id) {
    setState({ plansDraft: state.plansDraft.filter((p) => p.id !== id) });
  },
  updatePlanDraft(id, field, value) {
    setState({
      plansDraft: state.plansDraft.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    });
  },
  async loadRedeemCodes() {
    try {
      const data = await listRedeemCodes();
      setState({ redeemCodes: data.list || [] });
    } catch (e) {
      // ignore
    }
  },
  async generateRedeemCode(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const planId = parseInt(form.get('planId') || '0', 10);
    const count = Math.max(1, Math.min(100, parseInt(form.get('count') || '1', 10)));
    setState({ loading: true, redeemMsg: '生成中...' });
    try {
      const data = await generateRedeemCode(planId, count);
      await window.tenantApp.loadRedeemCodes();
      setState({ loading: false, redeemMsg: `已生成 ${(data.list || []).length} 个兑换码 ✓` });
      setTimeout(() => setState({ redeemMsg: '' }), 2500);
    } catch (e) {
      setState({ loading: false, redeemMsg: '生成失败：' + e.message });
    }
  },
  copyRedeemCode(code) {
    navigator.clipboard.writeText(code).then(
      () => alert(`已复制兑换码：${code}`),
      () => alert('复制失败，请手动复制：' + code)
    );
  },
  togglePayEnabled() {
    const newVal = state.payConfig.pay_enabled ? 0 : 1;
    setState({ payConfig: { ...state.payConfig, pay_enabled: newVal } });
  },
};

function renderLogin() {
  app.innerHTML = `
    <main class="login-page">
      <form class="login-card" onsubmit="tenantApp.login(event)">
        <h1>租户管理中心</h1>
        <p>登录管理你的小程序后台</p>
        <label>租户标识<input name="tenant_code" placeholder="由平台管理员提供" autocomplete="off" /></label>
        <label>账号<input name="username" value="test" autocomplete="username" /></label>
        <label>密码<input name="password" value="test123" type="password" autocomplete="current-password" /></label>
        <button>登录后台</button>
      </form>
    </main>
  `;
}

const sectionTitles = {
  dashboard: ['数据看板', '核心增长与收费数据总览'],
  users: ['用户管理', '查看注册用户、使用时长、邀请与广告记录'],
  plans: ['会员套餐', '管理会员兑换入口与套餐展示'],
  settings: ['运营设置', '配置免费时长与奖励规则'],
  orders: ['订单管理', '查看订单、会员兑换与奖励流水'],
  ads: ['广告配置', '配置微信激励视频广告单元ID'],
  payment: ['支付配置', '配置微信支付商户号和开关'],
  miniapp: ['小程序配置', '配置微信小程序 AppID 和 AppSecret'],
};

function renderSidebar() {
  const items = [
    ['dashboard', '数据看板'],
    ['users', '用户管理'],
    ['plans', '会员套餐'],
    ['settings', '运营设置'],
    ['orders', '订单管理'],
    ['ads', '广告配置'],
    ['payment', '支付配置'],
    ['miniapp', '小程序配置'],
  ];
  return `
    <aside>
      <strong>${escapeHtml(state.tenant?.tenant_name || '租户后台')}</strong>
      ${items.map(([id, label]) => `
        <a class="${state.section === id ? 'active' : ''}" onclick="tenantApp.openSection('${id}')">${label}</a>
      `).join('')}
      <button onclick="tenantApp.logout()">退出</button>
    </aside>
  `;
}

function renderMetrics(counters) {
  return `
    <div class="metric-grid">
      <article onclick="tenantApp.openSection('users')"><small>总注册用户</small><strong>${counters.totalUsers}</strong></article>
      <article onclick="tenantApp.openSection('users')"><small>今日新增</small><strong>${counters.todayUsers}</strong></article>
      <article onclick="tenantApp.openSection('users')"><small>活跃用户</small><strong>${counters.activeUsers}</strong></article>
      <article onclick="tenantApp.openSection('users')"><small>会员用户</small><strong>${counters.paidUsers}</strong></article>
      <article onclick="tenantApp.openSection('orders')"><small>累计收入</small><strong>${money(counters.revenueCents)}</strong></article>
      <article onclick="tenantApp.openSection('orders')"><small>会员兑换</small><strong>${counters.memberExchangeCount}</strong></article>
      <article onclick="tenantApp.openSection('users')"><small>邀请人数</small><strong>${counters.inviteCount}</strong></article>
      <article onclick="tenantApp.openSection('users')"><small>广告次数</small><strong>${counters.adWatchCount}</strong></article>
      <article onclick="tenantApp.openSection('orders')"><small>发放分钟</small><strong>${counters.grantedMinutes}</strong></article>
      <article onclick="tenantApp.openSection('users')"><small>剩余分钟</small><strong>${counters.remainingMinutes}</strong></article>
    </div>
  `;
}

function renderSettingsForm(settings) {
  return `
    <section class="panel wide">
      <h2>运营设置</h2>
      <form class="settings-form" onsubmit="tenantApp.saveSettings(event)">
        <label><span>新用户默认免费时长</span><div><input name="newUserFreeMinutes" type="number" min="0" value="${settings.newUserFreeMinutes}" /><small>分钟</small></div></label>
        <label><span>邀请好友奖励时长</span><div><input name="inviteRewardMinutes" type="number" min="0" value="${settings.inviteRewardMinutes}" /><small>分钟</small></div></label>
        <label><span>观看广告奖励时长</span><div><input name="adRewardMinutes" type="number" min="0" value="${settings.adRewardMinutes}" /><small>分钟</small></div></label>
        <button>${state.loading ? '保存中...' : '保存设置'}</button>
      </form>
    </section>
  `;
}

function renderAdSettingsForm() {
  const { adConfig, saveAdMsg, loading } = state;
  return `
    <section class="panel wide">
      <h2>微信激励视频广告配置</h2>
      <p style="color:#64748b;margin:0 0 18px;font-size:14px;">
        在微信公众平台 → 流量主 → 广告管理 中创建激励视频广告，获取广告单元ID填入下方。
      </p>
      <form class="ad-settings-form" onsubmit="tenantApp.saveAdSettings(event)">
        <label>
          <span>广告单元ID (adUnitId)</span>
          <input name="ad_unit_id" value="${escapeHtml(adConfig.ad_unit_id)}" placeholder="例如: adunit-xxxxxxxxxxxxxxxx" style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;" />
        </label>
        <label>
          <span>广告名称</span>
          <input name="ad_name" value="${escapeHtml(adConfig.ad_name)}" style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;" />
        </label>
        <label>
          <span>启用状态</span>
          <select name="status" style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;">
            <option value="1" ${adConfig.status === 1 ? 'selected' : ''}>已启用</option>
            <option value="0" ${adConfig.status === 0 ? 'selected' : ''}>已停用</option>
          </select>
        </label>
        <div style="display:flex;align-items:center;gap:12px;">
          <button type="submit" class="save-btn">${loading ? '保存中...' : '保存广告配置'}</button>
          ${saveAdMsg ? `<span style="color:#087443;font-weight:700;">${saveAdMsg}</span>` : ''}
        </div>
      </form>
      <div style="margin-top:14px;padding:12px 16px;background:#f0f7ff;border-radius:8px;color:#475569;font-size:13px;">
        <strong>💡 提示：</strong>填写广告单元ID并启用后，小程序端将自动读取此配置展示真实激励视频广告。
        留空则小程序端不展示广告。
      </div>
    </section>
  `;
}

function renderPaySettingsForm() {
  const { payConfig, savePayMsg, loading } = state;
  return `
    <section class="panel wide">
      <h2>微信支付配置</h2>
      <p style="color:#64748b;margin:0 0 18px;font-size:14px;">
        在微信支付商户平台获取商户号和API密钥，填入下方完成支付配置。
      </p>
      <form class="pay-settings-form" onsubmit="tenantApp.savePaySettings(event)">
        <label>
          <span>小程序 AppID</span>
          <input name="app_id" value="${escapeHtml(payConfig.app_id)}" placeholder="wx..." style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;" />
        </label>
        <label>
          <span>商户号 (MchID)</span>
          <input name="mch_id" value="${escapeHtml(payConfig.mch_id)}" placeholder="微信支付商户号" style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;" />
        </label>
        <label>
          <span>API 密钥 (Key)</span>
          <input name="mch_key" type="password" value="${escapeHtml(payConfig.mch_key)}" placeholder="APIv2密钥或APIv3密钥" style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;" />
        </label>
        <label>
          <span>AppSecret</span>
          <input name="app_secret" type="password" value="${escapeHtml(payConfig.app_secret)}" placeholder="小程序AppSecret" style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;" />
        </label>
        <label>
          <span>支付回调地址</span>
          <input name="notify_url" value="${escapeHtml(payConfig.notify_url)}" placeholder="https://你的域名/api/callback/wechat_notify" style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;" />
        </label>
        <div class="pay-toggle-row">
          <span class="pay-toggle-label">微信支付开关</span>
          <button type="button" class="pay-toggle ${payConfig.pay_enabled ? 'on' : 'off'}" onclick="tenantApp.togglePayEnabled()">
            <span class="pay-toggle-dot"></span>
          </button>
          <input type="hidden" name="pay_enabled" value="${payConfig.pay_enabled ? '1' : '0'}" />
          <span class="pay-toggle-status">${payConfig.pay_enabled ? '已开启 - 小程序端显示支付入口' : '已关闭 - 小程序端不显示支付入口'}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:12px;">
          <button type="submit" class="save-btn">${loading ? '保存中...' : '保存支付配置'}</button>
          ${savePayMsg ? `<span style="color:#087443;font-weight:700;">${savePayMsg}</span>` : ''}
        </div>
      </form>
      <div style="margin-top:14px;padding:12px 16px;background:#fffbe6;border-radius:8px;color:#92400e;font-size:13px;">
        <strong>⚠️ 安全提示：</strong>密钥信息仅保存在你的服务器数据库中。关闭支付开关后，小程序端「兑换会员」界面将不显示微信支付按钮。
      </div>
    </section>
  `;
}

function renderMiniappSettingsForm() {
  const { tenant, miniappMsg, loading } = state;
  const shareCoverUrl = tenant?.share_cover_url || '';
  return `
    <section class="panel wide">
      <h2>小程序配置</h2>
      <p style="color:#64748b;margin:0 0 18px;font-size:14px;">
        在微信公众平台注册小程序后，将 AppID 和 AppSecret 填入下方，小程序即可连接到本后台。
      </p>
      <form class="pay-settings-form" onsubmit="tenantApp.saveMiniappSettings(event)">
        <label>
          <span>小程序 AppID</span>
          <input name="miniapp_appid" value="${escapeHtml(tenant?.miniapp_appid || '')}" placeholder="wx..." style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;" />
        </label>
        <label>
          <span>小程序 AppSecret</span>
          <input name="miniapp_secret" type="password" value="${escapeHtml(tenant?.miniapp_secret || '')}" placeholder="小程序密钥" style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;" />
        </label>
        <label>
          <span>分享封面</span>
          <input name="share_cover_url" value="${escapeHtml(shareCoverUrl)}" placeholder="上传后自动生成，也可粘贴 HTTPS 图片地址" style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;" />
        </label>
        <div style="display:flex;align-items:center;gap:16px;margin:-4px 0 8px;">
          <label class="save-btn" style="display:inline-flex;align-items:center;cursor:pointer;margin:0;">
            上传封面
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onchange="tenantApp.uploadShareCover(event)" style="display:none;" />
          </label>
          <span style="color:#64748b;font-size:13px;">建议尺寸 500×400，JPG/PNG/WebP，2MB 以内</span>
        </div>
        ${shareCoverUrl ? `
          <div style="width:250px;max-width:100%;aspect-ratio:5/4;border-radius:8px;overflow:hidden;background:#f1f5f9;border:1px solid #d8dee9;margin-bottom:8px;">
            <img src="${escapeHtml(shareCoverUrl)}" alt="分享封面预览" style="width:100%;height:100%;object-fit:cover;display:block;" />
          </div>
        ` : ''}
        <div style="display:flex;align-items:center;gap:12px;">
          <button type="submit" class="save-btn">${loading ? '保存中...' : '保存小程序配置'}</button>
          ${miniappMsg ? `<span style="color:#087443;font-weight:700;">${miniappMsg}</span>` : ''}
        </div>
      </form>
      <div style="margin-top:14px;padding:12px 16px;background:#f0f7ff;border-radius:8px;color:#475569;font-size:13px;">
        <strong>💡 部署指引：</strong>
        <ol style="margin:8px 0 0 16px;padding:0;">
          <li>在微信公众平台注册小程序，获取 AppID 和 AppSecret</li>
          <li>将上述信息填入并保存</li>
          <li>在小程序后台配置服务器域名白名单（request合法域名）</li>
          <li>将小程序代码中的 API 地址指向本服务器，并设置租户标识</li>
          <li>提交小程序审核发布</li>
        </ol>
      </div>
    </section>
  `;
}

function renderUsersTable(users) {
  return `
    <section class="panel wide">
      <h2>用户管理</h2>
      ${users.map((user) => `
        <form id="user-form-${escapeHtml(user.id)}" class="user-edit-form" onsubmit="tenantApp.saveUser(event, '${escapeHtml(user.id)}')"></form>
      `).join('')}
      <table>
        <thead><tr><th>用户</th><th>手机号</th><th>当前教材</th><th>页数</th><th>会员</th><th>邀请</th><th>广告</th><th>奖励</th><th>剩余</th><th>兑换</th><th>最近登录</th><th>操作</th></tr></thead>
        <tbody>
          ${users.map((user) => `
            <tr>
              <td><input form="user-form-${escapeHtml(user.id)}" class="user-input" name="nickname" value="${escapeHtml(user.nickname)}" /></td>
              <td><input form="user-form-${escapeHtml(user.id)}" class="user-input" name="mobile" value="${escapeHtml(user.mobile || '')}" placeholder="-" /></td>
              <td><input form="user-form-${escapeHtml(user.id)}" class="user-input wide-input" name="currentBook" value="${escapeHtml(user.currentBook)}" /></td>
              <td><input form="user-form-${escapeHtml(user.id)}" class="user-input number-input" name="currentPage" type="number" min="0" value="${user.currentPage}" /></td>
              <td>
                <select form="user-form-${escapeHtml(user.id)}" class="user-input" name="memberState">
                  ${['免费', '会员', '已过期'].map((stateName) => `<option value="${stateName}" ${user.memberState === stateName ? 'selected' : ''}>${stateName}</option>`).join('')}
                </select>
              </td>
              <td><input form="user-form-${escapeHtml(user.id)}" class="user-input number-input" name="inviteCount" type="number" min="0" value="${user.inviteCount}" /></td>
              <td><input form="user-form-${escapeHtml(user.id)}" class="user-input number-input" name="adWatchCount" type="number" min="0" value="${user.adWatchCount}" /></td>
              <td><input form="user-form-${escapeHtml(user.id)}" class="user-input minute-input" name="rewardMinutes" type="number" min="0" value="${user.rewardMinutes}" /></td>
              <td><input form="user-form-${escapeHtml(user.id)}" class="user-input minute-input" name="remainingMinutes" type="number" min="0" value="${user.remainingMinutes}" /></td>
              <td><input form="user-form-${escapeHtml(user.id)}" class="user-input number-input" name="memberExchangeCount" type="number" min="0" value="${user.memberExchangeCount}" /></td>
              <td><input form="user-form-${escapeHtml(user.id)}" class="user-input time-input" name="lastLoginTime" type="datetime-local" value="${toDateTimeLocal(user.lastLoginTime)}" title="${formatDateTime(user.lastLoginTime)}" /></td>
              <td><button form="user-form-${escapeHtml(user.id)}" class="save-row-button">保存</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

function renderPlansEditor(plans) {
  const { planMsg, loading } = state;
  return `
    <section class="panel wide">
      <h2>会员套餐配置</h2>
      <p style="color:#64748b;margin:0 0 18px;font-size:14px;">自定义套餐名称、价格、时长和启用状态，保存后小程序端会同步展示。</p>
      <form onsubmit="tenantApp.savePlans(event)">
        <table class="plan-editor-table">
          <thead>
            <tr>
              <th>套餐名称</th>
              <th>价格（元）</th>
              <th>时长（天）</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${plans.map((plan) => `
              <tr>
                <td>
                  <input class="plan-input" value="${escapeHtml(plan.name)}"
                    onchange="tenantApp.updatePlanDraft(${plan.id}, 'name', this.value)" />
                </td>
                <td>
                  <input class="plan-input number-input" type="number" min="0" step="0.01"
                    value="${(Number(plan.price_cents || 0) / 100).toFixed(2)}"
                    onchange="tenantApp.updatePlanDraft(${plan.id}, 'price_cents', Math.round(Number(this.value || 0) * 100))" />
                </td>
                <td>
                  <input class="plan-input number-input" type="number" min="1"
                    value="${plan.duration_days}"
                    onchange="tenantApp.updatePlanDraft(${plan.id}, 'duration_days', Number(this.value || 1))" />
                </td>
                <td>
                  <select class="plan-input" onchange="tenantApp.updatePlanDraft(${plan.id}, 'status', this.value === '1')">
                    <option value="1" ${plan.status ? 'selected' : ''}>已启用</option>
                    <option value="0" ${!plan.status ? 'selected' : ''}>已停用</option>
                  </select>
                </td>
                <td>
                  <button type="button" class="icon-btn danger" onclick="tenantApp.removePlan(${plan.id})">删除</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="plan-actions">
          <button type="button" class="add-btn" onclick="tenantApp.addPlan()">+ 新增套餐</button>
          <button type="submit" class="save-btn">${loading ? '保存中...' : '保存套餐配置'}</button>
          ${planMsg ? `<span class="status-msg">${planMsg}</span>` : ''}
        </div>
      </form>
    </section>
  `;
}

function renderPlansList(plans) {
  return `
    <section class="panel">
      <h2>前端展示效果</h2>
      <p style="color:#64748b;margin:0 0 18px;font-size:14px;">小程序端用户看到的套餐卡片。</p>
      <div class="plan-grid">
        ${plans.map((plan) => `
          <div class="plan-card ${plan.status ? '' : 'disabled'}">
            <strong>${escapeHtml(plan.name)}</strong>
            <span>${money(plan.price_cents)} / ${plan.duration_days} 天</span>
            <small>${plan.status ? '已启用' : '已停用'}</small>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderRedeemCodes() {
  const { plansDraft, redeemCodes, selectedPlanForRedeem, redeemMsg, loading } = state;
  return `
    <section class="panel wide">
      <h2>会员兑换码</h2>
      <p style="color:#64748b;margin:0 0 18px;font-size:14px;">生成兑换码后，用户在小程序「兑换会员」中输入即可兑换对应套餐。</p>
      <form class="redeem-form" onsubmit="tenantApp.generateRedeemCode(event)">
        <label>
          <span>选择套餐</span>
          <select name="planId" style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;">
            ${plansDraft.filter((p) => p.status).map((p) => `<option value="${p.id}" ${p.id === selectedPlanForRedeem ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
          </select>
        </label>
        <label>
          <span>生成数量</span>
          <input name="count" type="number" min="1" max="100" value="1" style="width:100%;height:40px;padding:0 10px;border:1px solid #d8dee9;border-radius:6px;" />
        </label>
        <button type="submit" class="save-btn">${loading ? '生成中...' : '生成兑换码'}</button>
        ${redeemMsg ? `<span class="status-msg">${redeemMsg}</span>` : ''}
      </form>
      ${redeemCodes.length ? `
        <table class="redeem-table" style="margin-top:18px;">
          <thead>
            <tr><th>兑换码</th><th>套餐</th><th>状态</th><th>生成时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            ${redeemCodes.slice().reverse().map((item) => `
              <tr>
                <td><code class="redeem-code">${escapeHtml(item.code)}</code></td>
                <td>${escapeHtml(item.plan_name)}</td>
                <td>${item.used ? '<span class="badge used">已使用</span>' : '<span class="badge">未使用</span>'}</td>
                <td>${formatDateTime(item.create_time)}</td>
                <td>
                  <button type="button" class="icon-btn" onclick="tenantApp.copyRedeemCode('${escapeHtml(item.code)}')">复制</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color:#94a3b8;margin-top:18px;">暂无兑换码，请先生成。</p>'}
    </section>
  `;
}

function renderOrdersList(orders) {
  return `
    <section class="panel">
      <h2>最近订单</h2>
      ${orders.map((order) => `
        <div class="order-row">
          <strong>${escapeHtml(order.order_no)}</strong>
          <span>${escapeHtml(order.nickname)} · ${escapeHtml(order.plan_name)} · ${money(order.amount_cents)}</span>
        </div>
      `).join('')}
    </section>
  `;
}

function renderExchangesList(exchanges) {
  return `
    <section class="panel">
      <h2>会员兑换记录</h2>
      ${exchanges.map((exchange) => `
        <div class="order-row">
          <strong>${escapeHtml(exchange.nickname)}</strong>
          <span>${escapeHtml(exchange.planName)} · ${formatDateTime(exchange.exchangeTime)}</span>
        </div>
      `).join('')}
    </section>
  `;
}

function renderRewardsList(rewards) {
  return `
    <section class="panel">
      <h2>奖励记录</h2>
      ${rewards.map((reward) => `
        <div class="order-row">
          <strong>${escapeHtml(reward.nickname)} · ${escapeHtml(reward.typeLabel)}</strong>
          <span>+${reward.minutes} 分钟 · ${formatDateTime(reward.createTime)}</span>
        </div>
      `).join('')}
    </section>
  `;
}

function renderCurrentSection() {
  const { counters, users, plans, orders, settings, exchanges, rewards } = state.dashboard;
  if (state.section === 'users') {
    return `<div class="section-grid">${renderUsersTable(users)}${renderRewardsList(rewards)}</div>`;
  }
  if (state.section === 'plans') {
    return `<div class="section-grid">${renderPlansEditor(state.plansDraft)}${renderPlansList(state.plansDraft)}${renderRedeemCodes()}</div>`;
  }
  if (state.section === 'settings') {
    return `<div class="section-grid">${renderSettingsForm(settings)}</div>`;
  }
  if (state.section === 'orders') {
    return `<div class="section-grid">${renderOrdersList(orders)}${renderExchangesList(exchanges)}${renderRewardsList(rewards)}</div>`;
  }
  if (state.section === 'ads') {
    return `<div class="section-grid">${renderAdSettingsForm()}</div>`;
  }
  if (state.section === 'payment') {
    return `<div class="section-grid">${renderPaySettingsForm()}</div>`;
  }
  if (state.section === 'miniapp') {
    return `<div class="section-grid">${renderMiniappSettingsForm()}</div>`;
  }
  return `
    ${renderMetrics(counters)}
    <div class="section-grid">
      ${renderUsersTable(users)}
      ${renderPlansList(plans)}
      ${renderOrdersList(orders)}
    </div>
  `;
}

function renderDashboard() {
  const [title, subtitle] = sectionTitles[state.section] || sectionTitles.dashboard;
  app.innerHTML = `
    <main class="admin-shell">
      ${renderSidebar()}
      <section class="content">
        <header>
          <div>
            <h1>${escapeHtml(title)}</h1>
            <p>${state.loading ? '加载中...' : escapeHtml(subtitle)}</p>
          </div>
          <span>租户版</span>
        </header>
        ${renderCurrentSection()}
      </section>
    </main>
  `;
}

function render() {
  if (!state.authed) renderLogin();
  else renderDashboard();
}

render();
if (state.authed) {
  loadDashboard();
  loadProfile();
  loadAdConfig();
  loadPayConfig();
}
