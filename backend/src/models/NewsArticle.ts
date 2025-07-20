import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface NewsArticleAttributes {
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

class NewsArticle extends Model<NewsArticleAttributes, NewsArticleCreationAttributes> implements NewsArticleAttributes {
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
      field: 'category_id',
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
      field: 'cover_image',
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
      field: 'author_id',
    },
    authorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'author_name',
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
      field: 'is_featured',
    },
    isTop: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_top',
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'view_count',
    },
    likeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'like_count',
    },
    commentCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'comment_count',
    },
    publishTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'publish_time',
    },
    seoTitle: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'seo_title',
    },
    seoKeywords: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'seo_keywords',
    },
    seoDescription: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'seo_description',
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
    tableName: 'news_articles',
    timestamps: true,
    underscored: true,
  }
);

export { NewsArticle, NewsArticleAttributes, NewsArticleCreationAttributes };