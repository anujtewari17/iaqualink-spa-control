import dotenv from 'dotenv';
import NodeGeocoder from 'node-geocoder';

dotenv.config();

const geocoder = NodeGeocoder({ provider: 'openstreetmap' });

const parseAddresses = async () => {
  const raw = process.env.ALLOWED_ADDRESSES;
  if (!raw) return [];
  const addresses = raw.split(';').map(a => a.trim()).filter(Boolean);
  const coords = [];
  for (const address of addresses) {
    try {
      const [res] = await geocoder.geocode(address);
      if (res) {
        coords.push({ lat: res.latitude, lon: res.longitude });
      } else {
        console.warn(`No results for address: ${address}`);
      }
    } catch (err) {
      console.error(`Failed to geocode "${address}":`, err.message);
    }
  }
  return coords;
};

export const locations = await parseAddresses();

const toRad = v => (v * Math.PI) / 180;

export function isLocationAllowed(latitude, longitude, radiusKm = 0.2) {
  if (!locations.length) return true;
  return locations.some(loc => {
    if (isNaN(loc.lat) || isNaN(loc.lon)) return false;
    const dLat = toRad(loc.lat - latitude);
    const dLon = toRad(loc.lon - longitude);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(latitude)) * Math.cos(toRad(loc.lat)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371 * c;
    return distance <= radiusKm;
  });
}
