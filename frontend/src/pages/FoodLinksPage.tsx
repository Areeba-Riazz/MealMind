import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFoodLinks } from '../context/FoodLinksContext';
import { db } from '../lib/firebase';
import { seedFoodLinksIfEmpty, type FoodLink } from '../lib/firestoreUserData';

// ── helpers ──────────────────────────────────────────────────────────────────

function isValidUrl(val: string): boolean {
  return /^https?:\/\/.{3,}/.test(val.trim());
}

function isValidPhone(val: string): boolean {
  const digits = val.replace(/[^0-9]/g, '');
  return /^[0-9+\-() ]{7,20}$/.test(val.trim()) && digits.length >= 7 && digits.length <= 15;
}

function normalizePhone(val: string): string {
  return val.replace(/[^0-9+]/g, '');
}

interface FormState {
  item: string;
  restaurant: string;
  href: string;
  phone: string;
  platform: string;
  area: string;
  distance: string;
  price: string;
  emoji: string;
}

function validateForm(form: FormState): string | null {
  if (!form.item.trim()) return 'Item name is required.';
  if (!form.restaurant.trim()) return 'Restaurant name is required.';
  const hasUrl = form.href.trim().length > 0;
  const hasPhone = form.phone.trim().length > 0;
  if (!hasUrl && !hasPhone) return 'Please enter at least an Order URL or a Phone number.';
  if (hasUrl && !isValidUrl(form.href)) return 'Order URL must start with https:// (e.g. https://foodpanda.pk/…)';
  if (hasPhone && !isValidPhone(form.phone)) return 'Phone number must be 7–15 digits (e.g. 03001234567).';
  return null;
}

// ── dropdown component ────────────────────────────────────────────────────────

