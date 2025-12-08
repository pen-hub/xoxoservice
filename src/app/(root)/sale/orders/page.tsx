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
import { OrderStatus, FirebaseOrderData } from "@/types/order";
import { IMembers } from "@/types/members";

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

  const filteredOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) {
      return [];
    }
    return applyFilter(orders);
  }, [orders, applyFilter]);

  const handleDelete = (orderCode: string) => {
    modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa đơn hàng ${orderCode}? Hành động này không thể hoàn tác.`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => {
        // TODO: Implement firebase delete
        message.success(`Đơn hàng ${orderCode} đã được xóa.`);
      },
    });
  };

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
      width: 180,
      render: (issues: string[] | undefined) => {
        if (!issues || issues.length === 0) {
          return "-";
        }
        return (
          <Space direction="vertical">
            {issues.map((issue) => {
              if (issue === "pending_images") {
                return (
                  <Tag color="purple" key={issue}>
                    Cần hẹn lấy ảnh
                  </Tag>
                );
              }
              return null;
            })}
          </Space>
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
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: "Xem chi tiết",
                icon: <EyeOutlined />,
                onClick: () => handleViewDetails(record.code),
              },
              {
                key: "edit",
                label: "Chỉnh sửa",
                icon: <EditOutlined />,
                onClick: () => handleEdit(record.code),
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
      return { total: 0, pending: 0, confirmed: 0, in_progress: 0, completed: 0 };
    }
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
      confirmed: orders.filter((o) => o.status === OrderStatus.CONFIRMED).length,
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
                { value: OrderStatus.CONFIRMED, label: "Đã xác nhận" },
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
            onClick: () => router.push("/sale/orders/create"),
          },
        ],
      }}
    >
      <div className="space-y-4">
        <Row gutter={16}>
          <Col span={4}>
            <Card>
              <Statistic
                title="Tổng đơn"
                value={stats.total}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Chờ xử lý"
                value={stats.pending}
                styles={{ content: { color: "#faad14" } }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Đã xác nhận"
                value={stats.confirmed}
                styles={{ content: { color: "#fadb14" } }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="Đang thực hiện"
                value={stats.in_progress}
                styles={{ content: { color: "#1890ff" } }}
              />
            </Card>
          </Col>
          <Col span={4}>
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
