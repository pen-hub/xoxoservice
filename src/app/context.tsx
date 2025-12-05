import { FirebaseClientProvider } from "@/firebase";
import { AppThemeProvider } from "@/providers/AppThemeProvider";
import React from "react";

const AppContext = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <FirebaseClientProvider>
        <AppThemeProvider>{children}</AppThemeProvider>
      </FirebaseClientProvider>
    </>
  );
};

export default AppContext;
