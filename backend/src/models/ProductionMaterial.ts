import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface ProductionMaterialAttributes {
  id: number;
  name: string;
  code: string;
  category_id: number;
  unit: string;
  specification?: string;
  supplier_id?: number;
  purchase_price?: number;
  safety_stock: number;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

interface ProductionMaterialCreationAttributes extends Optional<ProductionMaterialAttributes, 'id' | 'safety_stock' | 'status' | 'created_at' | 'updated_at'> {}

export class ProductionMaterial extends Model<ProductionMaterialAttributes, ProductionMaterialCreationAttributes> implements ProductionMaterialAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public category_id!: number;
  public unit!: string;
  public specification?: string;
  public supplier_id?: number;
  public purchase_price?: number;
  public safety_stock!: number;
  public status!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public category?: any;
  public supplier?: any;
  public inventory?: any[];
  public transactions?: any[];
}

ProductionMaterial.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '物资名称',
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '物资编码',
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'material_categories',
        key: 'id',
      },
      comment: '分类ID',
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '单位',
    },
    specification: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '规格说明',
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'suppliers',
        key: 'id',
      },
      comment: '供应商ID',
    },
    purchase_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '采购价格',
    },
    safety_stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '安全库存',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'production_materials',
    timestamps: true,
    underscored: true,
    comment: '生产物资表',
  }
);