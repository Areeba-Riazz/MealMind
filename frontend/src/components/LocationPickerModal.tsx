import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import type { LocationOverride } from '../hooks/useLocationDisplay';

// Fix Leaflet icon paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function pinIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;border-radius:50%;background:rgba(232,82,42,0.9);border:3px solid #fff;box-shadow:0 2px 10px rgba(232,82,42,0.6);display:flex;align-items:center;justify-content:center;font-size:16px;">📍</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: { city?: string; town?: string; suburb?: string; county?: string; state?: string };
}

async function geocode(query: string): Promise<NominatimResult[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
    { headers: { 'Accept-Language': 'en' } }
  );
  return res.json() as Promise<NominatimResult[]>;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = (await res.json()) as NominatimResult;
    const a = data.address ?? {};
    const short = a.city ?? a.town ?? a.suburb ?? a.county ?? a.state ?? '';
    return short || data.display_name.split(',')[0];
  } catch {
    return 'Selected location';
  }
}

interface Props {
  onClose: () => void;
  onSelect: (o: LocationOverride) => void;
  onUseDevice: () => void;
  hasOverride: boolean;
  initialLat?: number | null;
  initialLng?: number | null;
}

// Default center: Lahore
const DEFAULT_LAT = 31.5204;
const DEFAULT_LNG = 74.3587;

