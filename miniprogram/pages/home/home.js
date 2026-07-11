const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    loading: false,
    book: null,
    page: 1,
    progressCurrent: 1,
    progressTotal: 0,
  },
  onLoad() {
    this.loadHome();
  },
  onShow() {
    if (this.loadedOnce) this.loadHome();
  },
  async loadHome() {
    this.setData({ loading: true });
    try {
      const data = await api.index();
      const book = data.info || data.book || null;
      const startPage = Number(book && book.start_page) || 1;
      const endPage = Number(book && (book.end_page || book.total_page)) || 0;
      const page = Number(data.view_page || data.cur_page || startPage) || startPage;
      const progressCurrent = Math.max(startPage, Math.min(page, endPage || page));
      const progressTotal = endPage || Number(book && book.total_page) || progressCurrent;
      app.globalData.currentBook = book;
      app.globalData.currentPage = page;
      this.loadedOnce = true;
      this.setData({ book, page, progressCurrent, progressTotal });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
  openBooks() {
    wx.navigateTo({ url: '/pages/books/books' });
  },
  openPhonetics() {
    wx.navigateTo({ url: '/pages/phonetics/phonetics' });
  },
  openAlphabet() {
    wx.navigateTo({ url: '/pages/alphabet/alphabet' });
  },
  openPhonics() {
    wx.navigateTo({ url: '/pages/phonics/phonics' });
  },
  openMy() {
    wx.navigateTo({ url: '/pages/my/my' });
  },
  startReader() {
    const book = this.data.book;
    const bookId = book && (book.id || book.book_id);
    if (!bookId) {
      this.openBooks();
      return;
    }
    wx.navigateTo({
      url: `/pages/reader/reader?book_id=${bookId}&page=${this.data.page || 1}&end_page=${book.end_page || ''}&book_name=${encodeURIComponent(book.book_name || '')}`,
    });
  },
});
