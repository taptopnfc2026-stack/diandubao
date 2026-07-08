const demoPayload = {
  counters: {
    total_users: 1286,
    today_users: 37,
    active_users: 418,
    paid_users: 96,
    revenue_cents: 268800,
  },
  users: [
    { id: 1001, nickname: '小明', mobile: '138****1234', book_name: '三年级上册', cur_page: 20, create_time: 1783423600, last_login_time: 1783510000, member_expire_time: 1786192000 },
    { id: 1002, nickname: 'Lily', mobile: '', book_name: '五年级上册', cur_page: 9, create_time: 1783337200, last_login_time: 1783500000, member_expire_time: 0 },
    { id: 1003, nickname: 'Tom', mobile: '186****8821', book_name: '六年级上册', cur_page: 72, create_time: 1782991600, last_login_time: 1783460000, member_expire_time: 1783400000 },
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
};

export async function fetchDashboard() {
  try {
    const response = await fetch('/api/admin_dashboard/dashboard', { credentials: 'include' });
    const payload = await response.json();
    if (!response.ok || payload.code === 0 || payload.code === 500) {
      throw new Error(payload.msg || '后台接口未就绪');
    }
    return payload.data || payload;
  } catch {
    return demoPayload;
  }
}
