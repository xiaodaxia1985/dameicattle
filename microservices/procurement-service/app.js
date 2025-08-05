const express = require('express');
const app = express();
const port = process.env.PORT || 3007;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'procurement-service',
    name: 'Procurement Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Procurement Service API',
    service: 'procurement-service',
    version: '1.0.0',
    endpoints: ['/health', '/api/status']
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    service: 'procurement-service',
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
    service: 'procurement-service',
    path: req.originalUrl
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`procurement-service listening on port ${port}`);
});
