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

        // Find all payments for this key and pick the most recent one
        const userPayments = this.payments
            .filter(p => p.accessKey === normalizedKey)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (userPayments.length === 0) return false;

        const latest = userPayments[0];
        const nights = Number(latest.nights) || 1;
        const paymentTime = new Date(latest.timestamp);

        // Access expires at 1 PM on the day after their last paid night (Trip-Based)
        const expiryDate = new Date(paymentTime);
        expiryDate.setDate(expiryDate.getDate() + nights);
        expiryDate.setHours(13, 0, 0, 0); // 1 PM buffer

        const now = new Date();
        const isStillValid = now <= expiryDate;

        console.log(`[PaidAccess] Checking ${normalizedKey}: ${isStillValid ? 'VALID' : 'EXPIRED'}`);
        console.log(`  - Paid on: ${paymentTime.toLocaleString()}`);
        console.log(`  - Nights: ${nights}`);
        console.log(`  - Expires: ${expiryDate.toLocaleString()}`);
        console.log(`  - Current Time: ${now.toLocaleString()}`);

        return isStillValid;
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
