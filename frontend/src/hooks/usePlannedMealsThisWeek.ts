import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  countPlannedItemsForWeek,
  type MealPlannerByWeek,
  subscribeMealPlanner,
  weekStartISO,
  mondayOfWeek,
} from '../lib/firestoreUserData';

function loadLocalPlanner(uid: string): MealPlannerByWeek {
  try {
    const raw = localStorage.getItem(`mealmind_mealplanner_${uid}`);
    if (!raw) return {};
    const o = JSON.parse(raw) as MealPlannerByWeek;
    return typeof o === 'object' && o ? o : {};
  } catch {
    return {};
  }
}

/** Live count of meal lines in the planner for the current calendar week. */
export function usePlannedMealsThisWeek(): number {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const [count, setCount] = useState(0);

  useEffect(() => {
    const weekKey = weekStartISO(mondayOfWeek(new Date()));

    const apply = (byWeek: MealPlannerByWeek) => {
      setCount(countPlannedItemsForWeek(byWeek, weekKey));
    };

    if (!uid) {
      setCount(0);
      return;
    }

    if (!db) {
      apply(loadLocalPlanner(uid));
      return;
    }

    let cancelled = false;
    const unsub = subscribeMealPlanner(
      uid,
      (data) => {
        if (cancelled) return;
        apply(data?.byWeek ?? loadLocalPlanner(uid));
      },
      () => {
        if (!cancelled) apply(loadLocalPlanner(uid));
      }
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid]);

  return count;
}
