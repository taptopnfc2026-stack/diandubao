import { formatDateTime, normalizeDashboard } from './adminData.js';
import { fetchDashboard, saveOperationSettings, saveUserProfile } from './adminApi.js';
import './styles.css';

const app = document.querySelector('#admin-app');
const state = {
  authed: localStorage.getItem('diandu-admin-demo-auth') === '1',
  loading: false,
  section: 'dashboard',
  dashboard: normalizeDashboard(),
};

function money(cents) {
  return `¥${(Number(cents || 0) / 100).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
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
  const payload = await fetchDashboard();
  setState({ dashboard: normalizeDashboard(payload), loading: false });
}

window.adminApp = {
  openSection(section) {
    setState({ section });
  },
  login(event) {
    event.preventDefault();
    localStorage.setItem('diandu-admin-demo-auth', '1');
    setState({ authed: true });
    loadDashboard();
  },
  logout() {
    localStorage.removeItem('diandu-admin-demo-auth');
    setState({ authed: false });
  },
  async saveSettings(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true });
    const payload = await saveOperationSettings({
      newUserFreeMinutes: form.get('newUserFreeMinutes'),
      inviteRewardMinutes: form.get('inviteRewardMinutes'),
      adRewardMinutes: form.get('adRewardMinutes'),
    });
    setState({ dashboard: normalizeDashboard(payload), loading: false });
  },
  async saveUser(event, id) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ loading: true });
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
  },
};

function renderLogin() {
  app.innerHTML = `
    <main class="login-page">
      <form class="login-card" onsubmit="adminApp.login(event)">
        <h1>点读后台</h1>
        <p>用户统计与收费准备</p>
        <label>账号<input value="admin" autocomplete="username" /></label>
        <label>密码<input value="admin123" type="password" autocomplete="current-password" /></label>
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
};

function renderSidebar() {
  const items = [
    ['dashboard', '数据看板'],
    ['users', '用户管理'],
    ['plans', '会员套餐'],
    ['settings', '运营设置'],
    ['orders', '订单管理'],
  ];
  return `
    <aside>
      <strong>点读后台</strong>
      ${items.map(([id, label]) => `
        <a class="${state.section === id ? 'active' : ''}" onclick="adminApp.openSection('${id}')">${label}</a>
      `).join('')}
      <button onclick="adminApp.logout()">退出</button>
    </aside>
  `;
}

function renderMetrics(counters) {
  return `
    <div class="metric-grid">
      <article onclick="adminApp.openSection('users')"><small>总注册用户</small><strong>${counters.totalUsers}</strong></article>
      <article onclick="adminApp.openSection('users')"><small>今日新增</small><strong>${counters.todayUsers}</strong></article>
      <article onclick="adminApp.openSection('users')"><small>活跃用户</small><strong>${counters.activeUsers}</strong></article>
      <article onclick="adminApp.openSection('users')"><small>会员用户</small><strong>${counters.paidUsers}</strong></article>
      <article onclick="adminApp.openSection('orders')"><small>累计收入</small><strong>${money(counters.revenueCents)}</strong></article>
      <article onclick="adminApp.openSection('orders')"><small>会员兑换</small><strong>${counters.memberExchangeCount}</strong></article>
      <article onclick="adminApp.openSection('users')"><small>邀请人数</small><strong>${counters.inviteCount}</strong></article>
      <article onclick="adminApp.openSection('users')"><small>广告次数</small><strong>${counters.adWatchCount}</strong></article>
      <article onclick="adminApp.openSection('orders')"><small>发放分钟</small><strong>${counters.grantedMinutes}</strong></article>
      <article onclick="adminApp.openSection('users')"><small>剩余分钟</small><strong>${counters.remainingMinutes}</strong></article>
    </div>
  `;
}

function renderSettingsForm(settings) {
  return `
    <section class="panel wide">
      <h2>运营设置</h2>
      <form class="settings-form" onsubmit="adminApp.saveSettings(event)">
        <label><span>新用户默认免费时长</span><div><input name="newUserFreeMinutes" type="number" min="0" value="${settings.newUserFreeMinutes}" /><small>分钟</small></div></label>
        <label><span>邀请好友奖励时长</span><div><input name="inviteRewardMinutes" type="number" min="0" value="${settings.inviteRewardMinutes}" /><small>分钟</small></div></label>
        <label><span>观看广告奖励时长</span><div><input name="adRewardMinutes" type="number" min="0" value="${settings.adRewardMinutes}" /><small>分钟</small></div></label>
        <button>${state.loading ? '保存中...' : '保存设置'}</button>
      </form>
    </section>
  `;
}

function renderUsersTable(users) {
  return `
    <section class="panel wide">
      <h2>用户管理</h2>
      ${users.map((user) => `
        <form id="user-form-${escapeHtml(user.id)}" class="user-edit-form" onsubmit="adminApp.saveUser(event, '${escapeHtml(user.id)}')"></form>
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

function renderPlansList(plans) {
  return `
    <section class="panel wide">
      <h2>会员套餐</h2>
      <div class="plan-grid">
        ${plans.map((plan) => `
          <div class="plan-card">
            <strong>${escapeHtml(plan.name)}</strong>
            <span>${money(plan.price_cents)} / ${plan.duration_days} 天</span>
            <small>${plan.status ? '已启用' : '已停用'}</small>
          </div>
        `).join('')}
      </div>
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
    return `<div class="section-grid">${renderPlansList(plans)}${renderExchangesList(exchanges)}</div>`;
  }
  if (state.section === 'settings') {
    return `<div class="section-grid">${renderSettingsForm(settings)}</div>`;
  }
  if (state.section === 'orders') {
    return `<div class="section-grid">${renderOrdersList(orders)}${renderExchangesList(exchanges)}${renderRewardsList(rewards)}</div>`;
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
          <span>收费模块预备版</span>
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
if (state.authed) loadDashboard();