export default function LocationPickerModal({
  onClose, onSelect, onUseDevice, hasOverride, initialLat, initialLng,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pinLabel, setPinLabel] = useState<string | null>(null);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const startLat = initialLat ?? DEFAULT_LAT;
    const startLng = initialLng ?? DEFAULT_LNG;

    const map = L.map(mapRef.current, {
      center: [startLat, startLng],
      zoom: 13,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    const tile = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    L.tileLayer(tile, {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // If we have an initial location, drop a pin
    if (initialLat != null && initialLng != null) {
      const marker = L.marker([initialLat, initialLng], { icon: pinIcon(), draggable: true }).addTo(map);
      markerRef.current = marker;
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        const label = await reverseGeocode(pos.lat, pos.lng);
        setPinLabel(label);
        setPinCoords({ lat: pos.lat, lng: pos.lng });
      });
      void reverseGeocode(initialLat, initialLng).then((l) => {
        setPinLabel(l);
        setPinCoords({ lat: initialLat, lng: initialLng });
      });
    }

    // Click on map to place/move pin
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: pinIcon(), draggable: true }).addTo(map);
        markerRef.current = marker;
        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          const label = await reverseGeocode(pos.lat, pos.lng);
          setPinLabel(label);
          setPinCoords({ lat: pos.lat, lng: pos.lng });
        });
      }
      const label = await reverseGeocode(lat, lng);
      setPinLabel(label);
      setPinCoords({ lat, lng });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchInput.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await geocode(searchInput);
        setSuggestions(results.slice(0, 5));
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  function flyToAndPin(lat: number, lng: number, label: string) {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([lat, lng], 14, { duration: 0.8 });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { icon: pinIcon(), draggable: true }).addTo(map);
      markerRef.current = marker;
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        const l = await reverseGeocode(pos.lat, pos.lng);
        setPinLabel(l);
        setPinCoords({ lat: pos.lat, lng: pos.lng });
      });
    }
    setPinLabel(label);
    setPinCoords({ lat, lng });
    setSuggestions([]);
    setSearchInput('');
  }

  function handleUseDevice() {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const label = await reverseGeocode(lat, lng);
        flyToAndPin(lat, lng, label);
        setGeoLoading(false);
      },
      () => setGeoLoading(false)
    );
  }

  function handleConfirm() {
    if (!pinCoords || !pinLabel) return;
    onSelect({ label: pinLabel, area: pinLabel, lat: pinCoords.lat, lng: pinCoords.lng });
    onClose();
  }

  function handleClearAndUseDevice() {
    onUseDevice();
    onClose();
  }

  const bg = isDark ? '#141414' : '#f8f7f5';
  const cardBg = isDark ? '#1c1c1c' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const inputBg = isDark ? '#242424' : '#f0efed';
  const textColor = isDark ? '#f2ede4' : '#1a1a1a';
  const mutedColor = isDark ? '#888' : '#666';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: cardBg, border: `1px solid ${border}`,
        borderRadius: '22px', width: '100%', maxWidth: '520px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.2rem 1.5rem', borderBottom: `1px solid ${border}`,
          background: bg,
        }}>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1rem', color: textColor }}>
            📍 Set Your Location
          </span>
          <button
            type="button" onClick={onClose}
            style={{ background: 'none', border: 'none', color: mutedColor, cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}
            aria-label="Close"
          >×</button>
        </div>

        {/* Use device location */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${border}` }}>
          <button
            type="button"
            onClick={handleUseDevice}
            disabled={geoLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.5rem', padding: '0.7rem', borderRadius: '12px',
              background: 'rgba(232,82,42,0.1)', border: '1px solid rgba(232,82,42,0.3)',
              color: '#e8522a', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif", transition: 'all 0.18s',
            }}
          >
            {geoLoading ? '⏳ Detecting...' : '🎯 Use my current location'}
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${border}`, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for a city or address..."
              style={{
                width: '100%', background: inputBg, border: `1px solid ${border}`,
                borderRadius: '10px', padding: '0.7rem 1rem', color: textColor,
                fontSize: '0.88rem', fontFamily: "'DM Sans',sans-serif", outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searching && (
              <span style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: mutedColor, fontSize: '0.75rem' }}>
                searching...
              </span>
            )}
          </div>

          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute', left: '1.5rem', right: '1.5rem', top: 'calc(100% - 0.5rem)',
              background: cardBg, border: `1px solid ${border}`, borderRadius: '12px',
              boxShadow: '0 8px 28px rgba(0,0,0,0.2)', zIndex: 10, overflow: 'hidden',
            }}>
              {suggestions.map((s, i) => {
                const a = s.address ?? {};
                const short = a.city ?? a.town ?? a.suburb ?? a.county ?? a.state ?? s.display_name.split(',')[0];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => flyToAndPin(parseFloat(s.lat), parseFloat(s.lon), short)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '0.65rem 1rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: i < suggestions.length - 1 ? `1px solid ${border}` : 'none',
                      color: textColor, fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{short}</div>
                    <div style={{ fontSize: '0.72rem', color: mutedColor, marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.display_name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{ position: 'relative', flex: 1, minHeight: '260px' }}>
          <div ref={mapRef} style={{ height: '260px', width: '100%' }} />
          {!pinCoords && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', pointerEvents: 'none',
            }}>
              <div style={{
                background: isDark ? 'rgba(20,20,20,0.85)' : 'rgba(255,255,255,0.85)',
                borderRadius: '10px', padding: '0.5rem 1rem',
                fontSize: '0.78rem', color: mutedColor, fontFamily: "'DM Sans',sans-serif",
              }}>
                Tap the map or search to pin a location
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem', borderTop: `1px solid ${border}`,
          display: 'flex', gap: '0.6rem', background: bg,
        }}>
          {hasOverride && (
            <button
              type="button"
              onClick={handleClearAndUseDevice}
              style={{
                flex: 1, padding: '0.65rem', borderRadius: '100px',
                background: 'none', border: `1px solid ${border}`,
                color: mutedColor, fontSize: '0.82rem', cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Reset to GPS
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!pinCoords}
            style={{
              flex: 2, padding: '0.7rem', borderRadius: '100px',
              background: pinCoords ? '#e8522a' : 'rgba(232,82,42,0.3)',
              border: 'none', color: '#fff', fontWeight: 700,
              fontSize: '0.88rem', cursor: pinCoords ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans',sans-serif", transition: 'all 0.18s',
            }}
          >
            {pinLabel ? `Confirm — ${pinLabel}` : 'Confirm Location'}
          </button>
        </div>
      </div>
    </div>
  );
}
