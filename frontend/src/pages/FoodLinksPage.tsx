import { Link } from 'react-router-dom';

const LINKS = [
  { id: '1', restaurant: 'Burger Lab — DHA',  item: 'Smash Beef Burger',      area: 'Lahore · DHA Phase 4',  distance: '1.2 km', price: 'Rs. 850', emoji: '🍔', platform: 'Foodpanda', href: 'https://www.foodpanda.pk' },
  { id: '2', restaurant: 'Daily Deli Co.',    item: 'Grilled Chicken Wrap',   area: 'DHA Phase 4',           distance: '1.8 km', price: 'Rs. 650', emoji: '🌯', platform: 'WhatsApp', href: 'https://wa.me/923001234567' },
  { id: '3', restaurant: 'Johnny & Jugnu',    item: 'Wehshi Zinger Burger',   area: 'Johar Town',            distance: '2.5 km', price: 'Rs. 700', emoji: '🍗', platform: 'Foodpanda', href: 'https://www.foodpanda.pk' },
] as const;

export default function FoodLinksPage() {
  return (
    <>
      <style>{`
        .fl-wrap { max-width: 760px; margin: 0 auto; animation: flfade 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes flfade { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        .fl-list { display:flex; flex-direction:column; gap:0.9rem; }
        .fl-card { background:rgba(22,22,22,0.7); border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:1.4rem 1.5rem; display:flex; align-items:center; gap:1.2rem; backdrop-filter:blur(12px); transition:border-color 0.2s, transform 0.2s; }
        .fl-card:hover { border-color:rgba(255,255,255,0.12); transform:translateY(-2px); }
        .fl-emoji { font-size:2.2rem; flex-shrink:0; }
        .fl-body { flex:1; min-width:0; }
        .fl-item { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; margin:0 0 0.25rem; }
        .fl-restaurant { font-size:0.85rem; color:rgba(255,255,255,0.6); margin:0 0 0.4rem; font-weight:500; }
        .fl-tags { display:flex; flex-wrap:wrap; gap:0.5rem; }
        .fl-tag { display:inline-flex; align-items:center; gap:0.25rem; font-size:0.71rem; font-weight:600; color:rgba(255,255,255,0.4); background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:100px; padding:0.2rem 0.55rem; }
        .fl-cta { flex-shrink:0; }
        .fl-open-btn { display:inline-flex; align-items:center; gap:0.35rem; padding:0.55rem 1.1rem; background:rgba(232,82,42,0.1); border:1px solid rgba(232,82,42,0.3); border-radius:100px; color:var(--accent); font:700 0.8rem 'DM Sans',sans-serif; text-decoration:none; transition:all 0.18s; }
        .fl-open-btn:hover { background:rgba(232,82,42,0.18); border-color:rgba(232,82,42,0.5); }

        .fl-cta-row { margin-top:1.4rem; padding:1rem 1.25rem; background:rgba(232,82,42,0.06); border:1px solid rgba(232,82,42,0.18); border-radius:14px; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .fl-cta-row p { font-size:0.84rem; color:rgba(255,255,255,0.45); margin:0; }
        .fl-cta-row a { font-size:0.84rem; font-weight:700; color:var(--accent2); text-decoration:none; }
        .fl-cta-row a:hover { text-decoration:underline; }
      `}</style>

      <div className="fl-wrap">
        <div className="fl-list">
          {LINKS.map(row => (
            <div key={row.id} className="fl-card">
              <span className="fl-emoji">{row.emoji}</span>
              <div className="fl-body">
                <p className="fl-item">{row.item}</p>
                <p className="fl-restaurant">{row.restaurant}</p>
                <div className="fl-tags">
                  <span className="fl-tag">📍 {row.distance}</span>
                  <span className="fl-tag">💰 {row.price}</span>
                  <span className="fl-tag">🌍 {row.area}</span>
                  <span className="fl-tag">📱 {row.platform}</span>
                </div>
              </div>
              <div className="fl-cta">
                <a href={row.href} target="_blank" rel="noopener noreferrer" className="fl-open-btn">
                  Order ↗
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="fl-cta-row">
          <p>Find more places near you</p>
          <Link to="/cravings">Use Cravings search →</Link>
        </div>
      </div>
    </>
  );
}
