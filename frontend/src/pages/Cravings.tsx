import { useState } from 'react';
import type { FormEvent } from 'react';

interface CravingResult {
  id: number;
  name: string;
  item: string;
  distance: string;
  price: string;
  rating: string;
  link: string;
  emoji: string;
  platform: string;
}

export default function Cravings() {
  const [craving, setCraving] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CravingResult[] | null>(null);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      setResults([
        { id: 1, name: 'Daily Deli Co.',    item: 'Smash Beef Burger',       distance: '1.2 km',  price: 'Rs. 850', rating: '4.8', emoji: '🍔', platform: 'Foodpanda', link: 'https://www.foodpanda.pk' },
        { id: 2, name: 'Johnny & Jugnu',    item: 'Wehshi Zinger Burger',    distance: '2.5 km',  price: 'Rs. 700', rating: '4.7', emoji: '🍗', platform: 'Foodpanda', link: 'https://www.foodpanda.pk' },
        { id: 3, name: 'Local Street Cafe', item: 'Spicy Chicken Burger',    distance: '0.8 km',  price: 'Rs. 550', rating: '4.3', emoji: '🌶️', platform: 'WhatsApp',  link: 'https://wa.me/923000000000' },
      ]);
      setLoading(false);
    }, 1500);
  };

  const QUICK = ['🍔 Burger', '🍛 Biryani', '🌯 Wrap', '🍕 Pizza', '🍜 Ramen', '🥗 Healthy bowl'];

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
        .crav-result-emoji { font-size:2.2rem; flex-shrink:0; }
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
            <button className="crav-submit" type="submit" disabled={loading}>
              {loading ? 'Scanning restaurants near you... 📍' : 'Find My Craving 🍔'}
            </button>
          </form>
        </div>

        {loading && (
          <div className="crav-loading">
            <div className="crav-spinner" />
            Scanning local restaurants...
          </div>
        )}

        {results && (
          <div>
            <p className="crav-results-label">Top matches near you</p>
            <div className="crav-results">
              {results.map(res => (
                <div key={res.id} className="crav-result-card">
                  <span className="crav-result-emoji">{res.emoji}</span>
                  <div className="crav-result-body">
                    <p className="crav-result-item">{res.item}</p>
                    <p className="crav-result-rest">{res.name}</p>
                    <div className="crav-result-tags">
                      <span className="crav-result-tag stars">★ {res.rating}</span>
                      <span className="crav-result-tag">📍 {res.distance}</span>
                      <span className="crav-result-tag">💰 {res.price}</span>
                      <span className="crav-result-tag">📱 {res.platform}</span>
                    </div>
                  </div>
                  <a href={res.link} target="_blank" rel="noopener noreferrer" className="crav-order-btn">
                    Order ↗
                  </a>
                </div>
              ))}
            </div>
            <p className="crav-disclaimer">* MVP demo — order links point to mock restaurant pages.</p>
          </div>
        )}
      </div>
    </>
  );
}
