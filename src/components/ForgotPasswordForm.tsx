"use client";

import { useAuth } from "@/firebase/provider";
import { MailOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Result } from "antd";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";

interface ForgotPasswordFormProps {
  setView: (view: "login" | "signup" | "forgot-password") => void;
}

interface ForgotPasswordFormData {
  email: string;
}

export function ForgotPasswordForm({ setView }: ForgotPasswordFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const auth = useAuth();

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      setError(null);

      await sendPasswordResetEmail(auth, values.email);
      setSuccess(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    switch (error.code) {
      case "auth/user-not-found":
        return "Không tìm thấy tài khoản với email này";
      case "auth/invalid-email":
        return "Email không hợp lệ";
      case "auth/too-many-requests":
        return "Quá nhiều lần thử. Vui lòng thử lại sau";
      default:
        return "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại";
    }
  };

  if (success) {
    return (
      <div className="w-full bg-card rounded-lg shadow-lg p-8 border">
        <Result
          status="success"
          title="Email đã được gửi!"
          subTitle="Vui lòng kiểm tra email của bạn và làm theo hướng dẫn để đặt lại mật khẩu."
          extra={[
            <Button
              type="primary"
              key="back-to-login"
              onClick={() => setView("login")}
            >
              Quay lại đăng nhập
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-card rounded-lg shadow-lg p-8 border">
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          className="mb-4"
          closable
          onClose={() => setError(null)}
        />
      )}

      <Form
        form={form}
        name="forgot-password"
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
            prefix={<MailOutlined />}
            placeholder="Nhập email của bạn"
            size="large"
            autoComplete="email"
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
            Gửi email đặt lại mật khẩu
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center mt-4">
        <button
          onClick={() => setView("login")}
          className="text-primary hover:text-primary/80 font-medium"
        >
          ← Quay lại đăng nhập
        </button>
      </div>
    </div>
  );
}
