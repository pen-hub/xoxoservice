"use client";

import ROLES_CONFIG from "@/configs/role";
import { useUser } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ProtectedRoutes = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const { user, isUserLoading } = useUser();

  const [allowedPaths, setAllowedPaths] = useState<string[] | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (isUserLoading) {
      setHasChecked(false);
      setAllowedPaths(null);
      return;
    }

    if (!user) {
      setHasChecked(true);
      setAllowedPaths(null);
      router.replace("/auth");
      return;
    }

    const run = async () => {
      try {
        const token = await user.getIdTokenResult();
        const role = token.claims.role;

        const paths = ROLES_CONFIG[role as keyof typeof ROLES_CONFIG] || [];

        setAllowedPaths(paths);
        setHasChecked(true);

        if (paths.includes("all")) {
          return;
        }

        // Helper function to check if a path is allowed (with prefix matching)
        const isPathAllowed = (path: string): boolean => {
          if (paths.includes("all")) return true;

          // Normalize path
          const normalizedPath = path.startsWith("/") ? path : `/${path}`;
          const cleanPath =
            normalizedPath.endsWith("/") && normalizedPath !== "/"
              ? normalizedPath.slice(0, -1)
              : normalizedPath;

          // Check exact match or prefix match
          return paths.some((allowedPath) => {
            if (allowedPath === "all") return true;

            const normalizedAllowed = allowedPath.startsWith("/")
              ? allowedPath
              : `/${allowedPath}`;
            const cleanAllowed =
              normalizedAllowed.endsWith("/") && normalizedAllowed !== "/"
                ? normalizedAllowed.slice(0, -1)
                : normalizedAllowed;

            // Exact match
            if (cleanPath === cleanAllowed) return true;

            // Prefix match: if current path starts with allowed path + "/"
            if (cleanPath.startsWith(cleanAllowed + "/")) return true;

            return false;
          });
        };

        if (!isPathAllowed(pathname)) {
          router.replace("/403");
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        setAllowedPaths(null);
        setHasChecked(true);
      }
    };

    run();
  }, [user, isUserLoading, pathname, router]);

  // Don't render children until we've checked permissions and user is authenticated
  if (!hasChecked || isUserLoading || !user || !allowedPaths) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoutes;
