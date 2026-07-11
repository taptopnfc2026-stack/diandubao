const demoPayload = {
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
  settings: {
    new_user_free_minutes: 70,
    invite_reward_minutes: 20,
    ad_reward_minutes: 10,
  },
  users: [
    { id: 1001, nickname: '小明', mobile: '138****1234', book_name: '三年级上册', cur_page: 20, create_time: 1783423600, last_login_time: 1783510000, member_expire_time: 1786192000, invite_count: 8, ad_watch_count: 15, reward_minutes: 310, remaining_minutes: 128, member_exchange_count: 1 },
    { id: 1002, nickname: 'Lily', mobile: '', book_name: '五年级上册', cur_page: 9, create_time: 1783337200, last_login_time: 1783500000, member_expire_time: 0, invite_count: 2, ad_watch_count: 6, reward_minutes: 100, remaining_minutes: 52, member_exchange_count: 0 },
    { id: 1003, nickname: 'Tom', mobile: '186****8821', book_name: '六年级上册', cur_page: 72, create_time: 1782991600, last_login_time: 1783460000, member_expire_time: 1783400000, invite_count: 1, ad_watch_count: 3, reward_minutes: 50, remaining_minutes: 0, member_exchange_count: 1 },
  ],
  plans: [
    { id: 1, name: '月卡', price_cents: 1900, duration_days: 30, status: 1 },
    { id: 2, name: '季卡', price_cents: 4900, duration_days: 90, status: 1 },
    { id: 3, name: '年卡', price_cents: 12800, duration_days: 365, status: 1 },
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
};

const SETTINGS_KEY = 'diandu-operation-settings';
const PROFILE_KEY = 'diandu-my-profile';
const USER_OVERRIDES_KEY = 'diandu-admin-user-overrides';
const AD_CONFIG_KEY = 'diandu-ad-config';
const PAY_CONFIG_KEY = 'diandu-pay-config';

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readLocalSettings() {
  return readJson(SETTINGS_KEY, demoPayload.settings);
}

function readLocalProfile() {
  return readJson(PROFILE_KEY, null);
}

function readUserOverrides() {
  return readJson(USER_OVERRIDES_KEY, {});
}

function applyUserOverrides(users) {
  const overrides = readUserOverrides();
  return users.map((user) => ({
    ...user,
    ...(overrides[String(user.id)] || {}),
  }));
}

function mergeLocalPreviewData(payload) {
  const settings = readLocalSettings();
  const profile = readLocalProfile();
  if (!profile) return { ...payload, settings, users: applyUserOverrides(payload.users) };

  const growth = profile.growth || {};
  const usage = profile.usage || {};
  const reward = profile.reward || {};
  const inviteCount = Number(growth.inviteCount || 0);
  const adWatchCount = Number(growth.adWatchCount || 0);
  const memberExchangeCount = Number(growth.memberExchangeCount || 0);
  const rewardMinutes = Number(reward.manualRewardMinutes || 0) + inviteCount * Number(settings.invite_reward_minutes || settings.inviteRewardMinutes || 0) + adWatchCount * Number(settings.ad_reward_minutes || settings.adRewardMinutes || 0);
  const remainingMinutes = Math.max(0, Number(settings.new_user_free_minutes || settings.newUserFreeMinutes || 0) + rewardMinutes - Number(usage.usedMinutesToday || 0));
  const previewUser = {
    id: 'local-preview',
    nickname: profile.user?.nickname || '本地预览用户',
    mobile: '',
    book_name: '当前选择教材',
    cur_page: 9,
    create_time: 1783510000,
    last_login_time: Math.floor(Date.now() / 1000),
    member_expire_time: memberExchangeCount ? 1786192000 : 0,
    invite_count: inviteCount,
    ad_watch_count: adWatchCount,
    reward_minutes: rewardMinutes,
    remaining_minutes: remainingMinutes,
    member_exchange_count: memberExchangeCount,
  };

  const merged = {
    ...payload,
    settings,
    counters: {
      ...payload.counters,
      total_users: Number(payload.counters.total_users || 0) + 1,
      member_exchange_count: Number(payload.counters.member_exchange_count || 0) + memberExchangeCount,
      invite_count: Number(payload.counters.invite_count || 0) + inviteCount,
      ad_watch_count: Number(payload.counters.ad_watch_count || 0) + adWatchCount,
      granted_minutes: Number(payload.counters.granted_minutes || 0) + rewardMinutes,
      remaining_minutes: Number(payload.counters.remaining_minutes || 0) + remainingMinutes,
    },
    users: [previewUser, ...payload.users],
    exchanges: memberExchangeCount ? [
      { id: 'local-member', nickname: previewUser.nickname, plan_name: '体验会员', exchange_time: Math.floor(Date.now() / 1000) },
      ...payload.exchanges,
    ] : payload.exchanges,
    rewards: [
      ...(inviteCount ? [{ id: 'local-invite', nickname: previewUser.nickname, type: 'invite', minutes: inviteCount * Number(settings.invite_reward_minutes || settings.inviteRewardMinutes || 0), create_time: Math.floor(Date.now() / 1000) }] : []),
      ...(adWatchCount ? [{ id: 'local-ad', nickname: previewUser.nickname, type: 'ad', minutes: adWatchCount * Number(settings.ad_reward_minutes || settings.adRewardMinutes || 0), create_time: Math.floor(Date.now() / 1000) }] : []),
      ...payload.rewards,
    ],
  };
  return {
    ...merged,
    users: applyUserOverrides(merged.users),
  };
}

export async function fetchDashboard() {
  try {
    const response = await fetch('/api/admin_dashboard/dashboard', { credentials: 'include' });
    const payload = await response.json();
    if (!response.ok || payload.code === 0 || payload.code === 500) {
      throw new Error(payload.msg || '后台接口未就绪');
    }
    return payload.data || payload;
  } catch {
    return mergeLocalPreviewData(demoPayload);
  }
}

export async function saveOperationSettings(settings) {
  try {
    const response = await fetch('/api/admin_dashboard/saveOperationSettings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
      credentials: 'include',
    });
    const payload = await response.json();
    if (payload.code === 1) return payload.data || payload;
  } catch {
    // fallback to localStorage
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    newUserFreeMinutes: Number(settings.newUserFreeMinutes || 0),
    inviteRewardMinutes: Number(settings.inviteRewardMinutes || 0),
    adRewardMinutes: Number(settings.adRewardMinutes || 0),
  }));
  return fetchDashboard();
}

