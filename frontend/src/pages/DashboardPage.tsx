import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSavedRecipes } from '../context/SavedRecipesContext';
import { useFoodLinks } from '../context/FoodLinksContext';
import { usePlannedMealsThisWeek } from '../hooks/usePlannedMealsThisWeek';

const QUICK_ACTIONS = [
  { to: '/demo', label: 'AI Chef', emoji: '👨‍🍳', desc: 'Get a recipe from your fridge', accent: true },
  { to: '/cravings', label: 'Cravings', emoji: '🛵', desc: 'Order the perfect meal', accent: false },
  { to: '/meal-planner', label: 'Meal Planner', emoji: '📅', desc: 'Plan your week', accent: false },
  { to: '/saved', label: 'Saved', emoji: '📖', desc: 'Your saved recipes', accent: false },
  { to: '/food-links', label: 'Food Links', emoji: '🔗', desc: 'Curated restaurant links', accent: false },
  { to: '/profile', label: 'Profile', emoji: '⚙️', desc: 'Preferences & dietary', accent: false },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const { saved } = useSavedRecipes();
  const { links } = useFoodLinks();
  const plannedThisWeek = usePlannedMealsThisWeek();

  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  const savedRecipeCount = useMemo(
    () => saved.filter((r) => r.type === 'ai' || r.type === 'online').length,
    [saved]
  );

  const stats = useMemo(
    () => [
      {
        label: 'Planned this week',
        value: String(plannedThisWeek),
        sub:
          plannedThisWeek === 0
            ? 'Open meal planner →'
            : 'View or edit your plan →',
        color: 'var(--accent)',
        to: '/meal-planner',
      },
      {
        label: 'Saved recipes',
        value: String(savedRecipeCount),
        sub: savedRecipeCount === 0 ? 'Generate with AI Chef →' : 'View collection →',
        color: 'var(--accent2)',
        to: '/saved',
      },
      {
        label: 'Food links',
        value: String(links.length),
        sub: links.length === 0 ? 'Save from Cravings →' : 'Manage bookmarks →',
        color: 'var(--accent3)',
        to: '/food-links',
      },
    ],
    [plannedThisWeek, savedRecipeCount, links.length]
  );

  return (
    <>
      <style>{`
        .dash-wrap { max-width: 940px; margin: 0 auto; padding: 0 0 3rem; animation: dashFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes dashFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Hero ── */
        .dash-hero { position: relative; overflow: hidden; padding: 2.5rem 2.2rem; border-radius: 22px; margin-bottom: 1.6rem; background: var(--dash-card-bg); border: 1px solid var(--border2); backdrop-filter: blur(20px); }
        .dash-hero::before { content: ''; position: absolute; top: -80px; right: -80px; width: 280px; height: 280px; background: radial-gradient(circle, rgba(232,82,42,0.18), transparent 70%); border-radius: 50%; pointer-events: none; }
        .dash-hero::after { content: '🍛'; position: absolute; bottom: -14px; right: 24px; font-size: 6rem; opacity: 0.06; pointer-events: none; transform: rotate(12deg); }
        .dash-hero-pill { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.85rem; background: rgba(232,82,42,0.1); border: 1px solid rgba(232,82,42,0.28); border-radius: 100px; color: var(--accent); font-size: 0.72rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 1rem; }
        .dash-hero h1 { font-family: 'Syne', sans-serif; font-size: clamp(1.5rem, 4vw, 2.3rem); font-weight: 800; letter-spacing: -0.8px; margin: 0 0 0.5rem; line-height: 1.15; color: var(--text); }
        .dash-hero h1 em { font-style: normal; background: linear-gradient(120deg, var(--accent), var(--accent2) 60%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .dash-hero p { color: var(--muted); font-size: 0.92rem; margin: 0 0 1.6rem; max-width: 400px; line-height: 1.6; }
        .dash-hero-btns { display: flex; gap: 0.7rem; flex-wrap: wrap; position: relative; z-index: 1; }
        .dash-btn-main { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.7rem 1.5rem; background: var(--accent); color: rgba(255,255,255,0.95); border-radius: 100px; font-weight: 700; font-size: 0.88rem; text-decoration: none; box-shadow: 0 6px 22px rgba(232,82,42,0.32); transition: transform 0.2s, box-shadow 0.2s; }
        .dash-btn-main:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(232,82,42,0.4); }
        .dash-btn-ghost { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.7rem 1.3rem; border: 1px solid var(--border2); color: var(--text); border-radius: 100px; font-weight: 600; font-size: 0.88rem; text-decoration: none; transition: border-color 0.2s, background 0.2s; }
        .dash-btn-ghost:hover { border-color: var(--accent); background: var(--glass-hover); }

        /* ── Stats ── */
        .dash-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.6rem; }
        .dash-stat-card { background: var(--dash-card-bg); border: 1px solid var(--border2); border-radius: 18px; padding: 1.4rem 1.5rem; backdrop-filter: blur(16px); text-decoration: none; color: inherit; transition: border-color 0.2s, transform 0.2s; display: block; }
        .dash-stat-card:hover { transform: translateY(-3px); border-color: var(--accent); }
        .dash-stat-val { font-family: 'Syne', sans-serif; font-size: 2.1rem; font-weight: 800; line-height: 1; margin-bottom: 0.3rem; }
        .dash-stat-label { font-size: 0.8rem; color: var(--muted); font-weight: 500; margin-bottom: 0.6rem; }
        .dash-stat-link { font-size: 0.75rem; margin-top: 0.55rem; font-weight: 600; opacity: 0.8; }

        /* ── Quick actions ── */
        .dash-section-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); margin: 0 0 1rem; }
        .dash-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 0.9rem; }
        .dash-tile { background: var(--dash-card-bg); border: 1px solid var(--border2); border-radius: 18px; padding: 1.4rem 1.3rem; text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: 0.5rem; transition: border-color 0.22s, transform 0.22s, background 0.22s; backdrop-filter: blur(12px); }
        .dash-tile:hover { border-color: rgba(232,82,42,0.38); background: rgba(232,82,42,0.06); transform: translateY(-3px); }
        .dash-tile.accent { border-color: rgba(232,82,42,0.35); background: rgba(232,82,42,0.08); }
        .dash-tile.accent:hover { border-color: rgba(232,82,42,0.55); background: rgba(232,82,42,0.14); }
        .dash-tile-emoji { font-size: 1.8rem; }
        .dash-tile-name { font-weight: 700; font-size: 0.92rem; color: var(--text); }
        .dash-tile-desc { font-size: 0.77rem; color: var(--muted); line-height: 1.4; }

        /* ── Responsive ── */
        @media (max-width: 700px) {
          .dash-stats { grid-template-columns: 1fr; }
          .dash-hero { padding: 1.8rem 1.4rem; }
        }
        @media (max-width: 480px) {
          .dash-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="dash-wrap">
        <div className="dash-hero">
          <div className="dash-hero-pill">🌶️ Pakistan's AI Meal Planner</div>
          <h1>
            Hey <em>{firstName}</em>,<br />
            what are we eating? 🍛
          </h1>
          <p>Your AI chef is ready. Tell it what&apos;s in your fridge or what you&apos;re craving — get a recipe or a restaurant in 10 seconds.</p>
          <div className="dash-hero-btns">
            <Link to="/demo" className="dash-btn-main">
              Try AI Chef 🚀
            </Link>
            <Link to="/cravings" className="dash-btn-ghost">
              I&apos;m craving something 🛵
            </Link>
          </div>
        </div>

        <div className="dash-stats">
          {stats.map((s) => (
            <Link key={s.label} to={s.to} className="dash-stat-card">
              <div className="dash-stat-val" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="dash-stat-label">{s.label}</div>
              <div className="dash-stat-link" style={{ color: s.color }}>
                {s.sub}
              </div>
            </Link>
          ))}
        </div>

        <p className="dash-section-label">Quick actions</p>
        <div className="dash-grid">
          {QUICK_ACTIONS.map(({ to, label, emoji, desc, accent }) => (
            <Link key={to} to={to} className={`dash-tile${accent ? ' accent' : ''}`}>
              <span className="dash-tile-emoji">{emoji}</span>
              <span className="dash-tile-name">{label}</span>
              <span className="dash-tile-desc">{desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
