const {
  createProfileView,
  defaultOperationSettings,
  getTimeLimitPrompt,
  getUsagePercent,
} = require('../../utils/profile');

const userApi = require('../../utils/userApi');

const PROFILE_STORAGE_KEY = 'diandu-my-profile';
const SETTINGS_STORAGE_KEY = 'diandu-operation-settings';
const USER_ID_KEY = 'diandu-user-id';
const PENDING_INVITE_KEY = 'diandu-pending-invite';
const ACCEPTED_INVITES_KEY = 'diandu-accepted-invites';
const AD_UNIT_ID_KEY = 'diandu-ad-unit-id';

function getProfilePayload() {
  return wx.getStorageSync(PROFILE_STORAGE_KEY) || {
    user: { registered: false },
    usage: { usedMinutesToday: 0 },
    growth: { inviteCount: 0, adWatchCount: 0, memberExchangeCount: 0 },
    reward: { manualRewardMinutes: 0 },
  };
}

function getSettings() {
  return wx.getStorageSync(SETTINGS_STORAGE_KEY) || defaultOperationSettings;
}

function getUserId() {
  return wx.getStorageSync(USER_ID_KEY);
}

const initialProfile = createProfileView({ ...getProfilePayload(), settings: getSettings() });
const initialUsagePercent = getUsagePercent(initialProfile.usage);

