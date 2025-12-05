"use client";

import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";
import { useState } from "react";

type AuthView = "login" | "signup" | "forgot-password";

export default function AuthPage() {
  const [view, setView] = useState<AuthView>("login");

  const renderView = () => {
    switch (view) {
      case "signup":
        return <SignupForm setView={setView} />;
      case "forgot-password":
        return <ForgotPasswordForm setView={setView} />;
      case "login":
      default:
        return <LoginForm setView={setView} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background font-body selection:bg-primary/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-primary font-sans">
            XOXO
          </h1>
          <p className="text-muted-foreground">
            {view === "login" &&
              "Chào mừng bạn quay trở lại! Vui lòng đăng nhập vào tài khoản của bạn."}
            {view === "signup" &&
              "Tạo tài khoản để bắt đầu quản lý spa của bạn."}
            {view === "forgot-password" && "Đặt lại mật khẩu của bạn."}
          </p>
        </div>
        {renderView()}
      </div>
    </div>
  );
}
