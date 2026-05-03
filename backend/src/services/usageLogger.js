import fs from 'fs';
import path from 'path';

const LOG_FILE = path.resolve('usage-log.json');
const MAX_DAYS = 60; // keep logs for 60 days

class UsageLogger {
  constructor() {
    this.sessions = [];
    this.currentSession = null;
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
          body: JSON.stringify(['GET', 'spa_usage_log'])
        });
        const data = await response.json();
        if (data.result) {
          this.sessions = JSON.parse(data.result);
        }
      } catch (e) {
        console.error('[UsageLogger] Failed to load from Redis:', e.message);
      }
    } else {
      try {
        if (fs.existsSync(LOG_FILE)) {
          const data = fs.readFileSync(LOG_FILE, 'utf8');
          this.sessions = JSON.parse(data);
        }
      } catch (e) {
        console.error('[UsageLogger] Failed to load locally:', e.message);
      }
    }
  }

  async save() {
    if (this.redisUrl && this.redisToken) {
      try {
        await fetch(this.redisUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.redisToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(['SET', 'spa_usage_log', JSON.stringify(this.sessions)])
        });
      } catch (e) {
        console.error('[UsageLogger] Failed to save to Redis:', e.message);
      }
    } else {
      try {
        fs.writeFileSync(LOG_FILE, JSON.stringify(this.sessions, null, 2));
      } catch (e) {
        console.error('[UsageLogger] Failed to save locally:', e.message);
      }
    }
  }

  startSession(key = 'katmaiguest') {
    if (this.currentSession) return;
    this.currentSession = { key, start: new Date().toISOString() };
    console.log(`[UsageLogger] Logged start of session for ${key}`);
  }

  async endSession() {
    if (!this.currentSession) return;
    await this.ready;
    const end = new Date();
    const start = new Date(this.currentSession.start);
    const durationMinutes = Math.round((end - start) / 60000);
    
    // Only log if it ran for at least 1 minute
    if (durationMinutes >= 1) {
      this.sessions.push({
        key: this.currentSession.key,
        start: this.currentSession.start,
        end: end.toISOString(),
        durationMinutes
      });
      console.log(`[UsageLogger] Logged end of session: ${durationMinutes} mins`);
    }
    
    this.currentSession = null;
    this.prune();
    await this.save();
  }

  prune() {
    const cutoff = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000;
    this.sessions = this.sessions.filter(s => new Date(s.start).getTime() >= cutoff);
  }

  getMonthlyStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlySessions = this.sessions.filter(s => {
      const d = new Date(s.start);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalMinutes = monthlySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    return {
      totalHours,
      sessionCount: monthlySessions.length,
      monthName: now.toLocaleString('default', { month: 'long' })
    };
  }

  dailyReport() {
    this.prune();
    this.save();
    console.log(`[UsageLogger] Daily spa usage report`);
    const stats = this.getMonthlyStats();
    console.log(`Monthly Usage (${stats.monthName}): ${stats.totalHours} hours`);
  }
}

export default new UsageLogger();
