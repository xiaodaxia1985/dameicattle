-- 巡圈记录表
CREATE TABLE IF NOT EXISTS patrol_records (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
    barn_id INTEGER NOT NULL REFERENCES barns(id) ON DELETE CASCADE,
    patrol_date DATE NOT NULL,
    patrol_time TIME NOT NULL,
    patrol_type VARCHAR(20) NOT NULL CHECK (patrol_type IN ('before_feeding', 'after_feeding', 'routine')),
    
    -- 牛只状态
    total_cattle_count INTEGER NOT NULL DEFAULT 0,
    standing_cattle_count INTEGER DEFAULT 0,
    lying_cattle_count INTEGER DEFAULT 0,
    lying_rate DECIMAL(5,2) DEFAULT 0, -- 躺卧率百分比
    
    -- 异常牛只记录
    abnormal_cattle_count INTEGER DEFAULT 0,
    abnormal_cattle_description TEXT,
    
    -- 设施检查
    feed_trough_clean BOOLEAN DEFAULT true,
    feed_trough_notes TEXT,
    water_trough_clean BOOLEAN DEFAULT true,
    water_trough_notes TEXT,
    
    -- 环境数据
    temperature DECIMAL(4,1), -- 温度，摄氏度，精确到0.1度
    humidity DECIMAL(5,2), -- 湿度，百分比，精确到0.01%
    environment_notes TEXT,
    
    -- 物联网设备数据
    iot_device_id VARCHAR(100), -- 物联网设备ID
    iot_data_source VARCHAR(50), -- 数据来源：manual, iot_sensor, api
    
    -- 巡圈人员和备注
    patrol_person_id INTEGER REFERENCES users(id),
    patrol_person_name VARCHAR(100),
    overall_notes TEXT,
    
    -- 图片附件（JSON格式存储图片URL数组）
    images JSONB DEFAULT '[]',
    
    -- 系统字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引约束
    UNIQUE(base_id, barn_id, patrol_date, patrol_time, patrol_type)
);

-- 创建索引
CREATE INDEX idx_patrol_records_base_barn ON patrol_records(base_id, barn_id);
CREATE INDEX idx_patrol_records_date ON patrol_records(patrol_date);
CREATE INDEX idx_patrol_records_type ON patrol_records(patrol_type);
CREATE INDEX idx_patrol_records_person ON patrol_records(patrol_person_id);

-- 添加注释
COMMENT ON TABLE patrol_records IS '巡圈记录表';
COMMENT ON COLUMN patrol_records.patrol_type IS '巡圈类型：before_feeding-喂食前, after_feeding-喂食后, routine-常规巡圈';
COMMENT ON COLUMN patrol_records.lying_rate IS '躺卧率百分比，计算公式：(躺卧牛只数/总牛只数)*100';
COMMENT ON COLUMN patrol_records.iot_data_source IS '数据来源：manual-手动录入, iot_sensor-物联网传感器, api-第三方API';
COMMENT ON COLUMN patrol_records.images IS 'JSON格式存储的图片URL数组';

-- 巡圈模板表（可选，用于标准化巡圈流程）
CREATE TABLE IF NOT EXISTS patrol_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_id INTEGER REFERENCES bases(id) ON DELETE CASCADE,
    
    -- 检查项目配置
    check_cattle_status BOOLEAN DEFAULT true,
    check_feed_trough BOOLEAN DEFAULT true,
    check_water_trough BOOLEAN DEFAULT true,
    check_environment BOOLEAN DEFAULT true,
    require_lying_rate BOOLEAN DEFAULT true,
    require_temperature BOOLEAN DEFAULT false,
    require_humidity BOOLEAN DEFAULT false,
    
    -- 提醒设置
    reminder_intervals JSONB DEFAULT '[]', -- 提醒间隔时间配置
    
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE patrol_templates IS '巡圈模板表，用于标准化巡圈流程';

-- 物联网设备表
CREATE TABLE IF NOT EXISTS iot_devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- temperature_humidity, camera, etc.
    base_id INTEGER REFERENCES bases(id) ON DELETE CASCADE,
    barn_id INTEGER REFERENCES barns(id) ON DELETE CASCADE,
    
    -- 设备配置
    api_endpoint VARCHAR(500),
    api_key VARCHAR(200),
    device_config JSONB DEFAULT '{}',
    
    -- 设备状态
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    last_data_time TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_iot_devices_barn ON iot_devices(barn_id);
CREATE INDEX idx_iot_devices_type ON iot_devices(device_type);

COMMENT ON TABLE iot_devices IS '物联网设备表';
COMMENT ON COLUMN iot_devices.device_type IS '设备类型：temperature_humidity-温湿度传感器, camera-摄像头等';