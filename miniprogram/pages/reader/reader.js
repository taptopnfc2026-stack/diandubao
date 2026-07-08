const api = require('../../utils/api');
const { buildTapRegions } = require('../../utils/coordinate');
const { getNextPageNumber, getSwipePageDelta, selectReaderPage } = require('../../utils/navigation');

Page({
  data: {
    bookId: '',
    bookName: '',
    pageNo: 1,
    endPage: '',
    page: null,
    regions: [],
  },
  audio: null,
  playQueue: [],
  playQueueIndex: 0,
  touchStartX: 0,
  touchStartY: 0,
  onLoad(options) {
    this.audio = wx.createInnerAudioContext();
    this.audio.onEnded(() => this.playNextInQueue());
    this.setData({
      bookId: options.book_id || '',
      bookName: decodeURIComponent(options.book_name || '') || '五年级上册',
      pageNo: Number(options.page || 1) || 1,
      endPage: Number(options.end_page || 0) || '',
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
      const selectedPage = selectReaderPage(pages, this.data.pageNo);
      const page = selectedPage ? { ...selectedPage } : null;
      this.setData({ page, pageNo: Number(page && page.c_page ? page.c_page : this.data.pageNo), regions: [] });
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
    this.playQueue = [];
    this.playQueueIndex = 0;
    this.audio.stop();
    this.audio.src = String(region.audioUrl).replace(/\\\//g, '/');
    this.audio.play();
  },
  playAll() {
    this.playQueue = this.data.regions.map((region) => region.audioUrl).filter(Boolean);
    this.playQueueIndex = 0;
    this.playNextInQueue();
  },
  playNextInQueue() {
    const url = this.playQueue[this.playQueueIndex];
    if (!url) return;
    this.playQueueIndex += 1;
    this.audio.stop();
    this.audio.src = String(url).replace(/\\\//g, '/');
    this.audio.play();
  },
  async changePage(event) {
    const delta = Number(event.currentTarget.dataset.delta);
    this.changePageByDelta(delta);
  },
  async changePageByDelta(delta) {
    const pageNo = getNextPageNumber(this.data.pageNo, delta, { min: 1, max: this.data.endPage || Infinity });
    if (pageNo === this.data.pageNo) return;
    this.setData({ pageNo });
    try {
      await api.updatebookpage(this.data.bookId, pageNo);
    } catch (error) {
      wx.showToast({ title: '页码保存失败', icon: 'none' });
    }
    this.loadPage();
  },
  onTouchStart(event) {
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  },
  onTouchEnd(event) {
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;
    const delta = getSwipePageDelta(
      { x: this.touchStartX, y: this.touchStartY },
      { x: touch.clientX, y: touch.clientY }
    );
    if (delta) this.changePageByDelta(delta);
  },
  replay() {
    if (this.audio) this.audio.play();
  },
  goBack() {
    wx.navigateBack();
  },
  openChapters() {
    wx.navigateTo({
      url: `/pages/chapters/chapters?book_id=${this.data.bookId}&page=${this.data.pageNo}&end_page=${this.data.endPage || ''}&book_name=${encodeURIComponent(this.data.bookName || '')}`,
    });
  },
});
