const api = require('../../utils/api');
const { getFirstAudioUrl, normalizePhoneticDetail } = require('../../utils/learning');

Page({
  data: {
    detail: null,
  },
  audio: null,
  onLoad(options) {
    this.audio = wx.createInnerAudioContext();
    this.loadData(options.id);
  },
  onUnload() {
    if (this.audio) this.audio.destroy();
  },
  async loadData(id) {
    try {
      const data = await api.getfayindetail(id);
      this.setData({ detail: normalizePhoneticDetail(data) });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  play(event) {
    const index = Number(event.currentTarget.dataset.index || 0);
    const url = getFirstAudioUrl({ audioUrls: [this.data.detail.audioUrls[index], this.data.detail.audioUrls[0]] });
    if (!url) return;
    this.audio.stop();
    this.audio.src = url;
    this.audio.play();
  },
  goBack() {
    wx.navigateBack();
  },
});
