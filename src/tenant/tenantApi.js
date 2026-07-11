/**
 * 租户端 V2 后台 API 层
 * 复用原 admin 后台数据模型，API 前缀改为 /api/tenant_admin
 */

const API_BASE = '/api/tenant_admin';

function getToken() {
  return sessionStorage.getItem('tenant-token') || '';
}

export function setTenantToken(token) {
  sessionStorage.setItem('tenant-token', token);
}

export function clearTenantToken() {
  sessionStorage.removeItem('tenant-token');
}

async function apiCall(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  const token = getToken();
  if (token) {
    opts.headers.Authorization = `Bearer ${token}`;
  }
  if (body) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(API_BASE + path, opts);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`接口返回异常：${res.status || ''} ${res.statusText || ''}`.trim());
  }
  if (data.code === 1) return data.data || data;
  if (res.status === 401) {
    clearTenantToken();
    window.location.reload();
  }
  throw new Error(data.msg || '请求失败');
}

async function uploadCall(path, file) {
  const form = new FormData();
  form.append('file', file);
  const headers = {};
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: form,
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`接口返回异常：${res.status || ''} ${res.statusText || ''}`.trim());
  }
  if (data.code === 1) return data.data || data;
  throw new Error(data.msg || '上传失败');
}

export async function loginTenant(tenantCode, username, password) {
  return apiCall('POST', '/login', { tenant_code: tenantCode, username, password });
}

export async function fetchTenantDashboard() {
  return apiCall('GET', '/dashboard');
}

export async function saveOperationSettings(settings) {
  return apiCall('POST', '/saveSettings', {
    new_user_free_minutes: settings.newUserFreeMinutes,
    invite_reward_minutes: settings.inviteRewardMinutes,
    ad_reward_minutes: settings.adRewardMinutes,
  });
}

export async function saveUserProfile(id, patch) {
  return apiCall('POST', '/saveUserProfile', { id, ...patch });
}

export async function fetchAdConfig() {
  const data = await apiCall('GET', '/getAdConfig');
  return {
    ad_unit_id: data.ad_unit_id || '',
    ad_name: data.ad_name || '激励视频广告',
    status: Number(data.status ?? data.ad_enabled ?? 1),
  };
}

export async function saveAdConfig(config) {
  return apiCall('POST', '/saveAdConfig', {
    ad_unit_id: config.ad_unit_id,
    ad_name: config.ad_name || '激励视频广告',
    status: config.status ? 1 : 0,
  });
}

export async function fetchPayConfig() {
  const data = await apiCall('GET', '/getPayConfig');
  return {
    mch_id: data.mch_id || '',
    mch_key: data.mch_key || '',
    app_id: data.app_id || '',
    app_secret: data.app_secret || '',
    notify_url: data.notify_url || '',
    pay_enabled: Number(data.pay_enabled ?? 0),
  };
}

export async function savePayConfig(config) {
  return apiCall('POST', '/savePayConfig', {
    mch_id: config.mch_id,
    mch_key: config.mch_key,
    app_id: config.app_id,
    app_secret: config.app_secret,
    notify_url: config.notify_url,
    pay_enabled: config.pay_enabled ? 1 : 0,
  });
}

export async function savePlans(plans) {
  return apiCall('POST', '/savePlans', { plans });
}

export async function listRedeemCodes() {
  return apiCall('GET', '/listRedeemCodes');
}

export async function generateRedeemCode(planId, count = 1) {
  return apiCall('POST', '/generateRedeemCode', { plan_id: planId, count });
}

export async function saveMiniappConfig(config) {
  return apiCall('POST', '/saveMiniappConfig', {
    miniapp_appid: config.miniapp_appid,
    miniapp_secret: config.miniapp_secret,
    share_cover_url: config.share_cover_url,
  });
}

export async function fetchTenantProfile() {
  return apiCall('GET', '/profile');
}

export async function uploadShareCover(file) {
  return uploadCall('/uploadShareCover', file);
}
