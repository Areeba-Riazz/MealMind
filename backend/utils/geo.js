/**
 * Haversine formula — straight-line distance between two lat/lng points in km.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number}
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * @param {number|undefined|null} v
 * @returns {number|null}
 */
function parseLatitude(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < -90 || n > 90) return null;
  return n;
}

/**
 * @param {number|undefined|null} v
 * @returns {number|null}
 */
function parseLongitude(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < -180 || n > 180) return null;
  return n;
}

/**
 * @param {object} place
 * @param {number} userLat
 * @param {number} userLng
 * @returns {number}
 */
function distanceToRawPlace(place, userLat, userLng) {
  const plat = place.geometry?.location?.lat;
  const plng = place.geometry?.location?.lng;
  if (plat == null || plng == null) return Number.POSITIVE_INFINITY;
  return haversineKm(userLat, userLng, plat, plng);
}

/**
 * Sort Places API results by straight-line distance when user coords exist.
 * @param {Array<object>} places raw Google place objects
 * @param {number|null} userLat
 * @param {number|null} userLng
 * @returns {Array<object>}
 */
function sortRawPlacesByDistance(places, userLat, userLng) {
  if (userLat == null || userLng == null) return places;
  return [...places].sort((a, b) => {
    const da = distanceToRawPlace(a, userLat, userLng);
    const db = distanceToRawPlace(b, userLat, userLng);
    return da - db;
  });
}

/**
 * Extracts the city name from a Google Places formatted_address string.
 * Falls back to the resolvedArea string if address parsing yields nothing.
 *
 * @param {string} formattedAddress  e.g. "123 Main St, Lahore, Punjab, Pakistan"
 * @param {string} [fallback]
 * @returns {string}
 */
function cityFromAddress(formattedAddress, fallback) {
  if (!formattedAddress) return fallback ?? "";
  // Addresses are comma-separated; city is typically the second-to-last or third segment
  const parts = formattedAddress.split(",").map((s) => s.trim()).filter(Boolean);
  // Walk from the end: skip "Pakistan" and province names, take first plausible city
  const skipWords = /^(pakistan|punjab|sindh|kpk|khyber|balochistan|islamabad capital territory)$/i;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!skipWords.test(parts[i]) && !/^\d/.test(parts[i])) {
      return parts[i];
    }
  }
  return fallback ?? parts[0] ?? "";
}

module.exports = {
  haversineKm,
  parseLatitude,
  parseLongitude,
  sortRawPlacesByDistance,
  distanceToRawPlace,
  cityFromAddress,
};
