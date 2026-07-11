-- ============================================================
-- 点读宝 SaaS 多租户平台 - 数据库初始化脚本
-- ============================================================
-- 架构说明：
--   1. saas_tenant        - 租户表（每个客户一条记录）
--   2. saas_admin_account - SaaS平台超级管理员（你用的）
--   3. saas_tenant_admin  - 租户管理员（客户登录后台用的）
--   4. 每个租户有独立的 tenant_code，所有业务数据表都加 tenant_code 字段隔离
-- ============================================================

-- 租户表
CREATE TABLE IF NOT EXISTS `cl_saas_tenant` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tenant_code` varchar(50) NOT NULL COMMENT '租户唯一标识（用于数据隔离）',
  `tenant_name` varchar(100) NOT NULL COMMENT '客户名称/公司名',
  `contact_name` varchar(50) NOT NULL DEFAULT '' COMMENT '联系人',
  `contact_mobile` varchar(20) NOT NULL DEFAULT '' COMMENT '联系电话',
  `contact_email` varchar(100) NOT NULL DEFAULT '' COMMENT '联系邮箱',
  `miniapp_appid` varchar(50) NOT NULL DEFAULT '' COMMENT '小程序AppID',
  `miniapp_secret` varchar(100) NOT NULL DEFAULT '' COMMENT '小程序AppSecret',
  `status` tinyint unsigned NOT NULL DEFAULT 1 COMMENT '0禁用 1启用 2待审核',
  `expire_time` int unsigned NOT NULL DEFAULT 0 COMMENT '租户到期时间（0=永久）',
  `max_users` int unsigned NOT NULL DEFAULT 0 COMMENT '最大用户数限制（0=不限）',
  `remark` varchar(500) NOT NULL DEFAULT '' COMMENT '备注',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_tenant_code` (`tenant_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='SaaS租户';

-- SaaS 超级管理员账号（平台方使用）
CREATE TABLE IF NOT EXISTS `cl_saas_admin` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL COMMENT 'password_hash = sha256(password + salt)',
  `salt` varchar(32) NOT NULL DEFAULT '',
  `nickname` varchar(50) NOT NULL DEFAULT '',
  `role` varchar(20) NOT NULL DEFAULT 'super_admin' COMMENT 'super_admin',
  `status` tinyint unsigned NOT NULL DEFAULT 1,
  `last_login_time` int unsigned NOT NULL DEFAULT 0,
  `last_login_ip` varchar(50) NOT NULL DEFAULT '',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='SaaS超级管理员';

-- 租户管理员账号（客户登录后台使用）
CREATE TABLE IF NOT EXISTS `cl_saas_tenant_admin` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` int unsigned NOT NULL COMMENT '所属租户ID',
  `tenant_code` varchar(50) NOT NULL COMMENT '所属租户标识',
  `username` varchar(50) NOT NULL COMMENT '登录账号',
  `password_hash` varchar(255) NOT NULL COMMENT 'password_hash = sha256(password + salt)',
  `salt` varchar(32) NOT NULL DEFAULT '',
  `nickname` varchar(50) NOT NULL DEFAULT '' COMMENT '显示名称',
  `role` varchar(20) NOT NULL DEFAULT 'tenant_admin' COMMENT 'tenant_admin',
  `status` tinyint unsigned NOT NULL DEFAULT 1 COMMENT '0禁用 1启用',
  `last_login_time` int unsigned NOT NULL DEFAULT 0,
  `last_login_ip` varchar(50) NOT NULL DEFAULT '',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_tenant_username` (`tenant_code`, `username`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租户管理员账号';

-- 租户操作日志
CREATE TABLE IF NOT EXISTS `cl_saas_operation_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_code` varchar(50) NOT NULL DEFAULT '',
  `admin_id` int unsigned NOT NULL DEFAULT 0 COMMENT '操作管理员ID',
  `admin_type` varchar(20) NOT NULL DEFAULT '' COMMENT 'super_admin/tenant_admin',
  `action` varchar(50) NOT NULL DEFAULT '' COMMENT '操作类型',
  `target` varchar(200) NOT NULL DEFAULT '' COMMENT '操作对象',
  `detail` text COMMENT '操作详情JSON',
  `ip` varchar(50) NOT NULL DEFAULT '',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_code` (`tenant_code`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='SaaS操作日志';

-- ============================================================
-- 初始化默认超级管理员
-- 默认账号：admin  默认密码：admin123
-- 部署后请立即修改密码！
-- ============================================================
INSERT INTO `cl_saas_admin` (`username`, `password_hash`, `salt`, `nickname`, `role`, `status`, `create_time`, `update_time`)
VALUES (
  'admin',
  SHA2(CONCAT('admin123', 'saas_salt_2026'), 256),
  'saas_salt_2026',
  '超级管理员',
  'super_admin',
  1,
  UNIX_TIMESTAMP(),
  UNIX_TIMESTAMP()
) ON DUPLICATE KEY UPDATE `update_time` = UNIX_TIMESTAMP();

-- ============================================================
-- 为现有业务表增加 tenant_code 字段（数据隔离）
-- 执行前请确认表已存在
-- ============================================================

-- 运营配置表：增加租户隔离
ALTER TABLE `cl_operation_config`
ADD COLUMN IF NOT EXISTS `tenant_code` varchar(50) NOT NULL DEFAULT 'default' COMMENT '租户标识';

-- 广告配置表：增加租户隔离
ALTER TABLE `cl_ad_config`
ADD COLUMN IF NOT EXISTS `tenant_code` varchar(50) NOT NULL DEFAULT 'default' COMMENT '租户标识';

-- 支付配置表：增加租户隔离
ALTER TABLE `cl_pay_config`
ADD COLUMN IF NOT EXISTS `tenant_code` varchar(50) NOT NULL DEFAULT 'default' COMMENT '租户标识';

-- 用户会员表：增加租户隔离
ALTER TABLE `cl_user_member`
ADD COLUMN IF NOT EXISTS `tenant_code` varchar(50) NOT NULL DEFAULT 'default' COMMENT '租户标识';

-- 用户使用时长表：增加租户隔离
ALTER TABLE `cl_user_usage`
ADD COLUMN IF NOT EXISTS `tenant_code` varchar(50) NOT NULL DEFAULT 'default' COMMENT '租户标识';

-- 用户奖励表：增加租户隔离
ALTER TABLE `cl_user_reward`
ADD COLUMN IF NOT EXISTS `tenant_code` varchar(50) NOT NULL DEFAULT 'default' COMMENT '租户标识';

-- 用户邀请表：增加租户隔离
ALTER TABLE `cl_user_invite`
ADD COLUMN IF NOT EXISTS `tenant_code` varchar(50) NOT NULL DEFAULT 'default' COMMENT '租户标识';

-- 支付订单表：增加租户隔离
ALTER TABLE `cl_payment_order`
ADD COLUMN IF NOT EXISTS `tenant_code` varchar(50) NOT NULL DEFAULT 'default' COMMENT '租户标识';

-- 学习事件表：增加租户隔离
ALTER TABLE `cl_study_event`
ADD COLUMN IF NOT EXISTS `tenant_code` varchar(50) NOT NULL DEFAULT 'default' COMMENT '租户标识';

-- ============================================================
-- 更新唯一索引（tenant_code + 原唯一键），确保租户间数据不冲突
-- 注意：MySQL 5.7 不支持 ADD COLUMN IF NOT EXISTS，请手动检查
-- ============================================================

-- 为运营配置表添加租户索引
-- ALTER TABLE `cl_operation_config` DROP INDEX `uniq_key`;
-- ALTER TABLE `cl_operation_config` ADD UNIQUE KEY `uniq_tenant_key` (`tenant_code`, `config_key`);

-- 为广告配置表添加租户索引
-- ALTER TABLE `cl_ad_config` ADD KEY `idx_tenant_code` (`tenant_code`);

-- 为支付配置表添加租户索引
-- ALTER TABLE `cl_pay_config` ADD KEY `idx_tenant_code` (`tenant_code`);
