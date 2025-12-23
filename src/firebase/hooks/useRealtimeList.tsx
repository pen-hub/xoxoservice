"use client";

import { initializeFirebase } from "@/firebase";
import { off, onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";

const { database } = initializeFirebase();

export interface WithId<T> {
  id: string;
  data: T;
}

export interface UseRealtimeListResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook để lấy danh sách dữ liệu realtime từ Firebase Realtime Database
 */
export function useRealtimeList<T = any>(
  path: string | null
): UseRealtimeListResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const dbRef = ref(database, path);

    const handleValue = (snapshot: any) => {
      try {
        setIsLoading(false);

        if (!snapshot.exists()) {
          setData([]);
          return;
        }

        const value = snapshot.val();
        const result: WithId<T>[] = [];

        // Convert object to array with id
        Object.keys(value).forEach((key) => {
          result.push({
            id: key,
            data: value[key],
          } as WithId<T>);
        });

        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setIsLoading(false);
      }
    };

    const handleError = (err: any) => {
      setError(err instanceof Error ? err : new Error("Database error"));
      setIsLoading(false);
    };

    // Subscribe to changes
    onValue(dbRef, handleValue, handleError);

    // Cleanup subscription
    return () => {
      off(dbRef, "value", handleValue);
    };
  }, [path]);

  return { data, isLoading, error };
}
