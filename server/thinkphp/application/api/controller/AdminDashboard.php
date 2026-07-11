<?php

namespace app\api\controller;

use app\common\controller\Api;
use think\Db;

/**
 * 小程序端用户接口（支持多租户隔离）
 * 
 * 所有接口通过 tenant_code 参数识别租户，实现数据隔离
 * 小程序端调用时需传入 tenant_code
 */
class AdminDashboard extends Api
{
    protected $noNeedLogin = ['*'];
    protected $noNeedRight = ['*'];

    /**
     * 从请求中获取租户标识
     */
    private function getTenantCode()
    {
        // 优先从 GET/POST 中获取
        $tenantCode = $this->request->param('tenant_code', '');
        if ($tenantCode) return $tenantCode;

        // 从 header 中获取
        $tenantCode = $this->request->header('X-Tenant-Code', '');
        if ($tenantCode) return $tenantCode;

        // 兼容旧版：使用默认租户
        return 'default';
    }

    // ==================== 后台看板 ====================

    public function dashboard()
    {
        $tenantCode = $this->getTenantCode();
        $todayStart = strtotime(date('Y-m-d'));
        $now = time();

        $totalUsers = Db::name('user_member')->where('tenant_code', $tenantCode)->count();
        $todayUsers = Db::name('user_member')
            ->where('tenant_code', $tenantCode)
            ->where('create_time', '>=', $todayStart)
            ->count();
        $activeUsers = Db::name('study_event')
            ->where('tenant_code', $tenantCode)
            ->where('create_time', '>=', $todayStart - 6 * 86400)
            ->group('uid')
            ->count();
        $paidUsers = Db::name('user_member')
            ->where('tenant_code', $tenantCode)
            ->where('expire_time', '>', $now)
            ->count();
        $revenueCents = Db::name('payment_order')
            ->where('tenant_code', $tenantCode)
            ->where('pay_status', 'paid')
            ->sum('amount_cents');
        $memberExchangeCount = Db::name('user_member')
            ->where('tenant_code', $tenantCode)
            ->where('member_exchange_count', '>', 0)
            ->count();
        $inviteCount = Db::name('user_invite')
            ->where('tenant_code', $tenantCode)
            ->count();
        $adWatchCount = Db::name('user_member')
            ->where('tenant_code', $tenantCode)
            ->sum('ad_watch_count');
        $grantedMinutes = Db::name('user_reward')
            ->where('tenant_code', $tenantCode)
            ->sum('reward_minutes');
        $remainingMinutes = Db::name('user_usage')
            ->where('tenant_code', $tenantCode)
            ->where('date_key', date('Y-m-d'))
            ->sum('remaining_minutes');

        $users = Db::name('user')
            ->alias('u')
            ->field('u.id,u.nickname,u.username,u.mobile,u.avatar,u.createtime as create_time,u.logintime as last_login_time,m.expire_time as member_expire_time,m.invite_count,m.ad_watch_count,m.reward_minutes,m.member_exchange_count,b.book_name,l.cur_page')
            ->join('__USER_MEMBER__ m', 'm.uid = u.id AND m.tenant_code = \'' . addslashes($tenantCode) . '\'', 'LEFT')
            ->join('__YINGYTD_VIEW_LOG__ l', 'l.uid = u.id', 'LEFT')
            ->join('__YINGYTD_BOOK__ b', 'b.id = l.book_id', 'LEFT')
            ->order('u.id DESC')
            ->limit(50)
            ->select();

        // 合并每日使用时长
        $usageMap = Db::name('user_usage')
            ->where('tenant_code', $tenantCode)
            ->where('date_key', date('Y-m-d'))
            ->column('remaining_minutes', 'uid');

        foreach ($users as &$user) {
            $user['remaining_minutes'] = isset($usageMap[$user['id']]) ? (int)$usageMap[$user['id']] : 0;
        }

        $plans = Db::name('product_plan')->order('sort ASC,id ASC')->select();
        $orders = Db::name('payment_order')
            ->alias('o')
            ->field('o.id,o.order_no,o.amount_cents,o.pay_status,o.paid_time,u.nickname,p.name as plan_name')
            ->join('__USER__ u', 'u.id = o.uid', 'LEFT')
            ->join('__PRODUCT_PLAN__ p', 'p.id = o.plan_id', 'LEFT')
            ->where('o.tenant_code', $tenantCode)
            ->order('o.id DESC')
            ->limit(20)
            ->select();

        $exchanges = Db::name('user_member')
            ->alias('m')
            ->field('m.id,m.uid,u.nickname,m.create_time as exchange_time')
            ->join('__USER__ u', 'u.id = m.uid', 'LEFT')
            ->where('m.tenant_code', $tenantCode)
            ->where('m.member_exchange_count', '>', 0)
            ->order('m.id DESC')
            ->limit(20)
            ->select();

        $rewards = Db::name('user_reward')
            ->alias('r')
            ->field('r.id,r.reward_type as type,r.reward_minutes as minutes,r.create_time,u.nickname')
            ->join('__USER__ u', 'u.id = r.uid', 'LEFT')
            ->where('r.tenant_code', $tenantCode)
            ->order('r.id DESC')
            ->limit(30)
            ->select();

        $settings = $this->getOperationConfig($tenantCode);

        $this->success('success', [
            'counters' => [
                'total_users' => (int)$totalUsers,
                'today_users' => (int)$todayUsers,
                'active_users' => (int)$activeUsers,
                'paid_users' => (int)$paidUsers,
                'revenue_cents' => (int)$revenueCents,
                'member_exchange_count' => (int)$memberExchangeCount,
                'invite_count' => (int)$inviteCount,
                'ad_watch_count' => (int)$adWatchCount,
                'granted_minutes' => (int)$grantedMinutes,
                'remaining_minutes' => (int)$remainingMinutes,
            ],
            'settings' => $settings,
            'users' => $users,
            'plans' => $plans,
            'orders' => $orders,
            'exchanges' => $exchanges,
            'rewards' => $rewards,
        ]);
    }

