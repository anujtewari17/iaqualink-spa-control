import axios from 'axios';
import ical from 'node-ical';
import dotenv from 'dotenv';

dotenv.config();

class AccessKeyService {
  constructor() {
    this.feedUrl = process.env.ICS_FEED_URL;
    this.frontendUrl = process.env.FRONTEND_URL || '';
    this.adminKey = process.env.ACCESS_KEY;
    this.testKeys = ['99999999', '88888888', '77777777', '948katmai', 'katmaiguest'];
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

  isKeyActive(key) {
    if (!key) return false;
    const normalizedKey = String(key).trim().toLowerCase();
    if (normalizedKey === this.adminKey) return true;
    if (this.testKeys.includes(normalizedKey)) return true;

    const reservation = this.getReservationForKey(normalizedKey);
    return reservation && this.isActive(reservation);
  }

  isKeyExpired(key) {
    if (!key) return true;
    const normalizedKey = String(key).trim().toLowerCase();
    if (normalizedKey === this.adminKey) return false;
    if (this.testKeys.includes(normalizedKey)) return false;

    const reservation = this.getReservationForKey(normalizedKey);
    if (!reservation) return true;

    const now = new Date();
    const end = new Date(reservation.end);
    end.setHours(13, 0, 0, 0); // 1 PM buffer
    return now > end;
  }

  async validateKey(key) {
    if (!key) return false;
    const normalizedKey = String(key).trim().toLowerCase();
    if (normalizedKey === this.adminKey) return true;
    if (this.testKeys.includes(normalizedKey)) return true;

    // Allow any key that exists in our records to be "valid" 
    // This allows guests to log in and pay for future reservations.
    const reservation = this.getReservationForKey(normalizedKey);
    return !!reservation;
  }

  getActiveReservations() {
    const current = this.getCurrentReservation();
    const test = {
      id: 'test-reservation',
      start: new Date(),
      end: new Date(Date.now() + 24 * 60 * 60 * 1000),
      code: '99999999'
    };
    return current ? [current, test] : [test];
  }

  getCurrentReservation() {
    // If a guest specifically uses the test key, return a dummy reservation
    // This allows testing the payment flow even when no one is staying.
    const standard = this.reservations.find((r) => this.isActive(r));
    if (standard) return standard;

    return null;
  }

  getReservationForKey(key) {
    if (!key) return null;
    const normalizedKey = String(key).trim().toLowerCase();

    if (this.testKeys.includes(normalizedKey)) {
      let nights = 1;
      if (normalizedKey === '99999999') nights = 3;
      if (normalizedKey === '77777777') nights = 5;

      return {
        id: `test-${normalizedKey}`,
        start: new Date(Date.now() - 3600000), // Start an hour ago to ensure it's "active"
        end: new Date(Date.now() + nights * 24 * 60 * 60 * 1000),
        code: normalizedKey
      };
    }
    return this.reservations.find(r => r.code === normalizedKey) || null;
  }

  getAllReservations() {
    return this.reservations.map((r) => ({
      ...r,
      url: this.generateUrl(r.code),
    }));
  }
}

export default new AccessKeyService();
