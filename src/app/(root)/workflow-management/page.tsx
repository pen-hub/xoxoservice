"use client";

import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import {
  AppstoreOutlined,
  DashboardOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Space, Spin, Statistic, Tabs } from "antd";
import { useState } from "react";

export default function WorkflowManagementPage() {
  // ========== FIREBASE DATA ==========
  const {
    data: workflows,
    isLoading: loadingWorkflows,
    error: errorWorkflows,
  } = useRealtimeList<any>("xoxo/workflows");
  const {
    data: employees,
    isLoading: loadingEmployees,
    error: errorEmployees,
  } = useRealtimeList<any>("xoxo/employees");
  const {
    data: orders,
    isLoading: loadingOrders,
    error: errorOrders,
  } = useRealtimeList<any>("xoxo/orders");

  // ========== STATE ==========
  const [activeTab, setActiveTab] = useState("workflows");

  // ========== STATISTICS ==========
  const stats = {
    totalOrders: orders?.length || 0,
    totalEmployees: employees?.length || 0,
    totalWorkflows: workflows?.length || 0,
    activeOrders: orders?.filter((o) => o.status === "active").length || 0,
  };

  // ========== DEBUG LOGS ==========
  console.log("🔥 Firebase Loading States:", {
    loadingWorkflows,
    loadingEmployees,
    loadingOrders,
  });
  console.log("🔥 Firebase Errors:", {
    errorWorkflows,
    errorEmployees,
    errorOrders,
  });
  console.log("🔥 Firebase Data:", {
    workflows: workflows?.length ? workflows.slice(0, 2) : workflows,
    employees: employees?.length ? employees.slice(0, 2) : employees,
    orders: orders?.length ? orders.slice(0, 2) : orders,
  });
  console.log("🔥 Firebase Config:", {
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });

  // ========== ERROR HANDLING ==========
  const hasErrors = errorWorkflows || errorEmployees || errorOrders;

  if (hasErrors) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              🚫 Lỗi Firebase Connection
            </h2>
            <div className="space-y-2 text-left">
              {errorWorkflows && (
                <p className="text-red-500">
                  ❌ Workflows: {errorWorkflows.message}
                </p>
              )}
              {errorEmployees && (
                <p className="text-red-500">
                  ❌ Employees: {errorEmployees.message}
                </p>
              )}
              {errorOrders && (
                <p className="text-red-500">❌ Orders: {errorOrders.message}</p>
              )}
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
              <p className="text-sm text-yellow-700">
                <strong>Nguyên nhân:</strong> Firebase Database Rules chặn quyền
                truy cập.
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                <strong>Giải pháp:</strong> Xem file{" "}
                <code>FIREBASE_RULES_FIX.md</code>
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ========== LOADING STATE ==========
  if (loadingWorkflows || loadingEmployees || loadingOrders) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Hệ thống quản lý sản xuất XOXO
              </h1>
              <p className="text-gray-500 mt-1">
                Theo dõi và quản lý quy trình sản xuất realtime
              </p>
            </div>
          </div>

          {/* Statistics */}
          <Row gutter={16} className="mt-6">
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Tổng đơn hàng"
                  value={stats.totalOrders}
                  prefix={<ShoppingCartOutlined />}
                  styles={{ content: { color: "#3f8600" } }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Đơn đang xử lý"
                  value={stats.activeOrders}
                  prefix={<DashboardOutlined />}
                  styles={{ content: { color: "#1890ff" } }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Nhân viên"
                  value={stats.totalEmployees}
                  prefix={<UserOutlined />}
                  styles={{ content: { color: "#cf1322" } }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Công đoạn"
                  value={stats.totalWorkflows}
                  prefix={<AppstoreOutlined />}
                  styles={{ content: { color: "#722ed1" } }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: "workflows",
              label: (
                <Space>
                  <AppstoreOutlined />
                  <span>Workflows</span>
                </Space>
              ),
              children: (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Workflow Templates
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workflows?.map((workflow: any) => (
                      <Card
                        key={workflow.id}
                        size="small"
                        className="border-l-4 border-l-blue-500"
                      >
                        <h3 className="font-semibold text-lg">
                          {workflow.name}
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            Default Employees:
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {workflow.defaultEmployees?.map((empId: string) => (
                              <span
                                key={empId}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                              >
                                {empId}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Created:{" "}
                          {new Date(
                            workflow.createdAt * 1000
                          ).toLocaleDateString()}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: "employees",
              label: (
                <Space>
                  <UserOutlined />
                  <span>Nhân viên</span>
                </Space>
              ),
              children: (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Danh sách nhân viên
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees?.map((employee: any) => (
                      <Card
                        key={employee.id}
                        size="small"
                        className="border-l-4 border-l-green-500"
                      >
                        <h3 className="font-semibold text-lg">
                          {employee.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          ID: {employee.id}
                        </p>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            employee.role === "manager"
                              ? "bg-red-100 text-red-800"
                              : employee.role === "qc"
                              ? "bg-yellow-100 text-yellow-800"
                              : employee.role === "sale"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {employee.role}
                        </span>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: "orders",
              label: (
                <Space>
                  <ShoppingCartOutlined />
                  <span>Đơn hàng</span>
                </Space>
              ),
              children: (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Danh sách đơn hàng
                  </h2>
                  <div className="space-y-4">
                    {orders?.slice(0, 5).map((order: any) => (
                      <Card
                        key={order.id}
                        size="small"
                        className="border-l-4 border-l-orange-500"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {order.code}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Customer: {order.customerName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Created:{" "}
                              {new Date(
                                order.createdAt * 1000
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {Object.keys(order.products || {}).length}{" "}
                              products
                            </p>
                            <p className="text-xs text-gray-500">
                              Created by: {order.createdBy}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: "settings",
              label: (
                <Space>
                  <SettingOutlined />
                  <span>Cài đặt</span>
                </Space>
              ),
              children: (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Cài đặt hệ thống
                  </h2>
                  <div className="space-y-4 text-gray-600">
                    <div className="p-4 bg-blue-50 rounded">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        📌 Database Structure
                      </h3>
                      <pre className="text-xs bg-white p-3 rounded mt-2">
                        {`xoxo/
├── workflows/
│   └── {workflowId}: {name, defaultEmployees[], createdAt}
├── employees/
│   └── {employeeId}: {name, role}
└── orders/
    └── {orderId}/
        ├── code, customerName, createdBy, createdAt
        └── products/
            └── {productId}/
                ├── name, quantity
                └── steps/
                    └── {stepId}: {workflowId, name, employees{}, status, completedQuantity, updatedAt}`}
                      </pre>
                    </div>

                    <div className="p-4 bg-green-50 rounded">
                      <h3 className="font-semibold text-green-900 mb-2">
                        ✅ Tính năng
                      </h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Realtime sync với Firebase Realtime Database</li>
                        <li>Multi-product per order</li>
                        <li>Multi-steps per product</li>
                        <li>Multi-employee assignment per step</li>
                        <li>Progress tracking (completedQuantity, status)</li>
                        <li>
                          Path structure: xoxo/workflows, xoxo/employees,
                          xoxo/orders
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded">
                      <h3 className="font-semibold text-yellow-900 mb-2">
                        ⚠️ Lưu ý
                      </h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          Phải tạo ít nhất 1 workflow trước khi tạo đơn hàng
                        </li>
                        <li>
                          Mọi thay đổi được đồng bộ realtime, không cần refresh
                          trang
                        </li>
                        <li>
                          Dữ liệu được lưu trong path xoxo/ theo Firebase rules
                        </li>
                        <li>Security rules yêu cầu auth != null</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
