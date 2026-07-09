import { describe, expect, it } from 'vitest';
import {
  createProfileView,
  getTimeLimitPrompt,
  getUsagePercent,
  isUsageExpired,
  mockProfile,
} from './profile.js';

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

  it('builds a free-time expired prompt with reward actions', () => {
    const profile = createProfileView({
      usage: { usedMinutesToday: 70, totalMinutesToday: 70 },
      settings: {
        newUserFreeMinutes: 70,
        inviteRewardMinutes: 30,
        adRewardMinutes: 10,
      },
    });
    const prompt = getTimeLimitPrompt(profile);

    expect(isUsageExpired(profile.usage)).toBe(true);
    expect(prompt).toMatchObject({
      visible: true,
      title: '免费时长已用完',
      usedMinutes: 70,
      inviteRewardMinutes: 30,
      adRewardMinutes: 10,
    });
  });

  it('treats explicit zero remaining minutes as expired', () => {
    const profile = createProfileView({
      usage: { usedMinutesToday: 18, totalMinutesToday: 70, remainingMinutes: 0 },
    });

    expect(profile.usage.remainingMinutes).toBe(0);
    expect(isUsageExpired(profile.usage)).toBe(true);
  });
});
