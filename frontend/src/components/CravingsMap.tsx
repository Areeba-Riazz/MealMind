import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's broken default icon paths when bundled with Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface RestaurantPin {
  id: string;
  name: string;
  address: string;
  rating: number;
  orderLink: string;
  lat: number | null;
  lng: number | null;
}

interface CravingsMapProps {
  userLat: number | null;
  userLng: number | null;
  restaurants: RestaurantPin[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Custom SVG icons — orange for user, accent-coloured numbered pins for restaurants
function userIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:36px; height:36px; border-radius:50%;
        background:rgba(232,82,42,0.9);
        border:3px solid #fff;
        box-shadow:0 2px 10px rgba(232,82,42,0.6);
        display:flex; align-items:center; justify-content:center;
        font-size:16px;
      ">📍</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function restaurantIcon(index: number) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:30px; height:30px; border-radius:50%;
        background:#1a1a1a;
        border:2px solid rgba(232,82,42,0.8);
        box-shadow:0 2px 8px rgba(0,0,0,0.5);
        display:flex; align-items:center; justify-content:center;
        font-size:12px; font-weight:800; color:#e8522a;
        font-family:'DM Sans',sans-serif;
      ">${index + 1}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

export default function CravingsMap({ userLat, userLng, restaurants }: CravingsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Destroy previous instance on re-render
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Determine center: prefer user location, then first restaurant with coords
    const firstRestaurant = restaurants.find(r => r.lat != null && r.lng != null);
    const centerLat = userLat ?? firstRestaurant?.lat ?? 31.5204; // fallback: Lahore
    const centerLng = userLng ?? firstRestaurant?.lng ?? 74.3587;

    const map = L.map(mapRef.current, {
      center: [centerLat, centerLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    // Dark-themed OpenStreetMap tile layer (CartoDB Dark Matter — free, no key)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // User location marker
    if (userLat != null && userLng != null) {
      L.marker([userLat, userLng], { icon: userIcon() })
        .addTo(map)
        .bindPopup('<strong style="color:#e8522a">📍 Your location</strong>')
        .openPopup();
    }

    // Restaurant markers
    const bounds: [number, number][] = [];
    if (userLat != null && userLng != null) bounds.push([userLat, userLng]);

    restaurants.forEach((r, i) => {
      if (r.lat == null || r.lng == null) return;
      bounds.push([r.lat, r.lng]);

      const stars = r.rating > 0 ? `★ ${r.rating.toFixed(1)}` : '';
      const safeName = escapeHtml(r.name);
      const safeAddress = escapeHtml(r.address);
      const popup = `
        <div style="font-family:'DM Sans',sans-serif; min-width:160px;">
          <strong style="font-size:0.9rem; color:#f2ede4;">${safeName}</strong><br/>
          <span style="font-size:0.75rem; color:#888;">${safeAddress}</span><br/>
          ${stars ? `<span style="color:#f5c842; font-size:0.78rem;">${stars}</span><br/>` : ''}
          <a href="${r.orderLink}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block; margin-top:6px; padding:4px 12px; background:#e8522a;
                   color:#fff; border-radius:100px; font-size:0.75rem; font-weight:700;
                   text-decoration:none;">
            Order ↗
          </a>
        </div>`;

      L.marker([r.lat, r.lng], { icon: restaurantIcon(i) })
        .addTo(map)
        .bindPopup(popup);
    });

    // Fit map to show all markers
    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsLiteral, { padding: [40, 40], maxZoom: 15 });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [userLat, userLng, restaurants]);

  return (
    <div style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginTop: '1.6rem' }}>
      {/* Map header */}
      <div style={{
        background: 'rgba(22,22,22,0.9)',
        padding: '0.75rem 1.2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.35)' }}>
          🗺️ Restaurant Map
        </span>
        {userLat != null && (
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(232,82,42,0.8)', fontWeight: 600 }}>
            📍 Your location detected
          </span>
        )}
      </div>
      {/* Leaflet map container */}
      <div ref={mapRef} style={{ height: '340px', width: '100%' }} />
    </div>
  );
}
