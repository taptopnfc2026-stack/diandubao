const api = require('../../utils/api');
const { buildTapRegions, normalizeAudioItems } = require('../../utils/coordinate');

Page({
  data: {
    bookId: '',
    pageNo: 1,
    page: null,
    regions: [],
  },
  audio: null,
  onLoad(options) {
    this.audio = wx.createInnerAudioContext();
    this.setData({
      bookId: options.book_id || '',
      pageNo: Number(options.page || 1) || 1,
    });
    this.loadPage();
  },
  onUnload() {
    if (this.audio) this.audio.destroy();
  },
  async loadPage() {
    try {
      const data = await api.bookpage(this.data.bookId, this.data.pageNo);
      const pages = Array.isArray(data.pages && data.pages.pages)
        ? data.pages.pages
        : Array.isArray(data.pages)
          ? data.pages
          : [];
      const page = pages[0] ? { ...pages[0], word_mp3: normalizeAudioItems(pages[0].word_mp3) } : null;
      this.setData({ page, regions: [] });
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },
  onImageLoad(event) {
    const rawWidth = event.detail.width;
    const rawHeight = event.detail.height;
    wx.createSelectorQuery()
      .in(this)
      .select('.page-image')
      .boundingClientRect((rect) => {
        if (!rect || !rawWidth || !rawHeight) return;
        const imageBox = {
          width: rect.width,
          height: (rect.width * rawHeight) / rawWidth,
        };
        const regions = buildTapRegions(this.data.page, imageBox);
        this.setData({ regions });
      })
      .exec();
  },
  playRegion(event) {
    const index = Number(event.currentTarget.dataset.index);
    const region = this.data.regions[index];
    if (!region || !region.audioUrl) return;
    this.audio.stop();
    this.audio.src = String(region.audioUrl).replace(/\\\//g, '/');
    this.audio.play();
  },
  async changePage(event) {
    const delta = Number(event.currentTarget.dataset.delta);
    const pageNo = Math.max(1, this.data.pageNo + delta);
    this.setData({ pageNo });
    try {
      await api.updatebookpage(this.data.bookId, pageNo);
    } catch (error) {
      wx.showToast({ title: '页码保存失败', icon: 'none' });
    }
    this.loadPage();
  },
  replay() {
    if (this.audio) this.audio.play();
  },
  goBack() {
    wx.navigateBack();
  },
  openChapters() {
    wx.navigateBack();
  },
});
