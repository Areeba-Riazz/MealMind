"use client";
import { useState } from 'react';

export default function Cravings() {
  const [craving, setCraving] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    
    // Mocking an AI search delay and API response
    setTimeout(() => {
      setResults([
        {
          id: 1,
          name: "Daily Deli Co.",
          item: "Smash Beef Burger",
          distance: "1.2 km away (DHA Phase 4)",
          price: "850 PKR",
          rating: "4.8 ⭐️",
          link: "https://www.foodpanda.pk/restaurant/mock/daily-deli" // Mock link
        },
        {
          id: 2,
          name: "Johnny & Jugnu",
          item: "Wehshi Zinger Burger",
          distance: "2.5 km away (Johar Town)",
          price: "700 PKR",
          rating: "4.7 ⭐️",
          link: "https://www.foodpanda.pk/restaurant/mock/johnny-jugnu" // Mock link
        },
        {
          id: 3,
          name: "Local Street Cafe",
          item: "Spicy Chicken Burger",
          distance: "0.8 km away",
          price: "550 PKR",
          rating: "4.3 ⭐️",
          link: "https://wa.me/923000000000" // Mock WhatsApp ordering link
        }
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <main style={{ padding: '4rem 2rem', alignItems: 'center' }}>
      <div className="glass-container animate-fade-in" style={{ maxWidth: '700px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <span>🛵</span> Smart Local Search
        </h1>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
          Craving something specific? We&apos;ll find the best options near you and redirect you to order instantly.
        </p>
        
        <form onSubmit={handleSearch}>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="e.g. I want a spicy zinger burger under 800 Rs nearby" 
              value={craving} 
              onChange={(e) => setCraving(e.target.value)} 
              required 
              style={{ fontSize: '1.1rem', padding: '1.2rem' }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? "Scanning local restaurants... 📍" : "Find My Craving 🍔"}
          </button>
        </form>

        {results && (
          <div style={{ marginTop: '3rem', animation: 'fadeIn 0.5s ease-in' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Top Matches Near You</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.map((res) => (
                <div key={res.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', paddingRight: '1rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--accent)', fontSize: '1.2rem', marginBottom: '0.3rem' }}>{res.item}</h4>
                    <p style={{ color: 'var(--text-main)', fontWeight: 'bold', marginBottom: '0.5rem' }}>{res.name} <span style={{ color: '#fbbf24', fontWeight: 'normal' }}>({res.rating})</span></p>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <span>📍 {res.distance}</span>
                      <span>💰 {res.price}</span>
                    </div>
                  </div>
                  <a 
                    href={res.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-primary" 
                    style={{ background: 'var(--primary)', padding: '0.8rem 1.2rem', width: 'auto', borderRadius: '10px', fontSize: '0.95rem', alignSelf: 'center' }}
                    title="This is a mock link for the MVP Demo"
                  >
                    Order Now 🚀
                  </a>
                </div>
              ))}
            </div>
            
            <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              *Note: For this MVP Demo phase, order links point to pre-selected mock restaurant pages on Foodpanda/WhatsApp.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
