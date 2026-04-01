import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const missingKeys = requiredKeys.filter(
  key => !import.meta.env[key]
);

if (missingKeys.length) {
  console.warn('Firebase not configured. Missing env keys:', missingKeys);
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = firebaseConfig.apiKey && !missingKeys.length
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

const auth = app ? getAuth(app) : null;

export { app, auth };