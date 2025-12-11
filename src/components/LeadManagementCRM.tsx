"use client";

import type { PropRowDetails } from "@/components/CommonTable";
import CommonTable from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import {
  CheckCircleOutlined,
  FacebookOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps, TableColumnsType } from "antd";
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Modal,
  Select,
  Space,
  Tag,
  message,
} from "antd";
import { useState } from "react";
import LeadDetailDrawer from "./LeadDetailDrawer";

// Extended interfaces
interface CustomerInfo {
  name: string;
  avatar: string;
  phone: string;
  email: string;
  address: string;
  company?: string;
  position?: string;
  demand: string; // Nhu cầu khách hàng
  budget?: number;
  expectedDate?: string;
}

interface SalesActivity {
  type: "call" | "message" | "email" | "meeting" | "visit";
  date: string;
  staff: string;
  notes: string;
  duration?: number; // phút
}

interface Quotation {
  id: string;
  date: string;
  amount: number;
  items: {
    product: string;
    quantity: number;
    price: number;
  }[];
  status: "sent" | "accepted" | "rejected" | "negotiating";
  validUntil: string;
}

interface Contract {
  id: string;
  date: string;
  value: number;
  status: "draft" | "sent" | "signed" | "cancelled";
  signedDate?: string;
  terms: string;
}

interface AppointmentSchedule {
  id: string;
  date: string;
  purpose: string;
  staff: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
}

interface Ticket {
  id: string;
  type:
    | "reminder"
    | "send_photo"
    | "appointment"
    | "send_product"
    | "customer_visited"
    | "quoted_silent"
    | "other";
  priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdDate: string;
  dueDate?: string;
  description: string;
  assignedTo: string;
  notes: string[];
}

interface Lead {
  id: string;
  source: "Facebook" | "Zalo" | "TikTok" | "Direct";
  customer: CustomerInfo;
  status:
    | "new"
    | "assigned"
    | "contacted"
    | "qualified"
    | "proposal"
    | "negotiation"
    | "converted"
    | "failed";
  assignedTo: {
    name: string;
    avatar: string;
  } | null;
  createdAt: string;
  salesActivities: SalesActivity[];
  quotations: Quotation[];
  contracts: Contract[];
  appointmentSchedules: AppointmentSchedule[];
  tickets: Ticket[];
  interactionStats: {
    calls: number;
    messages: number;
    emails: number;
    meetings: number;
  };
}

