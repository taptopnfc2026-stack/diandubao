<?php

namespace app\api\controller;

use app\common\controller\Api;
use think\Db;

class AdminDashboard extends Api
{
    protected $noNeedLogin = [];
    protected $noNeedRight = [];

    public function dashboard()
    {
        $todayStart = strtotime(date('Y-m-d'));
        $now = time();

        $totalUsers = Db::name('user')->count();
        $todayUsers = Db::name('user')->where('createtime', '>=', $todayStart)->count();
        $activeUsers = Db::name('study_event')->where('create_time', '>=', $todayStart - 6 * 86400)->group('uid')->count();
        $paidUsers = Db::name('user_member')->where('expire_time', '>', $now)->count();
        $revenueCents = Db::name('payment_order')->where('pay_status', 'paid')->sum('amount_cents');

        $users = Db::name('user')
            ->alias('u')
            ->field('u.id,u.nickname,u.username,u.mobile,u.avatar,u.createtime as create_time,u.logintime as last_login_time,m.expire_time as member_expire_time,b.book_name,l.cur_page')
            ->join('__USER_MEMBER__ m', 'm.uid = u.id', 'LEFT')
            ->join('__YINGYTD_VIEW_LOG__ l', 'l.uid = u.id', 'LEFT')
            ->join('__YINGYTD_BOOK__ b', 'b.id = l.book_id', 'LEFT')
            ->order('u.id DESC')
            ->limit(20)
            ->select();

        $plans = Db::name('product_plan')->order('sort ASC,id ASC')->select();
        $orders = Db::name('payment_order')
            ->alias('o')
            ->field('o.id,o.order_no,o.amount_cents,o.pay_status,o.paid_time,u.nickname,p.name as plan_name')
            ->join('__USER__ u', 'u.id = o.uid', 'LEFT')
            ->join('__PRODUCT_PLAN__ p', 'p.id = o.plan_id', 'LEFT')
            ->order('o.id DESC')
            ->limit(10)
            ->select();

        $this->success('success', [
            'counters' => [
                'total_users' => (int) $totalUsers,
                'today_users' => (int) $todayUsers,
                'active_users' => (int) $activeUsers,
                'paid_users' => (int) $paidUsers,
                'revenue_cents' => (int) $revenueCents,
            ],
            'users' => $users,
            'plans' => $plans,
            'orders' => $orders,
        ]);
    }
}
