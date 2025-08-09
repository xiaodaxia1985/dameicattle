const express = require('express');
const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

// Health check endpoint (direct access)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'base-service',
    name: 'Base Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for API Gateway
app.get('/api/v1/base/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'base-service',
    name: 'Base Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Base Service API',
    service: 'base-service',
    version: '1.0.0',
    endpoints: ['/health', '/api/v1/base/health', '/api/status']
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    service: 'base-service',
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// API v1 base routes
app.get('/api/v1/base/status', (req, res) => {
  res.json({
    service: 'base-service',
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    service: 'base-service',
    path: req.originalUrl
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`base-service listening on port ${port}`);
});
