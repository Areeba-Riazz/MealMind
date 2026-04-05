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
    // Flatten metadata so it's easier to see in Firestore console
    const { metadata, ...rest } = event;
    await addDoc(collection(db, 'events'), {
      ...rest,
      ...metadata,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent
    });
    console.log('✅ Analytics Event logged:', event.type);
  } catch (error) {
    console.warn("❌ Analytics Event could not be logged:", error);
  }
};
