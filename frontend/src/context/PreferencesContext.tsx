import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface UserPreferences {
  cuisines: string[];
  spice: string;
  budget: string;
  skill: string;
  goal: string;
  allergens: string[];
  diets: string[];
  customPreferences: string;
}

const EMPTY: UserPreferences = {
  cuisines: [],
  spice: '',
  budget: '',
  skill: '',
  goal: '',
  allergens: [],
  diets: [],
  customPreferences: '',
};

interface PreferencesContextType {
  preferences: UserPreferences;
  setPreferences: (p: UserPreferences) => void;
}

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: EMPTY,
  setPreferences: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(EMPTY);
  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);