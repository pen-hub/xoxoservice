"use client";

import { getSdks } from "@/firebase";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { useEffect, useState } from "react";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Firebase and get auth instance
  const [authInstance, setAuthInstance] = useState<any>(null);

  useEffect(() => {
    const { auth } = getSdks(null as any);
    setAuthInstance(auth);
  }, []);

  useEffect(() => {
    if (!authInstance) return;

    const unsubscribe = onAuthStateChanged(
      authInstance,
      (firebaseUser: User | null) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authInstance]);

  const login = async (email: string, password: string): Promise<void> => {
    if (!authInstance) throw new Error("Auth not initialized");
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(authInstance, email, password);
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<void> => {
    if (!authInstance) throw new Error("Auth not initialized");
    try {
      setError(null);
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        authInstance,
        email,
        password
      );

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    if (!authInstance) throw new Error("Auth not initialized");
    try {
      setError(null);
      await signOut(authInstance);
    } catch (err: any) {
      setError(err.message || "Đăng xuất thất bại");
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };
}
