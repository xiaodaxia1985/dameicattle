-- Add missing fields to users table

-- Add security-related fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Add password management fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Add WeChat integration fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_openid VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_unionid VARCHAR(100) UNIQUE;

-- Update existing admin user to set initial values
UPDATE users SET 
    failed_login_attempts = 0,
    password_changed_at = CURRENT_TIMESTAMP
WHERE username = 'admin';