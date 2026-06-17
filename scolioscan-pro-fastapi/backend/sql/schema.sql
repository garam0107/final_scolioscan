-- NextVine backend current schema
-- 기준: backend/app/models/*.py 현재 모델 구조
-- 주의: 이 파일은 전체 테이블 구조 확인용입니다. 운영 DB에 그대로 적용하면 기존 테이블과 충돌할 수 있습니다.

CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `user_pw` VARCHAR(512) NOT NULL,
  `name` VARCHAR(32) NOT NULL,
  `phone` VARCHAR(64) NOT NULL,
  `birthday` DATETIME NOT NULL,
  `sex` BOOL NOT NULL,
  `address` VARCHAR(128) NOT NULL,
  `detail_address` VARCHAR(128) NULL,
  `profile_image` VARCHAR(256) NULL,
  `alarm_count` INT NOT NULL,
  `setting` JSON NOT NULL,
  `is_admin` BOOL NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_user_id` (`user_id`),
  KEY `ix_users_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `social_accounts` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `provider` ENUM('google', 'kakao', 'naver') NOT NULL,
  `provider_user_id` VARCHAR(128) NOT NULL,
  `provider_email` VARCHAR(128) NULL,
  `linked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_social_accounts_id` (`id`),
  KEY `ix_social_accounts_user_id` (`user_id`),
  UNIQUE KEY `uq_social_accounts_provider_user` (`provider`, `provider_user_id`),
  UNIQUE KEY `uq_social_accounts_user_provider` (`user_id`, `provider`),
  CONSTRAINT `fk_social_accounts_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `alarm_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(16) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_alarm_types_name` (`name`),
  KEY `ix_alarm_types_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `analysis_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(16) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_analysis_types_name` (`name`),
  KEY `ix_analysis_types_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `subscribe_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(16) NOT NULL,
  `price` INT NOT NULL,
  `description` VARCHAR(256) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `removed_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_subscribe_types_name` (`name`),
  KEY `ix_subscribe_types_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `subscribe_cards` (
  `id` CHAR(36) NOT NULL,
  `user_uuid` CHAR(36) NOT NULL,
  `billing_key` VARCHAR(64) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `removed_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  KEY `ix_subscribe_cards_id` (`id`),
  KEY `ix_subscribe_cards_user_uuid` (`user_uuid`),
  CONSTRAINT `fk_subscribe_cards_user_uuid`
    FOREIGN KEY (`user_uuid`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `subscribes` (
  `id` CHAR(36) NOT NULL,
  `user_uuid` CHAR(36) NOT NULL,
  `subscribe_card` CHAR(36) NOT NULL,
  `subscribe_type` INT NOT NULL,
  `started_at` DATETIME NOT NULL,
  `ended_at` DATETIME NOT NULL,
  `terminated_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_subscribes_id` (`id`),
  KEY `ix_subscribes_user_uuid` (`user_uuid`),
  KEY `ix_subscribes_subscribe_card` (`subscribe_card`),
  KEY `ix_subscribes_subscribe_type` (`subscribe_type`),
  CONSTRAINT `fk_subscribes_user_uuid`
    FOREIGN KEY (`user_uuid`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_subscribes_subscribe_card`
    FOREIGN KEY (`subscribe_card`) REFERENCES `subscribe_cards` (`id`),
  CONSTRAINT `fk_subscribes_subscribe_type`
    FOREIGN KEY (`subscribe_type`) REFERENCES `subscribe_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `alarms` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_uuid` CHAR(36) NOT NULL,
  `alarm_type` INT NOT NULL,
  `title` VARCHAR(64) NOT NULL,
  `content` TEXT NOT NULL,
  `read_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_alarms_id` (`id`),
  KEY `ix_alarms_user_uuid` (`user_uuid`),
  KEY `ix_alarms_alarm_type` (`alarm_type`),
  CONSTRAINT `fk_alarms_user_uuid`
    FOREIGN KEY (`user_uuid`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_alarms_alarm_type`
    FOREIGN KEY (`alarm_type`) REFERENCES `alarm_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `curvature_measurements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(36) NOT NULL,
  `measured_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `main_thoracic_cobb` FLOAT NOT NULL,
  `secondary_thoracic_cobb` FLOAT NOT NULL,
  `lumbar_cobb` FLOAT NOT NULL,
  `severity` ENUM('normal', 'mild', 'moderate', 'severe') NOT NULL,
  `back_type` ENUM('Normal', 'Thoracic', 'Double Thoracic', 'Double major', 'Triple curve', 'Lumbar', 'Unknown') NOT NULL,
  `score` FLOAT NULL,
  `image_path` VARCHAR(512) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_curvature_measurements_user_id` (`user_id`),
  KEY `ix_curvature_user_measured` (`user_id`, `measured_at`),
  CONSTRAINT `fk_curvature_measurements_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `rotation_measurements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(36) NOT NULL,
  `measured_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `upper_thoracic_atr` FLOAT NOT NULL,
  `lower_thoracic_atr` FLOAT NOT NULL,
  `thoracolumbar_atr` FLOAT NOT NULL,
  `upper_lumbar_atr` FLOAT NOT NULL,
  `lower_lumbar_atr` FLOAT NOT NULL,
  `thoracic_atr` FLOAT NOT NULL,
  `lumbar_atr` FLOAT NOT NULL,
  `max_severity_zone` ENUM('safe', 'caution', 'alert') NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `curvature_measurement_id` INT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_rotation_measurements_user_id` (`user_id`),
  KEY `ix_rotation_user_measured` (`user_id`, `measured_at`),
  KEY `ix_rotation_measurements_curvature_measurement_id` (`curvature_measurement_id`),
  CONSTRAINT `fk_rotation_measurements_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
    ON DELETE CASCADE
  CONSTRAINT `fk_rotation_measurements_curvature_measurement_id`
    FOREIGN KEY (`curvature_measurement_id`) REFERENCES `curvature_measurements` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
