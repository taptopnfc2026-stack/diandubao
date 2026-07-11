<?php

namespace app\api\controller;

use app\common\controller\Api;
use think\Db;

/**
 * SaaS 平台 - 租户管理员接口
 * 
 * 租户管理员登录自己的后台，管理自己的小程序配置和数据
 * 所有查询自动带上 tenant_code 做数据隔离
 */
class TenantAdmin extends Api
{
    protected $noNeedLogin = ['*'];
    protected $noNeedRight = ['*'];

    /**
     * 租户管理员登录
     * POST /api/tenant_admin/login
     * 参数：tenant_code, username, password
     */
    public function login()
    {
        $tenantCode = $this->request->post('tenant_code', '');
        $username = $this->request->post('username', '');
        $password = $this->request->post('password', '');

        if (!$tenantCode || !$username || !$password) {
            $this->error('请输入租户标识、账号和密码');
        }

        // 检查租户状态
        $tenant = Db::name('saas_tenant')->where('tenant_code', $tenantCode)->find();
        if (!$tenant) {
            $this->error('租户不存在');
        }
        if (!$tenant['status']) {
            $this->error('该账号已被禁用，请联系平台管理员');
        }

        // 检查管理员账号
        $admin = Db::name('saas_tenant_admin')
            ->where('tenant_code', $tenantCode)
            ->where('username', $username)
            ->find();
        if (!$admin) {
            $this->error('账号不存在');
        }
        if (!$admin['status']) {
            $this->error('账号已被禁用');
        }

        $hash = hash('sha256', $password . $admin['salt']);
        if ($hash !== $admin['password_hash']) {
            $this->error('密码错误');
        }

        // 生成 token
        $token = $this->generateToken($admin['id'], $tenantCode, 'tenant_admin');

        // 更新登录信息
        Db::name('saas_tenant_admin')->where('id', $admin['id'])->update([
            'last_login_time' => time(),
            'last_login_ip' => $this->request->ip(),
            'update_time' => time(),
        ]);

        $this->success('登录成功', [
            'token' => $token,
            'tenant' => [
                'id' => (int)$tenant['id'],
                'tenant_code' => $tenant['tenant_code'],
                'tenant_name' => $tenant['tenant_name'],
                'miniapp_appid' => $tenant['miniapp_appid'],
                'miniapp_secret' => $tenant['miniapp_secret'],
            ],
            'admin' => [
                'id' => (int)$admin['id'],
                'username' => $admin['username'],
                'nickname' => $admin['nickname'],
                'role' => $admin['role'],
            ],
        ]);
    }

    /**
     * 获取当前租户信息
     * GET /api/tenant_admin/profile
     */
    public function profile()
    {
        $auth = $this->checkAuth();
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $tenant = Db::name('saas_tenant')->where('tenant_code', $auth['tenant_code'])->find();
        $admin = Db::name('saas_tenant_admin')->where('id', $auth['admin_id'])->find();

        $this->success('success', [
            'tenant' => [
                'id' => (int)$tenant['id'],
                'tenant_code' => $tenant['tenant_code'],
                'tenant_name' => $tenant['tenant_name'],
                'miniapp_appid' => $tenant['miniapp_appid'],
                'miniapp_secret' => $tenant['miniapp_secret'],
                'share_cover_url' => $this->getOperationConfig($auth['tenant_code'])['share_cover_url'],
                'contact_name' => $tenant['contact_name'],
                'contact_mobile' => $tenant['contact_mobile'],
                'contact_email' => $tenant['contact_email'],
                'status' => (int)$tenant['status'],
                'expire_time' => (int)$tenant['expire_time'],
                'max_users' => (int)$tenant['max_users'],
            ],
            'admin' => [
                'id' => (int)$admin['id'],
                'username' => $admin['username'],
                'nickname' => $admin['nickname'],
            ],
        ]);
    }

    // ==================== 小程序配置 ====================

