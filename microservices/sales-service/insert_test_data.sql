-- 插入销售订单测试数据
INSERT INTO sales_orders ("orderNumber", "customerId", "customerName", "baseId", "baseName", "totalAmount", "taxAmount", "discountAmount", status, "paymentStatus", "paymentMethod", "orderDate", "expectedDeliveryDate", "contractNumber", remark, "createdBy", "createdByName") VALUES
('SO-20250815-0001', 1, '北京优质肉业有限公司', 1, '主基地', 52000.00, 2600.00, 0.00, 'approved', 'unpaid', '银行转账', '2025-08-15 10:00:00+08', '2025-08-20 10:00:00+08', 'HT-2025-001', '优质安格斯牛，客户指定品种', 'admin', '管理员'),
('SO-20250815-0002', 2, '上海鲜肉连锁超市', 1, '主基地', 48000.00, 2400.00, 1000.00, 'pending', 'unpaid', '现金', '2025-08-15 14:00:00+08', '2025-08-18 14:00:00+08', 'HT-2025-002', '连锁超市批量采购', 'admin', '管理员'),
('SO-20250814-0001', 3, '天津餐饮集团', 2, '分基地A', 55000.00, 2750.00, 500.00, 'completed', 'paid', '货到付款', '2025-08-14 09:00:00+08', '2025-08-17 09:00:00+08', 'HT-2025-003', '餐饮集团高端牛肉需求', 'admin', '管理员'),
('SO-20250813-0001', 4, '河北肉类加工厂', 2, '分基地A', 82500.00, 4125.00, 2500.00, 'delivered', 'partial', '银行转账', '2025-08-13 11:00:00+08', '2025-08-16 11:00:00+08', 'HT-2025-004', '加工厂大批量订单', 'admin', '管理员'),
('SO-20250812-0001', 5, '个人客户-陈先生', 1, '主基地', 26000.00, 1300.00, 0.00, 'approved', 'unpaid', '现金', '2025-08-12 16:00:00+08', '2025-08-15 16:00:00+08', NULL, '个人客户精品牛肉', 'admin', '管理员')
ON CONFLICT ("orderNumber") DO NOTHING;

-- 插入销售订单明细测试数据
INSERT INTO sales_order_items ("orderId", "cattleId", "earTag", breed, weight, "unitPrice", "totalPrice", "qualityGrade", "healthCertificate", "quarantineCertificate", "deliveryStatus", remark) VALUES
(1, 1, 'C001', '安格斯牛', 520.50, 50.00, 26025.00, 'A级', 'HC-2025-001', 'QC-2025-001', 'pending', '优质安格斯牛，肉质鲜美'),
(1, 2, 'C002', '安格斯牛', 510.00, 50.00, 25500.00, 'A级', 'HC-2025-002', 'QC-2025-002', 'pending', '同批次安格斯牛'),
(2, 3, 'C003', '西门塔尔牛', 480.00, 48.00, 23040.00, 'B级', 'HC-2025-003', 'QC-2025-003', 'pending', '西门塔尔牛，适合超市销售'),
(2, 4, 'C004', '西门塔尔牛', 490.00, 48.00, 23520.00, 'B级', 'HC-2025-004', 'QC-2025-004', 'pending', '同批次西门塔尔牛'),
(3, 5, 'C005', '夏洛莱牛', 550.00, 52.00, 28600.00, 'A级', 'HC-2025-005', 'QC-2025-005', 'delivered', '夏洛莱牛，餐饮专用'),
(3, 6, 'C006', '夏洛莱牛', 530.00, 52.00, 27560.00, 'A级', 'HC-2025-006', 'QC-2025-006', 'delivered', '同批次夏洛莱牛'),
(4, 7, 'C007', '利木赞牛', 600.00, 45.00, 27000.00, 'B级', 'HC-2025-007', 'QC-2025-007', 'delivered', '利木赞牛，加工专用'),
(4, 8, 'C008', '利木赞牛', 580.00, 45.00, 26100.00, 'B级', 'HC-2025-008', 'QC-2025-008', 'delivered', '同批次利木赞牛'),
(4, 9, 'C009', '利木赞牛', 620.00, 45.00, 27900.00, 'B级', 'HC-2025-009', 'QC-2025-009', 'delivered', '同批次利木赞牛'),
(5, 10, 'C010', '和牛', 500.00, 80.00, 40000.00, 'S级', 'HC-2025-010', 'QC-2025-010', 'pending', '顶级和牛，个人客户专享')
ON CONFLICT DO NOTHING;

-- 插入客户回访记录测试数据
INSERT INTO customer_visit_records ("customerId", "visitDate", "visitType", "visitorId", "visitorName", purpose, content, result, "nextVisitDate", status) VALUES
(1, '2025-08-10 10:00:00+08', 'visit', 'admin', '管理员', '商务拜访', '拜访北京优质肉业，了解近期采购需求和市场反馈', '客户对产品质量满意，计划增加订单量', '2025-09-10 10:00:00+08', 'completed'),
(1, '2025-07-15 14:00:00+08', 'phone', 'admin', '管理员', '订单跟进', '电话跟进上月订单执行情况', '订单按时交付，客户满意', NULL, 'completed'),
(2, '2025-08-05 16:00:00+08', 'email', 'admin', '管理员', '产品推介', '邮件推介新品种牛肉产品', '客户表示感兴趣，要求提供样品', '2025-08-25 16:00:00+08', 'completed'),
(3, '2025-07-20 09:00:00+08', 'visit', 'admin', '管理员', '合作洽谈', '实地拜访天津餐饮集团，洽谈长期合作', '达成年度采购协议，建立长期合作关系', '2025-10-20 09:00:00+08', 'completed'),
(4, '2025-08-01 11:00:00+08', 'phone', 'admin', '管理员', '价格协商', '电话协商批量采购价格', '达成价格协议，客户同意新的定价方案', NULL, 'completed'),
(5, '2025-08-08 15:00:00+08', 'visit', 'admin', '管理员', '服务回访', '回访个人客户，了解产品使用体验', '客户对产品质量非常满意，推荐给朋友', '2025-11-08 15:00:00+08', 'completed')
ON CONFLICT DO NOTHING;

-- 验证数据插入结果
SELECT 'sales_orders' as table_name, COUNT(*) as record_count FROM sales_orders
UNION ALL
SELECT 'sales_order_items' as table_name, COUNT(*) as record_count FROM sales_order_items
UNION ALL
SELECT 'customer_visit_records' as table_name, COUNT(*) as record_count FROM customer_visit_records;