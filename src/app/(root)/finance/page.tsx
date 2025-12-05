"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  FileExcelOutlined,
  PlusOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";

const { Text } = Typography;

// Mock Data - Transactions
const transactionCategories = {
  income: [
    { id: "sales", name: "Doanh thu bán hàng", color: "green" },
    { id: "service", name: "Dịch vụ", color: "cyan" },
    { id: "investment", name: "Đầu tư", color: "blue" },
    { id: "other_income", name: "Thu nhập khác", color: "geekblue" },
  ],
  expense: [
    { id: "material", name: "Nguyên vật liệu", color: "red" },
    { id: "salary", name: "Lương nhân viên", color: "orange" },
    { id: "rent", name: "Thuê mặt bằng", color: "volcano" },
    { id: "utilities", name: "Điện nước", color: "magenta" },
    { id: "marketing", name: "Marketing", color: "purple" },
    { id: "transport", name: "Vận chuyển", color: "gold" },
    { id: "maintenance", name: "Bảo trì", color: "lime" },
    { id: "other_expense", name: "Chi phí khác", color: "default" },
  ],
};

const paymentMethods = [
  { id: "cash", name: "Tiền mặt", icon: "💵" },
  { id: "bank", name: "Chuyển khoản", icon: "🏦" },
  { id: "card", name: "Thẻ", icon: "💳" },
  { id: "ewallet", name: "Ví điện tử", icon: "📱" },
];

