-- 创建巡圈记录表
CREATE TABLE IF NOT EXISTS patrol_records (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    barn_id INTEGER NOT NULL,
    patrol_date TIMESTAMP WITH TIME ZONE NOT NULL,
    patrol_type VARCHAR(20) NOT NULL CHECK (patrol_type IN ('before_feeding', 'after_feeding', 'night_check', 'routine_check')),
    cattle_count INTEGER NOT NULL DEFAULT 0,
    lying_count INTEGER NOT NULL DEFAULT 0,
    standing_count INTEGER NOT NULL DEFAULT 0,
    abnormal_count INTEGER NOT NULL DEFAULT 0,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    air_quality VARCHAR(50),
    feed_trough_status VARCHAR(20) NOT NULL DEFAULT 'good' CHECK (feed_trough_status IN ('good', 'needs_cleaning', 'damaged')),
    water_trough_status VARCHAR(20) NOT NULL DEFAULT 'good' CHECK (water_trough_status IN ('good', 'needs_cleaning', 'damaged')),
    environment_notes TEXT,
    abnormal_notes TEXT,
    patrol_duration INTEGER NOT NULL DEFAULT 0,
    patroller_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS patrol_records_base_id ON patrol_records (base_id);
CREATE INDEX IF NOT EXISTS patrol_records_barn_id ON patrol_records (barn_id);
CREATE INDEX IF NOT EXISTS patrol_records_patrol_date ON patrol_records (patrol_date);
CREATE INDEX IF NOT EXISTS patrol_records_patrol_type ON patrol_records (patrol_type);
CREATE INDEX IF NOT EXISTS patrol_records_patroller_id ON patrol_records (patroller_id);

-- 添加注释
COMMENT ON TABLE patrol_records IS '巡圈记录表';
COMMENT ON COLUMN patrol_records.base_id IS '基地ID';
COMMENT ON COLUMN patrol_records.barn_id IS '牛棚ID';
COMMENT ON COLUMN patrol_records.patrol_date IS '巡圈日期';
COMMENT ON COLUMN patrol_records.patrol_type IS '巡圈类型';
COMMENT ON COLUMN patrol_records.cattle_count IS '牛只总数';
COMMENT ON COLUMN patrol_records.lying_count IS '躺卧牛只数';
COMMENT ON COLUMN patrol_records.standing_count IS '站立牛只数';
COMMENT ON COLUMN patrol_records.abnormal_count IS '异常牛只数';
COMMENT ON COLUMN patrol_records.temperature IS '温度（摄氏度）';
COMMENT ON COLUMN patrol_records.humidity IS '湿度（%）';
COMMENT ON COLUMN patrol_records.air_quality IS '空气质量';
COMMENT ON COLUMN patrol_records.feed_trough_status IS '饲料槽状态';
COMMENT ON COLUMN patrol_records.water_trough_status IS '水槽状态';
COMMENT ON COLUMN patrol_records.environment_notes IS '环境备注';
COMMENT ON COLUMN patrol_records.abnormal_notes IS '异常情况备注';
COMMENT ON COLUMN patrol_records.patrol_duration IS '巡圈耗时（分钟）';
COMMENT ON COLUMN patrol_records.patroller_id IS '巡圈员ID';