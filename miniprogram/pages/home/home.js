const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    loading: false,
    book: null,
    page: 1,
  },
  onLoad() {
    this.loadHome();
  },
  async loadHome() {
    this.setData({ loading: true });
    try {
      const data = await api.index();
      const book = data.info || data.book || null;
      const page = Number(data.view_page || data.cur_page || 1) || 1;
      app.globalData.currentBook = book;
      app.globalData.currentPage = page;
      this.setData({ book, page });
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
