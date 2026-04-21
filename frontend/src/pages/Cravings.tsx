import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import CravingsMap from '../components/CravingsMap';
import LocationPickerModal from '../components/LocationPickerModal';
import SkeletonCard from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { useFoodLinks } from '../context/FoodLinksContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLocationDisplay } from '../hooks/useLocationDisplay';
import { logEvent } from '../lib/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CravingResult {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  priceLevel: number;
  rating: number;
  lat: number | null;
  lng: number | null;
  // Ordering links
  orderLink: string;           // kept for FoodLinks save-link compat (= googleMapsLink)
  googleMapsLink: string;
  foodpandaLink: string;       // direct listing if foodpandaIsDirect, else search fallback
  foodpandaIsDirect: boolean;  // true = confirmed direct listing, false = search fallback
  // Social links (null if not found)
  instagramUrl: string | null;
  facebookUrl: string | null;
  // Contact
  phones: string[];
  phone: string | null;        // legacy
  // Website (sanitised by backend)
  website: string | null;
}

interface CravingsResponse {
  error?: string;
  message?: string;
  results: CravingResult[];
}

const QUICK = [
  'Burger: I want a spicy zinger burger',
  'Pizza: I want an extra large pepperoni pizza',
  'Steak: I want a juicy medium rare steak',
  'Salad: I want a healthy grilled chicken salad',
  'Sushi: I want a freshly made sushi platter',
];

// ─── OrderMenu ────────────────────────────────────────────────────────────────

interface OrderMenuItem {
  key: string;
  icon: string;
  label: string;
  href: string;
  color?: string;
  isCall?: boolean;
}

function buildMenuItems(result: CravingResult): OrderMenuItem[] {
  const items: OrderMenuItem[] = [];

  // FoodPanda — label differs based on whether it's a direct listing or search fallback
  items.push({
    key: 'foodpanda',
    icon: '🟡',
    label: result.foodpandaIsDirect ? 'Order on FoodPanda' : 'Search on FoodPanda',
    href: result.foodpandaLink,
    color: '#d70f64',
  });

  if (result.website) {
    items.push({
      key: 'website',
      icon: '🌐',
      label: 'Visit Website',
      href: result.website,
      color: '#4a9eff',
    });
  }

  if (result.instagramUrl) {
    items.push({
      key: 'instagram',
      icon: '📸',
      label: 'Instagram',
      href: result.instagramUrl,
      color: '#e1306c',
    });
  }

  if (result.facebookUrl) {
    items.push({
      key: 'facebook',
      icon: '📘',
      label: 'Facebook',
      href: result.facebookUrl,
      color: '#1877f2',
    });
  }

  // One entry per phone number
  const phones = result.phones?.length ? result.phones : (result.phone ? [result.phone] : []);
  phones.forEach((phone, i) => {
    const digits = phone.replace(/[^0-9+]/g, '');
    items.push({
      key: `phone-${i}`,
      icon: '☎️',
      label: phone,
      href: `tel:${digits}`,
      isCall: true,
    });
  });

  items.push({
    key: 'maps',
    icon: '🗺️',
    label: 'Directions (Maps)',
    href: result.googleMapsLink ?? result.orderLink,
    color: '#e8522a',
  });

  return items;
}

