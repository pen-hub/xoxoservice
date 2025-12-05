"use client";

import useFilter from "@/hooks/useFilter";
import { ColumnSetting, FilterField } from "@/types";
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
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import CommonTable, { PropRowDetails } from "./CommonTable";
import WrapperContent from "./WrapperContent";

const { Text } = Typography;

interface Lead {
  key: string;
  customerName: string;
  phone: string;
  careType: "Call_Day_3" | "Call_Day_7" | "Overdue";
  lastContact: string;
  notes: string;
  status: "Pending" | "Called" | "Closed";
}

const mockLeads: Lead[] = [
  {
    key: "1",
    customerName: "Nguyễn Văn A",
    phone: "0912345678",
    careType: "Call_Day_3",
    lastContact: "2024-12-01",
    notes: "Khách quan tâm áo sơ mi",
    status: "Pending",
  },
  {
    key: "2",
    customerName: "Trần Thị B",
    phone: "0923456789",
    careType: "Overdue",
    lastContact: "2024-11-20",
    notes: "Chưa thanh toán đơn hàng",
    status: "Pending",
  },
  {
    key: "3",
    customerName: "Lê Văn C",
    phone: "0934567890",
    careType: "Call_Day_7",
    lastContact: "2024-11-25",
    notes: "Đang cân nhắc đặt hàng",
    status: "Called",
  },
  {
    key: "4",
    customerName: "Phạm Thị D",
    phone: "0945678901",
    careType: "Call_Day_3",
    lastContact: "2024-12-02",
    notes: "Yêu cầu báo giá",
    status: "Pending",
  },
  {
    key: "5",
    customerName: "Hoàng Văn E",
    phone: "0956789012",
    careType: "Call_Day_7",
    lastContact: "2024-11-28",
    notes: "Khách hàng VIP",
    status: "Pending",
  },
  {
    key: "6",
    customerName: "Đỗ Thị F",
    phone: "0967890123",
    careType: "Overdue",
    lastContact: "2024-11-15",
    notes: "Cần gọi lại gấp",
    status: "Pending",
  },
  {
    key: "7",
    customerName: "Vũ Văn G",
    phone: "0978901234",
    careType: "Call_Day_3",
    lastContact: "2024-11-30",
    notes: "Đang thử mẫu",
    status: "Called",
  },
  {
    key: "8",
    customerName: "Ngô Thị H",
    phone: "0989012345",
    careType: "Call_Day_7",
    lastContact: "2024-11-26",
    notes: "Chờ duyệt hợp đồng",
    status: "Closed",
  },
  {
    key: "9",
    customerName: "Bùi Văn I",
    phone: "0990123456",
    careType: "Overdue",
    lastContact: "2024-11-10",
    notes: "Nợ 3 tháng",
    status: "Pending",
  },
  {
    key: "10",
    customerName: "Đinh Thị J",
    phone: "0901234567",
    careType: "Call_Day_3",
    lastContact: "2024-12-01",
    notes: "Khách mới",
    status: "Pending",
  },
  {
    key: "11",
    customerName: "Phan Văn K",
    phone: "0912223334",
    careType: "Call_Day_7",
    lastContact: "2024-11-27",
    notes: "Đã đặt cọc",
    status: "Called",
  },
  {
    key: "12",
    customerName: "Mai Thị L",
    phone: "0923334445",
    careType: "Call_Day_3",
    lastContact: "2024-12-02",
    notes: "Yêu cầu giao nhanh",
    status: "Pending",
  },
  {
    key: "13",
    customerName: "Tô Văn M",
    phone: "0934445556",
    careType: "Overdue",
    lastContact: "2024-11-18",
    notes: "Chưa liên lạc được",
    status: "Pending",
  },
  {
    key: "14",
    customerName: "Dương Thị N",
    phone: "0945556667",
    careType: "Call_Day_7",
    lastContact: "2024-11-29",
    notes: "Đơn hàng lớn",
    status: "Called",
  },
  {
    key: "15",
    customerName: "Lý Văn O",
    phone: "0956667778",
    careType: "Call_Day_3",
    lastContact: "2024-12-01",
    notes: "Khách quen",
    status: "Pending",
  },
];

