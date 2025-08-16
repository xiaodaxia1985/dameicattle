-- Insert sales orders test data
INSERT INTO sales_orders ("orderNumber", "customerId", "customerName", "baseId", "baseName", "totalAmount", "taxAmount", "discountAmount", status, "paymentStatus", "paymentMethod", "orderDate", "expectedDeliveryDate", "contractNumber", remark, "createdBy", "createdByName") VALUES
('SO-20250815-0001', 1, 'Beijing Quality Meat Co Ltd', 1, 'Main Base', 52000.00, 2600.00, 0.00, 'approved', 'unpaid', 'Bank Transfer', '2025-08-15 10:00:00+08', '2025-08-20 10:00:00+08', 'HT-2025-001', 'Premium Angus Beef', 'admin', 'Administrator'),
('SO-20250815-0002', 2, 'Shanghai Fresh Meat Chain', 1, 'Main Base', 48000.00, 2400.00, 1000.00, 'pending', 'unpaid', 'Cash', '2025-08-15 14:00:00+08', '2025-08-18 14:00:00+08', 'HT-2025-002', 'Chain Store Bulk Purchase', 'admin', 'Administrator'),
('SO-20250814-0001', 3, 'Tianjin Catering Group', 2, 'Branch Base A', 55000.00, 2750.00, 500.00, 'completed', 'paid', 'Cash on Delivery', '2025-08-14 09:00:00+08', '2025-08-17 09:00:00+08', 'HT-2025-003', 'High-end Beef for Restaurants', 'admin', 'Administrator'),
('SO-20250813-0001', 4, 'Hebei Meat Processing Plant', 2, 'Branch Base A', 82500.00, 4125.00, 2500.00, 'delivered', 'partial', 'Bank Transfer', '2025-08-13 11:00:00+08', '2025-08-16 11:00:00+08', 'HT-2025-004', 'Large Volume Order for Processing', 'admin', 'Administrator'),
('SO-20250812-0001', 5, 'Individual Customer - Mr Chen', 1, 'Main Base', 26000.00, 1300.00, 0.00, 'approved', 'unpaid', 'Cash', '2025-08-12 16:00:00+08', '2025-08-15 16:00:00+08', NULL, 'Premium Beef for Individual Customer', 'admin', 'Administrator')
ON CONFLICT ("orderNumber") DO NOTHING;

-- Insert sales order items test data
INSERT INTO sales_order_items ("orderId", "cattleId", "earTag", breed, weight, "unitPrice", "totalPrice", "qualityGrade", "healthCertificate", "quarantineCertificate", "deliveryStatus", remark) VALUES
(1, 1, 'C001', 'Angus', 520.50, 50.00, 26025.00, 'Grade A', 'HC-2025-001', 'QC-2025-001', 'pending', 'Premium Angus Beef'),
(1, 2, 'C002', 'Angus', 510.00, 50.00, 25500.00, 'Grade A', 'HC-2025-002', 'QC-2025-002', 'pending', 'Same Batch Angus'),
(2, 3, 'C003', 'Simmental', 480.00, 48.00, 23040.00, 'Grade B', 'HC-2025-003', 'QC-2025-003', 'pending', 'Simmental for Retail'),
(2, 4, 'C004', 'Simmental', 490.00, 48.00, 23520.00, 'Grade B', 'HC-2025-004', 'QC-2025-004', 'pending', 'Same Batch Simmental'),
(3, 5, 'C005', 'Charolais', 550.00, 52.00, 28600.00, 'Grade A', 'HC-2025-005', 'QC-2025-005', 'delivered', 'Charolais for Restaurant'),
(3, 6, 'C006', 'Charolais', 530.00, 52.00, 27560.00, 'Grade A', 'HC-2025-006', 'QC-2025-006', 'delivered', 'Same Batch Charolais'),
(4, 7, 'C007', 'Limousin', 600.00, 45.00, 27000.00, 'Grade B', 'HC-2025-007', 'QC-2025-007', 'delivered', 'Limousin for Processing'),
(4, 8, 'C008', 'Limousin', 580.00, 45.00, 26100.00, 'Grade B', 'HC-2025-008', 'QC-2025-008', 'delivered', 'Same Batch Limousin'),
(4, 9, 'C009', 'Limousin', 620.00, 45.00, 27900.00, 'Grade B', 'HC-2025-009', 'QC-2025-009', 'delivered', 'Same Batch Limousin'),
(5, 10, 'C010', 'Wagyu', 500.00, 80.00, 40000.00, 'Grade S', 'HC-2025-010', 'QC-2025-010', 'pending', 'Premium Wagyu for Individual')
ON CONFLICT DO NOTHING;

-- Insert customer visit records test data
INSERT INTO customer_visit_records ("customerId", "visitDate", "visitType", "visitorId", "visitorName", purpose, content, result, "nextVisitDate", status) VALUES
(1, '2025-08-10 10:00:00+08', 'visit', 'admin', 'Administrator', 'Business Visit', 'Visit Beijing Quality Meat to understand recent purchasing needs', 'Customer satisfied with quality, planning to increase orders', '2025-09-10 10:00:00+08', 'completed'),
(1, '2025-07-15 14:00:00+08', 'phone', 'admin', 'Administrator', 'Order Follow-up', 'Phone follow-up on last month order execution', 'Order delivered on time, customer satisfied', NULL, 'completed'),
(2, '2025-08-05 16:00:00+08', 'email', 'admin', 'Administrator', 'Product Introduction', 'Email introduction of new beef products', 'Customer interested, requested samples', '2025-08-25 16:00:00+08', 'completed'),
(3, '2025-07-20 09:00:00+08', 'visit', 'admin', 'Administrator', 'Cooperation Discussion', 'On-site visit to discuss long-term cooperation', 'Reached annual purchase agreement', '2025-10-20 09:00:00+08', 'completed'),
(4, '2025-08-01 11:00:00+08', 'phone', 'admin', 'Administrator', 'Price Negotiation', 'Phone negotiation for bulk purchase pricing', 'Reached price agreement', NULL, 'completed'),
(5, '2025-08-08 15:00:00+08', 'visit', 'admin', 'Administrator', 'Service Follow-up', 'Follow-up visit for product experience', 'Customer very satisfied, recommended to friends', '2025-11-08 15:00:00+08', 'completed')
ON CONFLICT DO NOTHING;

-- Verify data insertion results
SELECT 'sales_orders' as table_name, COUNT(*) as record_count FROM sales_orders
UNION ALL
SELECT 'sales_order_items' as table_name, COUNT(*) as record_count FROM sales_order_items
UNION ALL
SELECT 'customer_visit_records' as table_name, COUNT(*) as record_count FROM customer_visit_records;