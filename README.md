# VerifiedSMS JavaScript/Node.js SDK

## Installation

```bash
npm install @verifiedsms/js
```

## Quick Start

```javascript
import { VerifiedSMS } from '@verifiedsms/js';

const client = new VerifiedSMS('YOUR_API_KEY');

// Send SMS
const result = await client.send('98XXXXXXXX', 'Your OTP is 123456');
console.log(result.message_id); // UUID

// Check status
const status = await client.status(result.message_id);
console.log(status.delivery_status); // pending, accepted, delivered, failed

// Check balance
const balance = await client.balance();
console.log(balance.balance); // "100.00"
```

### CommonJS

```javascript
const { VerifiedSMS } = require('@verifiedsms/js');
```

## Configuration

```javascript
const client = new VerifiedSMS('YOUR_API_KEY', {
    baseUrl: 'https://your-testing-server.com/api/v2',  // optional
    timeout: 30000,  // optional, ms
});
```

## Methods

### `send(destination, message, options?)`

```javascript
const result = await client.send(
    '98XXXXXXXX,97798YYYYYYYY',
    'Hello!',
    {
        type: 1,        // 1=Normal, 2=Unicode (default: 1)
        sensitive: true, // Don't store message (default: false)
    }
);

// Returns: SendResponse
//   .message_id    string
//   .sms_count     number
//   .cost          string
//   .new_balance   string
```

### `status(messageId)`

```javascript
const status = await client.status('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

// Returns: StatusResponse
//   .message_id       string
//   .destination      string
//   .message          string | null
//   .status           string
//   .delivery_status  string
//   .cost             string
//   .created_at       string
//   .accepted_at      string | null
//   .delivered_at     string | null
```

### `balance()`

```javascript
const balance = await client.balance();
console.log(balance.balance); // "100.00"
```

### `history(options?)`

```javascript
const history = await client.history({
    page: 1,
    limit: 25,
    date_from: '2026-06-01',
    date_to: '2026-06-30',
    status: 'sent',
    search: '98',
});

// Returns: HistoryResponse
//   .history     array
//   .pagination  { total, page, per_page, total_pages }
```

### `validate(destination)`

```javascript
const result = await client.validate('98XXXXXXXX,12345,abc');
console.log(result.valid);    // ["97798XXXXXXXX"]
console.log(result.invalid);  // ["12345", "abc"]
```

### `usage(period?)`

```javascript
const usage = await client.usage('monthly');
// Returns: UsageResponse
//   .period      string
//   .total_sms   number
//   .total_cost  string
//   .stats       array
```

### `validateKey()`

```javascript
const result = await client.validateKey();
console.log(result.balance); // "100.00"
```

## Error Handling

```javascript
import {
    VerifiedSMS,
    VerifiedSMSError,
    ValidationError,
    AuthenticationError,
    InsufficientBalanceError,
    IPWhitelistError,
    RateLimitError,
    GatewayError,
    ServerError,
} from '@verifiedsms/js';

try {
    await client.send('98XXXXXXXX', 'Hello');
} catch (err) {
    if (err instanceof InsufficientBalanceError) {
        console.error('Need more credit:', err.message);
    } else if (err instanceof AuthenticationError) {
        console.error('Bad API key:', err.message);
    } else if (err instanceof IPWhitelistError) {
        console.error('IP not allowed:', err.message);
    } else if (err instanceof RateLimitError) {
        console.error('Slow down:', err.message);
    } else if (err instanceof GatewayError) {
        console.error('Gateway failed:', err.message);
        console.error('Message ID:', err.messageId);
    } else if (err instanceof VerifiedSMSError) {
        console.error(`API error: ${err.message} (HTTP ${err.statusCode})`);
    }
}
```

## Webhook Verification

```javascript
import express from 'express';
import { VerifiedSMS } from '@verifiedsms/js';

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {
    const payload = req.body.toString();
    const signature = req.headers['x-verifiedsms-signature'] || '';

    if (!VerifiedSMS.verifyWebhook(payload, signature, 'YOUR_WEBHOOK_SECRET')) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    const data = JSON.parse(payload);
    console.log(`Delivery update: ${data.message_id} -> ${data.status}`);

    res.sendStatus(200);
});

app.listen(3000);
```

## Framework Integrations

### Express.js

```javascript
import express from 'express';
import { VerifiedSMS } from '@verifiedsms/js';

const app = express();
app.use(express.json());

const client = new VerifiedSMS('YOUR_API_KEY');

app.post('/send-sms', async (req, res) => {
    try {
        const result = await client.send(req.body.phone, req.body.message);
        res.json(result);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
});
```

### Next.js API Route

```javascript
// pages/api/send.js (or app/api/send/route.js)
import { VerifiedSMS } from '@verifiedsms/js';

const client = new VerifiedSMS(process.env.VERIFIEDSMS_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { phone, message, sensitive } = req.body;
        const result = await client.send(phone, message, { sensitive });
        res.json(result);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
}
```

### Fastify

```javascript
import Fastify from 'fastify';
import { VerifiedSMS } from '@verifiedsms/js';

const app = Fastify();
const client = new VerifiedSMS('YOUR_API_KEY');

app.post('/send-sms', async (request, reply) => {
    const { phone, message } = request.body;
    const result = await client.send(phone, message);
    return result;
});

app.listen({ port: 3000 });
```

### Browser Usage

```html
<script type="module">
    import { VerifiedSMS } from 'https://cdn.jsdelivr.net/npm/@verifiedsms/js/dist/verifiedsms.min.js';

    const client = new VerifiedSMS('YOUR_API_KEY');

    // Send from browser (NOT recommended — exposes API key)
    // Use a backend proxy instead
</script>
```

> **Security:** Never use the SDK directly in browser-facing code. Always proxy through your backend to protect your API key.
