const http = require('http');
const url = require('url');

const port = process.env.PORT || 3007;
const serviceName = 'procurement-service';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      service: serviceName,
      port: port,
      timestamp: new Date().toISOString()
    }));
  } else if (path === '/' || path === '/api/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      service: serviceName,
      status: 'running',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Route not found',
      service: serviceName,
      path: path
    }));
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log('Mock ' + serviceName + ' listening on port ' + port);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