const CustomerCareDetail = ({ data, onClose }: PropRowDetails<Lead>) => {
  const { message } = App.useApp();
  if (!data) return null;

  const getCareTypeTag = (careType: string) => {
    let color = "default";
    let text = "";

    if (careType === "Call_Day_3") {
      color = "yellow";
      text = "Gọi ngày 3";
    } else if (careType === "Call_Day_7") {
      color = "orange";
      text = "Gọi ngày 7";
    } else if (careType === "Overdue") {
      color = "red";
      text = "Quá hạn";
    }
    return <Tag color={color}>{text}</Tag>;
  };

  const getStatusTag = (status: string) => {
    let color = "default";
    let text = "";

    if (status === "Pending") {
      color = "blue";
      text = "Chờ xử lý";
    } else if (status === "Called") {
      color = "green";
      text = "Đã gọi";
    } else {
      color = "default";
      text = "Đã đóng";
    }
    return <Tag color={color}>{text}</Tag>;
  };

  return (
    <div className="space-y-4">
      <Descriptions title="Thông tin khách hàng" bordered column={1}>
        <Descriptions.Item label="Tên khách hàng">
          {data.customerName}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          <Space>
            <Text>{data.phone}</Text>
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(data.phone);
                message.success("Đã sao chép số điện thoại");
              }}
            />
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Loại chăm sóc">
          {getCareTypeTag(data.careType)}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          {getStatusTag(data.status)}
        </Descriptions.Item>
        <Descriptions.Item label="Lần liên hệ cuối">
          {data.lastContact}
        </Descriptions.Item>
        <Descriptions.Item label="Ghi chú">{data.notes}</Descriptions.Item>
      </Descriptions>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>Đóng</Button>
        <Button
          type="primary"
          icon={<PhoneOutlined />}
          className="bg-green-500 hover:bg-green-600"
          onClick={() => {
            window.location.href = `tel:${data.phone}`;
          }}
        >
          Gọi ngay
        </Button>
      </div>
    </div>
  );
};

