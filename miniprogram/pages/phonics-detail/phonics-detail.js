const api = require('../../utils/api');
const { flattenPhonicsGroups, getFirstAudioUrl, normalizePhonicsDetail } = require('../../utils/learning');

Page({
  data: {
    detail: null,
    peerItems: [],
    activeTab: 'mouth',
  },
  audio: null,
  onLoad(options) {
    this.audio = wx.createInnerAudioContext();
    this.loadData(options.id, options.type);
  },
  onUnload() {
    if (this.audio) this.audio.destroy();
  },
  async loadData(id, type) {
    try {
      const [detailData, groupsData] = await Promise.all([api.getpindudetail(id), api.getpindu()]);
      const detail = normalizePhonicsDetail(detailData);
      const groups = flattenPhonicsGroups(groupsData.list || groupsData);
      const group = groups.find((item) => (
        String(item.key) === String(type || detail.type)
        || item.items.some((child) => String(child.id) === String(id))
      ));
      this.setData({ detail, peerItems: group ? group.items : [], activeTab: 'mouth' });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  openPeer(event) {
    const id = event.currentTarget.dataset.id;
    this.loadData(id, this.data.detail && this.data.detail.type);
  },
  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab });
  },
  play(event) {
    const url = event.currentTarget.dataset.url || (this.data.detail && this.data.detail.audioUrl);
    const playable = getFirstAudioUrl({ audioUrl: url });
    if (!playable) return;
    this.audio.stop();
    this.audio.src = playable;
    this.audio.play();
  },
  goBack() {
    wx.navigateBack();
  },
});
