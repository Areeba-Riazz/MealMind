import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import type { SavedRecipe } from '../context/SavedRecipesContext';
import MacroBadges from '../components/MacroBadges';
import { parseNutrition } from '../types/recipeNutrition';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function AiRecipeCard({ recipe, onRemove }: { recipe: SavedRecipe; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const nutrition = parseNutrition(recipe.nutrition);

  return (
    <div className="saved-card ai-card">
      <div className="saved-card-top">
        <span className="saved-card-emoji">🍽️</span>
        <div className="saved-card-body">
          <p className="saved-card-title">{recipe.title}</p>
          <div className="saved-card-meta">
            <span className="saved-card-tag">🤖 AI Generated</span>
            {recipe.isFallback && <span className="saved-card-tag fallback-tag">💡 Creative Pivot</span>}
            <span className="saved-card-tag">🗓 {formatDate(recipe.savedAt)}</span>
            {recipe.instructions && (
              <span className="saved-card-tag">📋 {recipe.instructions.length} steps</span>
            )}
          </div>
          {nutrition && <MacroBadges nutrition={nutrition} compact />}
        </div>
        <div className="saved-card-actions">
          <Link to={`/recipe/${recipe.id}`} className="saved-btn" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'transparent' }}>
            🚀 Follow
          </Link>
          <button className="saved-btn" onClick={() => setExpanded(p => !p)}>
            {expanded ? 'Hide steps ▲' : 'View steps ▼'}
          </button>
          <button className="saved-btn danger" onClick={onRemove}>Remove</button>
        </div>
      </div>

      {expanded && recipe.instructions && (
        <div className="saved-steps-panel">
          <ol className="saved-steps">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="saved-step">
                <span className="saved-step-num">{i + 1}</span>
                <span className="saved-step-text">{step}</span>
              </li>
            ))}
          </ol>

          {recipe.references && recipe.references.length > 0 && (
            <div className="saved-refs">
              <p className="saved-refs-label">📚 References</p>
              <div className="saved-ref-list">
                {recipe.references.map((ref, i) => (
                  <a
                    key={i}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="saved-ref-item"
                  >
                    <span className="saved-ref-dot" />
                    {ref.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OnlineRecipeCard({ recipe, onRemove }: { recipe: SavedRecipe; onRemove: () => void }) {
  return (
    <div className="saved-card online-card">
      <div className="saved-card-top">
        <span className="saved-card-emoji">🌐</span>
        <div className="saved-card-body">
          <p className="saved-card-title">{recipe.title}</p>
          <div className="saved-card-meta">
            <span className="saved-card-tag">🔍 Found Online</span>
            {recipe.domain && <span className="saved-card-tag">↗ {recipe.domain}</span>}
            <span className="saved-card-tag">🗓 {formatDate(recipe.savedAt)}</span>
          </div>
          {recipe.snippet && <p className="saved-card-snippet">{recipe.snippet}</p>}
        </div>
        <div className="saved-card-actions">
          <Link to={`/recipe/${recipe.id}`} className="saved-btn" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'transparent' }}>
            🚀 Follow
          </Link>
          {recipe.url && (
            <a
              href={recipe.url}
              target="_blank"
              rel="noopener noreferrer"
              className="saved-btn link-btn"
            >
              Open ↗
            </a>
          )}
          <button className="saved-btn danger" onClick={onRemove}>Remove</button>
        </div>
      </div>
    </div>
  );
}

function CravingCard({ recipe, onRemove }: { recipe: SavedRecipe; onRemove: () => void }) {
  return (
    <div className="saved-card craving-card">
      <div className="saved-card-top">
        <span className="saved-card-emoji">🛵</span>
        <div className="saved-card-body">
          <p className="saved-card-title">{recipe.title}</p>
          <div className="saved-card-meta">
            <span className="saved-card-tag craving-tag">📍 Local Find</span>
            {recipe.rating != null && recipe.rating > 0 && (
              <span className="saved-card-tag stars-tag">★ {recipe.rating.toFixed(1)}</span>
            )}
            {recipe.priceLevel != null && recipe.priceLevel > 0 && (
              <span className="saved-card-tag">{'💰'.repeat(recipe.priceLevel)}</span>
            )}
            {recipe.distanceKm != null && recipe.distanceKm > 0 && (
              <span className="saved-card-tag">🗺️ {recipe.distanceKm.toFixed(1)} km</span>
            )}
            <span className="saved-card-tag">🗓 {formatDate(recipe.savedAt)}</span>
          </div>
          {recipe.address && <p className="saved-card-snippet">📍 {recipe.address}</p>}
        </div>
        <div className="saved-card-actions">
          {recipe.orderLink && (
            <a
              href={recipe.orderLink}
              target="_blank"
              rel="noopener noreferrer"
              className="saved-btn craving-order-btn"
            >
              Order ↗
            </a>
          )}
          <button className="saved-btn danger" onClick={onRemove}>Remove</button>
        </div>
      </div>
    </div>
  );
}

export default function SavedRecipesPage() {
  const { saved, removeRecipe } = useSavedRecipes();
  const [filter, setFilter] = useState<'all' | 'ai' | 'online' | 'craving'>('all');

  const visible = saved.filter(r => filter === 'all' || r.type === filter);
  const aiCount = saved.filter(r => r.type === 'ai').length;
  const onlineCount = saved.filter(r => r.type === 'online').length;
  const cravingCount = saved.filter(r => r.type === 'craving').length;

  return (
    <>
      <style>{`
        .saved-wrap { max-width: 760px; margin: 0 auto; animation: sfade 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes sfade { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        /* Empty */
        .saved-empty { text-align: center; padding: 4rem 2rem; background: var(--dash-card-bg); border: 1px solid var(--border2); border-radius: 20px; }
        .saved-empty-emoji { font-size: 3rem; margin-bottom: 1rem; }
        .saved-empty h3 { font-family:'Syne',sans-serif; font-size:1.2rem; font-weight:800; margin:0 0 0.5rem; color:var(--text); }
        .saved-empty p { color:var(--muted); font-size:0.88rem; margin:0 0 1.4rem; }
        .saved-empty a { display:inline-flex; align-items:center; gap:0.4rem; padding:0.65rem 1.4rem; background:var(--accent); color:#fff; border-radius:100px; text-decoration:none; font-weight:700; font-size:0.88rem; box-shadow:0 4px 18px rgba(232,82,42,0.3); transition:transform 0.2s; }
        .saved-empty a:hover { transform:translateY(-2px); }

        /* Filter tabs */
        .saved-filters { display:flex; gap:0.5rem; margin-bottom:1.2rem; flex-wrap:wrap; }
        .saved-filter-btn { padding:0.42rem 1rem; border-radius:100px; border:1px solid var(--border2); background:transparent; color:var(--muted); font:600 0.8rem 'DM Sans',sans-serif; cursor:pointer; transition:all 0.18s; }
        .saved-filter-btn:hover { border-color:rgba(232,82,42,0.4); color:var(--accent); }
        .saved-filter-btn.active { border-color:rgba(232,82,42,0.5); background:rgba(232,82,42,0.1); color:var(--accent); }
        .saved-filter-count { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:50%; background:rgba(232,82,42,0.25); font-size:0.65rem; font-weight:700; margin-left:0.3rem; color: #fff; }

        /* Card list */
        .saved-list { display:flex; flex-direction:column; gap:0.9rem; }

        /* Shared card shell */
        .saved-card { background:var(--dash-card-bg); border:1px solid var(--border2); border-radius:18px; backdrop-filter:blur(12px); overflow:hidden; transition:border-color 0.2s; }
        .saved-card:hover { border-color:var(--border); }
        .saved-card.ai-card:hover { border-color:rgba(232,82,42,0.25); }
        .saved-card.online-card:hover { border-color:rgba(100,180,255,0.2); }
        .saved-card.craving-card:hover { border-color:rgba(245,200,66,0.25); }

        .saved-card-top { display:flex; align-items:flex-start; gap:1.1rem; padding:1.3rem 1.5rem; }
        .saved-card-emoji { font-size:2rem; flex-shrink:0; margin-top:0.1rem; }
        .saved-card-body { flex:1; min-width:0; }
        .saved-card-title { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; margin:0 0 0.35rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text); }
        .saved-card-meta { display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.35rem; }
        .saved-card-tag { display:inline-flex; align-items:center; gap:0.25rem; font-size:0.7rem; font-weight:600; color:var(--muted); background:var(--input-bg); border:1px solid var(--border2); border-radius:100px; padding:0.18rem 0.55rem; }
        .saved-card-tag.fallback-tag { color:rgba(245,200,66,0.7); border-color:rgba(245,200,66,0.2); background:rgba(245,200,66,0.06); }
        .saved-card-tag.craving-tag { color:rgba(245,200,66,0.65); border-color:rgba(245,200,66,0.18); background:rgba(245,200,66,0.05); }
        .saved-card-tag.stars-tag { color:#f5c842; border-color:rgba(245,200,66,0.25); background:rgba(245,200,66,0.06); }
        .saved-card-snippet { font-size:0.77rem; color:var(--muted); opacity:0.8; line-height:1.5; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

        /* Actions */
        .saved-card-actions { display:flex; flex-direction:column; gap:0.4rem; flex-shrink:0; }
        .saved-btn { font:600 0.78rem 'DM Sans',sans-serif; cursor:pointer; padding:0.42rem 0.85rem; border-radius:100px; border:1px solid var(--border2); background:transparent; color:var(--muted); transition:all 0.18s; white-space:nowrap; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; }
        .saved-btn:hover { border-color:rgba(232,82,42,0.45); color:var(--accent); background:rgba(232,82,42,0.06); }
        .saved-btn.danger:hover { border-color:rgba(255,80,80,0.4); color:#ff8a8a; background:rgba(255,80,80,0.06); }
        .saved-btn.link-btn { border-color:rgba(100,180,255,0.25); color:rgba(100,180,255,0.7); }
        .saved-btn.link-btn:hover { border-color:rgba(100,180,255,0.5); color:rgba(150,210,255,0.9); background:rgba(100,180,255,0.07); }
        .saved-btn.craving-order-btn { border-color:rgba(245,200,66,0.25); color:rgba(245,200,66,0.7); }
        .saved-btn.craving-order-btn:hover { border-color:rgba(245,200,66,0.5); color:rgba(245,200,66,0.95); background:rgba(245,200,66,0.07); }

        /* Expanded steps panel */
        .saved-steps-panel { border-top:1px solid var(--border); padding:1.2rem 1.5rem 1.4rem; animation:sfade 0.25s ease both; }
        .saved-steps { list-style:none; margin:0 0 1.2rem; padding:0; display:flex; flex-direction:column; gap:0.65rem; }
        .saved-step { display:flex; gap:0.8rem; align-items:flex-start; }
        .saved-step-num { width:24px; height:24px; border-radius:50%; background:rgba(232,82,42,0.1); border:1px solid rgba(232,82,42,0.25); display:flex; align-items:center; justify-content:center; font:700 0.68rem 'Syne',sans-serif; color:var(--accent); flex-shrink:0; margin-top:0.1rem; }
        .saved-step-text { font-size:0.88rem; color:var(--text); opacity:0.8; line-height:1.65; }

        /* References in expanded panel */
        .saved-refs { margin-top:0.4rem; }
        .saved-refs-label { font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:1.3px; color:var(--muted); opacity:0.6; margin:0 0 0.6rem; }
        .saved-ref-list { display:flex; flex-wrap:wrap; gap:0.45rem; }
        .saved-ref-item { display:inline-flex; align-items:center; gap:0.35rem; padding:0.3rem 0.7rem; background:var(--input-bg); border:1px solid var(--border2); border-radius:100px; text-decoration:none; font-size:0.72rem; font-weight:600; color:var(--muted); transition:all 0.18s; }
        .saved-ref-item:hover { border-color:rgba(232,82,42,0.4); color:var(--accent); }
        .saved-ref-dot { width:5px; height:5px; border-radius:50%; background:var(--accent); opacity:0.7; flex-shrink:0; }

        /* CTA */
        .saved-cta-row { margin-top:1.2rem; padding:1rem 1.25rem; background:rgba(232,82,42,0.06); border:1px solid rgba(232,82,42,0.18); border-radius:14px; display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .saved-cta-row p { font-size:0.84rem; color:var(--muted); margin:0; }
        .saved-cta-row a { font-size:0.84rem; font-weight:700; color:var(--accent2); text-decoration:none; }
        .saved-cta-row a:hover { text-decoration:underline; }
      `}</style>

      <div className="saved-wrap">
        {saved.length === 0 ? (
          <div className="saved-empty">
            <div className="saved-empty-emoji">📖</div>
            <h3>Nothing saved yet</h3>
            <p>Generate a recipe with AI Chef or save a restaurant from Cravings to keep it here.</p>
            <Link to="/demo">Go to AI Chef 👨‍🍳</Link>
          </div>
        ) : (
          <>
            {/* Filter tabs */}
            <div className="saved-filters">
              {([
                { key: 'all', label: '📚 All', count: saved.length },
                { key: 'ai', label: '🤖 AI Recipes', count: aiCount },
                { key: 'online', label: '🌐 Online Finds', count: onlineCount },
                { key: 'craving', label: '🛵 Cravings', count: cravingCount },
              ] as const).map(({ key, label, count }) => (
                <button
                  key={key}
                  className={`saved-filter-btn${filter === key ? ' active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                  <span className="saved-filter-count">{count}</span>
                </button>
              ))}
            </div>

            <div className="saved-list">
              {visible.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                  Nothing saved in this category yet.
                </p>
              ) : (
                visible.map(r => {
                  if (r.type === 'ai') return <AiRecipeCard key={r.id} recipe={r} onRemove={() => removeRecipe(r.id)} />;
                  if (r.type === 'online') return <OnlineRecipeCard key={r.id} recipe={r} onRemove={() => removeRecipe(r.id)} />;
                  return <CravingCard key={r.id} recipe={r} onRemove={() => removeRecipe(r.id)} />;
                })
              )}
            </div>

            <div className="saved-cta-row">
              <p>Want more?</p>
              <Link to="/demo">Generate with AI Chef →</Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
