import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { auth, db } from '../lib/firebase';
import { updateProfile, updatePassword, deleteUser } from 'firebase/auth';
import {
  DEFAULT_DIETARY,
  DEFAULT_PREFERENCES,
  loadUserProfile,
  saveUserDietary,
  saveUserPreferences,
  deleteUserDoc,
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

type Tab = 'profile' | 'preferences' | 'dietary' | 'billing';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { setPreferences } = usePreferences();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profileLoading, setProfileLoading] = useState(true);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.displayName ?? '');
  const [nameUpdating, setNameUpdating] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [prefSaving, setPrefSaving] = useState(false);
  const [dietSaving, setDietSaving] = useState(false);
  const [prefMessage, setPrefMessage] = useState<string | null>(null);
  const [dietMessage, setDietMessage] = useState<string | null>(null);

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(DEFAULT_PREFERENCES.cuisines);
  const [selectedBudget, setSelectedBudget] = useState<string>(DEFAULT_PREFERENCES.budget);
  const [selectedSkill, setSelectedSkill] = useState<string>(DEFAULT_PREFERENCES.skill);
  const [selectedGoal, setSelectedGoal] = useState<string>(DEFAULT_PREFERENCES.goal);
  const [selectedSpice, setSelectedSpice] = useState<string>(DEFAULT_PREFERENCES.spice);
  const [customPreferences, setCustomPreferences] = useState<string>(DEFAULT_PREFERENCES.customPreferences ?? '');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(DEFAULT_DIETARY.allergens);
  const [selectedDiets, setSelectedDiets] = useState<string[]>(DEFAULT_DIETARY.diets);
  const [customRestrictions, setCustomRestrictions] = useState<string>(DEFAULT_DIETARY.customRestrictions ?? '');
  const [nutritionalTargets, setNutritionalTargets] = useState<{label: string, value: string}[]>(DEFAULT_DIETARY.targets ?? []);

  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [dangerMessage, setDangerMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('Free tier');

  // Billing states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isCardExpanded, setIsCardExpanded] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { preferences: loadedPrefs, dietary } = await loadUserProfile(user.uid);
        if (cancelled) return;
        setSelectedCuisines(loadedPrefs.cuisines);
        setSelectedSpice(loadedPrefs.spice);
        setSelectedBudget(loadedPrefs.budget);
        setSelectedSkill(loadedPrefs.skill);
        setSelectedGoal(loadedPrefs.goal);
        setCustomPreferences(loadedPrefs.customPreferences ?? '');
        setSelectedAllergens(dietary.allergens);
        setSelectedDiets(dietary.diets);
        setCustomRestrictions(dietary.customRestrictions ?? '');
        setNutritionalTargets(dietary.targets ?? []);
        setPreferences({
          cuisines: loadedPrefs.cuisines,
          spice: loadedPrefs.spice,
          budget: loadedPrefs.budget,
          skill: loadedPrefs.skill,
          goal: loadedPrefs.goal,
          allergens: dietary.allergens,
          diets: dietary.diets,
          customPreferences: loadedPrefs.customPreferences ?? '',
        });
      } catch (e) {
        console.error('[MealMind] loadUserProfile:', e);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, setPreferences]);

  const buildPreferences = (): UserPreferences => ({
    cuisines: selectedCuisines,
    spice: selectedSpice,
    budget: selectedBudget,
    skill: selectedSkill,
    goal: selectedGoal,
    customPreferences,
  });

  const buildDietary = (): UserDietary => ({
    allergens: selectedAllergens,
    diets: selectedDiets,
    customRestrictions,
    targets: nutritionalTargets,
  });

  const handleSavePreferences = async () => {
    if (!user?.uid || !db) {
      setPrefMessage('Cloud sync requires Firebase configuration.');
      return;
    }
    setPrefSaving(true);
    setPrefMessage(null);
    try {
      const prefs = buildPreferences();
      await saveUserPreferences(user.uid, prefs);
      setPrefMessage('Saved to your account. Chatbot preferences updated.');
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
      const dietary = buildDietary();
      await saveUserDietary(user.uid, dietary);
      setDietMessage('Saved to your account. Chatbot restrictions updated.');
      const prefs = buildPreferences();
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
    } catch (e) {
      console.error(e);
      setDietMessage('Could not save. Try again.');
    } finally {
      setDietSaving(false);
    }
  };

  const handleUpdateName = async () => {
    if (!auth?.currentUser) return;
    const trimmed = tempName.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty.');
      return;
    }
    setNameUpdating(true);
    setNameError(null);
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      refreshUser();
      setIsEditingName(false);
    } catch (e) {
      console.error('[MealMind] updateProfile:', e);
      setNameError('Failed to update name. Try again.');
    } finally {
      setNameUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!auth?.currentUser) return;
    setSecurityMessage(null);

    const pass = newPassword.trim();
    if (pass.length < 8) {
      setSecurityMessage('Password must be at least 8 characters.');
      return;
    }
    if (pass !== confirmPassword.trim()) {
      setSecurityMessage('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(auth.currentUser, pass);
      setSecurityMessage('Password updated successfully!');
      setIsPasswordFormOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      console.error('[MealMind] updatePassword:', e);
      if (e.code === 'auth/requires-recent-login') {
        setSecurityMessage('For security, please log out and back in before changing your password.');
      } else {
        setSecurityMessage('Failed to update password. Try again.');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth?.currentUser || !user?.uid) return;

    const confirmed = window.confirm(
      'Are you absolutely sure you want to delete your account? This will permanently remove your dietary preferences and saved recipes.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setDangerMessage(null);
    try {
      // 1. Delete Firestore user record
      try {
        await deleteUserDoc(user.uid);
      } catch (fsErr) {
        console.warn('[MealMind] Firestore cleanup failed (non-fatal):', fsErr);
      }

      // 2. Delete Auth user
      await deleteUser(auth.currentUser);

      // 3. Goodbye
      navigate('/');
    } catch (e: any) {
      console.error('[MealMind] deleteUser:', e);
      if (e.code === 'auth/requires-recent-login') {
        setDangerMessage('For security, please log out and back in before deleting your account.');
      } else {
        setDangerMessage('Delete failed. Please try again or contact support.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getCompletionData = () => {
    const items = [
      { id: 'name', label: 'Display Name', weight: 20, done: !!user?.displayName },
      { id: 'cuisines', label: 'Cuisines', weight: 15, done: selectedCuisines.length > 0 },
      { id: 'spice', label: 'Spice Level', weight: 10, done: !!selectedSpice },
      { id: 'budget', label: 'Default Budget', weight: 15, done: !!selectedBudget },
      { id: 'skill', label: 'Cooking Skill', weight: 15, done: !!selectedSkill },
      { id: 'goal', label: 'Health Goal', weight: 15, done: !!selectedGoal },
      { id: 'dietary', label: 'Diet/Allergies', weight: 5, done: selectedAllergens.length > 0 || selectedDiets.length > 0 || !!customRestrictions },
      { id: 'targets', label: 'Nutritional Targets', weight: 5, done: nutritionalTargets.length > 0 },
    ];
    const score = items.reduce((acc, it) => acc + (it.done ? it.weight : 0), 0);
    const todo = items.filter(it => !it.done).map(it => it.label);
    return { score, todo };
  };

  const { score: completionScore, todo: missingItems } = getCompletionData();

  const toggleArr = (arr: string[], val: string, setArr: (a: string[]) => void) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'profile', label: 'Profile', emoji: '👤' },
    { id: 'preferences', label: 'Preferences', emoji: '⚙️' },
    { id: 'dietary', label: 'Diet & Allergies', emoji: '🥗' },
    { id: 'billing', label: 'Payments', emoji: '💳' },
  ];

  const addTarget = () => {
    setNutritionalTargets(prev => [...prev, { label: '', value: '' }]);
  };

  const removeTarget = (index: number) => {
    setNutritionalTargets(prev => prev.filter((_, i) => i !== index));
  };

  const updateTarget = (index: number, field: 'label' | 'value', val: string) => {
    setNutritionalTargets(prev => prev.map((t, i) => i === index ? { ...t, [field]: val } : t));
  };

  const initials = (user?.displayName?.split(' ').map(w => w[0]).join('') ?? user?.email?.[0] ?? '?').toUpperCase();

  return (
    <>
      <style>{`
        .prof-wrap { max-width: 860px; margin: 0 auto; padding: 0 0 3rem; animation: profFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes profFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Header ── */
        .prof-header { display: flex; align-items: center; gap: 1.4rem; margin-bottom: 2.2rem; padding: 2rem 2rem 1.8rem; background: var(--dash-card-bg); border: 1px solid var(--border2); border-radius: 22px; backdrop-filter: blur(20px); }
        .prof-avatar { width: 68px; height: 68px; border-radius: 50%; background: linear-gradient(135deg, rgba(232,82,42,0.3), rgba(245,200,66,0.2)); border: 2px solid rgba(232,82,42,0.4); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: var(--accent); flex-shrink: 0; }
        .prof-header-text h1 { font-family: 'Syne', sans-serif; font-size: 1.55rem; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 0.2rem; color: var(--text); }
        .prof-header-text p { font-size: 0.88rem; color: var(--muted); margin: 0; }
        .prof-header-badge { margin-left: auto; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.9rem; background: rgba(46,194,126,0.1); border: 1px solid rgba(46,194,126,0.3); border-radius: 100px; font-size: 0.75rem; font-weight: 700; color: #2ec27e; letter-spacing: 0.5px; text-transform: uppercase; flex-shrink: 0; }

        /* ── Tabs ── */
        .prof-tabs { 
          display: flex; 
          gap: 0.5rem; 
          margin-bottom: 1.8rem; 
          background: var(--input-bg); 
          border: 1px solid var(--border2); 
          border-radius: 14px; 
          padding: 0.35rem; 
          overflow-x: auto; 
          scrollbar-width: none; 
          -ms-overflow-style: none; 
        }
        .prof-tabs::-webkit-scrollbar { display: none; }
        
        .prof-tab { 
          flex: 1; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 0.45rem; 
          padding: 0.7rem 1.2rem; 
          border-radius: 10px; 
          border: none; 
          background: transparent; 
          color: var(--muted); 
          font: 600 0.88rem/1 'DM Sans', sans-serif; 
          cursor: pointer; 
          transition: all 0.22s; 
          white-space: nowrap; 
          min-width: fit-content;
        }
        .prof-tab:hover { color: var(--text); background: var(--glass-hover); }
        .prof-tab.active { background: rgba(232,82,42,0.14); color: var(--accent); border: 1px solid rgba(232,82,42,0.32); box-shadow: 0 2px 12px rgba(232,82,42,0.12); }
        .prof-tab .tab-emoji { font-size: 1rem; }

        /* ── Tab panel ── */
        .prof-panel { background: var(--dash-card-bg); border: 1px solid var(--border2); border-radius: 22px; padding: 2rem 2rem; backdrop-filter: blur(20px); animation: profFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }

        /* ── Section headings ── */
        .prof-section-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); margin: 0 0 0.8rem; }
        .prof-section { margin-bottom: 1.8rem; }
        .prof-section:last-child { margin-bottom: 0; }
        .prof-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 1.6rem 0; }

        /* ── Info rows ── */
        .prof-info-card { background: var(--input-bg); border: 1px solid var(--border2); border-radius: 14px; overflow: hidden; }
        .prof-info-row { display: flex; align-items: center; gap: 1rem; padding: 0.95rem 1.15rem; border-bottom: 1px solid var(--border); }
        .prof-info-row:last-child { border-bottom: none; }
        .prof-info-key { font-size: 0.8rem; color: var(--muted); min-width: 100px; flex-shrink: 0; font-weight: 500; }
        .prof-info-val { font-size: 0.9rem; font-weight: 600; }
        .prof-info-val.muted { color: var(--muted); font-weight: 400; }

        /* ── Chips ── */
        .prof-chip-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .prof-chip { padding: 0.4rem 0.85rem; border-radius: 100px; font-size: 0.83rem; font-weight: 500; cursor: pointer; border: 1px solid var(--border2); background: var(--input-bg); color: var(--muted); transition: all 0.18s; user-select: none; }
        .prof-chip:hover { border-color: rgba(232,82,42,0.4); color: var(--text); }
        .prof-chip.on { border-color: rgba(232,82,42,0.5); background: rgba(232,82,42,0.12); color: var(--accent); }

        /* ── Pill selects ── */
        .prof-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .prof-pill { padding: 0.45rem 1rem; border-radius: 100px; font-size: 0.84rem; font-weight: 500; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: var(--muted); transition: all 0.18s; font-family: 'DM Sans', sans-serif; }
        .prof-pill:hover { border-color: rgba(232,82,42,0.4); color: var(--text); }
        .prof-pill.on { border-color: var(--accent); background: rgba(232,82,42,0.12); color: var(--text); box-shadow: 0 2px 10px rgba(232,82,42,0.15); }

        /* ── Custom text input ── */
        .prof-custom-textarea {
          width: 100%;
          padding: 0.8rem 1rem;
          background: var(--input-bg);
          border: 1px solid var(--border2);
          border-radius: 13px;
          color: var(--text);
          font: 0.88rem 'DM Sans', sans-serif;
          outline: none;
          resize: vertical;
          min-height: 80px;
          line-height: 1.55;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .prof-custom-textarea::placeholder { color: var(--muted); opacity: 0.5; }
        .prof-custom-textarea:focus {
          border-color: rgba(232,82,42,0.5);
          background: rgba(232,82,42,0.04);
          box-shadow: 0 0 0 3px rgba(232,82,42,0.1);
        }
        .prof-custom-hint { font-size: 0.73rem; color: rgba(255,255,255,0.3); margin-top: 0.4rem; line-height: 1.4; }

        /* ── Action buttons ── */
        .prof-btn-row { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .prof-btn-ghost { font: 500 0.84rem 'DM Sans', sans-serif; cursor: pointer; padding: 0.5rem 1.05rem; border-radius: 100px; border: 1px solid var(--border2); background: transparent; color: var(--text); transition: all 0.18s; }
        .prof-btn-ghost:hover:not(:disabled) { border-color: rgba(232,82,42,0.45); background: var(--glass-hover); }
        .prof-btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }
        .prof-btn-accent { font: 700 0.88rem 'DM Sans', sans-serif; cursor: pointer; padding: 0.6rem 1.4rem; border-radius: 100px; border: none; background: var(--accent); color: #fff; box-shadow: 0 4px 18px rgba(232,82,42,0.3); transition: all 0.2s; }
        .prof-btn-accent:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(232,82,42,0.4); }
        .prof-btn-accent.saved { background: #2ec27e; box-shadow: 0 4px 18px rgba(46,194,126,0.3); }
        .prof-btn-danger { font: 500 0.84rem 'DM Sans', sans-serif; cursor: pointer; padding: 0.5rem 1.05rem; border-radius: 100px; border: 1px solid rgba(255,80,80,0.35); background: rgba(255,80,80,0.07); color: #ff8a8a; transition: all 0.18s; }
        .prof-btn-danger:hover:not(:disabled) { background: rgba(255,80,80,0.13); }
        .prof-btn-danger:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Edit name elements ── */
        .prof-name-input {
          flex: 1;
          background: var(--input-bg);
          border: 1px solid rgba(232,82,42,0.3);
          border-radius: 8px;
          padding: 0.4rem 0.7rem;
          color: var(--text);
          font: 600 0.9rem 'DM Sans', sans-serif;
          outline: none;
        }
        .prof-name-row { display: flex; align-items: center; gap: 0.7rem; flex: 1; }
        .prof-edit-btn {
          font: 600 0.72rem 'DM Sans', sans-serif;
          background: var(--input-bg);
          border: 1px solid var(--border2);
          color: var(--muted);
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .prof-edit-btn:hover { border-color: rgba(232,82,42,0.4); color: var(--text); }
        .prof-save-mini {
          font: 700 0.72rem 'DM Sans', sans-serif;
          background: var(--accent);
          border: none;
          color: #fff;
          padding: 0.35rem 0.8rem;
          border-radius: 6px;
          cursor: pointer;
        }

        /* ── Disclaimer ── */
        .prof-disclaimer { font-size: 0.78rem; color: var(--muted2); line-height: 1.55; padding: 0.8rem 1rem; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); margin-top: 1.2rem; }

        /* ── Save row ── */
        .prof-save-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.8rem; padding-top: 1.4rem; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 1.6rem; }
        .prof-save-hint { font-size: 0.8rem; color: var(--muted2); }
        
        /* ── Completion list ── */
        .prof-todo-list { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; gap: 0.5rem; }
        .prof-todo-item { display: flex; align-items: center; gap: 0.6rem; font-size: 0.78rem; color: var(--muted); }
        .prof-todo-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); opacity: 0.6; }

        /* ── Billing ── */
        .bill-card { background: var(--input-bg); border: 1px solid var(--border2); border-radius: 18px; padding: 1.5rem; margin-bottom: 1.5rem; transition: all 0.3s; }
        .bill-card:hover { border-color: rgba(232,82,42,0.25); transform: translateY(-2px); }
        .bill-card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.2rem; }
        .bill-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--muted2); margin-bottom: 0.3rem; }
        .bill-val { font-size: 1.1rem; font-weight: 700; color: var(--text); }
        .bill-input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .bill-input-wrap { display: flex; flex-direction: column; gap: 0.4rem; }
        .bill-input { background: rgba(255,255,255,0.03); border: 1px solid var(--border2); border-radius: 10px; padding: 0.7rem 0.9rem; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.88rem; outline: none; transition: border-color 0.2s; }
        .bill-input:focus { border-color: rgba(232,82,42,0.5); }

        /* ── Plan Modal ── */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: modalFadeIn 0.3s ease; }
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-box { background: var(--surface); width: 95%; max-width: 800px; max-height: 90vh; border-radius: 28px; border: 1px solid var(--border2); overflow-y: auto; position: relative; padding: 2.5rem 2rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); color: var(--text); }
        .modal-close { position: absolute; top: 1.5rem; right: 1.5rem; width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border2); background: transparent; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .modal-close:hover { background: var(--glass-hover); color: var(--text); }
        .plan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
        .plan-card { background: var(--input-bg); border: 1px solid var(--border2); border-radius: 22px; padding: 1.8rem; display: flex; flex-direction: column; transition: all 0.3s; position: relative; }
        .plan-card.active { border-color: var(--accent); background: rgba(232,82,42,0.08); }
        .plan-card.active::before { content: 'Current Plan'; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: white; padding: 3px 12px; border-radius: 100px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .plan-title { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text); }
        .plan-price { font-size: 1.8rem; font-weight: 800; margin-bottom: 1.2rem; color: var(--text); }
        .plan-price span { font-size: 0.9rem; color: var(--muted); font-weight: 400; }
        .plan-features { list-style: none; padding: 0; margin: 0 0 1.8rem; flex: 1; }
        .plan-feature { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: var(--muted); margin-bottom: 0.65rem; }
        .plan-feature b { color: var(--accent); }

        /* ── Chat context note ── */
        .prof-chat-note {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.7rem 0.9rem;
          background: rgba(232,82,42,0.06);
          border: 1px solid rgba(232,82,42,0.18);
          border-radius: 12px;
          font-size: 0.76rem;
          color: rgba(232,82,42,0.8);
          line-height: 1.45;
          margin-bottom: 1.6rem;
        }

        @media (max-width: 600px) {
          .prof-header { flex-direction: column; text-align: center; }
          .prof-header-badge { margin: 0 auto; }
          .prof-tab { font-size: 0.78rem; padding: 0.6rem 0.5rem; }
          .prof-panel { padding: 1.4rem 1.2rem; }
        }

        .target-item { display: flex; gap: 0.8rem; align-items: center; margin-bottom: 0.8rem; animation: profFadeUp 0.3s ease both; }
        .target-input-label { flex: 1.2; background: rgba(255,255,255,0.03); border: 1px solid var(--border2); border-radius: 10px; padding: 0.55rem 0.8rem; color: var(--text); font-size: 0.85rem; outline: none; }
        .target-input-val { flex: 1; background: rgba(255,255,255,0.03); border: 1px solid var(--border2); border-radius: 10px; padding: 0.55rem 0.8rem; color: var(--accent); font-weight: 600; font-size: 0.85rem; outline: none; }
        .target-remove { background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.2); color: #ff8a8a; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .target-remove:hover { background: rgba(255,80,80,0.2); transform: scale(1.05); }
        .target-add-btn { background: rgba(46,194,126,0.1); border: 1px solid rgba(46,194,126,0.2); color: #2ec27e; padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.82rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; margin-top: 0.5rem; }
        .target-add-btn:hover { background: rgba(46,194,126,0.15); transform: translateY(-1px); }
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
                  {isEditingName ? (
                    <div className="prof-name-row">
                      <input
                        className="prof-name-input"
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        placeholder="Enter your name"
                        autoFocus
                      />
                      <button className="prof-save-mini" onClick={handleUpdateName} disabled={nameUpdating}>
                        {nameUpdating ? '...' : 'Save'}
                      </button>
                      <button className="prof-edit-btn" onClick={() => { setIsEditingName(false); setTempName(user?.displayName ?? ''); }} disabled={nameUpdating}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="prof-name-row">
                      <span className="prof-info-val">{user?.displayName ?? <span className="muted">Not set</span>}</span>
                      <button className="prof-edit-btn" onClick={() => { setIsEditingName(true); setTempName(user?.displayName ?? ''); }}>
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                {nameError && (
                  <div style={{ padding: '0 1.15rem 0.8rem', color: '#ff8a8a', fontSize: '0.75rem' }}>
                    {nameError}
                  </div>
                )}
                <div className="prof-info-row">
                  <span className="prof-info-key">Email</span>
                  <span className="prof-info-val">{user?.email ?? '—'}</span>
                </div>
                <div className="prof-info-row">
                  <span className="prof-info-key">Plan</span>
                  <span className="prof-info-val" style={{ color: 'var(--accent2)' }}>{currentPlan}</span>
                </div>
              </div>
            </div>
 
            <div className="prof-section">
              <p className="prof-section-label">Profile completion</p>
              <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border2)', borderRadius: 14, padding: '1rem 1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{completionScore}% complete</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                    {completionScore === 100 ? 'All set! Your profile is complete.' : 'Complete your details to reach 100%'}
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 100, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${completionScore}%`, borderRadius: 100, background: 'linear-gradient(90deg, var(--accent), var(--accent2))', transition: 'width 0.4s ease' }} />
                </div>
                
                {missingItems.length > 0 && (
                  <div style={{ marginTop: '1.4rem', paddingTop: '1rem', borderTop: '1px solid var(--border2)' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.6rem' }}>What's missing?</p>
                    <ul className="prof-todo-list">
                      {missingItems.map(item => (
                        <li key={item} className="prof-todo-item">
                          <span className="prof-todo-dot" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="prof-section">
              <p className="prof-section-label">Security</p>
              {!isPasswordFormOpen ? (
                <div className="prof-btn-row">
                  <button
                    className="prof-btn-ghost"
                    onClick={() => setIsPasswordFormOpen(true)}
                  >
                    Change password
                  </button>
                  <button className="prof-btn-ghost" disabled>Connect Google</button>
                </div>
              ) : (
                <div className="prof-info-card" style={{ padding: '1.2rem', display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'grid', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>New Password</label>
                    <input
                      type="password"
                      className="prof-name-input"
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confirm New Password</label>
                    <input
                      type="password"
                      className="prof-name-input"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="prof-btn-row" style={{ marginTop: '0.4rem' }}>
                    <button
                      className="prof-save-mini"
                      style={{ padding: '0.5rem 1.2rem', fontSize: '0.84rem' }}
                      onClick={handleUpdatePassword}
                      disabled={isUpdatingPassword}
                    >
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      className="prof-edit-btn"
                      style={{ padding: '0.5rem 1.2rem', fontSize: '0.84rem' }}
                      onClick={() => {
                        setIsPasswordFormOpen(false);
                        setSecurityMessage(null);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      disabled={isUpdatingPassword}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {securityMessage && (
                <p style={{
                  marginTop: '0.8rem',
                  fontSize: '0.82rem',
                  color: securityMessage.includes('successfully') ? '#2ec27e' : '#ff8a8a',
                  fontWeight: 500
                }}>
                  {securityMessage}
                </p>
              )}
            </div>

            <div className="prof-divider" />

            <div className="prof-section">
              <p className="prof-section-label">Danger zone</p>
              <button
                className="prof-btn-danger"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting account...' : 'Delete account permanently'}
              </button>
              {dangerMessage && (
                <p style={{ marginTop: '0.8rem', fontSize: '0.82rem', color: '#ff8a8a', fontWeight: 500 }}>
                  {dangerMessage}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Preferences ── */}
        {activeTab === 'preferences' && (
          <div className="prof-panel" role="tabpanel">
            <div className="prof-chat-note">
              💬 Your preferences are used as context by the MealMind AI chatbot. Save them to personalise all suggestions.
            </div>
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
                    onClick={() => setSelectedSpice(prev => prev === level ? '' : level)}
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
                    onClick={() => setSelectedBudget(prev => prev === b ? '' : b)}
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
                    onClick={() => setSelectedSkill(prev => prev === s ? '' : s)}
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
                    onClick={() => setSelectedGoal(prev => prev === g ? '' : g)}
                  >{g}</button>
                ))}
              </div>
            </div>

            <div className="prof-section">
              <p className="prof-section-label">Additional preferences (custom)</p>
              <textarea
                className="prof-custom-textarea"
                placeholder="Describe anything else — e.g. &quot;I prefer quick meals under 20 min&quot;, &quot;I love garlic and ginger&quot;, &quot;avoid oily food&quot;, &quot;student in hostel with limited equipment&quot;..."
                value={customPreferences}
                onChange={e => setCustomPreferences(e.target.value)}
                rows={3}
              />
              <p className="prof-custom-hint">
                This text is sent directly to the AI chatbot as extra context. Be as specific as you want.
              </p>
            </div>

            <div className="prof-save-row">
              <span className="prof-save-hint">
                {prefMessage ?? 'Stored in Firestore under your account. The chatbot reads these on save.'}
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
            <div className="prof-chat-note">
              💬 Saved restrictions are strictly respected by the MealMind AI chatbot — it will never suggest food that conflicts with them.
            </div>
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

            <div className="prof-section">
              <p className="prof-section-label">Other allergies or dietary restrictions</p>
              <textarea
                className="prof-custom-textarea"
                placeholder="Type any other specifics — e.g. &quot;No cilantro&quot;, &quot;Allergic to kiwi&quot;, &quot;Low sodium&quot;..."
                value={customRestrictions}
                onChange={e => setCustomRestrictions(e.target.value)}
                rows={2}
              />
            </div>

            <div className="prof-section">
              <p className="prof-section-label">Nutritional Targets & Custom Goals</p>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '16px', border: '1px solid var(--border2)' }}>
                {nutritionalTargets.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0 0 1rem' }}>No custom targets added yet. Add goals like protein intake or calorie limits.</p>
                ) : (
                  <div style={{ marginBottom: '1rem' }}>
                    {nutritionalTargets.map((t, i) => (
                      <div key={i} className="target-item">
                        <input 
                          className="target-input-label" 
                          placeholder="e.g. Daily Protein" 
                          value={t.label}
                          onChange={e => updateTarget(i, 'label', e.target.value)}
                        />
                        <input 
                          className="target-input-val" 
                          placeholder="e.g. 150g" 
                          value={t.value}
                          onChange={e => updateTarget(i, 'value', e.target.value)}
                        />
                        <button className="target-remove" onClick={() => removeTarget(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <button className="target-add-btn" onClick={addTarget}>
                  <span>+</span> Add Target Heading
                </button>
              </div>
              <p className="prof-custom-hint" style={{ marginTop: '0.8rem' }}>
                These targets help the AI tailor its nutritional advice and meal suggestions to your specific needs.
              </p>
            </div>

            <div className="prof-disclaimer">
              🛡️ MealMind uses your selections to filter all AI suggestions and recipes. Always verify ingredient labels if you have a severe allergy — this is not medical advice.
            </div>

            <div className="prof-save-row">
              <span className="prof-save-hint">
                {dietMessage ?? 'Hard constraints — saved to your account and applied to the chatbot.'}
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

        {/* ── Tab: Billing & Subscription ── */}
        {activeTab === 'billing' && (
          <div className="prof-panel" role="tabpanel">
            <div className="prof-section">
              <p className="prof-section-label">Current Subscription</p>
              <div className="bill-card">
                <div className="bill-card-head">
                  <div>
                    <div className="bill-label">Active Plan</div>
                    <div className="bill-val" style={{ color: 'var(--accent)' }}>{currentPlan}</div>
                  </div>
                  <button className="prof-btn-ghost" onClick={() => setIsPlanModalOpen(true)}>Change Plan</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border2)', paddingTop: '1.2rem' }}>
                  <div>
                    <div className="bill-label">Billing Cycle</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Monthly</div>
                  </div>
                  <div>
                    <div className="bill-label">Next Invoice</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>May 21, 2026</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="prof-section">
              <p className="prof-section-label">Payment Method</p>
              <div className="bill-card">
                <div style={{ marginBottom: '1.4rem' }}>
                  <div className="bill-label">Card Details</div>
                  {(!cardName && !cardNumber) ? (
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border2)', borderRadius: '12px', fontSize: '0.88rem', color: 'var(--muted)', textAlign: 'center' }}>
                      No payment details provided yet. Fill in the form below.
                    </div>
                  ) : (
                    <div 
                      onClick={() => setIsCardExpanded(!isCardExpanded)}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '0.8rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        padding: '1.2rem', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ width: 40, height: 26, background: '#1a1a1a', borderRadius: '4px', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: '#666' }}>VISA</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{cardName || 'Cardholder Name'}</div>
                        <div style={{ marginLeft: 'auto', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '1px' }}>
                          •••• {cardNumber.slice(-4) || '••••'}
                        </div>
                        <div style={{ color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 800 }}>{isCardExpanded ? '▲' : '▼'}</div>
                      </div>
                      
                      {isCardExpanded && (
                        <div 
                          style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '1.5rem', 
                            paddingTop: '1.2rem', 
                            marginTop: '0.5rem',
                            borderTop: '1px solid var(--border2)',
                            animation: 'profFadeUp 0.3s ease both' 
                          }}
                        >
                          <div>
                            <div className="bill-label">Full Number</div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{cardNumber || '•••• •••• •••• ••••'}</div>
                          </div>
                          <div>
                            <div className="bill-label">Expiry / CVV</div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                              {cardExp || 'MM/YY'} &nbsp;•&nbsp; {cardCvv ? '•••' : 'CVV'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gap: '1.2rem' }}>
                  <div className="bill-input-wrap">
                    <label className="bill-label">Cardholder Name</label>
                    <input 
                      className="bill-input" 
                      placeholder="e.g. John Doe" 
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                    />
                  </div>
                  <div className="bill-input-wrap">
                    <label className="bill-label">Card Number</label>
                    <input 
                      className="bill-input" 
                      placeholder="0000 0000 0000 0000" 
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value.replace(/\s/g, ''))}
                    />
                  </div>
                  <div className="bill-input-grid">
                    <div className="bill-input-wrap">
                      <label className="bill-label">Expiry Date</label>
                      <input 
                        className="bill-input" 
                        placeholder="MM / YY" 
                        value={cardExp}
                        onChange={e => setCardExp(e.target.value)}
                      />
                    </div>
                    <div className="bill-input-wrap">
                      <label className="bill-label">CVV</label>
                      <input 
                        className="bill-input" 
                        placeholder="•••" 
                        type="password" 
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value)}
                      />
                    </div>
                  </div>
                  <button className="prof-btn-accent" style={{ marginTop: '0.5rem' }}>Update Payment Details</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Plan Switcher Modal ── */}
      {isPlanModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPlanModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsPlanModalOpen(false)}>✕</button>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'Syne', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Choose your plan</h2>
              <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Unlock the full potential of MealMind AI</p>
            </div>

            <div className="plan-grid">
              {[
                { name: 'Free tier', price: '0', period: '/forever', features: ['3 AI meal ideas / day', 'Basic dietary filters', 'Standard community support'] },
                { name: 'Pro Plan', price: '999', period: '/month', features: ['Unlimited AI recipes', 'Priority chatbot response', 'Advanced nutrition tracking', 'Personalised meal plans'] },
                { name: 'Elite Chef', price: '2,499', period: '/month', features: ['Everything in Pro', 'Smart fridge integration', 'Family accounts (up to 5)', 'Early access to new features'] },
              ].map(plan => (
                <div key={plan.name} className={`plan-card${currentPlan === plan.name ? ' active' : ''}`}>
                  <div className="plan-title">{plan.name}</div>
                  <div className="plan-price">PKR {plan.price}<span>{plan.period}</span></div>
                  <ul className="plan-features">
                    {plan.features.map(f => (
                      <li key={f} className="plan-feature">
                        <span style={{ color: 'var(--accent)' }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={currentPlan === plan.name ? 'prof-btn-ghost' : 'prof-btn-accent'}
                    style={{ width: '100%', padding: '0.8rem' }}
                    onClick={() => {
                      setCurrentPlan(plan.name);
                      setIsPlanModalOpen(false);
                    }}
                    disabled={currentPlan === plan.name}
                  >
                    {currentPlan === plan.name ? 'Active' : 'Select Plan'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}