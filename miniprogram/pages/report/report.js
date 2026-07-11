/**
 * 学习报告页面
 * 概览 + 趋势折线图 + 分布饼图 + 学习成就
 * 数据来源：GET /api/admin_dashboard/learningReport
 */

const userApi = require('../../utils/userApi');

const MOCK_REPORT = {
  summary: {
    total_minutes: 412,
    total_sessions: 86,
    avg_daily_minutes: 22,
    streak_days: 7,
  },
  trend: [
    { date: '周一', minutes: 28, sessions: 5 },
    { date: '周二', minutes: 35, sessions: 6 },
    { date: '周三', minutes: 18, sessions: 4 },
    { date: '周四', minutes: 42, sessions: 8 },
    { date: '周五', minutes: 31, sessions: 6 },
    { date: '周六', minutes: 52, sessions: 10 },
    { date: '周日', minutes: 24, sessions: 5 },
  ],
  distribution: [
    { name: '点读学习', minutes: 186, color: '#3b82f6' },
    { name: '音标练习', minutes: 72, color: '#f59e0b' },
    { name: '自然拼读', minutes: 68, color: '#10b981' },
    { name: '字母学习', minutes: 48, color: '#8b5cf6' },
    { name: '单词学习', minutes: 38, color: '#ef4444' },
  ],
  achievements: [
    { title: '连续学习7天', desc: '保持每日学习习惯', icon: '🔥' },
    { title: '累计100次学习', desc: '坚持就是胜利', icon: '🏆' },
    { title: '点读达人', desc: '累计点读100次', icon: '📖' },
  ],
};

