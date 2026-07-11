<?php

namespace app\api\controller;

use app\common\controller\Api;
use think\Db;

/**
 * SaaS 平台 - 超级管理员接口
 * 
 * 功能：
 *   1. 超级管理员登录/登出
 *   2. 租户管理（CRUD）
 *   3. 租户管理员账号管理
 *   4. 操作日志
 */
class SaasAdmin extends Api
{
    protected $noNeedLogin = ['login'];
    protected $noNeedRight = ['*'];

    /**
     * 超级管理员登录
     * POST /api/saas_admin/login
     * 参数：username, password
     */
    public function login()
    {
        $username = $this->request->post('username', '');
        $password = $this->request->post('password', '');

        if (!$username || !$password) {
            $this->error('请输入账号和密码');
        }

        $admin = Db::name('saas_admin')->where('username', $username)->find();
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
        $token = $this->generateToken($admin['id'], 'super_admin');
        
        // 更新登录信息
        Db::name('saas_admin')->where('id', $admin['id'])->update([
            'last_login_time' => time(),
            'last_login_ip' => $this->request->ip(),
            'update_time' => time(),
        ]);

        $this->success('登录成功', [
            'token' => $token,
            'admin' => [
                'id' => (int)$admin['id'],
                'username' => $admin['username'],
                'nickname' => $admin['nickname'],
                'role' => $admin['role'],
            ],
        ]);
    }

    /**
     * 获取当前登录管理员信息
     * GET /api/saas_admin/profile
     */
    public function profile()
    {
        $auth = $this->checkAuth('super_admin');
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $admin = Db::name('saas_admin')->where('id', $auth['admin_id'])->find();
        if (!$admin) {
            $this->error('管理员不存在');
        }

        $this->success('success', [
            'id' => (int)$admin['id'],
            'username' => $admin['username'],
            'nickname' => $admin['nickname'],
            'role' => $admin['role'],
        ]);
    }

    // ==================== 租户管理 ====================

