import request from 'supertest';
import app from '@/app';

describe('Base API Simple Test', () => {
  const mockToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQxMDgxNjAwfQ.test';

  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
  });

  it('should return 401 for unauthenticated base requests', async () => {
    const response = await request(app)
      .get('/api/v1/bases')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should handle base creation endpoint structure', async () => {
    // This test just checks if the endpoint exists and handles auth properly
    const response = await request(app)
      .post('/api/v1/bases')
      .send({
        name: 'Test Base',
        code: 'TB001'
      });

    // Should return 401 (unauthorized) since no token provided
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});