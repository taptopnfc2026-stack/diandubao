const api = require('../../utils/api');
const { normalizePhoneticList } = require('../../utils/learning');

Page({
  data: {
    tabs: [],
    activeType: 0,
    itemsByType: {},
    currentItems: [],
  },
  onLoad() {
    this.loadData();
  },
  async loadData() {
    try {
      const data = await api.getfayinlist();
      const normalized = normalizePhoneticList(data);
      const activeType = Number(normalized.tabs[0] && normalized.tabs[0].id);
      this.setData({
        tabs: normalized.tabs,
        activeType,
        itemsByType: normalized.itemsByType,
        currentItems: normalized.itemsByType[activeType] || [],
      });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  selectTab(event) {
    const activeType = Number(event.currentTarget.dataset.type);
    this.setData({
      activeType,
      currentItems: this.data.itemsByType[activeType] || [],
    });
  },
  openDetail(event) {
    wx.navigateTo({ url: `/pages/phonetic-detail/phonetic-detail?id=${event.currentTarget.dataset.id}` });
  },
  goBack() {
    wx.navigateBack();
  },
});
