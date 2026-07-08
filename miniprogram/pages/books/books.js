const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    loading: false,
    books: [],
  },
  onLoad() {
    this.loadBooks();
  },
  async loadBooks() {
    this.setData({ loading: true });
    try {
      const data = await api.booklist({ cat_id: 7, type: 0 });
      const books = Array.isArray(data.list) ? data.list : Array.isArray(data) ? data : [];
      this.setData({ books });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
  async selectBook(event) {
    const index = Number(event.currentTarget.dataset.index);
    const book = this.data.books[index];
    if (!book || !book.id) return;
    try {
      await api.updateuserbook(book.id);
      app.globalData.currentBook = book;
      app.globalData.currentPage = Number(book.start_page || 1) || 1;
      wx.navigateTo({
        url: `/pages/chapters/chapters?book_id=${book.id}&book_name=${encodeURIComponent(book.book_name || '')}`,
      });
    } catch (error) {
      wx.showToast({ title: error.message || '切换失败', icon: 'none' });
    }
  },
  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
  },
});
