import Link from 'next/link';

export default function LandingPage() {
  return (
    <main style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: '4rem 2rem', textAlign: 'center' }}>
      <div className="animate-fade-in" style={{ maxWidth: '800px', zIndex: 10 }}>
        
        <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(255, 140, 0, 0.1)', border: '1px solid rgba(255, 140, 0, 0.3)', borderRadius: '30px', color: 'var(--accent)', fontWeight: '600', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          ✨ The Smartest Way to Decide What to Eat
        </div>
        
        <h1 style={{ fontSize: '4rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem' }}>
          Stop stressing about <br />
          <span style={{ background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            your next meal
          </span>
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px', marginInline: 'auto', lineHeight: '1.6' }}>
          MealMind uses AI to plan your perfect meal based on exactly what you have in the fridge, your budget, and your fitness goals in seconds.
        </p>
        
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn-primary" style={{ minWidth: '200px' }}>
            Try AI Chef Free 🚀
          </Link>
          <Link href="/login" className="btn-ghost" style={{ minWidth: '200px', padding: '1.2rem 2rem' }}>
            Log Into Account
          </Link>
        </div>

      </div>

      <div id="features" className="animate-fade-in" style={{ marginTop: '8rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
        
        <div className="glass-card" style={{ maxWidth: '300px', textAlign: 'left' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧊</div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.8rem', color: 'white' }}>Zero Waste</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>Type what&apos;s dying in your fridge, and we&apos;ll engineer a gourmet meal so you never waste groceries again.</p>
        </div>
        
        <div className="glass-card" style={{ maxWidth: '300px', textAlign: 'left' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💸</div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.8rem', color: 'white' }}>Student Budgets</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>Broke? Set a strict PKR budget limit and we&apos;ll make sure the recipe is dirt-cheap but still tastes incredible.</p>
        </div>
        
        <div className="glass-card" style={{ maxWidth: '300px', textAlign: 'left' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.8rem', color: 'white' }}>Decision Magic</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>Stop scrolling delivery apps for an hour. Get a high-protein, perfectly portioned meal idea tailored to your exact mood.</p>
        </div>

      </div>
    </main>
  );
}
