import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import {
  deleteSavedRecipeDoc,
  migrateLocalSavedRecipesToFirestore,
  subscribeSavedRecipes,
  upsertSavedRecipe,
} from '../lib/firestoreUserData';
import type { RecipeNutrition } from '../types/recipeNutrition';

// ─── Types ────────────────────────────────────────────────
export type SavedRecipeType = 'ai' | 'online' | 'craving';

export interface SavedRecipe {
  id: string;
  type: SavedRecipeType;
  title: string;
  savedAt: string; // ISO string
  instructions?: string[];
  isFallback?: boolean;
  references?: { title: string; url: string }[];
  /** Per-serving estimates from AI Chef; persisted in Firestore for AI saves */
  nutrition?: RecipeNutrition;
  url?: string;
  snippet?: string;
  domain?: string;
  address?: string;
  orderLink?: string;
  rating?: number;
  priceLevel?: number;
  distanceKm?: number;
}

interface SavedRecipesContextType {
  saved: SavedRecipe[];
  saveRecipe: (recipe: Omit<SavedRecipe, 'id' | 'savedAt'>) => void;
  removeRecipe: (id: string) => void;
  isSaved: (title: string, url?: string) => boolean;
}

const SavedRecipesContext = createContext<SavedRecipesContextType>({
  saved: [],
  saveRecipe: () => {},
  removeRecipe: () => {},
  isSaved: () => false,
});

function storageKey(uid?: string | null): string {
  return uid ? `mealmind_saved_${uid}` : 'mealmind_saved_recipes';
}

function loadFromStorage(key: string): SavedRecipe[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedRecipe[]) : [];
  } catch {
    return [];
  }
}

export function SavedRecipesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const key = storageKey(user?.uid);
  const useRemote = Boolean(user?.uid && db);

  const [saved, setSaved] = useState<SavedRecipe[]>([]);

  // Local-only: load + persist
  useEffect(() => {
    if (useRemote) return;
    setSaved(loadFromStorage(key));
  }, [key, useRemote]);

  useEffect(() => {
    if (useRemote) return;
    localStorage.setItem(key, JSON.stringify(saved));
  }, [saved, key, useRemote]);

  // Firestore: migrate once, then realtime listener
  useEffect(() => {
    if (!useRemote || !user?.uid) return;

    let cancelled = false;
    let unsub: (() => void) | undefined;

    (async () => {
      try {
        await migrateLocalSavedRecipesToFirestore(user.uid, key);
      } catch (e) {
        console.warn('[MealMind] Could not migrate saved recipes to Firestore:', e);
      }
      if (cancelled) return;
      unsub = subscribeSavedRecipes(
        user.uid,
        (items) => {
          if (!cancelled) {
            setSaved(items);
            try {
              localStorage.setItem(key, JSON.stringify(items));
            } catch {
              /* quota */
            }
          }
        },
        (err) => {
          console.warn('[MealMind] Firestore savedRecipes listener:', err?.message ?? err);
          if (!cancelled) setSaved(loadFromStorage(key));
        }
      );
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [useRemote, user?.uid, key]);

  const saveRecipe = (recipe: Omit<SavedRecipe, 'id' | 'savedAt'>) => {
    const entry: SavedRecipe = {
      ...recipe,
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
    };
    if (useRemote && user?.uid) {
      void upsertSavedRecipe(user.uid, entry).catch((e) => console.error('[MealMind] saveRecipe:', e));
    } else {
      setSaved((prev) => [entry, ...prev]);
    }
  };

  const removeRecipe = (id: string) => {
    if (useRemote && user?.uid) {
      void deleteSavedRecipeDoc(user.uid, id).catch((e) => console.error('[MealMind] removeRecipe:', e));
    } else {
      setSaved((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const isSaved = (title: string, url?: string) =>
    saved.some((r) =>
      url ? r.url === url || r.orderLink === url : r.title.toLowerCase() === title.toLowerCase()
    );

  return (
    <SavedRecipesContext.Provider value={{ saved, saveRecipe, removeRecipe, isSaved }}>
      {children}
    </SavedRecipesContext.Provider>
  );
}

export const useSavedRecipes = () => useContext(SavedRecipesContext);
