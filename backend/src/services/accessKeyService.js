import axios from 'axios';
import ical from 'node-ical';
import dotenv from 'dotenv';

dotenv.config();

class AccessKeyService {
  constructor() {
    this.feedUrl = process.env.ICS_FEED_URL;
    this.frontendUrl = process.env.FRONTEND_URL || '';
    this.adminKey = process.env.ACCESS_KEY;
    this.reservations = [];
    if (this.feedUrl) {
      this.updateReservations();
      setInterval(() => this.updateReservations(), 60 * 60 * 1000); // hourly
    }
  }

  async updateReservations() {
    if (!this.feedUrl) return;
    try {
      const res = await axios.get(this.feedUrl);
      const events = ical.parseICS(res.data);
      const reservations = [];
      for (const key of Object.keys(events)) {
        const ev = events[key];
        if (ev.type === 'VEVENT' && ev.start && ev.end) {
          reservations.push({
            id: ev.uid || key,
            start: new Date(ev.start),
            end: new Date(ev.end),
            code: this.generateCode(new Date(ev.start), new Date(ev.end))
          });
        }
      }
      reservations.sort((a, b) => a.start - b.start);
      this.reservations = reservations;
      console.log(`Loaded ${reservations.length} reservations from calendar`);
    } catch (err) {
      console.error('Failed to update reservations:', err.message);
    }
  }

  generateCode(start, end) {
    const pad = (n) => String(n).padStart(2, '0');
    const sm = pad(start.getMonth() + 1);
    const sd = pad(start.getDate());
    const em = pad(end.getMonth() + 1);
    const ed = pad(end.getDate());
    return `${sm}${sd}${em}${ed}`;
}

  generateUrl(code) {
    if (!this.frontendUrl) return null;
    let base = this.frontendUrl.trim();
    if (!/^https?:\/\//i.test(base)) {
      base = `https://${base}`;
    }
    base = base.replace(/\/?$/, '/');
    return `${base}?key=${code}`;
  }

  isActive(reservation) {
    const now = new Date();
    const start = new Date(reservation.start);
    // Links become active roughly an hour before the 4 PM check-in
    // (check-in is 4 PM, so activate around 3 PM on arrival day)
    start.setHours(15, 0, 0, 0);
    const end = new Date(reservation.end);
    // Allow roughly two hours past the 11 AM checkout time
    end.setHours(13, 0, 0, 0); // 1 PM on departure day
    return now >= start && now <= end;
  }

  async validateKey(key) {
    if (key === this.adminKey) return true;
    const current = this.getCurrentReservation();
    return current && current.code === key;
  }

  getActiveReservations() {
    const current = this.getCurrentReservation();
    return current ? [current] : [];
  }

  getCurrentReservation() {
    return this.reservations.find((r) => this.isActive(r)) || null;
  }

  getAllReservations() {
    return this.reservations.map((r) => ({
      ...r,
      url: this.generateUrl(r.code),
    }));
  }
}

export default new AccessKeyService();
