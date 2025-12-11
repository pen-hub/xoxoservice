"use client";

import CommonTable from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import useFilter from "@/hooks/useFilter";
import { IMembers } from "@/types/members";
import { FirebaseOrderData, OrderStatus } from "@/types/order";
import { genCode } from "@/utils/genCode";
import {
  EyeOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  App,
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

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

export default function OrderListPage() {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const { data: ordersData, isLoading: ordersLoading } =
    useRealtimeList<FirebaseOrderData>("xoxo/orders");
  const { data: staffData, isLoading: staffLoading } =
    useRealtimeList<IMembers>("xoxo/members");

  // Ensure data is always an array, never null
  const orders = ordersData || [];
  console.log(orders);
  const staff = staffData || [];

  const staffMap = useMemo(() => {
    if (!staff || !Array.isArray(staff)) {
      return {} as Record<string, IMembers>;
    }
    return staff.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {} as Record<string, IMembers>);
  }, [staff]);

  const {
    query,
    pagination,
    updateQueries,
    reset,
    applyFilter,
    handlePageChange,
  } = useFilter({ search: "" });

  const staffOptions = useMemo(
    () =>
      (staff || []).map((s) => ({
        label: s.name,
        value: s.id,
      })),
    [staff]
  );

  const filteredOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) {
      return [];
    }
    return applyFilter(orders);
  }, [orders, applyFilter]);

  const handleEdit = (orderCode: string) => {
    router.push(`/sale/orders/${orderCode}/update`);
  };

  const handleViewDetails = (orderCode: string) => {
    router.push(`/sale/orders/${orderCode}`);
  };

  const columns: TableColumnsType<FirebaseOrderData> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "code",
      key: "code",
      width: 150,
      fixed: "left",
      render: (code, record) => (
        <Text
          strong
          className="cursor-pointer text-primary hover:underline"
          onClick={() => handleViewDetails(record.code)}
        >
          {code}
        </Text>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      width: 200,
    },
    {
      title: "Nhân viên tạo",
      dataIndex: "createdByName",
      key: "createdByName",
      width: 180,
      render: (staff: string) => {
        return (
          <Space>
            <Text>{staff}</Text>
          </Space>
        );
      },
    },
    {
      title: "NV tư vấn",
      dataIndex: "consultantId",
      key: "consultantId",
      width: 180,
      render: (consultantId: string) => {
        const consultant = staffMap[consultantId];
        return consultant ? consultant.name : consultantId || "-";
      },
    },
    {
      title: "Số sản phẩm",
      key: "products",
      width: 120,
      align: "center",
      render: (_, record) => Object.keys(record.products || {}).length,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: OrderStatus) => {
        const { color, text } = getStatusInfo(status);
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Lưu ý",
      dataIndex: "issues",
      key: "issues",
      width: 120,
      fixed: "right",
      render: (issues: string[] | undefined) => {
        if (!issues || issues.length === 0) {
          return "-";
        }
        return (
          <div className="flex flex-col gap-1 overflow-y-auto max-h-20">
            {issues.map((issue) => {
              return (
                <Tag
                  color="purple"
                  key={`issue-${issue}-${genCode("REACTKEY")}`}
                >
                  {issue}
                </Tag>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record.code)}
        />
      ),
    },
  ];

  const stats = useMemo(() => {
    const source = Array.isArray(filteredOrders) ? filteredOrders : [];
    return {
      total: source.length,
      pending: source.filter((o) => o.status === OrderStatus.PENDING).length,
      confirmed: source.filter((o) => o.status === OrderStatus.CONFIRMED)
        .length,
      in_progress: source.filter((o) => o.status === OrderStatus.IN_PROGRESS)
        .length,
      on_hold: source.filter((o) => o.status === OrderStatus.ON_HOLD).length,
      completed: source.filter((o) => o.status === OrderStatus.COMPLETED)
        .length,
      refund: source.filter((o) => o.status === OrderStatus.REFUND).length,
      cancelled: source.filter((o) => o.status === OrderStatus.CANCELLED)
        .length,
    };
  }, [filteredOrders]);

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm theo mã đơn hàng, tên khách hàng...",
          filterKeys: ["code", "customerName"],
        },
        filters: {
          fields: [
            {
              name: "status",
              label: "Trạng thái",
              type: "select",
              options: [
                { value: OrderStatus.PENDING, label: "Chờ xử lý" },
                { value: OrderStatus.CONFIRMED, label: "Đã xác nhận" },
                { value: OrderStatus.IN_PROGRESS, label: "Đang thực hiện" },
                { value: OrderStatus.COMPLETED, label: "Hoàn thành" },
                { value: OrderStatus.REFUND, label: "Hoàn tiền" },
                { value: OrderStatus.CANCELLED, label: "Đã hủy" },
              ],
            },
            {
              name: "createdAt",
              label: "Ngày tạo",
              type: "dateRange",
            },
            {
              name: "customerName",
              label: "Khách hàng",
              type: "input",
              placeholder: "Tên khách hàng",
            },
            {
              name: "consultantId",
              label: "NV tư vấn",
              type: "select",
              options: staffOptions,
            },
            {
              name: "createdBy",
              label: "Người tạo",
              type: "select",
              options: staffOptions,
            },
          ],
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
        buttonEnds: [
          {
            name: "Tạo đơn hàng",
            icon: <PlusOutlined />,
            type: "primary",
            onClick: () => router.push("/sale/orders/create"),
          },
        ],
      }}
    >
      <div className="space-y-4">
        <Row gutter={16}>
          <Col span={3}>
            <Card style={{ textAlign: "center" }}>
              <Statistic
                title="Tổng đơn"
                value={stats.total}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card style={{ textAlign: "center" }}>
              <Statistic
                title="Chờ xác nhận"
                value={stats.pending}
                styles={{ content: { color: "#d9d9d9" } }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card style={{ textAlign: "center" }}>
              <Statistic
                title="Lên đơn"
                value={stats.confirmed}
                styles={{ content: { color: "#fa8c16" } }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card style={{ textAlign: "center" }}>
              <Statistic
                title="Sản xuất"
                value={stats.in_progress}
                styles={{ content: { color: "#1890ff" } }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card style={{ textAlign: "center" }}>
              <Statistic
                title="Thanh toán"
                value={stats.on_hold}
                styles={{ content: { color: "#722ed1" } }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card style={{ textAlign: "center" }}>
              <Statistic
                title="CSKH"
                value={stats.completed}
                styles={{ content: { color: "#52c41a" } }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card style={{ textAlign: "center" }}>
              <Statistic
                title="Hoàn tiền"
                value={stats.refund}
                styles={{ content: { color: "#eb2f96" } }}
              />
            </Card>
          </Col>
          <Col span={3}>
            <Card style={{ textAlign: "center" }}>
              <Statistic
                title="Đã huỷ"
                value={stats.cancelled}
                styles={{ content: { color: "#ff4d4f" } }}
              />
            </Card>
          </Col>
        </Row>
        <CommonTable
          columns={columns}
          dataSource={filteredOrders.reverse()}
          loading={ordersLoading || staffLoading}
          pagination={{ ...pagination, onChange: handlePageChange }}
          rank={true}
          paging={true}
        />
      </div>
    </WrapperContent>
  );
}
