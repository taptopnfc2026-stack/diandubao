/**
 * 用户端 API（资料、邀请、广告、支付）
 * 对接后端 AdminDashboard 控制器
 * 
 * SaaS 多租户：自动从 app.globalData.tenantCode 读取租户标识
 */
const BASE_URL = 'https://diandu.xiongmaoxiazai.com';

/**
 * 获取当前租户标识
 * 优先级：app.globalData.tenantCode > 本地缓存 > 'default'
 */
function getTenantCode() {
  try {
    const app = getApp();
    if (app && app.globalData && app.globalData.tenantCode) {
      return app.globalData.tenantCode;
    }
  } catch (e) { /* ignore */ }
  try {
    const cached = wx.getStorageSync('tenant_code');
    if (cached) return cached;
  } catch (e) { /* ignore */ }
  return 'default';
}

function request(method, path, data = {}) {
  return new Promise((resolve, reject) => {
    // 自动附加 tenant_code
    const tenantCode = getTenantCode();
    const requestData = { ...data, tenant_code: tenantCode };

    wx.request({
      url: `${BASE_URL}${path}`,
      method: method,
      data: requestData,
      header: {
        'X-Tenant-Code': tenantCode,
      },
      success(res) {
        if (res.statusCode >= 400) {
          reject(new Error((res.data && res.data.msg) || '请求失败'));
          return;
        }
        const payload = res.data || {};
        if (payload.code === 0 || payload.code === 500) {
          reject(new Error(payload.msg || '请求失败'));
          return;
        }
        resolve(payload.data || payload);
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'));
      },
    });
  });
}

module.exports = {
  /**
   * 设置租户标识（小程序启动时调用）
   */
  setTenantCode(code) {
    try {
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.tenantCode = code;
      }
      wx.setStorageSync('tenant_code', code);
    } catch (e) { /* ignore */ }
  },

  /**
   * 获取当前租户标识
   */
  getTenantCode,

  /**
   * 获取用户完整资料（时长、邀请、广告、会员状态、运营设置）
   */
  fetchUserProfile(uid) {
    return request('GET', '/api/admin_dashboard/userProfile', { uid });
  },

  /**
   * 上报使用时长
   */
  reportUsage(uid, usedMinutes) {
    return request('POST', '/api/admin_dashboard/reportUsage', { uid, used_minutes: usedMinutes });
  },

  /**
   * 处理邀请关系
   */
  processInvite(inviterId, inviteeUid) {
    return request('POST', '/api/admin_dashboard/processInvite', {
      inviter_id: inviterId,
      invitee_uid: inviteeUid,
    });
  },

  /**
   * 获取广告配置
   */
  fetchAdConfig() {
    return request('GET', '/api/admin_dashboard/getAdConfig');
  },

  /**
   * 广告观看完成上报
   */
  reportAdReward(uid) {
    return request('POST', '/api/admin_dashboard/adRewardCallback', { uid });
  },

  /**
   * 获取支付配置（是否开启、套餐列表）
   */
  fetchPayConfig() {
    return request('GET', '/api/admin_dashboard/getPayConfig');
  },

  /**
   * 创建支付订单
   */
  createPayOrder(uid, planId) {
    return request('POST', '/api/admin_dashboard/createPayOrder', { uid, plan_id: planId });
  },

  /**
   * 兑换码开通会员
   */
  redeemMemberCode(uid, code) {
    return request('POST', '/api/admin_dashboard/redeemMemberCode', { uid, code });
  },

  /**
   * 支付成功回调
   */
  payCallback(uid, orderNo) {
    return request('POST', '/api/admin_dashboard/payCallback', { uid, order_no: orderNo });
  },
};
