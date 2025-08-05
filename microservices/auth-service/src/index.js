const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'auth-service', 
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'auth-service is running', 
        version: '1.0.0',
        port: PORT
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        service: 'auth-service',
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('[auth-service] Server running on port ' + PORT);
});