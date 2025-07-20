import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProductionEquipmentAttributes {
  id: number;
  name: string;
  code: string;
  category_id: number;
  base_id: number;
  barn_id?: number;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: Date;
  purchase_price?: number;
  warranty_period?: number;
  installation_date?: Date;
  status: string;
  location?: string;
  specifications?: object;
  photos?: object;
  created_at?: Date;
  updated_at?: Date;
}

interface ProductionEquipmentCreationAttributes extends Optional<ProductionEquipmentAttributes, 'id' | 'created_at' | 'updated_at'> {}

class ProductionEquipment extends Model<ProductionEquipmentAttributes, ProductionEquipmentCreationAttributes> implements ProductionEquipmentAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public category_id!: number;
  public base_id!: number;
  public barn_id?: number;
  public brand?: string;
  public model?: string;
  public serial_number?: string;
  public purchase_date?: Date;
  public purchase_price?: number;
  public warranty_period?: number;
  public installation_date?: Date;
  public status!: string;
  public location?: string;
  public specifications?: object;
  public photos?: object;
  public created_at?: Date;
  public updated_at?: Date;

  public toJSON(): any {
    const values = { ...this.get() };
    return values;
  }
}

ProductionEquipment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'equipment_categories',
        key: 'id',
      },
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bases',
        key: 'id',
      },
    },
    barn_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'barns',
        key: 'id',
      },
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    serial_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    purchase_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    purchase_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    warranty_period: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    installation_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'normal',
      validate: {
        isIn: [['normal', 'maintenance', 'broken', 'retired']],
      },
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    specifications: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    photos: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'production_equipment',
    timestamps: true,
    underscored: true,
  }
);

export default ProductionEquipment;