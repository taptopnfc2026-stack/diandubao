export const mockProfile = {
  user: {
    title: '登录 / 注册',
    subtitle: '登录后同步学习记录',
  },
  usage: {
    usedMinutesToday: 18,
    totalMinutesToday: 70,
    remainingMinutes: 52,
  },
  reward: {
    earnedMinutes: 30,
  },
};

export function getUsagePercent(usage = {}) {
  const used = Number(usage.usedMinutesToday || 0);
  const total = Number(usage.totalMinutesToday || 0);
  return total > 0 ? Math.round((used / total) * 100) : 0;
}
