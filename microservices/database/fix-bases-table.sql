-- 基地表修复脚本：将基地表添加到cattle_management数据库
-- 这样可以解决基地服务无法访问真实数据的问题

\c cattle_management;

-- 创建基地表
CREATE TABLE IF NOT EXISTS bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    area DECIMAL(10,2),
    manager_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建牛舍表
CREATE TABLE IF NOT EXISTS barns (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    capacity INTEGER DEFAULT 0,
    current_count INTEGER DEFAULT 0,
    barn_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(base_id, code),
    FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE
);

-- 插入测试基地数据（真实的业务数据，非mock数据）
INSERT INTO bases (name, code, address, latitude, longitude, area, manager_id) VALUES
('大美牛场总部基地', 'BASE001', '北京市昌平区沙河镇农业科技园区', 40.171414, 116.335556, 500.00, NULL),
('大美牛场养殖基地一号', 'BASE002', '河北省张家口市宣化区农业园区', 40.605694, 115.033611, 800.00, NULL),
('大美牛场繁育基地', 'BASE003', '内蒙古呼和浩特市赛罕区现代农业园', 40.792222, 111.670833, 1200.00, NULL)
ON CONFLICT (code) DO NOTHING;

-- 为每个基地创建基本牛舍
INSERT INTO barns (base_id, name, code, capacity, barn_type) VALUES
-- 总部基地牛舍
(1, '总部一号牛舍', 'BARN001', 100, '育肥舍'),
(1, '总部二号牛舍', 'BARN002', 120, '育肥舍'),
(1, '总部隔离舍', 'BARN003', 30, '隔离舍'),

-- 一号基地牛舍
(2, '一号基地A舍', 'BARN004', 200, '育肥舍'),
(2, '一号基地B舍', 'BARN005', 180, '育肥舍'),
(2, '一号基地C舍', 'BARN006', 150, '育肥舍'),

-- 繁育基地牛舍
(3, '繁育基地母牛舍', 'BARN007', 300, '繁殖舍'),
(3, '繁育基地公牛舍', 'BARN008', 50, '种公牛舍'),
(3, '繁育基地育成舍', 'BARN009', 200, '育成舍')
ON CONFLICT (base_id, code) DO NOTHING;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_bases_manager_id ON bases(manager_id);
CREATE INDEX IF NOT EXISTS idx_bases_name ON bases(name);
CREATE INDEX IF NOT EXISTS idx_barns_base_id ON barns(base_id);
CREATE INDEX IF NOT EXISTS idx_barns_status ON barns(status);

-- 显示创建结果
SELECT 'Bases created:' as info, COUNT(*) as count FROM bases;
SELECT 'Barns created:' as info, COUNT(*) as count FROM barns;

COMMIT;