-- AI记事本数据库设计
-- 数据库: PostgreSQL 14+
-- 编码: UTF-8

-- 创建数据库
CREATE DATABASE ai_notebook 
  WITH ENCODING 'UTF8' 
  LC_COLLATE='en_US.UTF-8' 
  LC_CTYPE='en_US.UTF-8'
  TEMPLATE=template0;

-- 连接到数据库
\c ai_notebook;

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";           -- UUID生成
CREATE EXTENSION IF NOT EXISTS "pg_trgm";             -- 模糊搜索
CREATE EXTENSION IF NOT EXISTS "btree_gin";           -- 复合索引
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";  -- 查询统计
CREATE EXTENSION IF NOT EXISTS "pgcrypto";            -- 加密函数

-- 创建枚举类型
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE note_status AS ENUM ('draft', 'published', 'archived', 'deleted');
CREATE TYPE attachment_type AS ENUM ('image', 'audio', 'video', 'document', 'other');
CREATE TYPE share_permission AS ENUM ('read', 'comment', 'edit');

-- ============================================================================
-- 用户相关表
-- ============================================================================

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- 个人信息
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    
    -- 账户状态
    role user_role DEFAULT 'user',
    subscription_plan subscription_plan DEFAULT 'free',
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 个人设置
    settings JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    
    -- 统计信息
    notes_count INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0, -- 字节
    last_login_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户会话表
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- 会话信息
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location JSONB,
    
    -- 状态
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户邮箱验证表
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 密码重置表
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 笔记本和笔记相关表
-- ============================================================================

-- 笔记本表
CREATE TABLE notebooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 基本信息
    title VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#1890ff',
    icon VARCHAR(50) DEFAULT 'book',
    
    -- 设置
    settings JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    
    -- 统计
    notes_count INTEGER DEFAULT 0,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 笔记表
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notebook_id UUID REFERENCES notebooks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 内容
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,           -- Slate.js文档结构
    content_text TEXT,                -- 纯文本用于搜索
    excerpt TEXT,                     -- 摘要
    
    -- 元数据
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',      -- 字数、阅读时间等
    settings JSONB DEFAULT '{}',      -- 笔记设置
    
    -- 状态
    status note_status DEFAULT 'draft',
    is_favorite BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    
    -- 版本控制
    version INTEGER DEFAULT 1,
    
    -- 共享设置
    is_public BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),       -- 访问密码
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    archived_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 笔记版本历史表
CREATE TABLE note_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    
    -- 版本信息
    version_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    content_text TEXT,
    
    -- 变更信息
    change_summary TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 标签表
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#87d068',
    description TEXT,
    
    -- 统计
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, name)
);

-- 附件表
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 文件信息
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type attachment_type NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',      -- 图片尺寸、音频时长等
    
    -- 处理状态
    is_processed BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 共享和协作相关表
-- ============================================================================

-- 笔记分享表
CREATE TABLE note_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES users(id) ON DELETE CASCADE,
    
    permission share_permission DEFAULT 'read',
    
    -- 分享设置
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(note_id, shared_with)
);

-- 评论表
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    
    -- 位置信息（用于行内评论）
    position JSONB,
    
    -- 状态
    is_resolved BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================================================
-- AI功能相关表
-- ============================================================================

-- AI请求日志表
CREATE TABLE ai_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
    
    -- 请求信息
    request_type VARCHAR(50) NOT NULL,  -- 'completion', 'analysis', 'translation'
    prompt TEXT,
    response TEXT,
    
    -- 元数据
    model VARCHAR(100),
    tokens_used INTEGER,
    cost DECIMAL(10, 6),
    processing_time INTEGER,            -- 毫秒
    
    -- 状态
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI生成的标签建议表
CREATE TABLE ai_tag_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    
    suggested_tags TEXT[] NOT NULL,
    confidence_scores DECIMAL[] NOT NULL,
    
    -- 用户反馈
    accepted_tags TEXT[] DEFAULT '{}',
    rejected_tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 系统和统计相关表
-- ============================================================================

