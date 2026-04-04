import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { SavedRecipe } from '../context/SavedRecipesContext';

// ─── User profile (preferences + dietary on users/{uid}) ───

export interface UserPreferences {
  cuisines: string[];
  spice: string;
  budget: string;
  skill: string;
  goal: string;
}

export interface UserDietary {
  allergens: string[];
  diets: string[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  cuisines: ['Pakistani', 'Italian'],
  spice: 'Medium',
  budget: '300–700 PKR',
  skill: 'Intermediate',
  goal: 'Eat well',
};

export const DEFAULT_DIETARY: UserDietary = {
  allergens: ['Peanuts', 'Shellfish', 'Dairy'],
  diets: ['Halal', 'High protein'],
};

export async function loadUserProfile(uid: string): Promise<{
  preferences: UserPreferences;
  dietary: UserDietary;
}> {
  if (!db) {
    return { preferences: { ...DEFAULT_PREFERENCES }, dietary: { ...DEFAULT_DIETARY } };
  }
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) {
    return { preferences: { ...DEFAULT_PREFERENCES }, dietary: { ...DEFAULT_DIETARY } };
  }
  const data = snap.data() as {
    preferences?: Partial<UserPreferences>;
    dietary?: Partial<UserDietary>;
  };
  return {
    preferences: { ...DEFAULT_PREFERENCES, ...data.preferences },
    dietary: { ...DEFAULT_DIETARY, ...data.dietary },
  };
}

export async function saveUserPreferences(uid: string, preferences: UserPreferences): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  await setDoc(doc(db, 'users', uid), { preferences }, { merge: true });
}

export async function saveUserDietary(uid: string, dietary: UserDietary): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  await setDoc(doc(db, 'users', uid), { dietary }, { merge: true });
}

/** Whether the user finished post-signup onboarding (`users/{uid}`). */
export async function getOnboardingCompleted(uid: string): Promise<boolean | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const v = snap.data()?.onboardingCompleted;
  return typeof v === 'boolean' ? v : null;
}

export async function setOnboardingCompleted(uid: string, completed = true): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'users', uid), { onboardingCompleted: completed }, { merge: true });
}

// ─── Saved recipes: users/{uid}/savedRecipes/{recipeId} ───

function savedRecipeToFirestorePayload(recipe: Omit<SavedRecipe, 'id'>): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...recipe };
  return payload;
}

/** If Firestore has no saved recipes but localStorage does, upload once and clear localStorage. */
export async function migrateLocalSavedRecipesToFirestore(
  uid: string,
  localStorageKey: string
): Promise<void> {
  if (!db) return;
  const raw = localStorage.getItem(localStorageKey);
  if (!raw) return;
  let items: SavedRecipe[];
  try {
    items = JSON.parse(raw) as SavedRecipe[];
  } catch {
    return;
  }
  if (!Array.isArray(items) || items.length === 0) return;

  const colRef = collection(db, 'users', uid, 'savedRecipes');
  const probe = await getDocs(query(colRef, limit(1)));
  if (!probe.empty) return;

  const batch = writeBatch(db);
  for (const r of items) {
    const ref = doc(colRef, r.id);
    const { id: _id, ...rest } = r;
    batch.set(ref, savedRecipeToFirestorePayload(rest));
  }
  await batch.commit();
  localStorage.removeItem(localStorageKey);
}

export function subscribeSavedRecipes(
  uid: string,
  onNext: (items: SavedRecipe[]) => void,
  onErr: (e: Error) => void
): () => void {
  if (!db) {
    onNext([]);
    return () => {};
  }
  const q = query(collection(db, 'users', uid, 'savedRecipes'), orderBy('savedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const items: SavedRecipe[] = snap.docs.map((d) => {
        const data = d.data() as Omit<SavedRecipe, 'id'>;
        return { id: d.id, ...data };
      });
      onNext(items);
    },
    (e) => onErr(e as Error)
  );
}

export async function upsertSavedRecipe(uid: string, recipe: SavedRecipe): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  const { id, ...rest } = recipe;
  await setDoc(doc(db, 'users', uid, 'savedRecipes', id), savedRecipeToFirestorePayload(rest));
}

export async function deleteSavedRecipeDoc(uid: string, recipeId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  await deleteDoc(doc(db, 'users', uid, 'savedRecipes', recipeId));
}

// ─── Food links: users/{uid}/foodLinks/{linkId} ───

export interface FoodLink {
  id: string;
  restaurant: string;
  item: string;
  area: string;
  distance: string;
  price: string;
  emoji: string;
  platform: string;
  href: string;
  createdAt: string;
}

const DEMO_FOOD_LINKS: Omit<FoodLink, 'id' | 'createdAt'>[] = [
  { restaurant: 'Burger Lab — DHA', item: 'Smash Beef Burger', area: 'Lahore · DHA Phase 4', distance: '1.2 km', price: 'Rs. 850', emoji: '🍔', platform: 'Foodpanda', href: 'https://www.foodpanda.pk' },
  { restaurant: 'Daily Deli Co.', item: 'Grilled Chicken Wrap', area: 'DHA Phase 4', distance: '1.8 km', price: 'Rs. 650', emoji: '🌯', platform: 'WhatsApp', href: 'https://wa.me/923001234567' },
  { restaurant: 'Johnny & Jugnu', item: 'Wehshi Zinger Burger', area: 'Johar Town', distance: '2.5 km', price: 'Rs. 700', emoji: '🍗', platform: 'Foodpanda', href: 'https://www.foodpanda.pk' },
];

