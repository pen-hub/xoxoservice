
'use client';

import { firebaseConfig } from '@/firebase/config';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { Database, getDatabase } from 'firebase/database';
import { Firestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';

let firestoreInstance: Firestore | null = null;
let databaseInstance: Database | null = null;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  if (!firestoreInstance) {
    // Initialize Firestore with persistent cache
    firestoreInstance = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({})
    });
  }

  if (!databaseInstance) {
    // Initialize Realtime Database
    databaseInstance = getDatabase(firebaseApp);
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestoreInstance,
    database: databaseInstance
  };
}

export * from './client-provider';
export * from './errorEmitter';
export * from './errors';
export * from './hooks/useCollection';
export * from './hooks/useDoc';
export * from './hooks/useRealtime';
export * from './nonBlockingLogin';
export * from './nonBlockingUpdates';
export * from './provider';

// Export auth hook separately to avoid conflicts
export { useAuth, type AuthUser, type UseAuthResult } from './hooks/useAuth';

// Export database instance
export const { database } = getSdks(getApps()[0] || initializeApp(firebaseConfig));

