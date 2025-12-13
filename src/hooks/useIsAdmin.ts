import { useUser } from "@/firebase";
import { ROLES } from "@/types/enum";
import { useEffect, useState } from "react";

/**
 * Hook to check if the current user is an admin
 * @returns { isAdmin: boolean; isLoading: boolean }
 */
export const useIsAdmin = () => {
  const { user, isUserLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      setIsLoading(true);
      setIsAdmin(false);
      return;
    }

    if (!user) {
      setIsLoading(false);
      setIsAdmin(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const token = await user.getIdTokenResult();
        const role = token.claims.role;
        console.log(token, user, role,'111111111111111');
        setIsAdmin(role === ROLES.admin);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [user, isUserLoading]);

  return { isAdmin, isLoading };
};