    // ==================== 运营配置 ====================

    private function getOperationConfig($tenantCode = 'default')
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

    public function saveOperationSettings()
    {
        $tenantCode = $this->getTenantCode();
        $data = $this->request->post();
        $keys = ['new_user_free_minutes', 'invite_reward_minutes', 'ad_reward_minutes', 'daily_limit_minutes'];
        foreach ($keys as $key) {
            if (isset($data[$key])) {
                Db::name('operation_config')
                    ->where('tenant_code', $tenantCode)
                    ->where('config_key', $key)
                    ->update(['config_value' => (string)(int)$data[$key], 'update_time' => time()]);
            }
        }
        return $this->dashboard();
    }

    // ==================== 用户资料接口（小程序端调用） ====================

    /**
     * 获取当前用户资料
     * 请求参数：uid, tenant_code
     */
    public function userProfile()
    {
        $uid = $this->request->get('uid', 0, 'intval');
        $tenantCode = $this->getTenantCode();
        if (!$uid) {
            $this->error('缺少用户ID');
        }

        $user = Db::name('user')->where('id', $uid)->find();
        if (!$user) {
            $this->error('用户不存在');
        }

        $member = Db::name('user_member')
            ->where('tenant_code', $tenantCode)
            ->where('uid', $uid)
            ->find();
        $todayUsage = Db::name('user_usage')
            ->where('tenant_code', $tenantCode)
            ->where('uid', $uid)
            ->where('date_key', date('Y-m-d'))
            ->find();
        $inviteCount = Db::name('user_invite')
            ->where('tenant_code', $tenantCode)
            ->where('inviter_uid', $uid)
            ->count();
        $settings = $this->getOperationConfig($tenantCode);

        $rewardMinutes = Db::name('user_reward')
            ->where('tenant_code', $tenantCode)
            ->where('uid', $uid)
            ->sum('reward_minutes');

        $totalMinutesToday = (int)($settings['new_user_free_minutes'] ?? 70) + (int)$rewardMinutes;
        $usedMinutesToday = $todayUsage ? (int)$todayUsage['used_minutes'] : 0;
        $remainingMinutes = $todayUsage ? (int)$todayUsage['remaining_minutes'] : max(0, $totalMinutesToday);

        $memberInfo = $member ?: [
            'uid' => $uid,
            'level' => 0,
            'expire_time' => 0,
            'invite_count' => 0,
            'ad_watch_count' => 0,
            'reward_minutes' => 0,
            'member_exchange_count' => 0,
        ];

        $this->success('success', [
            'user' => [
                'id' => (int)$user['id'],
                'nickname' => $user['nickname'] ?: $user['username'] ?: '',
                'avatar' => $user['avatar'] ?: '',
                'registered' => true,
            ],
            'member' => [
                'level' => (int)$memberInfo['level'],
                'expire_time' => (int)$memberInfo['expire_time'],
                'is_member' => ($memberInfo['expire_time'] ?? 0) > time(),
            ],
            'usage' => [
                'used_minutes_today' => $usedMinutesToday,
                'total_minutes_today' => $totalMinutesToday,
                'remaining_minutes' => max(0, $remainingMinutes),
            ],
            'growth' => [
                'invite_count' => (int)$inviteCount,
                'ad_watch_count' => (int)$memberInfo['ad_watch_count'],
                'member_exchange_count' => (int)$memberInfo['member_exchange_count'],
            ],
            'reward' => [
                'earned_minutes' => (int)$rewardMinutes,
                'invite_count' => (int)$inviteCount,
                'ad_watch_count' => (int)$memberInfo['ad_watch_count'],
                'member_exchange_count' => (int)$memberInfo['member_exchange_count'],
                'manual_reward_minutes' => (int)$rewardMinutes,
            ],
            'settings' => $settings,
        ]);
    }

