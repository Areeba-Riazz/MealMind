import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { logEvent } from '../lib/analytics';

export default function NpsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // Debug logging
    console.log('NpsModal mounted. Check storage or add ?nps=true to URL to force show.');

    // FORCE BYPASS for debugging
    if (window.location.search.includes('nps=true')) {
      console.log('NPS Bypass: Force opening modal');
      setIsOpen(true);
      return;
    }

    // Only show once
    if (localStorage.getItem('mealmind_nps_submitted')) {
      return;
    }
    const timer = setTimeout(() => {
      if (!hasDismissed) {
        console.log('NpsModal: Triggering after 30 seconds');
        setIsOpen(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [hasDismissed]);

  const handleSubmit = async () => {
    if (score === null) return;
    setSubmitted(true);
    localStorage.setItem('mealmind_nps_submitted', 'true');
    await logEvent({
      userId: user?.uid ?? 'anonymous',
      type: 'nps_submit',
      metadata: { score, feedback, timestamp: new Date().toISOString() }
    });
    setTimeout(() => setIsOpen(false), 2500);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setHasDismissed(true);
  };

  if (!isOpen || hasDismissed) return null;

  return (
    <div className="nps-overlay">
      <div className="nps-modal">
        {!submitted ? (
          <>
            <button className="nps-close" onClick={handleDismiss}>✕</button>
            <h3 className="nps-title">How likely are you to recommend MealMind to a friend?</h3>
            <div className="nps-scores">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                <button
                  key={s}
                  className={`nps-score-btn ${score === s ? 'selected' : ''}`}
                  onClick={() => setScore(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="nps-labels">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>

            <textarea
              className="nps-feedback"
              placeholder="What could we improve? (Optional)"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={2}
            />

            <button
              className="nps-submit"
              disabled={score === null}
              onClick={handleSubmit}
            >
              Submit Feedback
            </button>
          </>
        ) : (
          <div className="nps-thanks">
            <div className="nps-icon">🎉</div>
            <h3 className="nps-title">Thank you!</h3>
            <p className="nps-sub">Your feedback helps us make MealMind better.</p>
          </div>
        )}
      </div>

      <style>{`
        .nps-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: var(--glass-overlay); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1rem;
        }
        .nps-modal {
          background: var(--dash-card-bg); border: 1px solid var(--border2);
          border-radius: 20px; padding: 2rem; width: 100%; max-width: 500px;
          position: relative; animation: npsFadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes npsFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .nps-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: var(--muted2); font-size: 1.2rem; cursor: pointer; }
        .nps-close:hover { color: var(--text); }
        .nps-title { font-family: 'Syne', sans-serif; font-size: 1.15rem; font-weight: 700; margin: 0 0 1.2rem; color: var(--text); text-align: center; }
        .nps-scores { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .nps-score-btn { 
          width: 32px; height: 32px; border-radius: 6px; 
          border: 1px solid var(--border2); background: var(--input-bg); 
          color: var(--text); cursor: pointer; font-weight: 600; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s; display: flex; align-items: center; justify-content: center;
        }
        .nps-score-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(232,82,42,0.1); }
        .nps-score-btn.selected { background: var(--accent); color: #fff; border-color: var(--accent); }
        .nps-labels { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--muted2); margin-bottom: 1.5rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
        .nps-feedback { 
          width: 100%; background: var(--input-bg); border: 1px solid var(--border2); 
          border-radius: 12px; padding: 0.8rem; color: var(--text); font-family: 'DM Sans', sans-serif; outline: none; margin-bottom: 1.2rem; resize: none;
        }
        .nps-feedback::placeholder { color: var(--muted2); }
        .nps-feedback:focus { border-color: var(--accent); }
        .nps-submit { width: 100%; background: var(--accent); color: #fff; border: none; border-radius: 100px; padding: 0.85rem; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(232,82,42,0.3); }
        .nps-submit:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
        .nps-thanks { text-align: center; padding: 1rem 0; }
        .nps-icon { font-size: 2.5rem; margin-bottom: 1rem; }
        .nps-sub { color: var(--muted); font-size: 0.9rem; margin: 0; }
      `}</style>
    </div>
  );
}
