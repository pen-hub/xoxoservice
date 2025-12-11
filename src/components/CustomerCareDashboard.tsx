"use client";

import ButtonCall from "@/components/ButtonCall";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import { useUser } from "@/firebase/provider";
import useFilter from "@/hooks/useFilter";
import { AppointmentService } from "@/services/appointmentService";
import { RefundService } from "@/services/refundService";
import { WarrantyClaimService } from "@/services/warrantyClaimService";
import { FilterField } from "@/types";
import { type Appointment } from "@/types/appointment";
import { IMembers } from "@/types/members";
import { FirebaseOrderData, OrderStatus } from "@/types/order";
import { type RefundRequest } from "@/types/refund";
import { WarrantyClaimStatus, type WarrantyClaim } from "@/types/warrantyClaim";
import {
  ClockCircleOutlined,
  CopyOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Descriptions,
  Popconfirm,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { ref as dbRef, getDatabase, update } from "firebase/database";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import CommonTable, { PropRowDetails } from "./CommonTable";
import WrapperContent from "./WrapperContent";

const { Text } = Typography;

// ============================================================================
// Types & Interfaces
// ============================================================================

type CareType = "followup" | "appointment" | "order" | "refund" | "warranty";
type CareStatus =
  | "pending"
  | "overdue"
  | "upcoming"
  | "completed"
  | "cancelled"
  | "approved"
  | "processed";

interface CareItem {
  key: string;
  type: CareType;
  status: CareStatus;
  statusLabel: string;
  statusColor: string;
  customerName: string;
  customerPhone?: string;
  orderCode?: string;
  title?: string;
  notes?: string | string[];
  dueDate?: number;
  createdAt?: number;
  extra?: {
    caredBy?: string;
    caredByName?: string;
    caredAt?: number;
    careCount?: number;
    originalOrderCode?: string;
  };
}

// ============================================================================
// Constants
// ============================================================================

const CARE_TYPE_CONFIG: Record<CareType, { label: string; color: string }> = {
  followup: { label: "Đơn đang chờ", color: "blue" },
  appointment: { label: "Lịch hẹn", color: "green" },
  order: { label: "Đơn hàng đã xong", color: "purple" },
  refund: { label: "Hoàn tiền", color: "magenta" },
  warranty: { label: "Bảo hành", color: "orange" },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Renders a status tag with the given label and color
 */
const renderStatusTag = (status: CareStatus, label: string, color: string) => (
  <Tag color={color}>{label}</Tag>
);

/**
 * Renders notes/issues as Tags if array, or as text if string
 */
const renderNotes = (notes?: string | string[]) => {
  if (!notes) return "-";

  if (Array.isArray(notes)) {
    return (
      <div className="flex flex-col gap-1">
        {notes.map((issue, index) => (
          <Tag key={index} color="purple" className="m-0">
            {issue}
          </Tag>
        ))}
      </div>
    );
  }

  return <Text ellipsis>{notes}</Text>;
};

/**
 * Checks if an order should be included in care items
 */
const shouldIncludeOrder = (order: FirebaseOrderData): boolean => {
  const hasIssues = Boolean(order.issues && order.issues.length > 0);
  const isCompleted = Boolean(order.status === OrderStatus.COMPLETED);
  return isCompleted && hasIssues;
};

/**
 * Checks if a warranty claim should be included in care items
 */
const shouldIncludeWarrantyClaim = (claim: WarrantyClaim): boolean => {
  const hasIssues = Boolean(claim.issues && claim.issues.length > 0);
  const isCompleted = Boolean(claim.status === WarrantyClaimStatus.COMPLETED);
  return isCompleted && hasIssues;
};

const CareDetail: React.FC<PropRowDetails<CareItem>> = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <Descriptions bordered column={1} title="Chi tiết chăm sóc">
        <Descriptions.Item label="Loại">{data.type}</Descriptions.Item>
        <Descriptions.Item label="Khách hàng">
          {data.customerName}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          {data.customerPhone || "-"}
        </Descriptions.Item>
        {data.orderCode && (
          <Descriptions.Item label="Mã đơn hàng">
            {data.orderCode}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Trạng thái">
          {renderStatusTag(data.status, data.statusLabel, data.statusColor)}
        </Descriptions.Item>
        {data.dueDate && (
          <Descriptions.Item label="Ngày/giờ">
            {dayjs(data.dueDate).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
        )}
        {data.title && (
          <Descriptions.Item label="Tiêu đề">{data.title}</Descriptions.Item>
        )}
        <Descriptions.Item label="Lưu ý">
          {renderNotes(data.notes)}
        </Descriptions.Item>
        {(data.type === "order" || data.type === "followup") && (
          <>
            <Descriptions.Item label="Số lần chăm sóc">
              <Tag
                color={(data.extra?.careCount || 0) > 0 ? "green" : "default"}
              >
                {data.extra?.careCount || 0}
              </Tag>
            </Descriptions.Item>
            {data.extra?.caredBy && (
              <>
                <Descriptions.Item label="Đã chăm sóc bởi">
                  {data.extra.caredByName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày chăm sóc lần cuối">
                  {data.extra.caredAt
                    ? dayjs(data.extra.caredAt).format("DD/MM/YYYY HH:mm")
                    : "-"}
                </Descriptions.Item>
              </>
            )}
          </>
        )}
      </Descriptions>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>Đóng</Button>
        {data.customerPhone && (
          <Button
            type="primary"
            icon={<PhoneOutlined />}
            onClick={() => (window.location.href = `tel:${data.customerPhone}`)}
            className="bg-green-500 hover:bg-green-600"
          >
            Gọi ngay
          </Button>
        )}
      </div>
    </div>
  );
};

export default function CustomerCareDashboard() {
  const { message } = App.useApp();
  const router = useRouter();
  const { user } = useUser();
  const {
    query,
    pagination,
    updateQuery,
    reset,
    applyFilter,
    handlePageChange,
  } = useFilter({
    search: "",
    type: "all",
    status: "all",
  });

  const { data: ordersData, isLoading: ordersLoading } =
    useRealtimeList<FirebaseOrderData>("xoxo/orders");
  const { data: staffData, isLoading: staffLoading } =
    useRealtimeList<IMembers>("xoxo/members");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>([]);

  useEffect(() => {
    const unsubAppt = AppointmentService.onSnapshot((data) => {
      setAppointments(data);
    });
    const unsubRefund = RefundService.onSnapshot((data) => {
      setRefunds(data);
    });
    const unsubWarranty = WarrantyClaimService.onSnapshot((data) => {
      setWarrantyClaims(data);
    });
    return () => {
      unsubAppt?.();
      unsubRefund?.();
      unsubWarranty?.();
    };
  }, []);

  const staffMap = useMemo(() => {
    const map: Record<string, IMembers> = {};
    (staffData || []).forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [staffData]);

  // ============================================================================
  // Data Transformation Functions
  // ============================================================================

  /**
   * Transforms pending orders into care items
   */
  const transformPendingOrdersToCareItems = useCallback(
    (orders: FirebaseOrderData[]): CareItem[] => {
      return orders
        .filter((order) => order.status === OrderStatus.PENDING)
        .map((order) => ({
          key: `order-${order.code}`,
          type: "followup" as const,
          status: "pending" as CareStatus,
          statusLabel: "Chờ chăm sóc",
          statusColor: "blue",
          customerName: order.customerName,
          customerPhone: order.phone,
          orderCode: order.code,
          title: "Đơn hàng đang chờ",
          notes: order.issues || [],
          createdAt: order.createdAt,
          dueDate: order.orderDate,
          extra: {
            careCount: order.careCount || 0,
          },
        }));
    },
    []
  );

  /**
   * Transforms completed orders with issues into care items
   */
  const transformOrdersToCareItems = useCallback(
    (orders: FirebaseOrderData[]): CareItem[] => {
      return orders.filter(shouldIncludeOrder).map((order) => ({
        key: `order-${order.code}`,
        type: "order" as const,
        status: "completed" as CareStatus,
        statusLabel: "Hoàn thành",
        statusColor: "green",
        customerName: order.customerName,
        customerPhone: order.phone,
        orderCode: order.code,
        title: "Đơn hàng đã hoàn thành",
        notes: order.issues || [],
        dueDate: order.updatedAt,
        extra: {
          caredBy: order.caredBy,
          caredByName: order.caredByName,
          caredAt: order.caredAt,
          careCount: order.careCount || 0,
        },
      }));
    },
    []
  );

  /**
   * Transforms completed warranty claims with issues into care items
   */
  const transformWarrantyClaimsToCareItems = useCallback(
    (claims: WarrantyClaim[]): CareItem[] => {
      return claims.filter(shouldIncludeWarrantyClaim).map((claim) => ({
        key: `warranty-${claim.code}`,
        type: "warranty" as const,
        status: "completed" as CareStatus,
        statusLabel: "Hoàn thành",
        statusColor: "green",
        customerName: claim.customerName,
        customerPhone: claim.phone,
        orderCode: claim.code,
        title: "Phiếu bảo hành đã hoàn thành",
        notes: claim.issues || [],
        dueDate: claim.updatedAt,
        extra: {
          originalOrderCode: claim.originalOrderCode,
        },
      }));
    },
    []
  );

  // ============================================================================
  // Computed Values
  // ============================================================================

  /**
   * Aggregates all care items from different sources
   */
  const careItems = useMemo<CareItem[]>(() => {
    const pendingOrderItems = transformPendingOrdersToCareItems(
      ordersData || []
    );
    const orderItems = transformOrdersToCareItems(ordersData || []);
    const warrantyItems = transformWarrantyClaimsToCareItems(warrantyClaims);

    return [...pendingOrderItems, ...orderItems, ...warrantyItems];
  }, [
    ordersData,
    warrantyClaims,
    transformPendingOrdersToCareItems,
    transformOrdersToCareItems,
    transformWarrantyClaimsToCareItems,
  ]);

  /**
   * Applies filters to care items with custom logic for type, status, and notes
   */
  const filteredCare = useMemo(() => {
    let filtered = [...careItems];

    // Apply standard filters from useFilter hook
    filtered = applyFilter(filtered);

    // Apply custom type filter (exact match)
    if (query.type && query.type !== "all" && query.type !== "") {
      filtered = filtered.filter((item) => item.type === query.type);
    }

    // Apply custom status filter (exact match)
    if (query.status && query.status !== "all" && query.status !== "") {
      filtered = filtered.filter((item) => item.status === query.status);
    }

    // Apply custom date range filter for dueDate
    if (query.dueDate && typeof query.dueDate === "object") {
      const dateRange = query.dueDate as {
        from?: number | Date;
        to?: number | Date;
      };
      filtered = filtered.filter((item) => {
        if (!item.dueDate) return false;
        const itemDate = new Date(item.dueDate).getTime();
        const from = dateRange.from ? new Date(dateRange.from).getTime() : null;
        const to = dateRange.to ? new Date(dateRange.to).getTime() : null;

        if (from && to) {
          return itemDate >= from && itemDate <= to;
        }
        if (from) return itemDate >= from;
        if (to) return itemDate <= to;
        return true;
      });
    }

    // Apply custom search for notes (handle array)
    if (query.search) {
      const searchValue = String(query.search).toLowerCase().trim();
      if (searchValue) {
        filtered = filtered.filter((item) => {
          // Search in customer name, phone, order code
          const matchesCustomerName = item.customerName
            ?.toLowerCase()
            .includes(searchValue);
          const matchesPhone = item.customerPhone
            ?.toLowerCase()
            .includes(searchValue);
          const matchesOrderCode = item.orderCode
            ?.toLowerCase()
            .includes(searchValue);

          // Search in notes (handle both string and array)
          let matchesNotes = false;
          if (item.notes) {
            if (Array.isArray(item.notes)) {
              matchesNotes = item.notes.some((note) =>
                note.toLowerCase().includes(searchValue)
              );
            } else {
              matchesNotes = item.notes.toLowerCase().includes(searchValue);
            }
          }

          return (
            matchesCustomerName ||
            matchesPhone ||
            matchesOrderCode ||
            matchesNotes
          );
        });
      }
    }

    return filtered;
  }, [applyFilter, careItems, query]);

  const stats = useMemo(() => {
    const src = filteredCare;
    return {
      followupPending: src.filter(
        (i) => i.type === "followup" && i.status === "pending"
      ).length,
      appointmentUpcoming: src.filter(
        (i) => i.type === "appointment" && i.status === "upcoming"
      ).length,
      refundPending: src.filter(
        (i) => i.type === "refund" && i.status === "pending"
      ).length,
      orderCompleted: src.filter(
        (i) => i.type === "order" && i.status === "completed"
      ).length,
    };
  }, [filteredCare]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handles updating care count for an order (unified handler)
   */
  const handleUpdateCareCount = useCallback(
    async (orderCode: string) => {
      try {
        const order = ordersData?.find((o) => o.code === orderCode);
        if (!order) {
          message.error("Không tìm thấy đơn hàng");
          return;
        }

        const currentCareCount = order.careCount || 0;
        const newCareCount = currentCareCount + 1;
        const orderRef = dbRef(getDatabase(), `xoxo/orders/${orderCode}`);
        await update(orderRef, {
          careCount: newCareCount,
          caredBy: user?.uid || "",
          caredByName:
            user?.displayName || user?.email || "Người dùng hiện tại",
          caredAt: new Date().getTime(),
          updatedAt: new Date().getTime(),
        });
        message.success(
          `Đã cập nhật số lần chăm sóc: ${newCareCount} ${
            newCareCount === 1 ? "lần" : "lần"
          }`
        );
      } catch (err) {
        message.error("Không thể cập nhật số lần chăm sóc");
        console.error("Error updating care count:", err);
      }
    },
    [ordersData, user, message]
  );

  /**
   * Alias for handleUpdateCareCount (for backward compatibility)
   */
  const handleMarkOrderAsCared = handleUpdateCareCount;

  const columns: ColumnsType<CareItem> = useMemo(
    () => [
      {
        title: "Loại",
        dataIndex: "type",
        key: "type",
        width: 160,
        render: (type: CareType) => {
          const config = CARE_TYPE_CONFIG[type];
          return <Tag color={config.color}>{config.label}</Tag>;
        },
      },
      {
        title: "Khách hàng",
        dataIndex: "customerName",
        key: "customerName",
        width: 180,
      },
      {
        title: "SĐT",
        dataIndex: "customerPhone",
        key: "customerPhone",
        width: 150,
        render: (phone?: string) =>
          phone ? (
            <Space>
              <Text>{phone}</Text>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(phone);
                  message.success("Đã sao chép số điện thoại");
                }}
              />
            </Space>
          ) : (
            "-"
          ),
      },
      {
        title: "Mã đơn",
        dataIndex: "orderCode",
        key: "orderCode",
        width: 140,
        render: (code?: string) => code || "-",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (_: CareStatus, record) =>
          renderStatusTag(
            record.status,
            record.statusLabel,
            record.statusColor
          ),
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 170,
        render: (val?: number) => (val ? dayjs(val).format("DD/MM/YYYY") : "-"),
      },
      {
        title: "Lưu ý",
        dataIndex: "notes",
        key: "notes",
        width: 220,
        render: (notes?: string | string[]) => (
          <div className=" max-h-20 overflow-y-auto">{renderNotes(notes)}</div>
        ),
      },
      {
        title: "Số lần chăm sóc",
        dataIndex: "extra",
        key: "careCount",
        width: 140,
        render: (extra?: CareItem["extra"]) => {
          const count = extra?.careCount || 0;
          return (
            <Tag color={count > 0 ? "green" : "default"}>
              {count > 0 ? `${count} lần` : "Chưa có"}
            </Tag>
          );
        },
      },
      {
        title: "Thao tác",
        key: "action",
        width: 120,
        fixed: "right" as const,
        render: (_: unknown, record: CareItem) => (
          <Space size="small" vertical>
            {record.type === "followup" && record.status === "pending" && (
              <Popconfirm
                title="Xác nhận đã chăm sóc đơn hàng này?"
                onConfirm={() => handleUpdateCareCount(record.orderCode!)}
              >
                <Button size="small" type="primary">
                  Chăm sóc
                </Button>
              </Popconfirm>
            )}
            {record.customerPhone && (
              <ButtonCall phone={record.customerPhone} size="small" />
            )}
            {record.type === "order" && record.orderCode && (
              <>
                {!record.extra?.caredBy ? (
                  <Popconfirm
                    title="Xác nhận đã chăm sóc đơn hàng này?"
                    onConfirm={() => handleMarkOrderAsCared(record.orderCode!)}
                  >
                    <Button size="small" type="primary">
                      Đã chăm sóc
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button size="small" type="link" disabled>
                    Đã chăm sóc
                  </Button>
                )}
              </>
            )}
            {record.type === "warranty" && record.orderCode && (
              <Button
                size="small"
                type="link"
                onClick={() =>
                  router.push(`/sale/warranty/${record.orderCode}`)
                }
              >
                Xem phiếu
              </Button>
            )}
            {record.type === "order" && record.orderCode && (
              <Button
                size="small"
                type="link"
                onClick={() => router.push(`/sale/orders/${record.orderCode}`)}
              >
                Xem đơn
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [handleUpdateCareCount, router, message]
  );

  // ============================================================================
  // Filter Configuration
  // ============================================================================

  const filterFields: FilterField[] = [
    {
      type: "select",
      name: "type",
      label: "Loại",
      options: [
        { label: "Tất cả", value: "all" },
        { label: "Chăm sóc sau bán hàng", value: "followup" },
        { label: "Lịch hẹn", value: "appointment" },
        { label: "Đơn hàng", value: "order" },
        { label: "Bảo hành", value: "warranty" },
        { label: "Hoàn tiền", value: "refund" },
      ],
    },
    {
      type: "select",
      name: "status",
      label: "Trạng thái",
      options: [
        { label: "Tất cả", value: "all" },
        { label: "Chờ chăm sóc", value: "pending" },
        { label: "Quá hạn", value: "overdue" },
        { label: "Sắp tới", value: "upcoming" },
        { label: "Hoàn tất", value: "completed" },
        { label: "Đã duyệt", value: "approved" },
        { label: "Đã xử lý", value: "processed" },
      ],
    },
    {
      type: "dateRange",
      name: "dueDate",
      label: "Khoảng ngày",
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm theo tên/SĐT/Mã đơn/Lưu ý...",
          filterKeys: ["customerName", "customerPhone", "orderCode"],
        },
        filters: {
          fields: filterFields,
          query: query,
          onApplyFilter: (arr) => {
            arr.forEach((item) => updateQuery(item.key, item.value));
          },
          onReset: reset,
        },
        columnSettings: {
          columns: [
            { key: "type", title: "Loại", visible: true },
            { key: "customerName", title: "Khách hàng", visible: true },
            { key: "customerPhone", title: "SĐT", visible: true },
            { key: "orderCode", title: "Mã đơn", visible: true },
            { key: "status", title: "Trạng thái", visible: true },
            { key: "dueDate", title: "Ngày/giờ", visible: true },
            { key: "notes", title: "Lưu ý", visible: true },
            { key: "action", title: "Thao tác", visible: true },
          ],
          onChange: () => {},
          onReset: () => {},
        },
      }}
    >
      <Space vertical size="large" className="w-full">
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <Statistic
              title="Đơn chờ chăm sóc"
              value={stats.followupPending}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: "#faad14" } }}
            />
          </Card>
          <Card>
            <Statistic
              title="Đơn đã hoàn thành"
              value={stats.orderCompleted}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: "#52c41a" } }}
            />
          </Card>
          <Card>
            <Statistic
              title="Lịch hẹn sắp tới"
              value={stats.appointmentUpcoming}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Card>
          <Card>
            <Statistic
              title="Hoàn tiền chờ"
              value={stats.refundPending}
              prefix={<UserOutlined />}
              styles={{ content: { color: "#eb2f96" } }}
            />
          </Card>
        </div>

        <CommonTable
          columns={columns}
          dataSource={filteredCare.reverse()}
          loading={ordersLoading || staffLoading}
          DrawerDetails={CareDetail}
          pagination={{ ...pagination, onChange: handlePageChange }}
          paging={true}
          rowKey="key"
        />
      </Space>
    </WrapperContent>
  );
}
