const api = require('../../utils/api');
const { flattenPhonicsGroups } = require('../../utils/learning');

Page({
  data: {
    groups: [],
  },
  onLoad() {
    this.loadData();
  },
  async loadData() {
    try {
      const data = await api.getpindu();
      this.setData({ groups: flattenPhonicsGroups(data.list || data) });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  openDetail(event) {
    const { id, type } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/phonics-detail/phonics-detail?id=${id}&type=${type || ''}` });
  },
  goExperience() {
    wx.showToast({ title: '即将开启体验', icon: 'none' });
  },
  goBack() {
    wx.navigateBack();
  },
});
