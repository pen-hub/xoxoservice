"use client";

import { useFirebaseApp } from "@/firebase";
import {
  DataSnapshot,
  getDatabase,
  off,
  onValue,
  ref,
} from "firebase/database";
import { useEffect, useState } from "react";

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useRealtimeValue hook.
 * @template T Type of the data.
 */
export interface UseRealtimeValueResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * React hook to subscribe to a Firebase Realtime Database path in real-time.
 * Can handle both single values and object maps.
 *
 * @template T Optional type for data. Defaults to any.
 * @param {string | null | undefined} path - The database path (e.g., 'workflows' or 'orders/orderId001')
 * @returns {UseRealtimeValueResult<T>} Object with data, isLoading, error.
 */
export function useRealtimeValue<T = any>(
  path: string | null | undefined
): UseRealtimeValueResult<T> {
  const firebaseApp = useFirebaseApp();
  const database = getDatabase(firebaseApp);

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const dbRef = ref(database, path);

    const unsubscribe = onValue(
      dbRef,
      (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val() as T);
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (error: Error) => {
        console.error("Firebase Realtime Database error:", error);
        setError(error);
        setData(null);
        setIsLoading(false);
      }
    );

    return () => {
      off(dbRef, "value", unsubscribe);
    };
  }, [path, database]);

  return { data, isLoading, error };
}

/**
 * Hook specifically for fetching a map/object from Realtime Database
 * and converting it to an array with IDs.
 *
 * @template T Type of each item in the map
 * @param {string | null | undefined} path - The database path
 * @returns {UseRealtimeValueResult<WithId<T>[]>} Array of items with IDs
 */
export function useRealtimeList<T = any>(
  path: string | null | undefined
): UseRealtimeValueResult<WithId<T>[]> {
  const firebaseApp = useFirebaseApp();
  const database = getDatabase(firebaseApp);

  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const dbRef = ref(database, path);

    const unsubscribe = onValue(
      dbRef,
      (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
          const obj = snapshot.val();
          // Convert object map to array with IDs
          const arr = Object.keys(obj).map((key) => ({
            ...obj[key],
            id: key,
          })) as WithId<T>[];
          setData(arr);
        } else {
          setData([]);
        }
        setError(null);
        setIsLoading(false);
      },
      (error: Error) => {
        console.error("Firebase Realtime Database error:", error);
        setError(error);
        setData(null);
        setIsLoading(false);
      }
    );

    return () => {
      off(dbRef, "value", unsubscribe);
    };
  }, [path, database]);

  return { data, isLoading, error };
}

/**
 * Hook for fetching a single document/node from Realtime Database.
 * Automatically adds the ID to the returned object.
 *
 * @template T Type of the document
 * @param {string | null | undefined} path - The database path to the specific node
 * @returns {UseRealtimeValueResult<WithId<T>>} Document with ID
 */
export function useRealtimeDoc<T = any>(
  path: string | null | undefined
): UseRealtimeValueResult<WithId<T>> {
  const firebaseApp = useFirebaseApp();
  const database = getDatabase(firebaseApp);

  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const dbRef = ref(database, path);

    const unsubscribe = onValue(
      dbRef,
      (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
          const value = snapshot.val();
          // Extract ID from the path (last segment)
          const pathSegments = path.split("/");
          const id = pathSegments[pathSegments.length - 1];
          setData({ ...value, id } as WithId<T>);
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (error: Error) => {
        console.error("Firebase Realtime Database error:", error);
        setError(error);
        setData(null);
        setIsLoading(false);
      }
    );

    return () => {
      off(dbRef, "value", unsubscribe);
    };
  }, [path, database]);

  return { data, isLoading, error };
}
