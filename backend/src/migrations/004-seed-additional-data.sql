-- 新增表的种子数据

-- 插入设备分类
INSERT INTO equipment_categories (name, code, description) VALUES
('饲喂设备', 'FEEDING', '饲料投喂相关设备'),
('清洁设备', 'CLEANING', '清洁消毒设备'),
('监控设备', 'MONITORING', '监控摄像设备'),
('环境控制', 'ENVIRONMENT', '温湿度控制设备'),
('运输设备', 'TRANSPORT', '运输车辆设备'),
('医疗设备', 'MEDICAL', '兽医医疗设备');

-- 插入示例生产设备
INSERT INTO production_equipment (name, code, category_id, base_id, barn_id, brand, model, serial_number, purchase_date, purchase_price, warranty_period, installation_date, status, location, specifications) VALUES
('自动饲喂机A1', 'FEED001', 1, 1, 1, '牧神', 'MS-2000', 'MS2000001', '2023-01-15', 25000.00, 24, '2023-01-20', 'normal', 'A区1号棚东侧', '{"capacity": "2000kg", "power": "5kw", "voltage": "380V"}'),
('自动饲喂机A2', 'FEED002', 1, 1, 2, '牧神', 'MS-2000', 'MS2000002', '2023-01-15', 25000.00, 24, '2023-01-20', 'normal', 'A区2号棚东侧', '{"capacity": "2000kg", "power": "5kw", "voltage": "380V"}'),
('高压清洗机', 'CLEAN001', 2, 1, NULL, '凯驰', 'HD10/25-4S', 'KC001', '2023-02-10', 8500.00, 12, '2023-02-15', 'normal', '设备间', '{"pressure": "250bar", "flow": "1000L/h", "power": "7.5kw"}'),
('监控摄像头组', 'MONITOR001', 3, 1, 1, '海康威视', 'DS-2CD2347G2-LU', 'HK001', '2023-03-01', 3200.00, 36, '2023-03-05', 'normal', 'A区1号棚四角', '{"resolution": "4MP", "night_vision": true, "waterproof": "IP67"}'),
('环境控制器', 'ENV001', 4, 1, 1, '正大', 'ZD-ENV-100', 'ZD001', '2023-02-20', 12000.00, 24, '2023-02-25', 'normal', 'A区1号棚控制室', '{"temp_range": "-20~60°C", "humidity_range": "0~100%RH", "control_points": 8}'),
('运输车辆', 'TRANS001', 5, 1, NULL, '东风', 'DFL1160BX1V', 'DF001', '2022-12-01', 180000.00, 36, '2022-12-05', 'normal', '车库', '{"load_capacity": "8000kg", "fuel_type": "diesel", "emission_standard": "国六"}');

-- 插入设备维护计划
INSERT INTO equipment_maintenance_plans (equipment_id, maintenance_type, frequency_days, description, checklist) VALUES
(1, '日常保养', 7, '自动饲喂机每周保养', '{"items": ["清洁料槽", "检查传动带", "润滑轴承", "检查电气连接"]}'),
(1, '月度检修', 30, '自动饲喂机每月检修', '{"items": ["更换滤网", "检查电机", "校准传感器", "检查安全装置", "测试报警系统"]}'),
(2, '日常保养', 7, '自动饲喂机每周保养', '{"items": ["清洁料槽", "检查传动带", "润滑轴承", "检查电气连接"]}'),
(3, '月度保养', 30, '高压清洗机月度保养', '{"items": ["更换机油", "清洁过滤器", "检查高压管", "测试压力表"]}'),
(4, '季度检查', 90, '监控设备季度检查', '{"items": ["清洁镜头", "检查线路", "测试录像功能", "更新固件"]}'),
(5, '月度检查', 30, '环境控制器月度检查', '{"items": ["校准传感器", "检查控制逻辑", "清洁设备", "测试报警功能"]}'),
(6, '月度保养', 30, '运输车辆月度保养', '{"items": ["更换机油", "检查轮胎", "检查刹车", "清洁车辆", "检查灯光"]}');

-- 插入示例维护记录
INSERT INTO equipment_maintenance_records (equipment_id, plan_id, maintenance_date, maintenance_type, operator_id, duration_hours, cost, issues_found, actions_taken, next_maintenance_date, status) VALUES
(1, 1, '2024-01-08', '日常保养', 1, 2.0, 50.00, '传动带略有松动', '调整传动带张力，添加润滑油', '2024-01-15', 'completed'),
(1, 2, '2024-01-01', '月度检修', 1, 4.0, 200.00, '滤网堵塞，传感器需要校准', '更换滤网，重新校准传感器', '2024-02-01', 'completed'),
(3, 4, '2024-01-10', '月度保养', 1, 1.5, 80.00, '机油变黑，过滤器脏污', '更换机油和过滤器', '2024-02-10', 'completed');

