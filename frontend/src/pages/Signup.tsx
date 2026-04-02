import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { app } from '../lib/firebase';

const floatingFoods = ['🍛', '🥘', '🫓', '🍖', '🧆', '🥗', '🍳', '🌶️', '🫚', '🍚', '🥙', '🍜', '🥑', '🍱', '🌮', '🧅', '🫛', '🥦', '🍣', '☕', '🧁', '🍰', '🫖', '🍩'];

type LocationState = { from?: { pathname: string } };

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      setError('Firebase not configured. Please add keys to .env to test real auth.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const auth = getAuth(app!);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      const from = (location.state as LocationState | null)?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0c0c0c; --surface: #161616; --surface2: #1f1f1f;
          --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.13);
          --text: #f2ede4; --muted: #777; --muted2: #444;
          --accent: #e8522a; --accent2: #f5c842; --accent3: #2ec27e;
          --font-head: 'Syne', sans-serif; --font-body: 'DM Sans', sans-serif;
          --radius: 18px; --radius-lg: 26px;
        }
        html, body { height: 100%; overflow: hidden; }
        body {
          background: var(--bg); color: var(--text);
          font-family: var(--font-body); overflow: hidden;
          height: 100vh;
        }

        .food-float {
          position: fixed; pointer-events: none; z-index: 0;
          animation: floatUp linear infinite; opacity: 0.07;
          user-select: none;
        }
        @keyframes floatUp {
          0%   { transform: translateY(110vh) rotate(0deg); }
          100% { transform: translateY(-150px) rotate(360deg); }
        }

        .glow {
          position: fixed; border-radius: 50%;
          filter: blur(120px); pointer-events: none; z-index: 0;
        }
        .glow-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(232,82,42,0.14), transparent 70%);
          top: -200px; right: -200px;
        }
        .glow-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(245,200,66,0.08), transparent 70%);
          bottom: -150px; left: -150px;
        }

        .signup-page {
          height: 100vh; width: 100vw;
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 1;
          padding: 1.5rem;
        }

        .signup-card {
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

        /* LEFT: Form panel */
        .signup-form-panel {
          padding: 2.6rem 2.4rem;
          display: flex; flex-direction: column; justify-content: center;
          position: relative;
        }
        .signup-form-panel::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--accent2), var(--accent));
        }

        .panel-header { margin-bottom: 1.4rem; }
        .panel-header h1 {
          font-family: var(--font-head); font-size: 1.55rem; font-weight: 800;
          letter-spacing: -0.5px; margin-bottom: 0.25rem;
        }
        .panel-header p { color: var(--muted); font-size: 0.85rem; }

        .signup-error {
          background: rgba(232, 82, 42, 0.1);
          border: 1px solid rgba(232, 82, 42, 0.28);
          border-radius: 10px; padding: 0.6rem 0.9rem;
          color: #ff8a6a; font-size: 0.83rem;
          margin-bottom: 1rem; line-height: 1.5;
          animation: fadeUp 0.3s ease;
        }
        @keyframes fadeUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }

        .input-group { margin-bottom: 0.75rem; }
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

        .btn-signup {
          width: 100%; padding: 0.82rem;
          background: var(--accent); color: #fff;
          border: none; border-radius: 100px;
          font-family: var(--font-head); font-weight: 700; font-size: 0.95rem;
          cursor: pointer; letter-spacing: 0.2px;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 6px 24px rgba(232,82,42,0.35);
          margin-top: 1rem; margin-bottom: 1rem;
        }
        .btn-signup:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(232,82,42,0.45);
        }
        .btn-signup:active:not(:disabled) { transform: translateY(0); }
        .btn-signup:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-signup .spinner {
          display: inline-block; width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle; margin-right: 0.5rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .signup-footer {
          text-align: center; color: var(--muted);
          font-size: 0.84rem; padding-top: 1rem;
          border-top: 1px solid var(--border);
        }
        .signup-footer a {
          color: var(--text); font-weight: 700; text-decoration: none;
          transition: color 0.2s;
        }
        .signup-footer a:hover { color: var(--accent); }

        /* RIGHT: Brand panel */
        .signup-brand {
          padding: 3rem 2.4rem;
          background: linear-gradient(160deg, rgba(245,200,66,0.09) 0%, rgba(232,82,42,0.12) 100%);
          border-left: 1px solid var(--border2);
          display: flex; flex-direction: column; justify-content: space-between;
          position: relative; overflow: hidden;
        }
        .signup-brand::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 70% 20%, rgba(245,200,66,0.13), transparent 60%);
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
          background: linear-gradient(120deg, var(--accent2), var(--accent));
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .brand-headline p {
          color: var(--muted); font-size: 0.92rem; line-height: 1.65;
          max-width: 240px;
        }

        .brand-steps {
          display: flex; flex-direction: column; gap: 0.7rem;
        }
        .step {
          display: flex; align-items: center; gap: 0.75rem;
          font-size: 0.82rem; color: var(--muted);
        }
        .step-num {
          width: 22px; height: 22px; border-radius: 50%;
          background: rgba(232,82,42,0.15);
          border: 1px solid rgba(232,82,42,0.3);
          color: var(--accent); font-size: 0.72rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-family: var(--font-head);
        }

        @media (max-width: 640px) {
          .signup-brand { display: none; }
          .signup-card { grid-template-columns: 1fr; max-width: 420px; }
          .signup-form-panel { padding: 2rem 1.6rem; }
          html, body { overflow: auto; }
          .signup-page { height: auto; min-height: 100vh; padding: 2rem 1.2rem; }
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

      <div className="signup-page">
        <div className="signup-card">

          {/* LEFT: Form panel */}
          <div className="signup-form-panel">
            <div className="panel-header">
              <h1>Create account</h1>
              <p>Start making smarter meal decisions today</p>
            </div>

            {error && <div className="signup-error">⚠️ {error}</div>}

            <form onSubmit={handleSignup}>
              <div className="input-group">
                <label htmlFor="name">Full name</label>
                <div className="input-wrap">
                  <input
                    type="text" id="name"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

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
                    type="button" className="toggle-pass"
                    onClick={() => setShowPass(p => !p)}
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <div className="input-wrap has-toggle">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="confirmPassword"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button" className="toggle-pass"
                    onClick={() => setShowConfirm(p => !p)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-signup" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? 'Creating account…' : 'Sign Up Free →'}
              </button>
            </form>

            <div className="signup-footer">
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </div>

          {/* RIGHT: Brand panel */}
          <div className="signup-brand">
            <Link to="/" className="brand-logo">Meal<span>Mind</span></Link>

            <div className="brand-headline">
              <h2>Eat <em>smarter,</em> every day.</h2>
              <p>Join thousands of people who've taken the guesswork out of healthy eating.</p>
            </div>

            <div className="brand-steps">
              <div className="step">
                <span className="step-num">1</span>
                Create your free account
              </div>
              <div className="step">
                <span className="step-num">2</span>
                Set your dietary goals
              </div>
              <div className="step">
                <span className="step-num">3</span>
                Get AI-powered meal plans
              </div>
              <div className="step">
                <span className="step-num">4</span>
                Track nutrition effortlessly
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}