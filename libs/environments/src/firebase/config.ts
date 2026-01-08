import type { IFirebaseConfig } from '@picsa/models';

/**
 * SECURITY NOTE:
 * These Firebase configuration keys are designed to be public-facing and are
 * bundled into the client-side application.
 *
 * 1. DATA PROTECTION: Access to the database is strictly governed by server-side
 * Firestore Security Rules (see firestore.rules).
 *
 * 2. PII: No Personal Identifiable Information is stored in this legacy database.
 *
 * 3. USAGE: This database is being phased out in favor of Supabase and is
 * monitored for usage quotas to prevent resource hijacking.
 * https://github.com/e-picsa/picsa-apps/issues/500
 */
export const FirebaseConfig: IFirebaseConfig = {
  apiKey: 'AIzaSyBuEu95p5xS2PHRH3miUEm9I3SZ2ufCHV4',
  authDomain: 'picsa-apps.firebaseapp.com',
  databaseURL: 'https://picsa-apps.firebaseio.com',
  projectId: 'picsa-apps',
  storageBucket: 'picsa-apps.appspot.com',
  messagingSenderId: '78373580660',
  appId: '1:78373580660:web:a16e594eb01028dc',
  measurementId: 'G-CF4E23NMGB',
};