    /**
     * 获取租户列表
     * GET /api/saas_admin/tenantList?page=1&keyword=&status=
     */
    public function tenantList()
    {
        $auth = $this->checkAuth('super_admin');
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $page = $this->request->get('page', 1, 'intval');
        $keyword = $this->request->get('keyword', '');
        $status = $this->request->get('status', '');

        $query = Db::name('saas_tenant');

        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('tenant_name', 'like', "%{$keyword}%")
                  ->whereOr('tenant_code', 'like', "%{$keyword}%")
                  ->whereOr('contact_name', 'like', "%{$keyword}%");
            });
        }
        if ($status !== '') {
            $query->where('status', (int)$status);
        }

        $total = $query->count();
        $list = $query->order('id DESC')
            ->page($page, 20)
            ->select();

        // 统计每个租户的用户数
        foreach ($list as &$tenant) {
            $tenant['user_count'] = Db::name('user_member')
                ->where('tenant_code', $tenant['tenant_code'])
                ->count();
            $tenant['admin_count'] = Db::name('saas_tenant_admin')
                ->where('tenant_code', $tenant['tenant_code'])
                ->count();
            $tenant['status_text'] = $this->getTenantStatusText($tenant['status']);
        }

        $this->success('success', [
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'page_size' => 20,
        ]);
    }

    /**
     * 获取单个租户详情
     * GET /api/saas_admin/tenantDetail?id=1
     */
    public function tenantDetail()
    {
        $auth = $this->checkAuth('super_admin');
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $id = $this->request->get('id', 0, 'intval');
        $tenant = Db::name('saas_tenant')->where('id', $id)->find();
        if (!$tenant) {
            $this->error('租户不存在');
        }

        // 统计信息
        $tenant['user_count'] = Db::name('user_member')
            ->where('tenant_code', $tenant['tenant_code'])->count();
        $tenant['admin_count'] = Db::name('saas_tenant_admin')
            ->where('tenant_code', $tenant['tenant_code'])->count();
        $tenant['order_count'] = Db::name('payment_order')
            ->where('tenant_code', $tenant['tenant_code'])->count();
        $tenant['revenue_cents'] = (int)Db::name('payment_order')
            ->where('tenant_code', $tenant['tenant_code'])
            ->where('pay_status', 'paid')
            ->sum('amount_cents');

        $this->success('success', $tenant);
    }

    /**
     * 创建租户
     * POST /api/saas_admin/createTenant
     */
    public function createTenant()
    {
        $auth = $this->checkAuth('super_admin');
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $tenantName = $this->request->post('tenant_name', '');
        $tenantCode = $this->request->post('tenant_code', '');
        $contactName = $this->request->post('contact_name', '');
        $contactMobile = $this->request->post('contact_mobile', '');
        $contactEmail = $this->request->post('contact_email', '');
        $adminUsername = $this->request->post('admin_username', '');
        $adminPassword = $this->request->post('admin_password', '');
        $expireTime = $this->request->post('expire_time', 0, 'intval');
        $maxUsers = $this->request->post('max_users', 0, 'intval');
        $remark = $this->request->post('remark', '');

        if (!$tenantName) {
            $this->error('请输入客户名称');
        }
        if (!$tenantCode) {
            $tenantCode = 't' . date('Ymd') . strtolower(substr(md5(uniqid()), 0, 6));
        }
        if (!$adminUsername) {
            $this->error('请设置管理员账号');
        }
        if (!$adminPassword || strlen($adminPassword) < 6) {
            $this->error('管理员密码至少6位');
        }

        // 检查租户标识是否重复
        $exists = Db::name('saas_tenant')->where('tenant_code', $tenantCode)->find();
        if ($exists) {
            $this->error('租户标识已存在，请更换');
        }

        // 检查管理员账号是否重复
        $adminExists = Db::name('saas_tenant_admin')
            ->where('tenant_code', $tenantCode)
            ->where('username', $adminUsername)
            ->find();
        if ($adminExists) {
            $this->error('该租户下管理员账号已存在');
        }

        Db::startTrans();
        try {
            // 创建租户
            $tenantId = Db::name('saas_tenant')->insertGetId([
                'tenant_code' => $tenantCode,
                'tenant_name' => $tenantName,
                'contact_name' => $contactName,
                'contact_mobile' => $contactMobile,
                'contact_email' => $contactEmail,
                'miniapp_appid' => '',
                'miniapp_secret' => '',
                'status' => 1,
                'expire_time' => $expireTime,
                'max_users' => $maxUsers,
                'remark' => $remark,
                'create_time' => time(),
                'update_time' => time(),
            ]);

            // 创建租户管理员
            $salt = substr(md5(uniqid()), 0, 16);
            $passwordHash = hash('sha256', $adminPassword . $salt);

            Db::name('saas_tenant_admin')->insert([
                'tenant_id' => $tenantId,
                'tenant_code' => $tenantCode,
                'username' => $adminUsername,
                'password_hash' => $passwordHash,
                'salt' => $salt,
                'nickname' => $contactName ?: $tenantName,
                'role' => 'tenant_admin',
                'status' => 1,
                'create_time' => time(),
                'update_time' => time(),
            ]);

            // 初始化租户的运营配置
            $this->initTenantConfig($tenantCode);

            // 记录日志
            $this->logOperation($tenantCode, $auth['admin_id'], 'super_admin', 'create_tenant', $tenantName);

            Db::commit();
            $this->success('租户创建成功', [
                'tenant_id' => $tenantId,
                'tenant_code' => $tenantCode,
                'admin_username' => $adminUsername,
            ]);
        } catch (\Exception $e) {
            Db::rollback();
            $this->error('创建失败：' . $e->getMessage());
        }
    }

    /**
     * 更新租户信息
     * POST /api/saas_admin/updateTenant
     */
    public function updateTenant()
    {
        $auth = $this->checkAuth('super_admin');
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $id = $this->request->post('id', 0, 'intval');
        $tenant = Db::name('saas_tenant')->where('id', $id)->find();
        if (!$tenant) {
            $this->error('租户不存在');
        }

        $updateData = [];
        $fields = ['tenant_name', 'contact_name', 'contact_mobile', 'contact_email', 
                    'miniapp_appid', 'miniapp_secret', 'status', 'expire_time', 'max_users', 'remark'];
        foreach ($fields as $field) {
            if ($this->request->has($field, 'post')) {
                $updateData[$field] = $this->request->post($field);
            }
        }

        if (!empty($updateData)) {
            $updateData['update_time'] = time();
            Db::name('saas_tenant')->where('id', $id)->update($updateData);

            // 记录日志
            $this->logOperation($tenant['tenant_code'], $auth['admin_id'], 'super_admin', 
                'update_tenant', json_encode($updateData, JSON_UNESCAPED_UNICODE));
        }

        $this->success('更新成功');
    }

    /**
     * 删除租户（软删除，禁用）
     * POST /api/saas_admin/disableTenant
     */
    public function disableTenant()
    {
        $auth = $this->checkAuth('super_admin');
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $id = $this->request->post('id', 0, 'intval');
        $tenant = Db::name('saas_tenant')->where('id', $id)->find();
        if (!$tenant) {
            $this->error('租户不存在');
        }

        Db::name('saas_tenant')->where('id', $id)->update([
            'status' => 0,
            'update_time' => time(),
        ]);

        $this->logOperation($tenant['tenant_code'], $auth['admin_id'], 'super_admin', 'disable_tenant', $tenant['tenant_name']);
        $this->success('已禁用');
    }

    /**
     * 启用租户
     * POST /api/saas_admin/enableTenant
     */
    public function enableTenant()
    {
        $auth = $this->checkAuth('super_admin');
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $id = $this->request->post('id', 0, 'intval');
        $tenant = Db::name('saas_tenant')->where('id', $id)->find();
        if (!$tenant) {
            $this->error('租户不存在');
        }

        Db::name('saas_tenant')->where('id', $id)->update([
            'status' => 1,
            'update_time' => time(),
        ]);

        $this->logOperation($tenant['tenant_code'], $auth['admin_id'], 'super_admin', 'enable_tenant', $tenant['tenant_name']);
        $this->success('已启用');
    }

    // ==================== 租户管理员管理 ====================

    /**
     * 获取租户下的管理员列表
     * GET /api/saas_admin/tenantAdminList?tenant_id=1
     */
    public function tenantAdminList()
    {
        $auth = $this->checkAuth('super_admin');
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $tenantId = $this->request->get('tenant_id', 0, 'intval');
        $list = Db::name('saas_tenant_admin')
            ->where('tenant_id', $tenantId)
            ->order('id ASC')
            ->select();

        // 不返回密码
        foreach ($list as &$item) {
            unset($item['password_hash'], $item['salt']);
        }

        $this->success('success', $list);
    }

    /**
     * 为租户添加管理员
     * POST /api/saas_admin/addTenantAdmin
     */
    public function addTenantAdmin()
    {
        $auth = $this->checkAuth('super_admin');
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $tenantId = $this->request->post('tenant_id', 0, 'intval');
        $username = $this->request->post('username', '');
        $password = $this->request->post('password', '');
        $nickname = $this->request->post('nickname', '');

        $tenant = Db::name('saas_tenant')->where('id', $tenantId)->find();
        if (!$tenant) {
            $this->error('租户不存在');
        }
        if (!$username || !$password) {
            $this->error('请填写账号和密码');
        }

        $exists = Db::name('saas_tenant_admin')
            ->where('tenant_code', $tenant['tenant_code'])
            ->where('username', $username)
            ->find();
        if ($exists) {
            $this->error('该账号已存在');
        }

        $salt = substr(md5(uniqid()), 0, 16);
        $passwordHash = hash('sha256', $password . $salt);

        Db::name('saas_tenant_admin')->insert([
            'tenant_id' => $tenantId,
            'tenant_code' => $tenant['tenant_code'],
            'username' => $username,
            'password_hash' => $passwordHash,
            'salt' => $salt,
            'nickname' => $nickname,
            'role' => 'tenant_admin',
            'status' => 1,
            'create_time' => time(),
            'update_time' => time(),
        ]);

        $this->logOperation($tenant['tenant_code'], $auth['admin_id'], 'super_admin', 'add_tenant_admin', $username);
        $this->success('添加成功');
    }

    /**
     * 重置租户管理员密码
     * POST /api/saas_admin/resetTenantAdminPassword
     */
    public function resetTenantAdminPassword()
    {
        $auth = $this->checkAuth('super_admin');
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $adminId = $this->request->post('admin_id', 0, 'intval');
        $newPassword = $this->request->post('new_password', '');

        $admin = Db::name('saas_tenant_admin')->where('id', $adminId)->find();
        if (!$admin) {
            $this->error('管理员不存在');
        }
        if (strlen($newPassword) < 6) {
            $this->error('密码至少6位');
        }

        $salt = substr(md5(uniqid()), 0, 16);
        $passwordHash = hash('sha256', $newPassword . $salt);

        Db::name('saas_tenant_admin')->where('id', $adminId)->update([
            'password_hash' => $passwordHash,
            'salt' => $salt,
            'update_time' => time(),
        ]);

        $this->logOperation($admin['tenant_code'], $auth['admin_id'], 'super_admin', 
            'reset_admin_password', $admin['username']);
        $this->success('密码已重置');
    }

    // ==================== 看板统计 ====================

    /**
     * SaaS 平台总览数据
     * GET /api/saas_admin/platformOverview
     */
    public function platformOverview()
    {
        $auth = $this->checkAuth('super_admin');
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $totalTenants = Db::name('saas_tenant')->count();
        $activeTenants = Db::name('saas_tenant')->where('status', 1)->count();
        $disabledTenants = Db::name('saas_tenant')->where('status', 0)->count();
        $totalUsers = Db::name('user_member')->count();
        $totalRevenue = (int)Db::name('payment_order')->where('pay_status', 'paid')->sum('amount_cents');
        $todayNewTenants = Db::name('saas_tenant')
            ->where('create_time', '>=', strtotime(date('Y-m-d')))
            ->count();
        $todayNewUsers = Db::name('user_member')
            ->where('create_time', '>=', strtotime(date('Y-m-d')))
            ->count();

        // 最近注册的租户
        $recentTenants = Db::name('saas_tenant')
            ->order('id DESC')
            ->limit(5)
            ->select();

        $this->success('success', [
            'total_tenants' => $totalTenants,
            'active_tenants' => $activeTenants,
            'disabled_tenants' => $disabledTenants,
            'total_users' => $totalUsers,
            'total_revenue_cents' => $totalRevenue,
            'today_new_tenants' => $todayNewTenants,
            'today_new_users' => $todayNewUsers,
            'recent_tenants' => $recentTenants,
        ]);
    }

    /**
     * 操作日志列表
     * GET /api/saas_admin/operationLogs?page=1&tenant_code=
     */
    public function operationLogs()
    {
        $auth = $this->checkAuth('super_admin');
        if (!$auth) {
            $this->error('未登录', '', 401);
        }

        $page = $this->request->get('page', 1, 'intval');
        $tenantCode = $this->request->get('tenant_code', '');

        $query = Db::name('saas_operation_log');
        if ($tenantCode) {
            $query->where('tenant_code', $tenantCode);
        }

        $total = $query->count();
        $list = $query->order('id DESC')
            ->page($page, 30)
            ->select();

        $this->success('success', [
            'list' => $list,
            'total' => $total,
            'page' => $page,
        ]);
    }

    // ==================== 私有辅助方法 ====================

    private function generateToken($adminId, $role)
    {
        $payload = [
            'admin_id' => $adminId,
            'role' => $role,
            'exp' => time() + 86400 * 7, // 7天有效
        ];
        $json = json_encode($payload);
        $base64 = base64_encode($json);
        $sign = hash_hmac('sha256', $base64, 'saas_secret_key_2026');
        return $base64 . '.' . $sign;
    }

    private function checkAuth($requiredRole = '')
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
        // Bearer token 处理
        if (stripos($token, 'Bearer ') === 0) {
            $token = trim(substr($token, 7));
        }
        $token = str_replace(' ', '+', $token);

        $parts = explode('.', $token);
        if (count($parts) !== 2) {
            return false;
        }

        $base64 = $parts[0];
        $sign = $parts[1];
        $expectedSign = hash_hmac('sha256', $base64, 'saas_secret_key_2026');

        if (!hash_equals($expectedSign, $sign)) {
            return false;
        }

        $payload = json_decode(base64_decode($base64), true);
        if (!$payload) {
            return false;
        }

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }

        if ($requiredRole && $payload['role'] !== $requiredRole) {
            return false;
        }

        return $payload;
    }

    private function getTenantStatusText($status)
    {
        $map = [0 => '已禁用', 1 => '已启用', 2 => '待审核'];
        return $map[$status] ?? '未知';
    }

    private function initTenantConfig($tenantCode)
    {
        $defaultConfigs = [
            ['config_key' => 'new_user_free_minutes', 'config_value' => '70', 'remark' => '新用户免费时长'],
            ['config_key' => 'invite_reward_minutes', 'config_value' => '20', 'remark' => '邀请好友奖励时长'],
            ['config_key' => 'ad_reward_minutes', 'config_value' => '10', 'remark' => '观看广告奖励时长'],
            ['config_key' => 'daily_limit_minutes', 'config_value' => '70', 'remark' => '每日使用上限'],
        ];

        $now = time();
        foreach ($defaultConfigs as $config) {
            Db::name('operation_config')->insert([
                'tenant_code' => $tenantCode,
                'config_key' => $config['config_key'],
                'config_value' => $config['config_value'],
                'remark' => $config['remark'],
                'create_time' => $now,
                'update_time' => $now,
            ]);
        }

        // 初始化默认广告配置
        Db::name('ad_config')->insert([
            'tenant_code' => $tenantCode,
            'ad_unit_id' => '',
            'ad_name' => '激励视频广告',
            'status' => 1,
            'create_time' => $now,
            'update_time' => $now,
        ]);

        // 初始化默认支付配置
        Db::name('pay_config')->insert([
            'tenant_code' => $tenantCode,
            'mch_id' => '',
            'mch_key' => '',
            'app_id' => '',
            'app_secret' => '',
            'notify_url' => '',
            'pay_enabled' => 0,
            'create_time' => $now,
            'update_time' => $now,
        ]);
    }

    private function logOperation($tenantCode, $adminId, $adminType, $action, $target, $detail = '')
    {
        Db::name('saas_operation_log')->insert([
            'tenant_code' => $tenantCode,
            'admin_id' => $adminId,
            'admin_type' => $adminType,
            'action' => $action,
            'target' => $target,
            'detail' => is_array($detail) ? json_encode($detail, JSON_UNESCAPED_UNICODE) : $detail,
            'ip' => $this->request->ip(),
            'create_time' => time(),
        ]);
    }
}
