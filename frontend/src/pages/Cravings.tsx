import { useState } from 'react';
import type { FormEvent } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
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

export default function Cravings() {
  const [craving, setCraving] = useState('');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CravingResult[] | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const geo = useGeolocation();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    setEmptyMessage(null);
    setError(null);

    try {
      const body: Record<string, unknown> = { query: craving };

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
    } catch {
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const QUICK = ['🍔 Burger', '🍛 Biryani', '🌯 Wrap', '🍕 Pizza', '🍜 Ramen', '🥗 Healthy bowl'];

  const hasCoords = geo.lat != null && geo.lng != null;
  const geoReady = !geo.loading;
  /** When GPS did not yield coordinates, show area field (body `area` or location in the craving via Gemini). */
  const needsArea = geoReady && !hasCoords;
  const canSubmit = !loading && geoReady && craving.trim() !== '';

  return (
    <>
      <style>{`
        .crav-wrap { max-width: 720px; margin: 0 auto; animation: cravfade 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes cravfade { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        /* Search card */
        .crav-search-card { background:rgba(22,22,22,0.8); border:1px solid rgba(255,255,255,0.07); border-radius:22px; padding:2rem; backdrop-filter:blur(20px); margin-bottom:1.6rem; }
        .crav-search-card h2 { font-family:'Syne',sans-serif; font-size:1.3rem; font-weight:800; margin:0 0 0.35rem; letter-spacing:-0.3px; }
        .crav-search-card p { font-size:0.87rem; color:rgba(255,255,255,0.45); margin:0 0 1.4rem; }

        /* Input */
        .crav-input-wrap { position:relative; margin-bottom:0.9rem; }
        .crav-input { width:100%; padding:1rem 1.15rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:14px; color:#f2ede4; font:0.95rem 'DM Sans',sans-serif; outline:none; transition:border-color 0.2s, box-shadow 0.2s; resize:none; }
        .crav-input::placeholder { color:rgba(255,255,255,0.25); }
        .crav-input:focus { border-color:rgba(232,82,42,0.5); background:rgba(232,82,42,0.04); box-shadow:0 0 0 3px rgba(232,82,42,0.1); }

        /* Quick chips */
        .crav-quick { display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.2rem; }
        .crav-quick-chip { font:500 0.78rem 'DM Sans',sans-serif; cursor:pointer; padding:0.35rem 0.8rem; border-radius:100px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.5); transition:all 0.18s; }
        .crav-quick-chip:hover { border-color:rgba(232,82,42,0.4); color:var(--accent); background:rgba(232,82,42,0.06); }

        /* Submit */
        .crav-submit { width:100%; padding:0.9rem; border-radius:100px; border:none; font:700 0.95rem 'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s; }
        .crav-submit:not(:disabled) { background:var(--accent); color:#fff; box-shadow:0 6px 22px rgba(232,82,42,0.32); }
        .crav-submit:not(:disabled):hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(232,82,42,0.42); }
        .crav-submit:disabled { background:rgba(232,82,42,0.3); color:rgba(255,255,255,0.5); cursor:not-allowed; }

        /* Loading */
        .crav-loading { display:flex; align-items:center; justify-content:center; gap:0.8rem; padding:2.5rem; color:rgba(255,255,255,0.5); font-size:0.92rem; }
        .crav-spinner { width:20px; height:20px; border:2px solid rgba(232,82,42,0.3); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* Results */
        .crav-results-label { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:rgba(255,255,255,0.35); margin:0 0 0.9rem; }
        .crav-results { display:flex; flex-direction:column; gap:0.9rem; }
        .crav-result-card { background:rgba(22,22,22,0.7); border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:1.3rem 1.4rem; display:flex; align-items:center; gap:1.1rem; backdrop-filter:blur(12px); transition:border-color 0.2s, transform 0.2s; }
        .crav-result-card:hover { border-color:rgba(255,255,255,0.12); transform:translateY(-2px); }
        .crav-result-body { flex:1; min-width:0; }
        .crav-result-item { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; margin:0 0 0.2rem; }
        .crav-result-rest { font-size:0.84rem; color:rgba(255,255,255,0.55); margin:0 0 0.45rem; font-weight:500; }
        .crav-result-tags { display:flex; flex-wrap:wrap; gap:0.45rem; }
        .crav-result-tag { display:inline-flex; align-items:center; gap:0.25rem; font-size:0.71rem; font-weight:600; color:rgba(255,255,255,0.4); background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:100px; padding:0.18rem 0.55rem; }
        .crav-result-tag.stars { color:#f5c842; border-color:rgba(245,200,66,0.25); background:rgba(245,200,66,0.06); }
        .crav-order-btn { display:inline-flex; align-items:center; gap:0.35rem; padding:0.6rem 1.15rem; background:var(--accent); color:#fff; border-radius:100px; font:700 0.82rem 'DM Sans',sans-serif; text-decoration:none; box-shadow:0 4px 16px rgba(232,82,42,0.28); transition:all 0.18s; flex-shrink:0; }
        .crav-order-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(232,82,42,0.4); }

        .crav-disclaimer { text-align:center; font-size:0.75rem; color:rgba(255,255,255,0.25); margin-top:1.2rem; font-style:italic; }
      `}</style>

      <div className="crav-wrap">
        <div className="crav-search-card">
          <h2>🛵 Smart Local Search</h2>
          <p>Tell us what you're craving — we'll find the best spots near you instantly.</p>

          {/* Quick suggestions */}
          <div className="crav-quick">
            {QUICK.map(q => (
              <button key={q} className="crav-quick-chip" onClick={() => setCraving(q.split(' ').slice(1).join(' '))}>
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch}>
            <div className="crav-input-wrap">
              <input
                className="crav-input"
                type="text"
                placeholder="e.g. I want a spicy zinger burger under 800 Rs nearby"
                value={craving}
                onChange={e => setCraving(e.target.value)}
                required
              />
            </div>

            {/* Requirement 3.3 — area when geolocation unavailable or denied */}
            {needsArea && (
              <div className="crav-input-wrap">
                <input
                  className="crav-input"
                  type="text"
                  placeholder="City or area (optional if you already said it in the craving above)"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  aria-label="City or area"
                />
              </div>
            )}

            <button
              className="crav-submit"
              type="submit"
              disabled={!canSubmit}
            >
              {loading ? 'Scanning local restaurants... 📍' : 'Find My Craving 🍔'}
            </button>
          </form>
        </div>

        {/* Requirement 4.1 — skeleton loaders while in flight */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Requirement 6.4 — error state */}
        {error && !loading && (
          <div style={{ padding: '1.2rem', borderRadius: '12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Requirement 4.3 — empty state */}
        {results !== null && results.length === 0 && !loading && (
          <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🍽️</p>
            <p>{emptyMessage}</p>
          </div>
        )}

        {/* Requirement 4.2 — result cards + map (places with coordinates only on map) */}
        {results && results.length > 0 && !loading && (
          <div>
            <p className="crav-results-label">Top matches near you</p>
            <div className="crav-results">
              {results.map((res) => (
                <div key={res.id} className="crav-result-card">
                  <div className="crav-result-body">
                    <p className="crav-result-item">{res.name}</p>
                    <p className="crav-result-rest">📍 {res.address}</p>
                    <div className="crav-result-tags">
                      {res.rating > 0 && <span className="crav-result-tag stars">★ {res.rating.toFixed(1)}</span>}
                      {res.distanceKm > 0 && <span className="crav-result-tag">🗺️ {res.distanceKm.toFixed(1)} km</span>}
                      {res.priceLevel > 0 && <span className="crav-result-tag">{'💰'.repeat(res.priceLevel)}</span>}
                    </div>
                  </div>
                  <a
                    href={res.orderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="crav-order-btn"
                  >
                    Order ↗
                  </a>
                </div>
              ))}
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
