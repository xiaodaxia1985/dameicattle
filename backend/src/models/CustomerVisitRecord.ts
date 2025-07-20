import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface CustomerVisitRecordAttributes {
  id: number;
  customer_id: number;
  visit_date: Date;
  visit_type: string;
  visitor_id: number;
  purpose: string;
  content: string;
  result?: string;
  next_visit_date?: Date;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

interface CustomerVisitRecordCreationAttributes extends Optional<CustomerVisitRecordAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> {}

export class CustomerVisitRecord extends Model<CustomerVisitRecordAttributes, CustomerVisitRecordCreationAttributes> implements CustomerVisitRecordAttributes {
  public id!: number;
  public customer_id!: number;
  public visit_date!: Date;
  public visit_type!: string;
  public visitor_id!: number;
  public purpose!: string;
  public content!: string;
  public result?: string;
  public next_visit_date?: Date;
  public status!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public customer?: any;
  public visitor?: any;
}

CustomerVisitRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '客户ID',
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    visit_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '回访日期',
    },
    visit_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '回访类型：电话回访、实地拜访、邮件回访',
    },
    visitor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '回访人员ID',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    purpose: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '回访目的',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '回访内容',
    },
    result: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '回访结果',
    },
    next_visit_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '下次回访日期',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'completed',
      comment: '状态：planned, completed, cancelled',
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
    tableName: 'customer_visit_records',
    timestamps: true,
    underscored: true,
    comment: '客户回访记录表',
  }
);