"use client";

import { useAuth } from "@/firebase/provider";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Divider, Form, Input } from "antd";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LoginFormProps {
  setView: (view: "login" | "signup" | "forgot-password") => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm({ setView }: LoginFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const router = useRouter();

  const handleSubmit = async (values: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);

      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push("/center");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    switch (error.code) {
      case "auth/user-not-found":
        return "Không tìm thấy tài khoản với email này";
      case "auth/wrong-password":
        return "Mật khẩu không đúng";
      case "auth/invalid-email":
        return "Email không hợp lệ";
      case "auth/too-many-requests":
        return "Quá nhiều lần thử. Vui lòng thử lại sau";
      default:
        return "Đăng nhập thất bại. Vui lòng thử lại";
    }
  };

  return (
    <div className="w-full bg-card rounded-lg shadow-lg p-8 border">
      {error && (
        <Alert
          title={error}
          type="error"
          showIcon
          className="mb-4"
          closable
          onClose={() => setError(null)}
        />
      )}

      <Form
        form={form}
        name="login"
        onFinish={handleSubmit}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Vui lòng nhập email!" },
            { type: "email", message: "Email không hợp lệ!" },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Nhập email của bạn"
            size="large"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu của bạn"
            size="large"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            className="w-full"
          >
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>

      <Divider>hoặc</Divider>

      <div className="text-center space-y-2">
        <p className="text-muted-foreground">
          Chưa có tài khoản?{" "}
          <button
            onClick={() => setView("signup")}
            className="text-primary hover:text-primary/80 font-medium"
          >
            Đăng ký ngay
          </button>
        </p>
        <p>
          <button
            onClick={() => setView("forgot-password")}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Quên mật khẩu?
          </button>
        </p>
      </div>
    </div>
  );
}