function OrderDropdown({ href, phone }: { href: string; phone?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const hasUrl = href && isValidUrl(href);
  const hasPhone = phone && isValidPhone(phone);

  // If only one option, just render a plain link — no dropdown needed
  if (hasUrl && !hasPhone) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="fl-open-btn">
        Order ↗
      </a>
    );
  }
  if (hasPhone && !hasUrl) {
    return (
      <a href={`tel:${normalizePhone(phone)}`} className="fl-open-btn">
        📞 Call to Order
      </a>
    );
  }
  if (!hasUrl && !hasPhone) {
    return <span className="fl-open-btn" style={{ opacity: 0.4, cursor: 'default' }}>No contact</span>;
  }

  // Both available — show dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="fl-dropdown" ref={ref}>
      <button type="button" className="fl-open-btn" onClick={() => setOpen((v) => !v)}>
        Order {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="fl-dropdown-menu">
          
            <a href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="fl-dropdown-item"
            onClick={() => setOpen(false)}
          >
            🔗 Order Online
          </a>
          
            <a href={`tel:${normalizePhone(phone!)}`}
            className="fl-dropdown-item"
            onClick={() => setOpen(false)}
          >
            📞 Call to Order
          </a>
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function FoodLinksPage() {
  const { user } = useAuth();
  const { links, loading, addFoodLink, removeFoodLink } = useFoodLinks();
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    item: '',
    restaurant: '',
    href: '',
    phone: '',
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
    const error = validateForm(form);
    if (error) { setFormError(error); return; }
    setFormError(null);
    setAdding(true);
    try {
      await addFoodLink({
        item: form.item.trim(),
        restaurant: form.restaurant.trim(),
        href: form.href.trim(),
        phone: form.phone.trim() || undefined,
        platform: form.platform.trim() || 'Link',
        area: form.area.trim() || '—',
        distance: form.distance.trim() || '—',
        price: form.price.trim() || '—',
        emoji: form.emoji.trim() || '🍽️',
      } as Omit<FoodLink, 'id' | 'createdAt'>);
      setForm({ item: '', restaurant: '', href: '', phone: '', platform: 'Foodpanda', area: '', distance: '', price: '', emoji: '🍽️' });
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (id.startsWith('offline-')) return;
    try { await removeFoodLink(id); } catch (err) { console.error(err); }
  };

  const canSubmit = !adding && (form.item.trim().length > 0) && (form.href.trim().length > 0 || form.phone.trim().length > 0);

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
        .fl-inp { width: 100%; padding: 0.55rem 0.75rem; border-radius: 10px; border: 1px solid var(--border2); background: var(--input-bg); color: var(--text); font-size: 0.84rem; outline: none; box-sizing: border-box; }
        .fl-inp:focus { border-color: var(--accent); }
        .fl-inp-error { border-color: #ff5050 !important; }
        .fl-section-label { font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; grid-column: 1 / -1; margin: 0.4rem 0 0; opacity: 0.7; }
        .fl-error-msg { font-size: 0.78rem; color: #ff7070; margin: 0.2rem 0 0; grid-column: 1 / -1; }
        .fl-hint { font-size: 0.74rem; color: var(--muted); opacity: 0.6; margin: 0.15rem 0 0; grid-column: 1 / -1; }
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
        .fl-cta { flex-shrink:0; display:flex; flex-direction:column; gap:0.45rem; align-items:flex-end; }

        .fl-open-btn { display:inline-flex; align-items:center; gap:0.35rem; padding:0.55rem 1.1rem; background:rgba(232,82,42,0.1); border:1px solid rgba(232,82,42,0.3); border-radius:100px; color:var(--accent); font:700 0.8rem 'DM Sans',sans-serif; text-decoration:none; transition:all 0.18s; cursor:pointer; white-space:nowrap; }
        .fl-open-btn:hover { background:rgba(232,82,42,0.18); border-color:rgba(232,82,42,0.5); }

        .fl-dropdown { position:relative; }
        .fl-dropdown-menu { position:absolute; right:0; top:calc(100% + 6px); background:var(--dash-card-bg); border:1px solid var(--border2); border-radius:12px; box-shadow:0 8px 28px rgba(0,0,0,0.18); z-index:100; min-width:160px; overflow:hidden; animation:ddopen 0.15s ease both; }
        @keyframes ddopen { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .fl-dropdown-item { display:flex; align-items:center; gap:0.5rem; padding:0.65rem 1rem; font:600 0.82rem 'DM Sans',sans-serif; color:var(--text); text-decoration:none; transition:background 0.14s; white-space:nowrap; }
        .fl-dropdown-item:hover { background:rgba(232,82,42,0.08); color:var(--accent); }

        .fl-remove-btn { font:600 0.75rem 'DM Sans',sans-serif; background:transparent; border:1px solid rgba(255,80,80,0.25); color:#ff8a8a; border-radius:100px; padding:0.35rem 0.75rem; cursor:pointer; }
        .fl-remove-btn:hover { background:rgba(255,80,80,0.08); }

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

            <p className="fl-section-label">Item info</p>
            <input
              className="fl-inp"
              placeholder="Item (e.g. Smash Burger)"
              value={form.item}
              onChange={(e) => { setFormError(null); setForm((f) => ({ ...f, item: e.target.value })); }}
            />
            <input
              className="fl-inp"
              placeholder="Restaurant"
              value={form.restaurant}
              onChange={(e) => { setFormError(null); setForm((f) => ({ ...f, restaurant: e.target.value })); }}
            />

            <p className="fl-section-label">How to order — fill at least one</p>
            <input
              className={formError && (!form.href.trim() && !form.phone.trim()) ? 'fl-inp fl-inp-error' : 'fl-inp'}
              placeholder="Order URL (https://foodpanda.pk/…)"
              value={form.href}
              onChange={(e) => { setFormError(null); setForm((f) => ({ ...f, href: e.target.value })); }}
            />
            <input
              className={formError && (!form.href.trim() && !form.phone.trim()) ? 'fl-inp fl-inp-error' : 'fl-inp'}
              placeholder="Phone number (03001234567)"
              value={form.phone}
              onChange={(e) => { setFormError(null); setForm((f) => ({ ...f, phone: e.target.value })); }}
            />
            <p className="fl-hint">You can add both — customers will get to choose "Order Online" or "Call to Order".</p>

            <p className="fl-section-label">Details</p>
            <input
              className="fl-inp"
              placeholder="Platform (Foodpanda, Phone…)"
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

            {formError && <p className="fl-error-msg">⚠️ {formError}</p>}
          </div>
          <div className="fl-form-actions">
            <button className="fl-add-btn" type="submit" disabled={!canSubmit}>
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
                  <OrderDropdown href={row.href} phone={row.phone} />
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