const mockLeads: Lead[] = [
  {
    id: "1",
    source: "Facebook",
    customer: {
      name: "Nguyễn Văn An",
      avatar: "https://i.pravatar.cc/150?img=1",
      phone: "0912345678",
      email: "nguyenvanan@gmail.com",
      address: "123 Nguyễn Huệ, Q1, TP.HCM",
      company: "Công ty TNHH ABC",
      position: "Giám đốc",
      demand: "Cần sửa chữa túi xách Louis Vuitton cao cấp",
      budget: 5000000,
      expectedDate: "2024-12-15",
    },
    status: "qualified",
    assignedTo: {
      name: "Sales Hương",
      avatar: "https://i.pravatar.cc/150?img=51",
    },
    createdAt: "2024-12-01 09:30",
    salesActivities: [
      {
        type: "call",
        date: "2024-12-01 10:00",
        staff: "Sales Hương",
        notes: "Gọi giới thiệu dịch vụ, khách quan tâm",
        duration: 15,
      },
      {
        type: "message",
        date: "2024-12-01 14:30",
        staff: "Sales Hương",
        notes: "Gửi catalog sản phẩm qua Zalo",
      },
      {
        type: "meeting",
        date: "2024-12-02 09:00",
        staff: "Sales Hương",
        notes: "Gặp mặt tư vấn trực tiếp tại shop",
        duration: 45,
      },
    ],
    quotations: [
      {
        id: "QT-001",
        date: "2024-12-02 15:00",
        amount: 4500000,
        items: [
          { product: "Vệ sinh túi xách cao cấp", quantity: 1, price: 2000000 },
          { product: "Phục hồi màu da", quantity: 1, price: 1500000 },
          { product: "Xi mạ kim loại", quantity: 1, price: 1000000 },
        ],
        status: "sent",
        validUntil: "2024-12-10",
      },
    ],
    contracts: [],
    appointmentSchedules: [
      {
        id: "VS-001",
        date: "2024-12-05 14:00",
        purpose: "Mang sản phẩm đến để kiểm tra",
        staff: "Sales Hương",
        status: "scheduled",
      },
    ],
    tickets: [
      {
        id: "TK-001",
        type: "send_photo",
        priority: "high",
        status: "open",
        createdDate: "2024-12-03 09:00",
        dueDate: "2024-12-04 17:00",
        description: "Khách yêu cầu gửi ảnh túi trước khi sửa",
        assignedTo: "Sales Hương",
        notes: ["Đã chụp ảnh", "Chờ duyệt"],
      },
    ],
    interactionStats: {
      calls: 2,
      messages: 5,
      emails: 1,
      meetings: 1,
    },
  },
  {
    id: "2",
    source: "Zalo",
    customer: {
      name: "Trần Thị Bình",
      avatar: "https://i.pravatar.cc/150?img=2",
      phone: "0923456789",
      email: "tranthibinh@gmail.com",
      address: "456 Lê Lợi, Q3, TP.HCM",
      demand: "Khâu vá giày da nam",
      budget: 1500000,
    },
    status: "negotiation",
    assignedTo: {
      name: "Sales Minh",
      avatar: "https://i.pravatar.cc/150?img=52",
    },
    createdAt: "2024-12-01 10:15",
    salesActivities: [
      {
        type: "message",
        date: "2024-12-01 10:20",
        staff: "Sales Minh",
        notes: "Nhắn tin hỏi nhu cầu cụ thể",
      },
      {
        type: "call",
        date: "2024-12-01 15:00",
        staff: "Sales Minh",
        notes: "Tư vấn dịch vụ khâu vá",
        duration: 10,
      },
    ],
    quotations: [
      {
        id: "QT-002",
        date: "2024-12-02 10:00",
        amount: 1200000,
        items: [
          { product: "Khâu vá đế giày", quantity: 1, price: 800000 },
          { product: "Vệ sinh giày", quantity: 1, price: 400000 },
        ],
        status: "negotiating",
        validUntil: "2024-12-08",
      },
    ],
    contracts: [],
    appointmentSchedules: [],
    tickets: [
      {
        id: "TK-002",
        type: "quoted_silent",
        priority: "medium",
        status: "in_progress",
        createdDate: "2024-12-03 08:00",
        dueDate: "2024-12-05 17:00",
        description: "Đã báo giá nhưng khách chưa phản hồi",
        assignedTo: "Sales Minh",
        notes: ["Gọi lại sau 2 ngày", "Follow up qua Zalo"],
      },
    ],
    interactionStats: {
      calls: 3,
      messages: 8,
      emails: 0,
      meetings: 0,
    },
  },
  {
    id: "3",
    source: "TikTok",
    customer: {
      name: "Lê Văn Cường",
      avatar: "https://i.pravatar.cc/150?img=3",
      phone: "0934567890",
      email: "levancuong@gmail.com",
      address: "789 Trần Hưng Đạo, Q5, TP.HCM",
      demand: "Phục hồi màu ví da cao cấp",
      budget: 2000000,
    },
    status: "converted",
    assignedTo: {
      name: "Sales Tùng",
      avatar: "https://i.pravatar.cc/150?img=53",
    },
    createdAt: "2024-11-28 11:20",
    salesActivities: [
      {
        type: "call",
        date: "2024-11-28 14:00",
        staff: "Sales Tùng",
        notes: "Tư vấn dịch vụ phục hồi màu",
        duration: 20,
      },
      {
        type: "visit",
        date: "2024-11-29 10:00",
        staff: "Sales Tùng",
        notes: "Khách đến shop xem mẫu",
        duration: 30,
      },
    ],
    quotations: [
      {
        id: "QT-003",
        date: "2024-11-29 15:00",
        amount: 1800000,
        items: [{ product: "Phục hồi màu ví da", quantity: 1, price: 1800000 }],
        status: "accepted",
        validUntil: "2024-12-05",
      },
    ],
    contracts: [
      {
        id: "CT-001",
        date: "2024-11-30 09:00",
        value: 1800000,
        status: "signed",
        signedDate: "2024-11-30",
        terms: "Hoàn thành trong 5 ngày làm việc",
      },
    ],
    appointmentSchedules: [
      {
        id: "VS-002",
        date: "2024-11-29 10:00",
        purpose: "Xem mẫu và ký hợp đồng",
        staff: "Sales Tùng",
        status: "completed",
        notes: "Đã ký hợp đồng và đặt cọc 50%",
      },
    ],
    tickets: [],
    interactionStats: {
      calls: 4,
      messages: 6,
      emails: 2,
      meetings: 1,
    },
  },
  {
    id: "4",
    source: "Direct",
    customer: {
      name: "Phạm Thị Dung",
      avatar: "https://i.pravatar.cc/150?img=4",
      phone: "0945678901",
      email: "phamthidung@gmail.com",
      address: "321 Hai Bà Trưng, Q1, TP.HCM",
      demand: "Vệ sinh và bảo dưỡng giày cao cấp",
      budget: 1000000,
    },
    status: "new",
    assignedTo: null,
    createdAt: "2024-12-02 14:45",
    salesActivities: [],
    quotations: [],
    contracts: [],
    appointmentSchedules: [],
    tickets: [
      {
        id: "TK-004",
        type: "reminder",
        priority: "high",
        status: "open",
        createdDate: "2024-12-03 08:00",
        dueDate: "2024-12-03 17:00",
        description: "Lead mới cần liên hệ trong vòng 24h",
        assignedTo: "Chưa phân công",
        notes: [],
      },
    ],
    interactionStats: {
      calls: 0,
      messages: 0,
      emails: 0,
      meetings: 0,
    },
  },
  {
    id: "5",
    source: "Facebook",
    customer: {
      name: "Hoàng Văn Em",
      avatar: "https://i.pravatar.cc/150?img=5",
      phone: "0956789012",
      email: "hoangvanem@gmail.com",
      address: "654 Võ Văn Tần, Q3, TP.HCM",
      company: "Cửa hàng thời trang XYZ",
      demand: "Sửa chữa hàng loạt túi xách cũ",
      budget: 10000000,
    },
    status: "proposal",
    assignedTo: {
      name: "Sales Hương",
      avatar: "https://i.pravatar.cc/150?img=51",
    },
    createdAt: "2024-12-02 08:00",
    salesActivities: [
      {
        type: "call",
        date: "2024-12-02 09:00",
        staff: "Sales Hương",
        notes: "Khách có nhu cầu lớn, cần báo giá chi tiết",
        duration: 25,
      },
      {
        type: "email",
        date: "2024-12-02 14:00",
        staff: "Sales Hương",
        notes: "Gửi catalog và bảng giá theo số lượng",
      },
    ],
    quotations: [
      {
        id: "QT-005",
        date: "2024-12-03 10:00",
        amount: 9500000,
        items: [
          { product: "Vệ sinh túi xách", quantity: 20, price: 8000000 },
          { product: "Khâu vá nhỏ", quantity: 10, price: 1500000 },
        ],
        status: "sent",
        validUntil: "2024-12-10",
      },
    ],
    contracts: [],
    appointmentSchedules: [
      {
        id: "VS-005",
        date: "2024-12-04 10:00",
        purpose: "Họp bàn chi tiết dịch vụ cho đơn lớn",
        staff: "Sales Hương",
        status: "scheduled",
      },
    ],
    tickets: [
      {
        id: "TK-005",
        type: "appointment",
        priority: "high",
        status: "in_progress",
        createdDate: "2024-12-03 09:00",
        dueDate: "2024-12-04 10:00",
        description: "Chuẩn bị mẫu và báo giá chi tiết cho cuộc họp",
        assignedTo: "Sales Hương",
        notes: ["Đã chuẩn bị mẫu", "Cần confirm lại giờ họp"],
      },
    ],
    interactionStats: {
      calls: 2,
      messages: 4,
      emails: 1,
      meetings: 0,
    },
  },
];