-- 用户活动日志表
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 活动信息
    action VARCHAR(100) NOT NULL,      -- 'create_note', 'update_note', 'login'
    resource_type VARCHAR(50),         -- 'note', 'notebook', 'user'
    resource_id UUID,
    
    -- 详细信息
    details JSONB DEFAULT '{}',
    
    -- 请求信息
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表
CREATE TABLE system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 通知表
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 通知内容
    type VARCHAR(50) NOT NULL,         -- 'comment', 'share', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- 相关资源
    resource_type VARCHAR(50),
    resource_id UUID,
    
    -- 状态
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 索引创建
-- ============================================================================

-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_activity ON users(last_activity_at);

-- 会话表索引
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- 笔记本表索引
CREATE INDEX idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX idx_notebooks_sort_order ON notebooks(user_id, sort_order);
CREATE INDEX idx_notebooks_updated_at ON notebooks(updated_at DESC);

-- 笔记表索引
CREATE INDEX idx_notes_user_id ON notes(user_id) WHERE status != 'deleted';
CREATE INDEX idx_notes_notebook_id ON notes(notebook_id) WHERE status != 'deleted';
CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX idx_notes_content_text ON notes USING GIN(to_tsvector('english', content_text));
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_favorite ON notes(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_notes_pinned ON notes(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_notes_share_token ON notes(share_token) WHERE share_token IS NOT NULL;

-- 笔记版本索引
CREATE INDEX idx_note_versions_note_id ON note_versions(note_id, version_number DESC);

-- 标签表索引
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(user_id, name);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);

-- 附件表索引
CREATE INDEX idx_attachments_note_id ON attachments(note_id);
CREATE INDEX idx_attachments_user_id ON attachments(user_id);
CREATE INDEX idx_attachments_type ON attachments(file_type);

-- 分享表索引
CREATE INDEX idx_note_shares_note_id ON note_shares(note_id);
CREATE INDEX idx_note_shares_shared_with ON note_shares(shared_with);
CREATE INDEX idx_note_shares_active ON note_shares(is_active) WHERE is_active = true;

-- 评论表索引
CREATE INDEX idx_comments_note_id ON comments(note_id) WHERE is_deleted = false;
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- AI请求日志索引
CREATE INDEX idx_ai_requests_user_id ON ai_requests(user_id);
CREATE INDEX idx_ai_requests_note_id ON ai_requests(note_id);
CREATE INDEX idx_ai_requests_type ON ai_requests(request_type);
CREATE INDEX idx_ai_requests_created_at ON ai_requests(created_at DESC);

-- 活动日志索引
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- 通知表索引
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- 触发器和函数
-- ============================================================================

-- 更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间戳触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notebooks_updated_at BEFORE UPDATE ON notebooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_shares_updated_at BEFORE UPDATE ON note_shares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 笔记计数更新函数
CREATE OR REPLACE FUNCTION update_notebook_notes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE notebooks SET notes_count = notes_count + 1 WHERE id = NEW.notebook_id;
        UPDATE users SET notes_count = notes_count + 1 WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE notebooks SET notes_count = notes_count - 1 WHERE id = OLD.notebook_id;
        UPDATE users SET notes_count = notes_count - 1 WHERE id = OLD.user_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.notebook_id != NEW.notebook_id THEN
            UPDATE notebooks SET notes_count = notes_count - 1 WHERE id = OLD.notebook_id;
            UPDATE notebooks SET notes_count = notes_count + 1 WHERE id = NEW.notebook_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 笔记计数触发器
CREATE TRIGGER update_notebook_notes_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_notebook_notes_count();

-- 标签使用计数更新函数
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
DECLARE
    tag_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        FOREACH tag_name IN ARRAY NEW.tags
        LOOP
            UPDATE tags SET usage_count = usage_count + 1 
            WHERE user_id = NEW.user_id AND name = tag_name;
        END LOOP;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        FOREACH tag_name IN ARRAY OLD.tags
        LOOP
            UPDATE tags SET usage_count = usage_count - 1 
            WHERE user_id = OLD.user_id AND name = tag_name;
        END LOOP;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 处理标签变化
        FOREACH tag_name IN ARRAY OLD.tags
        LOOP
            IF NOT (tag_name = ANY(NEW.tags)) THEN
                UPDATE tags SET usage_count = usage_count - 1 
                WHERE user_id = OLD.user_id AND name = tag_name;
            END IF;
        END LOOP;
        
        FOREACH tag_name IN ARRAY NEW.tags
        LOOP
            IF NOT (tag_name = ANY(OLD.tags)) THEN
                UPDATE tags SET usage_count = usage_count + 1 
                WHERE user_id = NEW.user_id AND name = tag_name;
            END IF;
        END LOOP;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 标签使用计数触发器
CREATE TRIGGER update_tag_usage_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- ============================================================================
-- 视图创建
-- ============================================================================

-- 用户统计视图
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.created_at,
    u.notes_count,
    u.storage_used,
    COUNT(DISTINCT n.id) as total_notes,
    COUNT(DISTINCT nb.id) as total_notebooks,
    COUNT(DISTINCT t.id) as total_tags,
    MAX(n.updated_at) as last_note_update
FROM users u
LEFT JOIN notes n ON u.id = n.user_id AND n.status != 'deleted'
LEFT JOIN notebooks nb ON u.id = nb.user_id
LEFT JOIN tags t ON u.id = t.user_id
GROUP BY u.id, u.username, u.email, u.created_at, u.notes_count, u.storage_used;

-- 笔记详情视图
CREATE VIEW note_details AS
SELECT 
    n.*,
    nb.title as notebook_title,
    nb.color as notebook_color,
    u.username as author_username,
    COUNT(DISTINCT c.id) as comments_count,
    COUNT(DISTINCT a.id) as attachments_count,
    COUNT(DISTINCT ns.id) as shares_count
FROM notes n
JOIN notebooks nb ON n.notebook_id = nb.id
JOIN users u ON n.user_id = u.id
LEFT JOIN comments c ON n.id = c.note_id AND c.is_deleted = false
LEFT JOIN attachments a ON n.id = a.note_id
LEFT JOIN note_shares ns ON n.id = ns.note_id AND ns.is_active = true
WHERE n.status != 'deleted'
GROUP BY n.id, nb.title, nb.color, u.username;

-- ============================================================================
-- 初始数据插入
-- ============================================================================

-- 插入系统配置
INSERT INTO system_configs (key, value, description) VALUES
('max_file_size', '"10485760"', '最大文件上传大小（字节）'),
('allowed_file_types', '["image/jpeg", "image/png", "image/gif", "audio/mpeg", "audio/wav", "video/mp4", "application/pdf"]', '允许的文件类型'),
('ai_daily_limit', '100', '每日AI请求限制'),
('free_storage_limit', '"1073741824"', '免费用户存储限制（字节）'),
('pro_storage_limit', '"10737418240"', 'Pro用户存储限制（字节）');

-- 创建默认管理员用户（密码: admin123）
INSERT INTO users (email, username, password_hash, role, email_verified) VALUES
('admin@ai-notebook.com', 'admin', '$2b$10$rQZ8kHWKQVnqnqQQvQQvQeQQvQQvQQvQQvQQvQQvQQvQQvQQvQQvQQ', 'admin', true);

-- ============================================================================
-- 性能优化建议
-- ============================================================================

-- 1. 定期清理过期会话
-- CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
-- RETURNS void AS $$
-- BEGIN
--     DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
-- END;
-- $$ LANGUAGE plpgsql;

-- 2. 定期归档旧的活动日志
-- CREATE OR REPLACE FUNCTION archive_old_activity_logs()
-- RETURNS void AS $$
-- BEGIN
--     DELETE FROM activity_logs WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
-- END;
-- $$ LANGUAGE plpgsql;

-- 3. 定期更新统计信息
-- CREATE OR REPLACE FUNCTION update_table_statistics()
-- RETURNS void AS $$
-- BEGIN
--     ANALYZE users;
--     ANALYZE notes;
--     ANALYZE notebooks;
--     ANALYZE attachments;
-- END;
-- $$ LANGUAGE plpgsql;

-- ============================================================================
-- 备份和恢复建议
-- ============================================================================

-- 1. 每日备份脚本
-- pg_dump -h localhost -U postgres -d ai_notebook -f backup_$(date +%Y%m%d).sql

-- 2. 恢复脚本
-- psql -h localhost -U postgres -d ai_notebook -f backup_20240101.sql

-- 3. 增量备份（使用WAL）
-- SELECT pg_start_backup('daily_backup');
-- -- 复制数据文件
-- SELECT pg_stop_backup();

COMMIT;