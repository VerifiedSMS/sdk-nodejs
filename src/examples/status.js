#!/usr/bin/env node

/**
 * VerifiedSMS JS SDK — Check Delivery Status Example
 */

const { VerifiedSMS } = require('../src');

async function main() {
    const client = new VerifiedSMS('YOUR_API_KEY');

    const status = await client.status('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

    console.log('Message ID:     ', status.message_id);
    console.log('Destination:    ', status.destination);
    console.log('Message:        ', status.message);
    console.log('Status:         ', status.status);
    console.log('Delivery Status:', status.delivery_status);
    console.log('Cost:           Rs.', status.cost);
    console.log('Created:        ', status.created_at);
    console.log('Accepted:       ', status.accepted_at);
    console.log('Delivered:      ', status.delivered_at);
    console.log();

    if (status.delivery_status === 'delivered') {
        console.log('Message delivered successfully!');
    } else if (status.delivery_status === 'failed') {
        console.log('Message delivery failed.');
    } else {
        console.log('Message still in transit...');
    }
}

main();
