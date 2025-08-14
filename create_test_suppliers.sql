-- Create test supplier data
INSERT INTO suppliers (
  name, 
  "contactPerson", 
  phone, 
  email, 
  address, 
  "supplierType", 
  "businessLicense", 
  "taxNumber", 
  "bankAccount", 
  "creditLimit", 
  "paymentTerms", 
  rating, 
  status, 
  remark, 
  "createdBy", 
  "createdByName", 
  "createdAt", 
  "updatedAt"
) VALUES 
('Guizhou Quality Cattle Supplier', 'Manager Zhang', '13888888888', 'zhang@supplier.com', 'Guiyang, Guizhou', 'cattle', 'BL001', 'TX001', 'BA001', 1000000, 'Monthly 30 days', 5, 'active', 'Quality supplier', 1, 'Admin', NOW(), NOW()),
('Southwest Material Supply Co.', 'Director Li', '13999999999', 'li@material.com', 'Chengdu, Sichuan', 'material', 'BL002', 'TX002', 'BA002', 500000, 'Cash settlement', 4, 'active', 'Material supplier', 1, 'Admin', NOW(), NOW()),
('Agricultural Equipment Ltd.', 'Manager Wang', '13777777777', 'wang@equipment.com', 'Yubei, Chongqing', 'equipment', 'BL003', 'TX003', 'BA003', 800000, 'Installment payment', 4, 'active', 'Equipment supplier', 1, 'Admin', NOW(), NOW());