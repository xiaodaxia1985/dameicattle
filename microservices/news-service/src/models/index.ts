import { NewsCategory } from './NewsCategory';
import { NewsArticle } from './NewsArticle';

// 设置模型关联
NewsCategory.hasMany(NewsArticle, { foreignKey: 'categoryId', as: 'articles' });
NewsArticle.belongsTo(NewsCategory, { foreignKey: 'categoryId', as: 'category' });

export {
  NewsCategory,
  NewsArticle
};