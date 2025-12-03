"use client";

import CommonTable, { type PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  ProjectOutlined,
  ShoppingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TableColumnsType } from "antd";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Image,
  Input,
  Modal,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const { Text, Title } = Typography;
const { TextArea } = Input;

interface WorkflowStage {
  stage: "pending" | "processing" | "quality_check" | "completed";
  technicianId: string;
  technicianName: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

interface ServiceItem {
  id: string;
  itemName: string; // Tên sản phẩm: "Giày Nike Air", "Túi Hermes"
  itemType: string; // Loại: "Giày", "Túi", "Ví"
  serviceType: string; // Dịch vụ: "Vệ sinh", "Sơn phục hồi", "Thay đế"
  price: number;
  currentStatus: "pending" | "processing" | "quality_check" | "completed";
  currentTechnician: string;
  workflow: WorkflowStage[]; // Lịch sử các công đoạn
  images: {
    before: string[];
    after: string[];
  };
  notes?: string;
}

interface StatusHistory {
  id: string;
  status: Order["status"];
  changedBy: string;
  changedAt: string;
  notes?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  customer: string;
  customerPhone: string;
  status:
    | "pending"
    | "processing"
    | "quality_check"
    | "completed"
    | "cancelled";
  paymentStatus: "unpaid" | "partial" | "paid";
  totalAmount: number;
  paidAmount: number;
  invoiceStaff: string;
  salesStaff: string;
  serviceItems: ServiceItem[]; // Danh sách items dịch vụ
  notes: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistory[];
}

const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "DH-2024-001",
    invoiceNumber: "HD-2024-001",
    invoiceDate: "2024-12-01",
    customer: "Nguyễn Tuấn Anh",
    customerPhone: "0901234567",
    status: "processing",
    paymentStatus: "partial",
    totalAmount: 2500000,
    paidAmount: 1000000,
    invoiceStaff: "Nguyễn Văn A",
    salesStaff: "Trần Thị B",
    serviceItems: [
      {
        id: "si1",
        itemName: "Giày Nike Air Force 1",
        itemType: "Giày",
        serviceType: "Vệ sinh + Sơn phục hồi",
        price: 1500000,
        currentStatus: "processing",
        currentTechnician: "Lê Văn C",
        workflow: [
          {
            stage: "pending",
            technicianId: "t1",
            technicianName: "Trần Thị B (Sale)",
            startedAt: "2024-12-01 08:30:00",
            completedAt: "2024-12-01 09:00:00",
            notes: "Tiếp nhận hàng, check tình trạng ban đầu",
          },
          {
            stage: "processing",
            technicianId: "t2",
            technicianName: "Lê Văn C",
            startedAt: "2024-12-01 09:00:00",
            notes: "Đang vệ sinh và sơn phục hồi",
          },
        ],
        images: {
          before: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300&h=300",
          ],
          after: [],
        },
        notes: "Yêu cầu sơn lại màu trắng nguyên bản",
      },
      {
        id: "si2",
        itemName: "Túi xách Louis Vuitton",
        itemType: "Túi",
        serviceType: "Vệ sinh da + Phục hồi góc túi",
        price: 1000000,
        currentStatus: "pending",
        currentTechnician: "Chưa phân công",
        workflow: [
          {
            stage: "pending",
            technicianId: "t1",
            technicianName: "Trần Thị B (Sale)",
            startedAt: "2024-12-01 08:30:00",
            notes: "Tiếp nhận, chờ xử lý",
          },
        ],
        images: {
          before: [
            "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=300&h=300",
          ],
          after: [],
        },
      },
    ],
    notes: "Khách hàng VIP, ưu tiên xử lý",
    createdAt: "2024-12-01 08:30:00",
    updatedAt: "2024-12-01 09:00:00",
    statusHistory: [
      {
        id: "h1",
        status: "pending",
        changedBy: "Nguyễn Văn A",
        changedAt: "2024-12-01 08:30:00",
        notes: "Tạo đơn hàng mới - 2 items",
      },
      {
        id: "h2",
        status: "processing",
        changedBy: "Lê Văn C",
        changedAt: "2024-12-01 09:00:00",
        notes: "Bắt đầu xử lý item 1: Giày Nike",
      },
    ],
  },
  {
    id: "2",
    orderNumber: "DH-2024-002",
    invoiceNumber: "HD-2024-002",
    invoiceDate: "2024-12-02",
    customer: "Trần Văn Hưng",
    customerPhone: "0912345678",
    status: "completed",
    paymentStatus: "paid",
    totalAmount: 800000,
    paidAmount: 800000,
    invoiceStaff: "Phạm Thị D",
    salesStaff: "Hoàng Văn E",
    serviceItems: [
      {
        id: "si3",
        itemName: "Ví da nam Gucci",
        itemType: "Ví",
        serviceType: "Vệ sinh + Dưỡng da",
        price: 800000,
        currentStatus: "completed",
        currentTechnician: "Hoàn thành",
        workflow: [
          {
            stage: "pending",
            technicianId: "t3",
            technicianName: "Hoàng Văn E (Sale)",
            startedAt: "2024-12-02 09:00:00",
            completedAt: "2024-12-02 10:00:00",
            notes: "Tiếp nhận, check tình trạng",
          },
          {
            stage: "processing",
            technicianId: "t4",
            technicianName: "Vũ Thị F",
            startedAt: "2024-12-02 10:00:00",
            completedAt: "2024-12-03 14:00:00",
            notes: "Vệ sinh sâu, dưỡng da chuyên sâu",
          },
          {
            stage: "quality_check",
            technicianId: "t5",
            technicianName: "Nguyễn Văn QC",
            startedAt: "2024-12-03 14:00:00",
            completedAt: "2024-12-03 15:00:00",
            notes: "Kiểm tra chất lượng - Đạt",
          },
          {
            stage: "completed",
            technicianId: "t3",
            technicianName: "Hoàng Văn E (Sale)",
            startedAt: "2024-12-03 15:00:00",
            completedAt: "2024-12-03 16:45:00",
            notes: "Đóng gói và giao cho khách",
          },
        ],
        images: {
          before: [
            "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=300&h=300",
          ],
          after: [
            "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=300&h=300",
          ],
        },
      },
    ],
    notes: "Khách hàng hài lòng",
    createdAt: "2024-12-02 09:00:00",
    updatedAt: "2024-12-03 16:45:00",
    statusHistory: [
      {
        id: "h3",
        status: "pending",
        changedBy: "Phạm Thị D",
        changedAt: "2024-12-02 09:00:00",
        notes: "Tạo đơn hàng - Ví Gucci",
      },
      {
        id: "h4",
        status: "processing",
        changedBy: "Vũ Thị F",
        changedAt: "2024-12-02 10:00:00",
        notes: "Vũ Thị F bắt đầu xử lý",
      },
      {
        id: "h5",
        status: "quality_check",
        changedBy: "Nguyễn Văn QC",
        changedAt: "2024-12-03 14:00:00",
        notes: "Chuyển QC kiểm tra",
      },
      {
        id: "h6",
        status: "completed",
        changedBy: "Hoàng Văn E",
        changedAt: "2024-12-03 16:45:00",
        notes: "Hoàn thành và giao hàng",
      },
    ],
  },
  {
    id: "3",
    orderNumber: "DH-2024-003",
    invoiceNumber: "HD-2024-003",
    invoiceDate: "2024-12-03",
    customer: "Lê Thị Bình",
    customerPhone: "0923456789",
    status: "quality_check",
    paymentStatus: "unpaid",
    totalAmount: 1200000,
    paidAmount: 0,
    invoiceStaff: "Đỗ Văn G",
    salesStaff: "Bùi Thị H",
    serviceItems: [
      {
        id: "si4",
        itemName: "Giày Adidas Ultraboost",
        itemType: "Giày",
        serviceType: "Vệ sinh chuyên sâu + Thay đế",
        price: 1200000,
        currentStatus: "quality_check",
        currentTechnician: "Nguyễn Văn QC",
        workflow: [
          {
            stage: "pending",
            technicianId: "t6",
            technicianName: "Bùi Thị H (Sale)",
            startedAt: "2024-12-03 10:15:00",
            completedAt: "2024-12-03 10:30:00",
            notes: "Tiếp nhận, chụp ảnh trước",
          },
          {
            stage: "processing",
            technicianId: "t7",
            technicianName: "Lý Văn I",
            startedAt: "2024-12-03 10:30:00",
            completedAt: "2024-12-03 11:00:00",
            notes: "Vệ sinh và thay đế giày",
          },
          {
            stage: "quality_check",
            technicianId: "t5",
            technicianName: "Nguyễn Văn QC",
            startedAt: "2024-12-03 11:00:00",
            notes: "Đang kiểm tra chất lượng đế mới",
          },
        ],
        images: {
          before: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300&h=300",
          ],
          after: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300&h=300",
          ],
        },
      },
    ],
    notes: "Đang kiểm tra chất lượng",
    createdAt: "2024-12-03 10:15:00",
    updatedAt: "2024-12-03 11:30:00",
    statusHistory: [
      {
        id: "h7",
        status: "pending",
        changedBy: "Đỗ Văn G",
        changedAt: "2024-12-03 10:15:00",
        notes: "Tạo đơn hàng",
      },
      {
        id: "h8",
        status: "processing",
        changedBy: "Lý Văn I",
        changedAt: "2024-12-03 10:30:00",
        notes: "Lý Văn I bắt đầu xử lý",
      },
      {
        id: "h9",
        status: "quality_check",
        changedBy: "Nguyễn Văn QC",
        changedAt: "2024-12-03 11:00:00",
        notes: "Chuyển QC kiểm tra",
      },
    ],
  },
  {
    id: "4",
    orderNumber: "DH-2024-004",
    invoiceNumber: "HD-2024-004",
    invoiceDate: "2024-12-01",
    customer: "Nguyễn Thị Mai",
    customerPhone: "0934567890",
    status: "pending",
    paymentStatus: "unpaid",
    totalAmount: 1500000,
    paidAmount: 0,
    invoiceStaff: "Nguyễn Thị K",
    salesStaff: "Trần Văn L",
    serviceItems: [
      {
        id: "si5",
        itemName: "Túi Chanel Classic",
        itemType: "Túi",
        serviceType: "Vệ sinh + Phục hồi màu da",
        price: 1500000,
        currentStatus: "pending",
        currentTechnician: "Chưa phân công",
        workflow: [
          {
            stage: "pending",
            technicianId: "t8",
            technicianName: "Trần Văn L (Sale)",
            startedAt: "2024-12-01 14:00:00",
            notes: "Đơn hàng mới, chờ xử lý",
          },
        ],
        images: {
          before: [
            "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=300&h=300",
          ],
          after: [],
        },
      },
    ],
    notes: "Đơn hàng mới",
    createdAt: "2024-12-01 14:00:00",
    updatedAt: "2024-12-01 14:00:00",
    statusHistory: [
      {
        id: "h10",
        status: "pending",
        changedBy: "Nguyễn Thị K",
        changedAt: "2024-12-01 14:00:00",
        notes: "Tạo đơn hàng mới",
      },
    ],
  },
];

