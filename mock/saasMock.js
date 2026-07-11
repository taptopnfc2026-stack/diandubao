/**
 * SaaS 平台本地 Mock API
 * 仅用于前端开发调试，生产环境请部署真实 ThinkPHP 后端
 */

const mockTenants = [
  {
    id: 1,
    tenant_name: '示例英语培训',
    tenant_code: 'demo001',
    contact_name: '张老师',
    contact_mobile: '13800138000',
    contact_email: 'demo@example.com',
    miniapp_appid: 'wxdemoappid0001',
    miniapp_secret: 'd0d0d0d0d0d0d0d0d0d0d0d0d0d0d0d0',
    status: 1,
    expire_time: 0,
    max_users: 0,
    user_count: 128,
    admin_count: 2,
    order_count: 36,
    revenue_cents: 359640,
    remark: '演示租户',
    create_time: Math.floor(Date.now() / 1000) - 86400 * 30,
  },
];

const mockLogs = [
  {
    id: 1,
    tenant_code: 'demo001',
    admin_type: 'tenant_admin',
    action: '登录',
    target: '租户后台',
    ip: '127.0.0.1',
    create_time: Math.floor(Date.now() / 1000) - 3600,
  },
  {
    id: 2,
    tenant_code: 'demo001',
    admin_type: 'tenant_admin',
    action: '保存',
    target: '小程序配置',
    ip: '127.0.0.1',
    create_time: Math.floor(Date.now() / 1000) - 7200,
  },
];

const adConfigs = {
  demo001: { ad_unit_id: 'adunit-demo-12345678', ad_name: '激励视频广告', status: 1 },
};

const payConfigs = {
  demo001: {
    mch_id: '',
    mch_key: '',
    app_id: 'wxdemoappid0001',
    app_secret: '',
    notify_url: '',
    pay_enabled: 0,
  },
};

const tenantSettings = {
  demo001: {
    new_user_free_minutes: 70,
    invite_reward_minutes: 20,
    ad_reward_minutes: 10,
  },
};

const tenantPlans = {
  demo001: [
    { id: 1, name: '月卡', price_cents: 1900, duration_days: 30, status: 1 },
    { id: 2, name: '季卡', price_cents: 4900, duration_days: 90, status: 1 },
    { id: 3, name: '年卡', price_cents: 12800, duration_days: 365, status: 1 },
  ],
};

const tenantRedeemCodes = {
  demo001: [],
};

const tenantDashboards = {
  demo001: {
    counters: {
      total_users: 1286,
      today_users: 37,
      active_users: 418,
      paid_users: 96,
      revenue_cents: 268800,
      member_exchange_count: 42,
      invite_count: 318,
      ad_watch_count: 1264,
      granted_minutes: 19000,
      remaining_minutes: 8620,
    },
    users: [
      { id: 1001, nickname: '小明', mobile: '138****1234', book_name: '三年级上册', cur_page: 20, create_time: 1783423600, last_login_time: 1783510000, member_expire_time: 1786192000, invite_count: 8, ad_watch_count: 15, reward_minutes: 310, remaining_minutes: 128, member_exchange_count: 1 },
      { id: 1002, nickname: 'Lily', mobile: '', book_name: '五年级上册', cur_page: 9, create_time: 1783337200, last_login_time: 1783500000, member_expire_time: 0, invite_count: 2, ad_watch_count: 6, reward_minutes: 100, remaining_minutes: 52, member_exchange_count: 0 },
      { id: 1003, nickname: 'Tom', mobile: '186****8821', book_name: '六年级上册', cur_page: 72, create_time: 1782991600, last_login_time: 1783460000, member_expire_time: 1783400000, invite_count: 1, ad_watch_count: 3, reward_minutes: 50, remaining_minutes: 0, member_exchange_count: 1 },
    ],
    orders: [
      { id: 9001, order_no: 'DD202607080001', nickname: '小明', plan_name: '年卡', amount_cents: 12800, pay_status: 'paid', paid_time: 1783509600 },
      { id: 9002, order_no: 'DD202607080002', nickname: 'Lily', plan_name: '月卡', amount_cents: 1900, pay_status: 'pending', paid_time: 0 },
    ],
    exchanges: [
      { id: 7001, nickname: '小明', plan_name: '年卡', exchange_time: 1783509600 },
      { id: 7002, nickname: 'Tom', plan_name: '月卡', exchange_time: 1783400000 },
    ],
    rewards: [
      { id: 6001, nickname: 'Lily', type: 'invite', minutes: 20, create_time: 1783510000 },
      { id: 6002, nickname: 'Lily', type: 'ad', minutes: 10, create_time: 1783510600 },
      { id: 6003, nickname: '小明', type: 'register', minutes: 70, create_time: 1783423600 },
    ],
  },
};

