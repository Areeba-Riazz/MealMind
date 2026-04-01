import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../lib/firebase';

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const isLanding = pathname === '/';

  const handleLogout = async () => {
    try {
      if (app) await signOut(getAuth(app));
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const close = () => setDrawerOpen(false);

  return (
    <>
      <style>{`
        /* ── Navbar ── */
        .mm-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 3rem;
          backdrop-filter: blur(24px); background: rgba(12,12,12,0.82);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo { font-family: var(--font-head); font-weight: 800; font-size: 1.45rem; color: var(--text); text-decoration: none; letter-spacing: -0.5px; }
        .nav-logo span { color: var(--accent); }
        .nav-center { display: flex; gap: 2rem; }
        .nav-center a { color: var(--muted); text-decoration: none; font-size: 0.88rem; font-weight: 500; transition: color 0.2s; }
        .nav-center a:hover { color: var(--text); }
        .nav-right { display: flex; gap: 0.8rem; align-items: center; }
        .btn-nav-ghost { color: var(--muted); text-decoration: none; font-size: 0.88rem; font-weight: 500; padding: 0.5rem 1.1rem; border-radius: 100px; border: 1px solid var(--border); transition: all 0.2s; }
        .btn-nav-ghost:hover { color: var(--text); border-color: var(--border2); }
        .btn-nav-main { background: var(--accent); color: #fff; text-decoration: none; font-size: 0.88rem; font-weight: 700; padding: 0.55rem 1.3rem; border-radius: 100px; transition: opacity 0.2s, transform 0.2s; box-shadow: 0 4px 18px rgba(232,82,42,0.3); }
        .btn-nav-main:hover { opacity: 0.88; transform: translateY(-1px); }
        .nav-user { display: flex; align-items: center; gap: 0.65rem; }
        .nav-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.78rem; font-weight: 700; flex-shrink: 0; }
        .nav-username { color: var(--muted); font-size: 0.85rem; max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .btn-nav-logout { background: none; border: 1px solid var(--border); color: var(--muted); font-size: 0.82rem; padding: 0.4rem 0.9rem; border-radius: 100px; cursor: pointer; font-family: var(--font-body); transition: all 0.2s; }
        .btn-nav-logout:hover { color: var(--text); border-color: var(--border2); }

        /* Hamburger */
        .nav-hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 4px; background: none; border: none; }
        .nav-hamburger span { display: block; width: 22px; height: 2px; background: var(--text); border-radius: 2px; transition: all 0.3s; }

        /* Mobile drawer */
        .nav-mobile-drawer {
          display: none;
          position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 190;
          background: rgba(12,12,12,0.97); backdrop-filter: blur(24px);
          flex-direction: column; align-items: center; justify-content: center; gap: 2rem;
          padding: 2rem;
        }
        .nav-mobile-drawer.open { display: flex; }
        .nav-mobile-drawer a { color: var(--text); text-decoration: none; font-size: 1.4rem; font-family: var(--font-head); font-weight: 700; }
        .nav-mobile-drawer .close-btn { position: absolute; top: 1.2rem; right: 1.5rem; background: none; border: none; color: var(--muted); font-size: 2rem; cursor: pointer; }
        .nav-mobile-ctas { display: flex; gap: 0.8rem; margin-top: 1rem; flex-wrap: wrap; justify-content: center; }
        .nav-mobile-user { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; color: var(--muted); font-size: 0.9rem; }

        /* Responsive */
        @media (max-width: 1024px) { .mm-nav { padding: 1rem 2rem; } }
        @media (max-width: 768px) {
          .mm-nav { padding: 1rem 1.2rem; }
          .nav-center { display: none; }
          .nav-right .btn-nav-ghost { display: none; }
          .nav-right .nav-user { display: none; }
          .nav-hamburger { display: flex; }
        }
      `}</style>

      {/* Mobile drawer */}
      <div className={`nav-mobile-drawer${drawerOpen ? ' open' : ''}`}>
        <button className="close-btn" onClick={close}>✕</button>

        {isLanding ? (
          <>
            <a href="#features" onClick={close}>Features</a>
            <a href="#desi" onClick={close}>Local Cuisine</a>
            <a href="#how" onClick={close}>How It Works</a>
            <a href="#pricing" onClick={close}>Pricing</a>
            <a href="#reviews" onClick={close}>Reviews</a>
          </>
        ) : (
          <>
            <Link to="/" onClick={close}>Home</Link>
            <Link to="/demo" onClick={close}>Try AI</Link>
            <Link to="/cravings" onClick={close}>Local Search</Link>
          </>
        )}

        <div className="nav-mobile-ctas">
          {!loading && (
            user ? (
              <div className="nav-mobile-user">
                <span>Hi, {user.email?.split('@')[0]} 👋</span>
                <button className="btn-nav-logout" onClick={() => { handleLogout(); close(); }}>
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-nav-ghost" onClick={close}>Log In</Link>
                <Link to="/demo" className="btn-nav-main" onClick={close}>Try Free 🚀</Link>
              </>
            )
          )}
        </div>
      </div>

      {/* Main navbar */}
      <nav className="mm-nav">
        <Link to="/" className="nav-logo">Meal<span>Mind</span></Link>

        <div className="nav-center">
          {isLanding ? (
            <>
              <a href="#features">Features</a>
              <a href="#desi">Local Cuisine</a>
              <a href="#how">How It Works</a>
              <a href="#pricing">Pricing</a>
              <a href="#reviews">Reviews</a>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <Link to="/demo">Try AI</Link>
              <Link to="/cravings">Local Search</Link>
            </>
          )}
        </div>

        <div className="nav-right">
          {!loading && (
            user ? (
              <div className="nav-user">
                <div className="nav-avatar">{user.email?.[0].toUpperCase()}</div>
                <span className="nav-username">{user.email?.split('@')[0]}</span>
                <button className="btn-nav-logout" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-nav-ghost">Log In</Link>
                <Link to="/demo" className="btn-nav-main">Try Free 🚀</Link>
              </>
            )
          )}
          <button className="nav-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>
    </>
  );
}