const getStatusColor = (status: string) => {
  const colors = {
    pending: "default",
    processing: "processing",
    quality_check: "warning",
    completed: "success",
    cancelled: "error",
  };
  return colors[status as keyof typeof colors] || "default";
};

const getStatusText = (status: string) => {
  const texts = {
    pending: "Chờ xử lý",
    processing: "Đang sản xuất",
    quality_check: "Kiểm tra chất lượng",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  return texts[status as keyof typeof texts] || status;
};

const getPaymentStatusColor = (status: string) => {
  const colors = {
    unpaid: "error",
    partial: "warning",
    paid: "success",
  };
  return colors[status as keyof typeof colors] || "default";
};

const getPaymentStatusText = (status: string) => {
  const texts = {
    unpaid: "Chưa thanh toán",
    partial: "Thanh toán một phần",
    paid: "Đã thanh toán",
  };
  return texts[status as keyof typeof texts] || status;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// Kanban Card Component
interface KanbanCardProps {
  order: Order;
  onClick: () => void;
  onEdit: () => void;
  onExportPDF: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  order,
  onClick,
  onEdit,
  onExportPDF,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: order.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  // Get technicians from service items
  const technicians = order.serviceItems
    .filter(
      (item) =>
        item.currentTechnician &&
        item.currentTechnician !== "Chưa phân công" &&
        item.currentTechnician !== "Hoàn thành"
    )
    .map((item) => item.currentTechnician);
  const uniqueTechnicians = [...new Set(technicians)];

  const handleCardClick = () => {
    // Chỉ trigger onClick nếu không phải đang drag
    if (!isDragging) {
      onClick();
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners} style={{ touchAction: "none" }}>
        <Card
          size="small"
          hoverable
          styles={{ body: { padding: "12px" } }}
          onClick={handleCardClick}
          className="mb-2 hover:shadow-md transition-shadow cursor-pointer"
        >
          <Space vertical size="small" className="w-full">
            <div className="flex items-center justify-between">
              <Text strong className="text-sm">
                {order.orderNumber}
              </Text>
              <Space size="small">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<FileTextOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onExportPDF();
                  }}
                />
              </Space>
            </div>

            <div className="flex items-center justify-between">
              <Space size="small">
                <UserOutlined className="text-gray-400" />
                <Text className="text-xs text-gray-600">{order.customer}</Text>
              </Space>
              <Text className="text-xs text-gray-400">
                {dayjs(order.invoiceDate).format("DD/MM")}
              </Text>
            </div>

            <div className="flex items-center justify-between">
              <Text strong className="text-sm">
                {formatCurrency(order.totalAmount)}
              </Text>
              <Tag
                color={getPaymentStatusColor(order.paymentStatus)}
                className="text-xs"
              >
                {getPaymentStatusText(order.paymentStatus)}
              </Tag>
            </div>

            {order.serviceItems.length > 0 && (
              <div className="flex items-center justify-between pt-1 border-t">
                <Space size="small">
                  <ProjectOutlined className="text-blue-500" />
                  <Text className="text-xs text-gray-500">
                    {order.serviceItems.length} dịch vụ
                  </Text>
                </Space>
                {uniqueTechnicians.length > 0 && (
                  <Avatar.Group maxCount={2} size="small">
                    {uniqueTechnicians.map((tech, idx) => (
                      <Avatar
                        key={idx}
                        size="small"
                        style={{
                          backgroundColor: `hsl(${idx * 137.5}, 70%, 50%)`,
                        }}
                      >
                        {tech.charAt(0)}
                      </Avatar>
                    ))}
                  </Avatar.Group>
                )}
              </div>
            )}
          </Space>
        </Card>
      </div>
    </div>
  );
};

