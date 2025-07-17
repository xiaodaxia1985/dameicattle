import { sequelize } from '@/config/database';
import { redisClient } from '@/config/redis';

// Setup test database
beforeAll(async () => {
  // Connect to test database
  await sequelize.authenticate();
  
  // Sync database models for testing
  await sequelize.sync({ force: true });
});

// Cleanup after tests
afterAll(async () => {
  // Close database connection
  await sequelize.close();
  
  // Close Redis connection
  await redisClient.quit();
});

// Clean up between tests
beforeEach(async () => {
  // Clear Redis cache
  await redisClient.flushDb();
});