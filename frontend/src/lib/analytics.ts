import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface AnalyticsEvent {
  userId: string;
  type: string;
  metadata?: Record<string, any>;
}

export const logEvent = async (event: AnalyticsEvent) => {
  if (!db) return;
  try {
    await addDoc(collection(db, 'events'), {
      ...event,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent
    });
  } catch (error) {
    console.warn("Analytics Event could not be logged:", error);
  }
};
