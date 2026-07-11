-- 点读后台 V2 扩展：用户资料、邀请记录、广告配置、支付配置
-- 在 admin_mvp.sql 基础上新增以下表，如果已存在请跳过

-- 用户每日使用时长记录
CREATE TABLE IF NOT EXISTS `cl_user_usage` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uid` int unsigned NOT NULL DEFAULT 0,
  `date_key` varchar(10) NOT NULL COMMENT '日期 2026-07-10',
  `used_minutes` int unsigned NOT NULL DEFAULT 0 COMMENT '当天已用分钟',
  `total_minutes` int unsigned NOT NULL DEFAULT 0 COMMENT '当天总可用分钟',
  `remaining_minutes` int unsigned NOT NULL DEFAULT 0 COMMENT '当天剩余分钟',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_uid_date` (`uid`, `date_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户每日使用时长';

-- 用户奖励明细（邀请奖励、广告奖励、后台发放）
CREATE TABLE IF NOT EXISTS `cl_user_reward` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uid` int unsigned NOT NULL DEFAULT 0,
  `reward_type` varchar(30) NOT NULL DEFAULT '' COMMENT 'invite/ad/manual/register',
  `reward_minutes` int unsigned NOT NULL DEFAULT 0,
  `related_uid` int unsigned NOT NULL DEFAULT 0 COMMENT '关联用户（邀请场景为邀请人uid）',
  `remark` varchar(200) NOT NULL DEFAULT '',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_uid` (`uid`),
  KEY `idx_type` (`reward_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户奖励明细';

-- 邀请关系记录
CREATE TABLE IF NOT EXISTS `cl_user_invite` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `inviter_uid` int unsigned NOT NULL DEFAULT 0 COMMENT '邀请人',
  `invitee_uid` int unsigned NOT NULL DEFAULT 0 COMMENT '被邀请人',
  `status` tinyint unsigned NOT NULL DEFAULT 1 COMMENT '1有效 0无效',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_invitee` (`invitee_uid`),
  KEY `idx_inviter` (`inviter_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户邀请关系';

-- 广告配置表
CREATE TABLE IF NOT EXISTS `cl_ad_config` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ad_unit_id` varchar(100) NOT NULL DEFAULT '' COMMENT '微信激励视频广告单元ID',
  `ad_name` varchar(50) NOT NULL DEFAULT '' COMMENT '广告名称',
  `status` tinyint unsigned NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='广告配置';

-- 微信支付配置表
CREATE TABLE IF NOT EXISTS `cl_pay_config` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `mch_id` varchar(32) NOT NULL DEFAULT '' COMMENT '微信支付商户号',
  `mch_key` varchar(128) NOT NULL DEFAULT '' COMMENT 'API密钥',
  `app_id` varchar(32) NOT NULL DEFAULT '' COMMENT '小程序AppID',
  `app_secret` varchar(64) NOT NULL DEFAULT '' COMMENT '小程序AppSecret',
  `notify_url` varchar(255) NOT NULL DEFAULT '' COMMENT '支付回调地址',
  `pay_enabled` tinyint unsigned NOT NULL DEFAULT 0 COMMENT '0关闭支付 1开启支付',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信支付配置';

-- 会员兑换码
CREATE TABLE IF NOT EXISTS `cl_member_redeem_code` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_code` varchar(50) NOT NULL DEFAULT 'default' COMMENT '租户标识',
  `code` varchar(32) NOT NULL DEFAULT '' COMMENT '兑换码',
  `plan_id` int unsigned NOT NULL DEFAULT 0 COMMENT '对应会员套餐',
  `used` tinyint unsigned NOT NULL DEFAULT 0 COMMENT '0未使用 1已使用',
  `used_uid` int unsigned NOT NULL DEFAULT 0 COMMENT '使用用户',
  `used_time` int unsigned NOT NULL DEFAULT 0 COMMENT '使用时间',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_code` (`code`),
  KEY `idx_tenant_used` (`tenant_code`, `used`),
  KEY `idx_plan` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员兑换码';

-- 运营设置表（全局配置）
CREATE TABLE IF NOT EXISTS `cl_operation_config` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `config_key` varchar(50) NOT NULL DEFAULT '',
  `config_value` varchar(255) NOT NULL DEFAULT '',
  `remark` varchar(100) NOT NULL DEFAULT '',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运营配置';

-- 初始化默认运营设置
INSERT INTO `cl_operation_config` (`config_key`, `config_value`, `remark`, `create_time`, `update_time`)
VALUES
('new_user_free_minutes', '70', '新用户免费时长（分钟）', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
('invite_reward_minutes', '20', '邀请好友奖励时长（分钟）', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
('ad_reward_minutes', '10', '观看广告奖励时长（分钟）', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
('daily_limit_minutes', '70', '每日使用上限（分钟）', UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE `update_time` = UNIX_TIMESTAMP();

-- 初始化默认广告配置（留空，后台填写）
INSERT INTO `cl_ad_config` (`ad_unit_id`, `ad_name`, `status`, `create_time`, `update_time`)
VALUES ('', '激励视频广告', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE `update_time` = UNIX_TIMESTAMP();

-- 初始化默认支付配置（留空，后台填写）
INSERT INTO `cl_pay_config` (`mch_id`, `mch_key`, `app_id`, `app_secret`, `notify_url`, `pay_enabled`, `create_time`, `update_time`)
VALUES ('', '', '', '', '', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE `update_time` = UNIX_TIMESTAMP();

-- 为已有的 cl_user_member 表扩展字段（如不存在则添加）
ALTER TABLE `cl_user_member`
ADD COLUMN IF NOT EXISTS `invite_count` int unsigned NOT NULL DEFAULT 0 COMMENT '邀请人数',
ADD COLUMN IF NOT EXISTS `ad_watch_count` int unsigned NOT NULL DEFAULT 0 COMMENT '广告观看次数',
ADD COLUMN IF NOT EXISTS `reward_minutes` int unsigned NOT NULL DEFAULT 0 COMMENT '累计奖励分钟',
ADD COLUMN IF NOT EXISTS `member_exchange_count` int unsigned NOT NULL DEFAULT 0 COMMENT '会员兑换次数';
