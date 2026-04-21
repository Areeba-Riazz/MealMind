/**
 * Maps a PKR max-price value to a Google Maps Price Level ceiling.
 * Entries are checked in order; the first entry whose maxPkr >= maxPricePkr wins.
 */
const PRICE_TIER_MAP = [
  { maxPkr: 400,      priceLevel: 1 },
  { maxPkr: 800,      priceLevel: 2 },
  { maxPkr: 1500,     priceLevel: 3 },
  { maxPkr: Infinity, priceLevel: 4 },
];

/**
 * Returns the Google Maps Price Level ceiling for a given PKR amount.
 * @param {number} maxPricePkr
 * @returns {number} priceLevel ceiling (1–4)
 */
function mapPriceLevel(maxPricePkr) {
  const entry = PRICE_TIER_MAP.find((e) => maxPricePkr <= e.maxPkr);
  return entry ? entry.priceLevel : 4;
}

/**
 * Google Places API returns `price_level`; tests and mocks may use `priceLevel`.
 * @param {{ priceLevel?: number, price_level?: number }} place
 * @returns {number}
 */
function placePriceLevel(place) {
  return place.priceLevel ?? place.price_level ?? 0;
}

/**
 * Filters an array of place objects by price level.
 * When maxPricePkr is undefined the input array is returned unchanged.
 *
 * @param {Array<{priceLevel?: number, price_level?: number}>} places
 * @param {number|undefined} maxPricePkr
 * @returns {Array}
 */
function filterByPrice(places, maxPricePkr) {
  if (maxPricePkr === undefined) return places;
  const ceiling = mapPriceLevel(maxPricePkr);
  return places.filter((p) => placePriceLevel(p) <= ceiling);
}

module.exports = {
  PRICE_TIER_MAP,
  mapPriceLevel,
  placePriceLevel,
  filterByPrice,
};
