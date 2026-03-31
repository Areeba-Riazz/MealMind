"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { app } from '../../lib/firebase';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setError("Firebase not configured. Please add keys to .env.local to test real auth.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Optional: Update name
      await updateProfile(userCredential.user, { displayName: name });
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
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2.5rem' }}>Create Account</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
          Start making smarter meal decisions
        </p>

        {error && <p style={{ color: '#ff6b6b', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email address</label>
            <input type="email" id="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
            {loading ? "Creating Account..." : "Sign Up Free"}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--text-main)', fontWeight: '600' }}>Log in</Link>
        </p>
      </div>
    </main>
  );
}
