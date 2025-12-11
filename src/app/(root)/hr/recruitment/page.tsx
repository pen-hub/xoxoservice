"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { ColumnSetting, FilterField } from "@/types";
import {
  CalendarOutlined,
  CopyOutlined,
  MailOutlined,
  PhoneOutlined,
  UserAddOutlined,
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

const { Text, Paragraph } = Typography;

interface Candidate {
  id: string;
  key: string;
  name: string;
  phone: string;
  email: string;
  position: string;
  source: "Website" | "LinkedIn" | "Referral" | "Job Board";
  status:
    | "New"
    | "Reviewing"
    | "Interview_Scheduled"
    | "Interviewed"
    | "Offered"
    | "Accepted"
    | "Rejected";
  appliedDate: string;
  experience: string;
  interviewDate?: string;
  notes: string;
}

const mockCandidates: Candidate[] = [
  {
    id: "1",
    key: "1",
    name: "Nguyễn Văn An",
    phone: "0912345678",
    email: "nguyenvanan@email.com",
    position: "Kỹ thuật viên sửa chữa",
    source: "Website",
    status: "Interview_Scheduled",
    appliedDate: "2024-12-01",
    experience: "3 năm kinh nghiệm sửa chữa túi xách cao cấp",
    interviewDate: "2024-12-05 10:00",
    notes: "Có kinh nghiệm tốt với các thương hiệu luxury",
  },
  {
    id: "2",
    key: "2",
    name: "Trần Thị Bình",
    phone: "0923456789",
    email: "tranthib@email.com",
    position: "Nhân viên kinh doanh",
    source: "LinkedIn",
    status: "Reviewing",
    appliedDate: "2024-12-02",
    experience: "2 năm làm sale thời trang",
    notes: "CV ấn tượng, cần review kỹ hơn",
  },
  {
    id: "3",
    key: "3",
    name: "Lê Văn Cường",
    phone: "0934567890",
    email: "levanc@email.com",
    position: "Thợ phục hồi màu",
    source: "Referral",
    status: "Offered",
    appliedDate: "2024-11-25",
    experience: "5 năm kinh nghiệm nhuộm da chuyên nghiệp",
    interviewDate: "2024-11-28 14:00",
    notes: "Đã phỏng vấn xuất sắc, đưa offer 15tr/tháng",
  },
  {
    id: "4",
    key: "4",
    name: "Phạm Thị Dung",
    phone: "0945678901",
    email: "phamthid@email.com",
    position: "Nhân viên chăm sóc khách hàng",
    source: "Job Board",
    status: "New",
    appliedDate: "2024-12-03",
    experience: "1 năm làm CSKH",
    notes: "Mới nộp CV",
  },
  {
    id: "5",
    key: "5",
    name: "Hoàng Văn Em",
    phone: "0956789012",
    email: "hoangvane@email.com",
    position: "Kỹ thuật viên xi mạ",
    source: "Website",
    status: "Interviewed",
    appliedDate: "2024-11-20",
    experience: "4 năm kinh nghiệm xi mạ phục hồi kim loại",
    interviewDate: "2024-11-30 09:00",
    notes: "Kỹ năng tốt, đang chờ quyết định",
  },
  {
    id: "6",
    key: "6",
    name: "Đỗ Thị Phương",
    phone: "0967890123",
    email: "dothiphuong@email.com",
    position: "Nhân viên marketing",
    source: "LinkedIn",
    status: "Rejected",
    appliedDate: "2024-11-15",
    experience: "6 tháng thực tập marketing",
    notes: "Kinh nghiệm chưa phù hợp",
  },
];

const CandidateDetail = ({ data, onClose }: PropRowDetails<Candidate>) => {
  const { message } = App.useApp();
  if (!data) return null;

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      New: { color: "blue", text: "Mới" },
      Reviewing: { color: "cyan", text: "Đang xem xét" },
      Interview_Scheduled: { color: "orange", text: "Đã hẹn phỏng vấn" },
      Interviewed: { color: "purple", text: "Đã phỏng vấn" },
      Offered: { color: "green", text: "Đã offer" },
      Accepted: { color: "success", text: "Đã chấp nhận" },
      Rejected: { color: "red", text: "Từ chối" },
    };
    const { color, text } = statusMap[status] || {
      color: "default",
      text: status,
    };
    return <Tag color={color}>{text}</Tag>;
  };

  const getSourceTag = (source: string) => {
    const sourceMap: Record<string, { color: string }> = {
      Website: { color: "blue" },
      LinkedIn: { color: "geekblue" },
      Referral: { color: "green" },
      "Job Board": { color: "orange" },
    };
    const { color } = sourceMap[source] || { color: "default" };
    return <Tag color={color}>{source}</Tag>;
  };

  return (
    <div className="space-y-4">
      <Descriptions title="Thông tin ứng viên" bordered column={1}>
        <Descriptions.Item label="Họ tên">{data.name}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          <Space>
            <Text>{data.phone}</Text>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(data.phone);
                message.success("Đã sao chép số điện thoại");
              }}
            />
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          <Space>
            <Text>{data.email}</Text>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(data.email);
                message.success("Đã sao chép email");
              }}
            />
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Vị trí ứng tuyển">
          {data.position}
        </Descriptions.Item>
        <Descriptions.Item label="Nguồn tuyển dụng">
          {getSourceTag(data.source)}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          {getStatusTag(data.status)}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày ứng tuyển">
          {data.appliedDate}
        </Descriptions.Item>
        {data.interviewDate && (
          <Descriptions.Item label="Lịch phỏng vấn">
            <Space>
              <CalendarOutlined />
              <Text>{data.interviewDate}</Text>
            </Space>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Kinh nghiệm">
          <Paragraph className="mb-0">{data.experience}</Paragraph>
        </Descriptions.Item>
        <Descriptions.Item label="Ghi chú">
          <Paragraph className="mb-0">{data.notes}</Paragraph>
        </Descriptions.Item>
      </Descriptions>

      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>Đóng</Button>
        <Button
          icon={<MailOutlined />}
          onClick={() => {
            window.location.href = `mailto:${data.email}`;
          }}
        >
          Gửi Email
        </Button>
        <Button
          type="primary"
          icon={<PhoneOutlined />}
          className="bg-green-500 hover:bg-green-600"
          onClick={() => {
            window.location.href = `tel:${data.phone}`;
          }}
        >
          Gọi điện
        </Button>
      </div>
    </div>
  );
};

