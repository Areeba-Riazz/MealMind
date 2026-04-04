import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatWidget from './ChatWidget';

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/dashboard':  { title: 'Dashboard',          sub: 'Your meal command center'         },
  '/demo':       { title: 'AI Chef',             sub: 'Generate a recipe from your fridge' },
  '/cravings':   { title: 'Cravings',            sub: 'Find the best food near you'      },
  '/saved':      { title: 'Saved Recipes',       sub: 'Your personal recipe collection'  },
  '/food-links': { title: 'Food Links',          sub: 'Bookmarked restaurants & orders'  },
  '/profile':    { title: 'Profile',             sub: 'Account, preferences & dietary'   },
  '/onboarding': { title: 'Onboarding',          sub: 'Finish your profile setup'        },
};

export default function AppShellLayout() {
  const { pathname } = useLocation();
  const meta = PAGE_TITLES[pathname] ?? { title: 'MealMind', sub: '' };

  return (
    <>
      <style>{`
        .mm-shell {
          display: flex;
          min-height: 100vh;
          background: #0c0c0c;
        }
        .mm-shell-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        /* Top bar */
        .mm-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.1rem 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(12,12,12,0.8);
          backdrop-filter: blur(16px);
          position: sticky;
          top: 0;
          z-index: 50;
          flex-shrink: 0;
        }
        .mm-topbar-left h2 {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: -0.3px;
          margin: 0 0 0.1rem;
          color: #f2ede4;
        }
        .mm-topbar-left p {
          font-size: 0.77rem;
          color: rgba(255,255,255,0.35);
          margin: 0;
        }
        .mm-topbar-right {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .mm-topbar-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.8rem;
          background: rgba(232,82,42,0.09);
          border: 1px solid rgba(232,82,42,0.22);
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #e8522a;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        /* Scrollable content area */
        .mm-shell-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 2rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .mm-shell-content::-webkit-scrollbar { width: 5px; }
        .mm-shell-content::-webkit-scrollbar-track { background: transparent; }
        .mm-shell-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }

        @media (max-width: 768px) {
          .mm-topbar { padding: 0.9rem 1.2rem; }
          .mm-shell-content { padding: 1.2rem; }
        }
      `}</style>

      <div className="mm-shell">
        <Sidebar />
        <div className="mm-shell-main">
          {/* Top bar */}
          <header className="mm-topbar">
            <div className="mm-topbar-left">
              <h2>{meta.title}</h2>
              {meta.sub && <p>{meta.sub}</p>}
            </div>
            <div className="mm-topbar-right">
              <div className="mm-topbar-pill">🌶️ Free tier</div>
            </div>
          </header>

          {/* Page content */}
          <main className="mm-shell-content">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Floating chat widget — rendered outside the scrollable main so it's always visible */}
      <ChatWidget />
    </>
  );
}