// Droppable Column Component
interface DroppableColumnProps {
  id: string;
  title: string;
  color: string;
  orders: Order[];
  onCardClick: (order: Order) => void;
  onEdit: (order: Order) => void;
  onExportPDF: (order: Order) => void;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  id,
  title,
  color,
  orders,
  onCardClick,
  onEdit,
  onExportPDF,
}) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <Col xs={24} sm={12} lg={6}>
      <Card
        title={
          <Space>
            <Badge color={color} />
            <Text strong>{title}</Text>
            <Badge count={orders.length} style={{ backgroundColor: color }} />
          </Space>
        }
        styles={{
          body: {
            padding: "8px",
            height: "calc(100vh - 280px)",
            overflow: "hidden",
          },
        }}
        className="shadow-sm"
      >
        <div
          ref={setNodeRef}
          style={{
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: "4px",
          }}
          className="scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          <SortableContext
            items={orders.map((o) => o.id)}
            strategy={verticalListSortingStrategy}
          >
            {orders.map((order) => (
              <KanbanCard
                key={order.id}
                order={order}
                onClick={() => onCardClick(order)}
                onEdit={() => onEdit(order)}
                onExportPDF={() => onExportPDF(order)}
              />
            ))}
            {orders.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <Text type="secondary" className="text-xs">
                  Không có đơn hàng
                </Text>
              </div>
            )}
          </SortableContext>
        </div>
      </Card>
    </Col>
  );
};

