"use client";

import CommonTable from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import useFilter from "@/hooks/useFilter";
import { FilterField } from "@/types";
import { FirebaseOrderData, OrderStatus } from "@/types/order";
import { WarrantyClaimStatus, type WarrantyClaim } from "@/types/warrantyClaim";
import { Button, Tag, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const { Text } = Typography;

type OrderWithId = FirebaseOrderData & { id: string };

type TodoRow = {
  key: string;
  orderCode: string;
  productCode: string;
  productName: string;
  customerName: string;
  quantity: number;
  status: string;
  progressText: string;
  deliveryDate: number;
  type?: "order" | "warranty_claim";
  originalOrderCode?: string;
};

export default function TechnicianTodoPage() {
  const router = useRouter();
  const { data: ordersData, isLoading: ordersLoading } =
    useRealtimeList<OrderWithId>("xoxo/orders");
  const { data: warrantyClaimsData, isLoading: warrantyClaimsLoading } =
    useRealtimeList<WarrantyClaim>("xoxo/warranty_claims");
  const {
    query,
    updateQuery,
    applyFilter,
    reset,
    pagination,
    handlePageChange,
  } = useFilter();

  const rows: TodoRow[] = useMemo(() => {
    const list: TodoRow[] = [];

    // Process orders
    if (ordersData && ordersData.length > 0) {
      ordersData.forEach((order) => {
        if (!order.products) return;
        Object.entries(order.products).forEach(([productCode, product]) => {
          const workflows = product.workflows || {};
          const total = Object.keys(workflows).length;
          const completed = Object.values(workflows).filter(
            (wf) => wf.isDone
          ).length;
          const progressText = total ? `${completed}/${total}` : "0/0";

          list.push({
            key: `order_${order.code}_${productCode}`,
            orderCode: order.code,
            productCode,
            productName: product.name || "",
            customerName: order.customerName || "",
            quantity: product.quantity,
            status: order.status || "pending",
            progressText,
            deliveryDate: order.deliveryDate || 0,
            type: "order",
          });
        });
      });
    }

    // Process warranty claims
    if (warrantyClaimsData && warrantyClaimsData.length > 0) {
      warrantyClaimsData.forEach((claimItem) => {
        // Handle both WithId format and direct WarrantyClaim format
        const claim: WarrantyClaim =
          (claimItem as any).data || (claimItem as WarrantyClaim);
        if (!claim.products) return;
        Object.entries(claim.products).forEach(
          ([productCode, product]: [string, any]) => {
            const workflows = product.workflows || {};
            const total = Object.keys(workflows).length;
            const completed = Object.values(workflows).filter(
              (wf: any) => wf.isDone
            ).length;
            const progressText = total ? `${completed}/${total}` : "0/0";

            // Map warranty claim status to order status for display
            const statusMap: Record<WarrantyClaimStatus, string> = {
              [WarrantyClaimStatus.PENDING]: "pending",
              [WarrantyClaimStatus.CONFIRMED]: "confirmed",
              [WarrantyClaimStatus.IN_PROGRESS]: "in_progress",
              [WarrantyClaimStatus.ON_HOLD]: "on_hold",
              [WarrantyClaimStatus.COMPLETED]: "completed",
              [WarrantyClaimStatus.CANCELLED]: "cancelled",
            };

            const claimStatus = claim.status as WarrantyClaimStatus;

            list.push({
              key: `warranty_${claim.code}_${productCode}`,
              orderCode: claim.code,
              productCode,
              productName: product.name || "",
              customerName: claim.customerName || "",
              quantity: product.quantity,
              status: statusMap[claimStatus] || "pending",
              progressText,
              deliveryDate: claim.deliveryDate || 0,
              type: "warranty_claim",
              originalOrderCode: claim.originalOrderCode,
            });
          }
        );
      });
    }

    return list;
  }, [ordersData, warrantyClaimsData]);

  console.log(rows, query);

  // Filter data
  const filteredData = useMemo(() => {
    return applyFilter(rows);
  }, [rows, query]);

  const columns: ColumnsType<TodoRow> = [
    {
      title: "Mã đơn",
      dataIndex: "orderCode",
      key: "orderCode",
      width: 170,
      render: (value, record) => (
        <div className="flex items-center gap-1">
          <Text strong>{value}</Text>
          {record.type === "warranty_claim" && (
            <Tag color="purple" className="text-xs">
              BH
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      width: 200,
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      key: "productName",
      width: 250,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div className="text-xs text-gray-500">
            Code: {record.productCode}
          </div>
        </div>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: "Tiến độ",
      dataIndex: "progressText",
      key: "progressText",
      width: 120,
      render: (text) => <Tag color="processing">{text}</Tag>,
    },
    {
      title: "Trạng thái đơn",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (value) => {
        const statusColors: Record<string, string> = {
          pending: "default",
          confirmed: "warning",
          in_progress: "processing",
          on_hold: "orange",
          completed: "success",
          cancelled: "error",
          refund: "magenta",
        };
        const statusName: Record<string, string> = {
          pending: "Chờ xử lý",
          confirmed: "Đã xác nhận",
          in_progress: "Đang thực hiện",
          on_hold: "Chờ thanh toán",
          completed: "Hoàn thành",
          cancelled: "Đã hủy",
          refund: "Hoàn trả",
        };
        return (
          <Tag color={statusColors[value] || "default"}>
            {statusName[value] || value}
          </Tag>
        );
      },
    },
    {
      title: "Ngày hẹn",
      dataIndex: "deliveryDate",
      key: "deliveryDate",
      width: 150,
      render: (value: number) => (
        <Text type="secondary">
          {value ? dayjs(value).format("DD/MM/YYYY") : "-"}
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      fixed: "right" as const,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            if (record.type === "warranty_claim") {
              router.push(
                `/technician/todo/warranty/${record.orderCode}/${record.productCode}`
              );
            } else {
              router.push(
                `/technician/todo/${record.orderCode}/${record.productCode}`
              );
            }
          }}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  // Filter fields
  const filterFields: FilterField[] = [
    {
      name: "orderCode",
      label: "Mã đơn",
      type: "input",
    },
    {
      name: "status",
      label: "Trạng thái đơn",
      type: "select",
      options: [
        { label: "Chờ xử lý", value: OrderStatus.PENDING },
        { label: "Đã xác nhận", value: OrderStatus.CONFIRMED },
        { label: "Đang thực hiện", value: OrderStatus.IN_PROGRESS },
        { label: "Tạm giữ", value: OrderStatus.ON_HOLD },
        { label: "Hoàn thành", value: OrderStatus.COMPLETED },
        { label: "Đã hủy", value: OrderStatus.CANCELLED },
      ],
    },
    {
      name: "customerName",
      label: "Khách hàng",
      type: "input",
    },
  ];

  return (
    <WrapperContent
      isEmpty={
        filteredData.length === 0 && !ordersLoading && !warrantyClaimsLoading
      }
      isLoading={ordersLoading || warrantyClaimsLoading}
      header={{
        searchInput: {
          placeholder: "Tìm kiếm theo mã đơn, khách hàng, sản phẩm...",
          filterKeys: [
            "orderCode",
            "customerName",
            "productName",
            "productCode",
          ],
        },
        filters: {
          fields: filterFields,
          query: query,
          onApplyFilter: (filters) => {
            filters.forEach(({ key, value }) => updateQuery(key, value));
          },
          onReset: reset,
        },
      }}
    >
      <CommonTable
        columns={columns}
        dataSource={filteredData}
        loading={ordersLoading || warrantyClaimsLoading}
        pagination={{
          ...pagination,
          onChange: handlePageChange,
        }}
        paging={true}
        rank={true}
        rowKey="key"
      />
    </WrapperContent>
  );
}
