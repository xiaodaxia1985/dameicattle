const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 鍋ュ悍妫€鏌ョ鐐?
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// 鍩虹璺敱
app.get('/', (req, res) => {
    res.json({ message: 'api-gateway is running', version: '1.0.0' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('[api-gateway] Server running on port ' + PORT);
});

