-- 插入物资分类数据
INSERT INTO material_categories (name, code, description) VALUES
('饲料', 'FEED', '各类牛只饲料'),
('药品', 'MEDICINE', '兽药和疫苗'),
('设备配件', 'EQUIPMENT_PARTS', '设备维修配件'),
('日用品', 'DAILY_SUPPLIES', '日常用品和工具'),
('建筑材料', 'CONSTRUCTION', '建筑和维修材料');

-- 插入饲料子分类
INSERT INTO material_categories (name, code, description, parent_id) VALUES
('精饲料', 'FEED_CONCENTRATE', '高营养浓缩饲料', (SELECT id FROM material_categories WHERE code = 'FEED')),
('粗饲料', 'FEED_ROUGHAGE', '干草、青贮等粗饲料', (SELECT id FROM material_categories WHERE code = 'FEED')),
('添加剂', 'FEED_ADDITIVE', '维生素、矿物质等添加剂', (SELECT id FROM material_categories WHERE code = 'FEED'));

-- 插入药品子分类
INSERT INTO material_categories (name, code, description, parent_id) VALUES
('疫苗', 'VACCINE', '各类疫苗', (SELECT id FROM material_categories WHERE code = 'MEDICINE')),
('抗生素', 'ANTIBIOTIC', '抗生素类药物', (SELECT id FROM material_categories WHERE code = 'MEDICINE')),
('消毒剂', 'DISINFECTANT', '消毒用品', (SELECT id FROM material_categories WHERE code = 'MEDICINE'));

-- 插入供应商数据
INSERT INTO suppliers (name, contact_person, phone, email, address, rating, supplier_type, status) VALUES
('正大饲料有限公司', '张经理', '13800138001', 'zhang@zhengda.com', '北京市朝阳区正大路123号', 5, '饲料供应商', 'active'),
('康牧兽药集团', '李经理', '13800138002', 'li@kangmu.com', '上海市浦东新区康牧大道456号', 4, '药品供应商', 'active'),
('农机设备公司', '王经理', '13800138003', 'wang@nongji.com', '山东省济南市农机路789号', 4, '设备供应商', 'active'),
('绿源生物科技', '赵经理', '13800138004', 'zhao@luyuan.com', '江苏省南京市生物园区101号', 5, '添加剂供应商', 'active');

-- 插入生产物资数据
INSERT INTO production_materials (name, code, category_id, unit, specification, supplier_id, purchase_price, safety_stock) VALUES
-- 精饲料
('玉米', 'FEED_CORN', (SELECT id FROM material_categories WHERE code = 'FEED_CONCENTRATE'), 'kg', '水分≤14%，杂质≤1%', 1, 2.80, 5000.00),
('豆粕', 'FEED_SOYBEAN_MEAL', (SELECT id FROM material_categories WHERE code = 'FEED_CONCENTRATE'), 'kg', '蛋白质≥43%', 1, 3.20, 3000.00),
('麸皮', 'FEED_WHEAT_BRAN', (SELECT id FROM material_categories WHERE code = 'FEED_CONCENTRATE'), 'kg', '粗蛋白≥15%', 1, 1.80, 2000.00),

-- 粗饲料
('苜蓿干草', 'FEED_ALFALFA_HAY', (SELECT id FROM material_categories WHERE code = 'FEED_ROUGHAGE'), 'kg', '粗蛋白≥18%', 1, 2.50, 10000.00),
('玉米青贮', 'FEED_CORN_SILAGE', (SELECT id FROM material_categories WHERE code = 'FEED_ROUGHAGE'), 'kg', '干物质≥30%', 1, 0.80, 20000.00),

-- 添加剂
('复合维生素', 'ADDITIVE_VITAMIN', (SELECT id FROM material_categories WHERE code = 'FEED_ADDITIVE'), 'kg', 'VA、VD、VE复合', 4, 25.00, 100.00),
('矿物质预混料', 'ADDITIVE_MINERAL', (SELECT id FROM material_categories WHERE code = 'FEED_ADDITIVE'), 'kg', '钙磷比1.5:1', 4, 15.00, 200.00),

-- 疫苗
('口蹄疫疫苗', 'VACCINE_FMD', (SELECT id FROM material_categories WHERE code = 'VACCINE'), '瓶', '10ml/瓶，冷藏保存', 2, 8.50, 500.00),
('牛瘟疫苗', 'VACCINE_RINDERPEST', (SELECT id FROM material_categories WHERE code = 'VACCINE'), '瓶', '5ml/瓶，冷藏保存', 2, 12.00, 300.00),

-- 抗生素
('青霉素', 'ANTIBIOTIC_PENICILLIN', (SELECT id FROM material_categories WHERE code = 'ANTIBIOTIC'), '瓶', '80万单位/瓶', 2, 3.50, 200.00),
('链霉素', 'ANTIBIOTIC_STREPTOMYCIN', (SELECT id FROM material_categories WHERE code = 'ANTIBIOTIC'), '瓶', '1g/瓶', 2, 4.20, 150.00),

-- 消毒剂
('过氧乙酸', 'DISINFECTANT_PAA', (SELECT id FROM material_categories WHERE code = 'DISINFECTANT'), 'L', '20%浓度', 2, 18.00, 100.00),
('碘伏', 'DISINFECTANT_IODINE', (SELECT id FROM material_categories WHERE code = 'DISINFECTANT'), 'L', '0.5%浓度', 2, 25.00, 50.00);

-- 为每个基地初始化库存数据（假设有基地ID 1和2）
INSERT INTO inventory (material_id, base_id, current_stock) 
SELECT pm.id, b.id, 
    CASE 
        WHEN pm.code LIKE 'FEED_%' THEN pm.safety_stock * 2
        WHEN pm.code LIKE 'VACCINE_%' THEN pm.safety_stock * 1.5
        ELSE pm.safety_stock * 1.2
    END
FROM production_materials pm
CROSS JOIN (SELECT id FROM bases LIMIT 2) b;