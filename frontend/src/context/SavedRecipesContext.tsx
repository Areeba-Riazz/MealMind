import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────
export type SavedRecipeType = 'ai' | 'online';

export interface SavedRecipe {
  id: string;
  type: SavedRecipeType;
  title: string;
  savedAt: string; // ISO string
  // AI-generated fields
  instructions?: string[];
  isFallback?: boolean;
  references?: { title: string; url: string }[];
  // Online link fields
  url?: string;
  snippet?: string;
  domain?: string;
}

// ─── Context ──────────────────────────────────────────────
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

const STORAGE_KEY = 'mealmind_saved_recipes';

function loadFromStorage(): SavedRecipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedRecipe[]) : [];
  } catch {
    return [];
  }
}

// ─── Provider ─────────────────────────────────────────────
export function SavedRecipesProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedRecipe[]>(loadFromStorage);

  // Persist any change to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  const saveRecipe = (recipe: Omit<SavedRecipe, 'id' | 'savedAt'>) => {
    const entry: SavedRecipe = {
      ...recipe,
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
    };
    setSaved(prev => [entry, ...prev]);
  };

  const removeRecipe = (id: string) => {
    setSaved(prev => prev.filter(r => r.id !== id));
  };

  const isSaved = (title: string, url?: string) => {
    return saved.some(r =>
      url ? r.url === url : r.title.toLowerCase() === title.toLowerCase()
    );
  };

  return (
    <SavedRecipesContext.Provider value={{ saved, saveRecipe, removeRecipe, isSaved }}>
      {children}
    </SavedRecipesContext.Provider>
  );
}

export const useSavedRecipes = () => useContext(SavedRecipesContext);
