"use client";

import CommonTable from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import useFilter from "@/hooks/useFilter";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  App,
  Button,
  Card,
  Col,
  Dropdown,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { Order, Staff } from "../../../types/order";
import { OrderStatus } from "../../../types/order";

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

export default function OrderListPage() {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const { data: ordersData, isLoading: ordersLoading } =
    useRealtimeList<Order>("xoxo/orders");
  const { data: staffData, isLoading: staffLoading } =
    useRealtimeList<Staff>("xoxo/employees");

  // Ensure data is always an array, never null
  const orders = ordersData || [];
  console.log(orders);
  const staff = staffData || [];

  const staffMap = useMemo(() => {
    if (!staff || !Array.isArray(staff)) {
      return {} as Record<string, Staff>;
    }
    return staff.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {} as Record<string, Staff>);
  }, [staff]);

  const {
    query,
    pagination,
    updateQueries,
    reset,
    applyFilter,
    handlePageChange,
  } = useFilter({ search: "" });

  const filteredOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) {
      return [];
    }
    return applyFilter(orders);
  }, [orders, applyFilter]);

  const handleDelete = (orderId: string) => {
    modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa đơn hàng ${orderId}? Hành động này không thể hoàn tác.`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => {
        // TODO: Implement firebase delete
        message.success(`Đơn hàng ${orderId} đã được xóa.`);
      },
    });
  };

  const handleEdit = (orderId: string) => {
    router.push(`/orders/${orderId}/update`);
  };

  const handleViewDetails = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  const columns: TableColumnsType<Order> = [
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
          onClick={() => handleViewDetails(record.id)}
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
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: "Xem chi tiết",
                icon: <EyeOutlined />,
                onClick: () => handleViewDetails(record.id),
              },
              {
                key: "edit",
                label: "Chỉnh sửa",
                icon: <EditOutlined />,
                onClick: () => handleEdit(record.id),
              },
              {
                key: "delete",
                label: "Xóa",
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDelete(record.code),
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const stats = useMemo(() => {
    if (!orders || !Array.isArray(orders)) {
      return { total: 0, pending: 0, in_progress: 0, completed: 0 };
    }
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
      in_progress: orders.filter((o) => o.status === OrderStatus.IN_PROGRESS)
        .length,
      completed: orders.filter((o) => o.status === OrderStatus.COMPLETED)
        .length,
    };
  }, [orders]);

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
                { value: OrderStatus.IN_PROGRESS, label: "Đang thực hiện" },
                { value: OrderStatus.COMPLETED, label: "Hoàn thành" },
                { value: OrderStatus.CANCELLED, label: "Đã hủy" },
              ],
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
            onClick: () => router.push("/orders/create"),
          },
        ],
      }}
    >
      <div className="space-y-4">
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng đơn"
                value={stats.total}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Chờ xử lý"
                value={stats.pending}
                styles={{ content: { color: "#faad14" } }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đang thực hiện"
                value={stats.in_progress}
                styles={{ content: { color: "#1890ff" } }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Hoàn thành"
                value={stats.completed}
                styles={{ content: { color: "#52c41a" } }}
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