export default function CustomerCareDashboard() {
  const { message } = App.useApp();
  const { query, updateQuery, reset } = useFilter({
    search: "",
    careType: "all",
    status: "all",
  });

  const [columnSettings, setColumnSettings] = useState<ColumnSetting[]>([
    { key: "customerName", title: "Tên khách hàng", visible: true },
    { key: "phone", title: "Số điện thoại", visible: true },
    { key: "careType", title: "Loại chăm sóc", visible: true },
    { key: "lastContact", title: "Lần liên hệ cuối", visible: true },
    { key: "status", title: "Trạng thái", visible: true },
    { key: "notes", title: "Ghi chú", visible: true },
    { key: "action", title: "Thao tác", visible: true },
  ]);

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch =
      !query.search ||
      lead.customerName.toLowerCase().includes(query.search.toLowerCase()) ||
      lead.phone.includes(query.search);

    const matchesCareType =
      !query.careType ||
      query.careType === "all" ||
      lead.careType === query.careType;

    const matchesStatus =
      !query.status || query.status === "all" || lead.status === query.status;

    return matchesSearch && matchesCareType && matchesStatus;
  });

  const callDay3Count = mockLeads.filter(
    (l) => l.careType === "Call_Day_3" && l.status === "Pending"
  ).length;
  const callDay7Count = mockLeads.filter(
    (l) => l.careType === "Call_Day_7" && l.status === "Pending"
  ).length;
  const overdueCount = mockLeads.filter(
    (l) => l.careType === "Overdue" && l.status === "Pending"
  ).length;
  const totalPending = mockLeads.filter((l) => l.status === "Pending").length;

  const columns: ColumnsType<Lead> = [
    {
      title: "Tên khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      width: 180,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 180,
      render: (phone: string) => (
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
      ),
    },
    {
      title: "Loại chăm sóc",
      dataIndex: "careType",
      key: "careType",
      width: 150,
      render: (careType: string) => {
        let color = "default";
        let text = "";

        if (careType === "Call_Day_3") {
          color = "yellow";
          text = "Gọi ngày 3";
        } else if (careType === "Call_Day_7") {
          color = "orange";
          text = "Gọi ngày 7";
        } else if (careType === "Overdue") {
          color = "red";
          text = "Quá hạn";
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Lần liên hệ cuối",
      dataIndex: "lastContact",
      key: "lastContact",
      width: 150,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        let color = "default";
        let text = "";

        if (status === "Pending") {
          color = "blue";
          text = "Chờ xử lý";
        } else if (status === "Called") {
          color = "green";
          text = "Đã gọi";
        } else {
          color = "default";
          text = "Đã đóng";
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      width: 200,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      fixed: "right" as const,
      render: (_: unknown, record: Lead) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<PhoneOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `tel:${record.phone}`;
            }}
            className="bg-green-500 hover:bg-green-600"
          >
            Gọi ngay
          </Button>
        </Space>
      ),
    },
  ].filter((col) => columnSettings.find((s) => s.key === col.key && s.visible));

  const filterFields: FilterField[] = [
    {
      type: "select",
      name: "careType",
      label: "Loại chăm sóc",
      options: [
        { label: "Tất cả", value: "all" },
        { label: "Gọi ngày 3", value: "Call_Day_3" },
        { label: "Gọi ngày 7", value: "Call_Day_7" },
        { label: "Quá hạn", value: "Overdue" },
      ],
    },
    {
      type: "select",
      name: "status",
      label: "Trạng thái",
      options: [
        { label: "Tất cả", value: "all" },
        { label: "Chờ xử lý", value: "Pending" },
        { label: "Đã gọi", value: "Called" },
        { label: "Đã đóng", value: "Closed" },
      ],
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm theo tên hoặc số điện thoại",
          filterKeys: ["customerName", "phone"],
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
          columns: columnSettings,
          onChange: setColumnSettings,
          onReset: () =>
            setColumnSettings([
              { key: "customerName", title: "Tên khách hàng", visible: true },
              { key: "phone", title: "Số điện thoại", visible: true },
              { key: "careType", title: "Loại chăm sóc", visible: true },
              { key: "lastContact", title: "Lần liên hệ cuối", visible: true },
              { key: "status", title: "Trạng thái", visible: true },
              { key: "notes", title: "Ghi chú", visible: true },
              { key: "action", title: "Thao tác", visible: true },
            ]),
        },
      }}
    >
      <Space vertical size="large" className="w-full">
        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <Statistic
              title="Cần gọi ngày 3"
              value={callDay3Count}
              prefix={<ClockCircleOutlined />}
              styles={{
                content: { color: "#faad14" },
              }}
            />
          </Card>
          <Card>
            <Statistic
              title="Cần gọi ngày 7"
              value={callDay7Count}
              prefix={<ClockCircleOutlined />}
              styles={{
                content: { color: "#fa8c16" },
              }}
            />
          </Card>
          <Card>
            <Statistic
              title="Quá hạn"
              value={overdueCount}
              prefix={<ClockCircleOutlined />}
              styles={{
                content: { color: "#cf1322" },
              }}
            />
          </Card>
          <Card>
            <Statistic
              title="Tổng chờ xử lý"
              value={totalPending}
              prefix={<UserOutlined />}
              styles={{
                content: { color: "#1890ff" },
              }}
            />
          </Card>
        </div>

        <CommonTable
          columns={columns}
          dataSource={filteredLeads}
          loading={false}
          DrawerDetails={CustomerCareDetail}
        />
      </Space>
    </WrapperContent>
  );
}
