"use client";

import CommonTable, { type PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import {
  AlertOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileImageOutlined,
  HistoryOutlined,
  PhoneOutlined,
  QrcodeOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Image,
  Progress,
  Row,
  Space,
  Statistic,
  Steps,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";

const { Text, Paragraph } = Typography;

interface ProductItem {
  id: string;
  productName: string;
  services: string[];
  notes: string;
  qrCode: string;
  images: {
    before: string[];
    during: string[];
    after: string[];
  };
}

interface ProductTracking {
  id: string;
  orderId: string;
  invoiceNumber: string;
  customer: string;
  items: ProductItem[];
  currentStage: string;
  stageProgress: number;
  status:
    | "in_progress"
    | "completed"
    | "problem"
    | "complaint"
    | "quality_check";
  priority: "high" | "medium" | "low";
  department: string;
  technician: string;
  startDate: string;
  dueDate: string;
  completedDate?: string;
  estimatedDays: number;
  actualDays?: number;
  stages: {
    name: string;
    status: "wait" | "process" | "finish" | "error";
    department: string;
    technician: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    notes?: string;
  }[];
  timeline: {
    date: string;
    action: string;
    staff: string;
    department: string;
    notes?: string;
    images?: string[];
  }[];
  notifications: {
    type: "warning" | "overdue" | "reminder";
    message: string;
    sentAt: string;
    recipient: string;
  }[];
  complaints?: {
    date: string;
    issue: string;
    handler: string;
    status: "open" | "resolved";
    resolution?: string;
  }[];
}

const mockProductTracking: ProductTracking[] = [
  {
    id: "1",
    orderId: "DH-2024-001",
    invoiceNumber: "HD-2024-001",
    customer: "Nguyễn Văn A",
    items: [
      {
        id: "001",
        productName: "Túi xách Louis Vuitton",
        services: ["Vệ sinh cao cấp", "Phục hồi màu", "Xi mạ kim loại"],
        notes: "Túi có vết bẩn ở góc dưới, kim loại bị xỉn màu",
        qrCode: "HD-2024-001-T001",
        images: {
          before: [
            "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=300",
          ],
          during: [
            "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=300",
          ],
          after: [],
        },
      },
      {
        id: "002",
        productName: "Giày da nam Gucci",
        services: ["Vệ sinh", "Khâu vá", "Đánh bóng"],
        notes: "Đế giày bị lở chỉ ở mũi giày",
        qrCode: "HD-2024-001-G002",
        images: {
          before: [
            "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&q=80&w=300&h=300",
          ],
          during: [],
          after: [],
        },
      },
    ],
    currentStage: "Phục hồi màu",
    stageProgress: 60,
    status: "in_progress",
    priority: "high",
    department: "Phòng phục hồi màu",
    technician: "Trần Văn C",
    startDate: "2024-12-01 08:00",
    dueDate: "2024-12-05 17:00",
    estimatedDays: 4,
    stages: [
      {
        name: "Tiếp nhận",
        status: "finish",
        department: "Lễ tân",
        technician: "Nguyễn Thị B",
        startTime: "2024-12-01 08:00",
        endTime: "2024-12-01 08:30",
        duration: 0.5,
        notes: "Đã kiểm tra và chụp ảnh ban đầu",
      },
      {
        name: "Vệ sinh",
        status: "finish",
        department: "Phòng vệ sinh",
        technician: "Lê Văn D",
        startTime: "2024-12-01 09:00",
        endTime: "2024-12-02 14:00",
        duration: 29,
        notes: "Vệ sinh hoàn tất, sản phẩm sạch",
      },
      {
        name: "Phục hồi màu",
        status: "process",
        department: "Phòng phục hồi màu",
        technician: "Trần Văn C",
        startTime: "2024-12-02 15:00",
        notes: "Đang xử lý phục hồi màu da",
      },
      {
        name: "Xi mạ",
        status: "wait",
        department: "Phòng xi mạ",
        technician: "Phạm Văn E",
      },
      {
        name: "Kiểm tra chất lượng",
        status: "wait",
        department: "QC",
        technician: "Hoàng Thị F",
      },
    ],
    timeline: [
      {
        date: "2024-12-01 08:00",
        action: "Tiếp nhận đơn hàng",
        staff: "Nguyễn Thị B",
        department: "Lễ tân",
        notes: "Khách hàng mang 2 sản phẩm",
      },
      {
        date: "2024-12-01 08:30",
        action: "Chuyển sang vệ sinh",
        staff: "Nguyễn Thị B",
        department: "Lễ tân",
      },
      {
        date: "2024-12-01 09:00",
        action: "Bắt đầu vệ sinh",
        staff: "Lê Văn D",
        department: "Phòng vệ sinh",
      },
      {
        date: "2024-12-02 14:00",
        action: "Hoàn thành vệ sinh",
        staff: "Lê Văn D",
        department: "Phòng vệ sinh",
        images: ["https://via.placeholder.com/300x200?text=After+Clean"],
      },
      {
        date: "2024-12-02 15:00",
        action: "Bắt đầu phục hồi màu",
        staff: "Trần Văn C",
        department: "Phòng phục hồi màu",
      },
    ],
    notifications: [
      {
        type: "reminder",
        message: "Giai đoạn phục hồi màu sắp đến hạn (còn 6 giờ)",
        sentAt: "2024-12-03 11:00",
        recipient: "Trần Văn C",
      },
    ],
  },
  {
    id: "2",
    orderId: "DH-2024-002",
    invoiceNumber: "HD-2024-002",
    customer: "Trần Thị B",
    items: [
      {
        id: "003",
        productName: "Ví da Hermès",
        services: ["Khâu vá", "Vệ sinh", "Làm form"],
        notes: "Khóa bị lỏng, da góc bị sờn",
        qrCode: "HD-2024-002-V003",
        images: {
          before: [
            "https://via.placeholder.com/300x200?text=Wallet+Before+1",
            "https://via.placeholder.com/300x200?text=Wallet+Before+2",
          ],
          during: ["https://via.placeholder.com/300x200?text=Wallet+Repair+1"],
          after: [
            "https://via.placeholder.com/300x200?text=Wallet+After+1",
            "https://via.placeholder.com/300x200?text=Wallet+After+2",
          ],
        },
      },
    ],
    currentStage: "Hoàn thành",
    stageProgress: 100,
    status: "completed",
    priority: "medium",
    department: "QC",
    technician: "Hoàng Thị F",
    startDate: "2024-11-28 08:00",
    dueDate: "2024-12-01 17:00",
    completedDate: "2024-12-01 15:30",
    estimatedDays: 3,
    actualDays: 3,
    stages: [
      {
        name: "Tiếp nhận",
        status: "finish",
        department: "Lễ tân",
        technician: "Nguyễn Thị B",
        startTime: "2024-11-28 08:00",
        endTime: "2024-11-28 08:20",
        duration: 0.3,
      },
      {
        name: "Khâu vá",
        status: "finish",
        department: "Phòng khâu vá",
        technician: "Vũ Văn G",
        startTime: "2024-11-28 09:00",
        endTime: "2024-11-29 16:00",
        duration: 31,
      },
      {
        name: "Vệ sinh",
        status: "finish",
        department: "Phòng vệ sinh",
        technician: "Lê Văn D",
        startTime: "2024-11-30 08:00",
        endTime: "2024-11-30 14:00",
        duration: 6,
      },
      {
        name: "Làm form",
        status: "finish",
        department: "Phòng làm form",
        technician: "Đỗ Thị H",
        startTime: "2024-11-30 14:30",
        endTime: "2024-12-01 12:00",
        duration: 21.5,
      },
      {
        name: "Kiểm tra chất lượng",
        status: "finish",
        department: "QC",
        technician: "Hoàng Thị F",
        startTime: "2024-12-01 13:00",
        endTime: "2024-12-01 15:30",
        duration: 2.5,
      },
    ],
    timeline: [
      {
        date: "2024-11-28 08:00",
        action: "Tiếp nhận đơn hàng",
        staff: "Nguyễn Thị B",
        department: "Lễ tân",
      },
      {
        date: "2024-11-28 09:00",
        action: "Bắt đầu khâu vá",
        staff: "Vũ Văn G",
        department: "Phòng khâu vá",
      },
      {
        date: "2024-11-29 16:00",
        action: "Hoàn thành khâu vá",
        staff: "Vũ Văn G",
        department: "Phòng khâu vá",
      },
      {
        date: "2024-11-30 08:00",
        action: "Bắt đầu vệ sinh",
        staff: "Lê Văn D",
        department: "Phòng vệ sinh",
      },
      {
        date: "2024-11-30 14:00",
        action: "Hoàn thành vệ sinh",
        staff: "Lê Văn D",
        department: "Phòng vệ sinh",
      },
      {
        date: "2024-11-30 14:30",
        action: "Bắt đầu làm form",
        staff: "Đỗ Thị H",
        department: "Phòng làm form",
      },
      {
        date: "2024-12-01 12:00",
        action: "Hoàn thành làm form",
        staff: "Đỗ Thị H",
        department: "Phòng làm form",
      },
      {
        date: "2024-12-01 13:00",
        action: "Bắt đầu kiểm tra chất lượng",
        staff: "Hoàng Thị F",
        department: "QC",
      },
      {
        date: "2024-12-01 15:30",
        action: "Hoàn thành kiểm tra - Đạt chất lượng",
        staff: "Hoàng Thị F",
        department: "QC",
      },
    ],
    notifications: [
      {
        type: "reminder",
        message: "Sản phẩm đã hoàn thành, nhắc khách đến lấy",
        sentAt: "2024-12-01 16:00",
        recipient: "Nguyễn Thị B",
      },
    ],
  },
  {
    id: "3",
    orderId: "DH-2024-003",
    invoiceNumber: "HD-2024-003",
    customer: "Lê Văn C",
    items: [
      {
        id: "004",
        productName: "Balo da Prada",
        services: ["Vệ sinh cao cấp", "Thay khóa", "Phục hồi màu"],
        notes: "Khóa bị gãy, cần thay mới",
        qrCode: "HD-2024-003-B004",
        images: {
          before: ["https://via.placeholder.com/300x200?text=Backpack+Before"],
          during: [],
          after: [],
        },
      },
    ],
    currentStage: "Vệ sinh",
    stageProgress: 20,
    status: "problem",
    priority: "high",
    department: "Phòng vệ sinh",
    technician: "Lê Văn D",
    startDate: "2024-12-02 08:00",
    dueDate: "2024-12-04 17:00",
    estimatedDays: 2,
    stages: [
      {
        name: "Tiếp nhận",
        status: "finish",
        department: "Lễ tân",
        technician: "Nguyễn Thị B",
        startTime: "2024-12-02 08:00",
        endTime: "2024-12-02 08:30",
        duration: 0.5,
      },
      {
        name: "Vệ sinh",
        status: "error",
        department: "Phòng vệ sinh",
        technician: "Lê Văn D",
        startTime: "2024-12-02 09:00",
        notes: "Phát hiện lớp da bên trong bị bong, cần xử lý thêm",
      },
      {
        name: "Thay khóa",
        status: "wait",
        department: "Phòng khâu vá",
        technician: "Vũ Văn G",
      },
      {
        name: "Phục hồi màu",
        status: "wait",
        department: "Phòng phục hồi màu",
        technician: "Trần Văn C",
      },
    ],
    timeline: [
      {
        date: "2024-12-02 08:00",
        action: "Tiếp nhận đơn hàng",
        staff: "Nguyễn Thị B",
        department: "Lễ tân",
      },
      {
        date: "2024-12-02 09:00",
        action: "Bắt đầu vệ sinh",
        staff: "Lê Văn D",
        department: "Phòng vệ sinh",
      },
      {
        date: "2024-12-02 14:00",
        action: "Phát hiện vấn đề",
        staff: "Lê Văn D",
        department: "Phòng vệ sinh",
        notes: "Lớp da bên trong bị bong tróc, cần báo khách hàng",
      },
    ],
    notifications: [
      {
        type: "warning",
        message:
          "Phát hiện vấn đề tại giai đoạn vệ sinh - Cần liên hệ khách hàng",
        sentAt: "2024-12-02 14:10",
        recipient: "Nguyễn Thị B",
      },
    ],
  },
  {
    id: "4",
    orderId: "DH-2024-004",
    invoiceNumber: "HD-2024-004",
    customer: "Phạm Thị D",
    items: [
      {
        id: "005",
        productName: "Giày cao gót Christian Louboutin",
        services: ["Phục hồi màu đế đỏ", "Vệ sinh", "Thay miếng lót"],
        notes: "Đế đỏ bị phai màu nghiêm trọng",
        qrCode: "HD-2024-004-G005",
        images: {
          before: [
            "https://via.placeholder.com/300x200?text=Heels+Before+1",
            "https://via.placeholder.com/300x200?text=Heels+Before+2",
          ],
          during: [],
          after: [],
        },
      },
    ],
    currentStage: "Chưa bắt đầu",
    stageProgress: 0,
    status: "in_progress",
    priority: "low",
    department: "Lễ tân",
    technician: "Chưa phân công",
    startDate: "2024-12-03 10:00",
    dueDate: "2024-12-06 17:00",
    estimatedDays: 3,
    stages: [
      {
        name: "Tiếp nhận",
        status: "finish",
        department: "Lễ tân",
        technician: "Nguyễn Thị B",
        startTime: "2024-12-03 10:00",
        endTime: "2024-12-03 10:20",
        duration: 0.3,
      },
      {
        name: "Vệ sinh",
        status: "wait",
        department: "Phòng vệ sinh",
        technician: "Lê Văn D",
      },
      {
        name: "Phục hồi màu đế",
        status: "wait",
        department: "Phòng phục hồi màu",
        technician: "Trần Văn C",
      },
      {
        name: "Thay miếng lót",
        status: "wait",
        department: "Phòng khâu vá",
        technician: "Vũ Văn G",
      },
    ],
    timeline: [
      {
        date: "2024-12-03 10:00",
        action: "Tiếp nhận đơn hàng",
        staff: "Nguyễn Thị B",
        department: "Lễ tân",
      },
    ],
    notifications: [],
  },
  {
    id: "5",
    orderId: "DH-2024-005",
    invoiceNumber: "HD-2024-005",
    customer: "Hoàng Văn E",
    items: [
      {
        id: "006",
        productName: "Túi xách Chanel Classic",
        services: ["Vệ sinh", "Xi mạ xích"],
        notes: "Xích kim loại bị oxy hóa",
        qrCode: "HD-2024-005-T006",
        images: {
          before: ["https://via.placeholder.com/300x200?text=Chanel+Before"],
          during: ["https://via.placeholder.com/300x200?text=Chanel+During"],
          after: ["https://via.placeholder.com/300x200?text=Chanel+After"],
        },
      },
    ],
    currentStage: "Hoàn thành",
    stageProgress: 100,
    status: "complaint",
    priority: "high",
    department: "CSKH",
    technician: "Nguyễn Thị B",
    startDate: "2024-11-25 08:00",
    dueDate: "2024-11-28 17:00",
    completedDate: "2024-11-28 16:00",
    estimatedDays: 3,
    actualDays: 3,
    stages: [
      {
        name: "Tiếp nhận",
        status: "finish",
        department: "Lễ tân",
        technician: "Nguyễn Thị B",
        startTime: "2024-11-25 08:00",
        endTime: "2024-11-25 08:15",
        duration: 0.25,
      },
      {
        name: "Vệ sinh",
        status: "finish",
        department: "Phòng vệ sinh",
        technician: "Lê Văn D",
        startTime: "2024-11-25 09:00",
        endTime: "2024-11-26 14:00",
        duration: 29,
      },
      {
        name: "Xi mạ",
        status: "finish",
        department: "Phòng xi mạ",
        technician: "Phạm Văn E",
        startTime: "2024-11-26 15:00",
        endTime: "2024-11-28 12:00",
        duration: 45,
      },
      {
        name: "Kiểm tra chất lượng",
        status: "finish",
        department: "QC",
        technician: "Hoàng Thị F",
        startTime: "2024-11-28 13:00",
        endTime: "2024-11-28 16:00",
        duration: 3,
      },
    ],
    timeline: [
      {
        date: "2024-11-25 08:00",
        action: "Tiếp nhận đơn hàng",
        staff: "Nguyễn Thị B",
        department: "Lễ tân",
      },
      {
        date: "2024-11-28 16:00",
        action: "Hoàn thành và giao hàng",
        staff: "Nguyễn Thị B",
        department: "Lễ tân",
      },
      {
        date: "2024-11-30 10:00",
        action: "Khách hàng phản ánh màu xi không đều",
        staff: "Nguyễn Thị B",
        department: "CSKH",
        notes: "Khách hàng yêu cầu làm lại",
      },
    ],
    notifications: [
      {
        type: "warning",
        message: "Có khiếu nại từ khách hàng - Cần xử lý khẩn cấp",
        sentAt: "2024-11-30 10:10",
        recipient: "Quản lý",
      },
    ],
    complaints: [
      {
        date: "2024-11-30 10:00",
        issue: "Màu xi mạ không đều, có chỗ bị ố vàng",
        handler: "Nguyễn Thị B",
        status: "open",
      },
    ],
  },
];

const getStatusColor = (status: string) => {
  const colors = {
    in_progress: "processing",
    completed: "success",
    problem: "error",
    complaint: "warning",
    quality_check: "default",
  };
  return colors[status as keyof typeof colors] || "default";
};

const getStatusText = (status: string) => {
  const texts = {
    in_progress: "Đang làm",
    completed: "Đã xong",
    problem: "Có vấn đề",
    complaint: "Khiếu nại",
    quality_check: "Kiểm tra CL",
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

// Product Tracking Detail Drawer
const ProductTrackingDetailDrawer: React.FC<
  PropRowDetails<ProductTracking>
> = ({ data }) => {
  if (!data) return null;

  const daysRemaining = dayjs(data.dueDate).diff(dayjs(), "day");
  const isOverdue = daysRemaining < 0;
  const isNearDue = daysRemaining <= 1 && daysRemaining >= 0;

  return (
    <Space vertical size="large" className="w-full">
      {/* Header Info */}
      <Card size="small">
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Đơn hàng" span={2}>
            <Space>
              <Text strong>{data.orderId}</Text>
              <Text className="text-gray-500">({data.invoiceNumber})</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Khách hàng" span={2}>
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              <Text strong>{data.customer}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag
              color={getStatusColor(data.status)}
              icon={<ClockCircleOutlined />}
            >
              {getStatusText(data.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ưu tiên">
            <Tag color={getPriorityColor(data.priority)}>
              {getPriorityText(data.priority)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Giai đoạn hiện tại">
            <Text strong>{data.currentStage}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Bộ phận">
            <Text>{data.department}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Kỹ thuật viên">
            <Space>
              <Avatar size="small" icon={<ToolOutlined />} />
              <Text>{data.technician}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Tiến độ">
            <Space vertical size="small" className="w-full">
              <Progress percent={data.stageProgress} size="small" />
              <Text className="text-xs text-gray-500">
                {data.stages.filter((s) => s.status === "finish").length} /{" "}
                {data.stages.length} giai đoạn
              </Text>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Timeline Progress */}
      <Card size="small" title="Thời gian xử lý">
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Ngày bắt đầu">
            {dayjs(data.startDate).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
          <Descriptions.Item label="Hạn hoàn thành">
            <Space>
              {dayjs(data.dueDate).format("DD/MM/YYYY HH:mm")}
              {isOverdue && (
                <Tag color="red" icon={<WarningOutlined />}>
                  Quá hạn {Math.abs(daysRemaining)} ngày
                </Tag>
              )}
              {isNearDue && (
                <Tag color="orange" icon={<ClockCircleOutlined />}>
                  Sắp đến hạn
                </Tag>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian dự kiến">
            <Text>{data.estimatedDays} ngày</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian thực tế">
            <Text>
              {data.actualDays ? `${data.actualDays} ngày` : "Đang xử lý"}
            </Text>
          </Descriptions.Item>
          {data.completedDate && (
            <Descriptions.Item label="Ngày hoàn thành" span={2}>
              {dayjs(data.completedDate).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Product Items */}
      <Card size="small" title="Chi tiết sản phẩm">
        <Space vertical size="middle" className="w-full">
          {data.items.map((item) => (
            <Card key={item.id} size="small" type="inner">
              <Space vertical size="small" className="w-full">
                <div className="flex items-start justify-between">
                  <div>
                    <Text strong className="text-base">
                      {item.productName}
                    </Text>
                    <div className="mt-2">
                      <Text className="text-xs text-gray-500">
                        Mã QR: {item.qrCode}
                      </Text>
                      <Button
                        size="small"
                        icon={<QrcodeOutlined />}
                        className="ml-2"
                      >
                        Xem QR
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Text strong className="text-sm">
                    Dịch vụ:
                  </Text>
                  <div className="mt-1">
                    <Space wrap>
                      {item.services.map((service, idx) => (
                        <Tag key={idx} color="blue">
                          {service}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>

                {item.notes && (
                  <div>
                    <Text strong className="text-sm">
                      Ghi chú:
                    </Text>
                    <Paragraph className="text-sm text-gray-600 mt-1 mb-0">
                      {item.notes}
                    </Paragraph>
                  </div>
                )}

                {/* Product Images */}
                {(item.images.before.length > 0 ||
                  item.images.during.length > 0 ||
                  item.images.after.length > 0) && (
                  <div>
                    <Text strong className="text-sm">
                      Hình ảnh:
                    </Text>
                    <Row gutter={[8, 8]} className="mt-2">
                      {item.images.before.length > 0 && (
                        <Col span={8}>
                          <Text className="text-xs text-gray-500">
                            Trước sửa chữa:
                          </Text>
                          <div className="mt-1">
                            <Image.PreviewGroup>
                              <Space wrap size="small">
                                {item.images.before.map((img, idx) => (
                                  <Image
                                    key={idx}
                                    width={80}
                                    height={60}
                                    src={img}
                                    alt={`Before ${idx + 1}`}
                                    style={{ objectFit: "cover" }}
                                  />
                                ))}
                              </Space>
                            </Image.PreviewGroup>
                          </div>
                        </Col>
                      )}
                      {item.images.during.length > 0 && (
                        <Col span={8}>
                          <Text className="text-xs text-gray-500">
                            Trong quá trình:
                          </Text>
                          <div className="mt-1">
                            <Image.PreviewGroup>
                              <Space wrap size="small">
                                {item.images.during.map((img, idx) => (
                                  <Image
                                    key={idx}
                                    width={80}
                                    height={60}
                                    src={img}
                                    alt={`During ${idx + 1}`}
                                    style={{ objectFit: "cover" }}
                                  />
                                ))}
                              </Space>
                            </Image.PreviewGroup>
                          </div>
                        </Col>
                      )}
                      {item.images.after.length > 0 && (
                        <Col span={8}>
                          <Text className="text-xs text-gray-500">
                            Sau sửa chữa:
                          </Text>
                          <div className="mt-1">
                            <Image.PreviewGroup>
                              <Space wrap size="small">
                                {item.images.after.map((img, idx) => (
                                  <Image
                                    key={idx}
                                    width={80}
                                    height={60}
                                    src={img}
                                    alt={`After ${idx + 1}`}
                                    style={{ objectFit: "cover" }}
                                  />
                                ))}
                              </Space>
                            </Image.PreviewGroup>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </div>
                )}
              </Space>
            </Card>
          ))}
        </Space>
      </Card>

      {/* Stages Progress */}
      <Card size="small" title="Hành trình sản phẩm">
        <Steps
          orientation="vertical"
          size="small"
          current={data.stages.findIndex((s) => s.status === "process")}
          items={data.stages.map((stage) => ({
            title: stage.name,
            status:
              stage.status === "finish"
                ? "finish"
                : stage.status === "process"
                ? "process"
                : stage.status === "error"
                ? "error"
                : "wait",
            description: (
              <Space vertical size={0}>
                <Text className="text-xs">
                  <TeamOutlined /> {stage.department} - {stage.technician}
                </Text>
                {stage.startTime && (
                  <Text className="text-xs text-gray-500">
                    Bắt đầu: {dayjs(stage.startTime).format("DD/MM HH:mm")}
                  </Text>
                )}
                {stage.endTime && (
                  <Text className="text-xs text-gray-500">
                    Kết thúc: {dayjs(stage.endTime).format("DD/MM HH:mm")} (
                    {stage.duration}h)
                  </Text>
                )}
                {stage.notes && (
                  <Text className="text-xs italic text-orange-600">
                    {stage.notes}
                  </Text>
                )}
              </Space>
            ),
          }))}
        />
      </Card>

      {/* Timeline */}
      <Card size="small" title="Lịch sử xử lý">
        <Timeline
          items={data.timeline.map((item) => ({
            color: "blue",
            children: (
              <Space vertical size={0}>
                <Text strong>{item.action}</Text>
                <Space size="small">
                  <UserOutlined />
                  <Text className="text-xs">{item.staff}</Text>
                  <Text className="text-xs text-gray-500">
                    ({item.department})
                  </Text>
                </Space>
                <Text className="text-xs text-gray-500">
                  {dayjs(item.date).format("DD/MM/YYYY HH:mm")}
                </Text>
                {item.notes && (
                  <Text className="text-xs italic text-gray-600">
                    {item.notes}
                  </Text>
                )}
                {item.images && item.images.length > 0 && (
                  <div className="mt-1">
                    <Image.PreviewGroup>
                      <Space wrap size="small">
                        {item.images.map((img, idx) => (
                          <Image
                            key={idx}
                            width={60}
                            height={45}
                            src={img}
                            alt={`Timeline ${idx + 1}`}
                            style={{ objectFit: "cover" }}
                          />
                        ))}
                      </Space>
                    </Image.PreviewGroup>
                  </div>
                )}
              </Space>
            ),
          }))}
        />
      </Card>

      {/* Notifications */}
      {data.notifications.length > 0 && (
        <Card size="small" title="Thông báo & Cảnh báo">
          <Space vertical size="small" className="w-full">
            {data.notifications.map((notif, idx) => (
              <div
                key={idx}
                className={`p-3 rounded ${
                  notif.type === "overdue"
                    ? "bg-red-50"
                    : notif.type === "warning"
                    ? "bg-orange-50"
                    : "bg-blue-50"
                }`}
              >
                <Space>
                  {notif.type === "overdue" && (
                    <WarningOutlined className="text-red-600" />
                  )}
                  {notif.type === "warning" && (
                    <ExclamationCircleOutlined className="text-orange-600" />
                  )}
                  {notif.type === "reminder" && (
                    <BellOutlined className="text-blue-600" />
                  )}
                  <div>
                    <Text strong className="text-sm">
                      {notif.message}
                    </Text>
                    <div className="mt-1">
                      <Text className="text-xs text-gray-500">
                        Gửi đến: {notif.recipient} -{" "}
                        {dayjs(notif.sentAt).format("DD/MM/YYYY HH:mm")}
                      </Text>
                    </div>
                  </div>
                </Space>
              </div>
            ))}
          </Space>
        </Card>
      )}

      {/* Complaints */}
      {data.complaints && data.complaints.length > 0 && (
        <Card
          size="small"
          title={
            <Space>
              <AlertOutlined className="text-red-600" />
              <Text strong className="text-red-600">
                Khiếu nại từ khách hàng
              </Text>
            </Space>
          }
        >
          <Space vertical size="middle" className="w-full">
            {data.complaints.map((complaint, idx) => (
              <div key={idx} className="p-3 bg-red-50 rounded">
                <div className="flex items-start justify-between">
                  <div>
                    <Text strong className="text-sm">
                      {complaint.issue}
                    </Text>
                    <div className="mt-2">
                      <Text className="text-xs text-gray-500">
                        Người xử lý: {complaint.handler}
                      </Text>
                    </div>
                    <div>
                      <Text className="text-xs text-gray-500">
                        Thời gian:{" "}
                        {dayjs(complaint.date).format("DD/MM/YYYY HH:mm")}
                      </Text>
                    </div>
                    {complaint.resolution && (
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <Text strong className="text-xs text-green-700">
                          Giải pháp:
                        </Text>
                        <Text className="text-xs ml-2">
                          {complaint.resolution}
                        </Text>
                      </div>
                    )}
                  </div>
                  <Tag
                    color={
                      complaint.status === "resolved" ? "success" : "error"
                    }
                  >
                    {complaint.status === "resolved"
                      ? "Đã xử lý"
                      : "Đang xử lý"}
                  </Tag>
                </div>
              </div>
            ))}
          </Space>
        </Card>
      )}

      {/* Action Buttons */}
      <Card size="small">
        <Space wrap>
          <Button type="primary" icon={<PhoneOutlined />}>
            Gọi khách hàng
          </Button>
          <Button icon={<FileImageOutlined />}>Gửi ảnh sản phẩm</Button>
          <Button icon={<HistoryOutlined />}>Xem lịch sử đầy đủ</Button>
        </Space>
      </Card>
    </Space>
  );
};

export default function ProductTrackingPage() {
  const [activeView, setActiveView] = useState<"list" | "kanban">("list");
  const {
    query,
    pagination,
    updateQueries,
    reset,
    applyFilter,
    handlePageChange,
  } = useFilter();

  const filteredProducts = applyFilter(mockProductTracking);

  // Statistics
  const totalProducts = mockProductTracking.length;
  const inProgress = mockProductTracking.filter(
    (p) => p.status === "in_progress"
  ).length;
  const completed = mockProductTracking.filter(
    (p) => p.status === "completed"
  ).length;
  const problems = mockProductTracking.filter(
    (p) => p.status === "problem"
  ).length;
  const complaints = mockProductTracking.filter(
    (p) => p.status === "complaint"
  ).length;
  const overdue = mockProductTracking.filter(
    (p) => dayjs(p.dueDate).isBefore(dayjs()) && p.status !== "completed"
  ).length;

  // Filter fields
  const filterFields = [
    {
      name: "status",
      label: "Trạng thái",
      type: "select" as const,
      options: [
        { label: "Đang làm", value: "in_progress" },
        { label: "Đã xong", value: "completed" },
        { label: "Có vấn đề", value: "problem" },
        { label: "Khiếu nại", value: "complaint" },
        { label: "Kiểm tra CL", value: "quality_check" },
      ],
    },
    {
      name: "priority",
      label: "Ưu tiên",
      type: "select" as const,
      options: [
        { label: "Cao", value: "high" },
        { label: "Trung bình", value: "medium" },
        { label: "Thấp", value: "low" },
      ],
    },
    {
      name: "department",
      label: "Bộ phận",
      type: "select" as const,
      options: [
        { label: "Phòng vệ sinh", value: "Phòng vệ sinh" },
        { label: "Phòng khâu vá", value: "Phòng khâu vá" },
        { label: "Phòng phục hồi màu", value: "Phòng phục hồi màu" },
        { label: "Phòng xi mạ", value: "Phòng xi mạ" },
        { label: "QC", value: "QC" },
      ],
    },
    {
      name: "dueDate",
      label: "Hạn hoàn thành",
      type: "date" as const,
    },
  ];

  // Table columns
  const columns: TableColumnsType<ProductTracking> = [
    {
      title: "Đơn hàng",
      key: "orderInfo",
      width: 180,
      fixed: "left",
      render: (_: unknown, record: ProductTracking) => (
        <Space vertical size={0}>
          <Text strong className="text-sm">
            {record.orderId}
          </Text>
          <Text className="text-xs text-gray-500">{record.invoiceNumber}</Text>
          <Text className="text-xs">{record.customer}</Text>
        </Space>
      ),
    },
    {
      title: "Sản phẩm",
      key: "products",
      width: 200,
      render: (_: unknown, record: ProductTracking) => (
        <Space vertical size={0}>
          {record.items.map((item) => (
            <div key={item.id}>
              <Text className="text-sm">{item.productName}</Text>
              <div>
                <Badge count={item.services.length} color="blue" size="small">
                  <Text className="text-xs text-gray-500">
                    {item.services.length} dịch vụ
                  </Text>
                </Badge>
              </div>
            </div>
          ))}
        </Space>
      ),
    },
    {
      title: "Giai đoạn hiện tại",
      dataIndex: "currentStage",
      key: "currentStage",
      width: 180,
      render: (stage: string, record: ProductTracking) => (
        <Space vertical size="small" className="w-full">
          <Text strong className="text-sm">
            {stage}
          </Text>
          <Progress percent={record.stageProgress} size="small" />
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={<ClockCircleOutlined />}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 110,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: "Bộ phận",
      dataIndex: "department",
      key: "department",
      width: 150,
    },
    {
      title: "Kỹ thuật viên",
      dataIndex: "technician",
      key: "technician",
      width: 140,
    },
    {
      title: "Hạn hoàn thành",
      key: "dueDate",
      width: 160,
      render: (_: unknown, record: ProductTracking) => {
        const daysRemaining = dayjs(record.dueDate).diff(dayjs(), "day");
        const isOverdue = daysRemaining < 0;
        const isNearDue = daysRemaining <= 1 && daysRemaining >= 0;

        return (
          <Space vertical size={0}>
            <Text className="text-sm">
              {dayjs(record.dueDate).format("DD/MM/YYYY")}
            </Text>
            {isOverdue && (
              <Tag color="red" icon={<WarningOutlined />} className="text-xs">
                Quá hạn {Math.abs(daysRemaining)} ngày
              </Tag>
            )}
            {isNearDue && (
              <Tag
                color="orange"
                icon={<ClockCircleOutlined />}
                className="text-xs"
              >
                Sắp đến hạn
              </Tag>
            )}
            {!isOverdue && !isNearDue && (
              <Text className="text-xs text-gray-500">
                Còn {daysRemaining} ngày
              </Text>
            )}
          </Space>
        );
      },
    },
  ];

  // Kanban View
  const renderKanbanView = () => {
    const kanbanData: Record<string, ProductTracking[]> = {
      in_progress: filteredProducts.filter((p) => p.status === "in_progress"),
      quality_check: filteredProducts.filter(
        (p) => p.status === "quality_check"
      ),
      completed: filteredProducts.filter((p) => p.status === "completed"),
      problem: filteredProducts.filter((p) => p.status === "problem"),
      complaint: filteredProducts.filter((p) => p.status === "complaint"),
    };

    const renderKanbanColumn = (
      title: string,
      status: string,
      products: ProductTracking[],
      color: string
    ) => (
      <Col xs={24} sm={12} lg={6} key={status}>
        <Card
          title={
            <Space>
              <Badge color={color} />
              <Text strong>{title}</Text>
              <Badge
                count={products.length}
                style={{ backgroundColor: color }}
              />
            </Space>
          }
          styles={{
            body: { padding: "12px", maxHeight: "70vh", overflowY: "auto" },
          }}
        >
          <Space vertical size="small" className="w-full">
            {products.map((product) => (
              <Card
                key={product.id}
                size="small"
                hoverable
                styles={{ body: { padding: "12px" } }}
              >
                <Space vertical size="small" className="w-full">
                  <Text strong className="text-sm">
                    {product.orderId}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {product.customer}
                  </Text>
                  <Text className="text-xs">{product.currentStage}</Text>
                  <Progress percent={product.stageProgress} size="small" />
                  <div className="flex items-center justify-between">
                    <Tag
                      color={getPriorityColor(product.priority)}
                      className="text-xs"
                    >
                      {getPriorityText(product.priority)}
                    </Tag>
                    <Text className="text-xs text-gray-500">
                      {dayjs(product.dueDate).format("DD/MM")}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between">
                    <Space size="small">
                      <ToolOutlined />
                      <Text className="text-xs">{product.technician}</Text>
                    </Space>
                    {product.notifications.length > 0 && (
                      <Badge count={product.notifications.length} size="small">
                        <BellOutlined className="text-blue-500" />
                      </Badge>
                    )}
                  </div>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
      </Col>
    );

    return (
      <Row gutter={[16, 16]}>
        {renderKanbanColumn(
          "Đang làm",
          "in_progress",
          kanbanData.in_progress,
          "#1890ff"
        )}
        {renderKanbanColumn(
          "Kiểm tra CL",
          "quality_check",
          kanbanData.quality_check,
          "#722ed1"
        )}
        {renderKanbanColumn(
          "Hoàn thành",
          "completed",
          kanbanData.completed,
          "#52c41a"
        )}
        {renderKanbanColumn(
          "Có vấn đề",
          "problem",
          kanbanData.problem,
          "#ff4d4f"
        )}
        {renderKanbanColumn(
          "Khiếu nại",
          "complaint",
          kanbanData.complaint,
          "#fa8c16"
        )}
      </Row>
    );
  };

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm đơn hàng, khách hàng, sản phẩm...",
          filterKeys: ["orderId", "invoiceNumber", "customer"],
        },
        filters: {
          fields: filterFields,
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
        buttonEnds: [],
      }}
      isEmpty={!filteredProducts?.length}
    >
      <Space vertical size="large" className="w-full">
        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng sản phẩm"
                value={totalProducts}
                prefix={<ShoppingOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đang xử lý"
                value={inProgress}
                prefix={<ClockCircleOutlined />}
                styles={{ content: { color: "#1890ff" } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Hoàn thành"
                value={completed}
                prefix={<CheckCircleOutlined />}
                styles={{ content: { color: "#52c41a" } }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Cảnh báo"
                value={problems + complaints + overdue}
                prefix={<WarningOutlined />}
                styles={{
                  content: {
                    color:
                      problems + complaints + overdue > 0
                        ? "#ff4d4f"
                        : undefined,
                  },
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Tabs
          activeKey={activeView}
          onChange={(key) => setActiveView(key as typeof activeView)}
          items={[
            {
              key: "list",
              label: (
                <span>
                  <ShoppingOutlined /> Danh sách
                </span>
              ),
              children: (
                <CommonTable<ProductTracking>
                  columns={columns}
                  dataSource={filteredProducts}
                  pagination={{
                    ...pagination,
                    onChange: handlePageChange,
                  }}
                  loading={false}
                  rank
                  paging
                  DrawerDetails={ProductTrackingDetailDrawer}
                />
              ),
            },
            {
              key: "kanban",
              label: (
                <span>
                  <EyeOutlined /> Kanban
                </span>
              ),
              children: renderKanbanView(),
            },
          ]}
        />
      </Space>
    </WrapperContent>
  );
}
