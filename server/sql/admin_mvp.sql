-- 点读后台 MVP：统计用户、会员套餐、订单与学习行为。
-- 默认表前缀按现有环境使用 cl_，如果你的 .env prefix 不同，部署前替换表名前缀。

CREATE TABLE IF NOT EXISTS `cl_admin_account` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` tinyint unsigned NOT NULL DEFAULT 1,
  `last_login_time` int unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台管理员';

CREATE TABLE IF NOT EXISTS `cl_user_member` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uid` int unsigned NOT NULL,
  `level` tinyint unsigned NOT NULL DEFAULT 0 COMMENT '0免费 1会员',
  `expire_time` int unsigned NOT NULL DEFAULT 0,
  `source` varchar(30) NOT NULL DEFAULT '',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_uid` (`uid`),
  KEY `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户会员状态';

CREATE TABLE IF NOT EXISTS `cl_product_plan` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `price_cents` int unsigned NOT NULL DEFAULT 0,
  `duration_days` int unsigned NOT NULL DEFAULT 0,
  `status` tinyint unsigned NOT NULL DEFAULT 1,
  `sort` int unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会员套餐';

CREATE TABLE IF NOT EXISTS `cl_payment_order` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_no` varchar(64) NOT NULL,
  `uid` int unsigned NOT NULL DEFAULT 0,
  `plan_id` int unsigned NOT NULL DEFAULT 0,
  `amount_cents` int unsigned NOT NULL DEFAULT 0,
  `pay_status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending/paid/closed/refund',
  `pay_channel` varchar(30) NOT NULL DEFAULT 'wechat',
  `transaction_id` varchar(80) NOT NULL DEFAULT '',
  `paid_time` int unsigned NOT NULL DEFAULT 0,
  `create_time` int unsigned NOT NULL DEFAULT 0,
  `update_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_order_no` (`order_no`),
  KEY `idx_uid` (`uid`),
  KEY `idx_status_time` (`pay_status`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付订单';

CREATE TABLE IF NOT EXISTS `cl_study_event` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uid` int unsigned NOT NULL DEFAULT 0,
  `event_type` varchar(40) NOT NULL COMMENT 'read_page/tap_audio/phonetic/alphabet/phonics',
  `book_id` int unsigned NOT NULL DEFAULT 0,
  `page_no` int unsigned NOT NULL DEFAULT 0,
  `target_id` varchar(80) NOT NULL DEFAULT '',
  `create_time` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_uid_time` (`uid`, `create_time`),
  KEY `idx_type_time` (`event_type`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习行为日志';

INSERT INTO `cl_product_plan` (`name`, `price_cents`, `duration_days`, `status`, `sort`, `create_time`, `update_time`)
SELECT '月卡', 1900, 30, 1, 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM `cl_product_plan` WHERE `name` = '月卡');

INSERT INTO `cl_product_plan` (`name`, `price_cents`, `duration_days`, `status`, `sort`, `create_time`, `update_time`)
SELECT '季卡', 4900, 90, 1, 20, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM `cl_product_plan` WHERE `name` = '季卡');

INSERT INTO `cl_product_plan` (`name`, `price_cents`, `duration_days`, `status`, `sort`, `create_time`, `update_time`)
SELECT '年卡', 12800, 365, 1, 30, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM `cl_product_plan` WHERE `name` = '年卡');
