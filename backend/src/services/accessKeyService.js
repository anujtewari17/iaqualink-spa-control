import dotenv from 'dotenv';

dotenv.config();

class AccessKeyService {
  constructor() {
    this.adminKey = process.env.ACCESS_KEY ? process.env.ACCESS_KEY.toLowerCase().trim() : null;
    this.guestKey = 'katmaiguest';
  }

  isKeyActive(key) {
    if (!key) return false;
    const normalizedKey = String(key).trim().toLowerCase();
    if (normalizedKey === this.adminKey) return true;
    if (normalizedKey === this.guestKey) return true;
    return false;
  }

  isKeyExpired(key) {
    if (!key) return true;
    const normalizedKey = String(key).trim().toLowerCase();
    if (normalizedKey === this.adminKey) return false;
    if (normalizedKey === this.guestKey) return false;
    return true;
  }

  async validateKey(key) {
    if (!key) return false;
    const normalizedKey = String(key).trim().toLowerCase();
    if (normalizedKey === this.adminKey) return true;
    if (normalizedKey === this.guestKey) return true;
    return false;
  }
}

export default new AccessKeyService();
