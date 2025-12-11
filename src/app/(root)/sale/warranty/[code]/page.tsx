"use client";

import WrapperContent from "@/components/WrapperContent";
import { env } from "@/env";
import { useRealtimeDoc, useRealtimeValue } from "@/firebase/hooks/useRealtime";
import useGenerateWarrantyPdf from "@/hooks/useGenerateWarrantyPdf";
import { IMembers } from "@/types/members";
import { FirebaseWorkflowData } from "@/types/order";
import { WarrantyClaimStatus, type WarrantyClaim } from "@/types/warrantyClaim";
import { getFallback } from "@/utils/getFallBack";
import {
  CalendarOutlined,
  DownloadOutlined,
  EditOutlined,
  PhoneOutlined,
  SaveOutlined,
  TagOutlined,
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
} from "antd";
import dayjs from "dayjs";
import { ref as dbRef, getDatabase, update } from "firebase/database";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

const { Text, Title } = Typography;

const getStatusInfo = (status: WarrantyClaimStatus) => {
  const info = {
    [WarrantyClaimStatus.PENDING]: { color: "default", text: "Chờ xử lý" },
    [WarrantyClaimStatus.CONFIRMED]: { color: "warning", text: "Đã xác nhận" },
    [WarrantyClaimStatus.IN_PROGRESS]: {
      color: "processing",
      text: "Đang thực hiện",
    },
    [WarrantyClaimStatus.ON_HOLD]: { color: "orange", text: "Tạm giữ" },
    [WarrantyClaimStatus.COMPLETED]: { color: "success", text: "Hoàn thành" },
    [WarrantyClaimStatus.CANCELLED]: { color: "error", text: "Đã hủy" },
  };
  return info[status] || info[WarrantyClaimStatus.PENDING];
};