    /**
     * 上报使用时长
     */
    public function reportUsage()
    {
        $uid = $this->request->post('uid', 0, 'intval');
        $usedMinutes = $this->request->post('used_minutes', 0, 'intval');
        $tenantCode = $this->getTenantCode();
        if (!$uid) {
            $this->error('缺少用户ID');
        }

        $dateKey = date('Y-m-d');
        $settings = $this->getOperationConfig($tenantCode);

        $rewardMinutes = Db::name('user_reward')
            ->where('tenant_code', $tenantCode)
            ->where('uid', $uid)
            ->sum('reward_minutes');
        $totalMinutesToday = (int)($settings['new_user_free_minutes'] ?? 70) + (int)$rewardMinutes;

        $existing = Db::name('user_usage')
            ->where('tenant_code', $tenantCode)
            ->where('uid', $uid)
            ->where('date_key', $dateKey)
            ->find();

        if ($existing) {
            $newUsed = min($existing['used_minutes'] + $usedMinutes, $totalMinutesToday);
            $newRemaining = max(0, $totalMinutesToday - $newUsed);
            Db::name('user_usage')
                ->where('uid', $uid)
                ->where('tenant_code', $tenantCode)
                ->where('date_key', $dateKey)
                ->update([
                    'used_minutes' => $newUsed,
                    'total_minutes' => $totalMinutesToday,
                    'remaining_minutes' => $newRemaining,
                    'update_time' => time(),
                ]);
        } else {
            $newRemaining = max(0, $totalMinutesToday - $usedMinutes);
            Db::name('user_usage')->insert([
                'tenant_code' => $tenantCode,
                'uid' => $uid,
                'date_key' => $dateKey,
                'used_minutes' => $usedMinutes,
                'total_minutes' => $totalMinutesToday,
                'remaining_minutes' => $newRemaining,
                'create_time' => time(),
                'update_time' => time(),
            ]);
        }

        $this->success('success');
    }

    // ==================== 邀请接口 ====================

