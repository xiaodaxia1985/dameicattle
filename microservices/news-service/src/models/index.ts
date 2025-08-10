import { NewsArticle } from './NewsArticle';
import { NewsCategory } from './NewsCategory';
import { User } from './User';

// Define associations
NewsArticle.belongsTo(NewsCategory, { as: 'category', foreignKey: 'category_id' });
NewsCategory.hasMany(NewsArticle, { as: 'articles', foreignKey: 'category_id' });

NewsArticle.belongsTo(User, { as: 'author', foreignKey: 'author_id' });
User.hasMany(NewsArticle, { as: 'articles', foreignKey: 'author_id' });

export { NewsArticle, NewsCategory, User };