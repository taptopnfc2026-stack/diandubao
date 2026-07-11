const USER_ID_KEY = 'diandu-user-id';
const PENDING_INVITE_KEY = 'diandu-pending-invite';
const ACCEPTED_INVITES_KEY = 'diandu-accepted-invites';

function generateUserId() {
  // 生成唯一用户标识，与 ThinkPHP 用户表 uid 兼容
  // 格式：时间戳_随机串，纯数字便于后端处理
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}${rand}`;
}

App({
  globalData: {
    currentBook: null,
    currentPage: 1,
    vocabularyWords: [],
    userId: '',
    tenantCode: 'default', // SaaS 租户标识，部署时替换为实际值
  },
  onLaunch(options) {
    this.initUserId();
    this.initTenantCode();
    this.handleInvite(options);
  },
  onShow(options) {
    this.handleInvite(options);
  },
  initUserId() {
    let userId = wx.getStorageSync(USER_ID_KEY);
    if (!userId) {
      userId = generateUserId();
      wx.setStorageSync(USER_ID_KEY, userId);
    }
    this.globalData.userId = userId;
  },
  initTenantCode() {
    // 优先从本地缓存读取租户标识
    const cached = wx.getStorageSync('tenant_code');
    if (cached) {
      this.globalData.tenantCode = cached;
    }
    // 部署时在此处替换为实际的租户标识：
    // this.globalData.tenantCode = 't20260710xxxxxx';
  },
  getUserId() {
    return this.globalData.userId || wx.getStorageSync(USER_ID_KEY);
  },
  handleInvite(options = {}) {
    const query = options.query || {};
    const inviterId = query.inviter_id;
    const currentUserId = this.getUserId();
    if (!inviterId || inviterId === currentUserId) {
      return;
    }
    const accepted = wx.getStorageSync(ACCEPTED_INVITES_KEY) || [];
    if (accepted.includes(inviterId)) {
      return;
    }
    wx.setStorageSync(PENDING_INVITE_KEY, { inviterId, timestamp: Date.now() });
  },
});
