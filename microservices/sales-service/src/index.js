const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3009;

app.use(cors());
app.use(express.json());

// 鍋ュ悍妫€鏌ョ鐐?
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'sales-service', timestamp: new Date().toISOString() });
});

// 鍩虹璺敱
app.get('/', (req, res) => {
    res.json({ message: 'sales-service is running', version: '1.0.0' });
});

app.listen(PORT, () => {
    console.log('[sales-service] Server running on port ' + PORT);
});