    /**
     * 保存小程序配置（AppID + AppSecret + 分享封面）
     * POST /api/tenant_admin/saveMiniappConfig
     */
    public function saveMiniappConfig()
    {
        $auth = $this->checkAuth();
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $appId = $this->request->post('miniapp_appid', '');
        $appSecret = $this->request->post('miniapp_secret', '');
        $shareCoverUrl = $this->request->post('share_cover_url', '');

        Db::name('saas_tenant')
            ->where('tenant_code', $auth['tenant_code'])
            ->update([
                'miniapp_appid' => $appId,
                'miniapp_secret' => $appSecret,
                'update_time' => time(),
            ]);

        // 同时更新支付配置中的 app_id 和 app_secret
        $payConfig = Db::name('pay_config')
            ->where('tenant_code', $auth['tenant_code'])
            ->order('id ASC')
            ->find();
        if ($payConfig) {
            Db::name('pay_config')->where('id', $payConfig['id'])->update([
                'app_id' => $appId,
                'app_secret' => $appSecret,
                'update_time' => time(),
            ]);
        }

        $this->saveOperationConfig($auth['tenant_code'], 'share_cover_url', $shareCoverUrl);

        $this->logOperation($auth, 'save_miniapp_config', '小程序配置');
        $this->success('保存成功');
    }

    /**
     * 上传小程序分享封面
     * POST /api/tenant_admin/uploadShareCover
     */
    public function uploadShareCover()
    {
        $auth = $this->checkAuth();
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $file = $this->request->file('file');
        if (!$file) {
            $this->error('请选择要上传的图片');
        }

        $info = $file
            ->validate(['size' => 2 * 1024 * 1024, 'ext' => 'jpg,jpeg,png,webp,gif'])
            ->move(ROOT_PATH . 'public' . DS . 'uploads' . DS . 'share');

        if (!$info) {
            $this->error($file->getError() ?: '上传失败');
        }

        $path = str_replace('\\', '/', $info->getSaveName());
        $url = rtrim($this->request->domain(), '/') . '/uploads/share/' . $path;
        $this->saveOperationConfig($auth['tenant_code'], 'share_cover_url', $url);
        $this->logOperation($auth, 'upload_share_cover', '小程序分享封面');

        $this->success('上传成功', ['url' => $url]);
    }

    // ==================== 看板（租户端，数据隔离） ====================

    /**
     * 租户端数据看板
     * GET /api/tenant_admin/dashboard
     */
    public function dashboard()
    {
        $auth = $this->checkAuth();
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $tenantCode = $auth['tenant_code'];
        $todayStart = strtotime(date('Y-m-d'));
        $now = time();

        $totalUsers = Db::name('user_member')->where('tenant_code', $tenantCode)->count();
        $todayUsers = Db::name('user_member')
            ->where('tenant_code', $tenantCode)
            ->where('create_time', '>=', $todayStart)
            ->count();
        $paidUsers = Db::name('user_member')
            ->where('tenant_code', $tenantCode)
            ->where('expire_time', '>', $now)
            ->count();
        $revenueCents = Db::name('payment_order')
            ->where('tenant_code', $tenantCode)
            ->where('pay_status', 'paid')
            ->sum('amount_cents');
        $inviteCount = Db::name('user_invite')
            ->where('tenant_code', $tenantCode)
            ->count();
        $adWatchCount = Db::name('user_member')
            ->where('tenant_code', $tenantCode)
            ->sum('ad_watch_count');
        $grantedMinutes = Db::name('user_reward')
            ->where('tenant_code', $tenantCode)
            ->sum('reward_minutes');

        // 获取运营配置
        $settings = $this->getOperationConfig($tenantCode);

        // 用户列表
        $users = Db::name('user_member')
            ->alias('m')
            ->field('m.uid,m.level,m.expire_time,m.invite_count,m.ad_watch_count,m.reward_minutes,m.member_exchange_count,m.create_time')
            ->where('m.tenant_code', $tenantCode)
            ->order('m.id DESC')
            ->limit(20)
            ->select();

        // 套餐
        $plans = Db::name('product_plan')->order('sort ASC,id ASC')->select();

        // 订单
        $orders = Db::name('payment_order')
            ->where('tenant_code', $tenantCode)
            ->order('id DESC')
            ->limit(20)
            ->select();

        // 奖励记录
        $rewards = Db::name('user_reward')
            ->where('tenant_code', $tenantCode)
            ->order('id DESC')
            ->limit(20)
            ->select();

        $this->success('success', [
            'counters' => [
                'total_users' => (int)$totalUsers,
                'today_users' => (int)$todayUsers,
                'paid_users' => (int)$paidUsers,
                'revenue_cents' => (int)$revenueCents,
                'invite_count' => (int)$inviteCount,
                'ad_watch_count' => (int)$adWatchCount,
                'granted_minutes' => (int)$grantedMinutes,
            ],
            'settings' => $settings,
            'users' => $users,
            'plans' => $plans,
            'orders' => $orders,
            'rewards' => $rewards,
        ]);
    }

