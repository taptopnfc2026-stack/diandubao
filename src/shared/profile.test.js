import { describe, expect, it } from 'vitest';
import { createProfileView, getUsagePercent, mockProfile } from './profile.js';

describe('profile mock data', () => {
  it('provides usage data for my page', () => {
    expect(mockProfile.user.title).toBe('登录 / 注册');
    expect(mockProfile.usage.usedMinutesToday).toBe(18);
    expect(mockProfile.usage.totalMinutesToday).toBe(70);
    expect(getUsagePercent(mockProfile.usage)).toBe(26);
  });

  it('derives my page usage from operation settings and reward counts', () => {
    const profile = createProfileView({
      user: { registered: true, nickname: 'Lily' },
      usage: { usedMinutesToday: 18 },
      growth: { inviteCount: 2, adWatchCount: 3, memberExchangeCount: 1 },
      reward: { manualRewardMinutes: 30 },
      settings: {
        newUserFreeMinutes: 60,
        inviteRewardMinutes: 20,
        adRewardMinutes: 10,
      },
    });

    expect(profile.user.title).toBe('Lily');
    expect(profile.usage.totalMinutesToday).toBe(160);
    expect(profile.usage.remainingMinutes).toBe(142);
    expect(profile.reward).toMatchObject({
      earnedMinutes: 100,
      inviteCount: 2,
      adWatchCount: 3,
      memberExchangeCount: 1,
    });
  });
});