export default function RecruitmentPage() {
  const { message } = App.useApp();
  const { query, updateQuery, reset } = useFilter({
    search: "",
    position: "all",
    status: "all",
    source: "all",
  });

  const [columnSettings, setColumnSettings] = useState<ColumnSetting[]>([
    { key: "name", title: "Họ tên", visible: true },
    { key: "phone", title: "Số điện thoại", visible: true },
    { key: "email", title: "Email", visible: true },
    { key: "position", title: "Vị trí", visible: true },
    { key: "source", title: "Nguồn", visible: true },
    { key: "status", title: "Trạng thái", visible: true },
    { key: "appliedDate", title: "Ngày ứng tuyển", visible: true },
    { key: "action", title: "Thao tác", visible: true },
  ]);

  const filteredCandidates = mockCandidates.filter((candidate) => {
    const matchesSearch =
      !query.search ||
      candidate.name.toLowerCase().includes(query.search.toLowerCase()) ||
      candidate.phone.includes(query.search) ||
      candidate.email.toLowerCase().includes(query.search.toLowerCase());

    const matchesPosition =
      !query.position ||
      query.position === "all" ||
      candidate.position === query.position;

    const matchesStatus =
      !query.status ||
      query.status === "all" ||
      candidate.status === query.status;

    const matchesSource =
      !query.source ||
      query.source === "all" ||
      candidate.source === query.source;

    return matchesSearch && matchesPosition && matchesStatus && matchesSource;
  });

  const newCount = mockCandidates.filter((c) => c.status === "New").length;
  const interviewCount = mockCandidates.filter(
    (c) => c.status === "Interview_Scheduled"
  ).length;
  const offeredCount = mockCandidates.filter(
    (c) => c.status === "Offered"
  ).length;
  const totalCandidates = mockCandidates.length;

  const columns: ColumnsType<Candidate> = [
    {
      title: "Họ tên",
      dataIndex: "name",
      key: "name",
      width: 180,
      fixed: "left" as const,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      render: (phone: string) => (
        <Space>
          <Text>{phone}</Text>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(phone);
              message.success("Đã sao chép");
            }}
          />
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Vị trí",
      dataIndex: "position",
      key: "position",
      width: 180,
    },
    {
      title: "Nguồn",
      dataIndex: "source",
      key: "source",
      width: 120,
      render: (source: string) => {
        const sourceMap: Record<string, { color: string }> = {
          Website: { color: "blue" },
          LinkedIn: { color: "geekblue" },
          Referral: { color: "green" },
          "Job Board": { color: "orange" },
        };
        const { color } = sourceMap[source] || { color: "default" };
        return <Tag color={color}>{source}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          New: { color: "blue", text: "Mới" },
          Reviewing: { color: "cyan", text: "Đang xem xét" },
          Interview_Scheduled: { color: "orange", text: "Đã hẹn PV" },
          Interviewed: { color: "purple", text: "Đã PV" },
          Offered: { color: "green", text: "Đã offer" },
          Accepted: { color: "success", text: "Đã chấp nhận" },
          Rejected: { color: "red", text: "Từ chối" },
        };
        const { color, text } = statusMap[status] || {
          color: "default",
          text: status,
        };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Ngày ứng tuyển",
      dataIndex: "appliedDate",
      key: "appliedDate",
      width: 140,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 240,
      fixed: "right" as const,
      render: (_: unknown, record: Candidate) => (
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
            Gọi
          </Button>
          <Button
            icon={<MailOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `mailto:${record.email}`;
            }}
          >
            Email
          </Button>
        </Space>
      ),
    },
  ].filter((col) => columnSettings.find((s) => s.key === col.key && s.visible));

  const filterFields: FilterField[] = [
    {
      type: "select",
      name: "position",
      label: "Vị trí",
      options: [
        { label: "Tất cả", value: "all" },
        { label: "Kỹ thuật viên sửa chữa", value: "Kỹ thuật viên sửa chữa" },
        { label: "Nhân viên kinh doanh", value: "Nhân viên kinh doanh" },
        { label: "Thợ phục hồi màu", value: "Thợ phục hồi màu" },
        { label: "Kỹ thuật viên xi mạ", value: "Kỹ thuật viên xi mạ" },
        {
          label: "Nhân viên chăm sóc khách hàng",
          value: "Nhân viên chăm sóc khách hàng",
        },
        { label: "Nhân viên marketing", value: "Nhân viên marketing" },
      ],
    },
    {
      type: "select",
      name: "status",
      label: "Trạng thái",
      options: [
        { label: "Tất cả", value: "all" },
        { label: "Mới", value: "New" },
        { label: "Đang xem xét", value: "Reviewing" },
        { label: "Đã hẹn phỏng vấn", value: "Interview_Scheduled" },
        { label: "Đã phỏng vấn", value: "Interviewed" },
        { label: "Đã offer", value: "Offered" },
        { label: "Đã chấp nhận", value: "Accepted" },
        { label: "Từ chối", value: "Rejected" },
      ],
    },
    {
      type: "select",
      name: "source",
      label: "Nguồn tuyển dụng",
      options: [
        { label: "Tất cả", value: "all" },
        { label: "Website", value: "Website" },
        { label: "LinkedIn", value: "LinkedIn" },
        { label: "Giới thiệu", value: "Referral" },
        { label: "Job Board", value: "Job Board" },
      ],
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm theo tên, SĐT, email",
          filterKeys: ["name", "phone", "email"],
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
              { key: "name", title: "Họ tên", visible: true },
              { key: "phone", title: "Số điện thoại", visible: true },
              { key: "email", title: "Email", visible: true },
              { key: "position", title: "Vị trí", visible: true },
              { key: "source", title: "Nguồn", visible: true },
              { key: "status", title: "Trạng thái", visible: true },
              { key: "appliedDate", title: "Ngày ứng tuyển", visible: true },
              { key: "action", title: "Thao tác", visible: true },
            ]),
        },
        buttonEnds: [
          {
            can: true ,
            name: "Thêm ứng viên",
            icon: <UserAddOutlined />,
            type: "primary",
            onClick: () => message.info("Chức năng đang phát triển"),
          },
        ],
      }}
    >
      <Space vertical size="large" className="w-full">
        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <Statistic
              title="Ứng viên mới"
              value={newCount}
              prefix={<UserOutlined />}
              styles={{
                content: { color: "#1890ff" },
              }}
            />
          </Card>
          <Card>
            <Statistic
              title="Đã hẹn phỏng vấn"
              value={interviewCount}
              prefix={<CalendarOutlined />}
              styles={{
                content: { color: "#fa8c16" },
              }}
            />
          </Card>
          <Card>
            <Statistic
              title="Đã offer"
              value={offeredCount}
              prefix={<UserAddOutlined />}
              styles={{
                content: { color: "#52c41a" },
              }}
            />
          </Card>
          <Card>
            <Statistic
              title="Tổng ứng viên"
              value={totalCandidates}
              prefix={<UserOutlined />}
              styles={{
                content: { color: "#722ed1" },
              }}
            />
          </Card>
        </div>

        <CommonTable
          columns={columns}
          dataSource={filteredCandidates}
          loading={false}
          DrawerDetails={CandidateDetail}
        />
      </Space>
    </WrapperContent>
  );
}
