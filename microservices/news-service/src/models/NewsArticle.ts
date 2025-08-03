import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface NewsArticleAttributes {
  id: number;
  title: string;
  subtitle?: string;
  categoryId: number;
  content: string;
  summary?: string;
  coverImage?: string;
  images?: object;
  tags?: string;
  authorId?: number;
  authorName?: string;
  status: 'draft' | 'published' | 'archived';
  isFeatured: boolean;
  isTop: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishTime?: Date;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NewsArticleCreationAttributes extends Optional<NewsArticleAttributes, 
  'id' | 'subtitle' | 'summary' | 'coverImage' | 'images' | 'tags' | 'authorId' | 'authorName' | 
  'status' | 'isFeatured' | 'isTop' | 'viewCount' | 'likeCount' | 'commentCount' | 'publishTime' | 
  'seoTitle' | 'seoKeywords' | 'seoDescription' | 'createdAt' | 'updatedAt'> {}

export class NewsArticle extends Model<NewsArticleAttributes, NewsArticleCreationAttributes> implements NewsArticleAttributes {
  public id!: number;
  public title!: string;
  public subtitle?: string;
  public categoryId!: number;
  public content!: string;
  public summary?: string;
  public coverImage?: string;
  public images?: object;
  public tags?: string;
  public authorId?: number;
  public authorName?: string;
  public status!: 'draft' | 'published' | 'archived';
  public isFeatured!: boolean;
  public isTop!: boolean;
  public viewCount!: number;
  public likeCount!: number;
  public commentCount!: number;
  public publishTime?: Date;
  public seoTitle?: string;
  public seoKeywords?: string;
  public seoDescription?: string;
  public createdAt!: Date;
  public updatedAt!: Date;
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
    subtitle: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    tags: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    authorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'draft',
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isTop: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    likeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    commentCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    publishTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    seoTitle: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    seoKeywords: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    seoDescription: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'news_articles',
    timestamps: true,
  }
);