const LeadDrawerWrapper: React.FC<PropRowDetails<Lead>> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  // Convert Lead format to match LeadDetailDrawer's expected format
  const statusMap: Record<string, string> = {
    new: "New",
    assigned: "Assigned",
    contacted: "Contacted",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    converted: "Converted",
    failed: "Failed",
  };

  const convertedLead = {
    ...data,
    key: data.id,
    id: parseInt(data.id) || 0,
    status: (statusMap[data.status] || "New") as
      | "New"
      | "Assigned"
      | "Contacted"
      | "Qualified"
      | "Proposal"
      | "Negotiation"
      | "Converted"
      | "Failed",
    visitSchedules: data.appointmentSchedules, // Convert back for drawer compatibility
  };

  return (
    <LeadDetailDrawer visible={true} onClose={onClose} lead={convertedLead} />
  );
};

const getSourceIcon = (source: string) => {
  switch (source) {
    case "Facebook":
      return <FacebookOutlined className="text-blue-600 text-lg" />;
    case "Zalo":
      return <span className="text-blue-500 text-lg font-bold">Z</span>;
    case "TikTok":
      return <span className="text-black text-lg font-bold">♪</span>;
    case "Direct":
      return <UserOutlined className="text-gray-600 text-lg" />;
    default:
      return null;
  }
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { color: string; text: string }> = {
    new: { color: "blue", text: "Mới" },
    assigned: { color: "orange", text: "Đã phân" },
    contacted: { color: "purple", text: "Đã liên hệ" },
    qualified: { color: "cyan", text: "Đủ điều kiện" },
    proposal: { color: "geekblue", text: "Đề xuất" },
    negotiation: { color: "gold", text: "Thương lượng" },
    converted: { color: "green", text: "Chốt đơn" },
    failed: { color: "red", text: "Thất bại" },
  };

  const config = statusConfig[status] || statusConfig.new;
  return <Tag color={config.color}>{config.text}</Tag>;
};

