import { useState } from 'react';
import type { FormEvent } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useFoodLinks } from '../context/FoodLinksContext';
import { useAuth } from '../context/AuthContext';
import { logEvent } from '../lib/analytics';
import SkeletonCard from '../components/SkeletonCard';
import CravingsMap from '../components/CravingsMap';

interface CravingResult {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  priceLevel: number;
  rating: number;
  orderLink: string;
  lat: number | null;
  lng: number | null;
}

const QUICK = [
  '🍔 I want a spicy zinger burger',
  '🍕 I want an extra large pepperoni pizza',
  '🥩 I want a juicy medium rare steak',
  '🥗 I want a healthy grilled chicken salad',
  '🍣 I want a freshly made sushi platter',
];

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

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      if (data.results.length === 0) {
        setEmptyMessage(data.message ?? 'No restaurants found. Try broadening your search or adjusting the price range.');
        setResults([]);
        return;
      }

      setResults(data.results);
      
      void logEvent({
        userId: user?.uid ?? 'anonymous',
        type: 'search_craving',
        metadata: { query, location: (geo.lat && geo.lng) ? 'browser' : 'manual' }
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
        .btn-hunt:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .craving-error { background:rgba(255,80,80,0.08); border:1px solid rgba(255,80,80,0.15); border-radius:12px; padding:0.8rem 1rem; color:#ff8a8a; font-size:0.85rem; margin-bottom:1.5rem; }
        
        .craving-loading { display:flex; align-items:center; justify-content:center; gap:0.8rem; padding:2rem; color:var(--muted); font-size:0.92rem; }
        .spinner { width:20px; height:20px; border:2px solid rgba(232,82,42,0.3); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

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
        .btn-order { padding:0.45rem 1rem; border-radius:100px; border:1px solid var(--border2); background:transparent; color:var(--text); font:700 0.82rem 'DM Sans',sans-serif; text-decoration:none; transition:all 0.18s; }
        .btn-order:hover { border-color:var(--accent); background:rgba(232,82,42,0.08); color:var(--accent); }
      `}</style>

      <div className="crav-wrap">
        <div style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--border)', borderRadius: '22px', padding: '2rem', backdropFilter: 'blur(20px)', marginBottom: '1.6rem' }}>
          <div className="craving-head">
            <h2 className="craving-title">🛵 Smart Local Search</h2>
            <p className="craving-sub">Tell us what you're craving — we'll find the best spots near you instantly.</p>
          </div>
          
          <div className="crav-quick">
            {QUICK.map(q => (
              <button key={q} className="crav-quick-chip" onClick={() => setQuery(q.split(' ').slice(1).join(' '))}>
                {q}
              </button>
            ))}
          </div>

          <form className="craving-form" onSubmit={handleSearch}>
            <div className="crav-input-wrap">
              <input className="craving-input" placeholder="e.g. I want a spicy zinger burger under 800 Rs nearby" value={query} onChange={e => setQuery(e.target.value)} />
            </div>

            {needsArea && (
              <div className="crav-input-wrap">
                <input
                  className="craving-input"
                  placeholder="City or area (optional if you already said it in the craving above)"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>
            )}

            <button className="btn-hunt" type="submit" disabled={!canSubmit}>
              {loading ? 'Scanning local restaurants... 📍' : 'Find My Craving 🍔'}
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
        
        {error && !loading && <div className="craving-error">⚠️ {error}</div>}

        {results !== null && results.length === 0 && !loading && (
          <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--input-bg)', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🍽️</p>
            <p>{emptyMessage}</p>
          </div>
        )}

        {results && results.length > 0 && !loading && (
          <div>
            <p className="crav-results-label">Top matches</p>
            <div className="crav-results">
              {results.map((res) => {
                const savedEntry = links.find((l) => l.href === res.orderLink);
                const isSaved = !!savedEntry;
                return (
                  <div key={res.id} className="crav-result-card">
                    <div className="crav-result-body">
                      <p className="crav-result-item">{res.name}</p>
                      <p className="crav-result-rest">📍 {res.address}</p>
                      <div className="crav-result-tags">
                        {res.rating > 0 && <span className="crav-result-tag stars">★ {res.rating.toFixed(1)}</span>}
                        {res.distanceKm > 0 && <span className="crav-result-tag">🗺️ {res.distanceKm.toFixed(1)} km</span>}
                      </div>
                    </div>
                    <div className="crav-card-actions">
                      <button
                        className={`crav-save-btn${isSaved ? ' is-saved' : ''}`}
                        title={isSaved ? 'Remove from saved' : 'Save restaurant'}
                        onClick={() => {
                          if (isSaved && savedEntry) {
                            void removeFoodLink(savedEntry.id);
                          } else {
                            const q = query.trim() || 'Local search';
                            void addFoodLink({
                              restaurant: res.name,
                              item: q,
                              area: res.address,
                              distance: res.distanceKm > 0 ? `${res.distanceKm.toFixed(1)} km` : '—',
                              price:
                                res.priceLevel > 0
                                  ? `Tier ${res.priceLevel}`
                                  : '—',
                              emoji: '🛵',
                              platform: 'Google Maps',
                              href: res.orderLink,
                            });
                          }
                        }}
                      >
                        {isSaved ? '🔖 Saved' : '+ Save'}
                      </button>
                      <a
                        href={res.orderLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-order"
                        onClick={() => {
                          void logEvent({
                            userId: user?.uid ?? 'anonymous',
                            type: 'click_order',
                            metadata: { restaurant: res.name, url: res.orderLink }
                          });
                        }}
                      >
                        Order ↗
                      </a>
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

