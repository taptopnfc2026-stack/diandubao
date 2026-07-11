import './saasStyles.css';

const app = document.querySelector('#saas-app');

// ==================== State ====================
const state = {
  authed: !!sessionStorage.getItem('saas-token'),
  token: sessionStorage.getItem('saas-token') || '',
  admin: null,
  loading: false,
  section: 'dashboard',
  overview: null,
  tenants: [],
  tenantTotal: 0,
  tenantPage: 1,
  tenantDetail: null,
  logs: [],
  logTotal: 0,
  logPage: 1,
  // 表单
  createFormVisible: false,
  createMsg: '',
  detailMsg: '',
  resetPwdMsg: '',
};

const API_BASE = '/api/saas_admin';

// ==================== Helpers ====================
function money(cents) {
  return `¥${(Number(cents || 0) / 100).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function setState(patch) {
  Object.assign(state, patch);
  render();
}

async function apiCall(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (state.token) {
    opts.headers['Authorization'] = `Bearer ${state.token}`;
  }
  if (body) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json();
  if (data.code === 1) return data.data || data;
  if (res.status === 401) {
    sessionStorage.removeItem('saas-token');
    setState({ authed: false, token: '' });
  }
  throw new Error(data.msg || '请求失败');
}

// ==================== API ====================
async function doLogin(username, password) {
  const data = await apiCall('POST', '/login', { username, password });
  const token = data.token;
  sessionStorage.setItem('saas-token', token);
  setState({ authed: true, token, admin: data.admin });
  loadOverview();
}

async function loadOverview() {
  setState({ loading: true });
  try {
    const data = await apiCall('GET', '/platformOverview');
    setState({ overview: data, loading: false });
  } catch (e) {
    setState({ loading: false });
  }
}

async function loadTenants(page = 1, keyword = '', status = '') {
  setState({ loading: true });
  try {
    const params = new URLSearchParams({ page, keyword, status });
    const data = await apiCall('GET', `/tenantList?${params}`);
    setState({ tenants: data.list, tenantTotal: data.total, tenantPage: page, loading: false });
  } catch (e) {
    setState({ loading: false });
  }
}

async function loadTenantDetail(id) {
  setState({ loading: true });
  try {
    const data = await apiCall('GET', `/tenantDetail?id=${id}`);
    setState({ tenantDetail: data, loading: false });
  } catch (e) {
    setState({ loading: false });
  }
}

async function loadLogs(page = 1, tenantCode = '') {
  setState({ loading: true });
  try {
    const params = new URLSearchParams({ page, tenant_code: tenantCode });
    const data = await apiCall('GET', `/operationLogs?${params}`);
    setState({ logs: data.list, logTotal: data.total, logPage: page, loading: false });
  } catch (e) {
    setState({ loading: false });
  }
}

async function doCreateTenant(formData) {
  setState({ createMsg: '创建中...' });
  try {
    const data = await apiCall('POST', '/createTenant', Object.fromEntries(formData));
    setState({ createMsg: `创建成功！租户标识：${data.tenant_code}，管理账号：${data.admin_username}`, createFormVisible: false });
    loadOverview();
    loadTenants(1);
  } catch (e) {
    setState({ createMsg: '创建失败：' + e.message });
  }
}

async function doDisableTenant(id) {
  if (!confirm('确定要禁用该租户吗？禁用后该租户的所有用户将无法使用小程序。')) return;
  try {
    await apiCall('POST', '/disableTenant', { id });
    loadTenants(state.tenantPage);
    loadOverview();
  } catch (e) {
    alert('操作失败：' + e.message);
  }
}

async function doEnableTenant(id) {
  try {
    await apiCall('POST', '/enableTenant', { id });
    loadTenants(state.tenantPage);
    loadOverview();
  } catch (e) {
    alert('操作失败：' + e.message);
  }
}

async function doResetPassword(adminId, newPassword) {
  setState({ resetPwdMsg: '重置中...' });
  try {
    await apiCall('POST', '/resetTenantAdminPassword', { admin_id: adminId, new_password: newPassword });
    setState({ resetPwdMsg: '密码已重置' });
    setTimeout(() => setState({ resetPwdMsg: '' }), 3000);
  } catch (e) {
    setState({ resetPwdMsg: '重置失败：' + e.message });
  }
}

// ==================== Render ====================
function renderLogin() {
  app.innerHTML = `
    <main class="saas-login">
      <form class="saas-login-card" onsubmit="window.saasApp.login(event)">
        <h1>🔐 点读宝 SaaS 平台</h1>
        <p>超级管理员登录</p>
        <label>账号<input name="username" value="admin" autocomplete="username" /></label>
        <label>密码<input name="password" type="password" autocomplete="current-password" /></label>
        <button type="submit">登录</button>
      </form>
    </main>
  `;
}

function renderSidebar() {
  const items = [
    ['dashboard', '📊 平台总览'],
    ['tenants', '🏢 租户管理'],
    ['logs', '📋 操作日志'],
  ];
  return `
    <aside class="saas-sidebar">
      <div class="saas-sidebar-header">
        <strong>点读宝 SaaS</strong>
        <small>超级管理员</small>
      </div>
      <nav>
        ${items.map(([id, label]) => `
          <a class="${state.section === id ? 'active' : ''}" onclick="window.saasApp.openSection('${id}')">${label}</a>
        `).join('')}
      </nav>
      <div class="saas-sidebar-footer">
        <span>👤 ${escapeHtml(state.admin?.nickname || state.admin?.username || '')}</span>
        <button onclick="window.saasApp.logout()">退出登录</button>
      </div>
    </aside>
  `;
}

function renderDashboard() {
  const o = state.overview;
  if (!o) return '<div class="saas-content-loading">加载中...</div>';

  return `
    <div class="saas-dashboard">
      <h2>📊 平台总览</h2>
      <div class="saas-metric-grid">
        <article>
          <small>总租户数</small>
          <strong>${o.total_tenants}</strong>
        </article>
        <article class="green">
          <small>已启用租户</small>
          <strong>${o.active_tenants}</strong>
        </article>
        <article class="red">
          <small>已禁用租户</small>
          <strong>${o.disabled_tenants}</strong>
        </article>
        <article>
          <small>总用户数</small>
          <strong>${o.total_users}</strong>
        </article>
        <article>
          <small>今日新增租户</small>
          <strong>${o.today_new_tenants}</strong>
        </article>
        <article>
          <small>今日新增用户</small>
          <strong>${o.today_new_users}</strong>
        </article>
        <article>
          <small>平台总营收</small>
          <strong>${money(o.total_revenue_cents)}</strong>
        </article>
      </div>

      ${o.recent_tenants && o.recent_tenants.length > 0 ? `
        <div class="saas-panel" style="margin-top:20px;">
          <h3>最近注册的租户</h3>
          <table>
            <thead><tr><th>客户名称</th><th>租户标识</th><th>联系人</th><th>状态</th><th>注册时间</th></tr></thead>
            <tbody>
              ${o.recent_tenants.map(t => `
                <tr>
                  <td><strong>${escapeHtml(t.tenant_name)}</strong></td>
                  <td><code>${escapeHtml(t.tenant_code)}</code></td>
                  <td>${escapeHtml(t.contact_name)}</td>
                  <td>${t.status === 1 ? '<span class="saas-badge green">启用</span>' : '<span class="saas-badge red">禁用</span>'}</td>
                  <td>${formatTime(t.create_time)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    </div>
  `;
}

function formatTime(ts) {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString('zh-CN');
}

function renderTenants() {
  const { tenants, tenantTotal, tenantPage, createFormVisible, createMsg, tenantDetail, loading } = state;

  let detailHtml = '';
  if (tenantDetail) {
    const t = tenantDetail;
    detailHtml = `
      <div class="saas-panel saas-detail-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h3>租户详情：${escapeHtml(t.tenant_name)}</h3>
          <button class="saas-btn-close" onclick="window.saasApp.closeDetail()">✕</button>
        </div>
        <div class="saas-detail-grid">
          <div><label>租户标识</label><code>${escapeHtml(t.tenant_code)}</code></div>
          <div><label>客户名称</label><span>${escapeHtml(t.tenant_name)}</span></div>
          <div><label>联系人</label><span>${escapeHtml(t.contact_name)}</span></div>
          <div><label>手机</label><span>${escapeHtml(t.contact_mobile)}</span></div>
          <div><label>邮箱</label><span>${escapeHtml(t.contact_email)}</span></div>
          <div><label>小程序AppID</label><span>${escapeHtml(t.miniapp_appid || '未配置')}</span></div>
          <div><label>用户数</label><span>${t.user_count}</span></div>
          <div><label>管理员数</label><span>${t.admin_count}</span></div>
          <div><label>订单数</label><span>${t.order_count}</span></div>
          <div><label>营收</label><span>${money(t.revenue_cents)}</span></div>
          <div><label>到期时间</label><span>${t.expire_time ? formatTime(t.expire_time) : '永久'}</span></div>
          <div><label>状态</label>${t.status === 1 ? '<span class="saas-badge green">启用</span>' : '<span class="saas-badge red">禁用</span>'}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="saas-section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h2>🏢 租户管理（共 ${tenantTotal} 个）</h2>
        <button class="saas-btn-primary" onclick="window.saasApp.showCreateForm()">+ 开通新租户</button>
      </div>

      ${createFormVisible ? renderCreateForm() : ''}
      ${detailHtml}

      <div class="saas-panel">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>客户名称</th>
              <th>租户标识</th>
              <th>联系人</th>
              <th>小程序AppID</th>
              <th>用户数</th>
              <th>状态</th>
              <th>到期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${tenants.length === 0 ? '<tr><td colspan="9" style="text-align:center;color:#999;">暂无租户</td></tr>' : ''}
            ${tenants.map(t => `
              <tr>
                <td>${t.id}</td>
                <td><strong>${escapeHtml(t.tenant_name)}</strong></td>
                <td><code>${escapeHtml(t.tenant_code)}</code></td>
                <td>${escapeHtml(t.contact_name)}</td>
                <td><code>${escapeHtml(t.miniapp_appid || '-')}</code></td>
                <td>${t.user_count}</td>
                <td>${t.status === 1 ? '<span class="saas-badge green">启用</span>' : '<span class="saas-badge red">禁用</span>'}</td>
                <td>${t.expire_time ? formatTime(t.expire_time) : '永久'}</td>
                <td class="saas-actions">
                  <button class="saas-btn-sm" onclick="window.saasApp.viewDetail(${t.id})">详情</button>
                  ${t.status === 1 
                    ? `<button class="saas-btn-sm danger" onclick="window.saasApp.disableTenant(${t.id})">禁用</button>`
                    : `<button class="saas-btn-sm success" onclick="window.saasApp.enableTenant(${t.id})">启用</button>`
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${tenantTotal > 20 ? renderPagination(tenantPage, Math.ceil(tenantTotal / 20), 'tenants') : ''}
      </div>
    </div>
  `;
}

function renderCreateForm() {
  const { createMsg } = state;
  return `
    <div class="saas-panel saas-create-form">
      <h3>开通新租户</h3>
      <form onsubmit="window.saasApp.createTenant(event)">
        <div class="saas-form-grid">
          <label>客户名称 *<input name="tenant_name" required placeholder="例如：XX英语培训学校" /></label>
          <label>租户标识（留空自动生成）<input name="tenant_code" placeholder="自动生成" /></label>
          <label>联系人<input name="contact_name" placeholder="联系人姓名" /></label>
          <label>联系电话<input name="contact_mobile" placeholder="手机号" /></label>
          <label>联系邮箱<input name="contact_email" placeholder="邮箱" type="email" /></label>
          <label>管理员账号 *<input name="admin_username" required placeholder="后台登录账号" /></label>
          <label>管理员密码 *<input name="admin_password" required type="password" placeholder="至少6位" /></label>
          <label>到期时间（0=永久）<input name="expire_time" type="datetime-local" /></label>
          <label>最大用户数（0=不限）<input name="max_users" type="number" value="0" /></label>
        </div>
        <label style="margin-top:12px;display:block;">备注<textarea name="remark" style="width:100%;height:60px;margin-top:4px;padding:8px;border:1px solid #d8dee9;border-radius:6px;"></textarea></label>
        <div class="saas-form-actions">
          <button type="submit" class="saas-btn-primary">确认创建</button>
          <button type="button" class="saas-btn-secondary" onclick="window.saasApp.hideCreateForm()">取消</button>
          ${createMsg ? `<span class="saas-form-msg">${createMsg}</span>` : ''}
        </div>
      </form>
    </div>
  `;
}

function renderPagination(page, totalPages, section) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }
  return `
    <div class="saas-pagination">
      <button ${page <= 1 ? 'disabled' : ''} onclick="window.saasApp.goPage('${section}', ${page - 1})">上一页</button>
      ${pages.map(p => p === '...' ? '<span>...</span>' : `<button class="${p === page ? 'active' : ''}" onclick="window.saasApp.goPage('${section}', ${p})">${p}</button>`).join('')}
      <button ${page >= totalPages ? 'disabled' : ''} onclick="window.saasApp.goPage('${section}', ${page + 1})">下一页</button>
    </div>
  `;
}

function renderLogs() {
  const { logs, logTotal, logPage } = state;
  return `
    <div class="saas-section">
      <h2>📋 操作日志（共 ${logTotal} 条）</h2>
      <div class="saas-panel" style="margin-top:16px;">
        <table>
          <thead><tr><th>时间</th><th>租户</th><th>操作人</th><th>操作类型</th><th>操作对象</th><th>IP</th></tr></thead>
          <tbody>
            ${logs.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#999;">暂无日志</td></tr>' : ''}
            ${logs.map(log => `
              <tr>
                <td>${formatTime(log.create_time)}</td>
                <td><code>${escapeHtml(log.tenant_code)}</code></td>
                <td>${escapeHtml(log.admin_type === 'super_admin' ? '超级管理员' : '租户管理员')}</td>
                <td><span class="saas-badge">${escapeHtml(log.action)}</span></td>
                <td>${escapeHtml(log.target)}</td>
                <td><code>${escapeHtml(log.ip)}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${logTotal > 30 ? renderPagination(logPage, Math.ceil(logTotal / 30), 'logs') : ''}
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
  else if (state.section === 'tenants') body = renderTenants();
  else if (state.section === 'logs') body = renderLogs();

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
window.saasApp = {
  login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    doLogin(form.get('username'), form.get('password')).catch(e => alert('登录失败：' + e.message));
  },
  logout() {
    sessionStorage.removeItem('saas-token');
    setState({ authed: false, token: '', admin: null, overview: null });
  },
  openSection(section) {
    setState({ section, tenantDetail: null, createFormVisible: false });
    if (section === 'dashboard') loadOverview();
    else if (section === 'tenants') loadTenants(1);
    else if (section === 'logs') loadLogs(1);
  },
  showCreateForm() {
    setState({ createFormVisible: true, createMsg: '' });
  },
  hideCreateForm() {
    setState({ createFormVisible: false, createMsg: '' });
  },
  createTenant(event) {
    event.preventDefault();
    doCreateTenant(new FormData(event.currentTarget));
  },
  viewDetail(id) {
    loadTenantDetail(id);
  },
  closeDetail() {
    setState({ tenantDetail: null });
  },
  disableTenant(id) {
    doDisableTenant(id);
  },
  enableTenant(id) {
    doEnableTenant(id);
  },
  goPage(section, page) {
    if (section === 'tenants') loadTenants(page);
    else if (section === 'logs') loadLogs(page);
  },
};

render();
if (state.authed) {
  loadOverview();
}
