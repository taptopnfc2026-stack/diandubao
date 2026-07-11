const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    loading: false,
    cates: [],
    activeCatId: 7,
    books: [],
    selectedBookId: '',
  },
  onLoad() {
    const currentBook = app.globalData.currentBook || {};
    this.setData({
      activeCatId: Number(currentBook.cat_id || 7),
      selectedBookId: String(currentBook.id || currentBook.book_id || ''),
    });
    this.loadBooks(this.data.activeCatId);
  },
  async loadBooks(catId) {
    this.setData({ loading: true });
    try {
      const data = await api.booklist({ cat_id: catId || 7, type: 0 });
      const activeCatId = Number(catId || 7);
      const cates = (Array.isArray(data.cates) ? data.cates : this.data.cates)
        .map((item) => ({ ...item, isActive: Number(item.id) === activeCatId }));
      const activeCate = cates.find((item) => item.isActive) || {};
      const books = (Array.isArray(data.books) ? data.books : Array.isArray(data.list) ? data.list : Array.isArray(data) ? data : [])
        .map((item) => ({ ...item, isSelected: String(item.id) === this.data.selectedBookId }));
      this.setData({ cates, books, activeCatId, activeCatName: activeCate.name || '' });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
  selectCate(event) {
    const id = Number(event.currentTarget.dataset.id);
    this.loadBooks(id);
  },
  async selectBook(event) {
    const index = Number(event.currentTarget.dataset.index);
    const book = this.data.books[index];
    if (!book || !book.id) return;
    try {
      await api.updateuserbook(book.id);
      app.globalData.currentBook = book;
      app.globalData.currentPage = Number(book.start_page || 1) || 1;
      this.setData({ selectedBookId: String(book.id) });
      wx.redirectTo({ url: '/pages/home/home' });
    } catch (error) {
      wx.showToast({ title: error.message || '切换失败', icon: 'none' });
    }
  },
  goBack() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/home/home' }) });
  },
});
