const api = require('../../utils/api');
const app = getApp();
const { normalizeVocabularyUnits, normalizeVocabularyWords } = require('../../utils/vocabulary');

Page({
  data: {
    bookId: '',
    units: [],
    activeUnitId: '',
    words: [],
  },
  onLoad(options) {
    const book = app.globalData.currentBook || {};
    this.setData({ bookId: options.book_id || book.id || book.book_id || '' });
    this.loadUnits();
  },
  async loadUnits() {
    try {
      const units = normalizeVocabularyUnits(await api.getVocabularyUnits(this.data.bookId));
      const activeUnitId = units[0] && units[0].id;
      this.setData({ units, activeUnitId });
      await this.loadWords(activeUnitId);
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  async loadWords(unitId) {
    const words = normalizeVocabularyWords(await api.getVocabularyWords(unitId));
    this.setData({ words, activeUnitId: unitId });
  },
  selectUnit(event) {
    this.loadWords(event.currentTarget.dataset.id);
  },
  startStudy() {
    app.globalData.vocabularyWords = this.data.words;
    wx.navigateTo({ url: '/pages/word-study/word-study' });
  },
  goBack() {
    wx.navigateBack();
  },
});