    /**
     * 处理邀请关系
     */
    public function processInvite()
    {
        $inviterId = $this->request->post('inviter_id', '');
        $inviteeUid = $this->request->post('invitee_uid', 0, 'intval');
        $tenantCode = $this->getTenantCode();

        if (!$inviterId || !$inviteeUid) {
            $this->error('参数不完整');
        }

        $inviter = Db::name('user')->where('id', $inviterId)->find();
        if (!$inviter) {
            $this->error('邀请人不存在');
        }
        if ((int)$inviterId === (int)$inviteeUid) {
            $this->error('不能邀请自己');
        }

        $exists = Db::name('user_invite')
            ->where('tenant_code', $tenantCode)
            ->where('invitee_uid', $inviteeUid)
            ->find();
        if ($exists) {
            $this->success('已处理过邀请', ['already_invited' => true]);
            return;
        }

        Db::name('user_invite')->insert([
            'tenant_code' => $tenantCode,
            'inviter_uid' => (int)$inviterId,
            'invitee_uid' => (int)$inviteeUid,
            'status' => 1,
            'create_time' => time(),
        ]);

        $settings = $this->getOperationConfig($tenantCode);
        $rewardMinutes = (int)($settings['invite_reward_minutes'] ?? 20);

        Db::name('user_reward')->insert([
            'tenant_code' => $tenantCode,
            'uid' => (int)$inviterId,
            'reward_type' => 'invite',
            'reward_minutes' => $rewardMinutes,
            'related_uid' => (int)$inviteeUid,
            'remark' => '邀请好友奖励',
            'create_time' => time(),
        ]);

        Db::name('user_member')
            ->where('tenant_code', $tenantCode)
            ->where('uid', (int)$inviterId)
            ->update([
                'invite_count' => Db::raw('invite_count + 1'),
                'update_time' => time(),
            ]);

        $this->refreshDailyUsage((int)$inviterId, $tenantCode);

        $this->success('邀请处理成功', [
            'reward_minutes' => $rewardMinutes,
        ]);
    }

    // ==================== 广告接口 ====================

    /**
     * 获取广告配置
     */
    public function getAdConfig()
    {
        $tenantCode = $this->getTenantCode();
        $ad = Db::name('ad_config')
            ->where('tenant_code', $tenantCode)
            ->where('status', 1)
            ->order('id ASC')
            ->find();
        if (!$ad || empty($ad['ad_unit_id'])) {
            $this->success('success', [
                'ad_unit_id' => '',
                'ad_enabled' => false,
            ]);
            return;
        }
        $this->success('success', [
            'ad_unit_id' => $ad['ad_unit_id'],
            'ad_name' => $ad['ad_name'],
            'ad_enabled' => true,
        ]);
    }

    /**
     * 保存广告配置
     */
    public function saveAdConfig()
    {
        $tenantCode = $this->getTenantCode();
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

        $this->success('保存成功');
    }

    /**
     * 广告观看完成回调
     */
    public function adRewardCallback()
    {
        $uid = $this->request->post('uid', 0, 'intval');
        $tenantCode = $this->getTenantCode();
        if (!$uid) {
            $this->error('缺少用户ID');
        }

        $settings = $this->getOperationConfig($tenantCode);
        $rewardMinutes = (int)($settings['ad_reward_minutes'] ?? 10);

        Db::name('user_reward')->insert([
            'tenant_code' => $tenantCode,
            'uid' => $uid,
            'reward_type' => 'ad',
            'reward_minutes' => $rewardMinutes,
            'related_uid' => 0,
            'remark' => '观看广告奖励',
            'create_time' => time(),
        ]);

        $member = Db::name('user_member')
            ->where('tenant_code', $tenantCode)
            ->where('uid', $uid)
            ->find();
        if ($member) {
            Db::name('user_member')
                ->where('tenant_code', $tenantCode)
                ->where('uid', $uid)
                ->update([
                    'ad_watch_count' => Db::raw('ad_watch_count + 1'),
                    'update_time' => time(),
                ]);
        } else {
            Db::name('user_member')->insert([
                'tenant_code' => $tenantCode,
                'uid' => $uid,
                'level' => 0,
                'expire_time' => 0,
                'invite_count' => 0,
                'ad_watch_count' => 1,
                'reward_minutes' => $rewardMinutes,
                'member_exchange_count' => 0,
                'create_time' => time(),
                'update_time' => time(),
            ]);
        }

        $this->refreshDailyUsage($uid, $tenantCode);

        $this->success('奖励发放成功', [
            'reward_minutes' => $rewardMinutes,
        ]);
    }

    // ==================== 支付配置接口 ====================