    // ==================== 运营配置 ====================

    /**
     * 保存运营设置
     * POST /api/tenant_admin/saveSettings
     */
    public function saveSettings()
    {
        $auth = $this->checkAuth();
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $tenantCode = $auth['tenant_code'];
        $data = $this->request->post();
        $keys = ['new_user_free_minutes', 'invite_reward_minutes', 'ad_reward_minutes', 'daily_limit_minutes'];

        foreach ($keys as $key) {
            if (isset($data[$key])) {
                Db::name('operation_config')
                    ->where('tenant_code', $tenantCode)
                    ->where('config_key', $key)
                    ->update([
                        'config_value' => (string)(int)$data[$key],
                        'update_time' => time(),
                    ]);
            }
        }

        $this->logOperation($auth, 'save_settings', '运营设置');
        return $this->dashboard();
    }

    // ==================== 广告配置 ====================

    /**
     * 获取广告配置
     * GET /api/tenant_admin/getAdConfig
     */
    public function getAdConfig()
    {
        $auth = $this->checkAuth();
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $ad = Db::name('ad_config')
            ->where('tenant_code', $auth['tenant_code'])
            ->order('id ASC')
            ->find();

        $this->success('success', $ad ?: [
            'ad_unit_id' => '',
            'ad_name' => '激励视频广告',
            'status' => 1,
        ]);
    }

    /**
     * 保存广告配置
     * POST /api/tenant_admin/saveAdConfig
     */
    public function saveAdConfig()
    {
        $auth = $this->checkAuth();
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $tenantCode = $auth['tenant_code'];
        $adUnitId = $this->request->post('ad_unit_id', '');
        $adName = $this->request->post('ad_name', '激励视频广告');
        $status = $this->request->post('status', 1, 'intval');

        $existing = Db::name('ad_config')
            ->where('tenant_code', $tenantCode)
            ->order('id ASC')
            ->find();

        if ($existing) {
            Db::name('ad_config')->where('id', $existing['id'])->update([
                'ad_unit_id' => $adUnitId,
                'ad_name' => $adName,
                'status' => $status,
                'update_time' => time(),
            ]);
        } else {
            Db::name('ad_config')->insert([
                'tenant_code' => $tenantCode,
                'ad_unit_id' => $adUnitId,
                'ad_name' => $adName,
                'status' => $status,
                'create_time' => time(),
                'update_time' => time(),
            ]);
        }

        $this->logOperation($auth, 'save_ad_config', '广告配置');
        $this->success('保存成功');
    }

    // ==================== 支付配置 ====================

