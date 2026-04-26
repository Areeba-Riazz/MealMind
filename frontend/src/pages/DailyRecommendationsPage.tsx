import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDailyRecommendations, updateRecommendationRating, type DailyRecommendationDoc } from '../lib/firestoreUserData';

export default function DailyRecommendationsPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<DailyRecommendationDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const loadData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const data = await getDailyRecommendations(user.uid, getTodayStr());
      setRecommendations(data);
    } catch (e) {
      console.error("Failed to load daily recommendations", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Setting up an interval to poll if it's currently generating
    const interval = setInterval(async () => {
      if (!recommendations && user?.uid) {
        const data = await getDailyRecommendations(user.uid, getTodayStr());
        if (data) setRecommendations(data);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.uid, recommendations]);

  const handleRating = async (type: 'recipe' | 'order', rating: 'up' | 'down') => {
    if (!user?.uid || !recommendations) return;
    try {
      const currentRating = type === 'recipe' ? recommendations.recipe.rating : recommendations.order.rating;
      // Toggle off if clicking the same one
      const newRating = currentRating === rating ? null : rating;
      
      await updateRecommendationRating(user.uid, getTodayStr(), type, newRating);
      
      // Update local state
      setRecommendations(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [type]: {
            ...prev[type],
            rating: newRating
          }
        };
      });
    } catch (e) {
      console.error("Failed to update rating", e);
    }
  };

  if (loading && !recommendations) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--muted)' }}>
        Loading today's recommendations...
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>No recommendations yet</h2>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Head to the dashboard to generate your daily meals.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .dr-wrap {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 0 3rem;
          animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .dr-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .dr-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 0.5rem;
        }
        .dr-header p {
          color: var(--muted);
          font-size: 1rem;
        }

        .dr-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 768px) {
          .dr-grid { grid-template-columns: 1fr; }
        }

        .dr-card {
          background: var(--dash-card-bg);
          border: 1px solid var(--border2);
          border-radius: 22px;
          padding: 2rem;
          backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .dr-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 6px;
        }
        .dr-card.recipe::before {
          background: linear-gradient(90deg, #e8522a, #f5c842);
        }
        .dr-card.order::before {
          background: linear-gradient(90deg, #2ec27e, #4ade80);
        }

        .dr-badge {
          display: inline-block;
          padding: 0.3rem 0.8rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1rem;
        }
        .dr-card.recipe .dr-badge {
          background: rgba(232,82,42,0.1);
          color: var(--accent);
          border: 1px solid rgba(232,82,42,0.2);
        }
        .dr-card.order .dr-badge {
          background: rgba(46,194,126,0.1);
          color: #2ec27e;
          border: 1px solid rgba(46,194,126,0.2);
        }

        .dr-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 0.8rem;
          line-height: 1.2;
        }
        .dr-desc {
          color: var(--muted);
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          flex-grow: 1;
        }

        .dr-section-title {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text);
          margin: 1.5rem 0 0.8rem;
          letter-spacing: 0.5px;
        }
        
        .dr-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .dr-list li {
          font-size: 0.9rem;
          color: var(--text);
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
        }
        .dr-list li:last-child {
          border-bottom: none;
        }

        .dr-price {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--accent2);
          margin: 1rem 0;
        }

        .dr-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }
        .dr-rate-btn {
          background: var(--input-bg);
          border: 1px solid var(--border2);
          border-radius: 12px;
          padding: 0.6rem 1rem;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dr-rate-btn:hover {
          background: var(--glass-hover);
          transform: translateY(-2px);
        }
        .dr-rate-btn.active.up {
          background: rgba(46,194,126,0.15);
          border-color: #2ec27e;
        }
        .dr-rate-btn.active.down {
          background: rgba(255,80,80,0.15);
          border-color: #ff8a8a;
        }
        
        .dr-rate-label {
          font-size: 0.8rem;
          color: var(--muted);
          font-weight: 600;
          margin-right: auto;
        }

        .dr-nutrition {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }
        .dr-macro {
          background: var(--input-bg);
          border: 1px solid var(--border2);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted);
        }
        .dr-macro span {
          color: var(--text);
        }
      `}</style>

      <div className="dr-wrap">
        <div className="dr-header">
          <h1>Today's Recommendations</h1>
          <p>Hand-picked for you on {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="dr-grid">
          {/* RECIPE CARD */}
          <div className="dr-card recipe">
            <div className="dr-badge">👨‍🍳 Cook at home</div>
            <h2 className="dr-title">{recommendations.recipe.title}</h2>
            <p className="dr-desc">{recommendations.recipe.description}</p>
            
            <h3 className="dr-section-title">Ingredients</h3>
            <ul className="dr-list">
              {recommendations.recipe.ingredients.slice(0, 5).map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
              {recommendations.recipe.ingredients.length > 5 && (
                <li style={{ color: 'var(--muted)', fontStyle: 'italic' }}>+ {recommendations.recipe.ingredients.length - 5} more...</li>
              )}
            </ul>

            {recommendations.recipe.nutrition && (
              <div className="dr-nutrition">
                <div className="dr-macro">Calories: <span>{recommendations.recipe.nutrition.calories}</span></div>
                <div className="dr-macro">Protein: <span>{recommendations.recipe.nutrition.proteinG}g</span></div>
              </div>
            )}

            <div className="dr-actions">
              <span className="dr-rate-label">Rate this suggestion</span>
              <button 
                className={`dr-rate-btn ${recommendations.recipe.rating === 'up' ? 'active up' : ''}`}
                onClick={() => handleRating('recipe', 'up')}
                title="Good suggestion"
              >👍</button>
              <button 
                className={`dr-rate-btn ${recommendations.recipe.rating === 'down' ? 'active down' : ''}`}
                onClick={() => handleRating('recipe', 'down')}
                title="Bad suggestion"
              >👎</button>
            </div>
          </div>

          {/* ORDER CARD */}
          <div className="dr-card order">
            <div className="dr-badge">🛵 Order in</div>
            <h2 className="dr-title">{recommendations.order.title}</h2>
            <p className="dr-desc">{recommendations.order.description}</p>
            
            <div className="dr-price">
              Est. Cost: {recommendations.order.estimatedCost}
            </div>

            <div className="dr-actions" style={{ marginTop: 'auto' }}>
              <span className="dr-rate-label">Rate this suggestion</span>
              <button 
                className={`dr-rate-btn ${recommendations.order.rating === 'up' ? 'active up' : ''}`}
                onClick={() => handleRating('order', 'up')}
                title="Good suggestion"
              >👍</button>
              <button 
                className={`dr-rate-btn ${recommendations.order.rating === 'down' ? 'active down' : ''}`}
                onClick={() => handleRating('order', 'down')}
                title="Bad suggestion"
              >👎</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
