import { formatDateTime, normalizeDashboard } from './adminData.js';
import { fetchDashboard, saveOperationSettings } from './adminApi.js';
import './styles.css';

const app = document.querySelector('#admin-app');
const state = {
  authed: localStorage.getItem('diandu-admin-demo-auth') === '1',
  loading: false,
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

function renderDashboard() {
  const { counters, users, plans, orders, settings, exchanges, rewards } = state.dashboard;
  app.innerHTML = `
    <main class="admin-shell">
      <aside>
        <strong>点读后台</strong>
        <a class="active">数据看板</a>
        <a>用户管理</a>
        <a>会员套餐</a>
        <a>运营设置</a>
        <a>订单管理</a>
        <button onclick="adminApp.logout()">退出</button>
      </aside>
      <section class="content">
        <header>
          <div>
            <h1>数据看板</h1>
            <p>${state.loading ? '加载中...' : '已连接后台接口，接口未就绪时显示演示数据'}</p>
          </div>
          <span>收费模块预备版</span>
        </header>
        <div class="metric-grid">
          <article><small>总注册用户</small><strong>${counters.totalUsers}</strong></article>
          <article><small>今日新增</small><strong>${counters.todayUsers}</strong></article>
          <article><small>活跃用户</small><strong>${counters.activeUsers}</strong></article>
          <article><small>会员用户</small><strong>${counters.paidUsers}</strong></article>
          <article><small>累计收入</small><strong>${money(counters.revenueCents)}</strong></article>
          <article><small>会员兑换</small><strong>${counters.memberExchangeCount}</strong></article>
          <article><small>邀请人数</small><strong>${counters.inviteCount}</strong></article>
          <article><small>广告次数</small><strong>${counters.adWatchCount}</strong></article>
          <article><small>发放分钟</small><strong>${counters.grantedMinutes}</strong></article>
          <article><small>剩余分钟</small><strong>${counters.remainingMinutes}</strong></article>
        </div>
        <div class="section-grid">
          <section class="panel wide">
            <h2>运营设置</h2>
            <form class="settings-form" onsubmit="adminApp.saveSettings(event)">
              <label><span>新用户默认免费时长</span><div><input name="newUserFreeMinutes" type="number" min="0" value="${settings.newUserFreeMinutes}" /><small>分钟</small></div></label>
              <label><span>邀请好友奖励时长</span><div><input name="inviteRewardMinutes" type="number" min="0" value="${settings.inviteRewardMinutes}" /><small>分钟</small></div></label>
              <label><span>观看广告奖励时长</span><div><input name="adRewardMinutes" type="number" min="0" value="${settings.adRewardMinutes}" /><small>分钟</small></div></label>
              <button>${state.loading ? '保存中...' : '保存设置'}</button>
            </form>
          </section>
          <section class="panel wide">
            <h2>最近用户</h2>
            <table>
              <thead><tr><th>用户</th><th>手机号</th><th>当前教材</th><th>页数</th><th>会员</th><th>邀请</th><th>广告</th><th>奖励</th><th>剩余</th><th>兑换</th><th>最近登录</th></tr></thead>
              <tbody>
                ${users.map((user) => `
                  <tr>
                    <td>${escapeHtml(user.nickname)}</td>
                    <td>${escapeHtml(user.mobile || '-')}</td>
                    <td>${escapeHtml(user.currentBook)}</td>
                    <td>${user.currentPage}</td>
                    <td><span class="badge">${escapeHtml(user.memberState)}</span></td>
                    <td>${user.inviteCount}</td>
                    <td>${user.adWatchCount}</td>
                    <td>${user.rewardMinutes} 分钟</td>
                    <td>${user.remainingMinutes} 分钟</td>
                    <td>${user.memberExchangeCount}</td>
                    <td>${formatDateTime(user.lastLoginTime)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>
          <section class="panel">
            <h2>会员套餐</h2>
            ${plans.map((plan) => `
              <div class="plan-row">
                <strong>${escapeHtml(plan.name)}</strong>
                <span>${money(plan.price_cents)} / ${plan.duration_days} 天</span>
              </div>
            `).join('')}
          </section>
          <section class="panel">
            <h2>最近订单</h2>
            ${orders.map((order) => `
              <div class="order-row">
                <strong>${escapeHtml(order.order_no)}</strong>
                <span>${escapeHtml(order.nickname)} · ${escapeHtml(order.plan_name)} · ${money(order.amount_cents)}</span>
              </div>
            `).join('')}
          </section>
          <section class="panel">
            <h2>会员兑换记录</h2>
            ${exchanges.map((exchange) => `
              <div class="order-row">
                <strong>${escapeHtml(exchange.nickname)}</strong>
                <span>${escapeHtml(exchange.planName)} · ${formatDateTime(exchange.exchangeTime)}</span>
              </div>
            `).join('')}
          </section>
          <section class="panel">
            <h2>奖励记录</h2>
            ${rewards.map((reward) => `
              <div class="order-row">
                <strong>${escapeHtml(reward.nickname)} · ${escapeHtml(reward.typeLabel)}</strong>
                <span>+${reward.minutes} 分钟 · ${formatDateTime(reward.createTime)}</span>
              </div>
            `).join('')}
          </section>
        </div>
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