export default function LeadManagementCRM() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(mockLeads);
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(
    undefined
  );
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );

  const handleLeadAction = (leadId: string, action: string) => {
    const lead = filteredLeads.find((l) => l.id === leadId);
    if (!lead) return;

    switch (action) {
      case "view":
        message.info(`Xem chi tiết lead: ${lead.customer.name}`);
        break;
      case "interested":
        Modal.confirm({
          title: "Đánh dấu Lead quan tâm",
          content: `Bạn muốn đánh dấu lead "${lead.customer.name}" là Quan tâm?`,
          onOk: () => {
            message.success("Đã cập nhật trạng thái: Quan tâm");
            // Update lead status to qualified
          },
        });
        break;
      case "thinking":
        Modal.confirm({
          title: "Đánh dấu Lead đang suy nghĩ",
          content: `Bạn muốn đánh dấu lead "${lead.customer.name}" là Đang suy nghĩ?`,
          onOk: () => {
            message.success("Đã cập nhật trạng thái: Suy nghĩ");
            // Update lead status to negotiation
          },
        });
        break;
      case "close":
        Modal.confirm({
          title: "Chốt đơn hàng",
          content: `Xác nhận chốt đơn hàng cho lead "${lead.customer.name}"?`,
          okText: "Chốt & Tạo đơn",
          onOk: () => {
            message.success("Đã chốt! Chuyển sang tạo đơn hàng...");
            // Redirect to order creation page with lead data
            setTimeout(() => {
              window.location.href = `/order-create?leadId=${leadId}`;
            }, 1000);
          },
        });
        break;
      default:
        break;
    }
  };

  const getLeadActionMenu = (lead: Lead): MenuProps["items"] => [
    {
      key: "interested",
      label: "Quan tâm",
      icon: <CheckCircleOutlined className="text-green-600" />,
      onClick: () => handleLeadAction(lead.id, "interested"),
    },
    {
      key: "thinking",
      label: "Suy nghĩ",
      icon: <QuestionCircleOutlined className="text-orange-600" />,
      onClick: () => handleLeadAction(lead.id, "thinking"),
    },
    {
      key: "close",
      label: "Chốt",
      icon: <CheckCircleOutlined className="text-blue-600" />,
      onClick: () => handleLeadAction(lead.id, "close"),
    },
    {
      type: "divider",
    },
    {
      key: "create-order",
      label: "Tạo đơn hàng",
      icon: <ShoppingCartOutlined className="text-purple-600" />,
      onClick: () => {
        window.location.href = `/order-create?leadId=${lead.id}`;
      },
    },
  ];

  const handleSourceFilter = (value: string) => {
    setSourceFilter(value);
    applyFilters(value, statusFilter);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    applyFilters(sourceFilter, value);
  };

  const applyFilters = (source?: string, status?: string) => {
    let filtered = mockLeads;

    if (source) {
      filtered = filtered.filter((lead) => lead.source === source);
    }

    if (status) {
      filtered = filtered.filter((lead) => lead.status === status);
    }

    setFilteredLeads(filtered);
  };

  const handleBulkAssign = () => {
    console.log("Phân công leads:", selectedRowKeys);
    // Logic phân công hàng loạt
  };

  const handleTakeLead = (leadId: string) => {
    console.log("Nhận lead:", leadId);
    // Logic nhận lead
  };

  const columns: TableColumnsType<Lead> = [
    {
      title: "Nguồn",
      dataIndex: "source",
      key: "source",
      width: 140,
      render: (source: string) => (
        <div className="flex items-center gap-2">
          {getSourceIcon(source)}
          <span className="text-sm">{source}</span>
        </div>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      key: "customer",
      width: 220,
      render: (customer: Lead["customer"], record: Lead) => (
        <Dropdown
          menu={{ items: getLeadActionMenu(record) }}
          trigger={["click"]}
        >
          <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
            <Avatar src={customer.avatar} size={40} className="rounded-full" />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{customer.name}</span>
              <span className="text-gray-500 text-xs">{customer.phone}</span>
            </div>
          </div>
        </Dropdown>
      ),
    },
    {
      title: "Nhu cầu",
      dataIndex: ["customer", "demand"],
      key: "demand",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: "Hoạt động",
      key: "activities",
      width: 200,
      render: (_: unknown, record: Lead) => (
        <Space size="small">
          <Badge count={record.interactionStats.calls} showZero>
            <PhoneOutlined className="text-lg text-green-600" />
          </Badge>
          <Badge count={record.interactionStats.messages} showZero>
            <MessageOutlined className="text-lg text-blue-600" />
          </Badge>
          <Badge count={record.interactionStats.emails} showZero>
            <MailOutlined className="text-lg text-purple-600" />
          </Badge>
          <Badge count={record.tickets.length} showZero>
            <TagOutlined className="text-lg text-orange-600" />
          </Badge>
        </Space>
      ),
    },
    {
      title: "Phụ trách",
      dataIndex: "assignedTo",
      key: "assignedTo",
      width: 180,
      render: (assignedTo: Lead["assignedTo"], record: Lead) =>
        assignedTo ? (
          <div className="flex items-center gap-2">
            <Avatar src={assignedTo.avatar} size={32} />
            <span className="text-sm">{assignedTo.name}</span>
          </div>
        ) : (
          <Button
            size="small"
            onClick={() => handleTakeLead(record.id)}
            className="text-xs bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
          >
            Nhận Lead
          </Button>
        ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date: string) => (
        <span className="text-sm text-gray-600">{date}</span>
      ),
    },
  ];

  return (
    <WrapperContent
      isLoading={false}
      isRefetching={false}
      header={{
        searchInput: {
          placeholder: "Tìm theo tên hoặc SĐT",
          filterKeys: ["customer.name", "customer.phone"],
        },
        customToolbar: (
          <>
            <Select
              placeholder="Chọn nguồn"
              allowClear
              className="w-48"
              onChange={handleSourceFilter}
              options={[
                {
                  value: "Facebook",
                  label: (
                    <div className="flex items-center gap-2">
                      <FacebookOutlined className="text-blue-600" />
                      <span>Facebook</span>
                    </div>
                  ),
                },
                {
                  value: "Zalo",
                  label: (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500 font-bold">Z</span>
                      <span>Zalo</span>
                    </div>
                  ),
                },
                {
                  value: "TikTok",
                  label: (
                    <div className="flex items-center gap-2">
                      <span className="text-black font-bold">♪</span>
                      <span>TikTok</span>
                    </div>
                  ),
                },
                {
                  value: "Direct",
                  label: (
                    <div className="flex items-center gap-2">
                      <UserOutlined className="text-gray-600" />
                      <span>Direct</span>
                    </div>
                  ),
                },
              ]}
            />

            <Select
              placeholder="Chọn trạng thái"
              allowClear
              className="w-48"
              onChange={handleStatusFilter}
              options={[
                { value: "new", label: "Mới" },
                { value: "assigned", label: "Đã phân" },
                { value: "contacted", label: "Đã liên hệ" },
                { value: "qualified", label: "Đủ điều kiện" },
                { value: "proposal", label: "Đề xuất" },
                { value: "negotiation", label: "Thương lượng" },
                { value: "converted", label: "Chốt đơn" },
                { value: "failed", label: "Thất bại" },
              ]}
            />

            {selectedRowKeys.length > 0 && (
              <Button
                type="primary"
                icon={<TeamOutlined />}
                onClick={handleBulkAssign}
              >
                Phân công ({selectedRowKeys.length})
              </Button>
            )}
          </>
        ),
        buttonEnds: [
          {
            can: true,
            name: "Thêm Lead",
            icon: <PlusOutlined />,
            type: "primary",
            onClick: () => console.log("Thêm lead"),
          },
        ],
      }}
    >
      <CommonTable<Lead>
        loading={false}
        dataSource={filteredLeads}
        columns={columns}
        rank={true}
        paging={true}
        pagination={{
          current: 1,
          limit: 10,
          onChange: (page, pageSize) => {
            console.log("Page changed:", page, pageSize);
          },
        }}
        total={filteredLeads.length}
        DrawerDetails={LeadDrawerWrapper}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />
    </WrapperContent>
  );
}
