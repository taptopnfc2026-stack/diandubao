const api = require('../../utils/api');
const { buildTapRegions } = require('../../utils/coordinate');
const { selectReaderPage } = require('../../utils/navigation');

Page({
  data: {
    bookId: '',
    bookName: '',
    pageNo: 1,
    endPage: 0,
    swiperIndex: 0,
    pageList: [],
  },
  audio: null,
  playQueue: [],
  playQueueIndex: 0,
  isSwiping: false,

  onLoad(options) {
    this.audio = wx.createInnerAudioContext();
    this.audio.obeyMuteSwitch = false;
    this.audio.onEnded(() => this.playNextInQueue());
    this.audio.onError((err) => {
      console.error('audio error', err);
      wx.showToast({ title: '音频播放失败', icon: 'none' });
    });
    const pageNo = Number(options.page || 1) || 1;
    const endPage = Number(options.end_page || 0) || 0;
    this.setData({
      bookId: options.book_id || '',
      bookName: decodeURIComponent(options.book_name || '') || '五年级上册',
      pageNo,
      endPage,
    });
    this.initPageList(pageNo, endPage);
    this.loadPage(pageNo);
    if (pageNo > 1) this.loadPage(pageNo - 1);
    if (pageNo < endPage) this.loadPage(pageNo + 1);
  },

  onUnload() {
    if (this.audio) this.audio.destroy();
  },

  /* 初始化完整 swiper 页面列表，避免滑动到边缘时重建列表导致跳动 */
  initPageList(currentPageNo, endPage) {
    const list = [];
    const max = Number(endPage) || currentPageNo;
    for (let pno = 1; pno <= max; pno += 1) {
      list.push({ pageNo: pno, page: null, imageBox: null, stageStyle: '', layerStyle: '', regions: [], loading: false });
    }
    this.setData({ pageList: list, swiperIndex: Math.max(0, currentPageNo - 1) });
  },

  /* 加载单页数据 */
  async loadPage(pageNo) {
    const idx = pageNo - 1;
    if (idx < 0 || idx >= this.data.pageList.length) return;

    const pageEntry = this.data.pageList[idx];
    if (pageEntry.page || pageEntry.loading) return;

    this.setData({ [`pageList[${idx}].loading`]: true });

    try {
      const data = await api.bookpage(this.data.bookId, pageNo);
      const pages = Array.isArray(data.pages && data.pages.pages)
        ? data.pages.pages
        : Array.isArray(data.pages)
          ? data.pages
          : [];
      const selected = selectReaderPage(pages, pageNo);
      const page = selected ? { ...selected } : null;
      this.setData({
        [`pageList[${idx}].page`]: page,
        [`pageList[${idx}].imageBox`]: null,
        [`pageList[${idx}].stageStyle`]: '',
        [`pageList[${idx}].layerStyle`]: '',
        [`pageList[${idx}].regions`]: [],
        [`pageList[${idx}].loading`]: false,
      });
    } catch (error) {
      console.error('loadPage error', pageNo, error);
      this.setData({ [`pageList[${idx}].loading`]: false });
    }
  },

  /* 图片加载完成后计算点击区域 */
  onImageLoad(event) {
    const listIndex = Number(event.currentTarget.dataset.index);
    this.buildRegionsForImage(listIndex, event.detail.width, event.detail.height);
  },

  buildRegionsForImage(listIndex, rawWidth, rawHeight, retry = 0) {
    const entry = this.data.pageList[listIndex];
    if (!entry || !entry.page || !rawWidth || !rawHeight) return;
    wx.createSelectorQuery()
      .in(this)
      .select(`#page-image-${listIndex}`)
      .boundingClientRect((rect) => {
        if ((!rect || !rect.width) && retry < 3) {
          setTimeout(() => this.buildRegionsForImage(listIndex, rawWidth, rawHeight, retry + 1), 80);
          return;
        }
        const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
        const width = rect && rect.width ? rect.width : systemInfo.windowWidth || 375;
        const height = (width * rawHeight) / rawWidth;
        const imageBox = {
          left: 0,
          top: 0,
          width,
          height,
        };
        const regions = buildTapRegions(entry.page, imageBox);
        this.setData({
          [`pageList[${listIndex}].imageBox`]: imageBox,
          [`pageList[${listIndex}].stageStyle`]: `height:${height}px;`,
          [`pageList[${listIndex}].layerStyle`]: `width:${width}px;height:${height}px;`,
          [`pageList[${listIndex}].regions`]: regions,
        });
      })
      .exec();
  },

  onImageError(event) {
    const listIndex = Number(event.currentTarget.dataset.index);
    console.error('page image load error', listIndex, event.detail);
    wx.showToast({ title: '页面图片加载失败', icon: 'none' });
  },

  /* 点击区域播放 */
  playRegion(event) {
    const listIndex = Number(event.currentTarget.dataset.pageIndex);
    const regionIndex = Number(event.currentTarget.dataset.regionIndex);
    const entry = this.data.pageList[listIndex];
    if (!entry) return;
    const region = entry.regions[regionIndex];
    if (!region || !region.audioUrl) {
      wx.showToast({ title: '暂无朗读音频', icon: 'none' });
      return;
    }
    this.playQueue = [];
    this.playQueueIndex = 0;
    this.audio.stop();
    this.audio.src = String(region.audioUrl).replace(/\\\//g, '/');
    this.audio.play();
  },

  /* 连读 */
  playAll() {
    const entry = this.data.pageList[this.data.swiperIndex];
    if (!entry) return;
    const urls = entry.regions.map((r) => r.audioUrl).filter(Boolean);
    if (urls.length === 0) {
      wx.showToast({ title: '当前页没有朗读音频', icon: 'none' });
      return;
    }
    this.playQueue = urls;
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

  /* Swiper 变化时记录（滑动过程中） */
  onSwiperChange(event) {
    this.isSwiping = true;
    this.setData({ swiperIndex: event.detail.current });
  },

  /* Swiper 滑动结束后加载相邻页面并保存进度 */
  async onSwiperFinish(event) {
    this.isSwiping = false;
    const newIndex = event.detail.current;
    const newPageNo = newIndex + 1;
    if (newPageNo < 1 || newPageNo > this.data.endPage) return;

    this.setData({ pageNo: newPageNo, swiperIndex: newIndex });

    // 确保当前页已加载
    if (!this.data.pageList[newIndex].page) {
      await this.loadPage(newPageNo);
    }

    // 预加载前后页
    if (newPageNo > 1) this.loadPage(newPageNo - 1);
    if (newPageNo < this.data.endPage) this.loadPage(newPageNo + 1);

    // 保存进度
    try {
      await api.updatebookpage(this.data.bookId, newPageNo);
    } catch (error) {
      console.error('save progress error', error);
    }
  },

  /* 复读 */
  replay() {
    if (this.audio && this.audio.src) {
      this.audio.play();
    } else {
      wx.showToast({ title: '请先点击课文朗读', icon: 'none' });
    }
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
