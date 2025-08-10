import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface NewsArticleAttributes {
  id: number;
  title: string;
  summary?: string;
  content: string;
  category_id?: number;
  cover_image?: string;
  tags?: string;
  author_id?: number;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

interface NewsArticleCreationAttributes extends Optional<NewsArticleAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class NewsArticle extends Model<NewsArticleAttributes, NewsArticleCreationAttributes> implements NewsArticleAttributes {
  public id!: number;
  public title!: string;
  public summary?: string;
  public content!: string;
  public category_id?: number;
  public cover_image?: string;
  public tags?: string;
  public author_id?: number;
  public status!: 'draft' | 'published' | 'archived';
  public is_featured!: boolean;
  public view_count!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

NewsArticle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cover_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    tags: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'news_articles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['category_id'],
      },
      {
        fields: ['author_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['is_featured'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);