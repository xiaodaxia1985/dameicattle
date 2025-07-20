export interface MaterialCategory {
  id: number
  name: string
  code: string
  description?: string
  parent_id?: number
  created_at: string
  updated_at: string
  children?: MaterialCategory[]
  parent?: MaterialCategory
}

export interface Supplier {
  id: number
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  rating: number
  supplier_type: string
  business_license?: string
  tax_number?: string
  bank_account?: string
  credit_limit: number
  payment_terms?: string
  created_at: string
  updated_at: string
}

export interface ProductionMaterial {
  id: number
  name: string
  code: string
  category_id: number
  unit: string
  specification?: string
  supplier_id?: number
  purchase_price?: number
  safety_stock: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  category?: MaterialCategory
  supplier?: Supplier
  current_stock?: number
  inventory_value?: number
}

export interface Inventory {
  id: number
  material_id: number
  base_id: number
  current_stock: number
  reserved_stock: number
  last_updated: string
  material?: ProductionMaterial
  base?: {
    id: number
    name: string
    code: string
  }
}

export interface InventoryTransaction {
  id: number
  material_id: number
  base_id: number
  transaction_type: 'inbound' | 'outbound' | 'transfer' | 'adjustment'
  quantity: number
  unit_price?: number
  reference_type?: string
  reference_id?: number
  batch_number?: string
  expiry_date?: string
  operator_id: number
  remark?: string
  transaction_date: string
  material?: ProductionMaterial
  base?: {
    id: number
    name: string
    code: string
  }
  operator?: {
    id: number
    real_name: string
  }
}

export interface InventoryAlert {
  id: number
  material_id: number
  base_id: number
  alert_type: 'low_stock' | 'expired' | 'quality_issue'
  alert_level: 'low' | 'medium' | 'high'
  message: string
  is_resolved: boolean
  resolved_at?: string
  created_at: string
  material?: ProductionMaterial
  base?: {
    id: number
    name: string
    code: string
  }
}

export interface MaterialListParams {
  page?: number
  limit?: number
  keyword?: string
  category_id?: number
  supplier_id?: number
  base_id?: number
  status?: string
}

export interface InventoryListParams {
  page?: number
  limit?: number
  keyword?: string
  material_id?: number
  base_id?: number
  low_stock_only?: boolean
}

export interface TransactionListParams {
  page?: number
  limit?: number
  material_id?: number
  base_id?: number
  transaction_type?: string
  start_date?: string
  end_date?: string
}

export interface CreateMaterialCategoryRequest {
  name: string
  code: string
  description?: string
  parent_id?: number
}

export interface UpdateMaterialCategoryRequest extends Partial<CreateMaterialCategoryRequest> {}

export interface CreateSupplierRequest {
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  rating?: number
  supplier_type: string
  business_license?: string
  tax_number?: string
  bank_account?: string
  credit_limit?: number
  payment_terms?: string
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {}

export interface CreateProductionMaterialRequest {
  name: string
  code: string
  category_id: number
  unit: string
  specification?: string
  supplier_id?: number
  purchase_price?: number
  safety_stock?: number
}

export interface UpdateProductionMaterialRequest extends Partial<CreateProductionMaterialRequest> {}

export interface CreateInventoryTransactionRequest {
  material_id: number
  base_id: number
  transaction_type: 'inbound' | 'outbound' | 'transfer' | 'adjustment'
  quantity: number
  unit_price?: number
  reference_type?: string
  reference_id?: number
  batch_number?: string
  expiry_date?: string
  remark?: string
}

export interface InventoryStatistics {
  total_materials: number
  total_value: number
  low_stock_count: number
  alert_count: number
  categories_count: number
  suppliers_count: number
}