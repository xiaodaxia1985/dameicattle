-- Migration: Enhance authentication security features
-- Add security fields to users table and create security_logs table

-- Add new fields to users table for enhanced security
ALTER TABLE users 
ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN locked_until TIMESTAMP NULL,
ADD COLUMN last_login TIMESTAMP NULL,
ADD COLUMN password_reset_token VARCHAR(255) NULL,
ADD COLUMN password_reset_expires TIMESTAMP NULL,
ADD COLUMN wechat_openid VARCHAR(100) NULL UNIQUE,
ADD COLUMN wechat_unionid VARCHAR(100) NULL UNIQUE;

-- Create security_logs table
CREATE TABLE security_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('login_success', 'login_failed', 'logout', 'password_reset', 'account_locked', 'token_refresh')),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX idx_security_logs_ip_address ON security_logs(ip_address);
CREATE INDEX idx_users_wechat_openid ON users(wechat_openid) WHERE wechat_openid IS NOT NULL;
CREATE INDEX idx_users_wechat_unionid ON users(wechat_unionid) WHERE wechat_unionid IS NOT NULL;
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE security_logs IS 'Security event logging for authentication and authorization';
COMMENT ON COLUMN users.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Account lock expiration timestamp';
COMMENT ON COLUMN users.last_login IS 'Last successful login timestamp';
COMMENT ON COLUMN users.password_reset_token IS 'Hashed password reset token';
COMMENT ON COLUMN users.password_reset_expires IS 'Password reset token expiration';
COMMENT ON COLUMN users.wechat_openid IS 'WeChat Mini Program OpenID';
COMMENT ON COLUMN users.wechat_unionid IS 'WeChat UnionID for cross-platform identification';