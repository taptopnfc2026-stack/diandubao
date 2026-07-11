# 点读宝 SaaS 多租户平台 - API 文档

## 架构概览

```
┌─────────────────────────────────────────────────────┐
│                    SaaS 平台                          │
│  ┌───────────────────────────────────────────────┐  │
│  │         超级管理员后台 (saas.html)              │  │
│  │    • 平台总览看板                               │  │
│  │    • 租户 CRUD 管理                             │  │
│  │    • 操作日志                                   │  │
│  └──────────────┬────────────────────────────────┘  │
│                 │                                     │
│  ┌──────────────▼────────────────────────────────┐  │
│  │        租户 A 后台 (tenant.html)                │  │
│  │    • 小程序配置 (AppID/Secret)                  │  │
│  │    • 数据看板（仅自己数据）                     │  │
│  │    • 运营设置 / 广告 / 支付配置                 │  │
│  └──────────────┬────────────────────────────────┘  │
│                 │                                     │
│  ┌──────────────▼────────────────────────────────┐  │
│  │     小程序 A (tenant_code = "tA")              │  │
│  │    调用 /api/admin_dashboard/*                  │  │
│  │    自动携带 X-Tenant-Code: tA                  │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────▼────────────────────────────────┐  │
│  │        租户 B 后台 (tenant.html)                │  │
│  │    ... 同上，但 tenant_code = "tB"             │  │
│  └──────────────┬────────────────────────────────┘  │
│                 │                                     │
│  ┌──────────────▼────────────────────────────────┐  │
│  │     小程序 B (tenant_code = "tB")              │  │
│  │    所有数据自动隔离                              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 数据隔离原理

所有业务表增加了 `tenant_code` 字段。每次请求自动携带租户标识：
- **小程序端**：`app.globalData.tenantCode` → 请求时自动注入
- **后台端**：登录后 token 中绑定 tenant_code
- **API 层**：从 GET/POST/Header 中获取 `tenant_code`，所有查询自动过滤

---

## 一、超级管理员接口 (SaasAdmin)

**基础路径**: `/api/saas_admin`

### 1.1 登录

```
POST /api/saas_admin/login
Body: { "username": "admin", "password": "admin123" }
Response: { "token": "...", "admin": { "id": 1, "username": "admin", ... } }
```

### 1.2 平台总览

```
GET /api/saas_admin/platformOverview
Header: Authorization: Bearer <token>
Response: {
  total_tenants, active_tenants, disabled_tenants,
  total_users, total_revenue_cents,
  today_new_tenants, today_new_users,
  recent_tenants: [...]
}
```

### 1.3 租户列表

```
GET /api/saas_admin/tenantList?page=1&keyword=&status=
Response: { list: [...], total, page, page_size }
```

### 1.4 租户详情

```
GET /api/saas_admin/tenantDetail?id=1
Response: { tenant_name, tenant_code, miniapp_appid, user_count, ... }
```

### 1.5 创建租户

```
POST /api/saas_admin/createTenant
Body: {
  tenant_name: "XX英语培训",
  tenant_code: "xxenglish",     // 留空自动生成
  contact_name, contact_mobile, contact_email,
  admin_username: "admin",      // 租户管理员账号
  admin_password: "123456",     // 租户管理员密码
  expire_time: 0,               // 0=永久
  max_users: 0,                 // 0=不限
  remark: ""
}
Response: { tenant_id, tenant_code, admin_username }
```

### 1.6 禁用/启用租户

```
POST /api/saas_admin/disableTenant  { id: 1 }
POST /api/saas_admin/enableTenant   { id: 1 }
```

### 1.7 操作日志

```
GET /api/saas_admin/operationLogs?page=1&tenant_code=
```

---

## 二、租户管理员接口 (TenantAdmin)

**基础路径**: `/api/tenant_admin`

### 2.1 登录

```
POST /api/tenant_admin/login
Body: { "tenant_code": "xxenglish", "username": "admin", "password": "123456" }
Response: { "token": "...", "tenant": {...}, "admin": {...} }
```

### 2.2 获取租户信息

```
GET /api/tenant_admin/profile
Response: { tenant: {...}, admin: {...} }
```

### 2.3 保存小程序配置

```
POST /api/tenant_admin/saveMiniappConfig
Body: { "miniapp_appid": "wx...", "miniapp_secret": "..." }
```

### 2.4 数据看板（租户隔离）

```
GET /api/tenant_admin/dashboard
Response: { counters: {...}, settings: {...}, users: [...], plans: [...], ... }
```

### 2.5 运营设置

```
POST /api/tenant_admin/saveSettings
Body: { new_user_free_minutes, invite_reward_minutes, ad_reward_minutes }
```

### 2.6 广告配置

```
GET  /api/tenant_admin/getAdConfig
POST /api/tenant_admin/saveAdConfig  { ad_unit_id, ad_name, status }
```

### 2.7 支付配置

```
GET  /api/tenant_admin/getPayConfig
POST /api/tenant_admin/savePayConfig  { mch_id, mch_key, app_id, app_secret, notify_url, pay_enabled }
```

---

## 三、小程序端接口（AdminDashboard，支持租户隔离）

所有接口额外支持 `tenant_code` 参数或 `X-Tenant-Code` Header

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin_dashboard/userProfile?uid=&tenant_code=` | 用户资料 |
| POST | `/api/admin_dashboard/reportUsage` | 上报使用时长 |
| POST | `/api/admin_dashboard/processInvite` | 处理邀请 |
| GET | `/api/admin_dashboard/getAdConfig?tenant_code=` | 广告配置 |
| POST | `/api/admin_dashboard/adRewardCallback` | 广告奖励回调 |
| GET | `/api/admin_dashboard/getPayConfig?tenant_code=` | 支付配置 |
| POST | `/api/admin_dashboard/createPayOrder` | 创建支付订单 |
| POST | `/api/admin_dashboard/payCallback` | 支付回调 |

---

## 四、部署步骤

### 4.1 数据库
```sql
-- 1. 先执行基础表（如已执行跳过）
source server/sql/admin_mvp.sql;
source server/sql/admin_mvp_v2.sql;

-- 2. 执行 SaaS 平台表
source server/sql/saas_platform.sql;
```

### 4.2 部署 PHP 控制器
将以下文件部署到 ThinkPHP `application/api/controller/` 目录：
- `AdminDashboard.php`（已更新，支持租户隔离）
- `SaasAdmin.php`（新增，超级管理员）
- `TenantAdmin.php`（新增，租户管理员）

### 4.3 部署前端
```bash
npm run build:h5
# 将 dist/ 部署到服务器静态目录
```

### 4.4 访问地址
| 页面 | 地址 | 用途 |
|------|------|------|
| SaaS 超级管理员 | `/saas.html` | 你管理所有租户 |
| 租户管理后台 | `/tenant.html` | 客户管理自己的小程序 |
| 原后台管理 | `/admin.html` | 兼容旧版 |

### 4.5 开通租户流程
1. 超级管理员登录 `/saas.html`
2. 点击「开通新租户」，填写客户信息
3. 系统自动生成租户标识和管理员账号
4. 将租户标识和管理员账号/密码告知客户
5. 客户登录 `/tenant.html`，填写小程序 AppID/Secret
6. 客户在小程序代码中将 `tenantCode` 替换为自己的租户标识
7. 客户部署小程序并提交审核
