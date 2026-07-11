const api = require('../../utils/api');

Page({
  data: {
    bookId: '',
    bookName: '',
    endPage: '',
    currentPage: 1,
    groupedChapters: [],
  },
  onLoad(options) {
    this.setData({
      bookId: options.book_id || '',
      bookName: decodeURIComponent(options.book_name || ''),
      endPage: Number(options.end_page || 0) || '',
      currentPage: Number(options.page || 1) || 1,
    });
    this.loadChapters();
  },
  async loadChapters() {
    if (!this.data.bookId) return;
    try {
      const data = await api.bookchapter(this.data.bookId);
      const chapters = Array.isArray(data.chapers) ? data.chapers : Array.isArray(data.chapters) ? data.chapters : [];
      this.setData({ groupedChapters: this.groupChapters(chapters) });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  groupChapters(chapters) {
    const groups = [];
    let currentGroup = null;
    chapters.forEach((chapter) => {
      const name = chapter.chapter_name || '';
      if (/^Unit\s+\d+/i.test(name)) {
        currentGroup = { title: name, items: [] };
        groups.push(currentGroup);
      } else if (currentGroup) {
        currentGroup.items.push(chapter);
      } else {
        currentGroup = { title: '目录', items: [chapter] };
        groups.push(currentGroup);
      }
    });
    return groups;
  },
  isActive(item) {
    const start = Number(item.start_page || 1);
    const end = Number(item.end_page || start);
    return this.data.currentPage >= start && this.data.currentPage <= end;
  },
  openChapter(event) {
    const index = Number(event.currentTarget.dataset.index);
    const groupIndex = Number(event.currentTarget.dataset.group);
    const chapter = this.data.groupedChapters[groupIndex].items[index];
    const page = Number(chapter && chapter.start_page ? chapter.start_page : 1) || 1;
    wx.redirectTo({
      url: `/pages/reader/reader?book_id=${this.data.bookId}&page=${page}&end_page=${this.data.endPage || ''}&book_name=${encodeURIComponent(this.data.bookName || '')}`,
    });
  },
  goBack() {
    wx.navigateBack();
  },
  onMaskTap() {
    wx.navigateBack();
  },
  onSheetTap() {
    // 阻止冒泡，避免点击内容区关闭弹窗
  },
});