export default function WarrantyClaimDetailPage() {
  const router = useRouter();
  const params = useParams();
  const claimCode = params.code as string;
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    WarrantyClaimStatus | undefined
  >(undefined);
  const { message: antdMessage } = App.useApp();

  const { data: claim, isLoading: claimLoading } =
    useRealtimeDoc<WarrantyClaim>(`xoxo/warranty_claims/${claimCode}`);
  const { data: membersData, isLoading: membersLoading } = useRealtimeValue<{
    [key: string]: IMembers;
  }>("xoxo/members");

  // Lấy thông tin nhân viên tư vấn
  const consultantInfo = useMemo(() => {
    if (!claim?.consultantId || !membersData) return undefined;
    const consultant = membersData[claim.consultantId];
    if (!consultant) return undefined;
    return {
      code: consultant.code,
      phone: consultant.phone,
    };
  }, [claim?.consultantId, membersData]);

  // Lấy thông tin warranty (nếu có)
  const warrantyInfo = useMemo(() => {
    if (!claim?.originalOrderCode) {
      // Default values nếu không có originalOrderCode
      return {
        period: 12,
        startDate: claim?.createdAt,
        endDate: claim?.createdAt
          ? dayjs(claim.createdAt).add(12, "months").valueOf()
          : undefined,
      };
    }
    // Sẽ load từ WarrantyService nếu cần, nhưng tạm thời dùng default
    // Vì WarrantyService.getByOrderCode là async, ta dùng default values
    return {
      period: 12,
      startDate: claim.createdAt,
      endDate: claim.createdAt
        ? dayjs(claim.createdAt).add(12, "months").valueOf()
        : undefined,
    };
  }, [claim]);

  // Hook để generate PDF
  const { isLoading: isGeneratingPdf, generatePDF } = useGenerateWarrantyPdf({
    warrantyClaim: claim || ({} as WarrantyClaim),
    consultantInfo,
    warrantyPeriod: warrantyInfo.period,
    warrantyStartDate: warrantyInfo.startDate,
    warrantyEndDate: warrantyInfo.endDate,
  });

  const membersMap = useMemo(() => {
    if (!membersData || !Object.keys(membersData).length)
      return {} as { [key: string]: IMembers };
    return membersData;
  }, [membersData]);

  const products = useMemo(() => {
    if (!claim?.products) return [];
    return Object.entries(claim.products).map(([id, data]) => ({
      id,
      ...data,
    }));
  }, [claim?.products]);

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

  const createdByMember = useMemo(() => {
    if (!claim) return undefined;
    return membersMap?.[claim.createdBy];
  }, [membersMap, claim?.createdBy]);

  // Check if all products have images
  const hasAllProductImages = useMemo(() => {
    if (!products || products.length === 0) return false;
    return products.every(
      (product) =>
        product.images &&
        Array.isArray(product.images) &&
        product.images.length > 0
    );
  }, [products]);

  const productsWithoutImages = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.filter(
      (product) =>
        !product.images ||
        !Array.isArray(product.images) ||
        product.images.length === 0
    );
  }, [products]);

  // Check if all workflows are completed
  const allWorkflowsCompleted = useMemo(() => {
    if (totalWorkflows === 0) return false; // Không có workflow nào thì không thể hoàn thành
    return completedWorkflows === totalWorkflows && totalWorkflows > 0;
  }, [completedWorkflows, totalWorkflows]);

  // Handle status update
  async function handleStatusUpdate() {
    if (!claim || !selectedStatus) return;

    // Kiểm tra ảnh sản phẩm khi xác nhận đơn
    if (
      selectedStatus === WarrantyClaimStatus.CONFIRMED &&
      !hasAllProductImages
    ) {
      antdMessage.warning(
        "Vui lòng thêm ảnh sản phẩm cho tất cả sản phẩm trước khi xác nhận đơn!"
      );
      return;
    }

    // Kiểm tra tất cả công đoạn đã hoàn thành khi chuyển sang ON_HOLD
    if (
      selectedStatus === WarrantyClaimStatus.ON_HOLD &&
      !allWorkflowsCompleted
    ) {
      antdMessage.warning(
        "Vui lòng hoàn thành tất cả công đoạn trước khi chuyển sang trạng thái Tạm giữ!"
      );
      return;
    }

    try {
      const statusRef = dbRef(
        getDatabase(),
        `xoxo/warranty_claims/${claimCode}`
      );
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

  // Get available status options - chỉ cho phép chuyển sang trạng thái tiếp theo
  const getAvailableStatusOptions = (currentStatus: WarrantyClaimStatus) => {
    const statusOrder = [
      WarrantyClaimStatus.PENDING,
      WarrantyClaimStatus.CONFIRMED,
      WarrantyClaimStatus.IN_PROGRESS,
      WarrantyClaimStatus.ON_HOLD,
      WarrantyClaimStatus.COMPLETED,
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = currentIndex + 1;

    return [
      {
        value: WarrantyClaimStatus.PENDING,
        label: "Chờ xử lý",
        disabled: currentIndex !== -1 && currentIndex !== 0, // Chỉ enable nếu đang ở PENDING hoặc chưa có trong statusOrder
      },
      {
        value: WarrantyClaimStatus.CONFIRMED,
        label: "Đã xác nhận",
        disabled: currentIndex !== 0, // Chỉ enable nếu đang ở PENDING
      },
      {
        value: WarrantyClaimStatus.IN_PROGRESS,
        label: "Đang thực hiện",
        disabled: currentIndex !== 1, // Chỉ enable nếu đang ở CONFIRMED
      },
      {
        value: WarrantyClaimStatus.ON_HOLD,
        label: "Tạm giữ",
        disabled: currentIndex !== 2 || !allWorkflowsCompleted, // Chỉ enable nếu đang ở IN_PROGRESS và tất cả workflows đã hoàn thành
      },
      {
        value: WarrantyClaimStatus.COMPLETED,
        label: "Hoàn thành",
        disabled:
          (currentIndex !== 3 && currentIndex !== 2) ||
          (currentIndex === 2 && !allWorkflowsCompleted), // Chỉ enable nếu đang ở ON_HOLD hoặc IN_PROGRESS (và tất cả workflows đã hoàn thành)
      },
      {
        value: WarrantyClaimStatus.CANCELLED,
        label: "Đã hủy",
        disabled:
          currentStatus === WarrantyClaimStatus.COMPLETED ||
          currentStatus === WarrantyClaimStatus.CANCELLED ||
          currentStatus === WarrantyClaimStatus.IN_PROGRESS, // Không thể hủy nếu đã hoàn thành, đã hủy, hoặc đang thực hiện
      },
    ];
  };

  return (
    <WrapperContent
      isEmpty={!claim}
      isLoading={claimLoading}
      isRefetching={membersLoading}
      title={`Phiếu nhập bảo hành của khách ${claim?.customerName}`}
      header={{
        buttonBackTo: "/sale/warranty",
        buttonEnds: [
          {
            can: true,
            name: "Xuất PDF",
            icon: <DownloadOutlined />,
            type: "default" as const,
            onClick: () => {
              if (claim) {
                generatePDF();
              } else {
                antdMessage.warning("Đang tải dữ liệu phiếu bảo hành...");
              }
            },
            isLoading: isGeneratingPdf,
          },
          ...(claim?.phone
            ? [
                {
                  can: true,
                  name: "Gọi điện",
                  icon: <PhoneOutlined />,
                  type: "default" as const,
                  onClick: () => (window.location.href = `tel:${claim?.phone}`),
                },
              ]
            : []),
          ...(claim?.status !== WarrantyClaimStatus.COMPLETED
            ? [
                {
                  name: "Cập nhật trạng thái",
                  icon: <SaveOutlined />,
                  can: true,
                  type: "primary" as const,
                  onClick: () => setStatusModalVisible(true),
                },
                {
                  name: "Chỉnh sửa",
                  icon: <EditOutlined />,
                  type: "default" as const,
                  can: true,
                  onClick: () =>
                    router.push(`/sale/warranty/${claimCode}/update`),
                },
              ]
            : []),
        ],
      }}
    >
      <div className="space-y-6 flex flex-col gap-4">
        {/* Claim Status & Progress */}
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <Title level={3} className="mb-2!">
                Mã phiếu: {claim?.code}
              </Title>
            </div>
            <Space vertical size="small">
              <Space size="middle">
                <Tag
                  color={
                    getStatusInfo(claim?.status || WarrantyClaimStatus.PENDING)
                      .color
                  }
                  className="text-lg px-4 py-2"
                >
                  {
                    getStatusInfo(claim?.status || WarrantyClaimStatus.PENDING)
                      .text
                  }
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
                    <Space>{claim?.customerName}</Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    <Space>
                      <Text copyable>{claim?.phone}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    <Space>
                      <Text copyable>{claim?.email}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ" span={3}>
                    <Space>{claim?.address}</Space>
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
                      claimStatus={claim?.status}
                      claimCode={claimCode}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </Col>

          <Col xs={24} sm={24} lg={8}>
            <div className="space-y-6 flex flex-col gap-4">
              {/* Claim Information */}
              <Card
                title={
                  <Space>
                    <CalendarOutlined />
                    <Text strong>Thông tin phiếu nhập bảo hành</Text>
                  </Space>
                }
                className="mb-6"
              >
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Mã phiếu">
                    {claim?.code}
                  </Descriptions.Item>
                  <Descriptions.Item label="Đơn hàng gốc">
                    <Button
                      type="link"
                      onClick={() =>
                        router.push(`/sale/orders/${claim?.originalOrderCode}`)
                      }
                    >
                      {claim?.originalOrderCode}
                    </Button>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo">
                    {dayjs(claim?.orderDate).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày giao dự kiến">
                    {dayjs(claim?.deliveryDate).format("DD/MM/YYYY")}
                  </Descriptions.Item>

                  {claim?.updatedAt && (
                    <Descriptions.Item label="Cập nhật lần cuối">
                      {dayjs(claim?.updatedAt).format("DD/MM/YYYY HH:mm")}
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Nhân viên tạo">
                    <Space>
                      <Avatar size="small">
                        {createdByMember?.name?.charAt(0) ||
                          claim?.createdByName?.charAt(0) ||
                          "?"}
                      </Avatar>
                      {createdByMember?.name ||
                        claim?.createdByName ||
                        "Không rõ"}
                    </Space>
                  </Descriptions.Item>
                  {claim?.consultantName && (
                    <Descriptions.Item label="Nhân viên tư vấn">
                      <Space>
                        <Avatar size="small">
                          {claim.consultantName.charAt(0)}
                        </Avatar>
                        {claim.consultantName}
                      </Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>
                {claim?.notes && (
                  <div className="mt-4">
                    <Text strong>Ghi chú:</Text>
                    <div className="mt-2 p-3 bg-gray-50 rounded border">
                      <Text>{claim?.notes}</Text>
                    </div>
                  </div>
                )}
                {claim?.issues &&
                  Array.isArray(claim.issues) &&
                  claim.issues.length > 0 && (
                    <div className="mt-4">
                      <Text strong>Vấn đề khách hàng gặp phải:</Text>
                      <div className="mt-2 space-y-2">
                        {claim.issues.map((issue: string, index: number) => (
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
              </Card>
            </div>
          </Col>
        </Row>

        {/* Status Update Modal */}
        <Modal
          title="Cập nhật trạng thái phiếu nhập bảo hành"
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
                    getStatusInfo(claim?.status || WarrantyClaimStatus.PENDING)
                      .color
                  }
                >
                  {
                    getStatusInfo(claim?.status || WarrantyClaimStatus.PENDING)
                      .text
                  }
                </Tag>
              </div>
            </div>
            <div>
              <Text strong>Chọn trạng thái mới:</Text>
              <Select
                className="w-full mt-2"
                defaultValue={claim?.status}
                onChange={(value) => setSelectedStatus(value)}
                options={getAvailableStatusOptions(
                  claim?.status || WarrantyClaimStatus.PENDING
                )}
              />
            </div>
            {selectedStatus === WarrantyClaimStatus.CONFIRMED &&
              !hasAllProductImages && (
                <Alert
                  message="Cảnh báo"
                  description={
                    <div>
                      <Text>
                        Bạn cần thêm ảnh sản phẩm cho tất cả sản phẩm trước khi
                        xác nhận đơn. Các sản phẩm chưa có ảnh:
                      </Text>
                      <ul className="mt-2 ml-4">
                        {productsWithoutImages.map((product) => (
                          <li key={product.id}>
                            <Text strong>{product.name}</Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  }
                  type="warning"
                  showIcon
                  className="mt-4"
                />
              )}
            {selectedStatus === WarrantyClaimStatus.ON_HOLD &&
              !allWorkflowsCompleted && (
                <Alert
                  message="Cảnh báo"
                  description={
                    <div>
                      <Text>
                        Bạn cần hoàn thành tất cả công đoạn trước khi chuyển
                        sang trạng thái "Tạm giữ". Tiến độ hiện tại:{" "}
                        {completedWorkflows}/{totalWorkflows} công đoạn đã hoàn
                        thành.
                      </Text>
                    </div>
                  }
                  type="warning"
                  showIcon
                  className="mt-4"
                />
              )}
            {selectedStatus && selectedStatus !== claim?.status && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Text className="text-blue-700 text-sm">
                  Trạng thái sẽ được cập nhật từ{" "}
                  <Tag color={getStatusInfo(claim?.status!).color}>
                    {getStatusInfo(claim?.status!).text}
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
  claimStatus,
  claimCode,
}: {
  product: any;
  membersMap: Record<string, IMembers>;
  claimStatus?: WarrantyClaimStatus;
  claimCode?: string;
}) => {
  const qrRef = useRef<any>(null);

  // Handle QR code download
  const downloadQRCode = () => {
    if (qrRef.current && claimCode) {
      // Find the QR code canvas within the QRCode component
      const canvas = qrRef.current.querySelector("canvas");
      if (canvas) {
        // Create download link
        const link = document.createElement("a");
        link.download = `${claimCode}-${product.id}.png`;
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
        departmentCode: workflowData.departmentCode,
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
            <Text strong>Ảnh sản phẩm khi nhận bảo hành:</Text>
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
              {(!product.images || product.images.length === 0) && (
                <Text type="secondary" className="text-sm">
                  Chưa có ảnh
                </Text>
              )}
            </div>

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

            {/* QR Code Section - Chỉ hiển thị khi ở trạng thái IN_PROGRESS */}
            {claimCode && claimStatus === WarrantyClaimStatus.IN_PROGRESS && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex flex-col items-center gap-3">
                  <Text strong className="text-yellow-700 text-center">
                    Mã QR bảo hành sản phẩm {product.name}
                  </Text>
                  <div className="flex flex-col items-center gap-2">
                    <div ref={qrRef}>
                      <QRCode
                        value={`${env.NEXT_PUBLIC_APP_URL}/technician/todo/warranty/${claimCode}/${product.id}`}
                        size={120}
                        bordered={false}
                      />
                    </div>
                    <Text type="secondary" className="text-xs text-center">
                      {claimCode}
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
            {/* Thông báo khi không ở trạng thái IN_PROGRESS */}
            {claimCode && claimStatus !== WarrantyClaimStatus.IN_PROGRESS && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-col items-center gap-2">
                  <Text type="secondary" className="text-center text-sm">
                    Mã QR chỉ hiển thị khi phiếu bảo hành ở trạng thái "Đang
                    thực hiện"
                  </Text>
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
};