    /**
     * 获取支付配置
     */
    public function getPayConfig()
    {
        $tenantCode = $this->getTenantCode();
        $config = Db::name('pay_config')
            ->where('tenant_code', $tenantCode)
            ->order('id ASC')
            ->find();
        if (!$config) {
            $this->success('success', [
                'pay_enabled' => false,
            ]);
            return;
        }
        $plans = Db::name('product_plan')->where('status', 1)->order('sort ASC,id ASC')->select();
        $this->success('success', [
            'pay_enabled' => (bool)$config['pay_enabled'],
            'plans' => $plans ?: [],
        ]);
    }

    /**
     * 保存支付配置
     */
    public function savePayConfig()
    {
        $tenantCode = $this->getTenantCode();
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
            if ($mchKey) $updateData['mch_key'] = $mchKey;
            if ($appId) $updateData['app_id'] = $appId;
            if ($appSecret) $updateData['app_secret'] = $appSecret;
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

        $this->success('保存成功');
    }

    /**
     * 创建微信支付订单
     */
    public function createPayOrder()
    {
        $uid = $this->request->post('uid', 0, 'intval');
        $planId = $this->request->post('plan_id', 0, 'intval');
        $tenantCode = $this->getTenantCode();

        if (!$uid || !$planId) {
            $this->error('参数不完整');
        }

        $payConfig = Db::name('pay_config')
            ->where('tenant_code', $tenantCode)
            ->order('id ASC')
            ->find();
        if (!$payConfig || !$payConfig['pay_enabled']) {
            $this->error('支付功能暂未开放');
        }

        $plan = Db::name('product_plan')->where('id', $planId)->where('status', 1)->find();
        if (!$plan) {
            $this->error('套餐不存在或已下架');
        }

        $orderNo = 'DD' . date('YmdHis') . rand(1000, 9999);
        $amountCents = (int)$plan['price_cents'];

        Db::name('payment_order')->insert([
            'tenant_code' => $tenantCode,
            'order_no' => $orderNo,
            'uid' => $uid,
            'plan_id' => $planId,
            'amount_cents' => $amountCents,
            'pay_status' => 'pending',
            'pay_channel' => 'wechat',
            'create_time' => time(),
            'update_time' => time(),
        ]);

        $this->success('订单创建成功', [
            'order_no' => $orderNo,
            'amount_cents' => $amountCents,
            'plan_name' => $plan['name'],
            'plan_days' => (int)$plan['duration_days'],
        ]);
    }

    /**
     * 支付成功回调
     */
    public function payCallback()
    {
        $orderNo = $this->request->post('order_no', '');
        $uid = $this->request->post('uid', 0, 'intval');
        $tenantCode = $this->getTenantCode();

        if (!$orderNo || !$uid) {
            $this->error('参数不完整');
        }

        $order = Db::name('payment_order')
            ->where('tenant_code', $tenantCode)
            ->where('order_no', $orderNo)
            ->where('uid', $uid)
            ->find();
        if (!$order) {
            $this->error('订单不存在');
        }
        if ($order['pay_status'] === 'paid') {
            $this->success('订单已处理');
            return;
        }

        $plan = Db::name('product_plan')->where('id', $order['plan_id'])->find();
        $durationDays = $plan ? (int)$plan['duration_days'] : 30;

        Db::name('payment_order')->where('id', $order['id'])->update([
            'pay_status' => 'paid',
            'paid_time' => time(),
            'update_time' => time(),
        ]);

        $member = Db::name('user_member')
            ->where('tenant_code', $tenantCode)
            ->where('uid', $uid)
            ->find();
        $newExpireTime = time() + $durationDays * 86400;

        if ($member) {
            $currentExpire = max((int)$member['expire_time'], time());
            $newExpireTime = $currentExpire + $durationDays * 86400;
            Db::name('user_member')
                ->where('tenant_code', $tenantCode)
                ->where('uid', $uid)
                ->update([
                    'level' => 1,
                    'expire_time' => $newExpireTime,
                    'member_exchange_count' => Db::raw('member_exchange_count + 1'),
                    'update_time' => time(),
                ]);
        } else {
            Db::name('user_member')->insert([
                'tenant_code' => $tenantCode,
                'uid' => $uid,
                'level' => 1,
                'expire_time' => $newExpireTime,
                'source' => 'wechat_pay',
                'member_exchange_count' => 1,
                'create_time' => time(),
                'update_time' => time(),
            ]);
        }

        $this->success('支付处理成功');
    }

