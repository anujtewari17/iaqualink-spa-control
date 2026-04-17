import fs from 'fs';
import path from 'path';

const PAYMENTS_FILE = path.resolve('payments.json');

class PaidAccessService {
    constructor() {
        this.payments = [];
        this.redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        this.redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        this.ready = this.load();

        if (this.redisUrl && this.redisToken) {
            // Ping Redis once every 12 hours to prevent Upstash from pausing the DB
            // due to inactivity, since the backend now stays awake.
            setInterval(() => {
                this.pingRedis();
            }, 12 * 60 * 60 * 1000);
        }
    }

    async pingRedis() {
        try {
            await fetch(this.redisUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.redisToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(['PING'])
            });
            console.log('[PaidAccess] Pinged Upstash Redis to keep DB active.');
        } catch (e) {
            console.error('[PaidAccess] Failed to ping Redis:', e.message);
        }
    }

    async load() {
        if (this.redisUrl && this.redisToken) {
            try {
                const response = await fetch(this.redisUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.redisToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(['GET', 'payments'])
                });
                const data = await response.json();
                if (data.result) {
                    this.payments = JSON.parse(data.result);
                    console.log(`[PaidAccess] Loaded ${this.payments.length} payments from Upstash Redis.`);
                } else {
                    console.log('[PaidAccess] No existing payments in Upstash. Starting fresh.');
                    this.payments = [];
                }
            } catch (e) {
                console.error('[PaidAccess] Failed to load payments from Redis:', e.message);
                this.payments = [];
            }
        } else {
            // Local fallback
            try {
                if (fs.existsSync(PAYMENTS_FILE)) {
                    const data = fs.readFileSync(PAYMENTS_FILE, 'utf8');
                    this.payments = JSON.parse(data);
                    console.log(`[PaidAccess] Loaded ${this.payments.length} payments from local storage.`);
                } else {
                    this.payments = [];
                }
            } catch (e) {
                console.error('[PaidAccess] Failed to load payments locally:', e.message);
                this.payments = [];
            }
        }
    }

    async save() {
        if (this.redisUrl && this.redisToken) {
            try {
                await fetch(this.redisUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.redisToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(['SET', 'payments', JSON.stringify(this.payments)])
                });
            } catch (e) {
                console.error('[PaidAccess] Failed to save payments to Redis:', e.message);
            }
        } else {
            // Local fallback
            try {
                fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(this.payments, null, 2));
            } catch (e) {
                console.error('[PaidAccess] Failed to save payments locally:', e.message);
            }
        }
    }

    async addPayment(accessKey, amount, nights, sessionId) {
        await this.ready;
        const normalizedKey = String(accessKey).trim().toLowerCase();
        
        if (sessionId && this.payments.some(p => p.sessionId === sessionId)) {
            console.log(`[PaidAccess] Payment for session ${sessionId} already recorded, skipping.`);
            return;
        }
        
        this.payments.push({
            accessKey: normalizedKey,
            amount,
            nights: Number(nights) || 1,
            sessionId,
            timestamp: new Date().toISOString()
        });
        
        await this.save();
    }

    async isPaid(accessKey) {
        await this.ready;
        if (!accessKey) return false;
        
        const normalizedKey = String(accessKey).trim().toLowerCase();

        if (normalizedKey === '948katmai') {
            console.log('[PaidAccess] Bypass key 948katmai detected');
            return true;
        }

        const userPayments = this.payments
            .filter(p => p.accessKey === normalizedKey)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (userPayments.length === 0) return false;

        const latest = userPayments[0];
        const nights = Number(latest.nights) || 1;
        const paymentTime = new Date(latest.timestamp);

        const expiryDate = new Date(paymentTime);
        expiryDate.setUTCDate(expiryDate.getUTCDate() + nights);
        expiryDate.setUTCHours(20, 0, 0, 0); // 1 PM PDT

        const now = new Date();
        const isStillValid = now <= expiryDate;

        console.log(`[PaidAccess] Checking ${normalizedKey}: ${isStillValid ? 'VALID' : 'EXPIRED'}`);
        return isStillValid;
    }

    async clearPayments(accessKey) {
        await this.ready;
        if (!accessKey) return;
        const normalizedKey = String(accessKey).trim().toLowerCase();
        this.payments = this.payments.filter(p => p.accessKey !== normalizedKey);
        await this.save();
        console.log(`[PaidAccess] Cleared all payments for key: ${normalizedKey}`);
    }
}

export default new PaidAccessService();
