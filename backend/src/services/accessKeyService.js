import axios from 'axios';
import ical from 'node-ical';
import dotenv from 'dotenv';

dotenv.config();

class AccessKeyService {
  constructor() {
    this.feedUrl = process.env.ICS_FEED_URL;
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

  isActive(reservation) {
    const now = new Date();
    return now >= reservation.start && now <= reservation.end;
  }

  async validateKey(key) {
    if (key === this.adminKey) return true;
    return this.reservations.some(
      (r) => r.code === key && this.isActive(r)
    );
  }

  getActiveReservations() {
    return this.reservations.filter((r) => this.isActive(r));
  }

  getAllReservations() {
    return this.reservations;
  }
}

export default new AccessKeyService();