function OrderMenu({
  result,
  onAction,
}: {
  result: CravingResult;
  onAction: (label: string, href: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const items = buildMenuItems(result);
  const hasItems = items.length > 0;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  // Focus management when menu opens
  useEffect(() => {
    if (open && focusedIndex >= 0) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [open, focusedIndex]);

  function handleToggle() {
    if (!open) {
      setOpen(true);
      setFocusedIndex(0);
    } else {
      setOpen(false);
      setFocusedIndex(-1);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!open) return;
    if (e.key === 'Escape') {
      setOpen(false);
      setFocusedIndex(-1);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, items.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    }
  }

  if (!hasItems) {
    return (
      <span className="btn-order" style={{ opacity: 0.4, cursor: 'default' }}>
        No contact
      </span>
    );
  }

  return (
    <div
      className="crav-dropdown"
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="btn-order"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
      >
        Order Now {open ? '▲' : '▼'}
      </button>

      {open && (
        <div
          className="crav-dropdown-menu"
          role="menu"
          aria-label={`${result.name} ordering options`}
        >
          {items.map((item, idx) => (
            <a
              key={item.key}
              ref={(el) => { itemRefs.current[idx] = el; }}
              href={item.href}
              target={item.isCall ? undefined : '_blank'}
              rel={item.isCall ? undefined : 'noopener noreferrer'}
              className="crav-dropdown-item"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              style={item.color ? { '--item-color': item.color } as React.CSSProperties : undefined}
              onClick={() => {
                setOpen(false);
                setFocusedIndex(-1);
                onAction(item.label, item.href);
              }}
            >
              <span className="crav-menu-icon">{item.icon}</span>
              <span className="crav-menu-label" style={item.color ? { color: item.color } : undefined}>
                {item.label}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Cravings() {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CravingResult[] | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const geo = useGeolocation();
  const loc = useLocationDisplay(user?.uid);
  const { links, addFoodLink, removeFoodLink } = useFoodLinks();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    setEmptyMessage(null);
    setError(null);

    try {
      const body: Record<string, unknown> = { query };

      if (loc.overrideArea) {
        // If override has coords, use them for better accuracy
        if (loc.overrideLat != null && loc.overrideLng != null) {
          body.lat = loc.overrideLat;
          body.lng = loc.overrideLng;
        } else {
          body.area = loc.overrideArea;
        }
      } else if (geo.lat != null && geo.lng != null) {
        body.lat = geo.lat;
        body.lng = geo.lng;
      } else if (area.trim()) {
        body.area = area.trim();
      }

      const res = await fetch('/api/cravings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as CravingsResponse;

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      if (data.results.length === 0) {
        setEmptyMessage(
          data.message ?? 'No restaurants found. Try broadening your search or adjusting the area.'
        );
        setResults([]);
        return;
      }

      setResults(data.results);

      void logEvent({
        userId: user?.uid ?? 'anonymous',
        type: 'search_craving',
        metadata: {
          query,
          location: loc.overrideArea ? 'override' : (geo.lat != null && geo.lng != null ? 'browser' : 'manual'),
        },
      });
    } catch {
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasCoords = geo.lat != null && geo.lng != null;
  const geoReady = !geo.loading;
  const needsArea = geoReady && !hasCoords && !loc.overrideArea;
  const canSubmit = !loading && (geoReady || loc.overrideArea != null) && query.trim() !== '';

  return (
    <>
      <style>{`
        .crav-wrap { max-width: 720px; margin: 0 auto; animation: cravfade 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes cravfade { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .craving-head { margin-bottom:1.5rem; }
        .craving-title { font-family:'Syne',sans-serif; font-size:1.45rem; font-weight:800; margin:0 0 0.5rem; letter-spacing:-0.5px; display:flex; align-items:center; gap:0.5rem; color:var(--text); }
        .craving-sub { font-size:0.87rem; color:var(--muted); margin:0 0 1.5rem; }
        .crav-quick { display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.2rem; }
        .crav-quick-chip { font:500 0.78rem 'DM Sans',sans-serif; cursor:pointer; padding:0.35rem 0.8rem; border-radius:100px; border:1px solid var(--border2); background:var(--glass-overlay); color:var(--muted); transition:all 0.18s; }
        .crav-quick-chip:hover { border-color:rgba(232,82,42,0.4); color:var(--accent); background:rgba(232,82,42,0.06); }
        .crav-input-wrap { position:relative; margin-bottom:0.9rem; }
        .craving-input { width:100%; background:var(--input-bg); border:1px solid var(--border2); border-radius:14px; padding:1rem 1.15rem; color:var(--text); font:0.95rem 'DM Sans',sans-serif; outline:none; transition:border-color 0.2s; }
        .craving-input::placeholder { color:var(--muted2); }
        .craving-input:focus { border-color:var(--accent); }
        .btn-hunt { width:100%; background:var(--accent); color:rgba(255,255,255,0.95); border:none; border-radius:100px; padding:0.9rem; font:700 0.95rem 'DM Sans',sans-serif; cursor:pointer; box-shadow:0 4px 12px rgba(232,82,42,0.25); transition:all 0.2s; }
        .btn-hunt:disabled { opacity:0.5; cursor:not-allowed; }
        .craving-error { background:rgba(255,80,80,0.08); border:1px solid rgba(255,80,80,0.15); border-radius:12px; padding:0.8rem 1rem; color:#ff8a8a; font-size:0.85rem; margin-bottom:1.5rem; }
        .crav-results-label { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:var(--muted); margin:0 0 0.9rem; }
        .crav-results { display:flex; flex-direction:column; gap:0.9rem; }
        .crav-result-card { background:var(--glass-overlay); border:1px solid var(--border2); border-radius:18px; padding:1.3rem 1.4rem; display:flex; align-items:center; gap:1.1rem; backdrop-filter:blur(12px); }
        .crav-result-body { flex:1; min-width:0; }
        .crav-result-item { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; margin:0 0 0.2rem; color:var(--text); }
        .crav-result-rest { font-size:0.84rem; color:var(--muted); margin:0 0 0.45rem; font-weight:500; }
        .crav-result-tags { display:flex; flex-wrap:nowrap; gap:0.45rem; overflow-x:auto; padding-bottom:2px; scrollbar-width:none; }
        .crav-result-tags::-webkit-scrollbar { display:none; }
        .crav-result-tag { display:inline-flex; align-items:center; gap:0.25rem; font-size:0.71rem; font-weight:600; color:var(--muted); background:var(--input-bg); border:1px solid var(--border2); border-radius:100px; padding:0.18rem 0.55rem; flex-shrink:0; white-space:nowrap; }
        .crav-result-tag.stars { color:#f5c842; border-color:rgba(245,200,66,0.25); background:rgba(245,200,66,0.06); }
        .crav-result-tag.phone-tag { color:var(--text); text-decoration:none; cursor:pointer; }
        .crav-result-tag.phone-tag:hover { border-color:var(--accent); color:var(--accent); }
        .crav-result-tag.website-tag { color:#4a9eff; border-color:rgba(74,158,255,0.25); background:rgba(74,158,255,0.06); text-decoration:none; }
        .crav-result-tag.website-tag:hover { background:rgba(74,158,255,0.12); }
        .crav-result-tag.maps-tag { color:#e8522a; border-color:rgba(232,82,42,0.25); background:rgba(232,82,42,0.06); text-decoration:none; }
        .crav-result-tag.maps-tag:hover { background:rgba(232,82,42,0.12); }
        .crav-result-tag.fp-tag { color:#d70f64; border-color:rgba(215,15,100,0.25); background:rgba(215,15,100,0.06); text-decoration:none; }
        .crav-result-tag.fp-tag:hover { background:rgba(215,15,100,0.12); }
        .crav-card-actions { display:flex; flex-direction:column; gap:0.4rem; align-items:flex-end; flex-shrink:0; }
        .crav-save-btn { background:transparent; border:1px solid var(--border2); border-radius:100px; padding:0.35rem 0.7rem; font-size:0.82rem; cursor:pointer; color:var(--muted); white-space:nowrap; }
        .crav-save-btn:hover { border-color:var(--accent); color:var(--accent); }
        .btn-order { padding:0.45rem 1rem; border-radius:100px; border:1px solid var(--border2); background:transparent; color:var(--text); font:700 0.82rem 'DM Sans',sans-serif; text-decoration:none; transition:all 0.18s; white-space:nowrap; cursor:pointer; display:inline-flex; align-items:center; gap:0.3rem; }
        .btn-order:hover { border-color:var(--accent); background:rgba(232,82,42,0.08); color:var(--accent); }
        .crav-dropdown { position:relative; }
        .crav-dropdown-menu { position:absolute; right:0; bottom:calc(100% + 6px); background:var(--dash-card-bg); border:1px solid var(--border2); border-radius:14px; box-shadow:0 8px 28px rgba(0,0,0,0.22); z-index:100; min-width:210px; overflow:hidden; animation:ddopen 0.15s ease both; }
        @keyframes ddopen { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .crav-dropdown-item { display:flex; align-items:center; gap:0.6rem; padding:0.65rem 1rem; font:500 0.83rem 'DM Sans',sans-serif; color:var(--text); text-decoration:none; transition:background 0.14s; white-space:nowrap; border-bottom:1px solid var(--border2); outline:none; }
        .crav-dropdown-item:last-child { border-bottom:none; }
        .crav-dropdown-item:hover, .crav-dropdown-item:focus { background:rgba(232,82,42,0.06); }
        .crav-menu-icon { font-size:1rem; flex-shrink:0; }
        .crav-menu-label { font-weight:600; }
      `}</style>

      <div className="crav-wrap">
        <div
          style={{
            background: 'var(--dash-card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '22px',
            padding: '2rem',
            backdropFilter: 'blur(20px)',
            marginBottom: '1.6rem',
          }}
        >
          <div className="craving-head">
            <h2 className="craving-title">Smart Local Search</h2>
            <p className="craving-sub">
              Tell us what you&apos;re craving and we&apos;ll find the best spots near you.
            </p>
          </div>

          <div className="crav-quick">
            {QUICK.map((item) => (
              <button
                key={item}
                type="button"
                className="crav-quick-chip"
                onClick={() => setQuery(item.split(': ').slice(1).join(': '))}
              >
                {item}
              </button>
            ))}
          </div>

          <form className="craving-form" onSubmit={handleSearch}>
            <div className="crav-input-wrap">
              <input
                className="craving-input"
                placeholder="e.g. I want a spicy zinger burger under 800 Rs nearby"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {needsArea && (
              <div className="crav-input-wrap">
                <input
                  className="craving-input"
                  placeholder="City or area (optional if already included above)"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>
            )}

            <button className="btn-hunt" type="submit" disabled={!canSubmit}>
              {loading ? 'Scanning local restaurants...' : 'Find My Craving'}
            </button>
          </form>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {error && !loading && <div className="craving-error">{error}</div>}

        {results !== null && results.length === 0 && !loading && (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              background: 'var(--input-bg)',
              textAlign: 'center',
              color: 'var(--muted)',
            }}
          >
            <p>{emptyMessage}</p>
          </div>
        )}

        {results && results.length > 0 && !loading && (
          <div>
            <p className="crav-results-label">Top matches</p>
            <div className="crav-results">
              {results.map((res) => {
                const savedEntry = links.find((link) => link.href === res.orderLink);
                const isSaved = Boolean(savedEntry);

                return (
                  <div key={res.id} className="crav-result-card">
                    <div className="crav-result-body">
                      <p className="crav-result-item">{res.name}</p>
                      <p className="crav-result-rest">{res.address}</p>
                      <div className="crav-result-tags">
                        {res.rating > 0 && (
                          <span className="crav-result-tag stars">⭐ {res.rating.toFixed(1)}</span>
                        )}
                        {res.distanceKm > 0 && (
                          <span className="crav-result-tag">{res.distanceKm.toFixed(1)} km</span>
                        )}
                        {/* Google Maps tag */}
                        <a
                          href={res.googleMapsLink ?? res.orderLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="crav-result-tag maps-tag"
                        >
                          🗺️ Maps
                        </a>
                        {/* FoodPanda tag */}
                        <a
                          href={res.foodpandaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="crav-result-tag fp-tag"
                          title={res.foodpandaIsDirect ? 'Order on FoodPanda' : 'Search on FoodPanda'}
                        >
                          🟡 {res.foodpandaIsDirect ? 'FoodPanda' : 'FoodPanda?'}
                        </a>
                        {/* One clickable tag per phone number */}
                        {(res.phones?.length ? res.phones : (res.phone ? [res.phone] : [])).map((phone) => (
                          <a
                            key={phone}
                            href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                            className="crav-result-tag phone-tag"
                          >
                            ☎️ {phone}
                          </a>
                        ))}
                        {/* Website tag */}
                        {res.website && (
                          <a
                            href={res.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="crav-result-tag website-tag"
                          >
                            🌐 Website
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="crav-card-actions">
                      <button
                        type="button"
                        className={`crav-save-btn${isSaved ? ' is-saved' : ''}`}
                        title={isSaved ? 'Remove from saved' : 'Save restaurant'}
                        onClick={() => {
                          if (isSaved && savedEntry) {
                            void removeFoodLink(savedEntry.id);
                            return;
                          }
                          const trimmedQuery = query.trim() || 'Local search';
                          void addFoodLink({
                            restaurant: res.name,
                            item: trimmedQuery,
                            area: res.address,
                            distance: res.distanceKm > 0 ? `${res.distanceKm.toFixed(1)} km` : '-',
                            price: res.priceLevel > 0 ? `Tier ${res.priceLevel}` : '-',
                            emoji: 'Map',
                            platform: 'Google Maps',
                            href: res.orderLink,
                            phone: (res.phones?.[0] ?? res.phone) ?? undefined,
                          });
                        }}
                      >
                        {isSaved ? 'Saved' : '+ Save'}
                      </button>
                      <OrderMenu
                        result={res}
                        onAction={(label, href) => {
                          void logEvent({
                            userId: user?.uid ?? 'anonymous',
                            type: 'click_order',
                            metadata: { restaurant: res.name, action: label, url: href },
                          });
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <CravingsMap
              userLat={hasCoords ? geo.lat : null}
              userLng={hasCoords ? geo.lng : null}
              restaurants={results}
            />
          </div>
        )}
      </div>
    </>
  );
}