export async function seedFoodLinksIfEmpty(uid: string): Promise<void> {
  if (!db) return;
  const colRef = collection(db, 'users', uid, 'foodLinks');
  const probe = await getDocs(query(colRef, limit(1)));
  if (!probe.empty) return;
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  for (const row of DEMO_FOOD_LINKS) {
    const ref = doc(colRef);
    batch.set(ref, { ...row, createdAt: now });
  }
  await batch.commit();
}

export function subscribeFoodLinks(
  uid: string,
  onNext: (items: FoodLink[]) => void,
  onErr: (e: Error) => void
): () => void {
  if (!db) {
    onNext([]);
    return () => {};
  }
  const q = query(collection(db, 'users', uid, 'foodLinks'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const items: FoodLink[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FoodLink, 'id'>) }));
      onNext(items);
    },
    (e) => onErr(e as Error)
  );
}

export async function addFoodLink(
  uid: string,
  data: Omit<FoodLink, 'id' | 'createdAt'>
): Promise<string> {
  if (!db) throw new Error('Firestore is not configured');
  const ref = doc(collection(db, 'users', uid, 'foodLinks'));
  const createdAt = new Date().toISOString();
  await setDoc(ref, { ...data, createdAt });
  return ref.id;
}

export async function deleteFoodLink(uid: string, linkId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  await deleteDoc(doc(db, 'users', uid, 'foodLinks', linkId));
}

// ─── Meal planner: users/{uid}/mealPlanner/default ───

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type DayPlan = Record<MealSlot, string[]>;

/** Monday YYYY-MM-DD → day YYYY-MM-DD → meal slot → food labels */
export type MealPlannerByWeek = Record<string, Record<string, DayPlan>>;

export interface MealPlannerDocument {
  updatedAt: string;
  byWeek: MealPlannerByWeek;
}

const EMPTY_DAY = (): DayPlan => ({
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
});

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday 00:00 local time for the week containing `d`. */
export function mondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

export function weekStartISO(d: Date): string {
  return toISODate(mondayOfWeek(d));
}

export function ensureWeekShape(byWeek: MealPlannerByWeek, weekStart: string): MealPlannerByWeek {
  const mon = parseISODate(weekStart);
  const next: MealPlannerByWeek = { ...byWeek };
  const prevDays = byWeek[weekStart];
  const days: Record<string, DayPlan> = {};
  if (prevDays) {
    for (const [dk, plan] of Object.entries(prevDays)) {
      days[dk] = {
        breakfast: [...(plan.breakfast ?? [])],
        lunch: [...(plan.lunch ?? [])],
        dinner: [...(plan.dinner ?? [])],
        snack: [...(plan.snack ?? [])],
      };
    }
  }
  for (let i = 0; i < 7; i++) {
    const dt = new Date(mon);
    dt.setDate(mon.getDate() + i);
    const key = toISODate(dt);
    if (!days[key]) days[key] = EMPTY_DAY();
    else {
      const slot = days[key];
      for (const s of ['breakfast', 'lunch', 'dinner', 'snack'] as MealSlot[]) {
        if (!Array.isArray(slot[s])) slot[s] = [];
      }
    }
  }
  next[weekStart] = days;
  return next;
}

/** Total meal lines scheduled for Mon–Sun of `weekStart`. */
export function countPlannedItemsForWeek(byWeek: MealPlannerByWeek, weekStart: string): number {
  const shaped = ensureWeekShape(byWeek, weekStart);
  const days = shaped[weekStart];
  if (!days) return 0;
  let n = 0;
  const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  for (const plan of Object.values(days)) {
    for (const s of slots) {
      n += plan[s]?.length ?? 0;
    }
  }
  return n;
}

export function subscribeMealPlanner(
  uid: string,
  onNext: (data: MealPlannerDocument | null) => void,
  onErr: (e: Error) => void
): () => void {
  if (!db) {
    onNext(null);
    return () => {};
  }
  const ref = doc(db, 'users', uid, 'mealPlanner', 'default');
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onNext(null);
        return;
      }
      const raw = snap.data() as Partial<MealPlannerDocument>;
      onNext({
        updatedAt: raw.updatedAt ?? new Date().toISOString(),
        byWeek: typeof raw.byWeek === 'object' && raw.byWeek ? raw.byWeek : {},
      });
    },
    (e) => onErr(e as Error)
  );
}

export async function saveMealPlannerDocument(uid: string, docData: MealPlannerDocument): Promise<void> {
  if (!db) throw new Error('Firestore is not configured');
  await setDoc(doc(db, 'users', uid, 'mealPlanner', 'default'), docData, { merge: true });
}
