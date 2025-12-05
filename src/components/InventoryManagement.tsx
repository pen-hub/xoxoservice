"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import {
  DeleteOutlined,
  EditOutlined,
  FileExcelOutlined,
  MinusOutlined,
  PlusOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
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
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";

const { Text } = Typography;

interface Material {
  key: string;
  id: number;
  name: string;
  category: string;
  stockQuantity: number;
  unit: string;
  minThreshold: number;
  expiryDate: string;
  maxCapacity: number;
  warehouse?: string;
  supplier?: string;
  lastUpdated?: string;
}

const mockMaterials: Material[] = [
  {
    key: "1",
    id: 1,
    name: "Da bò loại A",
    category: "Da bò",
    stockQuantity: 15,
    unit: "m²",
    minThreshold: 50,
    maxCapacity: 200,
    expiryDate: "2025-12-31",
    warehouse: "Kho A",
    supplier: "Công ty TNHH Da Việt",
    lastUpdated: "2024-12-01",
  },
  {
    key: "2",
    id: 2,
    name: "Da bò loại B",
    category: "Da bò",
    stockQuantity: 120,
    unit: "m²",
    minThreshold: 30,
    maxCapacity: 150,
    expiryDate: "2026-06-15",
    warehouse: "Kho A",
    supplier: "Công ty TNHH Da Việt",
    lastUpdated: "2024-11-28",
  },
  {
    key: "3",
    id: 3,
    name: "Chỉ may polyester",
    category: "Chỉ may",
    stockQuantity: 5,
    unit: "cuộn",
    minThreshold: 20,
    maxCapacity: 100,
    expiryDate: "2027-01-20",
    warehouse: "Kho B",
    supplier: "Nhà máy Chỉ may Hà Nội",
    lastUpdated: "2024-12-02",
  },
  {
    key: "4",
    id: 4,
    name: "Chỉ may cotton",
    category: "Chỉ may",
    stockQuantity: 85,
    unit: "cuộn",
    minThreshold: 25,
    maxCapacity: 120,
    expiryDate: "2026-08-10",
    warehouse: "Kho B",
    supplier: "Nhà máy Chỉ may Hà Nội",
    lastUpdated: "2024-11-30",
  },
  {
    key: "5",
    id: 5,
    name: "Xi mạ vàng",
    category: "Xi mạ",
    stockQuantity: 8,
    unit: "lít",
    minThreshold: 10,
    maxCapacity: 50,
    expiryDate: "2024-11-20",
    warehouse: "Kho C",
    supplier: "Công ty Hóa chất ABC",
    lastUpdated: "2024-11-25",
  },
  {
    key: "6",
    id: 6,
    name: "Xi mạ bạc",
    category: "Xi mạ",
    stockQuantity: 35,
    unit: "lít",
    minThreshold: 15,
    maxCapacity: 60,
    expiryDate: "2025-12-25",
    warehouse: "Kho C",
    supplier: "Công ty Hóa chất ABC",
    lastUpdated: "2024-12-01",
  },
  {
    key: "7",
    id: 7,
    name: "Dung dịch tẩy đa năng",
    category: "Dung dịch tẩy",
    stockQuantity: 3,
    unit: "lít",
    minThreshold: 12,
    maxCapacity: 40,
    expiryDate: "2025-01-15",
    warehouse: "Kho C",
    supplier: "Công ty Hóa chất ABC",
    lastUpdated: "2024-11-29",
  },
  {
    key: "8",
    id: 8,
    name: "Dung dịch tẩy chuyên dụng",
    category: "Dung dịch tẩy",
    stockQuantity: 28,
    unit: "lít",
    minThreshold: 10,
    maxCapacity: 45,
    expiryDate: "2026-03-30",
    warehouse: "Kho C",
    supplier: "Công ty Hóa chất ABC",
    lastUpdated: "2024-12-02",
  },
  {
    key: "9",
    id: 9,
    name: "Da bò loại C",
    category: "Da bò",
    stockQuantity: 45,
    unit: "m²",
    minThreshold: 40,
    maxCapacity: 180,
    expiryDate: "2024-12-10",
    warehouse: "Kho A",
    supplier: "Công ty TNHH Da Việt",
    lastUpdated: "2024-11-27",
  },
  {
    key: "10",
    id: 10,
    name: "Chỉ may nylon",
    category: "Chỉ may",
    stockQuantity: 92,
    unit: "cuộn",
    minThreshold: 30,
    maxCapacity: 150,
    expiryDate: "2026-11-05",
    warehouse: "Kho B",
    supplier: "Nhà máy Chỉ may Hà Nội",
    lastUpdated: "2024-12-03",
  },
];

const getDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const isExpired = (expiryDate: string): boolean => {
  return getDaysUntilExpiry(expiryDate) < 0;
};

const isExpiringSoon = (expiryDate: string): boolean => {
  const days = getDaysUntilExpiry(expiryDate);
  return days >= 0 && days < 30;
};

// Material Detail Drawer
const MaterialDetailDrawer: React.FC<PropRowDetails<Material>> = ({ data }) => {
  if (!data) return null;

  const isLowStock = data.stockQuantity < data.minThreshold;
  const expired = isExpired(data.expiryDate);
  const expiringSoon = isExpiringSoon(data.expiryDate);
  const daysLeft = getDaysUntilExpiry(data.expiryDate);

  return (
    <div>
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Mã NVL">
          <Text strong className="font-mono">
            NVL-{data.id.toString().padStart(3, "0")}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Tên vật liệu">
          <Text strong>{data.name}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Danh mục">
          <Tag color={getCategoryColor(data.category)}>{data.category}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Kho">
          {data.warehouse || "Chưa phân kho"}
        </Descriptions.Item>
        <Descriptions.Item label="Nhà cung cấp">
          {data.supplier || "Chưa có thông tin"}
        </Descriptions.Item>
        <Descriptions.Item label="Đơn vị">{data.unit}</Descriptions.Item>
        <Descriptions.Item label="Tồn kho hiện tại">
          <Space vertical size="small" className="w-full">
            <Text
              strong
              className={`text-lg ${isLowStock ? "text-red-600" : ""}`}
            >
              {isLowStock && <WarningOutlined className="mr-2" />}
              {data.stockQuantity} {data.unit}
            </Text>
            <Progress
              percent={Math.round(
                (data.stockQuantity / data.maxCapacity) * 100
              )}
              status={isLowStock ? "exception" : "normal"}
            />
            <Text className="text-xs text-gray-500">
              Mức tối thiểu: {data.minThreshold} {data.unit} / Tối đa:{" "}
              {data.maxCapacity} {data.unit}
            </Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Hạn sử dụng">
          <Space vertical size={0}>
            <Text
              className={
                expired
                  ? "text-red-600 line-through"
                  : expiringSoon
                  ? "text-orange-600"
                  : ""
              }
            >
              {dayjs(data.expiryDate).format("DD/MM/YYYY")}
            </Text>
            {expired && (
              <Badge status="error" text="Đã hết hạn" className="text-xs" />
            )}
            {expiringSoon && !expired && (
              <Badge
                status="warning"
                text={`Còn ${daysLeft} ngày`}
                className="text-xs"
              />
            )}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Cập nhật lần cuối">
          {data.lastUpdated
            ? dayjs(data.lastUpdated).format("DD/MM/YYYY")
            : "Chưa cập nhật"}
        </Descriptions.Item>
      </Descriptions>

      <Space className="mt-4 w-full justify-end">
        <Button icon={<MinusOutlined />}>Xuất kho</Button>
        <Button type="primary" icon={<PlusOutlined />}>
          Nhập kho
        </Button>
        <Button type="default" icon={<EditOutlined />}>
          Chỉnh sửa
        </Button>
        <Button danger icon={<DeleteOutlined />}>
          Xóa
        </Button>
      </Space>
    </div>
  );
};

const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    "Da bò": "blue",
    "Chỉ may": "green",
    "Xi mạ": "purple",
    "Dung dịch tẩy": "orange",
  };
  return colorMap[category] || "default";
};

