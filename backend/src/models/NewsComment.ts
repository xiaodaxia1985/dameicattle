import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface NewsCommentAttributes {
  id: number;
  articleId: number;
  parentId?: number;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  content: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  isAdminReply: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface NewsCommentCreationAttributes extends Optional<NewsCommentAttributes, 
  'id' | 'parentId' | 'userEmail' | 'userPhone' | 'ipAddress' | 'userAgent' | 'status' | 'isAdminReply' | 'createdAt' | 'updatedAt'> {}

class NewsComment extends Model<NewsCommentAttributes, NewsCommentCreationAttributes> implements NewsCommentAttributes {
  public id!: number;
  public articleId!: number;
  public parentId?: number;
  public userName!: string;
  public userEmail?: string;
  public userPhone?: string;
  public content!: string;
  public ipAddress?: string;
  public userAgent?: string;
  public status!: 'pending' | 'approved' | 'rejected' | 'deleted';
  public isAdminReply!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

NewsComment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    articleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'article_id',
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_id',
    },
    userName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'user_name',
    },
    userEmail: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'user_email',
    },
    userPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'user_phone',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
    },
    isAdminReply: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_admin_reply',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'news_comments',
    timestamps: true,
    underscored: true,
  }
);

export { NewsComment, NewsCommentAttributes, NewsCommentCreationAttributes };