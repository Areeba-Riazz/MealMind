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
process.env.NODE_ENV = "test";

const {
  PRICE_TIER_MAP,
  mapPriceLevel,
  filterByPrice,
  formatResults,
  haversineKm,
  placePriceLevel,
  sanitiseWebsite,
  extractPhones,
  foodpandaSearchUrl,
  uberEatsSearchUrl,
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

  it("builds a valid orderLink for each result (backward compat)", () => {
    const results = formatResults(makePlaces(3));
    for (const r of results) {
      assert.doesNotThrow(() => new URL(r.orderLink));
      assert.ok(r.orderLink.includes(r.id));
    }
  });

  it("builds a valid googleMapsLink matching orderLink", () => {
    const results = formatResults(makePlaces(3));
    for (const r of results) {
      assert.equal(r.googleMapsLink, r.orderLink);
      assert.doesNotThrow(() => new URL(r.googleMapsLink));
    }
  });

  it("builds valid foodpandaLink and uberEatsLink for each result", () => {
    const results = formatResults(makePlaces(3));
    for (const r of results) {
      assert.doesNotThrow(() => new URL(r.foodpandaLink), `Invalid foodpandaLink: ${r.foodpandaLink}`);
      assert.doesNotThrow(() => new URL(r.uberEatsLink), `Invalid uberEatsLink: ${r.uberEatsLink}`);
      assert.ok(r.foodpandaLink.includes("foodpanda.pk"));
      assert.ok(r.uberEatsLink.includes("ubereats.com"));
    }
  });

  it("exposes phones as an array", () => {
    const places = [{
      place_id: "p1",
      name: "Test",
      formatted_address: "1 St",
      formatted_phone_number: "042-111-222",
      international_phone_number: "+92-42-111-222",
      geometry: { location: { lat: 31.5, lng: 74.3 } },
    }];
    const [r] = formatResults(places);
    assert.ok(Array.isArray(r.phones));
    assert.ok(r.phones.length >= 1);
  });

  it("phones array is empty when no phone data present", () => {
    const [r] = formatResults(makePlaces(1));
    assert.ok(Array.isArray(r.phones));
    assert.equal(r.phones.length, 0);
  });

  it("website is null when not present on place", () => {
    const [r] = formatResults(makePlaces(1));
    assert.equal(r.website, null);
  });

  it("website is set when place has a valid website", () => {
    const places = [{
      place_id: "p1",
      name: "Test",
      formatted_address: "1 St",
      website: "https://example.com",
      geometry: { location: { lat: 31.5, lng: 74.3 } },
    }];
    const [r] = formatResults(places);
    assert.equal(r.website, "https://example.com");
  });

  it("website is null when place has an invalid website", () => {
    const places = [{
      place_id: "p1",
      name: "Test",
      formatted_address: "1 St",
      website: "not-a-url",
      geometry: { location: { lat: 31.5, lng: 74.3 } },
    }];
    const [r] = formatResults(places);
    assert.equal(r.website, null);
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

  // Property: foodpandaLink and uberEatsLink are always valid URLs
  it("Property: platform search links are always valid URLs", () => {
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
            assert.doesNotThrow(() => new URL(r.foodpandaLink));
            assert.doesNotThrow(() => new URL(r.uberEatsLink));
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

// ---------------------------------------------------------------------------
// sanitiseWebsite — unit tests
// ---------------------------------------------------------------------------
describe("sanitiseWebsite", () => {
  it("returns valid https URL unchanged", () => {
    assert.equal(sanitiseWebsite("https://example.com"), "https://example.com");
  });

  it("returns valid http URL unchanged", () => {
    assert.equal(sanitiseWebsite("http://restaurant.pk"), "http://restaurant.pk");
  });

  it("returns null for null input", () => {
    assert.equal(sanitiseWebsite(null), null);
  });

  it("returns null for undefined input", () => {
    assert.equal(sanitiseWebsite(undefined), null);
  });

  it("returns null for empty string", () => {
    assert.equal(sanitiseWebsite(""), null);
  });

  it("returns null for whitespace-only string", () => {
    assert.equal(sanitiseWebsite("   "), null);
  });

  it("returns null for non-HTTP protocol (ftp)", () => {
    assert.equal(sanitiseWebsite("ftp://files.example.com"), null);
  });

  it("returns null for bare IPv4 address", () => {
    assert.equal(sanitiseWebsite("http://192.168.1.1"), null);
    assert.equal(sanitiseWebsite("https://10.0.0.1"), null);
  });

  it("returns null for hostname without TLD", () => {
    assert.equal(sanitiseWebsite("http://localhost"), null);
  });

  it("returns null for completely malformed string", () => {
    assert.equal(sanitiseWebsite("not-a-url"), null);
    assert.equal(sanitiseWebsite("just some text"), null);
  });

  it("trims whitespace before validating", () => {
    assert.equal(sanitiseWebsite("  https://example.com  "), "https://example.com");
  });

  it("accepts URLs with paths and query strings", () => {
    const url = "https://restaurant.com/menu?lang=en";
    assert.equal(sanitiseWebsite(url), url);
  });

  // Property: sanitiseWebsite never returns a non-HTTP(S) URL
  it("Property: result is always null or an http/https URL", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const result = sanitiseWebsite(s);
        if (result !== null) {
          assert.doesNotThrow(() => new URL(result));
          const u = new URL(result);
          assert.ok(["http:", "https:"].includes(u.protocol));
        }
      }),
      { numRuns: 500 }
    );
  });
});

// ---------------------------------------------------------------------------
// extractPhones — unit tests
// ---------------------------------------------------------------------------
describe("extractPhones", () => {
  it("returns empty array when no phone fields present", () => {
    assert.deepEqual(extractPhones({}), []);
  });

  it("returns empty array when both fields are null", () => {
    assert.deepEqual(extractPhones({ formatted_phone_number: null, international_phone_number: null }), []);
  });

  it("returns single phone when only formatted_phone_number is set", () => {
    const result = extractPhones({ formatted_phone_number: "042-111-222" });
    assert.deepEqual(result, ["042-111-222"]);
  });

  it("returns single phone when only international_phone_number is set", () => {
    const result = extractPhones({ international_phone_number: "+92-42-111-222" });
    assert.deepEqual(result, ["+92-42-111-222"]);
  });

  it("returns both phones when they are different", () => {
    const result = extractPhones({
      formatted_phone_number: "042-111-222",
      international_phone_number: "+92-42-111-222",
    });
    assert.equal(result.length, 2);
    assert.ok(result.includes("042-111-222"));
    assert.ok(result.includes("+92-42-111-222"));
  });

  it("deduplicates identical phone numbers", () => {
    const result = extractPhones({
      formatted_phone_number: "042-111-222",
      international_phone_number: "042-111-222",
    });
    assert.equal(result.length, 1);
    assert.deepEqual(result, ["042-111-222"]);
  });

  it("ignores empty string phone values", () => {
    const result = extractPhones({ formatted_phone_number: "", international_phone_number: "+92-42-111" });
    assert.deepEqual(result, ["+92-42-111"]);
  });

  // Property: result length is always 0, 1, or 2
  it("Property: phones array length is always 0–2", () => {
    fc.assert(
      fc.property(
        fc.record({
          formatted_phone_number: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
          international_phone_number: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
        }),
        (place) => {
          const result = extractPhones(place);
          assert.ok(Array.isArray(result));
          assert.ok(result.length >= 0 && result.length <= 2);
        }
      ),
      { numRuns: 300 }
    );
  });

  // Property: no duplicates in result
  it("Property: extractPhones never returns duplicate entries", () => {
    fc.assert(
      fc.property(
        fc.record({
          formatted_phone_number: fc.oneof(fc.string(), fc.constant(null)),
          international_phone_number: fc.oneof(fc.string(), fc.constant(null)),
        }),
        (place) => {
          const result = extractPhones(place);
          const unique = new Set(result);
          assert.equal(unique.size, result.length);
        }
      ),
      { numRuns: 300 }
    );
  });
});

// ---------------------------------------------------------------------------
// foodpandaSearchUrl / uberEatsSearchUrl — unit tests
// ---------------------------------------------------------------------------
describe("foodpandaSearchUrl", () => {
  it("returns a valid URL", () => {
    assert.doesNotThrow(() => new URL(foodpandaSearchUrl("Burger Lab")));
  });

  it("contains the restaurant name in the query string", () => {
    const url = new URL(foodpandaSearchUrl("Burger Lab"));
    assert.equal(url.searchParams.get("q"), "Burger Lab");
  });

  it("URL-encodes special characters in the name", () => {
    const url = new URL(foodpandaSearchUrl("Café & Grill"));
    assert.ok(url.searchParams.get("q") === "Café & Grill");
  });

  it("Property: always returns a valid foodpanda.pk URL", () => {
    fc.assert(
      fc.property(fc.string(), (name) => {
        const url = foodpandaSearchUrl(name);
        assert.doesNotThrow(() => new URL(url));
        assert.ok(new URL(url).hostname.includes("foodpanda.pk"));
      }),
      { numRuns: 200 }
    );
  });
});

describe("uberEatsSearchUrl", () => {
  it("returns a valid URL", () => {
    assert.doesNotThrow(() => new URL(uberEatsSearchUrl("Burger Lab")));
  });

  it("contains the restaurant name in the query string", () => {
    const url = new URL(uberEatsSearchUrl("Burger Lab"));
    assert.equal(url.searchParams.get("q"), "Burger Lab");
  });

  it("Property: always returns a valid ubereats.com URL", () => {
    fc.assert(
      fc.property(fc.string(), (name) => {
        const url = uberEatsSearchUrl(name);
        assert.doesNotThrow(() => new URL(url));
        assert.ok(new URL(url).hostname.includes("ubereats.com"));
      }),
      { numRuns: 200 }
    );
  });
});
