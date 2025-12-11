"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import { useAuth } from "@/firebase/hooks/useAuth";
import { useRealtimeValue } from "@/firebase/hooks/useRealtime";
import useFilter from "@/hooks/useFilter";
import { FinanceService } from "@/services/financeService";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarOutlined,
  FileExcelOutlined,
  PlusOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  App,
  Avatar,
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
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

const { Text } = Typography;

// Transaction categories
const transactionCategories = {
  inventory: { id: "inventory", name: "Kho", color: "blue" },
  order: { id: "order", name: "Đơn hàng", color: "green" },
  salary: { id: "salary", name: "Lương", color: "orange" },
};

// Finance Transaction interface
interface FinanceTransaction {
  id: string;
  date: number; // Timestamp
  type: "income" | "expense";
  category: "inventory" | "order" | "salary";
  amount: number;
  description: string;
  reference: string; // Order code, transaction ID, etc.
  sourceId?: string; // ID của order, transaction, refund, etc.
  sourceType?: "order" | "inventory" | "refund" | "manual"; // Nguồn gốc
  createdBy?: string;
  createdByName?: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  isManual?: boolean; // Đánh dấu là tạo thủ công
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

const getCategoryInfo = (categoryId: string) => {
  return transactionCategories[
    categoryId as keyof typeof transactionCategories
  ];
};

// Transaction Detail Drawer
const TransactionDetailDrawer: React.FC<PropRowDetails<FinanceTransaction>> = ({
  data,
}) => {
  if (!data) return null;

  const categoryInfo = getCategoryInfo(data.category);

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
        <Descriptions.Item label="Mã tham chiếu">
          <Text copyable>{data.reference}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Nguồn">
          <Tag>
            {data.sourceType === "order"
              ? "Đơn hàng"
              : data.sourceType === "inventory"
              ? "Phiếu nhập kho"
              : data.sourceType === "refund"
              ? "Hoàn tiền"
              : data.isManual
              ? "Tạo thủ công"
              : "Tự động"}
          </Tag>
        </Descriptions.Item>
        {data.createdByName && (
          <Descriptions.Item label="Người tạo">
            <Space>
              <Avatar size="small">{data.createdByName.charAt(0)}</Avatar>
              {data.createdByName}
            </Space>
          </Descriptions.Item>
        )}
        {data.notes && (
          <Descriptions.Item label="Ghi chú">{data.notes}</Descriptions.Item>
        )}
      </Descriptions>
    </div>
  );
};

// Main Component
export default function FinancePage() {
  const { user } = useAuth();
  const { message: antdMessage } = App.useApp();
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

  // Load finance transactions from Firebase (tất cả transactions đã được tạo tự động hoặc thủ công)
  const { data: financeTransactionsData } = useRealtimeValue<{
    [key: string]: FinanceTransaction;
  }>("xoxo/finance/transactions");

  // Transform data to FinanceTransaction format
  const transactions = useMemo(() => {
    const allTransactions: FinanceTransaction[] = [];

    // Lấy tất cả finance transactions đã được tạo (tự động hoặc thủ công)
    if (financeTransactionsData) {
      Object.entries(financeTransactionsData).forEach(
        ([transactionId, transaction]) => {
          allTransactions.push({
            ...transaction,
            id: transactionId,
          });
        }
      );
    }

    // Sort by date descending
    return allTransactions.sort((a, b) => b.date - a.date);
  }, [financeTransactionsData]);

  // Calculate summary
  const filteredTransactions = applyFilter(transactions);
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Handle add manual transaction
  const handleAddTransaction = async () => {
    try {
      const values = await form.validateFields();

      if (!user?.uid) {
        antdMessage.error("Vui lòng đăng nhập để tạo giao dịch!");
        return;
      }

      await FinanceService.createManualTransaction(
        {
          date: values.date.valueOf(),
          type: values.type,
          category: values.category,
          amount: values.amount,
          description: values.description,
          reference: values.reference || `MANUAL_${Date.now()}`,
          sourceType: "manual",
          notes: values.notes || "",
        },
        user.uid,
        user.displayName || user.email || "Người dùng hiện tại"
      );

      antdMessage.success("Thêm giao dịch thành công!");
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
      antdMessage.error("Không thể tạo giao dịch. Vui lòng thử lại!");
    }
  };

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
        { label: "Kho", value: "inventory" },
        { label: "Đơn hàng", value: "order" },
        { label: "Lương", value: "salary" },
      ],
    },
  ];

  // Table columns
  const columns: TableColumnsType<FinanceTransaction> = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 120,
      fixed: "left",
      render: (date: number) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a, b) => a.date - b.date,
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
      width: 120,
      render: (category: string) => {
        const categoryInfo = getCategoryInfo(category);
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
      render: (amount: number, record: FinanceTransaction) => (
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
      title: "Mã tham chiếu",
      dataIndex: "reference",
      key: "reference",
      width: 140,
    },
    {
      title: "Nguồn",
      key: "source",
      width: 120,
      render: (_: unknown, record: FinanceTransaction) => (
        <Tag>
          {record.isManual
            ? "Tạo thủ công"
            : record.sourceType === "order"
            ? "Đơn hàng"
            : record.sourceType === "inventory"
            ? "Phiếu nhập kho"
            : record.sourceType === "refund"
            ? "Hoàn tiền"
            : "Tự động"}
        </Tag>
      ),
    },
    {
      title: "Người tạo",
      dataIndex: "createdByName",
      key: "createdByName",
      width: 140,
      render: (name: string, record: FinanceTransaction) =>
        name ? (
          <Space>
            <Avatar size="small">{name.charAt(0)}</Avatar>
            <Text>{name}</Text>
          </Space>
        ) : (
          "-"
        ),
    },
  ];

  // Watch type field to filter categories
  const transactionType = Form.useWatch("type", form);

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm giao dịch...",
          filterKeys: ["description", "reference"],
        },
        filters: {
          fields: filterFields,
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
        buttonEnds: [
          {
            can: true,
            name: "Xuất Excel",
            icon: <FileExcelOutlined />,
            onClick: () => console.log("Export"),
          },
          {
            can: true,
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
      <CommonTable<FinanceTransaction>
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
            type: "expense",
            category: "salary",
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
                  {Object.values(transactionCategories).map((cat) => (
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

          <Form.Item name="reference" label="Mã tham chiếu">
            <Input placeholder="Nhập mã tham chiếu (tùy chọn)" />
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
