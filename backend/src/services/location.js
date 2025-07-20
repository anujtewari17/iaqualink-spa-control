import dotenv from 'dotenv';
dotenv.config();

const parseLocations = () => {
  const raw = process.env.ALLOWED_LOCATIONS;
  if (!raw) return [];
  return raw
    .split(';')
    .map(p => p.trim())
    .filter(Boolean)
    .map(pair => {
      const [latStr, lonStr] = pair.split(',');
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      if (isNaN(lat) || isNaN(lon)) {
        console.warn(`Invalid coordinates: ${pair}`);
        return null;
      }
      return { lat, lon };
    })
    .filter(Boolean);
};

export const locations = parseLocations();

const toRad = (v) => (v * Math.PI) / 180;

export function isLocationAllowed(latitude, longitude, radiusKm = 0.2) {
  if (!locations.length) return true;
  return locations.some((loc) => {
    if (isNaN(loc.lat) || isNaN(loc.lon)) return false;
    const dLat = toRad(loc.lat - latitude);
    const dLon = toRad(loc.lon - longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(latitude)) *
        Math.cos(toRad(loc.lat)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = 6371 * c;
    return distance <= radiusKm;
  });
}
