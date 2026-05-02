import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import RecipeAssistant from '../components/RecipeAssistant';
import MacroBadges from '../components/MacroBadges';

export default function RecipeDetailPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { saved } = useSavedRecipes();

  const [recipe, setRecipe] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ text: string; type: 'ingredient' | 'step' } | null>(null);

  useEffect(() => {
    if (recipeId === 'active') {
      const active = localStorage.getItem('mealmind_active_recipe');
      if (active) {
        setRecipe(JSON.parse(active));
      } else {
        navigate('/ai-chef');
      }
    } else {
      const found = saved.find(r => r.id === recipeId);
      if (found) {
        setRecipe(found);
      } else {
        navigate('/ai-chef');
      }
    }
  }, [recipeId, saved, navigate]);

  if (!recipe) return null;

  const getVideoId = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    } catch { return null; }
    return null;
  };

  const videoId = recipe.youtubeUrl ? getVideoId(recipe.youtubeUrl) : null;
  const hasVideo = !!videoId;

  const handleItemClick = (text: string, type: 'ingredient' | 'step') => {
    setSelectedItem({ text, type });
    setAssistantOpen(true);
  };

  return (
    <>
      <style>{`
        /* ── Page shell ── */
        .rp-shell {
          display: flex;
          gap: 0;
          min-height: calc(100vh - 120px);
          animation: rpFade 0.4s ease both;
          transition: gap 0.35s ease;
        }
        @keyframes rpFade {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Main content area (recipe + optional video) ── */
        .rp-main {
          flex: 1;
          display: flex;
          gap: 2rem;
          min-width: 0;
          transition: all 0.35s ease;
        }

        /* ── Assistant panel (right-side drawer) ── */
        .rp-assistant-panel {
          width: 0;
          overflow: hidden;
          flex-shrink: 0;
          transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: sticky;
          top: 100px;
          align-self: flex-start;
          height: calc(100vh - 160px);
        }
        .rp-assistant-panel.open {
          width: 380px;
          margin-left: 1.5rem;
        }
        .rp-assistant-inner {
          width: 380px;
          height: 100%;
          background: var(--dash-card-bg);
          border: 1px solid var(--border);
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }

        /* ── Recipe details card (LEFT in the 2-col layout when video present) ── */
        .rp-details-section {
          flex: 1;
          background: var(--dash-card-bg);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: fit-content;
          min-width: 0;
        }

        /* ── Video column (RIGHT, sticky) ── */
        .rp-video-section {
          flex: 1.2;
          position: sticky;
          top: 100px;
          height: fit-content;
          flex-shrink: 0;
          transition: all 0.4s ease;
        }
        
        /* When assistant is open, we shrink the video to give the recipe more space */
        .rp-shell.asst-open .rp-video-section {
          flex: 0.8;
          opacity: 0.8;
        }

        .rp-video-wrapper {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          background: #000;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }
        .rp-video-wrapper iframe {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          border: 0;
        }

        .rp-item.active {
          border-color: var(--accent);
          background: rgba(232,82,42,0.08);
          box-shadow: inset 4px 0 0 var(--accent);
        }


        /* ── No-video: recipe fills full width ── */
        .rp-main.no-video .rp-details-section {
          max-width: 780px;
          margin: 0 auto;
        }

        /* ── Header ── */
        .rp-header { display: flex; flex-direction: column; gap: 0.8rem; }
        .rp-title {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.8px;
          margin: 0;
          color: var(--text);
        }
        .rp-meta { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .rp-badge {
          padding: 0.35rem 0.8rem;
          border-radius: 100px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          font: 600 0.75rem 'DM Sans', sans-serif;
          color: var(--muted);
        }

        /* ── Tabs ── */
        .rp-tabs {
          display: flex;
          gap: 1rem;
          border-bottom: 1px solid var(--border);
        }
        .rp-tab {
          padding: 0.8rem 0.2rem;
          font: 700 0.85rem 'DM Sans', sans-serif;
          color: var(--muted);
          cursor: pointer;
          position: relative;
          background: transparent;
          border: none;
        }
        .rp-tab.active { color: var(--accent); }
        .rp-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 0; right: 0;
          height: 2px;
          background: var(--accent);
        }

        /* ── List items ── */
        .rp-content { padding-top: 1rem; }
        .rp-list {
          list-style: none;
          padding: 0; margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .rp-item {
          padding: 1rem 1.2rem;
          background: var(--glass-overlay);
          border: 1px solid var(--border2);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .rp-item:hover {
          border-color: rgba(232,82,42,0.4);
          background: rgba(232,82,42,0.04);
          transform: translateX(4px);
        }
        .rp-item-hint {
          position: absolute;
          right: 1rem; top: 50%;
          transform: translateY(-50%);
          font-size: 0.7rem;
          color: var(--accent);
          font-weight: 700;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .rp-item:hover .rp-item-hint { opacity: 1; }

        .rp-ing-row { display: flex; justify-content: space-between; align-items: center; }
        .rp-ing-name { font-weight: 600; color: var(--text); }
        .rp-ing-amount { color: var(--muted); font-size: 0.85rem; }

        .rp-step-row { display: flex; gap: 1rem; }
        .rp-step-num {
          width: 24px; height: 24px;
          border-radius: 50%;
          background: rgba(232,82,42,0.1);
          border: 1px solid rgba(232,82,42,0.3);
          color: var(--accent);
          font-size: 0.7rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .rp-step-text { font-size: 0.95rem; line-height: 1.6; color: var(--text); }

        /* ── Assistant panel inner layout ── */
        .rp-asst-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.2rem 1.4rem;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .rp-asst-title {
          font: 700 0.9rem 'DM Sans', sans-serif;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .rp-asst-close {
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 1.1rem;
          line-height: 1;
          padding: 0.2rem;
          border-radius: 6px;
          transition: color 0.15s;
        }
        .rp-asst-close:hover { color: var(--text); }
        .rp-asst-body {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          /* Chat content scrolls inside the panel; input stays anchored at bottom */
          display: flex;
          flex-direction: column;
        }

        /* ── Responsive ── */
        @media (max-width: 1000px) {
          .rp-shell { flex-direction: column; }
          .rp-main { flex-direction: column; }
          .rp-video-section { position: relative; top: 0; }
          .rp-assistant-panel {
            position: relative;
            height: auto;
            top: 0;
          }
          .rp-assistant-panel.open {
            width: 100%;
            margin-left: 0;
            margin-top: 1.5rem;
          }
          .rp-assistant-inner {
            width: 100%;
            height: 480px;
            margin-top: 0;
          }
        }

        .rp-back-btn { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--muted); text-decoration: none; font: 700 0.85rem 'DM Sans', sans-serif; margin-bottom: 1.5rem; transition: color 0.2s; }
        .rp-back-btn:hover { color: var(--accent); }
      `}</style>

      <div className={`rp-shell ${assistantOpen ? 'asst-open' : ''}`}>
        
        {/* ── MAIN CONTENT (recipe + video side by side) ── */}
        <div className={`rp-main${hasVideo ? '' : ' no-video'}`}>

          {/* RECIPE DETAILS — always first (left or only column) */}
          <div className="rp-details-section">
            <Link to="/demo" className="rp-back-btn">← Back to AI Chef</Link>

            <div className="rp-header">
              <h1 className="rp-title">{recipe.title || recipe.recipeName}</h1>
              <div className="rp-meta">
                {recipe.cookingTime && <span className="rp-badge">🕒 {recipe.cookingTime}</span>}
                {recipe.estimatedCost && <span className="rp-badge">💸 {recipe.estimatedCost}</span>}
              </div>
              {recipe.nutrition && <MacroBadges nutrition={recipe.nutrition} />}
            </div>

            <div className="rp-tabs">
              <button
                className={`rp-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
                onClick={() => setActiveTab('ingredients')}
              >
                Ingredients
              </button>
              <button
                className={`rp-tab ${activeTab === 'instructions' ? 'active' : ''}`}
                onClick={() => setActiveTab('instructions')}
              >
                Step-by-Step
              </button>
            </div>

            <div className="rp-content">
              {activeTab === 'ingredients' && (
                <ul className="rp-list">
                  {recipe.ingredientsList && recipe.ingredientsList.length > 0 ? (
                    recipe.ingredientsList.map((ing: any, i: number) => {
                      const text = `${ing.amount} ${ing.item}`;
                      const isActive = selectedItem?.text === text;
                      return (
                        <li 
                          key={i} 
                          className={`rp-item ${isActive ? 'active' : ''}`} 
                          onClick={() => handleItemClick(text, 'ingredient')}
                        >
                          <div className="rp-ing-row">
                            <span className="rp-ing-name">{ing.item}</span>
                            <span className="rp-ing-amount">{ing.amount}</span>
                          </div>
                          <span className="rp-item-hint">Ask Chef 💬</span>
                        </li>
                      );
                    })
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        The Chef is still gathering the ingredients list for this recipe. 
                        You can see them in the steps or ask the assistant below!
                      </p>
                      <button 
                        onClick={() => handleItemClick("Can you list the ingredients for me?", "ingredient")}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                      >
                        👨‍🍳 List Ingredients
                      </button>
                    </div>
                  )}
                </ul>
              )}

              {activeTab === 'instructions' && (
                <ul className="rp-list">
                  {recipe.instructions && recipe.instructions.length > 0 ? (
                    recipe.instructions.map((step: string, i: number) => {
                      const isActive = selectedItem?.text === step;
                      return (
                        <li 
                          key={i} 
                          className={`rp-item ${isActive ? 'active' : ''}`} 
                          onClick={() => handleItemClick(step, 'step')}
                        >
                          <div className="rp-step-row">
                            <span className="rp-step-num">{i + 1}</span>
                            <span className="rp-step-text">{step}</span>
                          </div>
                          <span className="rp-item-hint">Technical Help 💬</span>
                        </li>
                      );
                    })
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        This is an external recipe; follow the source video or link for the method!
                      </p>
                      {(recipe.url || recipe.orderLink) && (
                        <a 
                          href={recipe.url || recipe.orderLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', background: 'var(--accent)', textDecoration: 'none', color: '#fff', fontWeight: 600, display: 'inline-block' }}
                        >
                          🔗 Open Original Recipe
                        </a>
                      )}
                    </div>
                  )}
                </ul>
              )}
            </div>

          </div>

          {/* VIDEO COLUMN — only rendered when a video exists */}
          {hasVideo && (
            <div className="rp-video-section">
              <div className="rp-video-wrapper">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                  title={recipe.title || recipe.recipeName}
                  allowFullScreen
                />
              </div>

              <div style={{ marginTop: '1.5rem', opacity: 0.8 }}>
                <p className="demo-section-label" style={{ marginBottom: '0.8rem' }}>AI Cooking Tip</p>
                <div style={{ padding: '1.2rem', background: 'var(--glass-overlay)', border: '1px solid var(--border)', borderRadius: '16px', fontSize: '0.9rem', color: 'var(--muted)', lineHeight: '1.6' }}>
                  "Since this recipe is AI-guided, ingredients and steps might vary slightly from the video. Click on anything on the left if you need a substitute or clarification!"
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── CHEF ASSISTANT PANEL — slides in from the right ── */}
        <div className={`rp-assistant-panel${assistantOpen ? ' open' : ''}`}>
          <div className="rp-assistant-inner">
            <div className="rp-asst-header">
              <span className="rp-asst-title">👨‍🍳 Chef Assistant</span>
              <button
                className="rp-asst-close"
                onClick={() => setAssistantOpen(false)}
                aria-label="Close assistant"
              >
                ✕
              </button>
            </div>
            <div className="rp-asst-body">
              <RecipeAssistant
                isOpen={assistantOpen}
                onClose={() => setAssistantOpen(false)}
                recipeName={recipe.title || recipe.recipeName}
                selectedItem={selectedItem?.text || ''}
                contextInstructions={recipe.instructions}
                contextIngredients={recipe.ingredientsList}
                inline
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}