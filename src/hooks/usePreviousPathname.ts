"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const CURRENT_KEY = "nav_current";
const PREVIOUS_KEY = "nav_previous";

export function usePreviousPathname() {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  const isFirstMount = useRef(true);

  const [previous, setPrevious] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;

    const storedCurrent = sessionStorage.getItem(CURRENT_KEY);
    const storedPrevious = sessionStorage.getItem(PREVIOUS_KEY);


    if (storedCurrent && storedCurrent !== pathname) {
      return storedCurrent;
    }


    return storedPrevious || null;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isFirstMount.current) {
      const storedCurrent = sessionStorage.getItem(CURRENT_KEY);

      if (storedCurrent && storedCurrent !== pathname) {
        sessionStorage.setItem(PREVIOUS_KEY, storedCurrent);
        setPrevious(storedCurrent);
      }

      sessionStorage.setItem(CURRENT_KEY, pathname);
      prevPathnameRef.current = pathname;
      isFirstMount.current = false;
      return;
    }

    if (prevPathnameRef.current !== pathname) {
      sessionStorage.setItem(PREVIOUS_KEY, prevPathnameRef.current || "");
      setPrevious(prevPathnameRef.current);

      sessionStorage.setItem(CURRENT_KEY, pathname);
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  return previous;
}