export async function saveUserProfile(id, patch) {
  const overrides = readUserOverrides();
  overrides[String(id)] = {
    ...(overrides[String(id)] || {}),
    ...patch,
  };
  localStorage.setItem(USER_OVERRIDES_KEY, JSON.stringify(overrides));
  return fetchDashboard();
}

// ==================== 广告配置 ====================

export async function fetchAdConfig() {
  try {
    const response = await fetch('/api/admin_dashboard/getAdConfig', { credentials: 'include' });
    const payload = await response.json();
    if (payload.code === 1 && payload.data) {
      return {
        ad_unit_id: payload.data.ad_unit_id || '',
        ad_name: payload.data.ad_name || '激励视频广告',
        status: payload.data.ad_enabled ? 1 : 0,
      };
    }
  } catch {
    // fallback to localStorage
  }
  return readJson(AD_CONFIG_KEY, { ad_unit_id: '', ad_name: '激励视频广告', status: 1 });
}

export async function saveAdConfig(config) {
  try {
    const response = await fetch('/api/admin_dashboard/saveAdConfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
      credentials: 'include',
    });
    const payload = await response.json();
    if (payload.code === 1) return payload.data || payload;
  } catch {
    // fallback to localStorage
  }
  localStorage.setItem(AD_CONFIG_KEY, JSON.stringify(config));
  return config;
}

// ==================== 支付配置 ====================

export async function fetchPayConfig() {
  try {
    const response = await fetch('/api/admin_dashboard/getPayConfig', { credentials: 'include' });
    const payload = await response.json();
    if (payload.code === 1 && payload.data) {
      return {
        mch_id: '',
        mch_key: '',
        app_id: '',
        app_secret: '',
        notify_url: '',
        pay_enabled: payload.data.pay_enabled ? 1 : 0,
      };
    }
  } catch {
    // fallback to localStorage
  }
  return readJson(PAY_CONFIG_KEY, {
    mch_id: '', mch_key: '', app_id: '', app_secret: '', notify_url: '', pay_enabled: 0,
  });
}

export async function savePayConfig(config) {
  try {
    const response = await fetch('/api/admin_dashboard/savePayConfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
      credentials: 'include',
    });
    const payload = await response.json();
    if (payload.code === 1) return payload.data || payload;
  } catch {
    // fallback to localStorage
  }
  localStorage.setItem(PAY_CONFIG_KEY, JSON.stringify(config));
  return config;
}
