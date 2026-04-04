/**
 * Backend tests for local-search-enhancement pure functions.
 * Uses Node.js built-in test runner + fast-check for property-based tests.
 *
 * Run with: node --test server.test.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fc = require("fast-check");

// Suppress the server startup side-effects (listen, dotenv warnings) by
// stubbing process.env before requiring the module.
process.env.GOOGLE_MAPS_API_KEY = "test-key-placeholder";
process.env.GEMINI_API_KEY = "test-key-placeholder";

const {
  PRICE_TIER_MAP,
  mapPriceLevel,
  filterByPrice,
  formatResults,
  haversineKm,
  placePriceLevel,
} = require("./server.js");

// ---------------------------------------------------------------------------
// mapPriceLevel — unit tests
// ---------------------------------------------------------------------------
describe("mapPriceLevel", () => {
  it("maps values <= 400 to price level 1", () => {
    assert.equal(mapPriceLevel(1), 1);
    assert.equal(mapPriceLevel(400), 1);
  });

  it("maps values 401–800 to price level 2", () => {
    assert.equal(mapPriceLevel(401), 2);
    assert.equal(mapPriceLevel(800), 2);
  });

  it("maps values 801–1500 to price level 3", () => {
    assert.equal(mapPriceLevel(801), 3);
    assert.equal(mapPriceLevel(1500), 3);
  });

  it("maps values above 1500 to price level 4", () => {
    assert.equal(mapPriceLevel(1501), 4);
    assert.equal(mapPriceLevel(9999), 4);
  });

  // Feature: local-search-enhancement, Property 2: Price tier mapping monotonicity
  // Validates: Requirements 2.4
  it("Property 2: Price tier mapping monotonicity — mapPriceLevel is non-decreasing", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (a, b) => {
          const lo = Math.min(a, b);
          const hi = Math.max(a, b);
          assert.ok(
            mapPriceLevel(lo) <= mapPriceLevel(hi),
            `mapPriceLevel(${lo}) > mapPriceLevel(${hi})`
          );
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// filterByPrice — unit tests
// ---------------------------------------------------------------------------
describe("filterByPrice", () => {
  const places = [
    { name: "Cheap", priceLevel: 1 },
    { name: "Mid",   priceLevel: 2 },
    { name: "Pricey", priceLevel: 3 },
    { name: "Luxury", priceLevel: 4 },
  ];

  it("returns input unchanged when maxPricePkr is undefined", () => {
    const result = filterByPrice(places, undefined);
    assert.deepEqual(result, places);
  });

  it("filters out places above the mapped ceiling", () => {
    // 800 PKR → ceiling 2; levels 3 and 4 should be excluded
    const result = filterByPrice(places, 800);
    assert.ok(result.every((p) => placePriceLevel(p) <= 2));
  });

  it("respects Google Places price_level field", () => {
    const googleStyle = [
      { name: "A", price_level: 1 },
      { name: "B", price_level: 4 },
    ];
    const result = filterByPrice(googleStyle, 400);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, "A");
  });

  it("keeps all places when maxPricePkr maps to level 4", () => {
    const result = filterByPrice(places, 2000);
    assert.equal(result.length, places.length);
  });

  // Feature: local-search-enhancement, Property 3: No-filter pass-through
  // Validates: Requirements 2.3
  it("Property 3: No-filter pass-through — undefined maxPricePkr returns same contents", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ priceLevel: fc.integer({ min: 0, max: 4 }), name: fc.string() })
        ),
        (arr) => {
          const result = filterByPrice(arr, undefined);
          assert.deepEqual(result, arr);
        }
      ),
      { numRuns: 200 }
    );
  });

  // Feature: local-search-enhancement, Property 1: Price filter ceiling
  // Validates: Requirements 2.2
  it("Property 1: Price filter ceiling — all results have priceLevel <= mapped ceiling", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ priceLevel: fc.integer({ min: 0, max: 4 }), name: fc.string() })
        ),
        fc.integer({ min: 1, max: 10000 }),
        (arr, maxPricePkr) => {
          const ceiling = mapPriceLevel(maxPricePkr);
          const result = filterByPrice(arr, maxPricePkr);
          assert.ok(
            result.every((p) => placePriceLevel(p) <= ceiling),
            `Found a result with priceLevel > ${ceiling}`
          );
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// formatResults — unit tests
// ---------------------------------------------------------------------------
describe("formatResults", () => {
  const makePlaces = (n) =>
    Array.from({ length: n }, (_, i) => ({
      place_id: `place_${i}`,
      name: `Restaurant ${i}`,
      formatted_address: `${i} Main St`,
      price_level: (i % 4) + 1,
      rating: 4.0,
      geometry: { location: { lat: 31.5 + i * 0.01, lng: 74.3 + i * 0.01 } },
    }));

  it("caps output at 5 results", () => {
    const result = formatResults(makePlaces(10));
    assert.equal(result.length, 5);
  });

  it("returns all results when input has fewer than 5", () => {
    const result = formatResults(makePlaces(3));
    assert.equal(result.length, 3);
  });

  it("returns empty array for empty input", () => {
    assert.deepEqual(formatResults([]), []);
  });

  it("builds a valid orderLink for each result", () => {
    const results = formatResults(makePlaces(3));
    for (const r of results) {
      assert.doesNotThrow(() => new URL(r.orderLink));
      assert.ok(r.orderLink.includes(r.id));
    }
  });

  it("computes distanceKm when user coords are provided", () => {
    const places = makePlaces(1);
    const [result] = formatResults(places, 31.5, 74.3);
    assert.ok(typeof result.distanceKm === "number");
    assert.ok(result.distanceKm >= 0);
  });

  it("defaults distanceKm to 0 when no user coords", () => {
    const [result] = formatResults(makePlaces(1));
    assert.equal(result.distanceKm, 0);
  });

  // Feature: local-search-enhancement, Property 4: Result count cap
  // Validates: Requirements 1.4
  it("Property 4: Result count cap — formatResults never returns more than 5 items", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            place_id: fc.string({ minLength: 1 }),
            name: fc.string(),
            formatted_address: fc.string(),
            price_level: fc.integer({ min: 0, max: 4 }),
            rating: fc.float({ min: 0, max: 5 }),
          }),
          { maxLength: 50 }
        ),
        (places) => {
          assert.ok(formatResults(places).length <= 5);
        }
      ),
      { numRuns: 200 }
    );
  });

  // Feature: local-search-enhancement, Property 6: Order link format
  // Validates: Requirements 5.1
  it("Property 6: Order link format — every orderLink is a valid URL", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            place_id: fc.string({ minLength: 1 }),
            name: fc.string(),
            formatted_address: fc.string(),
          }),
          { maxLength: 10 }
        ),
        (places) => {
          const results = formatResults(places);
          for (const r of results) {
            assert.doesNotThrow(
              () => new URL(r.orderLink),
              `Invalid URL: ${r.orderLink}`
            );
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// haversineKm — sanity checks
// ---------------------------------------------------------------------------
describe("haversineKm", () => {
  it("returns 0 for identical coordinates", () => {
    assert.equal(haversineKm(31.5, 74.3, 31.5, 74.3), 0);
  });

  it("returns a positive distance for different coordinates", () => {
    const d = haversineKm(31.5, 74.3, 31.6, 74.4);
    assert.ok(d > 0);
  });

  it("is symmetric", () => {
    const d1 = haversineKm(31.5, 74.3, 31.6, 74.4);
    const d2 = haversineKm(31.6, 74.4, 31.5, 74.3);
    assert.ok(Math.abs(d1 - d2) < 0.0001);
  });
});
