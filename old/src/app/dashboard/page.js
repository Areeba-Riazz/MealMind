"use client";

import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  "Consulting the AI Chef... 👨‍🍳",
  "Chopping virtual veggies... 🥕",
  "Checking budget constraints... 💸",
  "Working out protein macros... 💪",
  "Plating your meal... 🍽️",
];

export default function Dashboard() {
  const [ingredients, setIngredients] = useState('');
  const [budget, setBudget] = useState('');
  const [time, setTime] = useState('');
  const [goal, setGoal] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
    } else {
      setLoadingMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setRecommendation(null);
    setError(null);
    
    try {
      const res = await fetch('http://localhost:5000/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, budget, time, goal })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch recommendation');
      }
      
      if (!data.recipeName || !data.instructions) {
        throw new Error("The AI returned an invalid response format.");
      }
      
      setRecommendation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = () => {
    setIngredients("Chicken breast, 1 cup of rice, frozen broccoli, yogurt");
    setBudget("700 PKR");
    setTime("20 minutes");
    setGoal("High protein post-workout");
  };

  const fillEmptyFridge = () => {
    setIngredients("Just 1 egg, a tomato, leftover roti");
    setBudget("100 PKR");
    setTime("5 minutes");
    setGoal("Need a miracle, extremely broke student");
  };

  return (
    <main style={{ padding: '4rem 2rem', alignItems: 'center' }}>
      <div className="glass-container animate-fade-in" style={{ maxWidth: '700px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>AI Chef Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
          Tell us your constraints, and we&apos;ll generate the perfect recipe.
        </p>
        
        {!recommendation && !error ? (
          <form onSubmit={handleSubmit}>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '20px'}}>
              <button type="button" onClick={fillDemo} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', textDecoration: 'underline' }}>
                ✨ Fill PKR Demo
              </button>
              <button type="button" onClick={fillEmptyFridge} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', textDecoration: 'underline' }}>
                🧊 Desi Empty Fridge Demo
              </button>
            </div>
            
            <div className="input-group">
              <label htmlFor="ingredients">What ingredients do you have? <span style={{color: 'var(--primary)'}}>*</span></label>
              <textarea id="ingredients" rows="3" placeholder="e.g. Chicken, rice, tomatoes, ginger, garlic..." value={ingredients} onChange={(e) => setIngredients(e.target.value)} required></textarea>
            </div>

            <div className="input-group">
              <label htmlFor="budget">Budget constraint (Optional)</label>
              <input type="text" id="budget" placeholder="e.g. Under 500 PKR, Student Budget" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>

            <div className="input-group">
              <label htmlFor="time">Max Cooking Time (Optional)</label>
              <input type="text" id="time" placeholder="e.g. 15 mins, Unconstrained" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>

            <div className="input-group">
              <label htmlFor="goal">Dietary Goal or Mood (Optional)</label>
              <input type="text" id="goal" placeholder="e.g. Desi craving, Healthy, Comfort food" value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: '1rem' }}>
              {isLoading ? LOADING_MESSAGES[loadingMsgIdx] : 'Generate My Perfect Meal 🍽️'}
            </button>
          </form>
        ) : (
          <div className="glass-card animate-fade-in" style={{ padding: '0', background: 'transparent', border: 'none' }}>
            {error ? (
              <div style={{textAlign: 'center', padding: '2rem'}}>
                <h2 style={{color: '#ff6b6b', marginBottom: '1rem', fontSize: '2.5rem'}}>⚠️ We Hit a Snag</h2>
                <p style={{color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.2rem'}}>{error}</p>
                <button className="btn-primary" onClick={() => setError(null)}>Try Again</button>
              </div>
            ) : recommendation && (
              <div>
                {/* Fallback Banner */}
                {recommendation.isFallback && (
                  <div style={{ background: 'rgba(255, 208, 0, 0.1)', border: '1px solid rgba(255, 208, 0, 0.4)', borderRadius: '16px', padding: '1.2rem', marginBottom: '2rem', display: 'flex', gap: '1rem', color: 'var(--text-main)' }}>
                    <span style={{fontSize: '1.8rem'}}>💡</span>
                    <div>
                      <strong style={{display: 'block', color: 'var(--accent)', marginBottom: '0.4rem', fontSize: '1.1rem'}}>Creative Pivot Needed!</strong>
                      <span style={{fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-muted)'}}>We couldn&apos;t perfectly match your strict constraints, but we engineered a solid student-friendly alternative.</span>
                    </div>
                  </div>
                )}
                
                <h2 style={{ fontSize: '2.2rem', marginBottom: '1.5rem', color: 'white', lineHeight: '1.2' }}>{recommendation.recipeName}</h2>
                
                
                {/* Instructions */}
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1.2rem', color: 'white' }}>📋 Step-by-Step Instructions</h3>
                <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: 'var(--text-muted)', marginBottom: '3rem' }}>
                  {recommendation.instructions?.map((step, idx) => (
                    <li key={idx} style={{ marginBottom: '1rem', paddingLeft: '0.5rem' }}>
                      <span style={{ color: 'var(--text-main)' }}>{step}</span>
                    </li>
                  ))}
                </ol>
                
                <button className="btn-primary" onClick={() => { setRecommendation(null); setError(null); }}>Plan Another Meal</button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
