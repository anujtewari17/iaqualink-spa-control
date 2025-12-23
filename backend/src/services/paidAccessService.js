import fs from 'fs';
import path from 'path';

const PAYMENTS_FILE = path.resolve('payments.json');

class PaidAccessService {
    constructor() {
        this.payments = [];
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(PAYMENTS_FILE)) {
                const data = fs.readFileSync(PAYMENTS_FILE, 'utf8');
                this.payments = JSON.parse(data);
            } else {
                this.payments = [];
                this.save();
            }
        } catch (e) {
            console.error('Failed to load payments:', e.message);
            this.payments = [];
        }
    }

    save() {
        try {
            fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(this.payments, null, 2));
        } catch (e) {
            console.error('Failed to save payments:', e.message);
        }
    }

    addPayment(accessKey, amount, nights, sessionId) {
        this.payments.push({
            accessKey,
            amount,
            nights,
            sessionId,
            timestamp: new Date().toISOString()
        });
        this.save();
    }

    isPaid(accessKey) {
        if (!accessKey) return false;
        const normalizedKey = String(accessKey).trim().toLowerCase();


        // Special bypass key for complimentary access (no expiry)
        if (normalizedKey === '948katmai') {
            console.log('[PaidAccess] Bypass key 948katmai detected');
            return true;
        }

        // Honor System: If a payment exists for this specific key, it's unlocked for the trip.
        // The reset happens when the 'accessKey' changes (next reservation) or via manual reset.
        const found = this.payments.some(p => p.accessKey === normalizedKey);
        console.log(`[PaidAccess] Checking payment for ${normalizedKey}: ${found ? 'PAID (Honor System)' : 'UNPAID'}`);
        return found;
    }

    clearPayments(accessKey) {
        if (!accessKey) return;
        const normalizedKey = String(accessKey).trim().toLowerCase();
        this.payments = this.payments.filter(p => p.accessKey !== normalizedKey);
        this.save();
        console.log(`[PaidAccess] Cleared all payments for key: ${normalizedKey}`);
    }
}

export default new PaidAccessService();
