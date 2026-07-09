import { describe, expect, it } from 'vitest';
import { getUsagePercent, mockProfile } from './profile.js';

describe('profile mock data', () => {
  it('provides usage data for my page', () => {
    expect(mockProfile.user.title).toBe('登录 / 注册');
    expect(mockProfile.usage.usedMinutesToday).toBe(18);
    expect(mockProfile.usage.totalMinutesToday).toBe(70);
    expect(getUsagePercent(mockProfile.usage)).toBe(26);
  });
});
