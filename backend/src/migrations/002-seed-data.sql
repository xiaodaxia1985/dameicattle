-- 肉牛全生命周期管理系统种子数据

-- 插入默认角色
INSERT INTO roles (name, description, permissions) VALUES
('超级管理员', '系统超级管理员，拥有所有权限', '["*", "system:admin", "bases:all", "user:create", "user:read", "user:update", "user:delete", "user:reset-password", "role:create", "role:read", "role:update", "role:delete", "base:create", "base:read", "base:update", "base:delete", "cattle:create", "cattle:read", "cattle:update", "cattle:delete", "health:create", "health:read", "health:update", "health:delete", "feeding:create", "feeding:read", "feeding:update", "feeding:delete", "material:create", "material:read", "material:update", "material:delete", "inventory:create", "inventory:read", "inventory:update", "inventory:delete", "purchase:create", "purchase:read", "purchase:update", "purchase:delete", "purchase:approve", "sales:create", "sales:read", "sales:update", "sales:delete", "news:create", "news:read", "news:update", "news:delete", "operation-log:read", "operation-log:export", "system:logs", "system:manage", "dashboard:read", "reports:read"]'),
('基地管理员', '基地管理员，管理所属基地的所有业务', '["cattle:create", "cattle:read", "cattle:update", "cattle:delete", "health:create", "health:read", "health:update", "health:delete", "feeding:create", "feeding:read", "feeding:update", "feeding:delete", "material:create", "material:read", "material:update", "inventory:create", "inventory:read", "inventory:update", "purchase:create", "purchase:read", "purchase:update", "sales:create", "sales:read", "sales:update", "dashboard:read", "reports:read"]'),
('兽医', '兽医，负责牛只健康管理', '["cattle:read", "health:create", "health:read", "health:update", "health:delete", "dashboard:read", "reports:read"]'),
('饲养员', '饲养员，负责日常饲养管理', '["cattle:read", "cattle:update", "feeding:create", "feeding:read", "feeding:update", "material:read", "inventory:read", "dashboard:read"]'),
('普通员工', '普通员工，只读权限', '["cattle:read", "health:read", "feeding:read", "material:read", "inventory:read", "dashboard:read", "reports:read"]');

-- 插入示例基地
INSERT INTO bases (name, code, address, latitude, longitude, area) VALUES
('总部基地', 'BASE001', '山东省济南市历城区工业北路123号', 36.6512, 117.1201, 500.00),
('东区养殖场', 'BASE002', '山东省济南市章丘区明水街道456号', 36.7128, 117.5347, 800.00),
('西区养殖场', 'BASE003', '山东省济南市长清区文昌街道789号', 36.5537, 116.7516, 600.00);

-- 插入默认管理员用户（密码：Admin123）
INSERT INTO users (username, password_hash, real_name, email, phone, role_id, base_id, status) VALUES
('admin', '$2a$12$tGjpQcVbjVbipdkcrPba4evU0xSDLypGIomSoIc7yBGy0.9Utsa9W', '系统管理员', 'admin@cattle-management.com', '13800138000', 1, 1, 'active');

-- 插入示例牛棚
INSERT INTO barns (name, code, base_id, capacity, barn_type) VALUES
('A区1号棚', 'A001', 1, 50, '育肥棚'),
('A区2号棚', 'A002', 1, 50, '育肥棚'),
('B区1号棚', 'B001', 1, 30, '繁殖棚'),
('东区1号棚', 'E001', 2, 80, '育肥棚'),
('东区2号棚', 'E002', 2, 80, '育肥棚'),
('西区1号棚', 'W001', 3, 60, '育肥棚');

-- 插入物资分类
INSERT INTO material_categories (name, code, description, parent_id) VALUES
('饲料', 'FEED', '各类牛只饲料', NULL),
('精饲料', 'FEED_CONCENTRATE', '精饲料类', 1),
('粗饲料', 'FEED_ROUGHAGE', '粗饲料类', 1),
('添加剂', 'FEED_ADDITIVE', '饲料添加剂', 1),
('兽药', 'MEDICINE', '兽用药品', NULL),
('疫苗', 'VACCINE', '疫苗类药品', 5),
('治疗药物', 'TREATMENT', '治疗用药物', 5),
('保健药物', 'HEALTHCARE', '保健用药物', 5),
('设备用品', 'EQUIPMENT', '设备和用品', NULL),
('清洁用品', 'CLEANING', '清洁消毒用品', 9),
('工具用品', 'TOOLS', '工具和器械', 9);

