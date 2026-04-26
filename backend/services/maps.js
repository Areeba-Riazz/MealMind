/**
 * Calls the Google Maps Places Text Search endpoint.
 */
async function searchPlaces(foodTerm, lat, lng, area, radiusMeters) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  const query = area ? `${foodTerm} in ${area}` : foodTerm;

  const params = new URLSearchParams({
    query,
    key: apiKey,
    type: "restaurant",
  });

  if (lat != null && lng != null) {
    params.set("location", `${lat},${lng}`);
    // Use provided radius, clamp between 500m and 50000m, default 5000m
    const radius = Math.min(50000, Math.max(500, Number(radiusMeters) || 5000));
    params.set("radius", String(radius));
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Places API responded with HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API error: ${data.status} — ${data.error_message ?? ""}`);
  }

  const places = data.results ?? [];

  // Fetch phone numbers for top 5 results via Place Details API
  const detailsPromises = places.slice(0, 5).map(async (place) => {
    if (!place.place_id) return place;
    try {
      const detailParams = new URLSearchParams({
        place_id: place.place_id,
        fields: "formatted_phone_number,international_phone_number,website",
        key: apiKey,
      });
      const detailRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?${detailParams.toString()}`
      );
      if (!detailRes.ok) return place;
      const detailData = await detailRes.json();
      if (detailData.status === "OK" && detailData.result) {
        return {
          ...place,
          formatted_phone_number: detailData.result.formatted_phone_number ?? null,
          international_phone_number: detailData.result.international_phone_number ?? null,
          website: detailData.result.website ?? null,
        };
      }
    } catch {
      // non-fatal
    }
    return place;
  });

  const topWithPhones = await Promise.all(detailsPromises);
  return [...topWithPhones, ...places.slice(5)];
}

module.exports = {
  searchPlaces,
};