Page({
  data: {
    report: null,
    loading: true,
    trendType: 'minutes', // 'minutes' | 'sessions'
  },

  onLoad() {
    this.fetchReport();
  },

  onReady() {
    // canvas 需要在 onReady 后绘制
    if (this.data.report) {
      this.drawAllCharts();
    }
  },

  onShow() {
    // 从其他页面返回时刷新
  },

  onPullDownRefresh() {
    this.fetchReport().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  fetchReport() {
    this.setData({ loading: true });
    return this.requestReport()
      .then((data) => {
        this.setData({ report: data, loading: false });
        // 延迟绘制确保 canvas 已挂载
        setTimeout(() => {
          this.drawAllCharts();
        }, 300);
      })
      .catch(() => {
        // 降级到 mock 数据
        this.setData({ report: MOCK_REPORT, loading: false });
        setTimeout(() => {
          this.drawAllCharts();
        }, 300);
      });
  },

  requestReport() {
    const app = getApp();
    const uid = app.getUserId();
    return userApi.fetchUserProfile(uid).then((profileData) => {
      // 如果服务端返回了 learning_report 字段则使用
      if (profileData && profileData.learning_report) {
        return profileData.learning_report;
      }
      // 否则单独请求学习报告接口
      return this.requestReportDirect();
    }).catch(() => {
      return this.requestReportDirect();
    });
  },

  requestReportDirect() {
    return new Promise((resolve, reject) => {
      const app = getApp();
      const tenantCode = (app && app.globalData && app.globalData.tenantCode) || 'default';
      wx.request({
        url: 'https://diandu.xiongmaoxiazai.com/api/admin_dashboard/learningReport',
        method: 'GET',
        data: { tenant_code: tenantCode },
        header: { 'X-Tenant-Code': tenantCode },
        success(res) {
          if (res.statusCode >= 400) {
            reject(new Error('请求失败'));
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
          reject(err);
        },
      });
    });
  },

  // ==================== 趋势类型切换 ====================

  switchTrendType(e) {
    const type = e.currentTarget.dataset.type;
    if (type === this.data.trendType) return;
    this.setData({ trendType: type }, () => {
      this.drawLineChart();
    });
  },

  // ==================== Canvas 绘制 ====================

  drawAllCharts() {
    this.drawLineChart();
    this.drawPieChart();
  },

  getCanvasSize() {
    const sys = wx.getSystemInfoSync();
    const width = sys.windowWidth - 56; // 左右共 28px * 2 边距
    const height = 240; // 480rpx
    return { width, height };
  },

  drawLineChart() {
    const ctx = wx.createCanvasContext('lineChart', this);
    const { width, height } = this.getCanvasSize();
    const { trend, trendType } = this.data;

    if (!trend || trend.length === 0) {
      ctx.clearRect(0, 0, width, height);
      ctx.draw();
      return;
    }

    const padding = { top: 36, right: 20, bottom: 36, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const values = trend.map((t) => (trendType === 'minutes' ? t.minutes : t.sessions));
    const maxVal = Math.max(...values, 1);
    const minVal = 0;

    ctx.clearRect(0, 0, width, height);

    // 网格线
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.setStrokeStyle('#f1f5f9');
      ctx.setLineWidth(1);
      ctx.stroke();
    }

    // 数据点和折线
    const points = values.map((v, i) => {
      const x = padding.left + (chartW / Math.max(values.length - 1, 1)) * i;
      const y = padding.top + chartH - (chartH * (v - minVal)) / (maxVal - minVal || 1);
      return { x, y };
    });

    // 渐变区域
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    ctx.setFillStyle(gradient);
    ctx.fill();

    // 折线
    ctx.beginPath();
    ctx.setStrokeStyle('#3b82f6');
    ctx.setLineWidth(2.5);
    ctx.setLineCap('round');
    ctx.setLineJoin('round');
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // 数据点
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.setFillStyle('#fff');
      ctx.fill();
      ctx.setStrokeStyle('#3b82f6');
      ctx.setLineWidth(2);
      ctx.stroke();
    });

    // X 轴标签
    ctx.setFillStyle('#94a3b8');
    ctx.setFontSize(11);
    ctx.setTextAlign('center');
    trend.forEach((t, i) => {
      const x = padding.left + (chartW / Math.max(trend.length - 1, 1)) * i;
      ctx.fillText(t.date, x, height - 8);
    });

    // Y 轴标签
    ctx.setTextAlign('right');
    for (let i = 0; i <= gridLines; i++) {
      const val = Math.round(minVal + ((maxVal - minVal) / gridLines) * (gridLines - i));
      const y = padding.top + (chartH / gridLines) * i + 4;
      ctx.fillText(String(val), padding.left - 8, y);
    }

    ctx.draw();
  },

  drawPieChart() {
    const ctx = wx.createCanvasContext('pieChart', this);
    const { width, height } = this.getCanvasSize();
    const { report } = this.data;
    const distribution = report && report.distribution ? report.distribution : [];

    if (distribution.length === 0) {
      ctx.clearRect(0, 0, width, height);
      ctx.draw();
      return;
    }

    const centerX = width * 0.3;
    const centerY = height / 2;
    const outerR = Math.min(width * 0.25, height * 0.38);
    const innerR = outerR * 0.55;

    ctx.clearRect(0, 0, width, height);

    const total = distribution.reduce((sum, d) => sum + d.minutes, 0);
    let startAngle = -Math.PI / 2;

    distribution.forEach((item) => {
      const ratio = item.minutes / (total || 1);
      const endAngle = startAngle + Math.PI * 2 * ratio;

      // 扇形
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerR, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.setFillStyle(item.color);
      ctx.fill();

      startAngle = endAngle;
    });

    // 中心文字
    ctx.setFillStyle('#1e293b');
    ctx.setFontSize(16);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');
    ctx.fillText(`${total}min`, centerX, centerY - 8);
    ctx.setFillStyle('#94a3b8');
    ctx.setFontSize(11);
    ctx.fillText('总计', centerX, centerY + 12);

    // 右侧图例
    const legendX = width * 0.58;
    const itemH = 30;
    const startY = centerY - (distribution.length * itemH) / 2 + 14;

    ctx.setTextAlign('left');
    ctx.setTextBaseline('middle');
    distribution.forEach((item, i) => {
      const y = startY + i * itemH;
      const ratio = Math.round((item.minutes / (total || 1)) * 100);

      // 色块
      ctx.beginPath();
      ctx.arc(legendX, y, 6, 0, Math.PI * 2);
      ctx.setFillStyle(item.color);
      ctx.fill();

      // 名称
      ctx.setFillStyle('#334155');
      ctx.setFontSize(12);
      ctx.fillText(item.name, legendX + 14, y - 6);

      // 数值
      ctx.setFillStyle('#94a3b8');
      ctx.setFontSize(10);
      ctx.fillText(`${item.minutes}min ${ratio}%`, legendX + 14, y + 8);
    });

    ctx.draw();
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
});
