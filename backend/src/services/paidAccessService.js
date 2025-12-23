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

        // Special bypass key for complimentary access
        if (normalizedKey === '948katmai') {
            console.log('[PaidAccess] Bypass key 948katmai detected');
            return true;
        }

        // Simplified logic: any payment for this key unlocks it.
        const found = this.payments.some(p => p.accessKey === normalizedKey);
        console.log(`[PaidAccess] Checking payment for ${normalizedKey}: ${found ? 'FOUND' : 'NOT FOUND'}`);
        return found;
    }
}

export default new PaidAccessService();