export default function InventoryManagement() {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [importForm] = Form.useForm();
  const [exportForm] = Form.useForm();

  const {
    query,
    pagination,
    updateQueries,
    reset,
    applyFilter,
    handlePageChange,
  } = useFilter();

  const filteredMaterials = applyFilter(materials);

  // Statistics
  // Handle import
  const handleImport = async () => {
    try {
      const values = await importForm.validateFields();
      const materialIndex = materials.findIndex(
        (m) => m.id === values.materialId
      );

      if (materialIndex !== -1) {
        const updatedMaterials = [...materials];
        updatedMaterials[materialIndex] = {
          ...updatedMaterials[materialIndex],
          stockQuantity:
            updatedMaterials[materialIndex].stockQuantity + values.quantity,
          lastUpdated: new Date().toISOString().split("T")[0],
        };
        setMaterials(updatedMaterials);
        message.success(
          `Đã nhập ${values.quantity} ${updatedMaterials[materialIndex].unit} ${updatedMaterials[materialIndex].name}`
        );
        setIsImportModalOpen(false);
        importForm.resetFields();
      }
    } catch (error) {
      console.error("Import validation failed:", error);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const values = await exportForm.validateFields();
      const materialIndex = materials.findIndex(
        (m) => m.id === values.materialId
      );

      if (materialIndex !== -1) {
        const material = materials[materialIndex];
        if (material.stockQuantity >= values.quantity) {
          const updatedMaterials = [...materials];
          updatedMaterials[materialIndex] = {
            ...updatedMaterials[materialIndex],
            stockQuantity:
              updatedMaterials[materialIndex].stockQuantity - values.quantity,
            lastUpdated: new Date().toISOString().split("T")[0],
          };
          setMaterials(updatedMaterials);
          message.success(
            `Đã xuất ${values.quantity} ${material.unit} ${material.name}`
          );
          setIsExportModalOpen(false);
          exportForm.resetFields();
        } else {
          message.error("Số lượng xuất vượt quá tồn kho!");
        }
      }
    } catch (error) {
      console.error("Export validation failed:", error);
    }
  };

  // Filter fields
  const filterFields = [
    {
      name: "category",
      label: "Danh mục",
      type: "select" as const,
      options: [
        { label: "Da bò", value: "Da bò" },
        { label: "Chỉ may", value: "Chỉ may" },
        { label: "Xi mạ", value: "Xi mạ" },
        { label: "Dung dịch tẩy", value: "Dung dịch tẩy" },
      ],
    },
    {
      name: "warehouse",
      label: "Kho",
      type: "select" as const,
      options: [
        { label: "Kho A", value: "Kho A" },
        { label: "Kho B", value: "Kho B" },
        { label: "Kho C", value: "Kho C" },
      ],
    },
    {
      name: "unit",
      label: "Đơn vị",
      type: "select" as const,
      options: [
        { label: "m²", value: "m²" },
        { label: "cuộn", value: "cuộn" },
        { label: "lít", value: "lít" },
      ],
    },
  ];

  // Tính toán thống kê
  const lowStockCount = materials.filter(
    (m) => m.stockQuantity < m.minThreshold
  ).length;
  const expiredCount = materials.filter((m) => isExpired(m.expiryDate)).length;
  const expiringSoonCount = materials.filter((m) =>
    isExpiringSoon(m.expiryDate)
  ).length;

  const updatedColumns: TableColumnsType<Material> = [
    {
      title: "Mã NVL",
      dataIndex: "id",
      key: "id",
      width: 120,
      fixed: "left",
      render: (id: number) => (
        <Text strong className="font-mono">
          NVL-{id.toString().padStart(3, "0")}
        </Text>
      ),
    },
    {
      title: "Tên vật liệu",
      dataIndex: "name",
      key: "name",
      width: 200,
      fixed: "left",
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>{category}</Tag>
      ),
    },
    {
      title: "Kho",
      dataIndex: "warehouse",
      key: "warehouse",
      width: 120,
      render: (warehouse?: string) => warehouse || "-",
    },
    {
      title: "Tồn kho",
      dataIndex: "stockQuantity",
      key: "stock",
      width: 250,
      render: (_: unknown, record: Material) => {
        const isLowStock = record.stockQuantity < record.minThreshold;
        return (
          <Space vertical size="small" className="w-full">
            <Text strong className={isLowStock ? "text-red-600" : ""}>
              {isLowStock && <WarningOutlined className="mr-1" />}
              {record.stockQuantity} {record.unit}
            </Text>
            <Progress
              percent={Math.round(
                (record.stockQuantity / record.maxCapacity) * 100
              )}
              status={isLowStock ? "exception" : "normal"}
              size="small"
            />
          </Space>
        );
      },
    },
    {
      title: "Hạn sử dụng",
      dataIndex: "expiryDate",
      key: "expiryDate",
      width: 150,
      render: (expiryDate: string) => {
        const expired = isExpired(expiryDate);
        const expiringSoon = isExpiringSoon(expiryDate);
        const daysLeft = getDaysUntilExpiry(expiryDate);

        return (
          <Tooltip
            title={
              expired
                ? "Đã hết hạn"
                : expiringSoon
                ? `Còn ${daysLeft} ngày`
                : null
            }
          >
            <Text
              className={
                expired
                  ? "text-red-600 line-through"
                  : expiringSoon
                  ? "text-orange-600"
                  : ""
              }
            >
              {dayjs(expiryDate).format("DD/MM/YYYY")}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_: unknown, record: Material) => (
        <Space size="small">
          <Tooltip title="Nhập kho">
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                importForm.setFieldsValue({ materialId: record.id });
                setIsImportModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xuất kho">
            <Button
              size="small"
              icon={<MinusOutlined />}
              onClick={() => {
                exportForm.setFieldsValue({ materialId: record.id });
                setIsExportModalOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm vật liệu...",
          filterKeys: ["name", "category", "warehouse", "supplier"],
        },
        filters: {
          fields: filterFields,
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
        buttonEnds: [
          {
            name: "Export Excel",
            icon: <FileExcelOutlined />,
            onClick: () => console.log("Export Excel"),
          },
          {
            name: "Nhập kho",
            icon: <PlusOutlined />,
            onClick: () => setIsImportModalOpen(true),
          },
          {
            name: "Xuất kho",
            icon: <MinusOutlined />,
            onClick: () => setIsExportModalOpen(true),
          },
        ],
      }}
      isEmpty={!filteredMaterials?.length}
    >
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng vật liệu"
              value={materials.length}
              suffix="loại"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Cảnh báo tồn thấp"
              value={lowStockCount}
              styles={{
                content: { color: lowStockCount > 0 ? "#cf1322" : undefined },
              }}
              prefix={lowStockCount > 0 ? <WarningOutlined /> : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đã hết hạn"
              value={expiredCount}
              styles={{
                content: { color: expiredCount > 0 ? "#cf1322" : undefined },
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sắp hết hạn"
              value={expiringSoonCount}
              styles={{
                content: {
                  color: expiringSoonCount > 0 ? "#fa8c16" : undefined,
                },
              }}
            />
          </Card>
        </Col>
      </Row>

      <CommonTable<Material>
        columns={updatedColumns}
        dataSource={filteredMaterials}
        pagination={{
          ...pagination,
          onChange: handlePageChange,
        }}
        loading={false}
        rank
        paging
        DrawerDetails={MaterialDetailDrawer}
      />

      {/* Import Modal */}
      <Modal
        title="Nhập kho vật liệu"
        open={isImportModalOpen}
        onOk={handleImport}
        onCancel={() => {
          setIsImportModalOpen(false);
          importForm.resetFields();
        }}
        width={600}
        okText="Nhập kho"
        cancelText="Hủy"
      >
        <Form form={importForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="materialId"
                label="Vật liệu"
                rules={[{ required: true, message: "Vui lòng chọn vật liệu" }]}
              >
                <Select
                  placeholder="Chọn vật liệu"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={materials.map((m) => ({
                    label: `${m.name} (${m.category})`,
                    value: m.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Số lượng"
                rules={[
                  { required: true, message: "Vui lòng nhập số lượng" },
                  {
                    type: "number",
                    min: 1,
                    message: "Số lượng phải lớn hơn 0",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Nhập số lượng"
                  className="w-full"
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="importDate"
                label="Ngày nhập"
                rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
                initialValue={dayjs()}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supplier" label="Nhà cung cấp">
                <Select
                  placeholder="Chọn nhà cung cấp"
                  options={[
                    {
                      label: "Công ty TNHH Da Việt",
                      value: "Công ty TNHH Da Việt",
                    },
                    {
                      label: "Nhà máy Chỉ may Hà Nội",
                      value: "Nhà máy Chỉ may Hà Nội",
                    },
                    {
                      label: "Công ty Hóa chất ABC",
                      value: "Công ty Hóa chất ABC",
                    },
                  ]}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warehouse" label="Kho">
                <Select
                  placeholder="Chọn kho"
                  options={[
                    { label: "Kho A", value: "Kho A" },
                    { label: "Kho B", value: "Kho B" },
                    { label: "Kho C", value: "Kho C" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="note" label="Ghi chú">
                <Input.TextArea rows={3} placeholder="Nhập ghi chú..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Export Modal */}
      <Modal
        title="Xuất kho vật liệu"
        open={isExportModalOpen}
        onOk={handleExport}
        onCancel={() => {
          setIsExportModalOpen(false);
          exportForm.resetFields();
        }}
        width={600}
        okText="Xuất kho"
        cancelText="Hủy"
      >
        <Form form={exportForm} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="materialId"
                label="Vật liệu"
                rules={[{ required: true, message: "Vui lòng chọn vật liệu" }]}
              >
                <Select
                  placeholder="Chọn vật liệu"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={materials.map((m) => ({
                    label: `${m.name} (Tồn: ${m.stockQuantity} ${m.unit})`,
                    value: m.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Số lượng"
                rules={[
                  { required: true, message: "Vui lòng nhập số lượng" },
                  {
                    type: "number",
                    min: 1,
                    message: "Số lượng phải lớn hơn 0",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Nhập số lượng"
                  className="w-full"
                  min={1}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="exportDate"
                label="Ngày xuất"
                rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
                initialValue={dayjs()}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="reason"
                label="Lý do xuất"
                rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
              >
                <Input.TextArea rows={3} placeholder="Nhập lý do xuất kho..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </WrapperContent>
  );
}
