import fs from 'fs';
import path from 'path';

const SESSIONS_FILE = path.resolve('sessions.json');

class SessionService {
    constructor() {
        this.sessions = [];
        this.redisUrl = process.env.UPSTASH_REDIS_REST_URL;
        this.redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
        this.ready = this.load();

        if (this.redisUrl && this.redisToken) {
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
            console.log('[SessionService] Pinged Upstash Redis.');
        } catch (e) {
            console.error('[SessionService] Failed to ping Redis:', e.message);
        }
    }

    async load() {
        if (this.redisUrl && this.redisToken) {
            try {
                const response = await fetch(this.redisUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.redisToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(['GET', 'spa_sessions'])
                });
                const data = await response.json();
                if (data.result) {
                    this.sessions = JSON.parse(data.result);
                    console.log(`[SessionService] Loaded ${this.sessions.length} sessions from Redis.`);
                } else {
                    this.sessions = [];
                }
            } catch (e) {
                console.error('[SessionService] Failed to load from Redis:', e.message);
                this.sessions = [];
            }
        } else {
            try {
                if (fs.existsSync(SESSIONS_FILE)) {
                    const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
                    this.sessions = JSON.parse(data);
                    console.log(`[SessionService] Loaded ${this.sessions.length} sessions locally.`);
                } else {
                    this.sessions = [];
                }
            } catch (e) {
                console.error('[SessionService] Failed to load locally:', e.message);
                this.sessions = [];
            }
        }
    }

    async save() {
        if (this.redisUrl && this.redisToken) {
            try {
                await fetch(this.redisUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.redisToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(['SET', 'spa_sessions', JSON.stringify(this.sessions)])
                });
            } catch (e) {
                console.error('[SessionService] Failed to save to Redis:', e.message);
            }
        } else {
            try {
                fs.writeFileSync(SESSIONS_FILE, JSON.stringify(this.sessions, null, 2));
            } catch (e) {
                console.error('[SessionService] Failed to save locally:', e.message);
            }
        }
    }

    async startSession(accessKey, durationHours) {
        await this.ready;
        const normalizedKey = String(accessKey).trim().toLowerCase();
        
        // Remove existing session for this key to allow restarting
        this.sessions = this.sessions.filter(s => s.accessKey !== normalizedKey);

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

        this.sessions.push({
            accessKey: normalizedKey,
            durationHours,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString()
        });
        
        await this.save();
        console.log(`[SessionService] Started ${durationHours}hr session for ${normalizedKey}`);
    }

    async getSession(accessKey) {
        await this.ready;
        if (!accessKey) return null;
        
        const normalizedKey = String(accessKey).trim().toLowerCase();
        
        const session = this.sessions.find(s => s.accessKey === normalizedKey);
        if (!session) return null;

        const now = new Date();
        const end = new Date(session.endTime);
        
        if (now > end) {
            return null; // Expired
        }
        
        return {
            ...session,
            timeRemainingMs: end.getTime() - now.getTime()
        };
    }

    async hasActiveSession(accessKey) {
        // Admin always has active session
        const adminKey = String(process.env.ACCESS_KEY).trim().toLowerCase();
        const normalizedKey = String(accessKey).trim().toLowerCase();
        
        if (normalizedKey === adminKey) return true;

        const session = await this.getSession(accessKey);
        return !!session;
    }

    async getAndClearNewlyExpiredSessions() {
        await this.ready;
        const now = new Date();
        
        const expired = this.sessions.filter(s => new Date(s.endTime) <= now);
        const active = this.sessions.filter(s => new Date(s.endTime) > now);
        
        if (expired.length > 0) {
            this.sessions = active;
            await this.save();
            return expired;
        }
        
        return [];
    }

    async clearSession(accessKey) {
        await this.ready;
        if (!accessKey) return;
        const normalizedKey = String(accessKey).trim().toLowerCase();
        this.sessions = this.sessions.filter(s => s.accessKey !== normalizedKey);
        await this.save();
        console.log(`[SessionService] Cleared session for key: ${normalizedKey}`);
    }
}

export default new SessionService();
