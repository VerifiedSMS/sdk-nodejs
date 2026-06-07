#!/usr/bin/env node

/**
 * VerifiedSMS JS SDK — Send SMS Example
 */

const { VerifiedSMS, InsufficientBalanceError, AuthenticationError, GatewayError, VerifiedSMSError } = require('../src');

async function main() {
    const client = new VerifiedSMS('YOUR_API_KEY');

    try {
        // Send to a single number
        const result = await client.send('98XXXXXXXX', 'Hello from VerifiedSMS JS SDK!');

        console.log('Message ID:', result.message_id);
        console.log('SMS Count: ', result.sms_count);
        console.log('Cost:      Rs.', result.cost);
        console.log('Balance:   Rs.', result.new_balance);
        console.log();

        // Send to multiple numbers (NTC + Ncell auto-detected)
        const bulk = await client.send('98XXXXXXXX,97798YYYYYYYY', 'Bulk SMS test');
        console.log(`Bulk sent: ${bulk.sms_count} segments, Rs. ${bulk.cost}`);
        console.log();

        // Send Unicode (Nepali) message
        const unicode = await client.send('98XXXXXXXX', 'नमस्ते! तपाईंलाई स्वागत छ।', { type: 2 });
        console.log(`Unicode SMS: ${unicode.sms_count} segments`);
        console.log();

        // Send sensitive message (OTP) — content not stored
        const otp = await client.send('98XXXXXXXX', 'Your OTP is 456789', { sensitive: true });
        console.log(`OTP sent: ${otp.message_id}`);

    } catch (err) {
        if (err instanceof InsufficientBalanceError) {
            console.error('ERROR: Insufficient balance —', err.message);
        } else if (err instanceof AuthenticationError) {
            console.error('ERROR: Bad API key —', err.message);
        } else if (err instanceof GatewayError) {
            console.error('ERROR: Gateway failed —', err.message);
            if (err.messageId) console.error('  Message ID:', err.messageId);
        } catch (err) {
            console.error('ERROR:', err.message, `(HTTP ${err.statusCode})`);
        }
    }
}

main();
