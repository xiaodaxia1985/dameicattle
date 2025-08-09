const express = require('express');
const app = express();
const port = process.env.PORT || 3013;

app.use(express.json());

// Health check endpoint (direct access)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'news-service',
    name: 'News Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for API Gateway
app.get('/api/v1/news/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'news-service',
    name: 'News Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'News Service API',
    service: 'news-service',
    version: '1.0.0',
    endpoints: ['/health', '/api/v1/news/health', '/api/status']
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    service: 'news-service',
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// API v1 news routes
app.get('/api/v1/news/status', (req, res) => {
  res.json({
    service: 'news-service',
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
    service: 'news-service',
    path: req.originalUrl
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`news-service listening on port ${port}`);
});
