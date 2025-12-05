"use client";

import { useAuth } from "@/firebase/provider";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Divider, Form, Input } from "antd";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SignupFormProps {
  setView: (view: "login" | "signup" | "forgot-password") => void;
}

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export function SignupForm({ setView }: SignupFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const router = useRouter();

  const handleSubmit = async (values: SignupFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Tạo tài khoản
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      // Cập nhật tên hiển thị
      await updateProfile(userCredential.user, {
        displayName: values.displayName,
      });

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "Email này đã được sử dụng";
      case "auth/invalid-email":
        return "Email không hợp lệ";
      case "auth/operation-not-allowed":
        return "Đăng ký email/mật khẩu chưa được kích hoạt";
      case "auth/weak-password":
        return "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn";
      default:
        return "Đăng ký thất bại. Vui lòng thử lại";
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
        name="signup"
        onFinish={handleSubmit}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="displayName"
          label="Họ và tên"
          rules={[
            { required: true, message: "Vui lòng nhập họ và tên!" },
            { min: 2, message: "Họ và tên phải ít nhất 2 ký tự!" },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Nhập họ và tên của bạn"
            size="large"
            autoComplete="name"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Vui lòng nhập email!" },
            { type: "email", message: "Email không hợp lệ!" },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Nhập email của bạn"
            size="large"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu!" },
            { min: 6, message: "Mật khẩu phải ít nhất 6 ký tự!" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu của bạn"
            size="large"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Mật khẩu xác nhận không khớp!")
                );
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Xác nhận mật khẩu của bạn"
            size="large"
            autoComplete="new-password"
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
            Đăng ký
          </Button>
        </Form.Item>
      </Form>

      <Divider>hoặc</Divider>

      <div className="text-center">
        <p className="text-muted-foreground">
          Đã có tài khoản?{" "}
          <button
            onClick={() => setView("login")}
            className="text-primary hover:text-primary/80 font-medium"
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </div>
  );
}
