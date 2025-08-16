-- Insert sales orders test data with correct column names
INSERT INTO sales_orders (order_number, customer_id, base_id, total_amount, tax_amount, discount_amount, status, payment_status, payment_method, order_date, delivery_date, contract_number, remark, created_by) VALUES
('SO-20250815-0001', 1, 1, 52000.00, 2600.00, 0.00, 'approved', 'unpaid', 'Bank Transfer', '2025-08-15', '2025-08-20', 'HT-2025-001', 'Premium Angus Beef', 1),
('SO-20250815-0002', 2, 1, 48000.00, 2400.00, 1000.00, 'pending', 'unpaid', 'Cash', '2025-08-15', '2025-08-18', 'HT-2025-002', 'Chain Store Bulk Purchase', 1),
('SO-20250814-0001', 3, 2, 55000.00, 2750.00, 500.00, 'completed', 'paid', 'Cash on Delivery', '2025-08-14', '2025-08-17', 'HT-2025-003', 'High-end Beef for Restaurants', 1),
('SO-20250813-0001', 1, 2, 82500.00, 4125.00, 2500.00, 'delivered', 'partial', 'Bank Transfer', '2025-08-13', '2025-08-16', 'HT-2025-004', 'Large Volume Order for Processing', 1),
('SO-20250812-0001', 1, 1, 26000.00, 1300.00, 0.00, 'approved', 'unpaid', 'Cash', '2025-08-12', '2025-08-15', NULL, 'Premium Beef for Individual Customer', 1)
ON CONFLICT (order_number) DO NOTHING;

-- Verify data insertion results
SELECT 'sales_orders' as table_name, COUNT(*) as record_count FROM sales_orders;