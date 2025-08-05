const express = require('express');
const app = express();
const port = process.env.PORT || 3009;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'material-service',
    name: 'Material Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Material Service API',
    service: 'material-service',
    version: '1.0.0',
    endpoints: ['/health', '/api/status']
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    service: 'material-service',
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
    service: 'material-service',
    path: req.originalUrl
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`material-service listening on port ${port}`);
});
