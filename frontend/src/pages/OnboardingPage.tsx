import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { db } from '../lib/firebase';
import {
  DEFAULT_DIETARY,
  DEFAULT_PREFERENCES,
  loadUserProfile,
  saveUserProfileAndCompleteOnboarding,
  setOnboardingCompleted,
  type UserDietary,
  type UserPreferences,
} from '../lib/firestoreUserData';

const STEP_META = [
  { id: 1, label: 'Diet basics', emoji: '🥗' },
  { id: 2, label: 'Budget & skill', emoji: '💰' },
  { id: 3, label: 'Cuisines & goal', emoji: '🍽️' },
] as const;

const CUISINES = ['Pakistani', 'Italian', 'East Asian', 'Middle Eastern', 'Fast casual', 'Thai', 'Mexican', 'American'];
const BUDGETS = ['Under 300 PKR', '300–700 PKR', '700–1500 PKR', 'No limit'] as const;
const SKILLS = ['Beginner', 'Intermediate', 'Home chef'] as const;
const GOALS = ['Weight loss', 'Muscle gain', 'Maintenance', 'Eat well'] as const;
const SPICE = ['Mild', 'Medium', 'Hot', 'Extra Hot'] as const;
const ALLERGENS = ['Peanuts', 'Tree nuts', 'Shellfish', 'Dairy', 'Eggs', 'Wheat / Gluten', 'Soy', 'Fish'];
const DIETS = ['Halal', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'High protein', 'Low carb', 'Diabetic-friendly'];

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function normalizeAllergy(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const { setPreferences } = usePreferences();
  const navigate = useNavigate();

  /** Full-screen intro copy for 1s before the wizard appears. */
  const [introReady, setIntroReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setIntroReady(true), 1000);
    return () => window.clearTimeout(id);
  }, []);

  const [step, setStep] = useState(1);
  /** True while the first Firestore read for this visit is in flight (form stays visible). */
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [spice, setSpice] = useState(DEFAULT_PREFERENCES.spice);
  const [diets, setDiets] = useState<string[]>(DEFAULT_DIETARY.diets);
  const [allergens, setAllergens] = useState<string[]>(DEFAULT_DIETARY.allergens);
  const [budget, setBudget] = useState(DEFAULT_PREFERENCES.budget);
  const [skill, setSkill] = useState(DEFAULT_PREFERENCES.skill);
  const [cuisines, setCuisines] = useState<string[]>(DEFAULT_PREFERENCES.cuisines);
  const [goal, setGoal] = useState(DEFAULT_PREFERENCES.goal);
  const [allergyDraft, setAllergyDraft] = useState('');

  const addCustomAllergy = () => {
    const t = normalizeAllergy(allergyDraft);
    if (!t) return;
    const lower = t.toLowerCase();
    setAllergens((prev) => {
      if (prev.some((a) => a.toLowerCase() === lower)) return prev;
      return [...prev, t];
    });
    setAllergyDraft('');
  };

  useEffect(() => {
    if (!user?.uid) {
      setProfileLoading(false);
      return;
    }
    if (!db) {
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    (async () => {
      try {
        const { preferences: p, dietary: d, onboardingCompleted: done } = await loadUserProfile(user.uid);
        if (cancelled) return;
        if (done === true) {
          navigate('/dashboard', { replace: true });
          return;
        }
        setSpice(p.spice);
        setBudget(p.budget);
        setSkill(p.skill);
        setCuisines(p.cuisines.length ? p.cuisines : DEFAULT_PREFERENCES.cuisines);
        setGoal(p.goal);
        setDiets(d.diets);
        setAllergens(d.allergens);
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, navigate]);

  const buildPreferences = (): UserPreferences => ({
    cuisines,
    spice,
    budget,
    skill,
    goal,
    customPreferences: '',
  });

  const buildDietary = (): UserDietary => ({
    allergens,
    diets,
  });

  const persistAndFinish = async () => {
    setSaveError(null);
    if (!user?.uid) {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (!db) {
      setSaveError('Firebase is not configured; your choices were not saved to the cloud.');
      await setOnboardingCompleted(user.uid, true);
      const prefs = buildPreferences();
      const dietary = buildDietary();
      setPreferences({
        cuisines: prefs.cuisines,
        spice: prefs.spice,
        budget: prefs.budget,
        skill: prefs.skill,
        goal: prefs.goal,
        allergens: dietary.allergens,
        diets: dietary.diets,
        customPreferences: prefs.customPreferences ?? '',
      });
      navigate('/dashboard', { replace: true });
      return;
    }
    setSaving(true);
    try {
      const prefs = buildPreferences();
      const dietary = buildDietary();
      await saveUserProfileAndCompleteOnboarding(user.uid, prefs, dietary);
      setPreferences({
        cuisines: prefs.cuisines,
        spice: prefs.spice,
        budget: prefs.budget,
        skill: prefs.skill,
        goal: prefs.goal,
        allergens: dietary.allergens,
        diets: dietary.diets,
        customPreferences: '',
      });
      navigate('/dashboard', { replace: true });
    } catch (e) {
      console.error(e);
      setSaveError('Could not save your profile. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    if (step < 3) setStep((s) => s + 1);
    else void persistAndFinish();
  };

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  if (!introReady) {
    return (
      <>
        <style>{`
          .ob-intro-full {
            min-height: 100vh;
            background: #0c0c0c;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 1.5rem;
            box-sizing: border-box;
          }
          .ob-intro-msg {
            color: rgba(255, 255, 255, 0.55);
            font: 0.95rem 'DM Sans', sans-serif;
            margin: 0;
            letter-spacing: 0.02em;
          }
          .ob-intro-sub {
            color: rgba(255, 255, 255, 0.28);
            font: 0.8rem 'DM Sans', sans-serif;
            margin: 0;
          }
          .ob-intro-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #e8522a;
            border-radius: 50%;
            animation: ob-spin 0.7s linear infinite;
            margin-bottom: 0.35rem;
          }
          @keyframes ob-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
        <div className="ob-intro-full" role="status" aria-live="polite">
          <div className="ob-intro-spinner" aria-hidden />
          <p className="ob-intro-msg">Getting things ready…</p>
          <p className="ob-intro-sub">Setting up your MealMind profile</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        .ob-full { min-height: 100vh; background: #0c0c0c; padding: 2rem 1.25rem 3rem; box-sizing: border-box; }
        .ob-wrap { max-width: 640px; margin: 0 auto; animation: obfade 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes obfade { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

        .ob-steps { display:flex; gap:0.5rem; margin-bottom:2rem; }
        .ob-step { flex:1; border-radius:12px; padding:0.75rem 0.6rem; text-align:center; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.02); transition:all 0.2s; font: inherit; color: inherit; cursor: pointer; }
        .ob-step:hover { background:rgba(255,255,255,0.05); }
        .ob-step:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .ob-step-emoji { font-size:1.2rem; margin-bottom:0.25rem; pointer-events: none; }
        .ob-step-label { font-size:0.72rem; font-weight:600; color:rgba(255,255,255,0.3); pointer-events: none; }
        .ob-step.done { border-color:rgba(46,194,126,0.3); background:rgba(46,194,126,0.06); }
        .ob-step.done .ob-step-label { color:#2ec27e; }
        .ob-step.current { border-color:rgba(232,82,42,0.35); background:rgba(232,82,42,0.08); }
        .ob-step.current .ob-step-label { color:var(--accent); }
        .ob-step-check { font-size:0.7rem; margin-top:0.15rem; pointer-events: none; }
        .ob-step.done .ob-step-check { color:#2ec27e; }
        .ob-step.current .ob-step-check { color:var(--accent); }

        .ob-card { background:rgba(22,22,22,0.8); border:1px solid rgba(255,255,255,0.07); border-radius:22px; padding:2rem 2.2rem; backdrop-filter:blur(20px); }
        .ob-card h2 { font-family:'Syne',sans-serif; font-size:1.2rem; font-weight:800; margin:0 0 0.3rem; letter-spacing:-0.3px; }
        .ob-profile-hint { font-size:0.78rem; color:rgba(255,255,255,0.32); margin:0 0 1rem; padding:0.45rem 0.65rem; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); }
        .ob-card .ob-sub { font-size:0.85rem; color:rgba(255,255,255,0.4); margin:0 0 1.8rem; }

        .ob-section-label { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:rgba(255,255,255,0.35); margin:0 0 0.65rem; }
        .ob-section { margin-bottom:1.35rem; }
        .ob-section:last-of-type { margin-bottom:0; }

        .ob-field { margin-bottom:1.2rem; }
        .ob-field label { display:block; font-size:0.75rem; font-weight:600; color:rgba(255,255,255,0.4); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.5px; }

        .ob-chip-grid { display:flex; flex-wrap:wrap; gap:0.45rem; }
        .ob-chip { padding:0.4rem 0.8rem; border-radius:100px; font-size:0.82rem; font-weight:500; cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.45); transition:all 0.18s; font-family:'DM Sans',sans-serif; }
        .ob-chip:hover { border-color:rgba(232,82,42,0.4); color:var(--text); }
        .ob-chip.on { border-color:rgba(232,82,42,0.5); background:rgba(232,82,42,0.12); color:var(--text); }

        .ob-skill-pills { display:flex; gap:0.5rem; flex-wrap:wrap; }
        .ob-pill { font:500 0.84rem 'DM Sans',sans-serif; cursor:pointer; padding:0.5rem 1.1rem; border-radius:100px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.45); transition:all 0.18s; }
        .ob-pill:hover { border-color:rgba(232,82,42,0.35); color:var(--text); }
        .ob-pill.on { border-color:var(--accent); background:rgba(232,82,42,0.12); color:var(--text); box-shadow:0 2px 10px rgba(232,82,42,0.15); }

        .ob-actions { display:flex; gap:0.6rem; margin-top:2rem; flex-wrap:wrap; align-items:center; }
        .ob-btn-ghost { font:600 0.88rem 'DM Sans',sans-serif; cursor:pointer; padding:0.65rem 1.3rem; border-radius:100px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.5); transition:all 0.18s; }
        .ob-btn-ghost:hover:not(:disabled) { border-color:rgba(255,255,255,0.2); color:#f2ede4; }
        .ob-btn-ghost:disabled { opacity:0.35; cursor:not-allowed; }
        .ob-btn-next { font:700 0.92rem 'DM Sans',sans-serif; cursor:pointer; padding:0.7rem 2rem; border-radius:100px; border:none; background:var(--accent); color:#fff; box-shadow:0 4px 18px rgba(232,82,42,0.28); transition:all 0.2s; }
        .ob-btn-next:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 26px rgba(232,82,42,0.4); }
        .ob-btn-next:disabled { opacity:0.55; cursor:not-allowed; transform:none; }
        .ob-btn-skip { font:500 0.82rem 'DM Sans',sans-serif; cursor:pointer; padding:0.65rem 1rem; border-radius:100px; border:none; background:transparent; color:rgba(255,255,255,0.3); transition:color 0.18s; margin-left:auto; }
        .ob-btn-skip:hover:not(:disabled) { color:rgba(255,255,255,0.6); }
        .ob-btn-skip:disabled { opacity:0.4; cursor:not-allowed; }
        .ob-err { width:100%; font-size:0.82rem; color:#ff8a6a; margin-top:0.75rem; padding:0.6rem 0.85rem; border-radius:10px; background:rgba(232,82,42,0.1); border:1px solid rgba(232,82,42,0.25); }

        .ob-text-input {
          width:100%;
          padding:0.75rem 1rem;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:13px;
          color:#f2ede4;
          font:0.9rem 'DM Sans',sans-serif;
          outline:none;
          transition:border-color 0.2s, box-shadow 0.2s;
          box-sizing:border-box;
        }
        .ob-text-input::placeholder { color:rgba(255,255,255,0.28); }
        .ob-text-input:focus {
          border-color:rgba(232,82,42,0.45);
          background:rgba(232,82,42,0.05);
          box-shadow:0 0 0 3px rgba(232,82,42,0.12);
        }

        .ob-allergen-tabs { display:flex; flex-wrap:wrap; gap:0.45rem; margin-top:0.75rem; min-height:0; }
        .ob-allergen-tab {
          display:inline-flex;
          align-items:center;
          gap:0.35rem;
          padding:0.38rem 0.65rem 0.38rem 0.85rem;
          border-radius:100px;
          font:500 0.8rem 'DM Sans',sans-serif;
          border:1px solid rgba(232,82,42,0.35);
          background:rgba(232,82,42,0.1);
          color:var(--text);
          cursor:pointer;
          transition:background 0.15s, border-color 0.15s;
        }
        .ob-allergen-tab:hover { background:rgba(232,82,42,0.16); border-color:rgba(232,82,42,0.5); }
        .ob-allergen-tab .ob-allergen-x { font-size:1.05rem; line-height:1; opacity:0.65; font-weight:600; }
        .ob-allergen-tab:hover .ob-allergen-x { opacity:1; }

        .ob-save-overlay {
          position:fixed;
          inset:0;
          z-index:10000;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:1.5rem;
          background:rgba(12,12,12,0.72);
          backdrop-filter:blur(10px);
          -webkit-backdrop-filter:blur(10px);
          animation: ob-overlay-in 0.25s ease-out both;
        }
        @keyframes ob-overlay-in {
          from { opacity:0; }
          to { opacity:1; }
        }
        @keyframes ob-spin {
          to { transform: rotate(360deg); }
        }
        .ob-save-panel {
          text-align:center;
          max-width:280px;
        }
        .ob-save-spinner {
          width:44px;
          height:44px;
          margin:0 auto 1rem;
          border:3px solid rgba(255,255,255,0.12);
          border-top-color:var(--accent);
          border-radius:50%;
          animation: ob-spin 0.65s linear infinite;
        }
        .ob-save-panel > p:first-of-type {
          font:600 1rem 'Syne',sans-serif;
          color:var(--text);
          margin:0 0 0.35rem;
        }
        .ob-save-sub {
          font:0.82rem 'DM Sans',sans-serif;
          color:rgba(255,255,255,0.4);
          margin:0;
        }
      `}</style>

      <div className="ob-full">
        <div className="ob-wrap">
          <div className="ob-steps" role="tablist" aria-label="Onboarding steps">
            {STEP_META.map((s) => {
              const done = step > s.id;
              const current = step === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`ob-step${done ? ' done' : ''}${current ? ' current' : ''}`}
                  role="tab"
                  aria-selected={current}
                  aria-current={current ? 'step' : undefined}
                  onClick={() => setStep(s.id)}
                >
                  <div className="ob-step-emoji">{s.emoji}</div>
                  <div className="ob-step-label">{s.label}</div>
                  <div className="ob-step-check">
                    {done ? '✓ Done' : current ? '● In progress' : '○'}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="ob-card">
            {profileLoading && (
              <p className="ob-profile-hint" aria-live="polite">
                Syncing saved preferences…
              </p>
            )}
            {step === 1 && (
              <>
                <h2>🥗 Step 1 — Diet basics</h2>
                <p className="ob-sub">Spice tolerance and any diets or allergens we should respect.</p>

                <div className="ob-section">
                  <p className="ob-section-label">Spice level</p>
                  <div className="ob-skill-pills">
                    {SPICE.map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={`ob-pill${spice === level ? ' on' : ''}`}
                        onClick={() => setSpice((prev) => (prev === level ? '' : level))}
                      >
                        {level === 'Mild' ? '🌿' : level === 'Medium' ? '🌶️' : level === 'Hot' ? '🔥' : '💀'}{' '}
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ob-section">
                  <p className="ob-section-label">Diets</p>
                  <div className="ob-chip-grid">
                    {DIETS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`ob-chip${diets.includes(d) ? ' on' : ''}`}
                        onClick={() => setDiets((prev) => toggleArr(prev, d))}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ob-section">
                  <p className="ob-section-label">Allergens to avoid</p>
                  <div className="ob-chip-grid">
                    {ALLERGENS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        className={`ob-chip${allergens.includes(a) ? ' on' : ''}`}
                        onClick={() => setAllergens((prev) => toggleArr(prev, a))}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <div className="ob-field" style={{ marginTop: '1rem', marginBottom: 0 }}>
                    <label htmlFor="ob-allergy-custom">Add another allergy</label>
                    <input
                      id="ob-allergy-custom"
                      className="ob-text-input"
                      type="text"
                      value={allergyDraft}
                      onChange={(e) => setAllergyDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomAllergy();
                        }
                      }}
                      placeholder="Type an allergen, then press Enter"
                      autoComplete="off"
                    />
                  </div>
                  {allergens.length > 0 && (
                    <div className="ob-allergen-tabs" role="list" aria-label="Selected allergens">
                      {allergens.map((a) => (
                        <button
                          key={a}
                          type="button"
                          className="ob-allergen-tab"
                          role="listitem"
                          aria-label={`Remove ${a}`}
                          onClick={() => setAllergens((prev) => prev.filter((x) => x !== a))}
                        >
                          {a}
                          <span className="ob-allergen-x" aria-hidden>
                            ×
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2>💰 Step 2 — Budget &amp; skill</h2>
                <p className="ob-sub">We&apos;ll match recipes to what you&apos;re comfortable spending and cooking.</p>

                <div className="ob-section">
                  <p className="ob-section-label">Default budget (PKR)</p>
                  <div className="ob-skill-pills">
                    {BUDGETS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        className={`ob-pill${budget === b ? ' on' : ''}`}
                        onClick={() => setBudget((prev) => (prev === b ? '' : b))}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ob-section">
                  <p className="ob-section-label">Cooking comfort</p>
                  <div className="ob-skill-pills">
                    {SKILLS.map((sk) => (
                      <button
                        key={sk}
                        type="button"
                        className={`ob-pill${skill === sk ? ' on' : ''}`}
                        onClick={() => setSkill((prev) => (prev === sk ? '' : sk))}
                      >
                        {sk === 'Beginner' ? '🥚 ' : sk === 'Intermediate' ? '🍳 ' : '👨‍🍳 '}
                        {sk}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2>🍽️ Step 3 — Cuisines &amp; goal</h2>
                <p className="ob-sub">Favourite flavours and what you&apos;re aiming for.</p>

                <div className="ob-section">
                  <p className="ob-section-label">Favourite cuisines</p>
                  <div className="ob-chip-grid">
                    {CUISINES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`ob-chip${cuisines.includes(c) ? ' on' : ''}`}
                        onClick={() => setCuisines((prev) => toggleArr(prev, c))}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ob-section">
                  <p className="ob-section-label">Health goal</p>
                  <div className="ob-skill-pills">
                    {GOALS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`ob-pill${goal === g ? ' on' : ''}`}
                        onClick={() => setGoal((prev) => (prev === g ? '' : g))}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {saveError && <p className="ob-err">{saveError}</p>}

            <div className="ob-actions">
              <button type="button" className="ob-btn-ghost" onClick={goBack} disabled={step <= 1}>
                ← Back
              </button>
              <button type="button" className="ob-btn-next" onClick={() => void goNext()} disabled={saving}>
                {step === 3 ? 'Finish' : 'Next →'}
              </button>
              <button type="button" className="ob-btn-skip" onClick={() => void persistAndFinish()} disabled={saving}>
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>

      {saving && (
        <div className="ob-save-overlay" role="status" aria-live="polite" aria-busy="true">
          <div className="ob-save-panel">
            <div className="ob-save-spinner" aria-hidden />
            <p>Saving your profile…</p>
            <p className="ob-save-sub">This usually takes just a moment.</p>
          </div>
        </div>
      )}
    </>
  );
}
