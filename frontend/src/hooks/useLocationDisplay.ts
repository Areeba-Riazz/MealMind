import { useEffect, useState } from 'react';
import { useGeolocation } from './useGeolocation';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const LS_KEY = 'cravings_location_override';

export interface LocationOverride {
  label: string; // display name e.g. "Lahore"
  area: string;  // value sent to API
  lat?: number;
  lng?: number;
}

export interface LocationDisplayState {
  /** Human-readable label for the header */
  displayLabel: string | null;
  /** Area string to pass to the API (null = use coords) */
  overrideArea: string | null;
  /** Override coords if the user pinned a location on the map */
  overrideLat: number | null;
  overrideLng: number | null;
  /** True while geo + reverse-geocode is in progress */
  loading: boolean;
  /** Whether the user has an active manual override */
  hasOverride: boolean;
  setOverride: (override: LocationOverride, uid?: string) => void;
  clearOverride: (uid?: string) => void;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = (await res.json()) as {
      address?: { city?: string; town?: string; suburb?: string; county?: string; state?: string };
    };
    const a = data.address ?? {};
    return a.city ?? a.town ?? a.suburb ?? a.county ?? a.state ?? 'Your location';
  } catch {
    return 'Your location';
  }
}

export function useLocationDisplay(uid?: string): LocationDisplayState {
  const geo = useGeolocation();
  const [geoLabel, setGeoLabel] = useState<string | null>(null);
  const [override, setOverrideState] = useState<LocationOverride | null>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as LocationOverride) : null;
    } catch {
      return null;
    }
  });

  // Reverse-geocode when we have coords and no override
  useEffect(() => {
    if (override) return;
    if (geo.lat == null || geo.lng == null) return;
    let cancelled = false;
    reverseGeocode(geo.lat, geo.lng).then((label) => {
      if (!cancelled) setGeoLabel(label);
    });
    return () => { cancelled = true; };
  }, [geo.lat, geo.lng, override]);

  const setOverride = (o: LocationOverride, userId?: string) => {
    setOverrideState(o);
    localStorage.setItem(LS_KEY, JSON.stringify(o));
    const id = userId ?? uid;
    if (id && db) {
      void setDoc(doc(db, 'users', id), { locationOverride: o }, { merge: true });
    }
  };

  const clearOverride = (userId?: string) => {
    setOverrideState(null);
    localStorage.removeItem(LS_KEY);
    const id = userId ?? uid;
    if (id && db) {
      void setDoc(doc(db, 'users', id), { locationOverride: null }, { merge: true });
    }
  };

  const hasOverride = override !== null;
  const loading = geo.loading && !override;

  let displayLabel: string | null = null;
  if (override) {
    displayLabel = override.label;
  } else if (geoLabel) {
    displayLabel = geoLabel;
  } else if (!geo.loading && geo.denied) {
    displayLabel = null; // will show "Set location" prompt
  }

  return {
    displayLabel,
    overrideArea: override?.area ?? null,
    overrideLat: override?.lat ?? null,
    overrideLng: override?.lng ?? null,
    loading,
    hasOverride,
    setOverride,
    clearOverride,
  };
}
