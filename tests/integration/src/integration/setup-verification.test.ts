import axios from 'axios';
import { TEST_CONFIG } from '../setup';

describe('Integration Test Setup Verification', () => {
  test('should have valid test configuration', () => {
    expect(TEST_CONFIG).toBeDefined();
    expect(TEST_CONFIG.backend.baseURL).toBe('http://localhost:3000');
    expect(TEST_CONFIG.frontend.baseURL).toBe('http://localhost:5173');
    expect(TEST_CONFIG.database.host).toBe('localhost');
    expect(TEST_CONFIG.redis.host).toBe('localhost');
  });

  test('should be able to create axios instance', () => {
    const client = axios.create({
      baseURL: TEST_CONFIG.backend.baseURL,
      timeout: TEST_CONFIG.backend.timeout,
    });

    expect(client).toBeDefined();
    expect(client.defaults.baseURL).toBe(TEST_CONFIG.backend.baseURL);
  });

  test('should have test utilities available', async () => {
    const { createTestUser, loginTestUser, delay, retry } = await import('../setup');
    
    expect(typeof createTestUser).toBe('function');
    expect(typeof loginTestUser).toBe('function');
    expect(typeof delay).toBe('function');
    expect(typeof retry).toBe('function');
  });

  test('delay utility should work correctly', async () => {
    const { delay } = await import('../setup');
    
    const startTime = Date.now();
    await delay(100);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeGreaterThanOrEqual(90);
    expect(endTime - startTime).toBeLessThan(200);
  });

  test('retry utility should work correctly', async () => {
    const { retry } = await import('../setup');
    
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Test error');
      }
      return 'success';
    };

    const result = await retry(operation, 3, 10);
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  test('retry utility should fail after max attempts', async () => {
    const { retry } = await import('../setup');
    
    const operation = async () => {
      throw new Error('Persistent error');
    };

    await expect(retry(operation, 2, 10)).rejects.toThrow('Persistent error');
  });
});