    /**
     * 获取支付配置
     * GET /api/tenant_admin/getPayConfig
     */
    public function getPayConfig()
    {
        $auth = $this->checkAuth();
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $config = Db::name('pay_config')
            ->where('tenant_code', $auth['tenant_code'])
            ->order('id ASC')
            ->find();

        if ($config) {
            // 不返回完整密钥
            $config['mch_key'] = $config['mch_key'] ? '••••••••' : '';
            $config['app_secret'] = $config['app_secret'] ? '••••••••' : '';
        }

        $this->success('success', $config ?: [
            'mch_id' => '',
            'mch_key' => '',
            'app_id' => '',
            'app_secret' => '',
            'notify_url' => '',
            'pay_enabled' => 0,
        ]);
    }

    /**
     * 保存支付配置
     * POST /api/tenant_admin/savePayConfig
     */
    public function savePayConfig()
    {
        $auth = $this->checkAuth();
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $tenantCode = $auth['tenant_code'];
        $mchId = $this->request->post('mch_id', '');
        $mchKey = $this->request->post('mch_key', '');
        $appId = $this->request->post('app_id', '');
        $appSecret = $this->request->post('app_secret', '');
        $notifyUrl = $this->request->post('notify_url', '');
        $payEnabled = $this->request->post('pay_enabled', 0, 'intval');

        $existing = Db::name('pay_config')
            ->where('tenant_code', $tenantCode)
            ->order('id ASC')
            ->find();

        if ($existing) {
            $updateData = [
                'notify_url' => $notifyUrl,
                'pay_enabled' => $payEnabled,
                'update_time' => time(),
            ];
            if ($mchId) $updateData['mch_id'] = $mchId;
            // 只有非掩码值才更新密钥
            if ($mchKey && $mchKey !== '••••••••') $updateData['mch_key'] = $mchKey;
            if ($appId) $updateData['app_id'] = $appId;
            if ($appSecret && $appSecret !== '••••••••') $updateData['app_secret'] = $appSecret;
            Db::name('pay_config')->where('id', $existing['id'])->update($updateData);
        } else {
            Db::name('pay_config')->insert([
                'tenant_code' => $tenantCode,
                'mch_id' => $mchId,
                'mch_key' => $mchKey,
                'app_id' => $appId,
                'app_secret' => $appSecret,
                'notify_url' => $notifyUrl,
                'pay_enabled' => $payEnabled,
                'create_time' => time(),
                'update_time' => time(),
            ]);
        }

        $this->logOperation($auth, 'save_pay_config', '支付配置');
        $this->success('保存成功');
    }

    /**
     * 会员兑换码列表
     * GET /api/tenant_admin/listRedeemCodes
     */
    public function listRedeemCodes()
    {
        $auth = $this->checkAuth();
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $list = Db::name('member_redeem_code')
            ->alias('c')
            ->field('c.*,p.name as plan_name,p.duration_days,p.price_cents')
            ->join('__PRODUCT_PLAN__ p', 'p.id = c.plan_id', 'LEFT')
            ->where('c.tenant_code', $auth['tenant_code'])
            ->order('c.id DESC')
            ->limit(200)
            ->select();

        $this->success('success', [
            'list' => $list ?: [],
        ]);
    }

    /**
     * 生成会员兑换码
     * POST /api/tenant_admin/generateRedeemCode
     */
    public function generateRedeemCode()
    {
        $auth = $this->checkAuth();
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $planId = $this->request->post('plan_id', 0, 'intval');
        $count = min(100, max(1, $this->request->post('count', 1, 'intval')));
        if (!$planId) {
            $this->error('请选择套餐');
        }

        $plan = Db::name('product_plan')
            ->where('id', $planId)
            ->where('status', 1)
            ->find();
        if (!$plan) {
            $this->error('套餐不存在或已下架');
        }

        $now = time();
        $rows = [];
        for ($i = 0; $i < $count; $i++) {
            $rows[] = [
                'tenant_code' => $auth['tenant_code'],
                'code' => $this->makeRedeemCode(),
                'plan_id' => $planId,
                'used' => 0,
                'used_uid' => 0,
                'used_time' => 0,
                'create_time' => $now,
                'update_time' => $now,
            ];
        }
        Db::name('member_redeem_code')->insertAll($rows);

        $this->logOperation($auth, 'generate_redeem_code', '会员兑换码');
        $this->success('生成成功', [
            'list' => array_map(function ($row) use ($plan) {
                $row['plan_name'] = $plan['name'];
                return $row;
            }, $rows),
        ]);
    }

