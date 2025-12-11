"use client";

import { useRealtimeList } from "@/firebase/hooks/useRealtimeList";
import { useUser } from "@/firebase/provider";
import { AppointmentService } from "@/services/appointmentService";
import { FeedbackService } from "@/services/feedbackService";
import { InventoryService } from "@/services/inventoryService";
import { RefundService } from "@/services/refundService";
import { WarrantyClaimService } from "@/services/warrantyClaimService";
import { WarrantyService } from "@/services/warrantyService";
import type { Appointment } from "@/types/appointment";
import type { CustomerFeedback } from "@/types/feedback";
import { FirebaseOrderData } from "@/types/order";
import type { RefundRequest } from "@/types/refund";
import type { WarrantyRecord } from "@/types/warranty";
import type { WarrantyClaim } from "@/types/warrantyClaim";
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  TeamOutlined,
  TrophyOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  Avatar,
  Badge,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi";
import relativeTime from "dayjs/plugin/relativeTime";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

// Date presets for RangePicker
const rangePresets: {
  label: string;
  value: [Dayjs, Dayjs];
}[] = [
  { label: "Hôm nay", value: [dayjs(), dayjs()] },
  {
    label: "Tuần này",
    value: [dayjs().startOf("week"), dayjs().endOf("week")],
  },
  {
    label: "Tháng này",
    value: [dayjs().startOf("month"), dayjs().endOf("month")],
  },
  {
    label: "Tháng trước",
    value: [
      dayjs().subtract(1, "month").startOf("month"),
      dayjs().subtract(1, "month").endOf("month"),
    ],
  },
  {
    label: "Quý này",
    value: [
      dayjs()
        .month(Math.floor(dayjs().month() / 3) * 3)
        .startOf("month"),
      dayjs()
        .month(Math.floor(dayjs().month() / 3) * 3 + 2)
        .endOf("month"),
    ],
  },
  {
    label: "Năm này",
    value: [dayjs().startOf("year"), dayjs().endOf("year")],
  },
];

interface WorkflowProcess {
  id: string;
  name: string;
  status: "active" | "pending" | "completed" | "blocked";
  totalTasks: number;
  completedTasks: number;
  workflows: number;
  members: number;
  discussions: number;
  avgCompletionTime: number; // in hours
  currentWorkflow: string;
  progress: number;
  priority: "high" | "medium" | "low";
  lastUpdate: string;
}

interface KanbanTask {
  id: string;
  title: string;
  process: string;
  assignee: string;
  workflow: string;
  priority: "high" | "medium" | "low";
  dueDate: string;
}

// Convert Firebase order to display format
interface DisplayOrder {
  id: string;
  code: string;
  customer: string;
  phone: string;
  status: string;
  totalAmount: number;
  date: string;
  createdAt: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  status: "processing" | "completed" | "pending";
  totalAmount: number;
  createdAt: string;
  date: string; // Add date for filtering
  branch: string; // Add branch for filtering
}

// Categories for statistics
const projectCategories = [
  {
    name: "Đơn hàng",
    count: 0, // Will be calculated from real data
    color: "#1890ff",
    icon: FileTextOutlined,
  },
  {
    name: "Bảo hành",
    count: 0, // Will be calculated from real data
    color: "#52c41a",
    icon: SafetyCertificateOutlined,
  },
  {
    name: "Feedback",
    count: 0, // Will be calculated from real data
    color: "#faad14",
    icon: CommentOutlined,
  },
  {
    name: "Hoàn tiền",
    count: 0, // Will be calculated from real data
    color: "#ff4d4f",
    icon: DollarOutlined,
  },
];

const getStatusColor = (status: string) => {
  const colors = {
    active: "processing",
    completed: "success",
    pending: "default",
    blocked: "error",
  };
  return colors[status as keyof typeof colors] || "default";
};

const getStatusText = (status: string) => {
  const texts = {
    active: "Đang thực hiện",
    completed: "Hoàn thành",
    pending: "Chưa bắt đầu",
    blocked: "Bị chặn",
  };
  return texts[status as keyof typeof texts] || status;
};

const getPriorityColor = (priority: string) => {
  const colors = {
    high: "red",
    medium: "orange",
    low: "blue",
  };
  return colors[priority as keyof typeof colors] || "default";
};

