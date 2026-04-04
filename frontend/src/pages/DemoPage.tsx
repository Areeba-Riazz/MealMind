import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import MacroBadges from '../components/MacroBadges';
import { parseNutrition, type RecipeNutrition } from '../types/recipeNutrition';

const LOADING_MESSAGES = [
  'Searching the internet for recipes... 🔍',
  'Consulting the AI Chef... 👨‍🍳',
  'Chopping virtual veggies... 🥕',
  'Checking budget constraints... 💸',
  'Plating your meal... 🍽️',
];

interface OnlineRecipe {
  title: string;
  url: string;
  snippet: string;
}

interface Reference {
  title: string;
  url: string;
}

interface Recommendation {
  recipeName: string;
  instructions: string[];
  isFallback?: boolean;
  foundOnline?: OnlineRecipe[];
  references?: Reference[];
  nutrition?: RecipeNutrition;
}

export default function DemoPage() {
  const { saveRecipe, removeRecipe, isSaved, saved } = useSavedRecipes();

  const [ingredients, setIngredients] = useState('');
  const [budget, setBudget]           = useState('');
  const [time, setTime]               = useState('');
  const [goal, setGoal]               = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [aiSaveFlash, setAiSaveFlash] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isLoading) {
      interval = setInterval(() => setLoadingMsgIdx(p => (p + 1) % LOADING_MESSAGES.length), 2000);
    } else {
      setLoadingMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setRecommendation(null);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL ?? '';
      const res = await fetch(`${apiBase}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, budget, time, goal }),
      });
      const data: Recommendation & { error?: string; nutrition?: unknown } = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch recommendation');
      if (!data.recipeName || !data.instructions) throw new Error('Invalid response format.');
      const nutrition = parseNutrition(data.nutrition);
      setRecommendation(nutrition ? { ...data, nutrition } : { ...data, nutrition: undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = () => {
    setIngredients('Chicken breast, 1 cup of rice, frozen broccoli, yogurt');
    setBudget('700 PKR');
    setTime('20 minutes');
    setGoal('High protein post-workout');
  };

  const fillEmptyFridge = () => {
    setIngredients('Just 1 egg, a tomato, leftover roti');
    setBudget('100 PKR');
    setTime('5 minutes');
    setGoal('Need a miracle, extremely broke student');
  };

  const reset = () => { setRecommendation(null); setError(null); };

  // Save the AI-generated recipe
  const handleSaveAi = () => {
    if (!recommendation) return;
    if (isSaved(recommendation.recipeName)) {
      // unsave
      const match = saved.find(r => r.title.toLowerCase() === recommendation.recipeName.toLowerCase());
      if (match) removeRecipe(match.id);
    } else {
      saveRecipe({
        type: 'ai',
        title: recommendation.recipeName,
        instructions: recommendation.instructions,
        isFallback: recommendation.isFallback,
        references: recommendation.references,
        ...(recommendation.nutrition ? { nutrition: recommendation.nutrition } : {}),
      });
      setAiSaveFlash(true);
      setTimeout(() => setAiSaveFlash(false), 1800);
    }
  };

  // Save / unsave an online recipe card
  const handleSaveOnline = (r: OnlineRecipe) => {
    if (isSaved(r.title, r.url)) {
      const match = saved.find(s => s.url === r.url);
      if (match) removeRecipe(match.id);
    } else {
      let domain = '';
      try { domain = new URL(r.url).hostname.replace('www.', ''); } catch {}
      saveRecipe({ type: 'online', title: r.title, url: r.url, snippet: r.snippet, domain });
    }
  };

  return (
    <>
      <style>{`
        .demo-wrap { max-width: 720px; margin: 0 auto; animation: demofade 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes demofade { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        /* Form card */
        .demo-card { background:rgba(22,22,22,0.8); border:1px solid rgba(255,255,255,0.07); border-radius:22px; padding:2rem 2.2rem; backdrop-filter:blur(20px); }
        .demo-card h2 { font-family:'Syne',sans-serif; font-size:1.3rem; font-weight:800; margin:0 0 0.3rem; letter-spacing:-0.3px; }
        .demo-card .demo-sub { font-size:0.87rem; color:rgba(255,255,255,0.45); margin:0 0 1.6rem; }

        /* Demo fill buttons */
        .demo-fills { display:flex; gap:0.7rem; margin-bottom:1.4rem; flex-wrap:wrap; }
        .demo-fill-btn { font:600 0.78rem 'DM Sans',sans-serif; cursor:pointer; padding:0.4rem 0.9rem; border-radius:100px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.5); transition:all 0.18s; }
        .demo-fill-btn:hover { border-color:rgba(232,82,42,0.4); color:var(--accent); background:rgba(232,82,42,0.06); }

        /* Form fields */
        .demo-field { margin-bottom:1.1rem; }
        .demo-field label { display:block; font-size:0.78rem; font-weight:600; color:rgba(255,255,255,0.45); margin-bottom:0.45rem; letter-spacing:0.2px; text-transform:uppercase; }
        .demo-field label .req { color:var(--accent); }
        .demo-field input, .demo-field textarea { width:100%; padding:0.85rem 1rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:13px; color:#f2ede4; font:0.92rem 'DM Sans',sans-serif; outline:none; resize:vertical; transition:border-color 0.2s, box-shadow 0.2s; box-sizing:border-box; }
        .demo-field input::placeholder, .demo-field textarea::placeholder { color:rgba(255,255,255,0.22); }
        .demo-field input:focus, .demo-field textarea:focus { border-color:rgba(232,82,42,0.5); background:rgba(232,82,42,0.04); box-shadow:0 0 0 3px rgba(232,82,42,0.1); }

        /* Submit */
        .demo-submit { width:100%; padding:1rem; border-radius:100px; border:none; font:700 0.95rem 'DM Sans',sans-serif; cursor:pointer; margin-top:0.5rem; transition:all 0.2s; }
        .demo-submit:not(:disabled) { background:var(--accent); color:#fff; box-shadow:0 6px 22px rgba(232,82,42,0.32); }
        .demo-submit:not(:disabled):hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(232,82,42,0.42); }
        .demo-submit:disabled { background:rgba(232,82,42,0.28); color:rgba(255,255,255,0.45); cursor:not-allowed; }

        /* Loading */
        .demo-loading { display:flex; align-items:center; justify-content:center; gap:0.8rem; padding:3rem; color:rgba(255,255,255,0.5); font-size:0.92rem; }
        .demo-spinner { width:22px; height:22px; border:2px solid rgba(232,82,42,0.3); border-top-color:var(--accent); border-radius:50%; animation:dspin 0.8s linear infinite; flex-shrink:0; }
        @keyframes dspin { to { transform:rotate(360deg); } }

        /* Result card */
        .demo-result { background:rgba(22,22,22,0.8); border:1px solid rgba(255,255,255,0.07); border-radius:22px; padding:2rem 2.2rem; backdrop-filter:blur(20px); animation:demofade 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .demo-fallback-banner { display:flex; gap:0.9rem; padding:1rem 1.2rem; background:rgba(245,200,66,0.07); border:1px solid rgba(245,200,66,0.22); border-radius:14px; margin-bottom:1.6rem; }
        .demo-fallback-banner strong { display:block; color:var(--accent2); font-size:0.88rem; margin-bottom:0.25rem; }
        .demo-fallback-banner p { color:rgba(255,255,255,0.45); font-size:0.82rem; line-height:1.5; margin:0; }

        /* Recipe title row */
        .demo-recipe-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.4rem; flex-wrap:wrap; }
        .demo-recipe-title { font-family:'Syne',sans-serif; font-size:1.6rem; font-weight:800; letter-spacing:-0.5px; margin:0; line-height:1.2; flex:1; }

        /* Save buttons */
        .demo-save-btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1.1rem; border-radius:100px; border:1px solid rgba(255,255,255,0.12); background:transparent; color:rgba(255,255,255,0.55); font:600 0.8rem 'DM Sans',sans-serif; cursor:pointer; transition:all 0.18s; flex-shrink:0; white-space:nowrap; }
        .demo-save-btn:hover { border-color:rgba(232,82,42,0.45); color:var(--accent); background:rgba(232,82,42,0.07); }
        .demo-save-btn.saved { border-color:rgba(232,82,42,0.5); color:var(--accent); background:rgba(232,82,42,0.1); }
        .demo-save-btn.flash { animation:saveflash 0.35s ease; }
        @keyframes saveflash { 0%{transform:scale(1)} 40%{transform:scale(1.12)} 100%{transform:scale(1)} }

        .demo-online-save-btn { padding:0.28rem 0.7rem; font-size:0.72rem; border-radius:100px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.4); font:600 0.72rem 'DM Sans',sans-serif; cursor:pointer; transition:all 0.18s; flex-shrink:0; white-space:nowrap; }
        .demo-online-save-btn:hover { border-color:rgba(232,82,42,0.4); color:var(--accent); background:rgba(232,82,42,0.07); }
        .demo-online-save-btn.saved { border-color:rgba(232,82,42,0.5); color:var(--accent); background:rgba(232,82,42,0.1); }

        /* Found online section */
        .demo-section-label { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:rgba(255,255,255,0.35); margin:0 0 0.9rem; display:flex; align-items:center; gap:0.5rem; }
        .demo-section-label::after { content:''; flex:1; height:1px; background:rgba(255,255,255,0.06); }
        .demo-online-grid { display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.8rem; }
        .demo-online-card { display:flex; align-items:flex-start; gap:0.9rem; padding:0.85rem 1rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:13px; transition:border-color 0.18s, background 0.18s; }
        .demo-online-card:hover { border-color:rgba(232,82,42,0.25); background:rgba(232,82,42,0.04); }
        .demo-online-icon { font-size:1.2rem; flex-shrink:0; margin-top:0.05rem; }
        .demo-online-body { min-width:0; flex:1; }
        .demo-online-link { display:block; text-decoration:none; }
        .demo-online-title { font-size:0.88rem; font-weight:700; color:#f2ede4; margin:0 0 0.2rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .demo-online-title:hover { color:var(--accent); }
        .demo-online-snippet { font-size:0.77rem; color:rgba(255,255,255,0.38); line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin:0; }
        .demo-online-domain { font-size:0.72rem; color:var(--accent); margin-top:0.3rem; font-weight:600; opacity:0.8; }
        .demo-online-actions { display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem; }

        /* Steps */
        .demo-steps-label { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:rgba(255,255,255,0.35); margin:0 0 1rem; }
        .demo-steps { list-style:none; margin:0 0 2rem; padding:0; display:flex; flex-direction:column; gap:0.75rem; }
        .demo-step { display:flex; gap:0.9rem; align-items:flex-start; }
        .demo-step-num { width:26px; height:26px; border-radius:50%; background:rgba(232,82,42,0.12); border:1px solid rgba(232,82,42,0.28); display:flex; align-items:center; justify-content:center; font:700 0.72rem 'Syne',sans-serif; color:var(--accent); flex-shrink:0; margin-top:0.1rem; }
        .demo-step-text { font-size:0.92rem; color:rgba(255,255,255,0.75); line-height:1.65; }

        /* References */
        .demo-refs { margin-bottom:1.8rem; }
        .demo-ref-list { display:flex; flex-wrap:wrap; gap:0.5rem; }
        .demo-ref-item { display:inline-flex; align-items:center; gap:0.4rem; padding:0.35rem 0.8rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:100px; text-decoration:none; font-size:0.75rem; font-weight:600; color:rgba(255,255,255,0.55); transition:all 0.18s; }
        .demo-ref-item:hover { border-color:rgba(232,82,42,0.4); color:var(--accent); background:rgba(232,82,42,0.07); }
        .demo-ref-dot { width:6px; height:6px; border-radius:50%; background:var(--accent); opacity:0.7; flex-shrink:0; }

        /* Bottom buttons */
        .demo-bottom-btns { display:flex; gap:0.7rem; flex-wrap:wrap; }
        .demo-again-btn { flex:1; min-width:160px; padding:0.9rem; border-radius:100px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:#f2ede4; font:700 0.92rem 'DM Sans',sans-serif; cursor:pointer; transition:all 0.18s; }
        .demo-again-btn:hover { border-color:var(--accent); background:rgba(232,82,42,0.08); color:var(--accent); }

        /* Error */
        .demo-error { text-align:center; padding:2.5rem 1.5rem; background:rgba(22,22,22,0.8); border:1px solid rgba(255,80,80,0.18); border-radius:22px; }
        .demo-error h3 { font-family:'Syne',sans-serif; font-size:1.3rem; font-weight:800; color:#ff8a8a; margin:0 0 0.5rem; }
        .demo-error p { color:rgba(255,255,255,0.45); font-size:0.9rem; margin:0 0 1.6rem; }
        .demo-error button { padding:0.7rem 1.8rem; border-radius:100px; border:none; background:var(--accent); color:#fff; font:700 0.9rem 'DM Sans',sans-serif; cursor:pointer; box-shadow:0 4px 18px rgba(232,82,42,0.28); transition:all 0.2s; }
        .demo-error button:hover { transform:translateY(-2px); }
      `}</style>

      <div className="demo-wrap">
        {!recommendation && !error && (
          <div className="demo-card">
            <h2>👨‍🍳 AI Chef</h2>
            <p className="demo-sub">Tell us your fridge, budget &amp; goal — we'll search the internet &amp; generate the perfect recipe.</p>

            <div className="demo-fills">
              <button className="demo-fill-btn" onClick={fillDemo}>✨ Fill PKR Demo</button>
              <button className="demo-fill-btn" onClick={fillEmptyFridge}>🧊 Desi Empty Fridge</button>
            </div>

            {isLoading ? (
              <div className="demo-loading">
                <div className="demo-spinner" />
                {LOADING_MESSAGES[loadingMsgIdx]}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="demo-field">
                  <label htmlFor="ingredients">Ingredients you have <span className="req">*</span></label>
                  <textarea id="ingredients" rows={3} placeholder="e.g. Chicken, rice, tomatoes, ginger, garlic..." value={ingredients} onChange={e => setIngredients(e.target.value)} required />
                </div>
                <div className="demo-field">
                  <label htmlFor="budget">Budget (optional)</label>
                  <input type="text" id="budget" placeholder="e.g. Under 500 PKR, Student Budget" value={budget} onChange={e => setBudget(e.target.value)} />
                </div>
                <div className="demo-field">
                  <label htmlFor="time">Max cooking time (optional)</label>
                  <input type="text" id="time" placeholder="e.g. 15 minutes, No limit" value={time} onChange={e => setTime(e.target.value)} />
                </div>
                <div className="demo-field">
                  <label htmlFor="goal">Goal or mood (optional)</label>
                  <input type="text" id="goal" placeholder="e.g. High protein, Comfort food, Desi craving" value={goal} onChange={e => setGoal(e.target.value)} />
                </div>
                <button type="submit" className="demo-submit">Find &amp; Generate My Perfect Meal 🍽️</button>
              </form>
            )}
          </div>
        )}

        {error && (
          <div className="demo-error">
            <h3>⚠️ Something went wrong</h3>
            <p>{error}</p>
            <button onClick={reset}>Try Again</button>
          </div>
        )}

        {recommendation && (
          <div className="demo-result">
            {recommendation.isFallback && (
              <div className="demo-fallback-banner">
                <span style={{ fontSize: '1.5rem' }}>💡</span>
                <div>
                  <strong>Creative Pivot!</strong>
                  <p>We couldn't perfectly match your constraints but engineered a solid alternative.</p>
                </div>
              </div>
            )}

            {/* ── Recipe title + save button ── */}
            <div className="demo-recipe-header">
              <h2 className="demo-recipe-title">{recommendation.recipeName}</h2>
              <button
                id="save-ai-recipe-btn"
                className={`demo-save-btn${isSaved(recommendation.recipeName) ? ' saved' : ''}${aiSaveFlash ? ' flash' : ''}`}
                onClick={handleSaveAi}
              >
                {isSaved(recommendation.recipeName) ? '✓ Saved' : '🔖 Save Recipe'}
              </button>
            </div>

            {recommendation.nutrition && (
              <MacroBadges nutrition={recommendation.nutrition} />
            )}

            {/* ── Found Online ── */}
            {recommendation.foundOnline && recommendation.foundOnline.length > 0 && (
              <div style={{ marginBottom: '1.8rem' }}>
                <p className="demo-section-label">🔍 Found on the internet</p>
                <div className="demo-online-grid">
                  {recommendation.foundOnline.map((r, i) => {
                    let domain = '';
                    try { domain = new URL(r.url).hostname.replace('www.', ''); } catch {}
                    const alreadySaved = isSaved(r.title, r.url);
                    return (
                      <div key={i} className="demo-online-card">
                        <span className="demo-online-icon">🌐</span>
                        <div className="demo-online-body">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="demo-online-link"
                          >
                            <p className="demo-online-title">{r.title}</p>
                          </a>
                          {r.snippet && <p className="demo-online-snippet">{r.snippet}</p>}
                          <div className="demo-online-actions">
                            {domain && <span className="demo-online-domain">↗ {domain}</span>}
                            <button
                              className={`demo-online-save-btn${alreadySaved ? ' saved' : ''}`}
                              onClick={() => handleSaveOnline(r)}
                            >
                              {alreadySaved ? '✓ Saved' : '🔖 Save'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── AI Generated Steps ── */}
            <p className="demo-steps-label">Step-by-step instructions</p>
            <ol className="demo-steps">
              {recommendation.instructions.map((step, i) => (
                <li key={i} className="demo-step">
                  <span className="demo-step-num">{i + 1}</span>
                  <span className="demo-step-text">{step}</span>
                </li>
              ))}
            </ol>

            {/* ── References ── */}
            {recommendation.references && recommendation.references.length > 0 && (
              <div className="demo-refs">
                <p className="demo-section-label">📚 References</p>
                <div className="demo-ref-list">
                  {recommendation.references.map((ref, i) => (
                    <a
                      key={i}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="demo-ref-item"
                    >
                      <span className="demo-ref-dot" />
                      {ref.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="demo-bottom-btns">
              <button className="demo-again-btn" onClick={reset}>Plan Another Meal →</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
