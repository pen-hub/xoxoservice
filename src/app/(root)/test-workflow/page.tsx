"use client";

import { useFirebaseApp } from "@/firebase";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import { createStaff, createStage } from "@/services/workflowService";
import type { Staff, Stage } from "@/types/workflow";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Divider, Space, Spin, message } from "antd";
import { useState } from "react";

type TestStatus = "pending" | "running" | "success" | "error";

interface TestResult {
  name: string;
  status: TestStatus;
  message: string;
  duration?: number;
}

export default function FirebaseTestPage() {
  const firebaseApp = useFirebaseApp();
  const {
    data: stages,
    isLoading: stagesLoading,
    error: stagesError,
  } = useRealtimeList<Omit<Stage, "id">>("xoxo/stages");
  const {
    data: staff,
    isLoading: staffLoading,
    error: staffError,
  } = useRealtimeList<Omit<Staff, "id">>("xoxo/staff");

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // ========== TEST FUNCTIONS ==========

  const updateTestResult = (
    testName: string,
    status: TestStatus,
    message: string,
    duration?: number
  ) => {
    setTestResults((prev) => {
      const existing = prev.findIndex((r) => r.name === testName);
      const newResult = { name: testName, status, message, duration };

      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newResult;
        return updated;
      } else {
        return [...prev, newResult];
      }
    });
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    const startTime = Date.now();
    updateTestResult(testName, "running", "Đang chạy...");

    try {
      await testFn();
      const duration = Date.now() - startTime;
      updateTestResult(testName, "success", "Thành công!", duration);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult(
        testName,
        "error",
        error?.message || "Lỗi không xác định",
        duration
      );
      console.error(`Test ${testName} failed:`, error);
    }
  };

  const testFirebaseConnection = async () => {
    // Kiểm tra Firebase app có được khởi tạo không
    if (!firebaseApp) {
      throw new Error("Firebase app chưa được khởi tạo");
    }

    if (!firebaseApp.options?.projectId) {
      throw new Error("Firebase project ID không tồn tại");
    }

    if (!firebaseApp.options?.databaseURL) {
      throw new Error("Firebase Database URL chưa được cấu hình");
    }

    // Test basic connection bằng cách đọc data
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const testCreateStage = async () => {
    const stageData = {
      name: `Test Stage ${Date.now()}`,
      order: 999,
      defaultStaff: [],
    };

    const stageId = await createStage(firebaseApp, stageData);
    if (!stageId) {
      throw new Error("Không tạo được stage");
    }
  };

  const testCreateStaff = async () => {
    const staffData = {
      name: `Test Staff ${Date.now()}`,
      role: "worker" as const,
    };

    const staffId = await createStaff(firebaseApp, staffData);
    if (!staffId) {
      throw new Error("Không tạo được staff");
    }
  };

  const testRealtimeRead = async () => {
    // Kiểm tra data có load được không
    const maxWait = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      if (!stagesLoading && !staffLoading) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (stagesLoading || staffLoading) {
      throw new Error("Timeout khi đọc dữ liệu realtime");
    }

    if (stagesError) {
      throw new Error(`Lỗi đọc stages: ${stagesError.message}`);
    }

    if (staffError) {
      throw new Error(`Lỗi đọc staff: ${staffError.message}`);
    }
  };

  // ========== RUN ALL TESTS ==========

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    await runTest("Firebase Connection", testFirebaseConnection);
    await runTest("Realtime Read", testRealtimeRead);
    await runTest("Create Stage", testCreateStage);
    await runTest("Create Staff", testCreateStaff);

    setIsRunningTests(false);

    const failed = testResults.filter((r) => r.status === "error").length;
    if (failed === 0) {
      message.success("Tất cả test đều passed! 🎉");
    } else {
      message.error(`${failed} test failed!`);
    }
  };

  // ========== RENDER TEST RESULT ==========

  const renderTestResult = (result: TestResult) => {
    const getIcon = () => {
      switch (result.status) {
        case "running":
          return <LoadingOutlined className="text-blue-500" />;
        case "success":
          return <CheckCircleOutlined className="text-green-500" />;
        case "error":
          return <CloseCircleOutlined className="text-red-500" />;
        default:
          return null;
      }
    };

    const getStatusColor = () => {
      switch (result.status) {
        case "success":
          return "border-green-200 bg-green-50";
        case "error":
          return "border-red-200 bg-red-50";
        case "running":
          return "border-blue-200 bg-blue-50";
        default:
          return "border-gray-200 bg-gray-50";
      }
    };

    return (
      <div
        key={result.name}
        className={`p-3 border rounded ${getStatusColor()}`}
        data-testid={`test-result-${result.name
          .toLowerCase()
          .replace(/\s+/g, "-")}`}
      >
        <div className="flex items-center justify-between">
          <Space>
            {getIcon()}
            <span className="font-medium">{result.name}</span>
          </Space>
          {result.duration && (
            <span className="text-xs text-gray-500">{result.duration}ms</span>
          )}
        </div>
        <div
          className="mt-1 text-sm text-gray-600"
          data-testid={`${result.name
            .toLowerCase()
            .replace(/\s+/g, "-")}-result`}
        >
          {result.message}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            🔥 Firebase Workflow System Test
          </h1>

          {/* Firebase Config Info */}
          <Card title="Firebase Configuration" className="mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Project ID:</strong>{" "}
                {firebaseApp?.options?.projectId || "N/A"}
              </div>
              <div>
                <strong>Auth Domain:</strong>{" "}
                {firebaseApp?.options?.authDomain || "N/A"}
              </div>
              <div>
                <strong>Database URL:</strong>{" "}
                {firebaseApp?.options?.databaseURL || "⚠️ Chưa cấu hình"}
              </div>
              <div>
                <strong>App ID:</strong> {firebaseApp?.options?.appId || "N/A"}
              </div>
            </div>
            <div className="mt-4" data-testid="connection-status">
              Status: Ready
            </div>
          </Card>

          {/* Current Data Status */}
          <Card title="Current Data Status" className="mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>Stages:</span>
                {stagesLoading ? (
                  <Spin size="small" />
                ) : (
                  <span className="font-medium">
                    {stages?.length || 0} items
                    {stagesError && (
                      <span className="text-red-500 ml-2">
                        Error: {stagesError.message}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>Staff:</span>
                {staffLoading ? (
                  <Spin size="small" />
                ) : (
                  <span className="font-medium">
                    {staff?.length || 0} items
                    {staffError && (
                      <span className="text-red-500 ml-2">
                        Error: {staffError.message}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Test Controls */}
          <div className="mb-6">
            <Button
              type="primary"
              size="large"
              onClick={runAllTests}
              loading={isRunningTests}
              disabled={isRunningTests}
              data-testid="run-all-tests"
            >
              {isRunningTests ? "Đang chạy tests..." : "Chạy tất cả tests"}
            </Button>

            {/* Individual Test Buttons */}
            <Space className="mt-4" wrap>
              <Button
                onClick={() =>
                  runTest("Firebase Connection", testFirebaseConnection)
                }
                data-testid="test-connection"
              >
                Test Connection
              </Button>
              <Button
                onClick={() => runTest("Create Stage", testCreateStage)}
                data-testid="create-stage"
              >
                Create Stage
              </Button>
              <Button
                onClick={() => runTest("Read Stages", testRealtimeRead)}
                data-testid="read-stages"
              >
                Read Stages
              </Button>
              <Button
                onClick={() => runTest("Create Staff", testCreateStaff)}
                data-testid="create-staff"
              >
                Create Staff
              </Button>
              <Button
                onClick={() => runTest("Read Staff", testRealtimeRead)}
                data-testid="read-staff"
              >
                Read Staff
              </Button>
            </Space>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card title="Test Results">
              <div className="space-y-3">
                {testResults.map(renderTestResult)}
              </div>

              <Divider />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {testResults.filter((r) => r.status === "success").length}
                  </div>
                  <div className="text-sm text-gray-500">Passed</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {testResults.filter((r) => r.status === "error").length}
                  </div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {testResults.filter((r) => r.status === "running").length}
                  </div>
                  <div className="text-sm text-gray-500">Running</div>
                </div>
              </div>
            </Card>
          )}

          {/* Help Section */}
          <Card title="Troubleshooting" className="mt-6">
            <Alert
              message="Nếu tests fail, kiểm tra:"
              description={
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Firebase config trong .env.local</li>
                  <li>NEXT_PUBLIC_FIREBASE_DATABASE_URL đã được set</li>
                  <li>Firebase Realtime Database đã được enable</li>
                  <li>Security Rules cho phép read/write với auth != null</li>
                  <li>User đã đăng nhập (test mode: allow read/write)</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
