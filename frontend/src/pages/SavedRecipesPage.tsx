import { useState } from 'react';
import { Link } from 'react-router-dom';

const SAVED = [
  { id: '1', title: 'Chicken Karahi (fridge clean-up)', savedAt: '28 Mar 2026', macros: '480 kcal · P 38g · C 42g · F 12g', emoji: '🍛', time: '30 min', difficulty: 'Medium' },
  { id: '2', title: 'Masoor Daal + Roti Bowl',          savedAt: '25 Mar 2026', macros: '410 kcal · P 18g · C 58g · F 9g',  emoji: '🥘', time: '20 min', difficulty: 'Easy'   },
  { id: '3', title: 'Egg Fried Rice — Student Budget',  savedAt: '20 Mar 2026', macros: '520 kcal · P 22g · C 68g · F 14g', emoji: '🍳', time: '15 min', difficulty: 'Easy'   },
] as const;

export default function SavedRecipesPage() {
  const [removed, setRemoved] = useState<string[]>([]);
  const visible = SAVED.filter(r => !removed.includes(r.id));

  return (
    <>
      <style>{`
        .saved-wrap { max-width: 760px; margin: 0 auto; animation: sfade 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes sfade { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        .saved-empty { text-align: center; padding: 4rem 2rem; background: rgba(22,22,22,0.7); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; }
        .saved-empty-emoji { font-size: 3rem; margin-bottom: 1rem; }
        .saved-empty h3 { font-family:'Syne',sans-serif; font-size:1.2rem; font-weight:800; margin:0 0 0.5rem; }
        .saved-empty p { color:rgba(255,255,255,0.4); font-size:0.88rem; margin:0 0 1.4rem; }
        .saved-empty a { display:inline-flex; align-items:center; gap:0.4rem; padding:0.65rem 1.4rem; background:var(--accent); color:#fff; border-radius:100px; text-decoration:none; font-weight:700; font-size:0.88rem; box-shadow:0 4px 18px rgba(232,82,42,0.3); transition:transform 0.2s; }
        .saved-empty a:hover { transform:translateY(-2px); }

        .saved-list { display:flex; flex-direction:column; gap:0.9rem; }
        .saved-card { background:rgba(22,22,22,0.7); border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:1.4rem 1.5rem; display:flex; align-items:center; gap:1.2rem; backdrop-filter:blur(12px); transition:border-color 0.2s, transform 0.2s; }
        .saved-card:hover { border-color:rgba(255,255,255,0.12); transform:translateY(-2px); }
        .saved-card-emoji { font-size:2.4rem; flex-shrink:0; }
        .saved-card-body { flex:1; min-width:0; }
        .saved-card-title { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; margin:0 0 0.3rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .saved-card-meta { display:flex; flex-wrap:wrap; gap:0.6rem; margin-bottom:0.4rem; }
        .saved-card-tag { display:inline-flex; align-items:center; gap:0.25rem; font-size:0.72rem; font-weight:600; color:rgba(255,255,255,0.4); background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:100px; padding:0.2rem 0.6rem; }
        .saved-card-macros { font-size:0.75rem; color:rgba(255,255,255,0.3); }
        .saved-card-actions { display:flex; flex-direction:column; gap:0.4rem; flex-shrink:0; }
        .saved-btn { font:600 0.78rem 'DM Sans',sans-serif; cursor:pointer; padding:0.45rem 0.9rem; border-radius:100px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.6); transition:all 0.18s; white-space:nowrap; }
        .saved-btn:hover { border-color:rgba(232,82,42,0.45); color:var(--accent); background:rgba(232,82,42,0.06); }
        .saved-btn.danger:hover { border-color:rgba(255,80,80,0.4); color:#ff8a8a; background:rgba(255,80,80,0.06); }

        .saved-cta-row { margin-top:1.4rem; padding:1rem 1.25rem; background:rgba(232,82,42,0.06); border:1px solid rgba(232,82,42,0.18); border-radius:14px; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .saved-cta-row p { font-size:0.84rem; color:rgba(255,255,255,0.45); margin:0; }
        .saved-cta-row a { font-size:0.84rem; font-weight:700; color:var(--accent2); text-decoration:none; }
        .saved-cta-row a:hover { text-decoration:underline; }
      `}</style>

      <div className="saved-wrap">
        {visible.length === 0 ? (
          <div className="saved-empty">
            <div className="saved-empty-emoji">📖</div>
            <h3>No saved recipes yet</h3>
            <p>Generate a recipe with AI Chef and save it here for later.</p>
            <Link to="/demo">Go to AI Chef 👨‍🍳</Link>
          </div>
        ) : (
          <>
            <div className="saved-list">
              {visible.map(r => (
                <div key={r.id} className="saved-card">
                  <span className="saved-card-emoji">{r.emoji}</span>
                  <div className="saved-card-body">
                    <p className="saved-card-title">{r.title}</p>
                    <div className="saved-card-meta">
                      <span className="saved-card-tag">⏱ {r.time}</span>
                      <span className="saved-card-tag">📊 {r.difficulty}</span>
                      <span className="saved-card-tag">🗓 {r.savedAt}</span>
                    </div>
                    <p className="saved-card-macros">{r.macros}</p>
                  </div>
                  <div className="saved-card-actions">
                    <button className="saved-btn">Cook again</button>
                    <button className="saved-btn danger" onClick={() => setRemoved(p => [...p, r.id])}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="saved-cta-row">
              <p>Want more recipes?</p>
              <Link to="/demo">Generate with AI Chef →</Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