const mockTransactions = [
  {
    id: 1,
    date: "2024-12-03",
    type: "income",
    category: "sales",
    amount: 50000000,
    description: "Thanh toán đơn hàng #DH001",
    paymentMethod: "bank",
    reference: "DH001",
    customer: "Công ty TNHH ABC",
    createdBy: {
      name: "Nguyễn Hà",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    status: "completed",
    notes: "Đã nhận đủ thanh toán",
  },
  {
    id: 2,
    date: "2024-12-03",
    type: "expense",
    category: "material",
    amount: 15000000,
    description: "Mua vải cotton cao cấp",
    paymentMethod: "bank",
    reference: "PO001",
    supplier: "Nhà cung cấp Vải Việt",
    createdBy: {
      name: "Trần Minh",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    status: "completed",
    notes: "Đã nhận hàng đầy đủ",
  },
  {
    id: 3,
    date: "2024-12-02",
    type: "expense",
    category: "salary",
    amount: 35000000,
    description: "Lương tháng 11/2024",
    paymentMethod: "bank",
    reference: "SAL-11/2024",
    createdBy: {
      name: "Lê Tú",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    status: "completed",
    notes: "Đã chuyển lương cho 25 nhân viên",
  },
  {
    id: 4,
    date: "2024-12-02",
    type: "income",
    category: "service",
    amount: 8000000,
    description: "Dịch vụ gia công",
    paymentMethod: "cash",
    reference: "SV001",
    customer: "Xưởng May Hòa Bình",
    createdBy: {
      name: "Nguyễn Hà",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    status: "completed",
    notes: "",
  },
  {
    id: 5,
    date: "2024-12-01",
    type: "expense",
    category: "rent",
    amount: 20000000,
    description: "Tiền thuê xưởng tháng 12/2024",
    paymentMethod: "bank",
    reference: "RENT-12/2024",
    supplier: "Chủ nhà",
    createdBy: {
      name: "Trần Minh",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    status: "completed",
    notes: "Đã thanh toán đầy đủ",
  },
  {
    id: 6,
    date: "2024-12-01",
    type: "expense",
    category: "utilities",
    amount: 5500000,
    description: "Tiền điện + nước tháng 11/2024",
    paymentMethod: "bank",
    reference: "UTIL-11/2024",
    createdBy: {
      name: "Lê Tú",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    status: "completed",
    notes: "",
  },
  {
    id: 7,
    date: "2024-11-30",
    type: "income",
    category: "sales",
    amount: 65000000,
    description: "Thanh toán đơn hàng #DH002",
    paymentMethod: "bank",
    reference: "DH002",
    customer: "Xưởng May Tiến Phát",
    createdBy: {
      name: "Nguyễn Hà",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    status: "completed",
    notes: "Thanh toán đợt 2/2",
  },
  {
    id: 8,
    date: "2024-11-29",
    type: "expense",
    category: "marketing",
    amount: 3000000,
    description: "Quảng cáo Facebook Ads",
    paymentMethod: "card",
    reference: "MKT-11/2024",
    createdBy: {
      name: "Trần Minh",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    status: "completed",
    notes: "Chiến dịch tháng 11",
  },
  {
    id: 9,
    date: "2024-11-28",
    type: "expense",
    category: "transport",
    amount: 2500000,
    description: "Chi phí vận chuyển hàng",
    paymentMethod: "cash",
    reference: "SHIP-001",
    createdBy: {
      name: "Lê Tú",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    status: "completed",
    notes: "Giao hàng đến Đà Nẵng",
  },
  {
    id: 10,
    date: "2024-11-27",
    type: "expense",
    category: "maintenance",
    amount: 4000000,
    description: "Bảo trì máy móc",
    paymentMethod: "bank",
    reference: "MAINT-001",
    supplier: "Công ty Bảo trì ABC",
    createdBy: {
      name: "Trần Minh",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    status: "completed",
    notes: "Bảo trì định kỳ quý 4",
  },
  {
    id: 11,
    date: "2024-12-03",
    type: "income",
    category: "sales",
    amount: 25000000,
    description: "Đặt cọc đơn hàng #DH003",
    paymentMethod: "bank",
    reference: "DH003",
    customer: "May Mặc Thành Đạt",
    createdBy: {
      name: "Nguyễn Hà",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    status: "pending",
    notes: "Chờ xác nhận chuyển khoản",
  },
];

interface Transaction {
  id: number;
  date: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  reference: string;
  customer?: string;
  supplier?: string;
  createdBy: {
    name: string;
    avatar: string;
  };
  status: "completed" | "pending" | "cancelled";
  notes: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

const getCategoryInfo = (type: string, categoryId: string) => {
  const categories =
    type === "income"
      ? transactionCategories.income
      : transactionCategories.expense;
  return categories.find((c) => c.id === categoryId);
};

const getPaymentMethodInfo = (methodId: string) => {
  return paymentMethods.find((m) => m.id === methodId);
};

// Transaction Detail Drawer
const TransactionDetailDrawer: React.FC<PropRowDetails<Transaction>> = ({
  data,
}) => {
  if (!data) return null;

  const categoryInfo = getCategoryInfo(data.type, data.category);
  const paymentInfo = getPaymentMethodInfo(data.paymentMethod);

  return (
    <div>
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Ngày giao dịch">
          {dayjs(data.date).format("DD/MM/YYYY")}
        </Descriptions.Item>
        <Descriptions.Item label="Loại">
          <Tag
            icon={
              data.type === "income" ? (
                <ArrowUpOutlined />
              ) : (
                <ArrowDownOutlined />
              )
            }
            color={data.type === "income" ? "green" : "red"}
          >
            {data.type === "income" ? "Thu" : "Chi"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Danh mục">
          <Tag color={categoryInfo?.color}>{categoryInfo?.name}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Số tiền">
          <Text
            strong
            className={`text-lg ${
              data.type === "income" ? "text-green-600" : "text-red-600"
            }`}
          >
            {data.type === "income" ? "+" : "-"}
            {formatCurrency(data.amount)}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">
          <Text strong>{data.description}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Phương thức">
          <Tag>
            {paymentInfo?.icon} {paymentInfo?.name}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Mã tham chiếu">
          <Text copyable>{data.reference}</Text>
        </Descriptions.Item>
        {data.customer && (
          <Descriptions.Item label="Khách hàng">
            {data.customer}
          </Descriptions.Item>
        )}
        {data.supplier && (
          <Descriptions.Item label="Nhà cung cấp">
            {data.supplier}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Trạng thái">
          <Badge
            status={
              data.status === "completed"
                ? "success"
                : data.status === "pending"
                ? "warning"
                : "error"
            }
            text={
              data.status === "completed"
                ? "Hoàn thành"
                : data.status === "pending"
                ? "Đang chờ"
                : "Đã hủy"
            }
          />
        </Descriptions.Item>
        <Descriptions.Item label="Người tạo">
          <Space>
            <Avatar src={data.createdBy.avatar} size="small" />
            {data.createdBy.name}
          </Space>
        </Descriptions.Item>
        {data.notes && (
          <Descriptions.Item label="Ghi chú">{data.notes}</Descriptions.Item>
        )}
      </Descriptions>

      <Space className="mt-4 w-full justify-end">
        <Button type="primary" icon={<EditOutlined />}>
          Chỉnh sửa
        </Button>
        <Button danger icon={<DeleteOutlined />}>
          Xóa
        </Button>
      </Space>
    </div>
  );
};

// Main Component
export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>(
    mockTransactions as Transaction[]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const {
    query,
    pagination,
    updateQueries,
    reset,
    applyFilter,
    handlePageChange,
  } = useFilter();

  // Calculate summary
  const filteredTransactions = applyFilter(transactions);
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Handle add transaction
  const handleAddTransaction = async () => {
    try {
      const values = await form.validateFields();
      const newTransaction: Transaction = {
        id: transactions.length + 1,
        date: values.date.format("YYYY-MM-DD"),
        type: values.type,
        category: values.category,
        amount: values.amount,
        description: values.description,
        paymentMethod: values.paymentMethod,
        reference: values.reference,
        customer: values.customer,
        supplier: values.supplier,
        createdBy: {
          name: "Người dùng hiện tại",
          avatar: "https://i.pravatar.cc/150?img=4",
        },
        status: "completed",
        notes: values.notes || "",
      };

      setTransactions([newTransaction, ...transactions]);
      message.success("Thêm giao dịch thành công!");
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  // Watch type field to filter categories
  const transactionType = Form.useWatch("type", form);

  // Filter fields configuration
  const filterFields = [
    {
      name: "type",
      key: "type",
      label: "Loại",
      type: "select" as const,
      options: [
        { label: "Thu", value: "income" },
        { label: "Chi", value: "expense" },
      ],
    },
    {
      name: "category",
      key: "category",
      label: "Danh mục",
      type: "select" as const,
      options: [
        ...transactionCategories.income.map((c) => ({
          label: `📈 ${c.name}`,
          value: c.id,
        })),
        ...transactionCategories.expense.map((c) => ({
          label: `📉 ${c.name}`,
          value: c.id,
        })),
      ],
    },
    {
      name: "paymentMethod",
      key: "paymentMethod",
      label: "Phương thức",
      type: "select" as const,
      options: paymentMethods.map((m) => ({
        label: `${m.icon} ${m.name}`,
        value: m.id,
      })),
    },
    {
      name: "status",
      key: "status",
      label: "Trạng thái",
      type: "select" as const,
      options: [
        { label: "Hoàn thành", value: "completed" },
        { label: "Đang chờ", value: "pending" },
        { label: "Đã hủy", value: "cancelled" },
      ],
    },
  ];

  // Table columns
  const columns: TableColumnsType<Transaction> = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 120,
      fixed: "left",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 100,
      fixed: "left",
      render: (type: string) => (
        <Tag
          icon={type === "income" ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          color={type === "income" ? "green" : "red"}
        >
          {type === "income" ? "Thu" : "Chi"}
        </Tag>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      width: 160,
      render: (category: string, record: Transaction) => {
        const categoryInfo = getCategoryInfo(record.type, category);
        return <Tag color={categoryInfo?.color}>{categoryInfo?.name}</Tag>;
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 250,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      align: "left",
      render: (amount: number, record: Transaction) => (
        <Text
          strong
          className={
            record.type === "income" ? "text-green-600" : "text-red-600"
          }
        >
          {record.type === "income" ? "+" : "-"}
          {formatCurrency(amount)}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Phương thức",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 140,
      render: (method: string) => {
        const methodInfo = getPaymentMethodInfo(method);
        return (
          <Tag>
            {methodInfo?.icon} {methodInfo?.name}
          </Tag>
        );
      },
    },
    {
      title: "Mã tham chiếu",
      dataIndex: "reference",
      key: "reference",
      width: 140,
    },
    {
      title: "Đối tác",
      key: "partner",
      width: 180,
      render: (_: unknown, record: Transaction) =>
        record.customer || record.supplier || "-",
    },
    {
      title: "Người tạo",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 140,
      render: (createdBy: Transaction["createdBy"]) => (
        <Space>
          <Avatar src={createdBy.avatar} size="small" />
          <Text>{createdBy.name}</Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      fixed: "right",
      render: (status: string) => (
        <Badge
          status={
            status === "completed"
              ? "success"
              : status === "pending"
              ? "warning"
              : "error"
          }
          text={
            status === "completed"
              ? "Hoàn thành"
              : status === "pending"
              ? "Đang chờ"
              : "Đã hủy"
          }
        />
      ),
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm giao dịch...",
          filterKeys: ["description", "reference", "customer", "supplier"],
        },
        filters: {
          fields: filterFields,
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
        buttonEnds: [
          {
            name: "Nhập Excel",
            icon: <FileExcelOutlined />,
            onClick: () => console.log("Import"),
          },
          {
            name: "Xuất Excel",
            icon: <FileExcelOutlined />,
            onClick: () => console.log("Export"),
          },
          {
            name: "Thêm giao dịch",
            icon: <PlusOutlined />,
            type: "primary",
            onClick: () => setIsModalOpen(true),
          },
        ],
      }}
      isEmpty={filteredTransactions.length === 0}
    >
      {/* Summary Cards */}
      <div className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm">
              <Statistic
                title="Tổng thu"
                value={totalIncome}
                precision={0}
                prefix={<ArrowUpOutlined />}
                suffix="đ"
                styles={{
                  content: { color: "#52c41a" },
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm">
              <Statistic
                title="Tổng chi"
                value={totalExpense}
                precision={0}
                prefix={<ArrowDownOutlined />}
                suffix="đ"
                styles={{
                  content: { color: "#ff4d4f" },
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm">
              <Statistic
                title="Lợi nhuận"
                value={balance}
                precision={0}
                prefix={<WalletOutlined />}
                suffix="đ"
                styles={{
                  content: { color: balance >= 0 ? "#1890ff" : "#ff4d4f" },
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm">
              <Statistic
                title="Giao dịch"
                value={filteredTransactions.length}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Table */}
      <CommonTable<Transaction>
        columns={columns}
        dataSource={filteredTransactions}
        loading={false}
        pagination={{ ...pagination, onChange: handlePageChange }}
        paging={true}
        rank={true}
        DrawerDetails={TransactionDetailDrawer}
      />

      {/* Add Transaction Modal */}
      <Modal
        title="Thêm giao dịch mới"
        open={isModalOpen}
        onOk={handleAddTransaction}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        width={700}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            date: dayjs(),
            type: "income",
            status: "completed",
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Loại giao dịch"
                rules={[{ required: true, message: "Vui lòng chọn loại!" }]}
              >
                <Select placeholder="Chọn loại">
                  <Select.Option value="income">
                    <Tag color="green">Thu</Tag>
                  </Select.Option>
                  <Select.Option value="expense">
                    <Tag color="red">Chi</Tag>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Ngày giao dịch"
                rules={[{ required: true, message: "Vui lòng chọn ngày!" }]}
              >
                <DatePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Danh mục"
                rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
              >
                <Select placeholder="Chọn danh mục">
                  {transactionType === "income"
                    ? transactionCategories.income.map((cat) => (
                        <Select.Option key={cat.id} value={cat.id}>
                          {cat.name}
                        </Select.Option>
                      ))
                    : transactionCategories.expense.map((cat) => (
                        <Select.Option key={cat.id} value={cat.id}>
                          {cat.name}
                        </Select.Option>
                      ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Số tiền"
                rules={[
                  { required: true, message: "Vui lòng nhập số tiền!" },
                  {
                    type: "number",
                    min: 0,
                    message: "Số tiền phải lớn hơn 0!",
                  },
                ]}
              >
                <InputNumber
                  className="w-full"
                  placeholder="Nhập số tiền"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                  suffix="đ"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
          >
            <Input placeholder="Nhập mô tả giao dịch" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Phương thức thanh toán"
                rules={[
                  { required: true, message: "Vui lòng chọn phương thức!" },
                ]}
              >
                <Select placeholder="Chọn phương thức">
                  {paymentMethods.map((method) => (
                    <Select.Option key={method.id} value={method.id}>
                      {method.icon} {method.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reference"
                label="Mã tham chiếu"
                rules={[{ required: true, message: "Vui lòng nhập mã!" }]}
              >
                <Input placeholder="Nhập mã tham chiếu" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("type") === "income" ? (
                <Form.Item name="customer" label="Khách hàng">
                  <Input placeholder="Nhập tên khách hàng" />
                </Form.Item>
              ) : (
                <Form.Item name="supplier" label="Nhà cung cấp">
                  <Input placeholder="Nhập tên nhà cung cấp" />
                </Form.Item>
              )
            }
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea
              rows={3}
              placeholder="Nhập ghi chú (không bắt buộc)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </WrapperContent>
  );
}
