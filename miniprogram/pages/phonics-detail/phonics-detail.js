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
    this.audio.obeyMuteSwitch = false;
    this.audio.onError(() => {
      wx.showToast({ title: '音频播放失败', icon: 'none' });
    });
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
  async openPhonetic(event) {
    const id = event.currentTarget.dataset.id;
    if (!id || String(id) === String(this.data.detail && this.data.detail.phoneticId)) return;
    try {
      const data = await api.getpindufy(id);
      const info = data.other_info || {};
      const detail = {
        ...this.data.detail,
        phoneticId: data.id,
        selectedPhonetic: data.fy || info.yinbiao || '',
        image: (info.image || '').replace(/\\\//g, '/'),
        audioUrl: (info.sound || '').replace(/\\\//g, '/'),
        mouthSteps: Array.isArray(info.mouth) ? info.mouth.map((item, index) => ({
          id: item.id || index,
          text: item.step_content || '',
        })).filter((item) => item.text) : [],
        words: Array.isArray(info.word) ? info.word.map((item) => ({
          id: item.id,
          text: item.word || '',
          audioUrl: (item.sound || '').replace(/\\\//g, '/'),
          image: (item.image || '').replace(/\\\//g, '/'),
          startIndex: item.start_index,
          endIndex: item.end_index,
        })) : [],
        sentences: Array.isArray(info.sentence) ? info.sentence.map((item) => ({
          id: item.id,
          text: item.sentence || '',
          translation: item.translation || '',
          audioUrls: [item.sound_man, item.sound_woman].map((url) => (url || '').replace(/\\\//g, '/')).filter(Boolean),
          startIndex: item.start_index,
          endIndex: item.end_index,
        })) : [],
      };
      this.setData({ detail, activeTab: 'mouth' });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab });
  },
  play(event) {
    const url = event.currentTarget.dataset.url || (this.data.detail && this.data.detail.audioUrl);
    const playable = getFirstAudioUrl({ audioUrl: url });
    if (!playable) {
      wx.showToast({ title: '暂无发音音频', icon: 'none' });
      return;
    }
    this.audio.stop();
    this.audio.src = playable;
    this.audio.play();
  },
  goBack() {
    wx.navigateBack();
  },
});