function getDashboard(code) {
  if (!tenantDashboards[code]) {
    tenantDashboards[code] = {
      counters: { total_users: 0, today_users: 0, active_users: 0, paid_users: 0, revenue_cents: 0, member_exchange_count: 0, invite_count: 0, ad_watch_count: 0, granted_minutes: 0, remaining_minutes: 0 },
      users: [],
      orders: [],
      exchanges: [],
      rewards: [],
    };
  }
  return tenantDashboards[code];
}

function makeRedeemCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getPublicTenant(code) {
  return mockTenants.find((t) => t.tenant_code === code);
}

function json(res, data, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function ok(res, data = null, msg = '') {
  json(res, { code: 1, data, msg });
}

function fail(res, msg = '请求失败', code = 0, statusCode = 200) {
  json(res, { code, data: null, msg }, statusCode);
}

function unauthorized(res) {
  fail(res, '登录已过期，请重新登录', 0, 401);
}

function getToken(req) {
  const auth = req.headers.authorization || '';
  return auth.replace(/^Bearer\s+/i, '');
}

function verifySuperToken(token) {
  return token && (token.startsWith('saas_') || token === 'mock-saas-token');
}

function verifyTenantToken(token) {
  return token && token.startsWith('tenant_');
}

function getTenantFromToken(token) {
  // mock token format: tenant_<tenant_code>_<random>
  const parts = token.split('_');
  return parts[1] || '';
}

function overview() {
  const total = mockTenants.length;
  const active = mockTenants.filter((t) => t.status === 1).length;
  const disabled = total - active;
  const totalUsers = mockTenants.reduce((sum, t) => sum + (t.user_count || 0), 0);
  const totalRevenue = mockTenants.reduce((sum, t) => sum + (t.revenue_cents || 0), 0);
  return {
    total_tenants: total,
    active_tenants: active,
    disabled_tenants: disabled,
    total_users: totalUsers,
    today_new_tenants: 0,
    today_new_users: 3,
    total_revenue_cents: totalRevenue,
    recent_tenants: [...mockTenants]
      .sort((a, b) => b.create_time - a.create_time)
      .slice(0, 5),
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

export function saasMockMiddleware() {
  return async (req, res, next) => {
    const url = req.url || '';
    if (
      !url.startsWith('/api/saas_admin') &&
      !url.startsWith('/api/tenant_admin') &&
      !url.startsWith('/api/tenant')
    ) {
      return next();
    }

    try {
      const body = req.method !== 'GET' && req.method !== 'HEAD' ? await readBody(req) : {};
      const path = url.split('?')[0];
      const q = new URLSearchParams(url.split('?')[1] || '');

      // ==================== SaaS 超级管理员接口 ====================
      if (path === '/api/saas_admin/login') {
        const { username, password } = body;
        if (username === 'admin' && password === 'admin123') {
          return ok(res, {
            token: 'saas_mock_token_' + Date.now(),
            admin: { id: 1, username: 'admin', nickname: '超级管理员' },
          });
        }
        return fail(res, '账号或密码不正确');
      }

      if (path === '/api/saas_admin/platformOverview') {
        if (!verifySuperToken(getToken(req))) return unauthorized(res);
        return ok(res, overview());
      }

      if (path === '/api/saas_admin/tenantList') {
        if (!verifySuperToken(getToken(req))) return unauthorized(res);
        const q = new URLSearchParams(url.split('?')[1] || '');
        const page = Math.max(1, parseInt(q.get('page') || '1', 10));
        const keyword = (q.get('keyword') || '').toLowerCase();
        const status = q.get('status');
        let list = mockTenants.filter((t) => {
          if (keyword && !t.tenant_name.toLowerCase().includes(keyword) && !t.tenant_code.includes(keyword)) return false;
          if (status !== '' && status !== null && String(t.status) !== status) return false;
          return true;
        });
        const pageSize = 20;
        const total = list.length;
        list = list.slice((page - 1) * pageSize, page * pageSize);
        return ok(res, { list, total, page, page_size: pageSize });
      }

      if (path === '/api/saas_admin/tenantDetail') {
        if (!verifySuperToken(getToken(req))) return unauthorized(res);
        const q = new URLSearchParams(url.split('?')[1] || '');
        const id = parseInt(q.get('id') || '0', 10);
        const t = mockTenants.find((item) => item.id === id);
        if (!t) return fail(res, '租户不存在');
        return ok(res, t);
      }

      if (path === '/api/saas_admin/createTenant') {
        if (!verifySuperToken(getToken(req))) return unauthorized(res);
        const code = body.tenant_code || `t${Date.now().toString(36)}`;
        if (mockTenants.some((t) => t.tenant_code === code)) {
          return fail(res, '租户标识已存在');
        }
        const newTenant = {
          id: mockTenants.length + 1,
          tenant_name: body.tenant_name || '未命名租户',
          tenant_code: code,
          contact_name: body.contact_name || '',
          contact_mobile: body.contact_mobile || '',
          contact_email: body.contact_email || '',
          miniapp_appid: '',
          miniapp_secret: '',
          status: 1,
          expire_time: body.expire_time ? Math.floor(new Date(body.expire_time).getTime() / 1000) : 0,
          max_users: parseInt(body.max_users || '0', 10),
          user_count: 0,
          admin_count: 1,
          order_count: 0,
          revenue_cents: 0,
          remark: body.remark || '',
          create_time: Math.floor(Date.now() / 1000),
        };
        mockTenants.push(newTenant);
        adConfigs[code] = { ad_unit_id: '', ad_name: '激励视频广告', status: 1 };
        payConfigs[code] = { mch_id: '', mch_key: '', app_id: '', app_secret: '', notify_url: '', pay_enabled: 0 };
        tenantSettings[code] = { new_user_free_minutes: 70, invite_reward_minutes: 20, ad_reward_minutes: 10 };
        tenantPlans[code] = [
          { id: 1, name: '月卡', price_cents: 1900, duration_days: 30, status: 1 },
          { id: 2, name: '季卡', price_cents: 4900, duration_days: 90, status: 1 },
          { id: 3, name: '年卡', price_cents: 12800, duration_days: 365, status: 1 },
        ];
        tenantRedeemCodes[code] = [];
        tenantDashboards[code] = {
          counters: { total_users: 0, today_users: 0, active_users: 0, paid_users: 0, revenue_cents: 0, member_exchange_count: 0, invite_count: 0, ad_watch_count: 0, granted_minutes: 0, remaining_minutes: 0 },
          users: [],
          orders: [],
          exchanges: [],
          rewards: [],
        };
        mockLogs.unshift({
          id: mockLogs.length + 1,
          tenant_code: code,
          admin_type: 'super_admin',
          action: '创建租户',
          target: body.tenant_name,
          ip: '127.0.0.1',
          create_time: Math.floor(Date.now() / 1000),
        });
        return ok(res, { tenant_code: code, admin_username: body.admin_username || 'admin' });
      }

      if (path === '/api/saas_admin/disableTenant') {
        if (!verifySuperToken(getToken(req))) return unauthorized(res);
        const t = mockTenants.find((item) => item.id === parseInt(body.id || '0', 10));
        if (!t) return fail(res, '租户不存在');
        t.status = 0;
        return ok(res, null, '已禁用');
      }

      if (path === '/api/saas_admin/enableTenant') {
        if (!verifySuperToken(getToken(req))) return unauthorized(res);
        const t = mockTenants.find((item) => item.id === parseInt(body.id || '0', 10));
        if (!t) return fail(res, '租户不存在');
        t.status = 1;
        return ok(res, null, '已启用');
      }

      if (path === '/api/saas_admin/resetTenantAdminPassword') {
        if (!verifySuperToken(getToken(req))) return unauthorized(res);
        return ok(res, null, '密码已重置');
      }

      if (path === '/api/saas_admin/operationLogs') {
        if (!verifySuperToken(getToken(req))) return unauthorized(res);
        const q = new URLSearchParams(url.split('?')[1] || '');
        const page = Math.max(1, parseInt(q.get('page') || '1', 10));
        const tenantCode = q.get('tenant_code') || '';
        let list = tenantCode ? mockLogs.filter((l) => l.tenant_code === tenantCode) : [...mockLogs];
        const pageSize = 30;
        const total = list.length;
        list = list.slice((page - 1) * pageSize, page * pageSize);
        return ok(res, { list, total, page, page_size: pageSize });
      }

      // ==================== 租户端接口 ====================
      if (path === '/api/tenant_admin/login') {
        const { tenant_code, username, password } = body;
        const t = mockTenants.find((item) => item.tenant_code === tenant_code);
        if (!t) return fail(res, '租户不存在');
        if (username === 'test' && password === 'test123') {
          return ok(res, {
            token: `tenant_${tenant_code}_${Date.now()}`,
            admin: { id: 1, username: 'test', nickname: '管理员' },
            tenant: t,
          });
        }
        return fail(res, '账号或密码不正确');
      }

      if (path === '/api/tenant_admin/profile') {
        const token = getToken(req);
        if (!verifyTenantToken(token)) return unauthorized(res);
        const code = getTenantFromToken(token);
        const t = mockTenants.find((item) => item.tenant_code === code);
        if (!t) return fail(res, '租户不存在');
        return ok(res, { admin: { id: 1, username: 'test', nickname: '管理员' }, tenant: t });
      }

      if (path === '/api/tenant_admin/dashboard') {
        const token = getToken(req);
        if (!verifyTenantToken(token)) return unauthorized(res);
        const code = getTenantFromToken(token);
        const dashboard = getDashboard(code);
        return ok(res, {
          counters: dashboard.counters,
          settings: tenantSettings[code] || { new_user_free_minutes: 70, invite_reward_minutes: 20, ad_reward_minutes: 10 },
          plans: tenantPlans[code] || [],
          users: dashboard.users,
          orders: dashboard.orders,
          exchanges: dashboard.exchanges,
          rewards: dashboard.rewards,
          redeem_codes: tenantRedeemCodes[code] || [],
        });
      }

      if (path === '/api/tenant_admin/getAdConfig') {
        const token = getToken(req);
        if (!verifyTenantToken(token)) return unauthorized(res);
        const code = getTenantFromToken(token);
        return ok(res, adConfigs[code] || { ad_unit_id: '', ad_name: '激励视频广告', status: 1 });
      }

      if (path === '/api/tenant_admin/getPayConfig') {
        const token = getToken(req);
        if (!verifyTenantToken(token)) return unauthorized(res);
        const code = getTenantFromToken(token);
        return ok(res, payConfigs[code] || { mch_id: '', mch_key: '', app_id: '', app_secret: '', notify_url: '', pay_enabled: 0 });
      }

      if (path === '/api/tenant_admin/saveMiniappConfig') {
        const token = getToken(req);
        if (!verifyTenantToken(token)) return unauthorized(res);
        const code = getTenantFromToken(token);
        const t = mockTenants.find((item) => item.tenant_code === code);
        if (t) {
          t.miniapp_appid = body.miniapp_appid || '';
          t.miniapp_secret = body.miniapp_secret || '';
          if (payConfigs[code]) payConfigs[code].app_id = t.miniapp_appid;
        }
        return ok(res, null, '保存成功');
      }

      if (path === '/api/tenant_admin/saveSettings' || path === '/api/tenant_admin/saveOperationSettings') {
        const token = getToken(req);
        if (!verifyTenantToken(token)) return unauthorized(res);
        const code = getTenantFromToken(token);
        tenantSettings[code] = {
          new_user_free_minutes: parseInt(body.new_user_free_minutes || body.newUserFreeMinutes || '0', 10),
          invite_reward_minutes: parseInt(body.invite_reward_minutes || body.inviteRewardMinutes || '0', 10),
          ad_reward_minutes: parseInt(body.ad_reward_minutes || body.adRewardMinutes || '0', 10),
        };
        const dashboard = getDashboard(code);
        return ok(res, { ...dashboard, settings: tenantSettings[code] });
      }

      if (path === '/api/tenant_admin/saveUserProfile') {
        const token = getToken(req);
        if (!verifyTenantToken(token)) return unauthorized(res);
        const code = getTenantFromToken(token);
        const dashboard = getDashboard(code);
        const userId = String(body.id);
        const idx = dashboard.users.findIndex((u) => String(u.id) === userId);
        const patch = {
          nickname: body.nickname,
          mobile: body.mobile,
          book_name: body.currentBook,
          cur_page: Number(body.currentPage || 0),
          member_state: body.memberState,
          invite_count: Number(body.inviteCount || 0),
          ad_watch_count: Number(body.adWatchCount || 0),
          reward_minutes: Number(body.rewardMinutes || 0),
          remaining_minutes: Number(body.remainingMinutes || 0),
          member_exchange_count: Number(body.memberExchangeCount || 0),
          last_login_time: Number(body.lastLoginTime || 0),
        };
        if (idx >= 0) {
          dashboard.users[idx] = { ...dashboard.users[idx], ...patch };
        }
        return ok(res, dashboard);
      }

      if (path === '/api/tenant_admin/saveAdConfig') {
        const token = getToken(req);
        if (!verifyTenantToken(token)) return unauthorized(res);
        const code = getTenantFromToken(token);
        adConfigs[code] = {
          ad_unit_id: body.ad_unit_id || '',
          ad_name: body.ad_name || '激励视频广告',
          status: parseInt(body.status ?? '1', 10),
        };
        return ok(res, null, '保存成功');
      }

      if (path === '/api/tenant_admin/savePayConfig') {
        const token = getToken(req);
        if (!verifyTenantToken(token)) return unauthorized(res);
        const code = getTenantFromToken(token);
        payConfigs[code] = {
          mch_id: body.mch_id || '',
          mch_key: body.mch_key || '',
          app_id: body.app_id || '',
          app_secret: body.app_secret || '',
          notify_url: body.notify_url || '',
          pay_enabled: parseInt(body.pay_enabled ?? '0', 10),
        };
        return ok(res, null, '保存成功');
      }

      if (path === '/api/tenant_admin/savePlans') {
        const token = getToken(req);
        if (!verifyTenantToken(token)) return unauthorized(res);
        const code = getTenantFromToken(token);
        const list = Array.isArray(body.plans) ? body.plans : [];
        tenantPlans[code] = list.map((p, idx) => ({
          id: p.id || idx + 1,
          name: String(p.name || '').trim() || '未命名套餐',
          price_cents: Math.max(0, parseInt(p.price_cents || p.priceCents || '0', 10)),
          duration_days: Math.max(1, parseInt(p.duration_days || p.durationDays || '30', 10)),
          status: p.status ? 1 : 0,
        }));
        return ok(res, { plans: tenantPlans[code] });
      }

      if (path === '/api/tenant_admin/listRedeemCodes') {
        const token = getToken(req);
        if (!verifyTenantToken(token)) return unauthorized(res);
        const code = getTenantFromToken(token);
        return ok(res, { list: tenantRedeemCodes[code] || [] });
      }

      if (path === '/api/tenant_admin/generateRedeemCode') {
        const token = getToken(req);
        if (!verifyTenantToken(token)) return unauthorized(res);
        const code = getTenantFromToken(token);
        const planId = parseInt(body.plan_id || body.planId || '0', 10);
        const count = Math.max(1, Math.min(100, parseInt(body.count || '1', 10)));
        const plan = (tenantPlans[code] || []).find((p) => p.id === planId);
        if (!plan) return fail(res, '套餐不存在');
        if (!tenantRedeemCodes[code]) tenantRedeemCodes[code] = [];
        const created = [];
        for (let i = 0; i < count; i++) {
          let rc;
          do {
            rc = makeRedeemCode();
          } while (tenantRedeemCodes[code].some((c) => c.code === rc));
          const item = {
            code: rc,
            plan_id: plan.id,
            plan_name: plan.name,
            duration_days: plan.duration_days,
            used: 0,
            used_by: '',
            used_time: 0,
            create_time: Math.floor(Date.now() / 1000),
          };
          tenantRedeemCodes[code].push(item);
          created.push(item);
        }
        return ok(res, { list: created });
      }

      // ==================== 小程序公开接口 ====================
      if (path === '/api/tenant/plans') {
        const code = body.tenant_code || q.get('tenant_code') || '';
        if (!getPublicTenant(code)) return fail(res, '租户不存在');
        return ok(res, { list: tenantPlans[code] || [] });
      }

      if (path === '/api/tenant/redeem') {
        const code = body.tenant_code || q.get('tenant_code') || '';
        const t = getPublicTenant(code);
        if (!t) return fail(res, '租户不存在');
        const redeemCode = String(body.code || '').toUpperCase().trim();
        if (!redeemCode) return fail(res, '请输入兑换码');
        if (!tenantRedeemCodes[code]) tenantRedeemCodes[code] = [];
        const item = tenantRedeemCodes[code].find((c) => c.code === redeemCode);
        if (!item) return fail(res, '兑换码不存在');
        if (item.used) return fail(res, '兑换码已被使用');
        item.used = 1;
        item.used_by = String(body.openid || body.user_id || 'unknown');
        item.used_time = Math.floor(Date.now() / 1000);
        const dashboard = getDashboard(code);
        dashboard.counters.member_exchange_count += 1;
        dashboard.exchanges.unshift({
          id: Date.now(),
          nickname: body.nickname || '小程序用户',
          plan_name: item.plan_name,
          exchange_time: item.used_time,
        });
        return ok(res, { plan_name: item.plan_name, duration_days: item.duration_days }, '兑换成功');
      }

      if (path === '/api/tenant/createOrder') {
        const code = body.tenant_code || q.get('tenant_code') || '';
        const t = getPublicTenant(code);
        if (!t) return fail(res, '租户不存在');
        const planId = parseInt(body.plan_id || body.planId || '0', 10);
        const plan = (tenantPlans[code] || []).find((p) => p.id === planId && p.status === 1);
        if (!plan) return fail(res, '套餐不存在或已下架');
        const orderNo = `DD${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const dashboard = getDashboard(code);
        dashboard.orders.unshift({
          id: Date.now(),
          order_no: orderNo,
          nickname: body.nickname || '小程序用户',
          plan_name: plan.name,
          amount_cents: plan.price_cents,
          pay_status: 'paid',
          paid_time: Math.floor(Date.now() / 1000),
        });
        dashboard.counters.revenue_cents += plan.price_cents;
        dashboard.counters.paid_users += 1;
        return ok(res, { order_no: orderNo, plan_name: plan.name, amount_cents: plan.price_cents });
      }

      return fail(res, '未知接口');
    } catch (e) {
      console.error('[saasMock]', e);
      return fail(res, '服务器内部错误：' + e.message, 0, 500);
    }
  };
}
