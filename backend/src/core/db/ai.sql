
CREATE TABLE IF NOT EXISTS `ai_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `provider` ENUM('ollama','openai','anthropic') NOT NULL DEFAULT 'ollama',
  `ollama_host` VARCHAR(500) NOT NULL DEFAULT 'http://localhost:11434',
  `openai_api_key` VARCHAR(500) DEFAULT NULL,
  `anthropic_api_key` VARCHAR(500) DEFAULT NULL,
  `deepseek_api_key` VARCHAR(500) DEFAULT NULL,
  `default_model` VARCHAR(100) NOT NULL DEFAULT 'llama3.2',
  `temperature` DECIMAL(3,2) NOT NULL DEFAULT 0.70,
  `max_tokens` INT NOT NULL DEFAULT 4096,
  `system_prompt` TEXT NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
);


CREATE TABLE IF NOT EXISTS `ai_conversations` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL DEFAULT 'New conversation',
  `model` VARCHAR(100) NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  INDEX `idx_ai_conversations_user` (`user_id`),
  INDEX `idx_ai_conversations_updated` (`updated_at`)
);


CREATE TABLE IF NOT EXISTS `ai_messages` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `conversation_id` CHAR(36) NOT NULL,
  `role` ENUM('user','assistant','system') NOT NULL,
  `content` LONGTEXT NOT NULL,
  `file_references` JSON DEFAULT NULL,
  `token_count` INT DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  INDEX `idx_ai_messages_conversation` (`conversation_id`),
  INDEX `idx_ai_messages_created` (`created_at`),
  CONSTRAINT `fk_ai_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE
);

