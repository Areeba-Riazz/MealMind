import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFoodLinks } from '../context/FoodLinksContext';
import { db } from '../lib/firebase';
import { seedFoodLinksIfEmpty, type FoodLink } from '../lib/firestoreUserData';

export default function FoodLinksPage() {
  const { user } = useAuth();
  const { links, loading, addFoodLink, removeFoodLink } = useFoodLinks();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    item: '',
    restaurant: '',
    href: '',
    platform: 'Foodpanda',
    area: '',
    distance: '',
    price: '',
    emoji: '🍽️',
  });

  const canSync = Boolean(user?.uid && db);

  useEffect(() => {
    if (!canSync || !user?.uid) return;
    void seedFoodLinksIfEmpty(user.uid).catch((e) => console.warn('[MealMind] seedFoodLinksIfEmpty:', e));
  }, [canSync, user?.uid]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item.trim() || !form.href.trim()) return;
    setAdding(true);
    try {
      await addFoodLink({
        item: form.item.trim(),
        restaurant: form.restaurant.trim() || 'Restaurant',
        href: form.href.trim(),
        platform: form.platform.trim() || 'Link',
        area: form.area.trim() || '—',
        distance: form.distance.trim() || '—',
        price: form.price.trim() || '—',
        emoji: form.emoji.trim() || '🍽️',
      });
      setForm({
        item: '',
        restaurant: '',
        href: '',
        platform: 'Foodpanda',
        area: '',
        distance: '',
        price: '',
        emoji: '🍽️',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (id.startsWith('offline-')) return;
    try {
      await removeFoodLink(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <style>{`
        .fl-wrap { max-width: 760px; margin: 0 auto; animation: flfade 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes flfade { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        .fl-banner { font-size: 0.8rem; color: var(--muted); padding: 0.65rem 1rem; border-radius: 12px; background: var(--input-bg); border: 1px solid var(--border2); margin-bottom: 1.2rem; }
        .fl-form { background: var(--dash-card-bg); border: 1px solid var(--border2); border-radius: 16px; padding: 1.2rem 1.35rem; margin-bottom: 1.4rem; }
        .fl-form h3 { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 800; margin: 0 0 0.9rem; color: var(--text); }
        .fl-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
        @media (max-width: 560px) { .fl-form-grid { grid-template-columns: 1fr; } }
        .fl-inp { width: 100%; padding: 0.55rem 0.75rem; border-radius: 10px; border: 1px solid var(--border2); background: var(--input-bg); color: var(--text); font-size: 0.84rem; outline: none; }
        .fl-inp:focus { border-color: var(--accent); }
        .fl-form-actions { margin-top: 0.85rem; display: flex; justify-content: flex-end; }
        .fl-add-btn { padding: 0.55rem 1.2rem; border-radius: 100px; border: none; background: var(--accent); color: #fff; font: 700 0.82rem 'DM Sans', sans-serif; cursor: pointer; box-shadow: 0 4px 16px rgba(232,82,42,0.28); }
        .fl-add-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .fl-list { display:flex; flex-direction:column; gap:0.9rem; }
        .fl-card { background:var(--dash-card-bg); border:1px solid var(--border2); border-radius:18px; padding:1.4rem 1.5rem; display:flex; align-items:center; gap:1.2rem; backdrop-filter:blur(12px); transition:border-color 0.2s, transform 0.2s; }
        .fl-card:hover { border-color:var(--border); transform:translateY(-2px); }
        .fl-emoji { font-size:2.2rem; flex-shrink:0; }
        .fl-body { flex:1; min-width:0; }
        .fl-item { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; margin:0 0 0.25rem; color:var(--text); }
        .fl-restaurant { font-size:0.85rem; color:var(--muted); margin:0 0 0.4rem; font-weight:500; opacity:0.8; }
        .fl-tags { display:flex; flex-wrap:wrap; gap:0.5rem; }
        .fl-tag { display:inline-flex; align-items:center; gap:0.25rem; font-size:0.71rem; font-weight:600; color:var(--muted); background:var(--input-bg); border:1px solid var(--border2); border-radius:100px; padding:0.2rem 0.55rem; }
        .fl-cta { flex-shrink:0; display: flex; flex-direction: column; gap: 0.45rem; align-items: flex-end; }
        .fl-open-btn { display:inline-flex; align-items:center; gap:0.35rem; padding:0.55rem 1.1rem; background:rgba(232,82,42,0.1); border:1px solid rgba(232,82,42,0.3); border-radius:100px; color:var(--accent); font:700 0.8rem 'DM Sans',sans-serif; text-decoration:none; transition:all 0.18s; }
        .fl-open-btn:hover { background:rgba(232,82,42,0.18); border-color:rgba(232,82,42,0.5); }
        .fl-remove-btn { font: 600 0.75rem 'DM Sans', sans-serif; background: transparent; border: 1px solid rgba(255,80,80,0.25); color: #ff8a8a; border-radius: 100px; padding: 0.35rem 0.75rem; cursor: pointer; }
        .fl-remove-btn:hover { background: rgba(255,80,80,0.08); }

        .fl-cta-row { margin-top:1.4rem; padding:1rem 1.25rem; background:rgba(232,82,42,0.06); border:1px solid rgba(232,82,42,0.18); border-radius:14px; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .fl-cta-row p { font-size:0.84rem; color:var(--muted); margin:0; }
        .fl-cta-row a { font-size:0.84rem; font-weight:700; color:var(--accent2); text-decoration:none; }
        .fl-cta-row a:hover { text-decoration:underline; }
      `}</style>

      <div className="fl-wrap">
        {!canSync && (
          <div className="fl-banner">
            Firebase / Firestore is not configured. Links are stored in this browser only. Add Firestore to sync across devices.
          </div>
        )}

        <form className="fl-form" onSubmit={handleAdd}>
          <h3>Add a food link</h3>
          <div className="fl-form-grid">
            <input
              className="fl-inp"
              placeholder="Item (e.g. Smash Burger)"
              value={form.item}
              onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
            />
            <input
              className="fl-inp"
              placeholder="Restaurant"
              value={form.restaurant}
              onChange={(e) => setForm((f) => ({ ...f, restaurant: e.target.value }))}
            />
            <input
              className="fl-inp"
              placeholder="Order URL (https://…)"
              value={form.href}
              onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
            />
            <input
              className="fl-inp"
              placeholder="Platform (Foodpanda, WhatsApp…)"
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
            />
            <input
              className="fl-inp"
              placeholder="Area"
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            />
            <input
              className="fl-inp"
              placeholder="Distance (e.g. 1.2 km)"
              value={form.distance}
              onChange={(e) => setForm((f) => ({ ...f, distance: e.target.value }))}
            />
            <input
              className="fl-inp"
              placeholder="Price (e.g. Rs. 850)"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
            <input
              className="fl-inp"
              placeholder="Emoji"
              value={form.emoji}
              onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
            />
          </div>
          <div className="fl-form-actions">
            <button className="fl-add-btn" type="submit" disabled={adding || !form.item.trim() || !form.href.trim()}>
              {adding ? 'Adding…' : 'Add link'}
            </button>
          </div>
        </form>

        {loading ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Loading your links…</p>
        ) : links.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem', fontSize: '0.9rem', opacity: 0.6 }}>
            No links yet. Save from <Link to="/cravings" style={{ color: 'var(--accent)' }}>Cravings</Link> or add one above.
          </p>
        ) : (
          <div className="fl-list">
            {links.map((row: FoodLink) => (
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
                  <button type="button" className="fl-remove-btn" onClick={() => void handleRemove(row.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="fl-cta-row">
          <p>Find more places near you</p>
          <Link to="/cravings">Use Cravings search →</Link>
        </div>
      </div>
    </>
  );
}
