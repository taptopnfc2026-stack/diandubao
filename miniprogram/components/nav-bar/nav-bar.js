Component({
  options: {
    multipleSlots: true,
  },
  properties: {
    title: {
      type: String,
      value: '',
    },
    showBack: {
      type: Boolean,
      value: false,
    },
    background: {
      type: String,
      value: '#fff',
    },
  },
  data: {
    statusBarHeight: 20,
    navBarHeight: 64,
    capsuleTop: 26,
    capsuleWidth: 87,
    capsuleHeight: 32,
  },
  lifetimes: {
    attached() {
      this.initNavBar();
    },
  },
  methods: {
    initNavBar() {
      const systemInfo = wx.getSystemInfoSync();
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();

      const statusBarHeight = systemInfo.statusBarHeight || 20;
      // 导航栏内容高度 = 胶囊bottom - 状态栏高度 + 胶囊bottom到导航栏底部的间距
      const navContentHeight = (menuButtonInfo.bottom - statusBarHeight) + (menuButtonInfo.top - statusBarHeight);
      const navBarHeight = statusBarHeight + navContentHeight;

      this.setData({
        statusBarHeight,
        navBarHeight,
        capsuleTop: Math.max(0, (menuButtonInfo.top || statusBarHeight) - statusBarHeight),
        capsuleWidth: menuButtonInfo.width,
        capsuleHeight: menuButtonInfo.height,
      });
    },
    onBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.redirectTo({ url: '/pages/home/home' });
      }
    },
  },
});
