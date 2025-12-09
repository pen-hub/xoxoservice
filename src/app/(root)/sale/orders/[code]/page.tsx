"use client";

import WrapperContent from "@/components/WrapperContent";
import { useRealtimeDoc, useRealtimeValue } from "@/firebase/hooks/useRealtime";
import { IMembers } from "@/types/members";
import {
  FirebaseOrderData,
  FirebaseWorkflowData,
  OrderStatus,
} from "@/types/order";
import { getFallback } from "@/utils/getFallBack";
import {
  CalendarOutlined,
  CreditCardOutlined,
  DownloadOutlined,
  EditOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Image,
  Modal,
  Progress,
  QRCode,
  Row,
  Select,
  Space,
  Spin,
  Steps,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import { RcFile } from "antd/es/upload";
import dayjs from "dayjs";
import { ref as dbRef, getDatabase, update } from "firebase/database";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

const { Text, Title } = Typography;

const getStatusInfo = (status: OrderStatus) => {
  const info = {
    [OrderStatus.PENDING]: { color: "default", text: "Chờ xử lý" },
    [OrderStatus.CONFIRMED]: { color: "warning", text: "Đã xác nhận" },
    [OrderStatus.IN_PROGRESS]: { color: "processing", text: "Đang thực hiện" },
    [OrderStatus.ON_HOLD]: { color: "orange", text: "Tạm giữ" },
    [OrderStatus.COMPLETED]: { color: "success", text: "Hoàn thành" },
    [OrderStatus.CANCELLED]: { color: "error", text: "Đã hủy" },
  };
  return info[status] || info[OrderStatus.PENDING];
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderCode = params.code as string;
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | undefined>(
    undefined
  );
  const [productImages, setProductImages] = useState<{ [key: string]: any[] }>(
    {}
  );
  const [uploading, setUploading] = useState(false);
  const { message: antdMessage } = App.useApp();

  const { data: order, isLoading: orderLoading } =
    useRealtimeDoc<FirebaseOrderData>(`xoxo/orders/${orderCode}`);
  const { data: membersData, isLoading: membersLoading } =
    useRealtimeValue<IMembers>("xoxo/members");

  const membersMap = useMemo(() => {
    if (!membersData || !Array.isArray(membersData))
      return {} as Record<string, IMembers>;
    const map: Record<string, IMembers> = {};
    membersData.forEach((emp) => {
      map[emp.id] = emp;
    });
    return map;
  }, [membersData]);

  const products = useMemo(() => {
    if (!order?.products) return [];
    return Object.entries(order.products).map(([id, data]) => ({
      id,
      ...data,
    }));
  }, [order?.products]);

  const totalWorkflows = useMemo(() => {
    return products.reduce(
      (acc, p) => acc + (p.workflows ? Object.keys(p.workflows).length : 0),
      0
    );
  }, [products]);

  const completedWorkflows = useMemo(() => {
    return products.reduce((acc, p) => {
      if (!p.workflows) return acc;
      return (
        acc +
        Object.values(p.workflows).filter(
          (s: FirebaseWorkflowData) => s.isDone === true
        ).length
      );
    }, 0);
  }, [products]);

  const progress =
    totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0;

  const orderSummary = useMemo(() => {
    if (!order) return { subtotal: 0, discountAmount: 0, total: 0 };

    const subtotal = products.reduce(
      (sum, product) => sum + product.quantity * (product.price || 0),
      0
    );
    const discount = order.discount || 0;
    const discountAmount =
      order.discountType === "percentage"
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

  if (orderLoading || membersLoading) {
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

  const createdByMember = membersMap?.[order.createdBy];

  // Handle status update
  async function handleStatusUpdate() {
    if (!order || !selectedStatus) return;

    try {
      const statusRef = dbRef(getDatabase(), `xoxo/orders/${orderCode}`);
      await update(statusRef, {
        status: selectedStatus,
        updatedAt: new Date().getTime(),
      });

      antdMessage.success("Cập nhật trạng thái thành công!");
      setStatusModalVisible(false);
      setSelectedStatus(undefined);
    } catch (error) {
      console.error("Failed to update status:", error);
      antdMessage.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
    }
  }

  // Handle image upload for products
  const handleImageUpload = async (productId: string, fileList: RcFile[]) => {
    if (!order) return;

    setUploading(true);
    try {
      const storage = getStorage();
      const uploadedImages = [];

      for (const file of fileList) {
        const fileName = `orders/${orderCode}/${productId}/completion_${Date.now()}_${
          file.name
        }`;
        const storageRef = ref(storage, fileName);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        uploadedImages.push({
          uid: file.uid,
          name: file.name,
          url: downloadURL,
          firebaseUrl: downloadURL,
        });
      }

      // Update product images in Firebase
      const orderRef = dbRef(
        getDatabase(),
        `xoxo/orders/${orderCode}/products/${productId}`
      );
      const currentProduct = order.products[productId];
      const updatedImages = [
        ...(currentProduct.imagesDone || []),
        ...uploadedImages,
      ];

      await update(orderRef, {
        imagesDone: updatedImages,
      });

      antdMessage.success("Tải ảnh lên thành công!");
    } catch (error) {
      console.error("Failed to upload images:", error);
      antdMessage.error("Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  // Get available status options based on current status (prevent reverting to previous statuses)
  const getAvailableStatusOptions = (currentStatus: OrderStatus) => {
    const statusOrder = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.IN_PROGRESS,
      OrderStatus.ON_HOLD,
      OrderStatus.COMPLETED,
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);

    return [
      {
        value: OrderStatus.PENDING,
        label: "Chờ xử lý",
        disabled: currentIndex >= 0,
      },
      {
        value: OrderStatus.CONFIRMED,
        label: "Đã xác nhận",
        disabled: currentIndex >= 1,
      },
      {
        value: OrderStatus.IN_PROGRESS,
        label: "Đang thực hiện",
        disabled: currentIndex >= 2,
      },
      {
        value: OrderStatus.ON_HOLD,
        label: "Tạm giữ",
        disabled: currentIndex >= 3,
      },
      {
        value: OrderStatus.COMPLETED,
        label: "Hoàn thành",
        disabled: currentIndex >= 4,
      },
      { value: OrderStatus.CANCELLED, label: "Đã hủy", disabled: false }, // Cancelled is always available
    ];
  };

  return (
    <WrapperContent
      title={`Chi tiết đơn hàng của khách ${order.customerName}`}
      header={{
        buttonBackTo: "/sale/orders",
        buttonEnds: [
          ...(order.phone
            ? [
                {
                  name: "Gọi điện",
                  icon: <PhoneOutlined />,
                  type: "default" as const,
                  onClick: () => (window.location.href = `tel:${order.phone}`),
                },
              ]
            : []),
          {
            name: "Cập nhật trạng thái",
            icon: <SaveOutlined />,
            type: "primary" as const,
            onClick: () => setStatusModalVisible(true),
          },
          {
            name: "Chỉnh sửa",
            icon: <EditOutlined />,
            type: "default" as const,
            onClick: () => router.push(`/sale/orders/${orderCode}/update`),
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
              color={getStatusInfo(order.status || OrderStatus.PENDING).color}
              className="text-lg px-4 py-2"
            >
              {getStatusInfo(order.status || OrderStatus.PENDING).text}
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
              {completedWorkflows}/{totalWorkflows} công đoạn đã hoàn thành
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
                      membersMap={membersMap}
                      orderStatus={order.status}
                      onImageUpload={handleImageUpload}
                      uploading={uploading}
                      orderCode={orderCode}
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
                        {createdByMember?.name?.charAt(0) ||
                          order.createdByName?.charAt(0) ||
                          "?"}
                      </Avatar>
                      {createdByMember?.name ||
                        order.createdByName ||
                        "Không rõ"}
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
                      {order.discountType === "percentage" &&
                        (order.discount || 0) > 0 &&
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

        {/* Status Update Modal */}
        <Modal
          title="Cập nhật trạng thái đơn hàng"
          open={statusModalVisible}
          onCancel={() => setStatusModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setStatusModalVisible(false)}>
              Hủy
            </Button>,
            <Button
              key="save"
              type="primary"
              onClick={handleStatusUpdate}
              disabled={!selectedStatus}
            >
              Cập nhật
            </Button>,
          ]}
        >
          <div className="space-y-4">
            <div>
              <Text strong>Trạng thái hiện tại:</Text>
              <div className="mt-2">
                <Tag
                  color={
                    getStatusInfo(order.status || OrderStatus.PENDING).color
                  }
                >
                  {getStatusInfo(order.status || OrderStatus.PENDING).text}
                </Tag>
              </div>
            </div>
            <div>
              <Text strong>Chọn trạng thái mới:</Text>
              <Select
                className="w-full mt-2"
                defaultValue={order.status}
                onChange={(value) => setSelectedStatus(value)}
                options={getAvailableStatusOptions(
                  order.status || OrderStatus.PENDING
                )}
              />
            </div>
            {selectedStatus && selectedStatus !== order.status && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Text className="text-blue-700 text-sm">
                  Trạng thái sẽ được cập nhật từ{" "}
                  <Tag color={getStatusInfo(order.status!).color}>
                    {getStatusInfo(order.status!).text}
                  </Tag>{" "}
                  sang{" "}
                  <Tag color={getStatusInfo(selectedStatus!).color}>
                    {getStatusInfo(selectedStatus!).text}
                  </Tag>
                </Text>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </WrapperContent>
  );
}

// Product Detail Component
const ProductDetailCard = ({
  product,
  membersMap,
  orderStatus,
  onImageUpload,
  uploading,
  orderCode,
}: {
  product: any;
  membersMap: Record<string, IMembers>;
  orderStatus?: OrderStatus;
  onImageUpload?: (productId: string, fileList: RcFile[]) => Promise<void>;
  uploading?: boolean;
  orderCode?: string;
}) => {
  const qrRef = useRef<any>(null);

  // Handle QR code download
  const downloadQRCode = () => {
    if (qrRef.current) {
      // Find the QR code canvas within the QRCode component
      const canvas = qrRef.current.querySelector("canvas");
      if (canvas) {
        // Create download link
        const link = document.createElement("a");
        link.download = `${orderCode}-${product.id}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    }
  };
  const workflows = useMemo(() => {
    if (!product.workflows) return [];
    return Object.entries(product.workflows).map(([id, workflow]) => {
      const workflowData = workflow as FirebaseWorkflowData;
      return {
        id,
        workflowCode: workflowData.workflowCode,
        workflowName: workflowData.workflowName,
        members: workflowData.members,
        isDone: workflowData.isDone,
        updatedAt: workflowData.updatedAt,
      };
    });
  }, [product.workflows]);

  const currentWorkflowIndex = workflows.findIndex((s) => !s.isDone);

  const stepsItems = workflows.map((workflow, index) => {
    const isCompleted = workflow.isDone;
    console.log(membersMap, "sdfsd");

    return {
      title: (
        <div className="flex items-center gap-2">
          <Text
            strong
            className={isCompleted ? "text-green-600" : "text-gray-600"}
          >
            {workflow.workflowName.join(", ") || `Công đoạn ${index + 1}`}
          </Text>
          {isCompleted ? (
            <Tag color="success">Hoàn thành</Tag>
          ) : (
            <Tag color="default">Chưa làm</Tag>
          )}
        </div>
      ),
      description: (
        <div className="mt-2 space-y-2">
          {/* Nhân viên thực hiện */}
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {workflow.members && workflow.members.length > 0 ? (
                workflow.members.map((empId: string) => (
                  <Tag key={empId} className="text-xs">
                    <Space size={4}>
                      <Avatar size={14} className="text-xs">
                        {membersMap?.[empId]?.name?.charAt(0) || "?"}
                      </Avatar>
                      <span>{membersMap?.[empId]?.name || empId}</span>
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
              Cập nhật: {dayjs(workflow.updatedAt).format("HH:mm DD/MM/YYYY")}
            </Text>
          </div>

          {/* Thông báo hoàn thành */}
          {isCompleted && (
            <div className="flex items-center gap-1">
              <span className="text-green-500 text-xs">✓</span>
              <Text type="success" className="text-xs">
                Hoàn thành vào{" "}
                {dayjs(workflow.updatedAt).format("HH:mm DD/MM/YYYY")}
              </Text>
            </div>
          )}
        </div>
      ),
      status: (isCompleted ? "finish" : "wait") as "finish" | "wait",
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

            {/* Workflow Summary */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <Text strong className="text-blue-700">
                  Tổng quan tiến độ
                </Text>
                <Tag color="blue" className="font-medium">
                  {workflows.filter((s) => s.isDone).length}/{workflows.length}{" "}
                  hoàn thành
                </Tag>
              </div>
              <Progress
                percent={
                  workflows.length > 0
                    ? Number(
                        (
                          (workflows.filter((s) => s.isDone).length /
                            workflows.length) *
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
                {workflows.length > 0
                  ? dayjs(
                      Math.max(...workflows.map((s) => s.updatedAt))
                    ).format("HH:mm DD/MM/YYYY")
                  : "Chưa có"}
              </Text>
            </div>

            {/* QR Code Section */}
            {orderCode && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex flex-col items-center gap-3">
                  <Text strong className="text-yellow-700 text-center">
                    Mã QR sản phẩm
                  </Text>
                  <div className="flex flex-col items-center gap-2">
                    <div ref={qrRef}>
                      <QRCode
                        value={`${orderCode}-${product.id}`}
                        size={120}
                        bordered={false}
                      />
                    </div>
                    <Text type="secondary" className="text-xs text-center">
                      {orderCode}-{product.id}
                    </Text>
                    <Button
                      size="small"
                      type="dashed"
                      icon={<DownloadOutlined />}
                      onClick={downloadQRCode}
                      className="text-yellow-600 border-yellow-300 hover:border-yellow-500"
                    >
                      Tải QR
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Image Upload for ON_HOLD Orders */}
            {orderStatus === OrderStatus.ON_HOLD && onImageUpload && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Text strong className="text-orange-700 block mb-3">
                  📸 Tải ảnh sản phẩm đã hoàn thành
                </Text>
                <Text className="text-orange-600 text-sm block mb-3">
                  Vui lòng tải lên ảnh sản phẩm sau khi hoàn thành để cập nhật
                  cho khách hàng.
                </Text>
                <Upload
                  multiple
                  accept="image/*"
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const isImage = file.type.startsWith("image/");
                    if (!isImage) {
                      message.error("Chỉ được tải lên file ảnh!");
                      return false;
                    }
                    const maxSize = 5 * 1024 * 1024; // 5MB
                    if (file.size > maxSize) {
                      message.error("Ảnh không được vượt quá 5MB!");
                      return false;
                    }
                    return true;
                  }}
                  customRequest={async ({ file, onSuccess, onError }) => {
                    try {
                      await onImageUpload(product.id, [file as RcFile]);
                      onSuccess?.("ok");
                    } catch (error) {
                      onError?.(error as any);
                    }
                  }}
                  disabled={uploading}
                >
                  <div className="text-center p-2">
                    <UploadOutlined className="text-lg mb-1" />
                    <div className="text-xs">
                      {uploading ? "Đang tải..." : "Tải ảnh"}
                    </div>
                  </div>
                </Upload>
              </div>
            )}
          </div>
        </Col>
        <Col span={14}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <Text strong className="text-lg">
                Tiến độ công đoạn
              </Text>
            </div>

            <div className="bg-white rounded-lg border p-4 shadow-sm">
              {workflows.length > 0 ? (
                <div className="workflow-steps">
                  <Steps
                    orientation="vertical"
                    size="small"
                    current={
                      currentWorkflowIndex !== -1
                        ? currentWorkflowIndex
                        : workflows.length
                    }
                    items={stepsItems as any}
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