    /**
     * 兑换码开通会员
     */
    public function redeemMemberCode()
    {
        $uid = $this->request->post('uid', 0, 'intval');
        $code = strtoupper(trim($this->request->post('code', '')));
        $tenantCode = $this->getTenantCode();

        if (!$uid || !$code) {
            $this->error('请输入兑换码');
        }

        $redeem = Db::name('member_redeem_code')
            ->where('tenant_code', $tenantCode)
            ->where('code', $code)
            ->find();
        if (!$redeem) {
            $this->error('兑换码不存在');
        }
        if ((int)$redeem['used'] === 1) {
            $this->error('兑换码已被使用');
        }

        $plan = Db::name('product_plan')
            ->where('id', $redeem['plan_id'])
            ->where('status', 1)
            ->find();
        if (!$plan) {
            $this->error('兑换码对应套餐已下架');
        }

        $now = time();
        $durationDays = max(1, (int)$plan['duration_days']);

        Db::startTrans();
        try {
            $affected = Db::name('member_redeem_code')
                ->where('id', $redeem['id'])
                ->where('used', 0)
                ->update([
                    'used' => 1,
                    'used_uid' => $uid,
                    'used_time' => $now,
                    'update_time' => $now,
                ]);
            if (!$affected) {
                Db::rollback();
                $this->error('兑换码已被使用');
            }

            $member = Db::name('user_member')
                ->where('tenant_code', $tenantCode)
                ->where('uid', $uid)
                ->find();
            $baseExpire = $member ? max((int)$member['expire_time'], $now) : $now;
            $newExpireTime = $baseExpire + $durationDays * 86400;

            if ($member) {
                Db::name('user_member')
                    ->where('tenant_code', $tenantCode)
                    ->where('uid', $uid)
                    ->update([
                        'level' => 1,
                        'expire_time' => $newExpireTime,
                        'source' => 'redeem_code',
                        'member_exchange_count' => Db::raw('member_exchange_count + 1'),
                        'update_time' => $now,
                    ]);
            } else {
                Db::name('user_member')->insert([
                    'tenant_code' => $tenantCode,
                    'uid' => $uid,
                    'level' => 1,
                    'expire_time' => $newExpireTime,
                    'source' => 'redeem_code',
                    'member_exchange_count' => 1,
                    'create_time' => $now,
                    'update_time' => $now,
                ]);
            }

            Db::commit();
        } catch (\Exception $e) {
            Db::rollback();
            $this->error('兑换失败，请稍后重试');
        }

        $this->success('兑换成功', [
            'plan_name' => $plan['name'],
            'duration_days' => $durationDays,
            'expire_time' => $newExpireTime,
        ]);
    }

    // ==================== 辅助方法 ====================

    private function refreshDailyUsage($uid, $tenantCode = 'default')
    {
        $dateKey = date('Y-m-d');
        $settings = $this->getOperationConfig($tenantCode);
        $rewardMinutes = Db::name('user_reward')
            ->where('tenant_code', $tenantCode)
            ->where('uid', $uid)
            ->sum('reward_minutes');
        $totalMinutesToday = (int)($settings['new_user_free_minutes'] ?? 70) + (int)$rewardMinutes;

        $existing = Db::name('user_usage')
            ->where('tenant_code', $tenantCode)
            ->where('uid', $uid)
            ->where('date_key', $dateKey)
            ->find();
        if ($existing) {
            $newRemaining = max(0, $totalMinutesToday - (int)$existing['used_minutes']);
            Db::name('user_usage')
                ->where('uid', $uid)
                ->where('tenant_code', $tenantCode)
                ->where('date_key', $dateKey)
                ->update([
                    'total_minutes' => $totalMinutesToday,
                    'remaining_minutes' => $newRemaining,
                    'update_time' => time(),
                ]);
        }
    }
}
