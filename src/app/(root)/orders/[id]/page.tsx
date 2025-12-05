"use client";

import WrapperContent from "@/components/WrapperContent";
import { useRealtimeDoc } from "@/firebase/hooks/useRealtime";
import { getFallback } from "@/utils/getFallBack";
import {
  CalendarOutlined,
  CreditCardOutlined,
  EditOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Card,
  Col,
  Descriptions,
  Empty,
  Image,
  Progress,
  Row,
  Space,
  Spin,
  Steps,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { DiscountType } from "../../../../types/enum";
import type { FirebaseStageData, Order, Staff } from "../../../../types/order";
import { OrderStatus, StageStatus } from "../../../../types/order";

const { Text, Title } = Typography;

const getStatusInfo = (status: OrderStatus) => {
  const info = {
    [OrderStatus.PENDING]: { color: "default", text: "Chờ xử lý" },
    [OrderStatus.IN_PROGRESS]: { color: "processing", text: "Đang thực hiện" },
    [OrderStatus.COMPLETED]: { color: "success", text: "Hoàn thành" },
    [OrderStatus.CANCELLED]: { color: "error", text: "Đã hủy" },
  };
  return info[status] || info[OrderStatus.PENDING];
};

const getStageStatusInfo = (status: string) => {
  const info = {
    [StageStatus.Pending]: { text: "Chờ xử lý", status: "wait" as const },
    [StageStatus.InProgress]: {
      text: "Đang thực hiện",
      status: "process" as const,
    },
    [StageStatus.Completed]: { text: "Hoàn thành", status: "finish" as const },
  };
  return info[status as keyof typeof info] || info[StageStatus.Pending];
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading: orderLoading } = useRealtimeDoc<Order>(
    `xoxo/orders/${orderId}`
  );
  const { data: staffData, isLoading: staffLoading } =
    useRealtimeDoc<Record<string, Staff>>(`xoxo/employees`);

  const staffMap = useMemo(() => {
    if (!staffData) return {} as Record<string, Staff>;
    return staffData;
  }, [staffData]);

  const products = useMemo(() => {
    if (!order?.products) return [];
    return Object.entries(order.products).map(([id, data]) => ({
      id,
      ...data,
    }));
  }, [order?.products]);

  const totalStages = useMemo(() => {
    return products.reduce(
      (acc, p) => acc + (p.stages ? Object.keys(p.stages).length : 0),
      0
    );
  }, [products]);

  const completedStages = useMemo(() => {
    return products.reduce((acc, p) => {
      if (!p.stages) return acc;
      return (
        acc +
        Object.values(p.stages).filter(
          (s: FirebaseStageData) => s.status === StageStatus.Completed
        ).length
      );
    }, 0);
  }, [products]);

  const progress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  const orderSummary = useMemo(() => {
    if (!order) return { subtotal: 0, discountAmount: 0, total: 0 };

    const subtotal = products.reduce(
      (sum, product) => sum + product.quantity * (product.price || 0),
      0
    );
    const discount = order.discount || 0;
    const discountAmount =
      order.discountType === DiscountType.Percentage
        ? (subtotal * discount) / 100
        : discount;
    const shippingFee = order.shippingFee || 0;
    const total = subtotal - discountAmount + shippingFee;

    return {
      subtotal: subtotal || 0,
      discountAmount: discountAmount || 0,
      total: total || 0,
    };
  }, [order, products]);

  if (orderLoading || staffLoading) {
    return (
      <WrapperContent
        title="Chi tiết đơn hàng"
        header={{
          buttonBackTo: "/orders",
        }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Spin size="large" />
        </div>
      </WrapperContent>
    );
  }

  if (!order) {
    return (
      <WrapperContent
        title="Chi tiết đơn hàng"
        header={{
          buttonBackTo: "/orders",
        }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Empty description="Không tìm thấy đơn hàng" />
        </div>
      </WrapperContent>
    );
  }

  const createdByStaff = staffMap?.[order.createdBy];

  return (
    <WrapperContent
      title={`Chi tiết đơn hàng của khách ${order.customerName}`}
      header={{
        buttonBackTo: "/orders",
        buttonEnds: [
          {
            name: "Chỉnh sửa",
            icon: <EditOutlined />,
            type: "primary",
            onClick: () => router.push(`/orders/${orderId}/update`),
          },
        ],
      }}
    >
      <div className="space-y-6 flex flex-col gap-4">
        {/* Order Status & Progress */}
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <Title level={3} className="mb-2!">
                Mã: {order.code}
              </Title>
            </div>
            <Tag
              color={getStatusInfo(order.status).color}
              className="text-lg px-4 py-2"
            >
              {getStatusInfo(order.status).text}
            </Tag>
          </div>
          <div className="mt-2">
            <Text strong className="mb-2 block">
              Tiến độ thực hiện: {Math.round(progress)}%
            </Text>
            <Progress
              strokeColor={{
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
              className="mb-1"
              percent={progress}
            />
            <Text type="secondary" className="text-sm">
              {completedStages}/{totalStages} công đoạn đã hoàn thành
            </Text>
          </div>
        </Card>

        <Row gutter={24}>
          <Col span={16}>
            <div className="space-y-6 flex flex-col gap-4">
              {/* Customer Information */}
              <Card
                title={
                  <Space>
                    <UserOutlined />
                    <Text strong>Thông tin khách hàng</Text>
                  </Space>
                }
              >
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Tên khách hàng">
                    <Space>
                      <UserOutlined />
                      {order.customerName}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    <Space>
                      <PhoneOutlined />
                      <Text copyable>{order.phone}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    <Space>
                      <MailOutlined />
                      <Text copyable>{order.email}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ">
                    <Space>
                      <EnvironmentOutlined />
                      {order.address}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Products List */}
              <Card
                title={
                  <Space>
                    <ShoppingCartOutlined />
                    <Text strong>Danh sách sản phẩm ({products.length})</Text>
                  </Space>
                }
              >
                <div className="space-y-6 flex flex-col gap-4">
                  {products.map((product) => (
                    <ProductDetailCard
                      key={product.id}
                      product={product}
                      staffMap={staffMap}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </Col>

          <Col span={8}>
            <div className="space-y-6 flex flex-col gap-4">
              {/* Order Information */}
              <Card
                title={
                  <Space>
                    <CalendarOutlined />
                    <Text strong>Thông tin đơn hàng</Text>
                  </Space>
                }
                className="mb-6"
              >
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Ngày đặt">
                    {dayjs(order.orderDate).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày giao dự kiến">
                    {dayjs(order.deliveryDate).format("DD/MM/YYYY")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo">
                    {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                  {order.updatedAt && (
                    <Descriptions.Item label="Cập nhật lần cuối">
                      {dayjs(order.updatedAt).format("DD/MM/YYYY HH:mm")}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Nhân viên tạo">
                    <Space>
                      <Avatar size="small">
                        {createdByStaff?.name?.charAt(0) ||
                          order.createdByName?.charAt(0)}
                      </Avatar>
                      {createdByStaff?.name || order.createdByName}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
                {order.notes && (
                  <div className="mt-4">
                    <Text strong>Ghi chú:</Text>
                    <div className="mt-2 p-3 bg-gray-50 rounded border">
                      <Text>{order.notes}</Text>
                    </div>
                  </div>
                )}
              </Card>

              {/* Order Summary */}
              <Card
                title={
                  <Space>
                    <CreditCardOutlined />
                    <Text strong>Tổng kết đơn hàng</Text>
                  </Space>
                }
              >
                <div className="space-y-3 flex flex-col">
                  <div className="flex justify-between">
                    <Text>Tạm tính:</Text>
                    <Text>
                      {orderSummary.subtotal.toLocaleString("vi-VN")} VNĐ
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Chiết khấu:</Text>
                    <Text>
                      -{orderSummary.discountAmount.toLocaleString("vi-VN")} VNĐ
                      {order.discountType === DiscountType.Percentage &&
                        order.discount > 0 &&
                        ` (${order.discount}%)`}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Phí vận chuyển:</Text>
                    <Text>
                      +{(order.shippingFee || 0).toLocaleString("vi-VN")} VNĐ
                    </Text>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-300">
                    <Text strong className="text-lg">
                      Tổng cộng:
                    </Text>
                    <Text strong className="text-lg text-primary">
                      {orderSummary.total.toLocaleString("vi-VN")} VNĐ
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </div>
    </WrapperContent>
  );
}

// Product Detail Component
const ProductDetailCard = ({
  product,
  staffMap,
}: {
  product: any;
  staffMap: Record<string, Staff>;
}) => {
  const stages = useMemo(() => {
    if (!product.stages) return [];
    return Object.entries(product.stages).map(([id, stage]) => {
      const stageData = stage as FirebaseStageData;
      return {
        id,
        workflowId: stageData.workflowId,
        workflowName: stageData.workflowName,
        employees: stageData.employees,
        status: stageData.status,
        updatedAt: stageData.updatedAt,
      };
    });
  }, [product.stages]);

  const currentStageIndex = stages.findIndex(
    (s) => s.status === StageStatus.InProgress
  );

  const stepsItems = stages.map((stage, index) => {
    const statusInfo = getStageStatusInfo(stage.status);
    const isActive = stage.status === StageStatus.InProgress;
    const isCompleted = stage.status === StageStatus.Completed;
    const isPending = stage.status === StageStatus.Pending;

    return {
      title: (
        <div className="flex items-center gap-2">
          <Text
            strong
            className={
              isActive ? "text-blue-600" : isCompleted ? "text-green-600" : ""
            }
          >
            {stage.workflowName || `Công đoạn ${index + 1}`}
          </Text>
          {isActive && <Tag color="processing">Đang thực hiện</Tag>}
          {isCompleted && <Tag color="success">Hoàn thành</Tag>}
          {isPending && <Tag color="default">Chờ xử lý</Tag>}
        </div>
      ),
      description: (
        <div className="mt-2 space-y-2">
          {/* Nhân viên thực hiện */}
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {stage.employees.length > 0 ? (
                stage.employees.map((empId: string) => (
                  <Tag key={empId} className="text-xs">
                    <Space size={4}>
                      <Avatar size={14} className="text-xs">
                        {staffMap?.[empId]?.name?.charAt(0) || "?"}
                      </Avatar>
                      <span>{staffMap?.[empId]?.name || empId}</span>
                    </Space>
                  </Tag>
                ))
              ) : (
                <Tag color="red" className="text-xs">
                  Chưa phân công
                </Tag>
              )}
            </div>
          </div>

          {/* Thời gian cập nhật */}
          <div className="flex items-center gap-1">
            <Text type="secondary" className="text-xs">
              Cập nhật: {dayjs(stage.updatedAt).format("HH:mm DD/MM/YYYY")}
            </Text>
          </div>

          {/* Thông báo hoàn thành */}
          {isCompleted && (
            <div className="flex items-center gap-1">
              <span className="text-green-500 text-xs">✓</span>
              <Text type="success" className="text-xs">
                Hoàn thành vào{" "}
                {dayjs(stage.updatedAt).format("HH:mm DD/MM/YYYY")}
              </Text>
            </div>
          )}
        </div>
      ),
      status: statusInfo.status,
    };
  });

  const subtotal = product.quantity * (product.price || 0);

  return (
    <Card
      type="inner"
      className="shadow-sm hover:shadow-md transition-shadow duration-200"
      title={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar
              size={32}
              icon={<TagOutlined />}
              className="bg-blue-100 text-blue-600"
            />
            <div>
              <Text strong className="text-base">
                {product.name}
              </Text>
              <div className="text-sm text-gray-500">
                Số lượng: {product.quantity}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-primary">
              {subtotal.toLocaleString("vi-VN")} VNĐ
            </div>
            <div className="text-sm text-gray-500">
              {product.price?.toLocaleString("vi-VN")} VNĐ/cái
            </div>
          </div>
        </div>
      }
    >
      <Row gutter={16}>
        <Col span={10}>
          <div className="space-y-3 flex flex-col border-r pr-4">
            <Text strong>Sản phẩm khi nhận:</Text>
            <div className="flex flex-wrap gap-2">
              {product.images?.map((img: any, index: number) => (
                <Image
                  key={img.uid || index}
                  width={80}
                  height={80}
                  src={img.url}
                  alt={`Product image ${index + 1}`}
                  className="rounded-lg border object-cover"
                  fallback={getFallback()}
                />
              ))}
            </div>
            {product.imagesDone && product.imagesDone.length > 0 && (
              <>
                <Text strong>Sản phẩm sau khi hoàn thành:</Text>
                <div className="flex flex-wrap gap-2">
                  {product.imagesDone?.map((img: any, index: number) => (
                    <Image
                      key={img.uid || index}
                      width={80}
                      height={80}
                      src={img.url}
                      alt={`Product image ${index + 1}`}
                      className="rounded-lg border object-cover"
                      fallback={getFallback()}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Stage Summary */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <Text strong className="text-blue-700">
                  Tổng quan tiến độ
                </Text>
                <Tag color="blue" className="font-medium">
                  {
                    stages.filter((s) => s.status === StageStatus.Completed)
                      .length
                  }
                  /{stages.length} hoàn thành
                </Tag>
              </div>
              <Progress
                percent={
                  stages.length > 0
                    ? Number(
                        (
                          (stages.filter(
                            (s) => s.status === StageStatus.Completed
                          ).length /
                            stages.length) *
                          100
                        ).toFixed(2)
                      )
                    : 0
                }
                size="small"
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
                className="mb-1"
              />
              <Text type="secondary" className="text-xs">
                Cập nhật gần nhất:{" "}
                {stages.length > 0
                  ? dayjs(Math.max(...stages.map((s) => s.updatedAt))).format(
                      "HH:mm DD/MM/YYYY"
                    )
                  : "Chưa có"}
              </Text>
            </div>
          </div>
        </Col>
        <Col span={14}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <Text strong className="text-lg">
                Tiến độ công đoạn
              </Text>
              <div className="flex gap-2">
                <Tag color="orange">Đang thực hiện</Tag>
                <Tag color="green">Hoàn thành</Tag>
                <Tag color="default">Chờ xử lý</Tag>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4 shadow-sm">
              {stages.length > 0 ? (
                <div className="workflow-steps">
                  <Steps
                    direction="vertical"
                    size="small"
                    current={
                      currentStageIndex !== -1
                        ? currentStageIndex
                        : stages.length
                    }
                    items={stepsItems}
                  />
                </div>
              ) : (
                <Empty
                  description="Chưa có công đoạn nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className="my-4"
                />
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
};
