import NodeCache from 'node-cache';
import logger from '../utils/logger';

class CacheService {
  private cache: NodeCache;
  
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default TTL
      checkperiod: 60 // Check for expired keys every 60 seconds
    });
  }
  
  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      return this.cache.set(key, value, ttl);
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }
  
  get<T>(key: string): T | undefined {
    try {
      return this.cache.get<T>(key);
    } catch (error) {
      logger.error('Cache get error:', error);
      return undefined;
    }
  }
  
  delete(key: string): number {
    try {
      return this.cache.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
      return 0;
    }
  }
  
  flush(): void {
    try {
      this.cache.flushAll();
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }
}

export default new CacheService();