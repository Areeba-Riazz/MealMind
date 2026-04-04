import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  DEFAULT_DIETARY,
  DEFAULT_PREFERENCES,
  loadUserProfile,
  saveUserDietary,
  saveUserPreferences,
  type UserDietary,
  type UserPreferences,
} from '../lib/firestoreUserData';

/* ── Data ── */
const CUISINES = ['Pakistani', 'Italian', 'East Asian', 'Middle Eastern', 'Fast casual', 'Thai', 'Mexican', 'American'];
const BUDGETS = ['Under 300 PKR', '300–700 PKR', '700–1500 PKR', 'No limit'] as const;
const SKILLS = ['Beginner', 'Intermediate', 'Home chef'] as const;
const GOALS = ['Weight loss', 'Muscle gain', 'Maintenance', 'Eat well'] as const;
const SPICE = ['Mild', 'Medium', 'Hot', 'Extra Hot'] as const;

const ALLERGENS = ['Peanuts', 'Tree nuts', 'Shellfish', 'Dairy', 'Eggs', 'Wheat / Gluten', 'Soy', 'Fish'];
const DIETS = ['Halal', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'High protein', 'Low carb', 'Diabetic-friendly'];

type Tab = 'profile' | 'preferences' | 'dietary';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profileLoading, setProfileLoading] = useState(true);
  const [prefSaving, setPrefSaving] = useState(false);
  const [dietSaving, setDietSaving] = useState(false);
  const [prefMessage, setPrefMessage] = useState<string | null>(null);
  const [dietMessage, setDietMessage] = useState<string | null>(null);

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(DEFAULT_PREFERENCES.cuisines);
  const [selectedBudget, setSelectedBudget] = useState<string>(DEFAULT_PREFERENCES.budget);
  const [selectedSkill, setSelectedSkill] = useState<string>(DEFAULT_PREFERENCES.skill);
  const [selectedGoal, setSelectedGoal] = useState<string>(DEFAULT_PREFERENCES.goal);
  const [selectedSpice, setSelectedSpice] = useState<string>(DEFAULT_PREFERENCES.spice);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(DEFAULT_DIETARY.allergens);
  const [selectedDiets, setSelectedDiets] = useState<string[]>(DEFAULT_DIETARY.diets);

  useEffect(() => {
    if (!user?.uid) {
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { preferences, dietary } = await loadUserProfile(user.uid);
        if (cancelled) return;
        setSelectedCuisines(preferences.cuisines);
        setSelectedSpice(preferences.spice);
        setSelectedBudget(preferences.budget);
        setSelectedSkill(preferences.skill);
        setSelectedGoal(preferences.goal);
        setSelectedAllergens(dietary.allergens);
        setSelectedDiets(dietary.diets);
      } catch (e) {
        console.error('[MealMind] loadUserProfile:', e);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const buildPreferences = (): UserPreferences => ({
    cuisines: selectedCuisines,
    spice: selectedSpice,
    budget: selectedBudget,
    skill: selectedSkill,
    goal: selectedGoal,
  });

  const buildDietary = (): UserDietary => ({
    allergens: selectedAllergens,
    diets: selectedDiets,
  });

  const handleSavePreferences = async () => {
    if (!user?.uid || !db) {
      setPrefMessage('Cloud sync requires Firebase configuration.');
      return;
    }
    setPrefSaving(true);
    setPrefMessage(null);
    try {
      await saveUserPreferences(user.uid, buildPreferences());
      setPrefMessage('Saved to your account.');
    } catch (e) {
      console.error(e);
      setPrefMessage('Could not save. Try again.');
    } finally {
      setPrefSaving(false);
    }
  };

  const handleSaveDietary = async () => {
    if (!user?.uid || !db) {
      setDietMessage('Cloud sync requires Firebase configuration.');
      return;
    }
    setDietSaving(true);
    setDietMessage(null);
    try {
      await saveUserDietary(user.uid, buildDietary());
      setDietMessage('Saved to your account.');
    } catch (e) {
      console.error(e);
      setDietMessage('Could not save. Try again.');
    } finally {
      setDietSaving(false);
    }
  };

  const toggleArr = (arr: string[], val: string, setArr: (a: string[]) => void) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'profile', label: 'Profile', emoji: '👤' },
    { id: 'preferences', label: 'Preferences', emoji: '⚙️' },
    { id: 'dietary', label: 'Diet & Allergies', emoji: '🥗' },
  ];

  const initials = (user?.displayName?.split(' ').map(w => w[0]).join('') ?? user?.email?.[0] ?? '?').toUpperCase();

  return (
    <>
      <style>{`
        .prof-wrap { max-width: 860px; margin: 0 auto; padding: 0 0 3rem; animation: profFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes profFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Header ── */
        .prof-header { display: flex; align-items: center; gap: 1.4rem; margin-bottom: 2.2rem; padding: 2rem 2rem 1.8rem; background: rgba(22,22,22,0.7); border: 1px solid rgba(255,255,255,0.07); border-radius: 22px; backdrop-filter: blur(20px); }
        .prof-avatar { width: 68px; height: 68px; border-radius: 50%; background: linear-gradient(135deg, rgba(232,82,42,0.3), rgba(245,200,66,0.2)); border: 2px solid rgba(232,82,42,0.4); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: var(--accent); flex-shrink: 0; }
        .prof-header-text h1 { font-family: 'Syne', sans-serif; font-size: 1.55rem; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 0.2rem; }
        .prof-header-text p { font-size: 0.88rem; color: var(--muted); margin: 0; }
        .prof-header-badge { margin-left: auto; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.9rem; background: rgba(46,194,126,0.1); border: 1px solid rgba(46,194,126,0.3); border-radius: 100px; font-size: 0.75rem; font-weight: 700; color: #2ec27e; letter-spacing: 0.5px; text-transform: uppercase; flex-shrink: 0; }

        /* ── Tabs ── */
        .prof-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.8rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 0.35rem; }
        .prof-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.45rem; padding: 0.7rem 1rem; border-radius: 10px; border: none; background: transparent; color: var(--muted); font: 600 0.88rem/1 'DM Sans', sans-serif; cursor: pointer; transition: all 0.22s; }
        .prof-tab:hover { color: var(--text); background: rgba(255,255,255,0.04); }
        .prof-tab.active { background: rgba(232,82,42,0.14); color: var(--text); border: 1px solid rgba(232,82,42,0.32); box-shadow: 0 2px 12px rgba(232,82,42,0.12); }
        .prof-tab .tab-emoji { font-size: 1rem; }

        /* ── Tab panel ── */
        .prof-panel { background: rgba(22,22,22,0.7); border: 1px solid rgba(255,255,255,0.07); border-radius: 22px; padding: 2rem 2rem; backdrop-filter: blur(20px); animation: profFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }

        /* ── Section headings ── */
        .prof-section-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); margin: 0 0 0.8rem; }
        .prof-section { margin-bottom: 1.8rem; }
        .prof-section:last-child { margin-bottom: 0; }
        .prof-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 1.6rem 0; }

        /* ── Info rows ── */
        .prof-info-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
        .prof-info-row { display: flex; align-items: center; gap: 1rem; padding: 0.95rem 1.15rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .prof-info-row:last-child { border-bottom: none; }
        .prof-info-key { font-size: 0.8rem; color: var(--muted); min-width: 100px; flex-shrink: 0; font-weight: 500; }
        .prof-info-val { font-size: 0.9rem; font-weight: 600; }
        .prof-info-val.muted { color: var(--muted); font-weight: 400; }

        /* ── Chips ── */
        .prof-chip-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .prof-chip { padding: 0.4rem 0.85rem; border-radius: 100px; font-size: 0.83rem; font-weight: 500; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: var(--muted); transition: all 0.18s; user-select: none; }
        .prof-chip:hover { border-color: rgba(232,82,42,0.4); color: var(--text); }
        .prof-chip.on { border-color: rgba(232,82,42,0.5); background: rgba(232,82,42,0.12); color: var(--text); }

        /* ── Pill selects ── */
        .prof-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .prof-pill { padding: 0.45rem 1rem; border-radius: 100px; font-size: 0.84rem; font-weight: 500; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: var(--muted); transition: all 0.18s; font-family: 'DM Sans', sans-serif; }
        .prof-pill:hover { border-color: rgba(232,82,42,0.4); color: var(--text); }
        .prof-pill.on { border-color: var(--accent); background: rgba(232,82,42,0.12); color: var(--text); box-shadow: 0 2px 10px rgba(232,82,42,0.15); }

        /* ── Action buttons ── */
        .prof-btn-row { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .prof-btn-ghost { font: 500 0.84rem 'DM Sans', sans-serif; cursor: pointer; padding: 0.5rem 1.05rem; border-radius: 100px; border: 1px solid rgba(255,255,255,0.13); background: transparent; color: var(--text); transition: all 0.18s; }
        .prof-btn-ghost:hover:not(:disabled) { border-color: rgba(232,82,42,0.45); background: rgba(232,82,42,0.06); }
        .prof-btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }
        .prof-btn-accent { font: 700 0.88rem 'DM Sans', sans-serif; cursor: pointer; padding: 0.6rem 1.4rem; border-radius: 100px; border: none; background: var(--accent); color: #fff; box-shadow: 0 4px 18px rgba(232,82,42,0.3); transition: all 0.2s; }
        .prof-btn-accent:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(232,82,42,0.4); }
        .prof-btn-danger { font: 500 0.84rem 'DM Sans', sans-serif; cursor: pointer; padding: 0.5rem 1.05rem; border-radius: 100px; border: 1px solid rgba(255,80,80,0.35); background: rgba(255,80,80,0.07); color: #ff8a8a; transition: all 0.18s; }
        .prof-btn-danger:hover:not(:disabled) { background: rgba(255,80,80,0.13); }
        .prof-btn-danger:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Disclaimer ── */
        .prof-disclaimer { font-size: 0.78rem; color: var(--muted2); line-height: 1.55; padding: 0.8rem 1rem; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); margin-top: 1.2rem; }

        /* ── Spice indicator ── */
        .prof-spice-emoji { font-size: 1rem; }

        /* ── Save row ── */
        .prof-save-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.8rem; padding-top: 1.4rem; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 1.6rem; }
        .prof-save-hint { font-size: 0.8rem; color: var(--muted2); }

        @media (max-width: 600px) {
          .prof-header { flex-direction: column; text-align: center; }
          .prof-header-badge { margin: 0 auto; }
          .prof-tab { font-size: 0.78rem; padding: 0.6rem 0.5rem; }
          .prof-panel { padding: 1.4rem 1.2rem; }
        }
      `}</style>

      <div className="prof-wrap">
        {/* Header card */}
        <div className="prof-header">
          <div className="prof-avatar">{initials}</div>
          <div className="prof-header-text">
            <h1>{user?.displayName ?? 'Your Name'}</h1>
            <p>{user?.email ?? 'your@email.com'}</p>
          </div>
          <div className="prof-header-badge">✓ Active</div>
        </div>

        {/* Tabs */}
        <nav className="prof-tabs" role="tablist">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`prof-tab${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="tab-emoji">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* ── Tab: Profile ── */}
        {activeTab === 'profile' && (
          <div className="prof-panel" role="tabpanel">
            <div className="prof-section">
              <p className="prof-section-label">Account details</p>
              <div className="prof-info-card">
                <div className="prof-info-row">
                  <span className="prof-info-key">Display name</span>
                  <span className="prof-info-val">{user?.displayName ?? <span className="muted">Not set</span>}</span>
                </div>
                <div className="prof-info-row">
                  <span className="prof-info-key">Email</span>
                  <span className="prof-info-val">{user?.email ?? '—'}</span>
                </div>
                <div className="prof-info-row">
                  <span className="prof-info-key">Member since</span>
                  <span className="prof-info-val muted">Jan 2025 (demo)</span>
                </div>
                <div className="prof-info-row">
                  <span className="prof-info-key">Plan</span>
                  <span className="prof-info-val" style={{ color: 'var(--accent2)' }}>Free tier</span>
                </div>
              </div>
            </div>

            <div className="prof-section">
              <p className="prof-section-label">Profile completion</p>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1rem 1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 600 }}>62% complete</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Set preferences to reach 100%</span>
                </div>
                <div style={{ height: 8, borderRadius: 100, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '62%', borderRadius: 100, background: 'linear-gradient(90deg, var(--accent), var(--accent2))' }} />
                </div>
              </div>
            </div>

            <div className="prof-section">
              <p className="prof-section-label">Security</p>
              <div className="prof-btn-row">
                <button className="prof-btn-ghost" disabled>Change password</button>
                <button className="prof-btn-ghost" disabled>Connect Google</button>
              </div>
            </div>

            <div className="prof-divider" />

            <div className="prof-section">
              <p className="prof-section-label">Danger zone</p>
              <button className="prof-btn-danger" disabled>Delete account (coming soon)</button>
            </div>
          </div>
        )}

        {/* ── Tab: Preferences ── */}
        {activeTab === 'preferences' && (
          <div className="prof-panel" role="tabpanel">
            {profileLoading && (
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>Loading your preferences…</p>
            )}
            <div className="prof-section">
              <p className="prof-section-label">Favourite cuisines</p>
              <div className="prof-chip-grid">
                {CUISINES.map(c => (
                  <button
                    key={c}
                    className={`prof-chip${selectedCuisines.includes(c) ? ' on' : ''}`}
                    onClick={() => toggleArr(selectedCuisines, c, setSelectedCuisines)}
                  >{c}</button>
                ))}
              </div>
            </div>

            <div className="prof-section">
              <p className="prof-section-label">Spice level</p>
              <div className="prof-pills">
                {SPICE.map(level => (
                  <button
                    key={level}
                    className={`prof-pill${selectedSpice === level ? ' on' : ''}`}
                    onClick={() => setSelectedSpice(level)}
                  >
                    {level === 'Mild' ? '🌿' : level === 'Medium' ? '🌶️' : level === 'Hot' ? '🔥' : '💀'} {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="prof-section">
              <p className="prof-section-label">Default budget (PKR)</p>
              <div className="prof-pills">
                {BUDGETS.map(b => (
                  <button
                    key={b}
                    className={`prof-pill${selectedBudget === b ? ' on' : ''}`}
                    onClick={() => setSelectedBudget(b)}
                  >{b}</button>
                ))}
              </div>
            </div>

            <div className="prof-section">
              <p className="prof-section-label">Cooking skill</p>
              <div className="prof-pills">
                {SKILLS.map(s => (
                  <button
                    key={s}
                    className={`prof-pill${selectedSkill === s ? ' on' : ''}`}
                    onClick={() => setSelectedSkill(s)}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div className="prof-section">
              <p className="prof-section-label">Health goal</p>
              <div className="prof-pills">
                {GOALS.map(g => (
                  <button
                    key={g}
                    className={`prof-pill${selectedGoal === g ? ' on' : ''}`}
                    onClick={() => setSelectedGoal(g)}
                  >{g}</button>
                ))}
              </div>
            </div>

            <div className="prof-save-row">
              <span className="prof-save-hint">
                {prefMessage ?? 'Stored in Firestore under your account.'}
                {!db && ' Configure Firebase for cloud sync.'}
              </span>
              <button
                className="prof-btn-accent"
                disabled={prefSaving || profileLoading || !db}
                onClick={() => void handleSavePreferences()}
              >
                {prefSaving ? 'Saving…' : 'Save preferences'}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Dietary & Allergies ── */}
        {activeTab === 'dietary' && (
          <div className="prof-panel" role="tabpanel">
            {profileLoading && (
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>Loading your restrictions…</p>
            )}
            <div className="prof-section">
              <p className="prof-section-label">Allergies & intolerances</p>
              <div className="prof-chip-grid">
                {ALLERGENS.map(a => (
                  <button
                    key={a}
                    className={`prof-chip${selectedAllergens.includes(a) ? ' on' : ''}`}
                    onClick={() => toggleArr(selectedAllergens, a, setSelectedAllergens)}
                  >{a}</button>
                ))}
              </div>
            </div>

            <div className="prof-section">
              <p className="prof-section-label">Dietary restrictions</p>
              <div className="prof-chip-grid">
                {DIETS.map(d => (
                  <button
                    key={d}
                    className={`prof-chip${selectedDiets.includes(d) ? ' on' : ''}`}
                    onClick={() => toggleArr(selectedDiets, d, setSelectedDiets)}
                  >{d}</button>
                ))}
              </div>
            </div>

            <div className="prof-disclaimer">
              🛡️ MealMind uses your selections to filter all AI suggestions and recipes. Always verify ingredient labels if you have a severe allergy — this is not medical advice.
            </div>

            <div className="prof-save-row">
              <span className="prof-save-hint">
                {dietMessage ?? 'Hard constraints — saved to your account.'}
                {!db && ' Configure Firebase for cloud sync.'}
              </span>
              <button
                className="prof-btn-accent"
                disabled={dietSaving || profileLoading || !db}
                onClick={() => void handleSaveDietary()}
              >
                {dietSaving ? 'Saving…' : 'Save restrictions'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
