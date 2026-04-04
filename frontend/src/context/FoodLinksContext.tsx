import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import {
  addFoodLink as addFoodLinkFirestore,
  deleteFoodLink as deleteFoodLinkFirestore,
  type FoodLink,
  subscribeFoodLinks,
} from '../lib/firestoreUserData';

function localKey(uid: string) {
  return `mealmind_foodlinks_${uid}`;
}

function loadLocal(uid: string): FoodLink[] {
  try {
    const raw = localStorage.getItem(localKey(uid));
    if (!raw) return [];
    const arr = JSON.parse(raw) as FoodLink[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveLocal(uid: string, items: FoodLink[]) {
  localStorage.setItem(localKey(uid), JSON.stringify(items));
}

interface FoodLinksContextType {
  links: FoodLink[];
  loading: boolean;
  useRemote: boolean;
  addFoodLink: (data: Omit<FoodLink, 'id' | 'createdAt'>) => Promise<void>;
  removeFoodLink: (id: string) => Promise<void>;
  isLinkSaved: (href: string) => boolean;
}

const FoodLinksContext = createContext<FoodLinksContextType>({
  links: [],
  loading: true,
  useRemote: false,
  addFoodLink: async () => {},
  removeFoodLink: async () => {},
  isLinkSaved: () => false,
});

export function FoodLinksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const useRemote = Boolean(uid && db);

  const [links, setLinks] = useState<FoodLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLinks([]);
      setLoading(false);
      return;
    }

    if (!useRemote) {
      setLinks(loadLocal(uid));
      setLoading(false);
      return;
    }

    let cancelled = false;
    const unsub = subscribeFoodLinks(
      uid,
      (items) => {
        if (!cancelled) {
          setLinks(items);
          setLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setLinks(loadLocal(uid));
          setLoading(false);
        }
      }
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid, useRemote]);

  const addFoodLink = useCallback(
    async (data: Omit<FoodLink, 'id' | 'createdAt'>) => {
      if (!uid) return;
      if (useRemote) {
        await addFoodLinkFirestore(uid, data);
        return;
      }
      const entry: FoodLink = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setLinks((prev) => {
        const next = [entry, ...prev];
        saveLocal(uid, next);
        return next;
      });
    },
    [uid, useRemote]
  );

  const removeFoodLink = useCallback(
    async (id: string) => {
      if (!uid) return;
      if (useRemote) {
        await deleteFoodLinkFirestore(uid, id);
        return;
      }
      setLinks((prev) => {
        const next = prev.filter((l) => l.id !== id);
        saveLocal(uid, next);
        return next;
      });
    },
    [uid, useRemote]
  );

  const isLinkSaved = useCallback(
    (href: string) => links.some((l) => l.href === href),
    [links]
  );

  const value = useMemo(
    () => ({
      links,
      loading,
      useRemote,
      addFoodLink,
      removeFoodLink,
      isLinkSaved,
    }),
    [links, loading, useRemote, addFoodLink, removeFoodLink, isLinkSaved]
  );

  return <FoodLinksContext.Provider value={value}>{children}</FoodLinksContext.Provider>;
}

export function useFoodLinks() {
  return useContext(FoodLinksContext);
}