const getPriorityText = (priority: string) => {
  const texts = {
    high: "Cao",
    medium: "Trung bình",
    low: "Thấp",
  };
  return texts[priority as keyof typeof texts] || priority;
};

export default function DashboardPage() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [filterForm] = Form.useForm();
  const { user, isUserLoading, userError } = useUser();

  // Fetch real data from Firebase
  const { data: ordersData, isLoading: ordersLoading } =
    useRealtimeList<FirebaseOrderData>("xoxo/orders");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [
          appointmentsData,
          materialsData,
          feedbacksData,
          refundsData,
          warrantiesData,
          warrantyClaimsData,
        ] = await Promise.all([
          AppointmentService.getAll(),
          InventoryService.getAllMaterials(),
          FeedbackService.getAll(),
          RefundService.getAll(),
          WarrantyService.getAll(),
          WarrantyClaimService.getAll(),
        ]);
        setAppointments(appointmentsData);
        setMaterials(materialsData);
        setFeedbacks(feedbacksData);
        setRefunds(refundsData);
        setWarranties(warrantiesData);
        setWarrantyClaims(warrantyClaimsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubAppt = AppointmentService.onSnapshot((data) => {
      setAppointments(data);
    });
    const unsubFeedback = FeedbackService.onSnapshot((data) => {
      setFeedbacks(data);
    });
    const unsubRefund = RefundService.onSnapshot((data) => {
      setRefunds(data);
    });
    const unsubWarranty = WarrantyService.onSnapshot((data) => {
      setWarranties(data);
    });
    const unsubWarrantyClaim = WarrantyClaimService.onSnapshot((data) => {
      setWarrantyClaims(data);
    });

    return () => {
      unsubAppt?.();
      unsubFeedback?.();
      unsubRefund?.();
      unsubWarranty?.();
      unsubWarrantyClaim?.();
    };
  }, []);

  useEffect(() => {
    (async () => {
      const data = await user?.getIdTokenResult();
      console.log(data, pathname);
    })();
  }, [isUserLoading, userError]);

  // Convert Firebase orders to display format
  const displayOrders = useMemo<DisplayOrder[]>(() => {
    if (!ordersData) return [];
    return ordersData
      .map((item) => ({
        id: item.id,
        code: item.data.code || item.id,
        customer: item.data.customerName || "N/A",
        phone: item.data.phone || "-",
        status: item.data.status || "pending",
        totalAmount: item.data.totalAmount || 0,
        date: item.data.orderDate
          ? dayjs(item.data.orderDate).format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD"),
        createdAt: item.data.createdAt || item.data.orderDate || Date.now(),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [ordersData]);

  // Filter data based on date range and branch
  const filteredOrders = useMemo(() => {
    let filtered = [...displayOrders];

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((order) => {
        const orderDate = dayjs(order.date);
        return (
          orderDate.isAfter(dateRange[0].subtract(1, "day")) &&
          orderDate.isBefore(dateRange[1].add(1, "day"))
        );
      });
    }

    return filtered;
  }, [displayOrders, dateRange]);

  // Filter data by date range
  const filterByDateRange = <
    T extends { createdAt?: number; orderDate?: number; date?: number }
  >(
    data: T[]
  ): T[] => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return data;
    return data.filter((item) => {
      const itemDate = item.createdAt || item.orderDate || item.date;
      if (!itemDate) return false;
      const date = dayjs(itemDate);
      return (
        date.isAfter(dateRange[0].subtract(1, "day")) &&
        date.isBefore(dateRange[1].add(1, "day"))
      );
    });
  };

  // Filter appointments, feedbacks, refunds, warranties by date range
  const filteredAppointments = useMemo(
    () => filterByDateRange(appointments),
    [appointments, dateRange]
  );
  const filteredFeedbacks = useMemo(
    () => filterByDateRange(feedbacks),
    [feedbacks, dateRange]
  );
  const filteredRefunds = useMemo(
    () => filterByDateRange(refunds),
    [refunds, dateRange]
  );
  const filteredWarranties = useMemo(
    () => filterByDateRange(warranties),
    [warranties, dateRange]
  );
  const filteredWarrantyClaims = useMemo(
    () => filterByDateRange(warrantyClaims),
    [warrantyClaims, dateRange]
  );

  // Calculate filtered statistics
  const filteredStats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );
    const processingOrders = filteredOrders.filter(
      (o) => o.status === "processing" || o.status === "in_progress"
    ).length;
    const completedOrders = filteredOrders.filter(
      (o) => o.status === "completed" || o.status === "delivered"
    ).length;
    const newCustomers = new Set(filteredOrders.map((o) => o.customer)).size;
    const pendingOrders = filteredOrders.filter(
      (o) => o.status === "pending"
    ).length;

    // Warranty statistics
    const totalWarranties = filteredWarranties.length;
    const activeWarranties = filteredWarranties.filter((w) => {
      if (!w.endDate) return false;
      return dayjs(w.endDate).isAfter(dayjs());
    }).length;
    const warrantyClaimsCount = filteredWarrantyClaims.length;
    const warrantyRate =
      completedOrders > 0
        ? ((totalWarranties / completedOrders) * 100).toFixed(1)
        : "0";

    // Feedback statistics
    const totalFeedbacks = filteredFeedbacks.length;
    const positiveFeedbacks = filteredFeedbacks.filter(
      (f) => f.rating && f.rating >= 4
    ).length;
    const negativeFeedbacks = filteredFeedbacks.filter(
      (f) => f.rating && f.rating <= 2
    ).length;
    const avgRating =
      totalFeedbacks > 0
        ? (
            filteredFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) /
            totalFeedbacks
          ).toFixed(1)
        : "0";

    // Refund statistics
    const totalRefunds = filteredRefunds.length;
    const pendingRefunds = filteredRefunds.filter(
      (r) => r.status === "pending"
    ).length;
    const approvedRefunds = filteredRefunds.filter(
      (r) => r.status === "approved"
    ).length;
    const totalRefundAmount = filteredRefunds
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    // Appointment statistics
    const totalAppointments = filteredAppointments.length;
    const upcomingAppointments = filteredAppointments.filter((a) => {
      if (!a.scheduledDate) return false;
      return dayjs(a.scheduledDate).isAfter(dayjs());
    }).length;
    const completedAppointments = filteredAppointments.filter(
      (a) => a.status === "completed"
    ).length;

    return {
      totalRevenue,
      processingOrders,
      completedOrders,
      newCustomers,
      pendingOrders,
      totalOrders: filteredOrders.length,
      totalWarranties,
      activeWarranties,
      warrantyClaimsCount,
      warrantyRate,
      totalFeedbacks,
      positiveFeedbacks,
      negativeFeedbacks,
      avgRating,
      totalRefunds,
      pendingRefunds,
      approvedRefunds,
      totalRefundAmount,
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
    };
  }, [
    filteredOrders,
    filteredWarranties,
    filteredWarrantyClaims,
    filteredFeedbacks,
    filteredRefunds,
    filteredAppointments,
  ]);

  // Generate chart data from real data
  const chartData = useMemo(() => {
    // Revenue by month from orders
    const revenueByMonth: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      const month = dayjs(order.date).format("YYYY-MM");
      revenueByMonth[month] =
        (revenueByMonth[month] || 0) + (order.totalAmount || 0);
    });
    const revenueMonthlyData = Object.entries(revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        month: dayjs(month).format("MM/YYYY"),
        revenue,
      }));

    // Order completion rate by month
    const ordersByMonth: Record<string, { completed: number; total: number }> =
      {};
    filteredOrders.forEach((order) => {
      const month = dayjs(order.date).format("YYYY-MM");
      if (!ordersByMonth[month]) {
        ordersByMonth[month] = { completed: 0, total: 0 };
      }
      ordersByMonth[month].total++;
      if (order.status === "completed" || order.status === "delivered") {
        ordersByMonth[month].completed++;
      }
    });
    const orderRateData = Object.entries(ordersByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: dayjs(month).format("MM/YYYY"),
        completed: data.completed,
        total: data.total,
      }));

    // Customer source distribution
    const sourceCount: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      const source = order.customer || "Khác";
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });
    const leadSourceData = Object.entries(sourceCount)
      .map(([name, value]) => ({
        name,
        value,
        color: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"][
          Object.keys(sourceCount).indexOf(name) % 5
        ],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Update category counts
    const categories = [
      {
        name: "Đơn hàng",
        count: filteredOrders.length,
        color: "#1890ff",
        icon: FileTextOutlined,
      },
      {
        name: "Bảo hành",
        count: filteredWarranties.length,
        color: "#52c41a",
        icon: SafetyCertificateOutlined,
      },
      {
        name: "Feedback",
        count: filteredFeedbacks.length,
        color: "#faad14",
        icon: CommentOutlined,
      },
      {
        name: "Hoàn tiền",
        count: filteredRefunds.length,
        color: "#ff4d4f",
        icon: DollarOutlined,
      },
    ];

    return {
      revenueMonthlyData,
      orderRateData,
      leadSourceData,
      categories,
    };
  }, [filteredOrders, filteredWarranties, filteredFeedbacks, filteredRefunds]);
  // Remove mock data calculations - using real data from Firebase

  const processColumns: TableColumnsType<WorkflowProcess> = [
    {
      title: "Quy trình",
      dataIndex: "name",
      key: "name",
      width: 300,
      fixed: "left",
      render: (text: string, record: WorkflowProcess) => (
        <Space vertical size={0}>
          <Text strong>{text}</Text>
          <Text className="text-xs text-gray-500">
            Giai đoạn: {record.currentWorkflow}
          </Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: "Tiến độ",
      dataIndex: "progress",
      key: "progress",
      width: 200,
      render: (progress: number, record: WorkflowProcess) => (
        <Space vertical size="small" className="w-full">
          <Progress
            percent={progress}
            size="small"
            status={progress === 100 ? "success" : "active"}
          />
          <Text className="text-xs text-gray-500">
            {record.completedTasks}/{record.totalTasks} nhiệm vụ
          </Text>
        </Space>
      ),
    },
    {
      title: "Thành viên",
      dataIndex: "members",
      key: "members",
      width: 120,
      align: "center",
      render: (members: number) => (
        <Space>
          <TeamOutlined />
          <Text>{members}</Text>
        </Space>
      ),
    },
    {
      title: "Trao đổi",
      dataIndex: "discussions",
      key: "discussions",
      width: 100,
      align: "center",
      render: (discussions: number) => (
        <Badge count={discussions} showZero>
          <FileTextOutlined className="text-lg" />
        </Badge>
      ),
    },
    {
      title: "TG trung bình",
      dataIndex: "avgCompletionTime",
      key: "avgCompletionTime",
      width: 140,
      render: (hours: number) => (
        <Space>
          <ClockCircleOutlined />
          <Text>{hours}h</Text>
        </Space>
      ),
    },
    {
      title: "Cập nhật",
      dataIndex: "lastUpdate",
      key: "lastUpdate",
      width: 130,
      fixed: "right",
      render: (text: string) => <Text className="text-xs">{text}</Text>,
    },
  ];

  const renderKanbanColumn = (
    title: string,
    tasks: KanbanTask[],
    color: string
  ) => (
    <Col xs={24} sm={12} lg={6}>
      <Card
        title={
          <Space>
            <Badge color={color} />
            <Text strong>{title}</Text>
            <Badge count={tasks.length} style={{ backgroundColor: color }} />
          </Space>
        }
        styles={{ body: { padding: "12px" } }}
      >
        <Space vertical size="small" className="w-full">
          {tasks.map((task) => (
            <Card
              key={task.id}
              size="small"
              hoverable
              styles={{ body: { padding: "12px" } }}
            >
              <Space vertical size="small" className="w-full">
                <Text strong className="text-sm">
                  {task.title}
                </Text>
                <Text className="text-xs text-gray-500">{task.process}</Text>
                <div className="flex items-center justify-between">
                  <Tag
                    color={getPriorityColor(task.priority)}
                    className="text-xs"
                  >
                    {getPriorityText(task.priority)}
                  </Tag>
                  <Text className="text-xs text-gray-500">{task.dueDate}</Text>
                </div>
                <div className="flex items-center justify-between">
                  <Space size="small">
                    <Avatar size="small" className="bg-blue-500">
                      {task.assignee.charAt(0)}
                    </Avatar>
                    <Text className="text-xs">{task.assignee}</Text>
                  </Space>
                </div>
              </Space>
            </Card>
          ))}
        </Space>
      </Card>
    </Col>
  );

  return (
    <Space vertical size="large" className="w-full">
      {/* Header with Filters */}
      <Card className="shadow-sm">
        <Form form={filterForm} layout="inline" className="w-full">
          <Row gutter={[16, 16]} className="w-full">
            <Col xs={24} sm={12} lg={12}>
              <Form.Item
                label={
                  <Space>
                    <ClockCircleOutlined />
                    <span>Khoảng thời gian</span>
                  </Space>
                }
                className="mb-0"
              >
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => {
                    if (dates) {
                      setDateRange([dates[0]!, dates[1]!]);
                    } else {
                      setDateRange(null);
                    }
                  }}
                  presets={rangePresets}
                  format="DD/MM/YYYY"
                  className="w-full"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Header */}
      <Card
        className="border-none"
        style={{ background: "linear-gradient(to right, #eff6ff, #eef2ff)" }}
      >
        <Space direction="vertical" size="small" className="w-full">
          <Space align="center">
            <ProjectOutlined className="text-2xl text-blue-600" />
            <Title level={3} className="mb-0">
              Dashboard Thống Kê
            </Title>
          </Space>
          <Text className="text-gray-600">
            Tổng quan hiệu suất kinh doanh và quản lý đơn hàng
          </Text>
        </Space>
      </Card>

      {/* Business Statistics */}
      {ordersLoading || loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <Statistic
                title={
                  <Space>
                    <TrophyOutlined className="text-green-600" />
                    <span>Tổng doanh thu</span>
                  </Space>
                }
                value={filteredStats.totalRevenue}
                prefix="₫"
                formatter={(value) =>
                  `${((value as number) / 1000000).toFixed(1)}tr`
                }
                valueStyle={{ color: "#3f8600", fontSize: "24px" }}
              />
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-xs">
                  {filteredStats.totalOrders} đơn hàng
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <Statistic
                title={
                  <Space>
                    <FileTextOutlined className="text-blue-600" />
                    <span>Tổng đơn hàng</span>
                  </Space>
                }
                value={filteredStats.totalOrders}
                suffix="đơn"
                valueStyle={{ color: "#1890ff", fontSize: "24px" }}
              />
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-xs">
                  {filteredStats.newCustomers} khách hàng
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <Statistic
                title={
                  <Space>
                    <SyncOutlined spin className="text-orange-600" />
                    <span>Đơn đang xử lý</span>
                  </Space>
                }
                value={filteredStats.processingOrders}
                suffix="đơn"
                valueStyle={{ color: "#faad14", fontSize: "24px" }}
              />
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-xs">
                  {filteredStats.pendingOrders} đơn chờ xử lý
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <Statistic
                title={
                  <Space>
                    <CheckCircleOutlined className="text-green-600" />
                    <span>Đơn đã hoàn thiện</span>
                  </Space>
                }
                value={filteredStats.completedOrders}
                suffix="đơn"
                valueStyle={{ color: "#52c41a", fontSize: "24px" }}
              />
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-xs">
                  {filteredStats.totalOrders > 0
                    ? `${Math.round(
                        (filteredStats.completedOrders /
                          filteredStats.totalOrders) *
                          100
                      )}% hoàn thành`
                    : "0% hoàn thành"}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Additional Statistics */}
      {ordersLoading || loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <Statistic
                title={
                  <Space>
                    <SafetyCertificateOutlined className="text-blue-600" />
                    <span>Bảo hành</span>
                  </Space>
                }
                value={filteredStats.totalWarranties}
                suffix="phiếu"
                valueStyle={{ color: "#1890ff", fontSize: "24px" }}
              />
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-xs">
                  {filteredStats.activeWarranties} đang hoạt động •{" "}
                  {filteredStats.warrantyRate}% tỷ lệ
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <Statistic
                title={
                  <Space>
                    <CommentOutlined className="text-orange-600" />
                    <span>Feedback</span>
                  </Space>
                }
                value={filteredStats.totalFeedbacks}
                suffix="phản hồi"
                valueStyle={{ color: "#faad14", fontSize: "24px" }}
              />
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-xs">
                  Đánh giá TB: {filteredStats.avgRating}/5 •{" "}
                  {filteredStats.positiveFeedbacks} tích cực
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
              <Statistic
                title={
                  <Space>
                    <DollarOutlined className="text-red-600" />
                    <span>Hoàn tiền</span>
                  </Space>
                }
                value={filteredStats.totalRefunds}
                suffix="yêu cầu"
                valueStyle={{ color: "#ff4d4f", fontSize: "24px" }}
              />
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-xs">
                  {filteredStats.pendingRefunds} chờ xử lý •{" "}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(filteredStats.totalRefundAmount)}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
              <Statistic
                title={
                  <Space>
                    <ClockCircleOutlined className="text-purple-600" />
                    <span>Lịch hẹn</span>
                  </Space>
                }
                value={filteredStats.totalAppointments}
                suffix="cuộc hẹn"
                valueStyle={{ color: "#722ed1", fontSize: "24px" }}
              />
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-xs">
                  {filteredStats.upcomingAppointments} sắp tới •{" "}
                  {filteredStats.completedAppointments} hoàn thành
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-cyan-500">
              <Statistic
                title={
                  <Space>
                    <ExclamationCircleOutlined className="text-cyan-600" />
                    <span>Khiếu nại BH</span>
                  </Space>
                }
                value={filteredStats.warrantyClaimsCount}
                suffix="khiếu nại"
                valueStyle={{ color: "#13c2c2", fontSize: "24px" }}
              />
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-xs">
                  Từ {filteredStats.totalWarranties} phiếu bảo hành
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <Statistic
                title={
                  <Space>
                    <TeamOutlined className="text-green-600" />
                    <span>Khách hàng mới</span>
                  </Space>
                }
                value={filteredStats.newCustomers}
                suffix="khách"
                valueStyle={{ color: "#52c41a", fontSize: "24px" }}
              />
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-500 text-xs">
                  Trong khoảng thời gian đã chọn
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Charts Section */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                <span>Giờ làm việc trong tuần</span>
              </Space>
            }
            extra={
              <Text className="text-xs text-gray-500">
                Tuần này • Avg. 7h/tháng
              </Text>
            }
            className="shadow-sm"
          >
            <Empty description="Dữ liệu giờ làm việc sẽ được cập nhật" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TrophyOutlined />
                <span>Doanh thu theo tháng</span>
              </Space>
            }
            extra={
              <Text className="text-xs text-gray-500">
                Theo khoảng thời gian đã chọn
              </Text>
            }
            className="shadow-sm"
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.revenueMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    `${(value / 1000000).toFixed(0)}tr VNĐ`
                  }
                />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                  {chartData.revenueMonthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? "#B794F6" : "#90CDF4"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Project Progress & Categories */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ProjectOutlined />
                <span>Tiến độ dự án</span>
              </Space>
            }
            extra={<Text className="text-xs text-gray-500">Xem thêm →</Text>}
            className="shadow-sm"
          >
            <Space vertical size="middle" className="w-full">
              {chartData.orderRateData.slice(-3).map((item, index) => {
                const progress =
                  item.total > 0 ? (item.completed / item.total) * 100 : 0;
                const colors = ["#FFB088", "#90D5FF", "#95E1A4"];
                return (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <Text className="text-sm">{item.month}</Text>
                      <Text className="text-xs text-gray-500">
                        {item.completed}/{item.total}
                      </Text>
                    </div>
                    <Progress
                      percent={Math.round(progress)}
                      strokeColor={colors[index % colors.length]}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                );
              })}
              {chartData.orderRateData.length === 0 && (
                <Empty description="Chưa có dữ liệu" />
              )}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <AppstoreOutlined />
                <span>Danh mục dự án</span>
              </Space>
            }
            extra={<Text className="text-xs text-gray-500">Xem thêm →</Text>}
            className="shadow-sm"
          >
            <Row gutter={[12, 12]}>
              {chartData.categories.map((category, index) => {
                const IconComponent = category.icon;
                return (
                  <Col span={12} key={index}>
                    <Card
                      size="small"
                      className="hover:shadow-md transition-shadow"
                      styles={{
                        body: { padding: "20px", textAlign: "center" },
                      }}
                    >
                      <Space
                        direction="vertical"
                        size="middle"
                        className="w-full"
                        align="center"
                      >
                        <div
                          className="rounded-full p-4 flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <IconComponent
                            className="text-2xl"
                            style={{ color: category.color }}
                          />
                        </div>
                        <div>
                          <Text strong className="text-base block mb-1">
                            {category.name}
                          </Text>
                          <Text
                            className="text-lg font-semibold"
                            style={{ color: category.color }}
                          >
                            {category.count}
                          </Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "overview",
              label: (
                <span>
                  <ProjectOutlined /> Tổng quan quy trình
                </span>
              ),
              children: (
                <Empty description="Dữ liệu quy trình sẽ được cập nhật" />
              ),
            },
            {
              key: "kanban",
              label: (
                <span>
                  <ProjectOutlined /> Kanban Board
                </span>
              ),
              children: (
                <div>
                  <div className="mb-4">
                    <Text className="text-gray-500">
                      Theo dõi trực quan tiến độ thực thi từng quy trình
                    </Text>
                  </div>
                  <Empty description="Dữ liệu Kanban sẽ được cập nhật" />
                </div>
              ),
            },
            {
              key: "timeline",
              label: (
                <span>
                  <ClockCircleOutlined /> Dòng thời gian
                </span>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={16}>
                    <Timeline
                      items={[
                        ...filteredOrders
                          .slice(0, 5)
                          .sort((a, b) => b.createdAt - a.createdAt)
                          .map((order) => ({
                            color:
                              order.status === "completed" ||
                              order.status === "delivered"
                                ? "green"
                                : order.status === "processing" ||
                                  order.status === "in_progress"
                                ? "blue"
                                : "gray",
                            children: (
                              <Space vertical size={0}>
                                <Space>
                                  {order.status === "completed" ||
                                  order.status === "delivered" ? (
                                    <CheckCircleOutlined className="text-green-600" />
                                  ) : order.status === "processing" ||
                                    order.status === "in_progress" ? (
                                    <SyncOutlined
                                      spin
                                      className="text-blue-600"
                                    />
                                  ) : (
                                    <ClockCircleOutlined className="text-gray-500" />
                                  )}
                                  <Text strong>Đơn hàng {order.code}</Text>
                                </Space>
                                <Text className="text-xs text-gray-500">
                                  Khách hàng: {order.customer}
                                </Text>
                                <Text className="text-xs text-gray-500">
                                  {dayjs(order.createdAt).format(
                                    "DD/MM/YYYY HH:mm"
                                  )}
                                </Text>
                              </Space>
                            ),
                          })),
                        ...(filteredOrders.length === 0
                          ? [
                              {
                                color: "gray",
                                children: (
                                  <Empty description="Chưa có dữ liệu đơn hàng" />
                                ),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card title="Khiếu nại bảo hành" className="mb-4">
                      <Space vertical size="middle" className="w-full">
                        {filteredWarrantyClaims.slice(0, 5).map((claim) => (
                          <div key={claim.id}>
                            <Text strong className="text-sm">
                              {claim.code || claim.id}
                            </Text>
                            <div className="mt-2">
                              <Tag color="orange" icon={<WarningOutlined />}>
                                {claim.status || "Chờ xử lý"}
                              </Tag>
                            </div>
                            <Paragraph className="text-xs text-gray-500 mt-2 mb-0">
                              {claim.notes ||
                                (claim.issues && claim.issues.length > 0
                                  ? claim.issues.join(", ")
                                  : "Không có mô tả")}
                            </Paragraph>
                          </div>
                        ))}
                        {filteredWarrantyClaims.length === 0 && (
                          <Empty description="Không có khiếu nại" />
                        )}
                      </Space>
                    </Card>
                    <Card title="Feedback tiêu cực">
                      <Space vertical size="small" className="w-full">
                        {filteredFeedbacks
                          .filter((f) => f.rating && f.rating <= 2)
                          .slice(0, 5)
                          .map((feedback) => (
                            <div
                              key={feedback.id}
                              className="p-2 bg-red-50 rounded"
                            >
                              <Text strong className="text-xs">
                                {feedback.customerName || "Khách hàng"}
                              </Text>
                              <div className="mt-1">
                                <Text className="text-xs">
                                  Đánh giá: {feedback.rating}/5
                                </Text>
                              </div>
                            </div>
                          ))}
                        {filteredFeedbacks.filter(
                          (f) => f.rating && f.rating <= 2
                        ).length === 0 && (
                          <Empty description="Không có feedback tiêu cực" />
                        )}
                      </Space>
                    </Card>
                  </Col>
                </Row>
              ),
            },

            {
              key: "statistics",
              label: (
                <span>
                  <TrophyOutlined /> Thống kê Charts
                </span>
              ),
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <Space>
                          <TeamOutlined />
                          <span>Nguồn Lead Tới</span>
                        </Space>
                      }
                      className="shadow-sm"
                    >
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartData.leadSourceData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent = 0 }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.leadSourceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <Space>
                          <CheckCircleOutlined />
                          <span>Tỷ Lệ Đơn Hàng Hoàn Thành</span>
                        </Space>
                      }
                      className="shadow-sm"
                    >
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.orderRateData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="completed"
                            stroke="#8884d8"
                            name="Đơn hoàn thành"
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#82ca9d"
                            name="Tổng đơn"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <Space>
                          <TrophyOutlined />
                          <span>Doanh thu theo thời gian</span>
                        </Space>
                      }
                      className="shadow-sm"
                    >
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData.revenueMonthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number) =>
                              `${(value / 1000000).toFixed(1)}tr VNĐ`
                            }
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <Space>
                          <FileTextOutlined />
                          <span>So sánh doanh thu và đơn hàng</span>
                        </Space>
                      }
                      className="shadow-sm"
                    >
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.orderRateData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar
                            yAxisId="left"
                            dataKey="completed"
                            fill="#8884d8"
                            name="Đơn hoàn thành"
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="total"
                            fill="#82ca9d"
                            name="Tổng đơn"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Card>

      {/* Recent Orders - Only show 5 records */}
      <Card
        title={
          <Space>
            <FileTextOutlined className="text-blue-600" />
            <span>Đơn Hàng Gần Đây</span>
          </Space>
        }
        className="mt-6 shadow-sm"
        extra={
          <Space>
            <Badge
              count={filteredOrders.length}
              showZero
              style={{ backgroundColor: "#1890ff" }}
            />
            <Text className="text-xs text-gray-500">
              Hiển thị 5 đơn hàng mới nhất
            </Text>
          </Space>
        }
      >
        {ordersLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : filteredOrders.length === 0 ? (
          <Empty description="Không có dữ liệu đơn hàng" />
        ) : (
          <Table<DisplayOrder>
            columns={[
              {
                title: "Mã đơn",
                dataIndex: "code",
                key: "code",
                width: 150,
                fixed: "left",
                render: (text: string) => (
                  <Text strong className="font-mono">
                    {text}
                  </Text>
                ),
              },
              {
                title: "Khách hàng",
                dataIndex: "customer",
                key: "customer",
                width: 200,
                render: (text: string) => <Text>{text || "N/A"}</Text>,
              },
              {
                title: "Số điện thoại",
                dataIndex: "phone",
                key: "phone",
                width: 130,
                render: (text: string) => <Text>{text || "-"}</Text>,
              },
              {
                title: "Ngày đặt",
                dataIndex: "date",
                key: "date",
                width: 120,
                render: (date: string) => (
                  <Text>{dayjs(date).format("DD/MM/YYYY")}</Text>
                ),
                sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
              },
              {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                width: 140,
                render: (status: string) => {
                  const statusMap: Record<
                    string,
                    { color: string; text: string }
                  > = {
                    pending: { color: "default", text: "Chờ xử lý" },
                    processing: { color: "processing", text: "Đang xử lý" },
                    in_progress: { color: "processing", text: "Đang xử lý" },
                    completed: { color: "success", text: "Hoàn thành" },
                    delivered: { color: "success", text: "Đã giao" },
                    cancelled: { color: "error", text: "Đã hủy" },
                  };
                  const statusInfo = statusMap[status] || {
                    color: "default",
                    text: status,
                  };
                  return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
                },
              },
              {
                title: "Tổng tiền",
                dataIndex: "totalAmount",
                key: "totalAmount",
                width: 150,
                align: "right",
                render: (amount: number) => (
                  <Text strong className="text-green-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(amount || 0)}
                  </Text>
                ),
                sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
              },
            ]}
            dataSource={filteredOrders.slice(0, 5)}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 800 }}
          />
        )}
      </Card>
    </Space>
  );
}