-- 插入库存预警数据
INSERT INTO inventory_alerts (material_id, base_id, alert_type, alert_level, message) VALUES
(1, 2, 'low_stock', 'medium', '东区基地玉米库存不足，当前库存6000kg，低于安全库存5000kg'),
(2, 3, 'low_stock', 'high', '西区基地豆粕库存严重不足，当前库存2500kg，低于安全库存3000kg'),
(5, 1, 'low_stock', 'medium', '总部基地口蹄疫疫苗库存不足，当前库存300头份，低于安全库存200头份');

-- 插入示例新闻文章
INSERT INTO news_articles (title, subtitle, category_id, content, summary, cover_image, tags, author_id, author_name, status, is_featured, view_count, publish_time) VALUES
('公司成功通过ISO9001质量管理体系认证', '标志着公司管理水平迈上新台阶', 1, 
'<p>经过为期三个月的准备和审核，我公司于2024年1月成功通过ISO9001:2015质量管理体系认证。</p>
<p>此次认证涵盖了肉牛养殖、饲料配制、疫病防控等核心业务流程，标志着公司在标准化管理方面达到了国际先进水平。</p>
<p>认证过程中，审核专家对公司的质量管理体系给予了高度评价，特别是在数字化管理、全程追溯等方面的创新做法。</p>
<p>下一步，公司将继续完善质量管理体系，为客户提供更优质的产品和服务。</p>', 
'公司成功通过ISO9001质量管理体系认证，标志着管理水平迈上新台阶', 
'/images/news/iso9001-cert.jpg', 
'ISO9001,质量管理,认证', 1, '系统管理员', 'published', true, 156, '2024-01-15 09:00:00'),

('2024年春季肉牛市场行情分析', '价格稳中有升，养殖效益良好', 2,
'<p>根据最新市场调研数据，2024年春季肉牛市场呈现稳中向好的发展态势。</p>
<p><strong>价格走势：</strong></p>
<ul>
<li>育肥牛出栏价格：28-32元/公斤，较去年同期上涨8%</li>
<li>繁殖母牛价格：15000-18000元/头，保持稳定</li>
<li>犊牛价格：8000-12000元/头，略有上涨</li>
</ul>
<p><strong>市场分析：</strong></p>
<p>消费需求持续增长，特别是高品质牛肉需求旺盛。建议养殖户把握市场机遇，提升养殖技术和管理水平。</p>',
'2024年春季肉牛市场价格稳中有升，养殖效益良好，建议把握市场机遇',
'/images/news/market-analysis.jpg',
'市场行情,价格分析,肉牛', 1, '系统管理员', 'published', false, 89, '2024-01-10 14:30:00'),

('科学饲喂技术培训圆满结束', '提升员工专业技能，保障养殖质量', 1,
'<p>为提升员工专业技能，公司于1月5日-7日举办了为期三天的科学饲喂技术培训。</p>
<p>本次培训邀请了中国农业大学动物科学技术学院的专家教授，围绕营养需求、配方设计、饲喂管理等内容进行了深入讲解。</p>
<p>培训内容包括：</p>
<ul>
<li>肉牛营养需求与饲料配方优化</li>
<li>精准饲喂技术与设备操作</li>
<li>饲料质量控制与安全管理</li>
<li>饲喂效果评估与调整策略</li>
</ul>
<p>通过培训，员工们的专业技能得到显著提升，为公司高质量发展奠定了坚实基础。</p>',
'公司举办科学饲喂技术培训，邀请专家教授授课，提升员工专业技能',
'/images/news/training.jpg',
'培训,饲喂技术,员工技能', 1, '系统管理员', 'published', false, 67, '2024-01-08 16:00:00');

-- 插入新闻评论
INSERT INTO news_comments (article_id, user_name, user_email, content, ip_address, status) VALUES
(1, '张三', 'zhangsan@example.com', '恭喜公司通过认证！这对提升产品质量很有帮助。', '192.168.1.100', 'approved'),
(1, '李四', 'lisi@example.com', '希望公司能继续保持高标准，为消费者提供更好的产品。', '192.168.1.101', 'approved'),
(2, '王五', 'wangwu@example.com', '市场分析很专业，对我们养殖户很有参考价值。', '192.168.1.102', 'approved'),
(3, '赵六', 'zhaoliu@example.com', '培训很有必要，希望能多举办这样的活动。', '192.168.1.103', 'approved');

-- 插入新闻浏览记录（示例数据）
INSERT INTO news_views (article_id, ip_address, user_agent, referer) VALUES
(1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'https://www.google.com'),
(1, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'https://www.baidu.com'),
(2, '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', 'direct'),
(3, '192.168.1.103', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0', 'https://www.bing.com');

-- 插入新闻点赞记录
INSERT INTO news_likes (article_id, ip_address, user_agent) VALUES
(1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(1, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
(2, '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'),
(3, '192.168.1.103', 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0');

-- 插入系统日志示例
INSERT INTO system_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, request_data, response_status) VALUES
(1, 'LOGIN', 'user', 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"username": "admin"}', 200),
(1, 'CREATE', 'cattle', 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"ear_tag": "CN001001", "breed": "西门塔尔"}', 201),
(1, 'UPDATE', 'cattle', 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"weight": 450.5}', 200),
(1, 'DELETE', 'news_article', 999, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '{"id": 999}', 200);