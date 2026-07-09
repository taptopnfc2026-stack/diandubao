const {
  createProfileView,
  defaultOperationSettings,
  getTimeLimitPrompt,
  getUsagePercent,
} = require('../../utils/profile');

const PROFILE_STORAGE_KEY = 'diandu-my-profile';
const SETTINGS_STORAGE_KEY = 'diandu-operation-settings';

function getProfilePayload() {
  return wx.getStorageSync(PROFILE_STORAGE_KEY) || {
    user: { registered: false },
    usage: { usedMinutesToday: 18 },
    growth: { inviteCount: 0, adWatchCount: 0, memberExchangeCount: 0 },
    reward: { manualRewardMinutes: 30 },
  };
}

function getSettings() {
  return wx.getStorageSync(SETTINGS_STORAGE_KEY) || defaultOperationSettings;
}

const initialProfile = createProfileView({ ...getProfilePayload(), settings: getSettings() });
const initialUsagePercent = getUsagePercent(initialProfile.usage);

Page({
  data: {
    profile: initialProfile,
    usagePercent: initialUsagePercent,
    ringDeg: initialUsagePercent * 3.6,
    menuItems: [],
    timeLimitPrompt: getTimeLimitPrompt(initialProfile),
    showTimeLimitPrompt: getTimeLimitPrompt(initialProfile).visible,
    taskView: '',
  },
  onLoad() {
    this.refreshProfile();
  },
  refreshProfile() {
    const profile = createProfileView({ ...getProfilePayload(), settings: getSettings() });
    const usagePercent = getUsagePercent(profile.usage);
    const timeLimitPrompt = getTimeLimitPrompt(profile);
    this.setData({
      profile,
      usagePercent,
      ringDeg: usagePercent * 3.6,
      timeLimitPrompt,
      showTimeLimitPrompt: timeLimitPrompt.visible,
      menuItems: [
        { icon: 'gift', title: '我的邀请', aside: `${profile.reward.inviteCount} 人` },
        { icon: 'coin', title: '我的奖励', aside: `已获得 ${profile.reward.earnedMinutes} 分钟` },
        { icon: 'card', title: '兑换记录', aside: `${profile.reward.memberExchangeCount} 次` },
        { icon: 'clock', title: '观看记录', aside: `${profile.reward.adWatchCount} 次` },
        { icon: 'chart', title: '学习报告', aside: '' },
        { icon: 'gear', title: '设置', aside: '' },
      ],
    });
  },
  updateProfile(updater) {
    const payload = getProfilePayload();
    const next = updater({
      ...payload,
      user: { ...(payload.user || {}) },
      usage: { ...(payload.usage || {}) },
      growth: { ...(payload.growth || {}) },
      reward: { ...(payload.reward || {}) },
    });
    wx.setStorageSync(PROFILE_STORAGE_KEY, next);
    this.refreshProfile();
  },
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.redirectTo({ url: '/pages/home/home' });
  },
  goHome() {
    wx.redirectTo({ url: '/pages/home/home' });
  },
  startReader() {
    const app = getApp();
    const book = app.globalData.currentBook;
    const bookId = book && (book.id || book.book_id);
    if (!bookId) {
      wx.redirectTo({ url: '/pages/home/home' });
      return;
    }
    wx.navigateTo({
      url: `/pages/reader/reader?book_id=${bookId}&page=${app.globalData.currentPage || 1}&end_page=${book.end_page || ''}&book_name=${encodeURIComponent(book.book_name || '')}`,
    });
  },
  openMember() {
    this.updateProfile((payload) => ({
      ...payload,
      user: { ...payload.user, registered: true, nickname: payload.user.nickname || '小程序用户' },
      growth: { ...payload.growth, memberExchangeCount: Number(payload.growth.memberExchangeCount || 0) + 1 },
      usage: {
        ...payload.usage,
        remainingMinutes: Math.max(this.data.profile.usage.remainingMinutes, 9999),
        totalMinutesToday: Math.max(this.data.profile.usage.totalMinutesToday, this.data.profile.usage.usedMinutesToday + 9999),
      },
    }));
    wx.showToast({ title: '已记录会员兑换', icon: 'none' });
  },
  openInviteTask() {
    this.setData({ taskView: 'invite', showTimeLimitPrompt: false });
  },
  openAdTask() {
    this.setData({ taskView: 'ad', showTimeLimitPrompt: false });
  },
  openMemberTask() {
    this.setData({ taskView: 'member', showTimeLimitPrompt: false });
  },
  closeTaskView() {
    this.setData({ taskView: '' });
  },
  completeInviteTask() {
    this.claimInviteReward();
    this.setData({ taskView: '' });
    wx.showToast({ title: '已领取邀请奖励', icon: 'none' });
  },
  completeAdTask() {
    this.claimAdReward();
    this.setData({ taskView: '' });
    wx.showToast({ title: '已领取广告奖励', icon: 'none' });
  },
  completeMemberTask() {
    this.openMember();
    this.setData({ taskView: '' });
  },
  closeTimeLimitPrompt() {
    this.setData({ showTimeLimitPrompt: false });
  },
  loginPreview() {
    this.updateProfile((payload) => ({
      ...payload,
      user: { ...payload.user, registered: true, nickname: '小程序用户' },
    }));
  },
  claimInviteReward() {
    this.updateProfile((payload) => ({
      ...payload,
      growth: { ...payload.growth, inviteCount: Number(payload.growth.inviteCount || 0) + 1 },
      usage: {
        ...payload.usage,
        remainingMinutes: this.data.profile.usage.remainingMinutes + this.data.profile.settings.inviteRewardMinutes,
        totalMinutesToday: this.data.profile.usage.totalMinutesToday + this.data.profile.settings.inviteRewardMinutes,
      },
    }));
  },
  claimAdReward() {
    this.updateProfile((payload) => ({
      ...payload,
      growth: { ...payload.growth, adWatchCount: Number(payload.growth.adWatchCount || 0) + 1 },
      usage: {
        ...payload.usage,
        remainingMinutes: this.data.profile.usage.remainingMinutes + this.data.profile.settings.adRewardMinutes,
        totalMinutesToday: this.data.profile.usage.totalMinutesToday + this.data.profile.settings.adRewardMinutes,
      },
    }));
  },
  noop() {},
});
