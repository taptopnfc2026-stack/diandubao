# 点读后台 MVP 接口

## H5 后台入口

- 本地开发：`http://127.0.0.1:5173/admin.html`
- 静态部署后：`/admin.html`

## 后端接口

### `GET /api/admin_dashboard/dashboard`

返回后台看板所需数据。

响应结构：

```json
{
  "code": 1,
  "msg": "success",
  "data": {
    "counters": {
      "total_users": 1286,
      "today_users": 37,
      "active_users": 418,
      "paid_users": 96,
      "revenue_cents": 268800
    },
    "users": [],
    "plans": [],
    "orders": []
  }
}
```

## 部署步骤

1. 在 MySQL 中执行 `server/sql/admin_mvp.sql`。
2. 把 `server/thinkphp/application/api/controller/AdminDashboard.php` 放到服务器项目的 `application/api/controller/AdminDashboard.php`。
3. 确认接口地址能访问：`https://你的域名/api/admin_dashboard/dashboard`。
4. 后台前端的 `src/admin/adminApi.js` 默认请求 `/api/admin_dashboard/dashboard`。

## 支付预留

`cl_product_plan` 和 `cl_payment_order` 已预留微信支付需要的核心字段：

- `order_no`
- `amount_cents`
- `pay_status`
- `pay_channel`
- `transaction_id`
- `paid_time`

下一步接微信支付时，需要增加“创建订单”和“支付回调”两个接口。

## 同步背单词接口预留

SQL 草稿：`server/sql/vocabulary_mvp.sql`。

- `GET /api/vocabulary/units?book_id=10168`
- `GET /api/vocabulary/words?unit_id=1`
- `GET /api/vocabulary/progress?book_id=10168`
- `GET /api/vocabulary/save-progress`

当前 H5 和小程序在接口不可用时会使用预览数据，便于先验证学习流程。