Page({
  data: {
    profile: initialProfile,
    usagePercent: initialUsagePercent,
    ringDeg: initialUsagePercent * 3.6,
    menuItems: [],
    timeLimitPrompt: getTimeLimitPrompt(initialProfile),
    showTimeLimitPrompt: getTimeLimitPrompt(initialProfile).visible,
    taskView: '',
    // 支付相关
    payEnabled: false,
    payPlans: [],
    selectedPlanId: 0,
    redeemCode: '',
    redeeming: false,
    adEnabled: false,
    adUnitId: '',
    dataFromServer: false,
    loading: true,
  },
  onLoad() {
    this.fetchRemoteProfile();
    this.processPendingInvite();
    this.fetchPayConfig();
    this.fetchAdConfig();
  },
  onShow() {
    this.processPendingInvite();
    // 每次显示页面时刷新
    this.fetchRemoteProfile();
    this.fetchPayConfig();
    this.fetchAdConfig();
  },

  // ==================== 远程数据加载 ====================

  fetchRemoteProfile() {
    const uid = getUserId();
    if (!uid) {
      this.setData({ loading: false });
      return;
    }

    userApi.fetchUserProfile(uid)
      .then((data) => {
        // 将服务端数据转换为 profile 视图格式
        const profile = createProfileView({
          user: data.user || { registered: true },
          usage: {
            usedMinutesToday: (data.usage && data.usage.used_minutes_today) || 0,
            totalMinutesToday: (data.usage && data.usage.total_minutes_today) || 0,
            remainingMinutes: (data.usage && data.usage.remaining_minutes) || 0,
          },
          growth: {
            inviteCount: (data.growth && data.growth.invite_count) || 0,
            adWatchCount: (data.growth && data.growth.ad_watch_count) || 0,
            memberExchangeCount: (data.growth && data.growth.member_exchange_count) || 0,
          },
          reward: {
            manualRewardMinutes: (data.reward && data.reward.manual_reward_minutes) || 0,
            earnedMinutes: (data.reward && data.reward.earned_minutes) || 0,
            inviteCount: (data.reward && data.reward.invite_count) || 0,
            adWatchCount: (data.reward && data.reward.ad_watch_count) || 0,
            memberExchangeCount: (data.reward && data.reward.member_exchange_count) || 0,
          },
          settings: data.settings || getSettings(),
        });

        // 缓存运营设置
        if (data.settings) {
          wx.setStorageSync(SETTINGS_STORAGE_KEY, data.settings);
        }

        const usagePercent = getUsagePercent(profile.usage);
        const timeLimitPrompt = getTimeLimitPrompt(profile);

        this.setData({
          profile,
          usagePercent,
          ringDeg: usagePercent * 3.6,
          timeLimitPrompt,
          showTimeLimitPrompt: timeLimitPrompt.visible,
          dataFromServer: true,
          loading: false,
          menuItems: this.buildMenuItems(profile),
        });
      })
      .catch(() => {
        // 服务端不可用时使用本地数据
        this.refreshProfile();
        this.setData({ loading: false });
      });
  },

  fetchPayConfig() {
    userApi.fetchPayConfig()
      .then((data) => {
        this.setData({
          payEnabled: data.pay_enabled || false,
          payPlans: data.plans || [],
        });
      })
      .catch(() => {
        // 失败时默认关闭支付
        this.setData({ payEnabled: false, payPlans: [] });
      });
  },

  fetchAdConfig() {
    userApi.fetchAdConfig()
      .then((data) => {
        const adEnabled = data.ad_enabled && data.ad_unit_id;
        this.setData({
          adEnabled: adEnabled,
          adUnitId: data.ad_unit_id || '',
        });
        if (adEnabled) {
          wx.setStorageSync(AD_UNIT_ID_KEY, data.ad_unit_id);
        }
      })
      .catch(() => {
        this.setData({ adEnabled: false, adUnitId: '' });
      });
  },

  // ==================== 本地 fallback ====================

  refreshProfile() {
    const profile = createProfileView({ ...getProfilePayload(), settings: getSettings() });
    const usagePercent = getUsagePercent(profile.usage);
    const timeLimitPrompt = getTimeLimitPrompt(profile);
    this.setData({
      profile,
      usagePercent,
      ringDeg: usagePercent * 3.6,
      timeLimitPrompt,
      showTimeLimitPrompt: timeLimitPrompt.visible,
      menuItems: this.buildMenuItems(profile),
    });
  },

  buildMenuItems(profile) {
    return [
      { key: 'invite', icon: 'gift', title: '我的邀请', aside: `${profile.reward.inviteCount} 人` },
      { key: 'reward', icon: 'coin', title: '我的奖励', aside: `已获得 ${profile.reward.earnedMinutes} 分钟` },
      { key: 'exchange', icon: 'record', title: '兑换记录', aside: `${profile.reward.memberExchangeCount} 次` },
      { key: 'report', icon: 'chart', title: '学习报告', aside: '' },
      { key: 'settings', icon: 'gear', title: '设置', aside: '' },
    ];
  },

  updateProfile(updater) {
    const payload = getProfilePayload();
    const next = updater({
      ...payload,
      user: { ...(payload.user || {}) },
      usage: { ...(payload.usage || {}) },
      growth: { ...(payload.growth || {}) },
      reward: { ...(payload.reward || {}) },
    });
    wx.setStorageSync(PROFILE_STORAGE_KEY, next);
    this.refreshProfile();
  },

  // ==================== 菜单点击 ====================

  onMenuTap(e) {
    const key = e.currentTarget.dataset.key;
    switch (key) {
      case 'invite':
        this.openInviteTask();
        break;
      case 'reward':
        wx.showToast({ title: '我的奖励', icon: 'none' });
        break;
      case 'exchange':
        wx.showToast({ title: '兑换记录', icon: 'none' });
        break;
      case 'report':
        wx.navigateTo({ url: '/pages/report/report' });
        break;
      case 'settings':
        wx.showToast({ title: '设置', icon: 'none' });
        break;
      default:
        break;
    }
  },

  // ==================== 导航 ====================

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.redirectTo({ url: '/pages/home/home' });
  },
  goHome() {
    wx.redirectTo({ url: '/pages/home/home' });
  },

  // ==================== 会员兑换 ====================

  openMember() {
    const uid = getUserId();
    if (!uid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    this.openMemberTask();
  },

  // ==================== 微信支付 ====================

  selectPlan(e) {
    this.setData({ selectedPlanId: Number(e.currentTarget.dataset.planId || 0) });
  },

  doPay() {
    const { selectedPlanId, payPlans } = this.data;
    const uid = getUserId();

    if (!selectedPlanId) {
      wx.showToast({ title: '请选择套餐', icon: 'none' });
      return;
    }

    const plan = payPlans.find((p) => Number(p.id) === Number(selectedPlanId));
    if (!plan) {
      wx.showToast({ title: '套餐不存在', icon: 'none' });
      return;
    }

    // 创建订单
    userApi.createPayOrder(uid, selectedPlanId)
      .then((orderData) => {
        // 调用微信支付
        wx.requestPayment({
          timeStamp: '',
          nonceStr: '',
          package: '',
          signType: 'MD5',
          paySign: '',
          success: () => {
            // 支付成功，回调服务端
            userApi.payCallback(uid, orderData.order_no)
              .then(() => {
                wx.showToast({ title: '支付成功！', icon: 'success' });
                this.setData({ taskView: '' });
                this.fetchRemoteProfile();
              })
              .catch(() => {
                wx.showToast({ title: '支付记录同步失败', icon: 'none' });
              });
          },
          fail: (err) => {
            if (err.errMsg.indexOf('cancel') === -1) {
              wx.showToast({ title: '支付失败', icon: 'none' });
            }
          },
        });
      })
      .catch((err) => {
        wx.showToast({ title: err.message || '创建订单失败', icon: 'none' });
      });
  },

  // ==================== 邀请任务 ====================

  openInviteTask() {
    this.setData({ taskView: 'invite', showTimeLimitPrompt: false });
  },

  openMemberTask() {
    const uid = getUserId();
    if (!uid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (this.data.payEnabled && this.data.payPlans.length > 0) {
      wx.navigateTo({ url: '/pages/member-pay/member-pay' });
      this.setData({ showTimeLimitPrompt: false });
      return;
    }
    this.setData({
      taskView: 'member',
      showTimeLimitPrompt: false,
      redeemCode: '',
      redeeming: false,
    });
  },

  closeTaskView() {
    this.setData({ taskView: '' });
  },

  processPendingInvite() {
    const uid = getUserId();
    if (!uid) return;

    const pending = wx.getStorageSync(PENDING_INVITE_KEY);
    if (!pending || !pending.inviterId) {
      return;
    }
    const accepted = wx.getStorageSync(ACCEPTED_INVITES_KEY) || [];
    if (accepted.includes(pending.inviterId)) {
      wx.removeStorageSync(PENDING_INVITE_KEY);
      return;
    }

    // 调用服务端处理邀请
    userApi.processInvite(pending.inviterId, uid)
      .then((result) => {
        accepted.push(pending.inviterId);
        wx.setStorageSync(ACCEPTED_INVITES_KEY, accepted);
        wx.removeStorageSync(PENDING_INVITE_KEY);
        wx.showToast({
          title: `邀请奖励到账 +${result.reward_minutes || this.data.profile.settings.inviteRewardMinutes}分钟`,
          icon: 'none',
          duration: 2500,
        });
        // 刷新数据
        this.fetchRemoteProfile();
      })
      .catch((err) => {
        // 服务端不可用时走本地
        if (err.message && err.message.indexOf('已处理过邀请') !== -1) {
          wx.removeStorageSync(PENDING_INVITE_KEY);
          return;
        }
        this.claimInviteRewardLocal();
        accepted.push(pending.inviterId);
        wx.setStorageSync(ACCEPTED_INVITES_KEY, accepted);
        wx.removeStorageSync(PENDING_INVITE_KEY);
        wx.showToast({
          title: `邀请奖励到账 +${this.data.profile.settings.inviteRewardMinutes}分钟`,
          icon: 'none',
          duration: 2500,
        });
      });
  },

  claimInviteRewardLocal() {
    this.updateProfile((payload) => ({
      ...payload,
      growth: { ...payload.growth, inviteCount: Number(payload.growth.inviteCount || 0) + 1 },
      usage: {
        ...payload.usage,
        remainingMinutes: this.data.profile.usage.remainingMinutes + this.data.profile.settings.inviteRewardMinutes,
        totalMinutesToday: this.data.profile.usage.totalMinutesToday + this.data.profile.settings.inviteRewardMinutes,
      },
    }));
  },

  onShareAppMessage() {
    const uid = getUserId();
    return {
      title: '点读助手：邀请好友一起学英语',
      path: `/pages/home/home?inviter_id=${uid}`,
      imageUrl: this.data.profile.settings.shareCoverUrl || '/images/avatar-boy.png',
    };
  },

  // ==================== 广告任务 ====================

  openAdTask() {
    this.setData({ taskView: 'ad', showTimeLimitPrompt: false });
  },

  watchAd() {
    const uid = getUserId();
    const { adUnitId, adEnabled } = this.data;

    if (!adEnabled || !adUnitId) {
      // 广告未配置，走模拟
      this.completeAdTaskLocal();
      return;
    }

    // 创建激励视频广告
    const rewardedVideoAd = wx.createRewardedVideoAd({
      adUnitId: adUnitId,
    });

    rewardedVideoAd.onError((err) => {
      console.error('激励视频广告加载失败', err);
      // 广告加载失败走模拟
      this.completeAdTaskLocal();
    });

    rewardedVideoAd.onClose((res) => {
      if (res && res.isEnded) {
        // 完整观看，上报服务端
        userApi.reportAdReward(uid)
          .then(() => {
            wx.showToast({ title: '已领取广告奖励', icon: 'none' });
            this.setData({ taskView: '' });
            this.fetchRemoteProfile();
          })
          .catch(() => {
            // 服务端不可用走本地
            this.completeAdTaskLocal();
          });
      } else {
        wx.showToast({ title: '请完整观看广告', icon: 'none' });
      }
    });

    rewardedVideoAd.show().catch(() => {
      // 广告展示失败，重新加载
      rewardedVideoAd.load()
        .then(() => rewardedVideoAd.show())
        .catch(() => {
          this.completeAdTaskLocal();
        });
    });
  },

  completeAdTaskLocal() {
    this.updateProfile((payload) => ({
      ...payload,
      growth: { ...payload.growth, adWatchCount: Number(payload.growth.adWatchCount || 0) + 1 },
      usage: {
        ...payload.usage,
        remainingMinutes: this.data.profile.usage.remainingMinutes + this.data.profile.settings.adRewardMinutes,
        totalMinutesToday: this.data.profile.usage.totalMinutesToday + this.data.profile.settings.adRewardMinutes,
      },
    }));
    this.setData({ taskView: '' });
    wx.showToast({ title: '已领取广告奖励', icon: 'none' });
  },

  // ==================== 会员兑换码 ====================

  inputRedeemCode(e) {
    this.setData({ redeemCode: String(e.detail.value || '').trim().toUpperCase() });
  },

  redeemMemberCode() {
    const uid = getUserId();
    const code = String(this.data.redeemCode || '').trim();

    if (!uid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (!code) {
      wx.showToast({ title: '请输入兑换码', icon: 'none' });
      return;
    }
    if (this.data.redeeming) {
      return;
    }

    this.setData({ redeeming: true });
    userApi.redeemMemberCode(uid, code)
      .then(() => {
        wx.showToast({ title: '兑换成功', icon: 'success' });
        this.setData({ taskView: '', redeemCode: '', redeeming: false });
        this.fetchRemoteProfile();
      })
      .catch((err) => {
        this.setData({ redeeming: false });
        wx.showToast({ title: err.message || '兑换失败', icon: 'none' });
      });
  },

  completeMemberTask() {
    this.redeemMemberCode();
  },

  // ==================== 其他 ====================

  closeTimeLimitPrompt() {
    this.setData({ showTimeLimitPrompt: false });
  },

  loginPreview() {
    const uid = getUserId();
    if (!uid) {
      // 生成新用户
      const app = getApp();
      app.initUserId();
    }
    this.updateProfile((payload) => ({
      ...payload,
      user: { ...payload.user, registered: true, nickname: '小程序用户' },
    }));
    this.fetchRemoteProfile();
  },

  noop() {},
});