    // ==================== 辅助 ====================

    private function makeRedeemCode()
    {
        do {
            $code = 'VIP' . strtoupper(substr(md5(uniqid('', true) . mt_rand()), 0, 10));
            $exists = Db::name('member_redeem_code')->where('code', $code)->find();
        } while ($exists);
        return $code;
    }

    private function generateToken($adminId, $tenantCode, $role)
    {
        $payload = [
            'admin_id' => $adminId,
            'tenant_code' => $tenantCode,
            'role' => $role,
            'exp' => time() + 86400 * 7,
        ];
        $json = json_encode($payload);
        $base64 = base64_encode($json);
        $sign = hash_hmac('sha256', $base64, 'saas_secret_key_2026');
        return $base64 . '.' . $sign;
    }

    private function checkAuth()
    {
        $token = $this->request->header('Authorization', '');
        if (!$token) $token = $this->request->header('authorization', '');
        if (!$token) $token = $this->request->param('token', '');
        if (!$token) $token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!$token) $token = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!$token) {
            return false;
        }
        $token = trim($token);
        if (stripos($token, 'Bearer ') === 0) {
            $token = trim(substr($token, 7));
        }
        $token = str_replace(' ', '+', $token);

        $parts = explode('.', $token);
        if (count($parts) !== 2) return false;

        $base64 = $parts[0];
        $sign = $parts[1];
        $expectedSign = hash_hmac('sha256', $base64, 'saas_secret_key_2026');
        if (!hash_equals($expectedSign, $sign)) return false;

        $payload = json_decode(base64_decode($base64), true);
        if (!$payload) return false;
        if (isset($payload['exp']) && $payload['exp'] < time()) return false;

        return $payload;
    }

    private function getOperationConfig($tenantCode)
    {
        $rows = Db::name('operation_config')
            ->where('tenant_code', $tenantCode)
            ->select();
        $config = [];
        foreach ($rows as $row) {
            $config[$row['config_key']] = $row['config_value'];
        }
        return [
            'new_user_free_minutes' => (int)($config['new_user_free_minutes'] ?? 70),
            'invite_reward_minutes' => (int)($config['invite_reward_minutes'] ?? 20),
            'ad_reward_minutes' => (int)($config['ad_reward_minutes'] ?? 10),
            'daily_limit_minutes' => (int)($config['daily_limit_minutes'] ?? 70),
            'share_cover_url' => (string)($config['share_cover_url'] ?? ''),
        ];
    }

    private function saveOperationConfig($tenantCode, $key, $value)
    {
        $existing = Db::name('operation_config')
            ->where('tenant_code', $tenantCode)
            ->where('config_key', $key)
            ->find();

        if ($existing) {
            Db::name('operation_config')->where('id', $existing['id'])->update([
                'config_value' => (string)$value,
                'update_time' => time(),
            ]);
            return;
        }

        Db::name('operation_config')->insert([
            'tenant_code' => $tenantCode,
            'config_key' => $key,
            'config_value' => (string)$value,
            'create_time' => time(),
            'update_time' => time(),
        ]);
    }

    private function logOperation($auth, $action, $target, $detail = '')
    {
        Db::name('saas_operation_log')->insert([
            'tenant_code' => $auth['tenant_code'],
            'admin_id' => $auth['admin_id'],
            'admin_type' => 'tenant_admin',
            'action' => $action,
            'target' => $target,
            'detail' => is_array($detail) ? json_encode($detail, JSON_UNESCAPED_UNICODE) : $detail,
            'ip' => $this->request->ip(),
            'create_time' => time(),
        ]);
    }
}
