const { haversineKm, cityFromAddress } = require("./geo");

/**
 * Validates that a website URL is plausible before surfacing it to users.
 * @param {unknown} url
 * @returns {string | null}
 */
function sanitiseWebsite(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname)) return null;
    if (!u.hostname.includes(".")) return null;
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Collects all non-null phone strings from a place object, deduplicates them.
 * @param {{ formatted_phone_number?: string|null, international_phone_number?: string|null }} place
 * @returns {string[]}
 */
function extractPhones(place) {
  const candidates = [
    place.formatted_phone_number,
    place.international_phone_number,
  ];
  const seen = new Set();
  const phones = [];
  for (const p of candidates) {
    if (p && typeof p === "string") {
      const trimmed = p.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        phones.push(trimmed);
      }
    }
  }
  return phones;
}

/**
 * Builds a FoodPanda search URL for a restaurant name + city.
 * @param {string} name
 * @param {string} [city]
 * @returns {string}
 */
function foodpandaSearchUrl(name, city) {
  const q = city ? `${name} ${city}` : name;
  return `https://www.foodpanda.pk/?query=${encodeURIComponent(q)}`;
}

/**
 * Maps raw Google Maps place objects to CravingResult shape.
 * Caps output at 5 results.
 * @param {Array<object>} places
 * @param {number|undefined} userLat
 * @param {number|undefined} userLng
 * @returns {Array<object>}
 */
function formatResults(places, userLat, userLng) {
  return places.slice(0, 5).map((place) => {
    const placeLat = place.geometry?.location?.lat;
    const placeLng = place.geometry?.location?.lng;

    const distanceKm =
      userLat != null &&
      userLng != null &&
      placeLat != null &&
      placeLng != null
        ? haversineKm(userLat, userLng, placeLat, placeLng)
        : 0;

    const name = place.name ?? "";
    const placeId = place.place_id ?? "";
    const googleMapsLink = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    const city = cityFromAddress(place.formatted_address ?? "");

    return {
      id: placeId,
      name,
      address: place.formatted_address ?? "",
      distanceKm,
      priceLevel: place.price_level ?? 0,
      rating: place.rating ?? 0,
      orderLink: googleMapsLink,
      googleMapsLink,
      foodpandaLink: foodpandaSearchUrl(name, city),
      foodpandaIsDirect: false,
      instagramUrl: null,
      facebookUrl: null,
      phone: place.formatted_phone_number ?? place.international_phone_number ?? null,
      phones: extractPhones(place),
      website: sanitiseWebsite(place.website),
      lat: placeLat ?? null,
      lng: placeLng ?? null,
    };
  });
}

module.exports = {
  sanitiseWebsite,
  extractPhones,
  foodpandaSearchUrl,
  formatResults,
};
