import { useState } from 'react';
import type { FormEvent } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import SkeletonCard from '../components/SkeletonCard';

interface CravingResult {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  priceLevel: number;
  rating: number;
  orderLink: string;
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

  const canSubmit = !loading && (geo.lat != null || geo.denied === false || area.trim() !== '');

  return (
    <main style={{ padding: '6rem 2rem 4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="glass-container animate-fade-in" style={{ maxWidth: '700px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <span>🛵</span> Smart Local Search
        </h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
          Craving something specific? We&apos;ll find the best options near you and redirect you to order instantly.
        </p>

        <form onSubmit={handleSearch}>
          <div className="input-group">
            <input
              type="text"
              placeholder="e.g. I want a spicy zinger burger under 800 Rs nearby"
              value={craving}
              onChange={(e) => setCraving(e.target.value)}
              required
              style={{ fontSize: '1.1rem', padding: '1.2rem' }}
            />
          </div>

          {/* Requirement 3.3 — show area input when geolocation is denied */}
          {geo.denied && (
            <div className="input-group" style={{ marginTop: '0.75rem' }}>
              <input
                type="text"
                placeholder="Enter your city or area (e.g. DHA Phase 4, Lahore)"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
                style={{ fontSize: '1rem', padding: '1rem' }}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={!canSubmit || (geo.denied && area.trim() === '')}
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? 'Scanning local restaurants... 📍' : 'Find My Craving 🍔'}
          </button>
        </form>

        {/* Requirement 4.1 — skeleton loaders while in flight */}
        {loading && (
          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Requirement 6.4 — error state */}
        {error && !loading && (
          <div style={{ marginTop: '2rem', padding: '1.2rem', borderRadius: '12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Requirement 4.3 — empty state */}
        {results !== null && results.length === 0 && !loading && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🍽️</p>
            <p>{emptyMessage}</p>
          </div>
        )}

        {/* Requirement 4.2 — result cards */}
        {results && results.length > 0 && !loading && (
          <div style={{ marginTop: '3rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Top Matches Near You</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.map((res) => (
                <div
                  key={res.id}
                  className="glass-card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', paddingRight: '1rem' }}
                >
                  <div>
                    <h4 style={{ color: 'var(--accent)', fontSize: '1.2rem', marginBottom: '0.3rem' }}>{res.name}</h4>
                    <p style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#fbbf24' }}>{'⭐'.repeat(Math.round(res.rating))} {res.rating > 0 ? res.rating.toFixed(1) : ''}</span>
                      {res.priceLevel > 0 && (
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{'💰'.repeat(res.priceLevel)}</span>
                      )}
                    </p>
                    {/* Requirement 5.2 / address replaces old mock distance string */}
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                      <span>📍 {res.address}</span>
                      {res.distanceKm > 0 && <span>🗺️ {res.distanceKm.toFixed(1)} km</span>}
                    </div>
                  </div>

                  {/* Requirement 5.2 — orderLink used for "Order Now" button */}
                  <a
                    href={res.orderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ background: 'var(--accent)', padding: '0.8rem 1.2rem', width: 'auto', borderRadius: '10px', fontSize: '0.95rem', alignSelf: 'center', textDecoration: 'none', display: 'inline-block', flexShrink: 0, marginLeft: '1rem' }}
                  >
                    Order Now 🚀
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
