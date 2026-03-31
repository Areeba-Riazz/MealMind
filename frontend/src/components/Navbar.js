"use client";
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../lib/firebase';

export default function Navbar() {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      if (app) {
        const auth = getAuth(app);
        await signOut(auth);
      }
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  return (
    <nav className="navbar">
      <Link href="/" className="nav-logo">
        <span style={{fontSize: '2rem'}}>🍊</span> MealMind
      </Link>
      <div className="nav-links">
        <Link href="/#features" className="nav-link">Features</Link>
        <Link href="/dashboard" className="nav-link">Try AI</Link>
        <Link href="/cravings" className="nav-link">Local Search</Link>
        
        {loading ? null : user ? (
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
             <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem'}}>Hi, {user.email?.split('@')[0]}</span>
             <button onClick={handleLogout} className="btn-ghost" style={{border: 'none', padding: '0.6rem'}}>Logout</button>
          </div>
        ) : (
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <Link href="/login" className="btn-ghost" style={{border: 'none'}}>Log in</Link>
            <Link href="/signup" className="btn-primary" style={{padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.95rem', width: 'auto'}}>Sign up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
