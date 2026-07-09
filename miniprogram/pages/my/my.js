const { getUsagePercent, mockProfile } = require('../../utils/profile');

Page({
  data: {
    profile: mockProfile,
    usagePercent: getUsagePercent(mockProfile.usage),
    ringDeg: getUsagePercent(mockProfile.usage) * 3.6,
    menuItems: [
      { icon: 'gift', title: '我的邀请', aside: '' },
      { icon: 'coin', title: '我的奖励', aside: `已获得 ${mockProfile.reward.earnedMinutes} 分钟` },
      { icon: 'card', title: '兑换记录', aside: '' },
      { icon: 'clock', title: '观看记录', aside: '' },
      { icon: 'chart', title: '学习报告', aside: '' },
      { icon: 'gear', title: '设置', aside: '' },
    ],
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
    wx.showToast({ title: '会员入口已预留', icon: 'none' });
  },
  noop() {},
});
