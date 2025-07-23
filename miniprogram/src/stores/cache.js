// Simple cache utility without pinia
export const cacheStore = {
  // Default cache time (milliseconds)
  DEFAULT_CACHE_TIME: 30 * 60 * 1000, // 30 minutes
  OFFLINE_CACHE_TIME: 24 * 60 * 60 * 1000, // 24 hours

  // Set cache data with expiration
  setCacheData(key, data, expirationMinutes = 30) {
    const item = {
      data,
      expiry: Date.now() + expirationMinutes * 60 * 1000,
      timestamp: Date.now()
    };
    try {
      uni.setStorageSync(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Error setting cache data:', error);
    }
  },

  // Get cache data if not expired
  getCacheData(key, allowExpired = false) {
    try {
      const item = JSON.parse(uni.getStorageSync(`cache_${key}`) || '{}');
      if (!item.data) return null;
      
      if (allowExpired || !item.expiry || item.expiry > Date.now()) {
        return item.data;
      }
      
      // Remove expired cache
      uni.removeStorageSync(`cache_${key}`);
      return null;
    } catch (error) {
      console.error('Error getting cache data:', error);
      return null;
    }
  },

  // Check if cache is valid
  isCacheValid(key) {
    try {
      const item = JSON.parse(uni.getStorageSync(`cache_${key}`) || '{}');
      return item.data && (!item.expiry || item.expiry > Date.now());
    } catch (error) {
      return false;
    }
  },

  // Remove cache data
  removeCacheData(key) {
    try {
      uni.removeStorageSync(`cache_${key}`);
    } catch (error) {
      console.error('Error removing cache data:', error);
    }
  },

  // Clear all cache data
  clearAllCache() {
    try {
      const storageInfo = uni.getStorageInfoSync();
      storageInfo.keys.forEach(key => {
        if (key.startsWith('cache_')) {
          uni.removeStorageSync(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  // Clean expired cache
  cleanExpiredCache() {
    try {
      const now = Date.now();
      const storageInfo = uni.getStorageInfoSync();
      
      storageInfo.keys.forEach(key => {
        if (key.startsWith('cache_')) {
          try {
            const item = JSON.parse(uni.getStorageSync(key) || '{}');
            if (item.expiry && now >= item.expiry) {
              uni.removeStorageSync(key);
            }
          } catch (error) {
            // Remove corrupted cache
            uni.removeStorageSync(key);
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning expired cache:', error);
    }
  },

  // Get cache statistics
  getCacheStats() {
    try {
      const storageInfo = uni.getStorageInfoSync();
      const cacheKeys = storageInfo.keys.filter(key => key.startsWith('cache_'));
      
      return {
        cacheCount: cacheKeys.length,
        totalSize: storageInfo.currentSize,
        keys: cacheKeys
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { cacheCount: 0, totalSize: 0, keys: [] };
    }
  }
}