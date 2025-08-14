-- 添加订单状态流转字段到 procurement_orders 表
-- 执行时间: 2024-08-15

-- 添加交付相关字段
ALTER TABLE procurement_orders 
ADD COLUMN IF NOT EXISTS "deliveredBy" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "deliveredByName" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "deliveryNote" TEXT;

-- 添加付款相关字段
ALTER TABLE procurement_orders 
ADD COLUMN IF NOT EXISTS "paidBy" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "paidByName" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "paidAmount" DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "paymentNote" TEXT;

-- 添加完成相关字段
ALTER TABLE procurement_orders 
ADD COLUMN IF NOT EXISTS "completedBy" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "completedByName" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "completionNote" TEXT;

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'procurement_orders' 
AND column_name IN (
    'deliveredBy', 'deliveredByName', 'deliveredAt', 'deliveryNote',
    'paidBy', 'paidByName', 'paidAt', 'paidAmount', 'paymentNote',
    'completedBy', 'completedByName', 'completedAt', 'completionNote'
)
ORDER BY column_name;