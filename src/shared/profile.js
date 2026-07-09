export const defaultOperationSettings = {
  newUserFreeMinutes: 70,
  inviteRewardMinutes: 20,
  adRewardMinutes: 10,
};

export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function normalizeOperationSettings(settings = {}) {
  return {
    newUserFreeMinutes: toNumber(settings.new_user_free_minutes ?? settings.newUserFreeMinutes ?? defaultOperationSettings.newUserFreeMinutes),
    inviteRewardMinutes: toNumber(settings.invite_reward_minutes ?? settings.inviteRewardMinutes ?? defaultOperationSettings.inviteRewardMinutes),
    adRewardMinutes: toNumber(settings.ad_reward_minutes ?? settings.adRewardMinutes ?? defaultOperationSettings.adRewardMinutes),
  };
}

export function createProfileView(payload = {}) {
  const settings = normalizeOperationSettings(payload.settings);
  const growth = payload.growth || {};
  const reward = payload.reward || {};
  const usage = payload.usage || {};
  const user = payload.user || {};
  const inviteCount = toNumber(growth.invite_count ?? growth.inviteCount);
  const adWatchCount = toNumber(growth.ad_watch_count ?? growth.adWatchCount);
  const memberExchangeCount = toNumber(growth.member_exchange_count ?? growth.memberExchangeCount);
  const manualRewardMinutes = toNumber(reward.manual_reward_minutes ?? reward.manualRewardMinutes);
  const earnedMinutes = manualRewardMinutes + (inviteCount * settings.inviteRewardMinutes) + (adWatchCount * settings.adRewardMinutes);
  const usedMinutesToday = toNumber(usage.used_minutes_today ?? usage.usedMinutesToday);
  const totalMinutesToday = toNumber(usage.total_minutes_today ?? usage.totalMinutesToday) || settings.newUserFreeMinutes + earnedMinutes;
  const hasRemainingMinutes = usage.remaining_minutes !== undefined || usage.remainingMinutes !== undefined;
  const remainingMinutes = Math.max(0, hasRemainingMinutes ? toNumber(usage.remaining_minutes ?? usage.remainingMinutes) : totalMinutesToday - usedMinutesToday);
  const registered = Boolean(user.registered || user.id || user.openid || user.nickname);

  return {
    user: {
      id: user.id || '',
      registered,
      title: registered ? (user.nickname || user.username || '已登录用户') : '登录 / 注册',
      subtitle: registered ? '学习记录已同步' : '登录后同步学习记录',
      avatar: user.avatar || '',
    },
    usage: {
      usedMinutesToday,
      totalMinutesToday,
      remainingMinutes,
    },
    reward: {
      earnedMinutes,
      inviteCount,
      adWatchCount,
      memberExchangeCount,
    },
    settings,
  };
}

export const mockProfile = createProfileView({
  user: { registered: false },
  usage: { usedMinutesToday: 18, totalMinutesToday: 70 },
  reward: { manualRewardMinutes: 30 },
  settings: defaultOperationSettings,
});

export function getUsagePercent(usage = {}) {
  const used = Number(usage.usedMinutesToday || 0);
  const total = Number(usage.totalMinutesToday || 0);
  return total > 0 ? Math.round((used / total) * 100) : 0;
}

export function isUsageExpired(usage = {}) {
  const total = toNumber(usage.totalMinutesToday);
  const remaining = toNumber(usage.remainingMinutes);
  return total > 0 && remaining <= 0;
}

export function getTimeLimitPrompt(profile = {}) {
  const usage = profile.usage || {};
  const settings = normalizeOperationSettings(profile.settings);
  const usedMinutes = toNumber(usage.usedMinutesToday);
  const expired = isUsageExpired(usage);
  return {
    visible: expired,
    title: '免费时长已用完',
    subtitle: '完成任务可继续使用',
    usedMinutes,
    message: `已用完 ${usedMinutes} 分钟，快去获取更多时长吧~`,
    inviteRewardMinutes: settings.inviteRewardMinutes,
    adRewardMinutes: settings.adRewardMinutes,
    memberTitle: '开通会员无限使用',
    memberSubtitle: '畅享所有功能，学习不受限',
  };
}
