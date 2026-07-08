export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function getMemberState(expireTime, now = Math.floor(Date.now() / 1000)) {
  const expire = toNumber(expireTime);
  if (!expire) return '免费';
  return expire > now ? '会员' : '已过期';
}

export function formatDateTime(value) {
  const timestamp = toNumber(value);
  if (!timestamp) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000));
}

export function normalizeDashboard(payload = {}, now = Math.floor(Date.now() / 1000)) {
  const counters = payload.counters || {};
  const users = Array.isArray(payload.users) ? payload.users : [];
  const plans = Array.isArray(payload.plans) ? payload.plans : [];
  const orders = Array.isArray(payload.orders) ? payload.orders : [];

  return {
    counters: {
      totalUsers: toNumber(counters.total_users || counters.totalUsers),
      todayUsers: toNumber(counters.today_users || counters.todayUsers),
      activeUsers: toNumber(counters.active_users || counters.activeUsers),
      paidUsers: toNumber(counters.paid_users || counters.paidUsers),
      revenueCents: toNumber(counters.revenue_cents || counters.revenueCents),
    },
    users: users.map((user) => ({
      id: user.id || user.uid || '',
      openid: user.openid || '',
      nickname: user.nickname || user.username || '未命名用户',
      avatar: user.avatar || '',
      mobile: user.mobile || '',
      currentBook: user.book_name || user.currentBook || '-',
      currentPage: toNumber(user.cur_page || user.currentPage),
      createTime: toNumber(user.create_time || user.createTime),
      lastLoginTime: toNumber(user.last_login_time || user.lastLoginTime),
      memberExpireTime: toNumber(user.member_expire_time || user.memberExpireTime),
      memberState: getMemberState(user.member_expire_time || user.memberExpireTime, now),
    })),
    plans,
    orders,
  };
}
