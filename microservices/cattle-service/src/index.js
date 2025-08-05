const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'cattle-service', 
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'cattle-service is running', 
        version: '1.0.0',
        port: PORT
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        service: 'cattle-service',
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('[cattle-service] Server running on port ' + PORT);
});