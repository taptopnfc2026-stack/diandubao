const userApi = require('../../utils/userApi');

const USER_ID_KEY = 'diandu-user-id';

function getUserId() {
  return wx.getStorageSync(USER_ID_KEY);
}

function normalizePlan(plan, index) {
  const amount = Number(plan.price_cents || 0) / 100;
  const monthly = plan.duration_days ? amount / (Number(plan.duration_days) / 30) : amount;
  const tags = ['规划课', '热门', '灵活'];
  return {
    ...plan,
    amountText: amount.toFixed(amount % 1 === 0 ? 0 : 2),
    monthlyText: monthly.toFixed(monthly % 1 === 0 ? 0 : 2),
    tag: tags[index] || '',
  };
}

Page({
  data: {
    loading: true,
    plans: [],
    selectedPlanId: 0,
    selectedPlan: null,
    payButtonText: '立即支付',
    redeemOpen: false,
    redeemCode: '',
    redeeming: false,
    paying: false,
  },

  onLoad() {
    this.fetchPlans();
  },

  fetchPlans() {
    userApi.fetchPayConfig()
      .then((data) => {
        const plans = (data.plans || []).map(normalizePlan);
        const selectedPlan = plans[0] || null;
        this.setData({
          loading: false,
          plans,
          selectedPlan,
          selectedPlanId: selectedPlan ? Number(selectedPlan.id) : 0,
          payButtonText: selectedPlan ? `立即支付 ¥${selectedPlan.amountText}` : '暂无可用套餐',
        });
      })
      .catch((err) => {
        this.setData({ loading: false });
        wx.showToast({ title: err.message || '加载套餐失败', icon: 'none' });
      });
  },

  goBack() {
    wx.navigateBack();
  },

  selectPlan(e) {
    const planId = Number(e.currentTarget.dataset.planId || 0);
    const selectedPlan = this.data.plans.find((item) => Number(item.id) === planId) || null;
    this.setData({
      selectedPlanId: planId,
      selectedPlan,
      payButtonText: selectedPlan ? `立即支付 ¥${selectedPlan.amountText}` : '暂无可用套餐',
    });
  },

  pay() {
    const uid = getUserId();
    const { selectedPlanId } = this.data;

    if (!uid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (!selectedPlanId) {
      wx.showToast({ title: '请选择套餐', icon: 'none' });
      return;
    }
    if (this.data.paying) return;

    this.setData({ paying: true });
    userApi.createPayOrder(uid, selectedPlanId)
      .then((orderData) => {
        const payment = orderData.payment || {};
        if (!payment.timeStamp || !payment.nonceStr || !payment.package || !payment.paySign) {
          this.setData({ paying: false });
          wx.showToast({ title: '微信支付参数未配置', icon: 'none' });
          return;
        }
        wx.requestPayment({
          timeStamp: payment.timeStamp,
          nonceStr: payment.nonceStr,
          package: payment.package,
          signType: payment.signType || 'MD5',
          paySign: payment.paySign,
          success: () => {
            userApi.payCallback(uid, orderData.order_no)
              .then(() => {
                this.setData({ paying: false });
                wx.showToast({ title: '开通成功', icon: 'success' });
                setTimeout(() => wx.navigateBack(), 700);
              })
              .catch((err) => {
                this.setData({ paying: false });
                wx.showToast({ title: err.message || '订单同步失败', icon: 'none' });
              });
          },
          fail: (err) => {
            this.setData({ paying: false });
            if (!err.errMsg || err.errMsg.indexOf('cancel') === -1) {
              wx.showToast({ title: '支付失败', icon: 'none' });
            }
          },
        });
      })
      .catch((err) => {
        this.setData({ paying: false });
        wx.showToast({ title: err.message || '创建订单失败', icon: 'none' });
      });
  },

  toggleRedeem() {
    this.setData({ redeemOpen: !this.data.redeemOpen, redeemCode: '' });
  },

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
    if (this.data.redeeming) return;

    this.setData({ redeeming: true });
    userApi.redeemMemberCode(uid, code)
      .then(() => {
        this.setData({ redeeming: false, redeemCode: '' });
        wx.showToast({ title: '兑换成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 700);
      })
      .catch((err) => {
        this.setData({ redeeming: false });
        wx.showToast({ title: err.message || '兑换失败', icon: 'none' });
      });
  },
});
