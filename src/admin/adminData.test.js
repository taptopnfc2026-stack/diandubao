import { describe, expect, it } from 'vitest';
import { formatDateTime, getMemberState, normalizeDashboard } from './adminData.js';

describe('admin dashboard data helpers', () => {
  it('normalizes dashboard counters and user rows', () => {
    const dashboard = normalizeDashboard({
      counters: { total_users: '8', today_users: '2', active_users: '5', paid_users: '1' },
      users: [
        { id: 1, nickname: 'Amy', create_time: 1783440000, last_login_time: 1783510000, member_expire_time: 1783590000 },
      ],
    });

    expect(dashboard.counters).toMatchObject({
      totalUsers: 8,
      todayUsers: 2,
      activeUsers: 5,
      paidUsers: 1,
      revenueCents: 0,
    });
    expect(dashboard.users[0]).toMatchObject({
      id: 1,
      nickname: 'Amy',
      memberState: '会员',
    });
  });

  it('computes member state from expire timestamps', () => {
    expect(getMemberState(1783590000, 1783510000)).toBe('会员');
    expect(getMemberState(1783500000, 1783510000)).toBe('已过期');
    expect(getMemberState(0, 1783510000)).toBe('免费');
  });

  it('formats unix timestamps for display', () => {
    expect(formatDateTime(0)).toBe('-');
    expect(formatDateTime(1783510000)).toMatch(/2026/);
  });

  it('normalizes operations settings and growth counters', () => {
    const dashboard = normalizeDashboard({
      counters: {
        total_users: 8,
        member_exchange_count: 3,
        invite_count: 12,
        ad_watch_count: 41,
        granted_minutes: 820,
        remaining_minutes: 430,
      },
      settings: {
        new_user_free_minutes: 80,
        invite_reward_minutes: 25,
        ad_reward_minutes: 12,
      },
      users: [
        {
          id: 1,
          nickname: 'Amy',
          invite_count: 2,
          ad_watch_count: 5,
          reward_minutes: 90,
          remaining_minutes: 52,
          member_exchange_count: 1,
        },
      ],
      exchanges: [
        { id: 11, nickname: 'Amy', plan_name: '月卡', exchange_time: 1783510000 },
      ],
      rewards: [
        { id: 21, nickname: 'Amy', type: 'invite', minutes: 25, create_time: 1783510000 },
      ],
    });

    expect(dashboard.counters).toMatchObject({
      memberExchangeCount: 3,
      inviteCount: 12,
      adWatchCount: 41,
      grantedMinutes: 820,
      remainingMinutes: 430,
    });
    expect(dashboard.settings).toEqual({
      newUserFreeMinutes: 80,
      inviteRewardMinutes: 25,
      adRewardMinutes: 12,
    });
    expect(dashboard.users[0]).toMatchObject({
      inviteCount: 2,
      adWatchCount: 5,
      rewardMinutes: 90,
      remainingMinutes: 52,
      memberExchangeCount: 1,
    });
    expect(dashboard.exchanges).toHaveLength(1);
    expect(dashboard.rewards[0].typeLabel).toBe('邀请好友');
  });
});
