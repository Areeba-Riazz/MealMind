"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../lib/firebase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setError("Firebase not configured. Please add keys to .env.local to test real auth.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '4rem 2rem', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-container animate-fade-in" style={{ maxWidth: '400px', padding: '3rem 2rem' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2.5rem' }}>Welcome Back</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
          Log in to your MealMind account
        </p>

        {error && <p style={{ color: '#ff6b6b', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto', margin: 0 }} /> Remember me
            </label>
            <Link href="#" style={{ color: 'var(--primary)', fontWeight: '500' }}>Forgot Password?</Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginBottom: '1.5rem' }}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Don&apos;t have an account? <Link href="/signup" style={{ color: 'var(--text-main)', fontWeight: '600' }}>Sign up</Link>
        </p>
      </div>
    </main>
  );
}
