const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limit for images and base64 data
app.use(express.static('.')); // Serve static frontend files

/**
 * Proxy Endpoint for Gemini 2.0 Flash
 */
app.post('/api/analyze', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('SERVER ERROR: Missing GEMINI_API_KEY in environment');
        return res.status(500).json({ error: { message: "Critical Server Error: GEMINI_API_KEY not configured on backend." } });
    }

    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`[INFO] Forwarding triage request to ${model}...`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('[GEMINI ERROR]', data);
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('[PROXY ERROR]', error);
        res.status(500).json({ error: { message: "Internal server error connecting to AI service." } });
    }
});

// Serve index.html as fallback for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[SUCCESS] RescueIQ Server active at: http://localhost:${PORT}`);
    console.log(`[READY] Using API Key: ${process.env.GEMINI_API_KEY ? '****' + process.env.GEMINI_API_KEY.slice(-4) : 'NOT CONFIGURED'}`);
});
