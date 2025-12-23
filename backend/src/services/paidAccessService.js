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
        // Special bypass key for complimentary access
        if (accessKey === '948katmai') return true;

        // Simplified logic: any payment for this key unlocks it.
        return this.payments.some(p => p.accessKey === accessKey);
    }
}

export default new PaidAccessService();
