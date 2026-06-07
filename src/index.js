/**
 * VerifiedSMS JavaScript SDK — SMS gateway for Nepal
 *
 * Works in Node.js (>=18) and modern browsers.
 */

'use strict';

const crypto = require('crypto');

const DEFAULT_BASE_URL = 'https://verifiedsms.com/api/v2';

// ─── Exceptions ──────────────────────────────────────────────────────────────

class VerifiedSMSError extends Error {
    constructor(message, statusCode = 0, data = {}) {
        super(message);
        this.name = 'VerifiedSMSError';
        this.statusCode = statusCode;
        this.data = data;
    }
}

class ValidationError extends VerifiedSMSError {
    constructor(message) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

class AuthenticationError extends VerifiedSMSError {
    constructor(message) {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

class InsufficientBalanceError extends VerifiedSMSError {
    constructor(message) {
        super(message, 402);
        this.name = 'InsufficientBalanceError';
    }
}

class RateLimitError extends VerifiedSMSError {
    constructor(message) {
        super(message, 429);
        this.name = 'RateLimitError';
    }
}

class IPWhitelistError extends VerifiedSMSError {
    constructor(message) {
        super(message, 403);
        this.name = 'IPWhitelistError';
    }
}

class ServerError extends VerifiedSMSError {
    constructor(message) {
        super(message, 500);
        this.name = 'ServerError';
    }
}

class GatewayError extends VerifiedSMSError {
    constructor(message, messageId = null) {
        super(message, 502);
        this.name = 'GatewayError';
        this.messageId = messageId;
    }
}

// ─── Client ──────────────────────────────────────────────────────────────────

class VerifiedSMS {
    /**
     * @param {string} apiKey  Your VerifiedSMS API key
     * @param {object} [options]
     * @param {string} [options.baseUrl]  Custom base URL
     * @param {number} [options.timeout]  Request timeout in ms (default: 30000)
     */
    constructor(apiKey, options = {}) {
        if (!apiKey) throw new Error('API key cannot be empty');

        this.apiKey = apiKey;
        this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
        this.timeout = options.timeout || 30000;
    }

    /**
     * Send SMS to one or more Nepali mobile numbers.
     *
     * @param {string} destination  Phone number(s), comma-separated
     * @param {string} message      SMS content (1-1600 chars)
     * @param {object} [options]
     * @param {number} [options.type=1]       1=Normal, 2=Unicode
     * @param {boolean} [options.sensitive=false]  Don't store message
     * @returns {Promise<SendResponse>}
     */
    async send(destination, message, options = {}) {
        const params = {
            key: this.apiKey,
            destination,
            message,
            type: options.type || 1,
        };

        if (options.sensitive) {
            params.sensitive = 'true';
        }

        const response = await this._request('POST', '/send', params);
        return response.data;
    }

    /**
     * Check delivery status of a sent message.
     *
     * @param {string} messageId  UUID from send response
     * @returns {Promise<StatusResponse>}
     */
    async status(messageId) {
        const response = await this._request('GET', '/status', {
            key: this.apiKey,
            message_id: messageId,
        });
        return response.data;
    }

    /**
     * Check account balance.
     *
     * @returns {Promise<BalanceResponse>}
     */
    async balance() {
        const response = await this._request('GET', '/balance', {
            key: this.apiKey,
        });
        return response.data;
    }

    /**
     * Get SMS history with optional filters.
     *
     * @param {object} [options]
     * @returns {Promise<HistoryResponse>}
     */
    async history(options = {}) {
        const params = { key: this.apiKey, ...options };
        const response = await this._request('GET', '/history', params);
        return response.data;
    }

    /**
     * Validate Nepali phone numbers.
     *
     * @param {string} destination  Phone number(s), comma-separated
     * @returns {Promise<ValidateResponse>}
     */
    async validate(destination) {
        const response = await this._request('POST', '/validate', {
            key: this.apiKey,
            destination,
        });
        return response.data;
    }

    /**
     * Get daily or monthly usage statistics.
     *
     * @param {string} [period='daily']  'daily' or 'monthly'
     * @returns {Promise<UsageResponse>}
     */
    async usage(period = 'daily') {
        const response = await this._request('GET', '/usage', {
            key: this.apiKey,
            period,
        });
        return response.data;
    }

    /**
     * Check if API key is valid.
     *
     * @returns {Promise<ValidateKeyResponse>}
     */
    async validateKey() {
        const response = await this._request('GET', '/validate_key', {
            key: this.apiKey,
        });
        return response.data;
    }

    /**
     * Verify a webhook HMAC-SHA256 signature.
     *
     * @param {string} payload   Raw request body
     * @param {string} signature X-VerifiedSMS-Signature header value
     * @param {string} secret    Your webhook secret
     * @returns {boolean}
     */
    static verifyWebhook(payload, signature, secret) {
        const expected = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        return crypto.timingSafeEqual(
            Buffer.from(expected),
            Buffer.from(signature || '')
        );
    }

    /**
     * Calculate SMS count for a message.
     *
     * @param {string} message
     * @param {number} [type=1]  1=Normal, 2=Unicode
     * @returns {number}
     */
    static calculateSmsCount(message, type = 1) {
        const charsPerSms = type === 2 ? 70 : 160;
        return Math.ceil(message.length / charsPerSms);
    }

    /**
     * Normalize a Nepali phone number.
     *
     * @param {string} phone
     * @returns {string}
     */
    static normalizePhone(phone) {
        phone = phone.replace(/[\s\-()]/g, '').trim();

        let m = phone.match(/^00977(\d{10})$/);
        if (m) return '977' + m[1];

        m = phone.match(/^\+977(\d{10})$/);
        if (m) return '977' + m[1];

        if (/^977\d{10}$/.test(phone)) return phone;

        if (/^(98|97)\d{8}$/.test(phone)) return '977' + phone;

        m = phone.match(/^(\d{10})$/);
        if (m) return '977' + m[1];

        return phone;
    }

    /**
     * Detect operator from phone number.
     *
     * @param {string} phone
     * @returns {'ntc' | 'ncell' | 'unknown'}
     */
    static detectOperator(phone) {
        const normalized = this.normalizePhone(phone);
        const local = normalized.slice(-10);

        if (/^98[0-3]/.test(local)) return 'ncell';
        if (/^98[4-8]/.test(local)) return 'ntc';
        return 'unknown';
    }

    // ─── Private ────────────────────────────────────────────────────────────

    /**
     * Make an API request.
     *
     * @private
     */
    async _request(method, endpoint, params) {
        const url = new URL(endpoint, this.baseUrl);

        const options = {
            method,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'VerifiedSMS-JS/2.0.0',
            },
            signal: AbortSignal.timeout(this.timeout),
        };

        if (method === 'POST') {
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            options.body = new URLSearchParams(params).toString();
        } else {
            Object.entries(params).forEach(([k, v]) =>
                url.searchParams.set(k, String(v))
            );
        }

        let response;
        try {
            response = await fetch(url.toString(), options);
        } catch (err) {
            throw new VerifiedSMSError(`Request failed: ${err.message}`);
        }

        const body = await response.json();

        if (body.status === 'success') {
            return body;
        }

        const message = body.message || 'Unknown error';
        const data = body.data || {};

        switch (response.status) {
            case 400:  throw new ValidationError(message);
            case 401:  throw new AuthenticationError(message);
            case 402:  throw new InsufficientBalanceError(message);
            case 403:  throw new IPWhitelistError(message);
            case 429:  throw new RateLimitError(message);
            case 500:  throw new ServerError(message);
            case 502:  throw new GatewayError(message, data.message_id);
            default:   throw new VerifiedSMSError(message, response.status);
        }
    }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
    VerifiedSMS,
    VerifiedSMSError,
    ValidationError,
    AuthenticationError,
    InsufficientBalanceError,
    IPWhitelistError,
    RateLimitError,
    ServerError,
    GatewayError,
};

// ES module support
if (typeof module !== 'undefined') {
    module.exports.VerifiedSMS = VerifiedSMS;
}
