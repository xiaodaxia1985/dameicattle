import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface CattleAttributes {
  id: number;
  ear_tag: string;
  breed: string;
  gender: 'male' | 'female';
  birth_date?: Date;
  weight?: number;
  health_status: 'healthy' | 'sick' | 'treatment';
  base_id: number;
  barn_id?: number;
  photos?: object;
  parent_male_id?: number;
  parent_female_id?: number;
  source: 'born' | 'purchased' | 'transferred';
  purchase_price?: number;
  purchase_date?: Date;
  supplier_id?: number;
  status: 'active' | 'sold' | 'dead' | 'transferred';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface CattleCreationAttributes extends Optional<CattleAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Cattle extends Model<CattleAttributes, CattleCreationAttributes> implements CattleAttributes {
  public id!: number;
  public ear_tag!: string;
  public breed!: string;
  public gender!: 'male' | 'female';
  public birth_date?: Date;
  public weight?: number;
  public health_status!: 'healthy' | 'sick' | 'treatment';
  public base_id!: number;
  public barn_id?: number;
  public photos?: object;
  public parent_male_id?: number;
  public parent_female_id?: number;
  public source!: 'born' | 'purchased' | 'transferred';
  public purchase_price?: number;
  public purchase_date?: Date;
  public supplier_id?: number;
  public status!: 'active' | 'sold' | 'dead' | 'transferred';
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual fields
  public age_months?: number;
  public age_days?: number;

  public toJSON(): any {
    const values = { ...this.get() };
    
    // Calculate age if birth_date exists
    if (this.birth_date) {
      const now = new Date();
      const birthDate = new Date(this.birth_date);
      const diffTime = Math.abs(now.getTime() - birthDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);
      
      (values as any).age_days = diffDays;
      (values as any).age_months = diffMonths;
    }
    
    return values;
  }
}

Cattle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ear_tag: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true,
      },
    },
    breed: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: false,
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString().split('T')[0], // Cannot be future date
      },
    },
    weight: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 2000, // Maximum weight in kg
      },
    },
    health_status: {
      type: DataTypes.ENUM('healthy', 'sick', 'treatment'),
      allowNull: false,
      defaultValue: 'healthy',
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
    photos: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    parent_male_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'cattle',
        key: 'id',
      },
    },
    parent_female_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'cattle',
        key: 'id',
      },
    },
    source: {
      type: DataTypes.ENUM('born', 'purchased', 'transferred'),
      allowNull: false,
      defaultValue: 'purchased',
    },
    purchase_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    purchase_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'suppliers',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'sold', 'dead', 'transferred'),
      allowNull: false,
      defaultValue: 'active',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'cattle',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['ear_tag'],
        unique: true,
      },
      {
        fields: ['base_id'],
      },
      {
        fields: ['barn_id'],
      },
      {
        fields: ['health_status'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['breed'],
      },
    ],
  }
);