const api = require('../../utils/api');

Page({
  data: {
    bookId: '',
    bookName: '',
    chapters: [],
  },
  onLoad(options) {
    this.setData({
      bookId: options.book_id || '',
      bookName: decodeURIComponent(options.book_name || ''),
    });
    this.loadChapters();
  },
  async loadChapters() {
    if (!this.data.bookId) return;
    try {
      const data = await api.bookchapter(this.data.bookId);
      const chapters = Array.isArray(data.chapers) ? data.chapers : Array.isArray(data.chapters) ? data.chapters : [];
      this.setData({ chapters });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  openChapter(event) {
    const index = Number(event.currentTarget.dataset.index);
    const chapter = this.data.chapters[index];
    const page = Number(chapter && chapter.start_page ? chapter.start_page : 1) || 1;
    wx.navigateTo({
      url: `/pages/reader/reader?book_id=${this.data.bookId}&page=${page}&book_name=${encodeURIComponent(this.data.bookName || '')}`,
    });
  },
  goBack() {
    wx.navigateBack();
  },
});