// Order Detail Drawer
const OrderDetailDrawer: React.FC<PropRowDetails<Order>> = ({ data }) => {
  if (!data) return null;

  const paymentProgress = Math.round(
    (data.paidAmount / data.totalAmount) * 100
  );

  return (
    <Space vertical size="large" className="w-full">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Số đơn hàng">
          <Text strong>{data.orderNumber}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Số hóa đơn">
          <Text strong>{data.invoiceNumber}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Ngày in hóa đơn">
          {dayjs(data.invoiceDate).format("DD/MM/YYYY")}
        </Descriptions.Item>
        <Descriptions.Item label="Khách hàng">
          <Text strong>{data.customer}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Tình trạng">
          <Tag color={getStatusColor(data.status)}>
            {getStatusText(data.status)}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Thanh toán">
          <Space vertical size="small" className="w-full">
            <Tag color={getPaymentStatusColor(data.paymentStatus)}>
              {getPaymentStatusText(data.paymentStatus)}
            </Tag>
            <Progress percent={paymentProgress} size="small" />
            <Text className="text-xs">
              Đã thanh toán: {formatCurrency(data.paidAmount)} /{" "}
              {formatCurrency(data.totalAmount)}
            </Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="NV lập hóa đơn">
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            {data.invoiceStaff}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="NV Sale">
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            {data.salesStaff}
          </Space>
        </Descriptions.Item>
      </Descriptions>

      <div>
        <Title level={5}>Danh sách dịch vụ</Title>
        {data.serviceItems.map((item) => (
          <Card key={item.id} size="small" className="mb-3">
            <Space vertical size="middle" className="w-full">
              <div className="flex items-start justify-between">
                <Space vertical size="small">
                  <Text strong className="text-base">
                    {item.itemName}
                  </Text>
                  <Space size="small">
                    <Tag color="blue">{item.itemType}</Tag>
                    <Tag color="green">{item.serviceType}</Tag>
                  </Space>
                  <Text strong className="text-lg" style={{ color: "#d4380d" }}>
                    {formatCurrency(item.price)}
                  </Text>
                </Space>
                <Tag
                  color={getStatusColor(item.currentStatus)}
                  className="text-sm"
                >
                  {getStatusText(item.currentStatus)}
                </Tag>
              </div>

              {item.notes && (
                <div className="p-2 bg-gray-50 rounded">
                  <Text className="text-xs italic">{item.notes}</Text>
                </div>
              )}

              <div>
                <Text strong className="text-sm">
                  Tiến độ công việc:
                </Text>
                <Timeline
                  className="mt-2"
                  items={item.workflow.map((stage) => ({
                    color: getStatusColor(stage.stage),
                    dot: stage.completedAt ? (
                      <CheckCircleOutlined />
                    ) : (
                      <ClockCircleOutlined />
                    ),
                    children: (
                      <Space vertical size="small">
                        <Space>
                          <Text strong>{getStatusText(stage.stage)}</Text>
                          <Tag color="cyan">{stage.technicianName}</Tag>
                        </Space>
                        <Text className="text-xs text-gray-500">
                          Bắt đầu:{" "}
                          {dayjs(stage.startedAt).format("DD/MM/YYYY HH:mm")}
                          {stage.completedAt && (
                            <>
                              {" "}
                              - Hoàn thành:{" "}
                              {dayjs(stage.completedAt).format(
                                "DD/MM/YYYY HH:mm"
                              )}
                            </>
                          )}
                        </Text>
                        {stage.notes && (
                          <Text className="text-xs">{stage.notes}</Text>
                        )}
                      </Space>
                    ),
                  }))}
                />
              </div>

              {(item.images.before.length > 0 ||
                item.images.after.length > 0) && (
                <div>
                  <Text strong className="text-sm">
                    Hình ảnh:
                  </Text>
                  <Row gutter={[8, 8]} className="mt-2">
                    {item.images.before.length > 0 && (
                      <Col span={12}>
                        <Text className="text-xs text-gray-500">Trước:</Text>
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
                                  style={{
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                  }}
                                />
                              ))}
                            </Space>
                          </Image.PreviewGroup>
                        </div>
                      </Col>
                    )}
                    {item.images.after.length > 0 && (
                      <Col span={12}>
                        <Text className="text-xs text-gray-500">Sau:</Text>
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
                                  style={{
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                  }}
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
      </div>

      {data.notes && (
        <div>
          <Title level={5}>Ghi chú</Title>
          <Text>{data.notes}</Text>
        </div>
      )}

      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Ngày tạo">
          {dayjs(data.createdAt).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
        <Descriptions.Item label="Cập nhật">
          {dayjs(data.updatedAt).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
      </Descriptions>
    </Space>
  );
};

export default function OrdersPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<"list" | "kanban" | "dashboard">(
    "list"
  );
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 0,
        tolerance: 5,
      },
    })
  );

  const {
    query,
    pagination,
    updateQueries,
    reset,
    applyFilter,
    handlePageChange,
  } = useFilter();

  const filteredOrders = applyFilter(orders);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the order being dragged
    const draggedOrder = orders.find((order) => order.id === activeId);
    if (!draggedOrder) return;

    // Determine new status based on drop target
    let newStatus: Order["status"] = draggedOrder.status;
    if (overId === "pending") newStatus = "pending";
    else if (overId === "processing") newStatus = "processing";
    else if (overId === "quality_check") newStatus = "quality_check";
    else if (overId === "completed") newStatus = "completed";

    if (newStatus !== draggedOrder.status) {
      // Update order status
      const updatedOrders = orders.map((order) => {
        if (order.id === activeId) {
          const newHistoryEntry: StatusHistory = {
            id: `h${new Date().getTime()}`,
            status: newStatus,
            changedBy: "Admin", // In real app, get from current user
            changedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            notes: `Thay đổi trạng thái từ ${getStatusText(
              draggedOrder.status
            )} sang ${getStatusText(newStatus)}`,
          };

          return {
            ...order,
            status: newStatus,
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            statusHistory: [...order.statusHistory, newHistoryEntry],
          };
        }
        return order;
      });

      setOrders(updatedOrders);
    }
  };

  // Handle card click
  const handleCardClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  // Handle edit order
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsEditModalVisible(true);
  };

  // Handle save edit
  const handleSaveEdit = (values: Partial<Order>) => {
    if (!editingOrder) return;

    const updatedOrders = orders.map((order) => {
      if (order.id === editingOrder.id) {
        return {
          ...order,
          ...values,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    setIsEditModalVisible(false);
    setEditingOrder(null);
  };

  // Handle export PDF
  const handleExportPDF = (order: Order) => {
    // In a real app, this would generate a PDF
    // For now, we'll use window.print with print-specific styling
    const printContent = `
      <html>
        <head>
          <title>Đơn hàng ${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ĐƠN HÀNG ${order.orderNumber}</h1>
            <p>Hóa đơn: ${order.invoiceNumber}</p>
          </div>

          <div class="info">
            <p><strong>Khách hàng:</strong> ${order.customer}</p>
            <p><strong>SĐT:</strong> ${order.customerPhone}</p>
            <p><strong>Ngày tạo:</strong> ${dayjs(order.createdAt).format(
              "DD/MM/YYYY HH:mm"
            )}</p>
            <p><strong>Trạng thái:</strong> ${getStatusText(order.status)}</p>
            <p><strong>NV Sale:</strong> ${order.salesStaff}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Dịch vụ</th>
                <th>Sản phẩm</th>
                <th>Loại</th>
                <th>Giá</th>
              </tr>
            </thead>
            <tbody>
              ${order.serviceItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.serviceType}</td>
                  <td>${item.itemName}</td>
                  <td>${item.itemType}</td>
                  <td>${formatCurrency(item.price)}</td>
                </tr>
              `
                )
                .join("")}
              <tr class="total">
                <td colspan="3"><strong>Tổng cộng</strong></td>
                <td><strong>${formatCurrency(order.totalAmount)}</strong></td>
              </tr>
            </tbody>
          </table>

          ${
            order.notes ? `<p><strong>Ghi chú:</strong> ${order.notes}</p>` : ""
          }
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const processingOrders = orders.filter(
    (o) => o.status === "processing"
  ).length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const unpaidOrders = orders.filter(
    (o) => o.paymentStatus === "unpaid"
  ).length;

  // Filter fields
  const filterFields = [
    {
      name: "status",
      label: "Tình trạng",
      type: "select" as const,
      options: [
        { label: "Chờ xử lý", value: "pending" },
        { label: "Đang sản xuất", value: "processing" },
        { label: "Kiểm tra chất lượng", value: "quality_check" },
        { label: "Hoàn thành", value: "completed" },
        { label: "Đã hủy", value: "cancelled" },
      ],
    },
    {
      name: "paymentStatus",
      label: "Thanh toán",
      type: "select" as const,
      options: [
        { label: "Chưa thanh toán", value: "unpaid" },
        { label: "Thanh toán một phần", value: "partial" },
        { label: "Đã thanh toán", value: "paid" },
      ],
    },
    {
      name: "invoiceDate",
      label: "Ngày hóa đơn",
      type: "date" as const,
    },
  ];

  // Table columns
  const columns: TableColumnsType<Order> = [
    {
      title: "Số ĐH / HĐ",
      key: "orderInfo",
      width: 180,
      fixed: "left",
      render: (_: unknown, record: Order) => (
        <Space vertical size={0}>
          <Text strong className="text-sm">
            {record.orderNumber}
          </Text>
          <Text className="text-xs text-gray-500">{record.invoiceNumber}</Text>
        </Space>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      key: "customer",
      width: 200,
      fixed: "left",
    },
    {
      title: "Ngày HĐ",
      dataIndex: "invoiceDate",
      key: "invoiceDate",
      width: 120,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Tình trạng",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Thanh toán",
      key: "payment",
      width: 180,
      render: (_: unknown, record: Order) => (
        <Space vertical size="small" className="w-full">
          <Tag color={getPaymentStatusColor(record.paymentStatus)}>
            {getPaymentStatusText(record.paymentStatus)}
          </Tag>
          <Progress
            percent={Math.round((record.paidAmount / record.totalAmount) * 100)}
            size="small"
            showInfo={false}
          />
        </Space>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 150,
      align: "right",
      render: (amount: number) => <Text strong>{formatCurrency(amount)}</Text>,
    },
    {
      title: "NV Hóa đơn",
      dataIndex: "invoiceStaff",
      key: "invoiceStaff",
      width: 140,
    },
    {
      title: "NV Sale",
      dataIndex: "salesStaff",
      key: "salesStaff",
      width: 140,
    },
    {
      title: "Kỹ thuật",
      dataIndex: "technician",
      key: "technician",
      width: 140,
      fixed: "right",
    },
  ];

  // Kanban View
  const renderKanbanView = () => {
    const kanbanData: Record<string, Order[]> = {
      pending: filteredOrders.filter((o) => o.status === "pending"),
      processing: filteredOrders.filter((o) => o.status === "processing"),
      quality_check: filteredOrders.filter((o) => o.status === "quality_check"),
      completed: filteredOrders.filter((o) => o.status === "completed"),
    };

    const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null;

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Row gutter={[16, 16]}>
          <DroppableColumn
            id="pending"
            title="Chờ xử lý"
            color="#d9d9d9"
            orders={kanbanData.pending}
            onCardClick={handleCardClick}
            onEdit={handleEditOrder}
            onExportPDF={handleExportPDF}
          />
          <DroppableColumn
            id="processing"
            title="Đang sản xuất"
            color="#1890ff"
            orders={kanbanData.processing}
            onCardClick={handleCardClick}
            onEdit={handleEditOrder}
            onExportPDF={handleExportPDF}
          />
          <DroppableColumn
            id="quality_check"
            title="Kiểm tra CL"
            color="#faad14"
            orders={kanbanData.quality_check}
            onCardClick={handleCardClick}
            onEdit={handleEditOrder}
            onExportPDF={handleExportPDF}
          />
          <DroppableColumn
            id="completed"
            title="Hoàn thành"
            color="#52c41a"
            orders={kanbanData.completed}
            onCardClick={handleCardClick}
            onEdit={handleEditOrder}
            onExportPDF={handleExportPDF}
          />
        </Row>
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}
        >
          {activeOrder ? (
            <Card
              size="small"
              styles={{ body: { padding: "12px", marginBottom: "8px" } }}
              className="shadow-2xl rotate-2 scale-105 opacity-95"
              style={{ width: "280px", marginBottom: "8px" }}
            >
              <Space vertical size="small" className="w-full">
                <div className="flex items-center justify-between">
                  <Text strong className="text-sm">
                    {activeOrder.orderNumber}
                  </Text>
                  <Tag
                    color={getStatusColor(activeOrder.status)}
                    className="text-xs"
                  >
                    {getStatusText(activeOrder.status)}
                  </Tag>
                </div>
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-gray-400 text-xs" />
                  <Text className="text-xs text-gray-600">
                    {activeOrder.customer}
                  </Text>
                </div>
                <Text strong className="text-sm" style={{ color: "#1890ff" }}>
                  {formatCurrency(activeOrder.totalAmount)}
                </Text>
                {activeOrder.serviceItems.length > 0 && (
                  <div className="flex items-center gap-1 pt-1 border-t">
                    <ProjectOutlined className="text-blue-500 text-xs" />
                    <Text className="text-xs text-gray-500">
                      {activeOrder.serviceItems.length} dịch vụ
                    </Text>
                  </div>
                )}
              </Space>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };

  // Dashboard View
  const renderDashboardView = () => (
    <Space vertical size="large" className="w-full">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={totalOrders}
              prefix={<ShoppingOutlined />}
              suffix="đơn"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Chờ xử lý"
              value={pendingOrders}
              prefix={<ClockCircleOutlined />}
              styles={{
                content: { color: pendingOrders > 0 ? "#faad14" : undefined },
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đang sản xuất"
              value={processingOrders}
              prefix={<ProjectOutlined />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={completedOrders}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: "#52c41a" } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={totalRevenue}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Đã thu"
              value={totalPaid}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(Number(value))}
              styles={{ content: { color: "#52c41a" } }}
            />
            <Progress
              percent={Math.round((totalPaid / totalRevenue) * 100)}
              size="small"
              className="mt-2"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Đơn hàng gần đây">
            <Table
              dataSource={filteredOrders.slice(0, 5)}
              columns={columns.slice(0, 6)}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Cảnh báo thanh toán">
            <Space vertical size="middle" className="w-full">
              <div className="p-3 bg-red-50 rounded">
                <Text strong className="text-red-600">
                  Chưa thanh toán: {unpaidOrders} đơn
                </Text>
              </div>
              {orders
                .filter((o) => o.paymentStatus === "unpaid")
                .slice(0, 3)
                .map((order) => (
                  <div key={order.id} className="p-2 border rounded">
                    <Text strong className="text-sm">
                      {order.orderNumber}
                    </Text>
                    <div className="mt-1">
                      <Text className="text-xs text-gray-500">
                        {order.customer}
                      </Text>
                    </div>
                    <div className="mt-1">
                      <Text strong className="text-sm text-red-600">
                        {formatCurrency(order.totalAmount)}
                      </Text>
                    </div>
                  </div>
                ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );

  return (
    <WrapperContent
      title="Quản lý Đơn hàng"
      header={{
        searchInput: {
          placeholder: "Tìm kiếm đơn hàng, hóa đơn, khách hàng...",
          filterKeys: ["orderNumber", "invoiceNumber", "customer"],
        },
        filters: {
          fields: filterFields,
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
        buttonEnds: [
          {
            name: "Tạo đơn hàng",
            icon: <PlusOutlined />,
            type: "primary",
            onClick: () => router.push("/orders/create"),
          },
        ],
      }}
      isEmpty={!filteredOrders?.length}
    >
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
              <CommonTable<Order>
                columns={columns}
                dataSource={filteredOrders}
                pagination={{
                  ...pagination,
                  onChange: handlePageChange,
                }}
                loading={false}
                rank
                paging
                DrawerDetails={OrderDetailDrawer}
              />
            ),
          },
          {
            key: "kanban",
            label: (
              <span>
                <ProjectOutlined /> Kanban
              </span>
            ),
            children: renderKanbanView(),
          },
          {
            key: "dashboard",
            label: (
              <span>
                <CalendarOutlined /> Dashboard
              </span>
            ),
            children: renderDashboardView(),
          },
        ]}
      />

      {/* Modals */}
      <OrderDetailModal
        visible={isModalVisible}
        order={selectedOrder}
        onClose={() => setIsModalVisible(false)}
        onEdit={() => {
          setIsModalVisible(false);
          handleEditOrder(selectedOrder!);
        }}
        onExportPDF={() => handleExportPDF(selectedOrder!)}
      />

      <EditOrderModal
        visible={isEditModalVisible}
        order={editingOrder}
        onCancel={() => setIsEditModalVisible(false)}
        onSave={handleSaveEdit}
      />
    </WrapperContent>
  );
}

// Order Detail Modal
const OrderDetailModal: React.FC<{
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onEdit: () => void;
  onExportPDF: () => void;
}> = ({ visible, order, onClose, onEdit, onExportPDF }) => {
  if (!order) return null;

  const paymentProgress = Math.round(
    (order.paidAmount / order.totalAmount) * 100
  );

  return (
    <Modal
      title={
        <Space>
          <Text strong>{order.orderNumber}</Text>
          <Tag color={getStatusColor(order.status)}>
            {getStatusText(order.status)}
          </Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="export" icon={<FileTextOutlined />} onClick={onExportPDF}>
          Xuất PDF
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={onEdit}
        >
          Sửa
        </Button>,
      ]}
    >
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: "Thông tin đơn hàng",
            children: (
              <Space vertical size="large" className="w-full">
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Số đơn hàng">
                    <Text strong>{order.orderNumber}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số hóa đơn">
                    <Text strong>{order.invoiceNumber}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày in hóa đơn">
                    {dayjs(order.invoiceDate).format("DD/MM/YYYY")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Khách hàng">
                    <Text strong>{order.customer}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thanh toán">
                    <Space vertical size="small" className="w-full">
                      <Tag color={getPaymentStatusColor(order.paymentStatus)}>
                        {getPaymentStatusText(order.paymentStatus)}
                      </Tag>
                      <Progress percent={paymentProgress} size="small" />
                      <Text className="text-xs">
                        Đã thanh toán: {formatCurrency(order.paidAmount)} /{" "}
                        {formatCurrency(order.totalAmount)}
                      </Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="NV lập hóa đơn">
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      {order.invoiceStaff}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="NV Sale">
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      {order.salesStaff}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>

                <div>
                  <Title level={5}>Danh sách dịch vụ</Title>
                  {order.serviceItems.map((item) => (
                    <Card key={item.id} size="small" className="mb-3">
                      <Space vertical size="middle" className="w-full">
                        <div className="flex items-start justify-between">
                          <Space vertical size="small">
                            <Text strong className="text-base">
                              {item.itemName}
                            </Text>
                            <Space size="small">
                              <Tag color="blue">{item.itemType}</Tag>
                              <Tag color="green">{item.serviceType}</Tag>
                            </Space>
                            <Text
                              strong
                              className="text-lg"
                              style={{ color: "#d4380d" }}
                            >
                              {formatCurrency(item.price)}
                            </Text>
                          </Space>
                          <Tag
                            color={getStatusColor(item.currentStatus)}
                            className="text-sm"
                          >
                            {getStatusText(item.currentStatus)}
                          </Tag>
                        </div>

                        {item.notes && (
                          <div className="p-2 bg-gray-50 rounded">
                            <Text className="text-xs italic">{item.notes}</Text>
                          </div>
                        )}

                        <div>
                          <Text strong className="text-sm">
                            Tiến độ công việc:
                          </Text>
                          <Timeline
                            className="mt-2"
                            items={item.workflow.map((stage) => ({
                              color: getStatusColor(stage.stage),
                              dot: stage.completedAt ? (
                                <CheckCircleOutlined />
                              ) : (
                                <ClockCircleOutlined />
                              ),
                              children: (
                                <Space vertical size="small">
                                  <Space>
                                    <Text strong>
                                      {getStatusText(stage.stage)}
                                    </Text>
                                    <Tag color="cyan">
                                      {stage.technicianName}
                                    </Tag>
                                  </Space>
                                  <Text className="text-xs text-gray-500">
                                    Bắt đầu:{" "}
                                    {dayjs(stage.startedAt).format(
                                      "DD/MM/YYYY HH:mm"
                                    )}
                                    {stage.completedAt && (
                                      <>
                                        {" "}
                                        - Hoàn thành:{" "}
                                        {dayjs(stage.completedAt).format(
                                          "DD/MM/YYYY HH:mm"
                                        )}
                                      </>
                                    )}
                                  </Text>
                                  {stage.notes && (
                                    <Text className="text-xs">
                                      {stage.notes}
                                    </Text>
                                  )}
                                </Space>
                              ),
                            }))}
                          />
                        </div>

                        {(item.images.before.length > 0 ||
                          item.images.after.length > 0) && (
                          <div>
                            <Text strong className="text-sm">
                              Hình ảnh:
                            </Text>
                            <Row gutter={[8, 8]} className="mt-2">
                              {item.images.before.length > 0 && (
                                <Col span={12}>
                                  <Text className="text-xs text-gray-500">
                                    Trước:
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
                                            style={{
                                              objectFit: "cover",
                                              borderRadius: "4px",
                                            }}
                                          />
                                        ))}
                                      </Space>
                                    </Image.PreviewGroup>
                                  </div>
                                </Col>
                              )}
                              {item.images.after.length > 0 && (
                                <Col span={12}>
                                  <Text className="text-xs text-gray-500">
                                    Sau:
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
                                            style={{
                                              objectFit: "cover",
                                              borderRadius: "4px",
                                            }}
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
                </div>

                {order.notes && (
                  <div>
                    <Title level={5}>Ghi chú</Title>
                    <Text>{order.notes}</Text>
                  </div>
                )}

                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Ngày tạo">
                    {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Cập nhật">
                    {dayjs(order.updatedAt).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                </Descriptions>
              </Space>
            ),
          },
          {
            key: "2",
            label: "Lịch sử trạng thái",
            children: (
              <Timeline
                items={order.statusHistory.map((history) => ({
                  color: getStatusColor(history.status),
                  children: (
                    <Space vertical size="small">
                      <Text strong>{getStatusText(history.status)}</Text>
                      <Text className="text-xs text-gray-500">
                        {dayjs(history.changedAt).format("DD/MM/YYYY HH:mm")} -{" "}
                        {history.changedBy}
                      </Text>
                      {history.notes && (
                        <Text className="text-xs">{history.notes}</Text>
                      )}
                    </Space>
                  ),
                }))}
              />
            ),
          },
        ]}
      />
    </Modal>
  );
};

// Edit Order Modal
const EditOrderModal: React.FC<{
  visible: boolean;
  order: Order | null;
  onCancel: () => void;
  onSave: (values: Partial<Order>) => void;
}> = ({ visible, order, onCancel, onSave }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (order) {
      form.setFieldsValue({
        salesStaff: order.salesStaff,
        notes: order.notes,
      });
    }
  }, [order, form]);

  const handleFinish = (values: Partial<Order>) => {
    onSave(values);
    form.resetFields();
  };

  return (
    <Modal
      title={`Sửa đơn hàng ${order?.orderNumber}`}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="salesStaff"
          label="NV Sale"
          rules={[{ required: true, message: "Vui lòng nhập NV Sale" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="notes" label="Ghi chú">
          <TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
