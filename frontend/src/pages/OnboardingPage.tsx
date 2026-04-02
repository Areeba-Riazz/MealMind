import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { id: 1, label: 'Diet basics',      emoji: '🥗', done: true    },
  { id: 2, label: 'Budget & skill',   emoji: '💰', current: true },
  { id: 3, label: 'Cuisines & goal',  emoji: '🍽️', done: false   },
];

export default function OnboardingPage() {
  const [budget, setBudget] = useState('4,000 – 8,000');
  const [skill,  setSkill]  = useState('intermediate');
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        .ob-wrap { max-width: 640px; margin: 0 auto; animation: obfade 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes obfade { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        /* Step progress */
        .ob-steps { display:flex; gap:0.5rem; margin-bottom:2rem; }
        .ob-step { flex:1; border-radius:12px; padding:0.75rem 0.6rem; text-align:center; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); transition:all 0.2s; }
        .ob-step-emoji { font-size:1.2rem; margin-bottom:0.25rem; }
        .ob-step-label { font-size:0.72rem; font-weight:600; color:rgba(255,255,255,0.3); }
        .ob-step.done { border-color:rgba(46,194,126,0.3); background:rgba(46,194,126,0.06); }
        .ob-step.done .ob-step-label { color:#2ec27e; }
        .ob-step.current { border-color:rgba(232,82,42,0.35); background:rgba(232,82,42,0.08); }
        .ob-step.current .ob-step-label { color:var(--accent); }
        .ob-step-check { font-size:0.7rem; margin-top:0.15rem; }
        .ob-step.done .ob-step-check { color:#2ec27e; }
        .ob-step.current .ob-step-check { color:var(--accent); }

        /* Card */
        .ob-card { background:rgba(22,22,22,0.8); border:1px solid rgba(255,255,255,0.07); border-radius:22px; padding:2rem 2.2rem; backdrop-filter:blur(20px); }
        .ob-card h2 { font-family:'Syne',sans-serif; font-size:1.2rem; font-weight:800; margin:0 0 0.3rem; letter-spacing:-0.3px; }
        .ob-card .ob-sub { font-size:0.85rem; color:rgba(255,255,255,0.4); margin:0 0 1.8rem; }

        .ob-field { margin-bottom:1.2rem; }
        .ob-field label { display:block; font-size:0.75rem; font-weight:600; color:rgba(255,255,255,0.4); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.5px; }
        .ob-field input { width:100%; padding:0.85rem 1rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:13px; color:#f2ede4; font:0.92rem 'DM Sans',sans-serif; outline:none; transition:border-color 0.2s; }
        .ob-field input:focus { border-color:rgba(232,82,42,0.5); background:rgba(232,82,42,0.04); }

        .ob-skill-pills { display:flex; gap:0.5rem; flex-wrap:wrap; }
        .ob-pill { font:500 0.84rem 'DM Sans',sans-serif; cursor:pointer; padding:0.5rem 1.1rem; border-radius:100px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.45); transition:all 0.18s; }
        .ob-pill:hover { border-color:rgba(232,82,42,0.35); color:var(--text); }
        .ob-pill.on { border-color:var(--accent); background:rgba(232,82,42,0.12); color:var(--text); box-shadow:0 2px 10px rgba(232,82,42,0.15); }

        .ob-actions { display:flex; gap:0.6rem; margin-top:2rem; flex-wrap:wrap; }
        .ob-btn-ghost { font:600 0.88rem 'DM Sans',sans-serif; cursor:pointer; padding:0.65rem 1.3rem; border-radius:100px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.5); transition:all 0.18s; }
        .ob-btn-ghost:hover:not(:disabled) { border-color:rgba(255,255,255,0.2); color:#f2ede4; }
        .ob-btn-ghost:disabled { opacity:0.35; cursor:not-allowed; }
        .ob-btn-next { font:700 0.92rem 'DM Sans',sans-serif; cursor:pointer; padding:0.7rem 2rem; border-radius:100px; border:none; background:var(--accent); color:#fff; box-shadow:0 4px 18px rgba(232,82,42,0.28); transition:all 0.2s; }
        .ob-btn-next:hover { transform:translateY(-2px); box-shadow:0 8px 26px rgba(232,82,42,0.4); }
        .ob-btn-skip { font:500 0.82rem 'DM Sans',sans-serif; cursor:pointer; padding:0.65rem 1rem; border-radius:100px; border:none; background:transparent; color:rgba(255,255,255,0.3); transition:color 0.18s; margin-left:auto; }
        .ob-btn-skip:hover { color:rgba(255,255,255,0.6); }
      `}</style>

      <div className="ob-wrap">
        {/* Step indicator */}
        <div className="ob-steps" role="list">
          {STEPS.map(s => (
            <div key={s.id} className={`ob-step${s.done ? ' done' : s.current ? ' current' : ''}`} role="listitem">
              <div className="ob-step-emoji">{s.emoji}</div>
              <div className="ob-step-label">{s.label}</div>
              <div className="ob-step-check">
                {s.done ? '✓ Done' : s.current ? '● In progress' : '○'}
              </div>
            </div>
          ))}
        </div>

        <div className="ob-card">
          <h2>💰 Step 2 — Budget & Skill</h2>
          <p className="ob-sub">Help us tailor recipes to what you're capable of and comfortable spending.</p>

          <div className="ob-field">
            <label htmlFor="ob-budget">Default weekly food budget (PKR)</label>
            <input
              id="ob-budget"
              type="text"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="e.g. 4,000 – 8,000"
            />
          </div>

          <div className="ob-field">
            <label>Cooking comfort level</label>
            <div className="ob-skill-pills">
              {[
                { val: 'beginner',     label: '🥚 Beginner' },
                { val: 'intermediate', label: '🍳 Intermediate' },
                { val: 'chef',         label: '👨‍🍳 Home Chef' },
              ].map(s => (
                <button key={s.val} className={`ob-pill${skill === s.val ? ' on' : ''}`} onClick={() => setSkill(s.val)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ob-actions">
            <button className="ob-btn-ghost" disabled>← Back</button>
            <button className="ob-btn-next" onClick={() => navigate('/dashboard')}>Next →</button>
            <button className="ob-btn-skip" onClick={() => navigate('/dashboard')}>Skip for now</button>
          </div>
        </div>
      </div>
    </>
  );
}
