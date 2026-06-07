/**
 * VerifiedSMS TypeScript Definitions
 */

export interface VerifiedSMSOptions {
    baseUrl?: string;
    timeout?: number;
}

export interface SendOptions {
    type?: 1 | 2;
    sensitive?: boolean;
}

export interface HistoryOptions {
    page?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
    status?: 'sent' | 'failed' | 'pending';
    search?: string;
}

export interface SendResponse {
    message_id: string;
    sms_count: number;
    cost: string;
    new_balance: string;
}

export interface StatusResponse {
    message_id: string;
    destination: string;
    message: string | null;
    status: string;
    delivery_status: 'pending' | 'accepted' | 'delivered' | 'failed';
    cost: string;
    created_at: string;
    accepted_at: string | null;
    delivered_at: string | null;
}

export interface BalanceResponse {
    balance: string;
}

export interface HistoryResponse {
    history: Record<string, any>[];
    pagination: {
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    };
}

export interface ValidateResponse {
    valid: string[];
    invalid: string[];
}

export interface UsageResponse {
    period: string;
    total_sms: number;
    total_cost: string;
    stats: Record<string, any>[];
}

export interface ValidateKeyResponse {
    balance: string;
}

export declare class VerifiedSMSError extends Error {
    statusCode: number;
    data: Record<string, any>;
}

export declare class ValidationError extends VerifiedSMSError {}
export declare class AuthenticationError extends VerifiedSMSError {}
export declare class InsufficientBalanceError extends VerifiedSMSError {}
export declare class RateLimitError extends VerifiedSMSError {}
export declare class IPWhitelistError extends VerifiedSMSError {}
export declare class ServerError extends VerifiedSMSError {}
export declare class GatewayError extends VerifiedSMSError {
    messageId: string | null;
}

export declare class VerifiedSMS {
    constructor(apiKey: string, options?: VerifiedSMSOptions);

    send(destination: string, message: string, options?: SendOptions): Promise<SendResponse>;
    status(messageId: string): Promise<StatusResponse>;
    balance(): Promise<BalanceResponse>;
    history(options?: HistoryOptions): Promise<HistoryResponse>;
    validate(destination: string): Promise<ValidateResponse>;
    usage(period?: 'daily' | 'monthly'): Promise<UsageResponse>;
    validateKey(): Promise<ValidateKeyResponse>;

    static verifyWebhook(payload: string, signature: string, secret: string): boolean;
    static calculateSmsCount(message: string, type?: number): number;
    static normalizePhone(phone: string): string;
    static detectOperator(phone: string): 'ntc' | 'ncell' | 'unknown';
}
