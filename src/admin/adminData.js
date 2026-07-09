export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export const defaultAdminSettings = {
  newUserFreeMinutes: 70,
  inviteRewardMinutes: 20,
  adRewardMinutes: 10,
};

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

function normalizeSettings(settings = {}) {
  return {
    newUserFreeMinutes: toNumber(settings.new_user_free_minutes ?? settings.newUserFreeMinutes ?? defaultAdminSettings.newUserFreeMinutes),
    inviteRewardMinutes: toNumber(settings.invite_reward_minutes ?? settings.inviteRewardMinutes ?? defaultAdminSettings.inviteRewardMinutes),
    adRewardMinutes: toNumber(settings.ad_reward_minutes ?? settings.adRewardMinutes ?? defaultAdminSettings.adRewardMinutes),
  };
}

function rewardTypeLabel(type) {
  return {
    invite: '邀请好友',
    ad: '观看广告',
    register: '新用户注册',
    manual: '后台发放',
  }[type] || '奖励';
}

export function normalizeDashboard(payload = {}, now = Math.floor(Date.now() / 1000)) {
  const counters = payload.counters || {};
  const users = Array.isArray(payload.users) ? payload.users : [];
  const plans = Array.isArray(payload.plans) ? payload.plans : [];
  const orders = Array.isArray(payload.orders) ? payload.orders : [];
  const exchanges = Array.isArray(payload.exchanges) ? payload.exchanges : [];
  const rewards = Array.isArray(payload.rewards) ? payload.rewards : [];

  return {
    counters: {
      totalUsers: toNumber(counters.total_users || counters.totalUsers),
      todayUsers: toNumber(counters.today_users || counters.todayUsers),
      activeUsers: toNumber(counters.active_users || counters.activeUsers),
      paidUsers: toNumber(counters.paid_users || counters.paidUsers),
      revenueCents: toNumber(counters.revenue_cents || counters.revenueCents),
      memberExchangeCount: toNumber(counters.member_exchange_count || counters.memberExchangeCount),
      inviteCount: toNumber(counters.invite_count || counters.inviteCount),
      adWatchCount: toNumber(counters.ad_watch_count || counters.adWatchCount),
      grantedMinutes: toNumber(counters.granted_minutes || counters.grantedMinutes),
      remainingMinutes: toNumber(counters.remaining_minutes || counters.remainingMinutes),
    },
    settings: normalizeSettings(payload.settings),
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
      inviteCount: toNumber(user.invite_count || user.inviteCount),
      adWatchCount: toNumber(user.ad_watch_count || user.adWatchCount),
      rewardMinutes: toNumber(user.reward_minutes || user.rewardMinutes),
      remainingMinutes: toNumber(user.remaining_minutes || user.remainingMinutes),
      memberExchangeCount: toNumber(user.member_exchange_count || user.memberExchangeCount),
    })),
    plans,
    orders,
    exchanges: exchanges.map((exchange) => ({
      id: exchange.id || '',
      nickname: exchange.nickname || '未命名用户',
      planName: exchange.plan_name || exchange.planName || '会员',
      exchangeTime: toNumber(exchange.exchange_time || exchange.exchangeTime),
    })),
    rewards: rewards.map((reward) => {
      const type = reward.type || 'manual';
      return {
        id: reward.id || '',
        nickname: reward.nickname || '未命名用户',
        type,
        typeLabel: rewardTypeLabel(type),
        minutes: toNumber(reward.minutes),
        createTime: toNumber(reward.create_time || reward.createTime),
      };
    }),
  };
}
