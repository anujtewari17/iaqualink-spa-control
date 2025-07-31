import fs from 'fs';
import path from 'path';
import accessKeyService from './accessKeyService.js';

const LOG_FILE = path.resolve('backend', 'usage-log.json');
const MAX_DAYS = 60; // keep logs for 60 days
const LOG_TAG = 'SPA_USAGE_LOG';

class UsageLogger {
  constructor() {
    this.sessions = [];
    this.currentSession = null;
    this.load();
  }

  load() {
    try {
      const data = fs.readFileSync(LOG_FILE, 'utf8');
      this.sessions = JSON.parse(data);
    } catch (e) {
      this.sessions = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(LOG_FILE, JSON.stringify(this.sessions, null, 2));
    } catch (e) {
      console.error('Failed to write usage log:', e.message);
    }
  }

  startSession() {
    if (this.currentSession) return;
    const res = accessKeyService.getCurrentReservation();
    const guest = res ? res.id || res.code : 'unknown';
    this.currentSession = { guest, start: new Date().toISOString() };
  }

  endSession() {
    if (!this.currentSession) return;
    const end = new Date();
    const start = new Date(this.currentSession.start);
    const durationMinutes = Math.round((end - start) / 60000);
    this.sessions.push({
      guest: this.currentSession.guest,
      start: this.currentSession.start,
      end: end.toISOString(),
      durationMinutes
    });
    this.currentSession = null;
    this.prune();
    this.save();
  }

  prune() {
    const cutoff = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000;
    this.sessions = this.sessions.filter(s => new Date(s.start).getTime() >= cutoff);
  }

  dailyReport() {
    this.prune();
    this.save();
    console.log(`[${LOG_TAG}] Daily spa usage report`);
    if (this.sessions.length) {
      console.table(this.sessions);
    } else {
      console.log('No usage recorded');
    }
  }
}

export default new UsageLogger();
