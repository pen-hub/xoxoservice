"use client";

import DeliveryManager from "@/components/DeliveryManager";
import FeedbackForm from "@/components/FeedbackForm";
import RefundManager from "@/components/RefundManager";
import WrapperContent from "@/components/WrapperContent";
import { env } from "@/env";
import { useRealtimeDoc, useRealtimeValue } from "@/firebase/hooks/useRealtime";
import { useUser } from "@/firebase/provider";
import useGenerateOrderPdf from "@/hooks/useGenerateOrderPdf";
import { AppointmentService } from "@/services/appointmentService";
import { FeedbackService } from "@/services/feedbackService";
import { FinanceService } from "@/services/financeService";
import { MessageService } from "@/services/messageService";
import { RefundService } from "@/services/refundService";
import { WarrantyService } from "@/services/warrantyService";
import {
  AppointmentStatus,
  AppointmentStatusLabels,
  type Appointment,
} from "@/types/appointment";
import {
  FeedbackType,
  FeedbackTypeLabels,
  type CustomerFeedback,
} from "@/types/feedback";
import { IMembers } from "@/types/members";
import {
  DeliveryMethod,
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
  PhoneOutlined,
  SaveOutlined,
  TagOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
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
import { useEffect, useMemo, useRef, useState } from "react";
import superjson from "superjson";

const { Text, Title } = Typography;

const getStatusInfo = (status: OrderStatus) => {
  const info = {
    [OrderStatus.PENDING]: { color: "default", text: "Chờ xử lý" },
    [OrderStatus.CONFIRMED]: { color: "warning", text: "Đã xác nhận" },
    [OrderStatus.IN_PROGRESS]: { color: "processing", text: "Đang thực hiện" },
    [OrderStatus.ON_HOLD]: { color: "orange", text: "Tạm giữ" },
    [OrderStatus.COMPLETED]: { color: "success", text: "Hoàn thành" },
    [OrderStatus.REFUND]: { color: "magenta", text: "Hoàn tiền" },
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
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const { user } = useUser();
  const { message: antdMessage } = App.useApp();

  const { data: order, isLoading: orderLoading } =
    useRealtimeDoc<FirebaseOrderData>(`xoxo/orders/${orderCode}`);
  const { data: membersData, isLoading: membersLoading } = useRealtimeValue<{
    [key: string]: IMembers;
  }>("xoxo/members");

  // Lấy thông tin nhân viên tư vấn
  const consultantInfo = useMemo(() => {
    if (!order?.consultantId || !membersData) return undefined;
    const consultant = membersData[order.consultantId];
    if (!consultant) return undefined;
    return {
      code: consultant.code,
      phone: consultant.phone,
    };
  }, [order?.consultantId, membersData]);

  // Hook để generate PDF
  const { isLoading: isGeneratingPdf, generatePDF } = useGenerateOrderPdf({
    order: order || ({} as FirebaseOrderData),
    consultantInfo,
  });

  // Load feedbacks for this order
  useEffect(() => {
    if (orderCode) {
      const unsubscribe = FeedbackService.onSnapshot((allFeedbacks) => {
        const orderFeedbacks = allFeedbacks.filter(
          (f) => f.orderCode === orderCode
        );
        setFeedbacks(orderFeedbacks);
      });
      return () => unsubscribe();
    }
  }, [orderCode]);

  // Load refunds for this order
  useEffect(() => {
    if (orderCode) {
      const unsubscribe = RefundService.onSnapshot((allRefunds) => {
        const orderRefunds = allRefunds.filter(
          (r) => r.orderCode === orderCode
        );
        setRefunds(orderRefunds);
      });
      return () => unsubscribe();
    }
  }, [orderCode]);

  // Load appointments for this order
  useEffect(() => {
    if (orderCode) {
      const unsubscribe = AppointmentService.onSnapshot((allAppointments) => {
        const orderAppointments = allAppointments.filter(
          (a) => a.orderCode === orderCode
        );
        setAppointments(orderAppointments);
      });
      return () => unsubscribe();
    }
  }, [orderCode]);

  const membersMap = useMemo(() => {
    if (!membersData || !Object.keys(membersData).length)
      return {} as { [key: string]: IMembers };
    return membersData;
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

  // Check if order can be confirmed (must have deposit paid and product images)
  const canConfirmOrder = useMemo(() => {
    if (!order) return { canConfirm: false, reasons: [] };
    const reasons: string[] = [];

    // Check deposit payment - only if order has deposit
    if ((order.deposit || 0) > 0 && !order.isDepositPaid) {
      reasons.push("Chưa thanh toán tiền cọc");
    }

    // Check if all products have images
    if (!order.products || Object.keys(order.products).length === 0) {
      reasons.push("Chưa có sản phẩm nào");
    } else {
      const productsWithoutImages = Object.entries(order.products).filter(
        ([_, product]) => !product.images || product.images.length === 0
      );
      if (productsWithoutImages.length > 0) {
        reasons.push(
          `Có ${
            productsWithoutImages.length
          } sản phẩm chưa có ảnh: ${productsWithoutImages
            .map(([_, p]) => p.name)
            .join(", ")}`
        );
      }
    }

    return {
      canConfirm: reasons.length === 0,
      reasons,
    };
  }, [order]);

  // Check if order can be moved to ON_HOLD (must have all workflows completed)
  const canMoveToOnHold = useMemo(() => {
    if (!order) return { canMove: false, reasons: [] };
    const reasons: string[] = [];

    // Check if all workflows in all products are completed
    if (!order.products || Object.keys(order.products).length === 0) {
      reasons.push("Chưa có sản phẩm nào");
    } else {
      const incompleteWorkflows: Array<{
        productName: string;
        workflowName: string;
      }> = [];

      for (const [productId, product] of Object.entries(order.products)) {
        if (!product.workflows || Object.keys(product.workflows).length === 0) {
          continue; // No workflows in this product
        }

        // Check if all workflows in this product are done
        for (const [workflowId, workflow] of Object.entries(
          product.workflows
        )) {
          const workflowData = workflow as FirebaseWorkflowData;
          if (!workflowData.isDone) {
            incompleteWorkflows.push({
              productName: product.name,
              workflowName:
                workflowData.workflowName?.join(", ") ||
                `Công đoạn ${workflowId}`,
            });
          }
        }
      }

      if (incompleteWorkflows.length > 0) {
        reasons.push(
          `Có ${
            incompleteWorkflows.length
          } công đoạn chưa hoàn thành: ${incompleteWorkflows
            .map((w) => `${w.workflowName} (${w.productName})`)
            .join(", ")}`
        );
      }
    }

    return {
      canMove: reasons.length === 0,
      reasons,
    };
  }, [order]);

  const createdByMember = useMemo(() => {
    if (!order) return undefined;
    return membersMap?.[order.createdBy];
  }, [superjson.stringify(membersMap), order?.createdBy]);

  // Handle status update
  async function handleStatusUpdate() {
    if (!order || !selectedStatus) return;

    // Validate before confirming order
    if (selectedStatus === OrderStatus.CONFIRMED) {
      if (!canConfirmOrder.canConfirm) {
        antdMessage.warning(
          `Không thể xác nhận đơn hàng. ${canConfirmOrder.reasons.join(". ")}`
        );
        return;
      }
    }

    // Validate before moving to ON_HOLD
    if (selectedStatus === OrderStatus.ON_HOLD) {
      if (!canMoveToOnHold.canMove) {
        antdMessage.warning(
          `Không thể chuyển sang trạng thái Thanh toán. ${canMoveToOnHold.reasons.join(
            ". "
          )}`
        );
        return;
      }
    }

    try {
      const statusRef = dbRef(getDatabase(), `xoxo/orders/${orderCode}`);
      await update(statusRef, {
        status: selectedStatus,
        updatedAt: new Date().getTime(),
      });

      // Auto-create follow-up schedules and warranty when order is completed
      if (
        selectedStatus === OrderStatus.COMPLETED &&
        order.status !== OrderStatus.COMPLETED
      ) {
        try {
          // Create warranty for each product
          if (order.products) {
            for (const [productId, product] of Object.entries(order.products)) {
              try {
                await WarrantyService.createWarranty(
                  orderCode,
                  orderCode,
                  productId,
                  product.name,
                  order.customerCode,
                  order.customerName,
                  order.phone,
                  12, // Default 12 months
                  "Bảo hành theo tiêu chuẩn XOXO",
                  user?.uid,
                  user?.displayName || user?.email || "Người dùng hiện tại"
                );
              } catch (warrantyError) {
                console.error("Failed to create warranty:", warrantyError);
                // Continue with other products
              }
            }
          }
        } catch (followUpError) {
          console.error("Failed to create follow-up schedules:", followUpError);
          // Don't block status update if follow-up creation fails
        }
      }

      // Send order confirmed message if status changed to CONFIRMED
      if (
        selectedStatus === OrderStatus.CONFIRMED &&
        order.status !== OrderStatus.CONFIRMED
      ) {
        try {
          await MessageService.sendOrderConfirmed(
            order.phone,
            order.customerName,
            orderCode
          );
        } catch (msgError) {
          console.error("Failed to send order confirmation message:", msgError);
          // Don't block status update
        }

        // Tạo phiếu thu tiền cọc khi đơn hàng chuyển sang CONFIRMED
        try {
          const updatedOrder = {
            ...order,
            status: selectedStatus,
            updatedAt: new Date().getTime(),
          };
          await FinanceService.createDepositTransaction(
            updatedOrder,
            orderCode,
            user?.uid,
            user?.displayName || user?.email || "Người dùng hiện tại"
          );
        } catch (financeError) {
          console.error("Failed to create deposit transaction:", financeError);
          // Don't block status update
        }
      }

      // Tạo phiếu thu số tiền còn lại khi đơn hàng chuyển sang COMPLETED
      if (
        selectedStatus === OrderStatus.COMPLETED &&
        order.status !== OrderStatus.COMPLETED
      ) {
        try {
          const updatedOrder = {
            ...order,
            status: selectedStatus,
            updatedAt: new Date().getTime(),
          };
          await FinanceService.createRemainingAmountTransaction(
            updatedOrder,
            orderCode,
            user?.uid,
            user?.displayName || user?.email || "Người dùng hiện tại"
          );
        } catch (financeError) {
          console.error(
            "Failed to create remaining amount transaction:",
            financeError
          );
          // Don't block status update
        }
      }

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

  // Get available status options - chỉ cho phép chuyển sang trạng thái tiếp theo (không nhảy cóc)
  const getAvailableStatusOptions = (currentStatus: OrderStatus) => {
    const statusOrder = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.IN_PROGRESS,
      OrderStatus.ON_HOLD,
      OrderStatus.COMPLETED,
      OrderStatus.REFUND,
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);

    return [
      {
        value: OrderStatus.PENDING,
        label: "Chờ xử lý",
        disabled: currentIndex !== -1 && currentIndex !== 0, // Chỉ enable nếu đang ở PENDING hoặc chưa có trong statusOrder
      },
      {
        value: OrderStatus.CONFIRMED,
        label: "Đã xác nhận",
        disabled: currentIndex !== 0 || !canConfirmOrder.canConfirm, // Chỉ enable nếu đang ở PENDING và đủ điều kiện
      },
      {
        value: OrderStatus.IN_PROGRESS,
        label: "Đang thực hiện",
        disabled: currentIndex !== 1, // Chỉ enable nếu đang ở CONFIRMED
      },
      {
        value: OrderStatus.ON_HOLD,
        label: "Tạm giữ",
        disabled: currentIndex !== 2 || !canMoveToOnHold.canMove, // Chỉ enable nếu đang ở IN_PROGRESS và đủ điều kiện
      },
      {
        value: OrderStatus.COMPLETED,
        label: "Hoàn thành",
        disabled:
          (currentIndex !== 3 && currentIndex !== 2) ||
          !canMoveToOnHold.canMove, // Chỉ enable nếu đang ở ON_HOLD hoặc IN_PROGRESS và đủ điều kiện chuyển sang ON_HOLD
      },
      {
        value: OrderStatus.REFUND,
        label: "Hoàn tiền",
        disabled: currentStatus === OrderStatus.REFUND || currentIndex < 1, // Chỉ enable nếu đã CONFIRMED trở lên và chưa REFUND
      },
      {
        value: OrderStatus.CANCELLED,
        label: "Đã hủy",
        disabled:
          currentStatus === OrderStatus.COMPLETED ||
          currentStatus === OrderStatus.REFUND ||
          currentStatus === OrderStatus.CANCELLED ||
          currentStatus === OrderStatus.IN_PROGRESS, // Không thể hủy nếu đã hoàn thành, hoàn tiền, đang thực hiện hoặc đã hủy
      },
    ];
  };

  return (
    <WrapperContent
      isEmpty={!order}
      isLoading={orderLoading}
      isRefetching={membersLoading}
      title={`Đơn hàng của khách ${order?.customerName}`}
      header={{
        buttonBackTo: "/sale/orders",
        buttonEnds: [
          {

            name: "Xuất PDF",
            icon: <DownloadOutlined />,
            type: "default" as const,
            can: true,
            onClick: () => {
              if (order) {
                generatePDF();
              } else {
                antdMessage.warning("Đang tải dữ liệu đơn hàng...");
              }
            },
            isLoading: isGeneratingPdf,
          },
          ...(order?.phone
            ? [
                {
                  name: "Gọi điện",
                  icon: <PhoneOutlined />,
                  type: "default" as const,
                  can: true,
                  onClick: () => (window.location.href = `tel:${order?.phone}`),
                },
              ]
            : []),
          ...(order?.status !== OrderStatus.COMPLETED &&
          order?.status !== OrderStatus.CANCELLED &&
          order?.status !== OrderStatus.REFUND
            ? [
                {
                  name: "Cập nhật trạng thái",
                  icon: <SaveOutlined />,
                  type: "primary" as const,
                  can: order?.status !== OrderStatus.PENDING,
                  onClick: () => setStatusModalVisible(true),
                },
                {
                  name: "Chỉnh sửa",
                  icon: <EditOutlined />,
                  type: "default" as const,
                  can: true,
                  onClick: () =>
                    router.push(`/sale/orders/${orderCode}/update`),
                },
              ]
            : []),
        ],
      }}
    >
      <div className="space-y-6 flex flex-col gap-4">
        {/* Order Status & Progress */}
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <Title level={3} className="mb-2!">
                Mã: {order?.code}
              </Title>
            </div>
            <Space vertical size="small">
              <Space size="middle">
                <Tag
                  color={
                    getStatusInfo(order?.status || OrderStatus.PENDING).color
                  }
                  className="text-lg px-4 py-2"
                >
                  {getStatusInfo(order?.status || OrderStatus.PENDING).text}
                </Tag>
                <Tag
                  color={order?.isDepositPaid ? "green" : "red"}
                  className="text-sm px-3 py-1"
                >
                  {order?.isDepositPaid ? "Đã đặt cọc" : "Chưa đặt cọc"}
                </Tag>
              </Space>
            </Space>
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

        <Row gutter={[24, 24]}>
          <Col xs={24} sm={24} lg={16}>
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
                <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="middle">
                  <Descriptions.Item label="Tên khách hàng">
                    <Space>{order?.customerName}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    <Space>
                      <Text copyable>{order?.phone}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    <Space>
                      <Text copyable>{order?.email}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ" span={3}>
                    <Space>{order?.address}</Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Products List */}
              <Card
                title={
                  <Space>
                    <TagOutlined />
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
                      orderStatus={order?.status}
                      onImageUpload={handleImageUpload}
                      uploading={uploading}
                      orderCode={orderCode}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </Col>

          <Col xs={24} sm={24} lg={8}>
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
                    {dayjs(order?.orderDate).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày giao dự kiến">
                    {dayjs(order?.deliveryDate).format("DD/MM/YYYY")}
                  </Descriptions.Item>

                  {order?.updatedAt && (
                    <Descriptions.Item label="Cập nhật lần cuối">
                      {dayjs(order?.updatedAt).format("DD/MM/YYYY HH:mm")}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Nhân viên tạo">
                    <Space>
                      <Avatar size="small">
                        {createdByMember?.name?.charAt(0) ||
                          order?.createdByName?.charAt(0) ||
                          "?"}
                      </Avatar>
                      {createdByMember?.name ||
                        order?.createdByName ||
                        "Không rõ"}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
                {order?.notes && (
                  <div className="mt-4">
                    <Text strong>Ghi chú:</Text>
                    <div className="mt-2 p-3 bg-gray-50 rounded border">
                      <Text>{order?.notes}</Text>
                    </div>
                  </div>
                )}
                {order?.issues &&
                  Array.isArray(order.issues) &&
                  order.issues.length > 0 && (
                    <div className="mt-4">
                      <Text strong>Vấn đề khách hàng gặp phải:</Text>
                      <div className="mt-2 space-y-2">
                        {order.issues.map((issue: string, index: number) => (
                          <div
                            key={index}
                            className="p-2 bg-red-50 rounded border border-red-200"
                          >
                            <Text className="text-red-700">
                              {index + 1}. {issue}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                {/* Feedback Section */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <Text strong>Feedback khách hàng:</Text>
                    {order?.status === OrderStatus.COMPLETED && (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => setFeedbackModalVisible(true)}
                      >
                        Thêm Feedback
                      </Button>
                    )}
                  </div>
                  {feedbacks.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {feedbacks.map((feedback) => {
                        const getFeedbackColor = (type: FeedbackType) => {
                          switch (type) {
                            case FeedbackType.PRAISE:
                              return "green";
                            case FeedbackType.NEUTRAL:
                              return "blue";
                            case FeedbackType.COMPLAINT:
                              return "orange";
                            case FeedbackType.ANGRY:
                              return "red";
                            default:
                              return "default";
                          }
                        };
                        return (
                          <div
                            key={feedback.id}
                            className="p-3 bg-gray-50 rounded border"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Tag
                                color={getFeedbackColor(feedback.feedbackType)}
                              >
                                {FeedbackTypeLabels[feedback.feedbackType]}
                              </Tag>
                              {feedback.rating && (
                                <Text type="secondary" className="text-sm">
                                  {feedback.rating}/5 ⭐
                                </Text>
                              )}
                            </div>
                            {feedback.notes && (
                              <Text className="text-sm">{feedback.notes}</Text>
                            )}
                            <div className="mt-2 text-xs text-gray-500">
                              {dayjs(feedback.collectedAt).format(
                                "DD/MM/YYYY HH:mm"
                              )}
                              {feedback.collectedByName &&
                                ` - ${feedback.collectedByName}`}
                            </div>
                            {feedback.requiresReService && (
                              <Tag color="red" className="mt-2">
                                Yêu cầu xử lý lại
                              </Tag>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Text type="secondary" className="text-sm">
                      Chưa có feedback
                    </Text>
                  )}
                </div>
                {/* Delivery Info Section */}
                {order?.deliveryInfo && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <Text strong>Thông tin giao hàng:</Text>
                      <Button
                        size="small"
                        onClick={() => setDeliveryModalVisible(true)}
                      >
                        Cập nhật
                      </Button>
                    </div>
                    <div className="mt-2 p-3 bg-gray-50 rounded border">
                      <div className="space-y-2">
                        <div>
                          <Text strong>Phương thức: </Text>
                          <Tag>
                            {order.deliveryInfo.method === DeliveryMethod.SHIP
                              ? "Gửi ship"
                              : order.deliveryInfo.method ===
                                DeliveryMethod.PICKUP
                              ? "Khách qua lấy"
                              : "Lưu kho"}
                          </Tag>
                        </div>
                        {order.deliveryInfo.shippingAddress && (
                          <div>
                            <Text strong>Địa chỉ: </Text>
                            <Text>{order.deliveryInfo.shippingAddress}</Text>
                          </div>
                        )}
                        {order.deliveryInfo.trackingNumber && (
                          <div>
                            <Text strong>Mã vận đơn: </Text>
                            <Text>{order.deliveryInfo.trackingNumber}</Text>
                          </div>
                        )}
                        {order.deliveryInfo.storageLocation && (
                          <div>
                            <Text strong>Vị trí lưu kho: </Text>
                            <Text>{order.deliveryInfo.storageLocation}</Text>
                          </div>
                        )}
                        <div>
                          <Text strong>Trạng thái: </Text>
                          <Tag
                            color={
                              order.deliveryInfo.status === "delivered" ||
                              order.deliveryInfo.status === "picked_up"
                                ? "green"
                                : order.deliveryInfo.status === "in_transit"
                                ? "blue"
                                : "default"
                            }
                          >
                            {order.deliveryInfo.status === "pending"
                              ? "Chờ xử lý"
                              : order.deliveryInfo.status === "in_transit"
                              ? "Đang vận chuyển"
                              : order.deliveryInfo.status === "delivered"
                              ? "Đã giao"
                              : order.deliveryInfo.status === "picked_up"
                              ? "Đã lấy"
                              : "Đã lưu kho"}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {!order?.deliveryInfo &&
                  order?.status === OrderStatus.COMPLETED && (
                    <div className="mt-4">
                      <Button
                        type="dashed"
                        onClick={() => setDeliveryModalVisible(true)}
                        className="w-full"
                      >
                        Thiết lập thông tin giao hàng
                      </Button>
                    </div>
                  )}
                {/* Appointments Section */}
                {appointments.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <Text strong>Lịch hẹn liên quan:</Text>
                      <Button
                        size="small"
                        onClick={() => router.push("/customers/appointments")}
                      >
                        Xem tất cả
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {appointments.map((appointment) => {
                        const getStatusColor = (status: AppointmentStatus) => {
                          switch (status) {
                            case AppointmentStatus.SCHEDULED:
                              return "blue";
                            case AppointmentStatus.CONFIRMED:
                              return "green";
                            case AppointmentStatus.COMPLETED:
                              return "success";
                            case AppointmentStatus.CANCELLED:
                              return "default";
                            case AppointmentStatus.NO_SHOW:
                              return "red";
                            default:
                              return "default";
                          }
                        };
                        return (
                          <div
                            key={appointment.id}
                            className="p-3 bg-blue-50 rounded border border-blue-200"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Tag color={getStatusColor(appointment.status)}>
                                {AppointmentStatusLabels[appointment.status]}
                              </Tag>
                              <Text type="secondary" className="text-sm">
                                {dayjs(appointment.scheduledDate).format(
                                  "DD/MM/YYYY HH:mm"
                                )}
                              </Text>
                            </div>
                            <div>
                              <Text strong>Mục đích: </Text>
                              <Text>{appointment.purpose}</Text>
                            </div>
                            {appointment.staffName && (
                              <div className="mt-1">
                                <Text strong>Nhân viên: </Text>
                                <Text>{appointment.staffName}</Text>
                              </div>
                            )}
                            {appointment.notes && (
                              <div className="mt-1">
                                <Text strong>Ghi chú: </Text>
                                <Text className="text-sm">
                                  {appointment.notes}
                                </Text>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Refund Section */}
                {refunds.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <Text strong>Yêu cầu hoàn tiền:</Text>
                      <Button
                        size="small"
                        onClick={() => setRefundModalVisible(true)}
                      >
                        Tạo yêu cầu mới
                      </Button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {refunds.map((refund) => (
                        <div
                          key={refund.id}
                          className="p-3 bg-orange-50 rounded border border-orange-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Tag
                              color={
                                refund.status === "approved"
                                  ? "green"
                                  : refund.status === "rejected"
                                  ? "red"
                                  : refund.status === "processed"
                                  ? "blue"
                                  : "orange"
                              }
                            >
                              {refund.status === "pending"
                                ? "Chờ duyệt"
                                : refund.status === "approved"
                                ? "Đã duyệt"
                                : refund.status === "rejected"
                                ? "Từ chối"
                                : refund.status === "processed"
                                ? "Đã xử lý"
                                : "Đã hủy"}
                            </Tag>
                            <Text strong className="text-red-600">
                              {refund.amount.toLocaleString("vi-VN")} VNĐ
                            </Text>
                          </div>
                          <div>
                            <Text strong>Loại: </Text>
                            <Text>
                              {refund.type === "full"
                                ? "Hoàn tiền toàn bộ"
                                : refund.type === "partial"
                                ? "Hoàn tiền một phần"
                                : "Bồi thường"}
                            </Text>
                          </div>
                          <div className="mt-1">
                            <Text strong>Lý do: </Text>
                            <Text>{refund.reason}</Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {refunds.length === 0 &&
                  order?.status === OrderStatus.COMPLETED && (
                    <div className="mt-4">
                      <Button
                        type="dashed"
                        onClick={() => setRefundModalVisible(true)}
                        className="w-full"
                      >
                        Tạo yêu cầu hoàn tiền/Bồi thường
                      </Button>
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
                      {order?.discountType === "percentage" &&
                        (order.discount || 0) > 0 &&
                        ` (${order.discount}%)`}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Phí vận chuyển:</Text>
                    <Text>
                      +{(order?.shippingFee || 0).toLocaleString("vi-VN")} VNĐ
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
                  {order && (order.deposit || 0) > 0 && (
                    <>
                      <div className="flex justify-between">
                        <Text>
                          Tiền cọc (
                          {(order.deposit || 0).toLocaleString("vi-VN")}
                          {order.depositType === "percentage" ? "%" : " VNĐ"}) :
                        </Text>
                        <Text className="text-red-500">
                          -{(order.depositAmount || 0).toLocaleString("vi-VN")}{" "}
                          VNĐ
                        </Text>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-300">
                        <Text strong className="text-lg">
                          {order?.status === OrderStatus.COMPLETED
                            ? "Trạng thái thanh toán:"
                            : "Còn lại:"}
                        </Text>
                        {order?.status === OrderStatus.COMPLETED ? (
                          <Tag color="success" className="text-lg px-3 py-1">
                            Đã thanh toán
                          </Tag>
                        ) : (
                          <Text strong className="text-lg text-red-500">
                            {(
                              orderSummary.total - (order.depositAmount || 0)
                            ).toLocaleString("vi-VN")}{" "}
                            VNĐ
                          </Text>
                        )}
                      </div>
                    </>
                  )}
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
                    getStatusInfo(order?.status || OrderStatus.PENDING).color
                  }
                >
                  {getStatusInfo(order?.status || OrderStatus.PENDING).text}
                </Tag>
              </div>
            </div>
            <div>
              <Text strong>Chọn trạng thái mới:</Text>
              <Select
                className="w-full mt-2"
                defaultValue={order?.status}
                onChange={(value) => setSelectedStatus(value)}
                options={getAvailableStatusOptions(
                  order?.status || OrderStatus.PENDING
                )}
              />
            </div>
            {selectedStatus && selectedStatus !== order?.status && (
              <>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Text className="text-blue-700 text-sm">
                    Trạng thái sẽ được cập nhật từ{" "}
                    <Tag color={getStatusInfo(order?.status!).color}>
                      {getStatusInfo(order?.status!).text}
                    </Tag>{" "}
                    sang{" "}
                    <Tag color={getStatusInfo(selectedStatus!).color}>
                      {getStatusInfo(selectedStatus!).text}
                    </Tag>
                  </Text>
                </div>
                {selectedStatus === OrderStatus.CONFIRMED &&
                  !canConfirmOrder.canConfirm && (
                    <Alert
                      message="Không thể xác nhận đơn hàng"
                      description={
                        <div>
                          <Text strong>
                            Vui lòng hoàn thành các điều kiện sau:
                          </Text>
                          <ul className="mt-2 mb-0 pl-4">
                            {canConfirmOrder.reasons.map((reason, index) => (
                              <li key={index}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      }
                      type="warning"
                      showIcon
                      className="mt-4"
                    />
                  )}
                {selectedStatus === OrderStatus.ON_HOLD &&
                  !canMoveToOnHold.canMove && (
                    <Alert
                      message="Không thể chuyển sang trạng thái Thanh toán"
                      description={
                        <div>
                          <Text strong>
                            Vui lòng hoàn thành các điều kiện sau:
                          </Text>
                          <ul className="mt-2 mb-0 pl-4">
                            {canMoveToOnHold.reasons.map((reason, index) => (
                              <li key={index}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      }
                      type="warning"
                      showIcon
                      className="mt-4"
                    />
                  )}
              </>
            )}
          </div>
        </Modal>

        {/* Feedback Modal */}
        {order && (
          <Modal
            title="Thêm Feedback"
            open={feedbackModalVisible}
            onCancel={() => setFeedbackModalVisible(false)}
            footer={null}
            width={600}
          >
            <FeedbackForm
              orderId={orderCode}
              orderCode={orderCode}
              customerName={order.customerName}
              customerPhone={order.phone}
              customerId={order.customerCode}
              onSuccess={() => {
                setFeedbackModalVisible(false);
              }}
              onCancel={() => setFeedbackModalVisible(false)}
            />
          </Modal>
        )}

        {/* Delivery Modal */}
        {order && (
          <Modal
            title="Quản lý giao hàng"
            open={deliveryModalVisible}
            onCancel={() => setDeliveryModalVisible(false)}
            footer={null}
            width={600}
          >
            <DeliveryManager
              orderCode={orderCode}
              order={order}
              onSuccess={() => {
                setDeliveryModalVisible(false);
              }}
            />
          </Modal>
        )}

        {/* Refund Modal */}
        {order && (
          <Modal
            title="Quản lý hoàn tiền/Bồi thường"
            open={refundModalVisible}
            onCancel={() => setRefundModalVisible(false)}
            footer={null}
            width={600}
          >
            <RefundManager
              orderCode={orderCode}
              orderTotalAmount={order.totalAmount || 0}
              onSuccess={() => {
                setRefundModalVisible(false);
              }}
            />
          </Modal>
        )}
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
      content: (
        <div className="mt-2 space-y-2">
          {/* Nhân viên thực hiện */}
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {workflow.members && workflow.members.length > 0 ? (
                workflow.members.map((empId: string) => {
                  return (
                    <Tag key={empId} className="text-xs">
                      <Space size={4}>
                        <Avatar size={14} className="text-xs">
                          {membersMap?.[empId]?.name?.charAt(0) || "?"}
                        </Avatar>
                        <span>{membersMap?.[empId]?.name || empId}</span>
                      </Space>
                    </Tag>
                  );
                })
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
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
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
        <Col xs={24} lg={10}>
          <div className="space-y-3 flex flex-col lg:border-l lg:pl-4">
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
                    Mã QR sản phẩm {product.name}
                  </Text>
                  <div className="flex flex-col items-center gap-2">
                    <div ref={qrRef}>
                      <QRCode
                        value={`${env.NEXT_PUBLIC_APP_URL}/technician/todo/${orderCode}/${product.id}`}
                        size={120}
                        bordered={false}
                      />
                    </div>
                    <Text type="secondary" className="text-xs text-center">
                      {orderCode}
                      <br />
                      {product.id}
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
      </Row>
    </Card>
  );
};
