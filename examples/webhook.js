#!/usr/bin/env node

/**
 * VerifiedSMS JS SDK — Webhook Receiver Example (Express)
 */

const express = require('express');
const { VerifiedSMS } = require('../src');

const app = express();
const WEBHOOK_SECRET = 'YOUR_WEBHOOK_SECRET';

// Parse raw body for signature verification
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const payload = req.body.toString();
    const signature = req.headers['x-verifiedsms-signature'] || '';

    // Verify HMAC-SHA256 signature
    if (!VerifiedSMS.verifyWebhook(payload, signature, WEBHOOK_SECRET)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    const data = JSON.parse(payload);

    console.log(`[${data.timestamp}] Event: ${data.event} | Message: ${data.message_id} | Status: ${data.status}`);

    // Process based on status
    switch (data.status) {
        case 'delivered':
            // Update your database
            break;
        case 'failed':
            // Handle failure
            break;
    }

    res.sendStatus(200);
});

app.listen(3000, () => {
    console.log('Webhook server running on port 3000');
});
