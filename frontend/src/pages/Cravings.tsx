import { useEffect, useRef, useState, type FormEvent } from 'react';
import CravingsMap from '../components/CravingsMap';
import SkeletonCard from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { useFoodLinks } from '../context/FoodLinksContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { logEvent } from '../lib/analytics';

interface CravingResult {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  priceLevel: number;
  rating: number;
  orderLink: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
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

function CravingOrderDropdown({
  orderLink,
  phone,
  restaurantName,
  onOrder,
}: {
  orderLink: string;
  phone: string | null;
  restaurantName: string;
  onOrder: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const hasLink = Boolean(orderLink);
  const hasPhone = Boolean(phone);
  const phoneDigits = phone ? phone.replace(/[^0-9+]/g, '') : '';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClick);
    }

    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (hasLink && !hasPhone) {
    return (
      <a
        href={orderLink}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-order"
        onClick={onOrder}
      >
        Order
      </a>
    );
  }

  if (hasPhone && !hasLink) {
    return (
      <a href={`tel:${phoneDigits}`} className="btn-order" onClick={onOrder}>
        Call
      </a>
    );
  }

  if (!hasLink && !hasPhone) {
    return (
      <span className="btn-order" style={{ opacity: 0.4, cursor: 'default' }}>
        No contact
      </span>
    );
  }

  return (
    <div className="crav-dropdown" ref={ref}>
      <button type="button" className="btn-order" onClick={() => setOpen((value) => !value)}>
        Order {open ? '^' : 'v'}
      </button>
      {open && (
        <div className="crav-dropdown-menu" aria-label={`${restaurantName} contact options`}>
          <a
            href={orderLink}
            target="_blank"
            rel="noopener noreferrer"
            className="crav-dropdown-item"
            onClick={() => {
              setOpen(false);
              onOrder();
            }}
          >
            View on Google Maps
          </a>
          <a
            href={`tel:${phoneDigits}`}
            className="crav-dropdown-item"
            onClick={() => {
              setOpen(false);
              onOrder();
            }}
          >
            Call to Order
          </a>
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
  const { links, addFoodLink, removeFoodLink } = useFoodLinks();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    setEmptyMessage(null);
    setError(null);

    try {
      const body: Record<string, unknown> = { query };

      if (geo.lat != null && geo.lng != null) {
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
          location: geo.lat != null && geo.lng != null ? 'browser' : 'manual',
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
  const needsArea = geoReady && !hasCoords;
  const canSubmit = !loading && geoReady && query.trim() !== '';

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
        .crav-result-tags { display:flex; flex-wrap:wrap; gap:0.45rem; }
        .crav-result-tag { display:inline-flex; align-items:center; gap:0.25rem; font-size:0.71rem; font-weight:600; color:var(--muted); background:var(--input-bg); border:1px solid var(--border2); border-radius:100px; padding:0.18rem 0.55rem; }
        .crav-result-tag.stars { color:#f5c842; border-color:rgba(245,200,66,0.25); background:rgba(245,200,66,0.06); }
        .crav-card-actions { display:flex; flex-direction:column; gap:0.4rem; align-items:flex-end; flex-shrink:0; }
        .crav-save-btn { background:transparent; border:1px solid var(--border2); border-radius:100px; padding:0.35rem 0.7rem; font-size:0.82rem; cursor:pointer; color:var(--muted); white-space:nowrap; }
        .crav-save-btn:hover { border-color:var(--accent); color:var(--accent); }
        .btn-order { padding:0.45rem 1rem; border-radius:100px; border:1px solid var(--border2); background:transparent; color:var(--text); font:700 0.82rem 'DM Sans',sans-serif; text-decoration:none; transition:all 0.18s; white-space:nowrap; cursor:pointer; display:inline-flex; align-items:center; gap:0.3rem; }
        .btn-order:hover { border-color:var(--accent); background:rgba(232,82,42,0.08); color:var(--accent); }
        .crav-dropdown { position:relative; }
        .crav-dropdown-menu { position:absolute; right:0; top:calc(100% + 6px); background:var(--dash-card-bg); border:1px solid var(--border2); border-radius:12px; box-shadow:0 8px 28px rgba(0,0,0,0.18); z-index:100; min-width:180px; overflow:hidden; animation:ddopen 0.15s ease both; }
        @keyframes ddopen { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .crav-dropdown-item { display:flex; align-items:center; gap:0.5rem; padding:0.65rem 1rem; font:600 0.82rem 'DM Sans',sans-serif; color:var(--text); text-decoration:none; transition:background 0.14s; white-space:nowrap; }
        .crav-dropdown-item:hover { background:rgba(232,82,42,0.08); color:var(--accent); }
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
                          <span className="crav-result-tag stars">Star {res.rating.toFixed(1)}</span>
                        )}
                        {res.distanceKm > 0 && (
                          <span className="crav-result-tag">{res.distanceKm.toFixed(1)} km</span>
                        )}
                        {res.phone && <span className="crav-result-tag">{res.phone}</span>}
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
                            phone: res.phone ?? undefined,
                          });
                        }}
                      >
                        {isSaved ? 'Saved' : '+ Save'}
                      </button>
                      <CravingOrderDropdown
                        orderLink={res.orderLink}
                        phone={res.phone}
                        restaurantName={res.name}
                        onOrder={() => {
                          void logEvent({
                            userId: user?.uid ?? 'anonymous',
                            type: 'click_order',
                            metadata: { restaurant: res.name, url: res.orderLink },
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
