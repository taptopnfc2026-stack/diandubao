const api = require('../../utils/api');
const { normalizeAlphabetLetters } = require('../../utils/learning');

Page({
  data: {
    letters: [],
  },
  audio: null,
  onLoad() {
    this.audio = wx.createInnerAudioContext();
    this.loadData();
  },
  onUnload() {
    if (this.audio) this.audio.destroy();
  },
  async loadData() {
    try {
      this.setData({ letters: normalizeAlphabetLetters(await api.getfayin()) });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  play(event) {
    const item = this.data.letters[Number(event.currentTarget.dataset.index)];
    if (!item || !item.audioUrl) return;
    this.audio.stop();
    this.audio.src = item.audioUrl;
    this.audio.play();
  },
  goBack() {
    wx.navigateBack();
  },
});
