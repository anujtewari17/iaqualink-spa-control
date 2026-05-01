import fs from 'fs';
import path from 'path';

const RATE_FILE = path.resolve('heating_rate.json');

class RateService {
    constructor() {
        this.lastRate = 45; // Default fallback
        this.redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        this.redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        this.ready = this.load();
    }

    async load() {
        if (this.redisUrl && this.redisToken) {
            try {
                const response = await fetch(this.redisUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.redisToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(['GET', 'last_heating_rate'])
                });
                const data = await response.json();
                if (data.result) {
                    this.lastRate = Number(data.result);
                    console.log(`[RateService] Loaded heating rate ${this.lastRate} from Upstash Redis.`);
                } else {
                    console.log('[RateService] No existing rate in Upstash. Using default.');
                }
            } catch (e) {
                console.error('[RateService] Failed to load rate from Redis:', e.message);
            }
        } else {
            // Local fallback
            try {
                if (fs.existsSync(RATE_FILE)) {
                    const data = fs.readFileSync(RATE_FILE, 'utf8');
                    this.lastRate = JSON.parse(data).rate || 45;
                    console.log(`[RateService] Loaded heating rate ${this.lastRate} from local storage.`);
                }
            } catch (e) {
                console.error('[RateService] Failed to load rate locally:', e.message);
            }
        }
    }

    async save() {
        if (this.redisUrl && this.redisToken) {
            try {
                await fetch(this.redisUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.redisToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(['SET', 'last_heating_rate', String(this.lastRate)])
                });
                console.log(`[RateService] Saved heating rate ${this.lastRate} to Upstash.`);
            } catch (e) {
                console.error('[RateService] Failed to save rate to Redis:', e.message);
            }
        } else {
            // Local fallback
            try {
                fs.writeFileSync(RATE_FILE, JSON.stringify({ rate: this.lastRate }));
                console.log(`[RateService] Saved heating rate ${this.lastRate} to local storage.`);
            } catch (e) {
                console.error('[RateService] Failed to save rate locally:', e.message);
            }
        }
    }

    async getRate() {
        await this.ready;
        return this.lastRate;
    }

    async setRate(rate) {
        await this.ready;
        const numRate = Number(rate);
        if (!isNaN(numRate) && numRate > 0) {
            this.lastRate = numRate;
            await this.save();
        }
    }
}

export default new RateService();