-- 插入示例供应商
INSERT INTO suppliers (name, contact_person, phone, email, address, rating, supplier_type) VALUES
('山东优质饲料有限公司', '张经理', '0531-88888888', 'zhang@feed.com', '山东省济南市天桥区饲料工业园', 5, '饲料供应商'),
('华北兽药集团', '李经理', '010-66666666', 'li@medicine.com', '北京市朝阳区兽药产业园', 4, '兽药供应商'),
('青岛牧业设备厂', '王经理', '0532-77777777', 'wang@equipment.com', '山东省青岛市城阳区设备制造园', 4, '设备供应商');

-- 插入示例客户
INSERT INTO customers (name, contact_person, phone, email, address, credit_rating, customer_type) VALUES
('济南肉类加工厂', '赵经理', '0531-99999999', 'zhao@meat.com', '山东省济南市市中区加工园区', 5, '加工企业'),
('青岛冷链物流公司', '钱经理', '0532-88888888', 'qian@logistics.com', '山东省青岛市黄岛区物流园', 4, '物流企业'),
('烟台餐饮集团', '孙经理', '0535-77777777', 'sun@restaurant.com', '山东省烟台市芝罘区餐饮街', 4, '餐饮企业');

-- 插入新闻分类
INSERT INTO news_categories (name, code, description, sort_order) VALUES
('公司新闻', 'COMPANY', '公司内部新闻动态', 1),
('行业资讯', 'INDUSTRY', '行业相关资讯', 2),
('技术分享', 'TECHNOLOGY', '技术经验分享', 3),
('政策法规', 'POLICY', '相关政策法规', 4),
('市场动态', 'MARKET', '市场价格动态', 5);

-- 插入示例饲料配方
INSERT INTO feed_formulas (name, description, ingredients, cost_per_kg, created_by) VALUES
('育肥牛标准配方', '适用于6-18月龄育肥牛的标准饲料配方', '{"玉米": {"ratio": 45, "unit": "%", "cost": 2.8}, "豆粕": {"ratio": 20, "unit": "%", "cost": 4.2}, "麸皮": {"ratio": 15, "unit": "%", "cost": 2.1}, "棉籽粕": {"ratio": 10, "unit": "%", "cost": 3.5}, "预混料": {"ratio": 5, "unit": "%", "cost": 12.0}, "食盐": {"ratio": 3, "unit": "%", "cost": 1.5}, "石粉": {"ratio": 2, "unit": "%", "cost": 0.8}}', 3.45, 1),
('繁殖母牛配方', '适用于繁殖母牛的营养配方', '{"玉米": {"ratio": 40, "unit": "%", "cost": 2.8}, "豆粕": {"ratio": 25, "unit": "%", "cost": 4.2}, "麸皮": {"ratio": 12, "unit": "%", "cost": 2.1}, "苜蓿草粉": {"ratio": 15, "unit": "%", "cost": 3.8}, "预混料": {"ratio": 5, "unit": "%", "cost": 12.0}, "食盐": {"ratio": 2, "unit": "%", "cost": 1.5}, "石粉": {"ratio": 1, "unit": "%", "cost": 0.8}}', 3.78, 1);

-- 插入示例生产物资
INSERT INTO production_materials (name, code, category_id, unit, specification, supplier_id, purchase_price, safety_stock) VALUES
('玉米', 'CORN001', 2, 'kg', '水分≤14%，杂质≤1%', 1, 2.80, 5000.00),
('豆粕', 'SOYBEAN001', 2, 'kg', '蛋白质≥43%，水分≤13%', 1, 4.20, 3000.00),
('麸皮', 'BRAN001', 2, 'kg', '粗蛋白≥15%，粗纤维≤10%', 1, 2.10, 2000.00),
('苜蓿草', 'ALFALFA001', 3, 'kg', '粗蛋白≥18%，粗纤维≤32%', 1, 3.80, 1500.00),
('口蹄疫疫苗', 'VACCINE001', 6, '头份', '10头份/瓶', 2, 15.00, 200.00),
('青霉素', 'PENICILLIN001', 7, '支', '80万单位/支', 2, 8.50, 100.00),
('消毒液', 'DISINFECT001', 10, 'L', '有效氯≥5%', 2, 12.00, 50.00);

-- 插入库存数据
INSERT INTO inventory (material_id, base_id, current_stock) VALUES
(1, 1, 8000.00), (1, 2, 6000.00), (1, 3, 4000.00),
(2, 1, 5000.00), (2, 2, 3500.00), (2, 3, 2500.00),
(3, 1, 3000.00), (3, 2, 2200.00), (3, 3, 1800.00),
(4, 1, 2000.00), (4, 2, 1500.00), (4, 3, 1200.00),
(5, 1, 300.00), (5, 2, 250.00), (5, 3, 200.00),
(6, 1, 150.00), (6, 2, 120.00), (6, 3, 100.00),
(7, 1, 80.00), (7, 2, 60.00), (7, 3, 40.00);