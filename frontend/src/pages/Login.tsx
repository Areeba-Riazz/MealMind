import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../lib/firebase';

const floatingFoods = ['🍛', '🥘', '🫓', '🍖', '🧆', '🥗', '🍳', '🌶️', '🫚', '🍚', '🥙', '🍜', '🥑', '🍱', '🌮', '🧅', '🫛', '🥦', '🍣', '☕', '🧁', '🍰', '🫖', '🍩'];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      setError('Firebase not configured. Please add keys to .env to test real auth.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const auth = getAuth(app!);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body { height: 100%; overflow: hidden; }
        body {
          background: var(--bg); color: var(--text);
          font-family: var(--font-body); overflow: hidden;
          height: 100vh;
        }

        /* Floating food */
        .food-float {
          position: fixed; pointer-events: none; z-index: 0;
          animation: floatUp linear infinite; opacity: 0.07;
          user-select: none;
        }
        @keyframes floatUp {
          0%   { transform: translateY(110vh) rotate(0deg); }
          100% { transform: translateY(-150px) rotate(360deg); }
        }

        /* Glows */
        .glow {
          position: fixed; border-radius: 50%;
          filter: blur(120px); pointer-events: none; z-index: 0;
        }
        .glow-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(232,82,42,0.14), transparent 70%);
          top: -200px; left: -200px;
        }
        .glow-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(245,200,66,0.08), transparent 70%);
          bottom: -150px; right: -150px;
        }

        /* Full-screen page */
        .login-page {
          height: 100vh; width: 100vw;
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 1;
          padding: 1.5rem;
        }

        /* Horizontal card */
        .login-card {
          width: 100%; max-width: 860px;
          display: grid; grid-template-columns: 1fr 1fr;
          background: rgba(22, 22, 22, 0.82);
          border: 1px solid var(--border2);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04);
          animation: cardIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
          overflow: hidden;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Left panel — brand side */
        .login-brand {
          padding: 3rem 2.4rem;
          background: linear-gradient(160deg, rgba(232,82,42,0.13) 0%, rgba(245,200,66,0.06) 100%);
          border-right: 1px solid var(--border2);
          display: flex; flex-direction: column; justify-content: space-between;
          position: relative; overflow: hidden;
        }
        .login-brand::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 30% 20%, rgba(232,82,42,0.18), transparent 60%);
          pointer-events: none;
        }
        .brand-logo {
          font-family: var(--font-head); font-weight: 800; font-size: 1.6rem;
          color: var(--text); text-decoration: none; letter-spacing: -0.5px;
          display: block;
        }
        .brand-logo span { color: var(--accent); }

        .brand-headline {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; padding: 2rem 0;
        }
        .brand-headline h2 {
          font-family: var(--font-head); font-size: 2.4rem; font-weight: 800;
          letter-spacing: -1px; line-height: 1.1; margin-bottom: 0.8rem;
        }
        .brand-headline h2 em {
          font-style: normal;
          background: linear-gradient(120deg, var(--accent), var(--accent2));
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .brand-headline p {
          color: var(--muted); font-size: 0.92rem; line-height: 1.65;
          max-width: 240px;
        }

        .brand-pills {
          display: flex; flex-direction: column; gap: 0.55rem;
        }
        .pill {
          display: flex; align-items: center; gap: 0.6rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border2);
          border-radius: 100px; padding: 0.45rem 0.85rem;
          font-size: 0.8rem; color: var(--muted);
          width: fit-content;
        }
        .pill-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--accent3); flex-shrink: 0;
        }

        /* Right panel — form side */
        .login-form-panel {
          padding: 2.6rem 2.4rem;
          display: flex; flex-direction: column; justify-content: center;
          position: relative;
        }
        /* Top accent line on right panel */
        .login-form-panel::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--accent), var(--accent2));
        }

        .panel-header { margin-bottom: 1.4rem; }
        .panel-header h1 {
          font-family: var(--font-head); font-size: 1.55rem; font-weight: 800;
          letter-spacing: -0.5px; margin-bottom: 0.25rem;
        }
        .panel-header p { color: var(--muted); font-size: 0.85rem; }

        /* Error */
        .login-error {
          background: rgba(232, 82, 42, 0.1);
          border: 1px solid rgba(232, 82, 42, 0.28);
          border-radius: 10px; padding: 0.6rem 0.9rem;
          color: #ff8a6a; font-size: 0.83rem;
          margin-bottom: 1rem; line-height: 1.5;
          animation: fadeUp 0.3s ease;
        }
        @keyframes fadeUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }

        /* Input groups */
        .input-group { margin-bottom: 0.85rem; }
        .input-group label {
          display: block; font-size: 0.78rem; font-weight: 600;
          color: var(--muted); margin-bottom: 0.38rem; letter-spacing: 0.3px;
        }
        .input-wrap { position: relative; }
        .input-wrap input {
          width: 100%; padding: 0.72rem 0.9rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border2); border-radius: 11px;
          color: var(--text); font-size: 0.9rem;
          font-family: var(--font-body);
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .input-wrap input::placeholder { color: var(--muted2); }
        .input-wrap input:focus {
          border-color: var(--accent);
          background: rgba(232,82,42,0.05);
          box-shadow: 0 0 0 3px rgba(232,82,42,0.12);
        }
        .input-wrap.has-toggle input { padding-right: 2.8rem; }
        .toggle-pass {
          position: absolute; right: 0.75rem; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--muted); font-size: 0.95rem;
          padding: 0.2rem; line-height: 1;
          transition: color 0.2s;
        }
        .toggle-pass:hover { color: var(--text); }

        /* Row: remember + forgot */
        .login-meta {
          display: flex; justify-content: space-between; align-items: center;
          margin: 0.9rem 0 1.1rem; font-size: 0.82rem;
        }
        .remember-label {
          display: flex; align-items: center; gap: 0.45rem;
          cursor: pointer; color: var(--muted); user-select: none;
        }
        .remember-label input[type="checkbox"] {
          width: 14px; height: 14px; accent-color: var(--accent); cursor: pointer;
        }
        .forgot-link {
          color: var(--accent); text-decoration: none; font-weight: 500;
          transition: opacity 0.2s;
        }
        .forgot-link:hover { opacity: 0.75; }

        /* Submit button */
        .btn-login {
          width: 100%; padding: 0.82rem;
          background: var(--accent); color: #fff;
          border: none; border-radius: 100px;
          font-family: var(--font-head); font-weight: 700; font-size: 0.95rem;
          cursor: pointer; letter-spacing: 0.2px;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 6px 24px rgba(232,82,42,0.35);
          margin-bottom: 1rem;
          position: relative; overflow: hidden;
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(232,82,42,0.45);
        }
        .btn-login:active:not(:disabled) { transform: translateY(0); }
        .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-login .spinner {
          display: inline-block; width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle; margin-right: 0.5rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .divider {
          display: flex; align-items: center; gap: 0.7rem;
          margin-bottom: 0.9rem;
        }
        .divider-line { flex: 1; height: 1px; background: var(--border); }
        .divider span { color: var(--muted2); font-size: 0.75rem; white-space: nowrap; }

        /* Google button */
        .btn-social {
          width: 100%; padding: 0.72rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border2); border-radius: 100px;
          color: var(--text); font-family: var(--font-body); font-weight: 600;
          font-size: 0.88rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.55rem;
          transition: background 0.2s, border-color 0.2s;
          margin-bottom: 1.1rem;
        }
        .btn-social:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.2); }

        /* Footer */
        .login-footer {
          text-align: center; color: var(--muted);
          font-size: 0.84rem; padding-top: 1rem;
          border-top: 1px solid var(--border);
        }
        .login-footer a {
          color: var(--text); font-weight: 700; text-decoration: none;
          transition: color 0.2s;
        }
        .login-footer a:hover { color: var(--accent); }

        /* Responsive — stack on small screens */
        @media (max-width: 640px) {
          .login-brand { display: none; }
          .login-card { grid-template-columns: 1fr; max-width: 420px; }
          .login-form-panel { padding: 2rem 1.6rem; }
          html, body { overflow: auto; }
          .login-page { height: auto; min-height: 100vh; padding: 2rem 1.2rem; }
        }
      `}</style>

      <div className="glow glow-1" />
      <div className="glow glow-2" />

      {floatingFoods.map((f, i) => (
        <span key={i} className="food-float" style={{
          left: `${(i * 4.3) % 100}%`,
          animationDuration: `${14 + (i * 3.7) % 16}s`,
          animationDelay: `${(i * 1.9) % 12}s`,
          fontSize: `${1.1 + (i % 4) * 0.45}rem`,
        }}>{f}</span>
      ))}

      <div className="login-page">
        <div className="login-card">

          {/* LEFT: Brand panel */}
          <div className="login-brand">
            <Link to="/" className="brand-logo">Meal<span>Mind</span></Link>

            <div className="brand-headline">
              <h2>Welcome <em>back.</em></h2>
              <p>Log in and let AI handle the hard part — what to eat today.</p>
            </div>

            <div className="brand-pills">
              <div className="pill"><span className="pill-dot" />Personalized meal plans</div>
              <div className="pill"><span className="pill-dot" />Smart pantry tracking</div>
              <div className="pill"><span className="pill-dot" />Nutrition at a glance</div>
            </div>
          </div>

          {/* RIGHT: Form panel */}
          <div className="login-form-panel">
            <div className="panel-header">
              <h1>Sign in</h1>
              <p>Enter your credentials to continue</p>
            </div>

            {error && <div className="login-error">⚠️ {error}</div>}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label htmlFor="email">Email address</label>
                <div className="input-wrap">
                  <input
                    type="email" id="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrap has-toggle">
                  <input
                    type={showPass ? 'text' : 'password'}
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setShowPass(p => !p)}
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="login-meta">
                <label className="remember-label">
                  <input type="checkbox" /> Remember me
                </label>
                <Link to="#" className="forgot-link">Forgot password?</Link>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? 'Logging in…' : 'Log In →'}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span>or continue with</span>
              <div className="divider-line" />
            </div>

            <button className="btn-social" type="button">
              <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
                <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
                <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.311 0-9.823-3.317-11.408-8H6.25A19.943 19.943 0 0 0 24 44z" fill="#4CAF50" />
                <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
              </svg>
              Continue with Google
            </button>

            <div className="login-footer">
              Don't have an account? <Link to="/signup">Sign up free</Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}