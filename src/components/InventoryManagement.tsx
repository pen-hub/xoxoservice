"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { CategoryService } from "@/services/categoryService";
import { InventoryService } from "@/services/inventoryService";
import { Category } from "@/types/category";
import { InventorySettings, Material } from "@/types/inventory";
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { Text } = Typography;

const isLongStock = (lastUpdated?: string, alertDays: number = 90): boolean => {
  if (!lastUpdated) return false;
  const today = new Date();
  const lastUpdate = new Date(lastUpdated);
  const diffTime = today.getTime() - lastUpdate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > alertDays;
};

// Material Detail Drawer
const createMaterialDetailDrawer = (categories: Category[]) => {
  const MaterialDetailDrawer: React.FC<PropRowDetails<Material>> = ({
    data,
  }) => {
    if (!data) return null;

    const isLowStock = data.stockQuantity < data.minThreshold;

    return (
      <div>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Mã NVL">
            <Text strong className="font-mono">
              NVL-{data.id.slice(-6).toUpperCase()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Tên vật liệu">
            <Text strong>{data.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Danh mục">
            <Tag color={getCategoryColor(data.category, categories)}>
              {data.category}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Nhà cung cấp">
            {data.supplier || "Chưa có thông tin"}
          </Descriptions.Item>
          <Descriptions.Item label="Đơn vị">{data.unit}</Descriptions.Item>
          {data.importPrice && (
            <Descriptions.Item label="Giá nhập">
              <Text strong>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(data.importPrice)}
                /{data.unit}
              </Text>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Tồn kho hiện tại">
            <Space vertical size="small" style={{}}>
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
          <Descriptions.Item label="Cập nhật lần cuối">
            {data.lastUpdated
              ? dayjs(data.lastUpdated).format("DD/MM/YYYY")
              : "Chưa cập nhật"}
          </Descriptions.Item>
        </Descriptions>
      </div>
    );
  };
  return MaterialDetailDrawer;
};

const getCategoryColor = (
  categoryName: string,
  categories: Category[]
): string => {
  const category = categories.find((c) => c.name === categoryName);
  return category?.color || "default";
};

export default function InventoryManagement() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<InventorySettings>({
    defaultLongStockDays: 90,
  });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [importForm] = Form.useForm();
  const [exportForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [settingsForm] = Form.useForm();

  const {
    query,
    pagination,
    updateQueries,
    reset,
    applyFilter,
    handlePageChange,
  } = useFilter();

  // Load materials, categories and settings
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [materialsData, categoriesData, settingsData] = await Promise.all(
          [
            InventoryService.getAllMaterials(),
            CategoryService.getAll(),
            InventoryService.getSettings(),
          ]
        );
        setMaterials(materialsData);
        setCategories(categoriesData);
        setSettings(settingsData);
        settingsForm.setFieldsValue(settingsData);
      } catch (error) {
        console.error("Error loading data:", error);
        message.error("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribeMaterials = InventoryService.onMaterialsSnapshot(
      (materialsData) => {
        setMaterials(materialsData);
      }
    );

    const unsubscribeCategories = CategoryService.onSnapshot(
      (categoriesData) => {
        setCategories(categoriesData);
      }
    );

    return () => {
      unsubscribeMaterials();
      unsubscribeCategories();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredMaterials = applyFilter(materials);

  // Handle create
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const materialData: Omit<Material, "id" | "createdAt" | "updatedAt"> = {
        name: values.name,
        category: values.category,
        stockQuantity: values.stockQuantity || 0,
        unit: values.unit,
        minThreshold: values.minThreshold,
        maxCapacity: values.maxCapacity,
        supplier: values.supplier,
        importPrice: values.importPrice,
        longStockAlertDays: values.longStockAlertDays,
        lastUpdated: new Date().toISOString().split("T")[0],
      };

      await InventoryService.createMaterial(materialData);
      message.success("Tạo vật liệu thành công");
      setIsCreateModalOpen(false);
      createForm.resetFields();
    } catch (error) {
      console.error("Create failed:", error);
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!selectedMaterial) return;

    try {
      const values = await editForm.validateFields();
      await InventoryService.updateMaterial(selectedMaterial.id, {
        name: values.name,
        category: values.category,
        unit: values.unit,
        minThreshold: values.minThreshold,
        maxCapacity: values.maxCapacity,
        supplier: values.supplier,
        importPrice: values.importPrice,
        longStockAlertDays: values.longStockAlertDays,
        lastUpdated: new Date().toISOString().split("T")[0],
      });
      message.success("Cập nhật vật liệu thành công");
      setIsEditModalOpen(false);
      setSelectedMaterial(null);
      editForm.resetFields();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedMaterial) return;

    try {
      await InventoryService.deleteMaterial(selectedMaterial.id);
      message.success("Xóa vật liệu thành công");
      setIsDeleteModalOpen(false);
      setSelectedMaterial(null);
    } catch (error) {
      console.error("Delete failed:", error);
      message.error("Không thể xóa vật liệu");
    }
  };

  // Handle import
  const handleImport = async () => {
    try {
      const values = await importForm.validateFields();
      const material = materials.find((m) => m.id === values.materialId);

      if (!material) {
        message.error("Không tìm thấy vật liệu");
        return;
      }

      const price = values.price || material.importPrice || 0;
      const totalAmount = values.quantity * price;

      // Create transaction
      await InventoryService.createTransaction({
        materialId: material.id,
        materialName: material.name,
        type: "import",
        quantity: values.quantity,
        unit: material.unit,
        price: price,
        totalAmount: totalAmount,
        date: dayjs(values.importDate).format("YYYY-MM-DD"),
        ...(values.supplier || material.supplier
          ? { supplier: values.supplier || material.supplier }
          : {}),
        ...(values.note ? { note: values.note } : {}),
      });

      // Update import price if provided
      if (values.price && values.price !== material.importPrice) {
        await InventoryService.updateMaterial(material.id, {
          importPrice: values.price,
        });
      }

      message.success(
        `Đã nhập ${values.quantity} ${material.unit} ${material.name}`
      );
      setIsImportModalOpen(false);
      importForm.resetFields();
    } catch (error) {
      console.error("Import validation failed:", error);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const values = await exportForm.validateFields();
      const material = materials.find((m) => m.id === values.materialId);

      if (!material) {
        message.error("Không tìm thấy vật liệu");
        return;
      }

      if (material.stockQuantity < values.quantity) {
        message.error("Số lượng xuất vượt quá tồn kho!");
        return;
      }

      const price = values.price || material.importPrice || 0;
      const totalAmount = values.quantity * price;

      // Create transaction
      await InventoryService.createTransaction({
        materialId: material.id,
        materialName: material.name,
        type: "export",
        quantity: values.quantity,
        unit: material.unit,
        price: price,
        totalAmount: totalAmount,
        date: dayjs(values.exportDate).format("YYYY-MM-DD"),
        ...(values.reason ? { reason: values.reason } : {}),
        ...(values.note ? { note: values.note } : {}),
      });

      message.success(
        `Đã xuất ${values.quantity} ${material.unit} ${material.name}`
      );
      setIsExportModalOpen(false);
      exportForm.resetFields();
    } catch (error) {
      console.error("Export validation failed:", error);
    }
  };

  // Handle settings update
  const handleSettingsUpdate = async () => {
    try {
      const values = await settingsForm.validateFields();
      await InventoryService.updateSettings(values);
      setSettings({ ...settings, ...values });
      message.success("Cập nhật cài đặt thành công");
      setIsSettingsModalOpen(false);
    } catch (error) {
      console.error("Settings update failed:", error);
    }
  };

  // Filter fields
  const filterFields = [
    {
      name: "category",
      label: "Danh mục",
      type: "select" as const,
      options: categories.map((cat) => ({
        label: cat.name,
        value: cat.name,
      })),
    },
    {
      name: "unit",
      label: "Đơn vị",
      type: "select" as const,
      options: [
        { label: "m²", value: "m²" },
        { label: "cuộn", value: "cuộn" },
        { label: "lít", value: "lít" },
        { label: "kg", value: "kg" },
        { label: "cái", value: "cái" },
      ],
    },
  ];

  // Tính toán thống kê
  const lowStockCount = materials.filter(
    (m) => m.stockQuantity < m.minThreshold
  ).length;
  const longStockCount = materials.filter((m) =>
    isLongStock(
      m.lastUpdated,
      m.longStockAlertDays || settings.defaultLongStockDays
    )
  ).length;

  const updatedColumns: TableColumnsType<Material> = [
    {
      title: "Mã NVL",
      dataIndex: "id",
      key: "id",
      width: 120,
      fixed: "left",
      render: (id: string) => (
        <Text strong className="font-mono">
          NVL-{id.slice(-6).toUpperCase()}
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
        <Tag color={getCategoryColor(category, categories)}>{category}</Tag>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: "stockQuantity",
      key: "stock",
      width: 250,
      render: (_: unknown, record: Material) => {
        const isLowStock = record.stockQuantity < record.minThreshold;
        return (
          <Space vertical size="small" style={{}}>
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
      title: "Giá nhập",
      dataIndex: "importPrice",
      key: "importPrice",
      width: 150,
      render: (_: unknown, record: Material) => {
        const price = record.importPrice;
        return price
          ? `${new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(price)}/${record.unit}`
          : "-";
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_: unknown, record: Material) => (
        <Space size="small">
          <Tooltip title="Nhập kho">
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                importForm.setFieldsValue({ materialId: record.id });
                setIsImportModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xuất kho">
            <Button
              size="small"
              icon={<MinusOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                exportForm.setFieldsValue({ materialId: record.id });
                setIsExportModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMaterial(record);
                editForm.setFieldsValue({
                  ...record,
                });
                setIsEditModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMaterial(record);
                setIsDeleteModalOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <WrapperContent
        header={{
          searchInput: {
            placeholder: "Tìm kiếm vật liệu...",
            filterKeys: ["name", "category", "supplier"],
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
              can: true,
              onClick: () => {
                console.log("Export Excel");
              },
            },
            {
              name: "Thêm vật liệu",
              icon: <PlusOutlined />,
              type: "primary",
              can: true,
              onClick: () => {
                console.log(
                  "Opening create modal, current state:",
                  isCreateModalOpen
                );
                setIsCreateModalOpen(true);
                console.log("Set isCreateModalOpen to true");
              },
            },
            {
              name: "Nhập kho",
              icon: <PlusOutlined />,
              can: true,
              onClick: () => {
                console.log(
                  "Opening import modal, current state:",
                  isImportModalOpen
                );
                setIsImportModalOpen(true);
                console.log("Set isImportModalOpen to true");
              },
            },
            {
              name: "Xuất kho",
              icon: <MinusOutlined />,
              can: true,
              onClick: () => {
                console.log(
                  "Opening export modal, current state:",
                  isExportModalOpen
                );
                setIsExportModalOpen(true);
                console.log("Set isExportModalOpen to true");
              },
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
        </Row>

        <CommonTable<Material>
          columns={updatedColumns}
          dataSource={filteredMaterials}
          pagination={{
            ...pagination,
            onChange: handlePageChange,
          }}
          loading={loading}
          rank
          paging
          DrawerDetails={createMaterialDetailDrawer(categories)}
        />
      </WrapperContent>
      {longStockCount > 0 && (
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tồn quá lâu"
              value={longStockCount}
              styles={{
                content: { color: "#fa8c16" },
              }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      )}
      {/* Create Material Modal */}
      {isCreateModalOpen && (
        <Modal
          title="Thêm vật liệu mới"
          open={isCreateModalOpen}
          onOk={handleCreate}
          onCancel={() => {
            setIsCreateModalOpen(false);
            createForm.resetFields();
          }}
          width={700}
          okText="Tạo"
          cancelText="Hủy"
          destroyOnClose
          maskClosable={false}
        >
          <Form form={createForm} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên vật liệu"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên vật liệu" },
                  ]}
                >
                  <Input placeholder="Nhập tên vật liệu" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="Danh mục"
                  rules={[
                    { required: true, message: "Vui lòng chọn danh mục" },
                  ]}
                >
                  <Select
                    placeholder="Chọn danh mục"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={categories.map((cat) => ({
                      label: cat.name,
                      value: cat.name,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="unit"
                  label="Đơn vị"
                  rules={[{ required: true, message: "Vui lòng nhập đơn vị" }]}
                >
                  <Select
                    placeholder="Chọn đơn vị"
                    options={[
                      { label: "m²", value: "m²" },
                      { label: "cuộn", value: "cuộn" },
                      { label: "lít", value: "lít" },
                      { label: "kg", value: "kg" },
                      { label: "cái", value: "cái" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="minThreshold"
                  label="Mức tối thiểu"
                  rules={[
                    { required: true, message: "Vui lòng nhập mức tối thiểu" },
                  ]}
                >
                  <InputNumber
                    placeholder="Nhập mức tối thiểu"
                    style={{
                      width: "100%",
                    }}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="maxCapacity"
                  label="Mức tối đa"
                  rules={[
                    { required: true, message: "Vui lòng nhập mức tối đa" },
                  ]}
                >
                  <InputNumber
                    placeholder="Nhập mức tối đa"
                    style={{
                      width: "100%",
                    }}
                    min={1}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="stockQuantity"
                  label="Số lượng tồn kho ban đầu"
                  initialValue={0}
                >
                  <InputNumber
                    placeholder="Nhập số lượng"
                    style={{
                      width: "100%",
                    }}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="importPrice" label="Giá nhập (VND/đơn vị)">
                  <InputNumber
                    placeholder="Nhập giá nhập"
                    style={{
                      width: "100%",
                    }}
                    min={0}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      Number(value?.replace(/\$\s?|(,*)/g, "") || 0) as any
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="supplier" label="Nhà cung cấp">
                  <Input placeholder="Nhập nhà cung cấp" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="expiryDate" label="Hạn sử dụng">
                  <DatePicker
                    style={{
                      width: "100%",
                    }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="longStockAlertDays"
                  label="Cảnh báo tồn quá lâu (ngày)"
                  tooltip="Số ngày không có giao dịch để cảnh báo tồn quá lâu"
                >
                  <InputNumber
                    placeholder="Nhập số ngày"
                    style={{
                      width: "100%",
                    }}
                    min={1}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      )}

      {/* Edit Material Modal */}
      {isEditModalOpen && (
        <Modal
          title="Chỉnh sửa vật liệu"
          open={isEditModalOpen}
          onOk={handleEdit}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedMaterial(null);
            editForm.resetFields();
          }}
          width={700}
          okText="Cập nhật"
          cancelText="Hủy"
          destroyOnClose
          maskClosable={false}
        >
          <Form form={editForm} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên vật liệu"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên vật liệu" },
                  ]}
                >
                  <Input placeholder="Nhập tên vật liệu" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="Danh mục"
                  rules={[
                    { required: true, message: "Vui lòng chọn danh mục" },
                  ]}
                >
                  <Select
                    placeholder="Chọn danh mục"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={categories.map((cat) => ({
                      label: cat.name,
                      value: cat.name,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="unit"
                  label="Đơn vị"
                  rules={[{ required: true, message: "Vui lòng nhập đơn vị" }]}
                >
                  <Select
                    placeholder="Chọn đơn vị"
                    options={[
                      { label: "m²", value: "m²" },
                      { label: "cuộn", value: "cuộn" },
                      { label: "lít", value: "lít" },
                      { label: "kg", value: "kg" },
                      { label: "cái", value: "cái" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="minThreshold"
                  label="Mức tối thiểu"
                  rules={[
                    { required: true, message: "Vui lòng nhập mức tối thiểu" },
                  ]}
                >
                  <InputNumber
                    placeholder="Nhập mức tối thiểu"
                    style={{
                      width: "100%",
                    }}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="maxCapacity"
                  label="Mức tối đa"
                  rules={[
                    { required: true, message: "Vui lòng nhập mức tối đa" },
                  ]}
                >
                  <InputNumber
                    placeholder="Nhập mức tối đa"
                    style={{
                      width: "100%",
                    }}
                    min={1}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="importPrice" label="Giá nhập (VND/đơn vị)">
                  <InputNumber
                    placeholder="Nhập giá nhập"
                    style={{
                      width: "100%",
                    }}
                    min={0}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      Number(value?.replace(/\$\s?|(,*)/g, "") || 0) as any
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="supplier" label="Nhà cung cấp">
                  <Input placeholder="Nhập nhà cung cấp" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="expiryDate" label="Hạn sử dụng">
                  <DatePicker
                    style={{
                      width: "100%",
                    }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="longStockAlertDays"
                  label="Cảnh báo tồn quá lâu (ngày)"
                  tooltip="Số ngày không có giao dịch để cảnh báo tồn quá lâu"
                >
                  <InputNumber
                    placeholder="Nhập số ngày"
                    style={{
                      width: "100%",
                    }}
                    min={1}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <Modal
          title="Xác nhận xóa"
          open={isDeleteModalOpen}
          onOk={handleDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSelectedMaterial(null);
          }}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          destroyOnClose
          maskClosable={false}
        >
          <p>
            Bạn có chắc chắn muốn xóa vật liệu{" "}
            <strong>{selectedMaterial?.name}</strong>? Hành động này không thể
            hoàn tác.
          </p>
        </Modal>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <Modal
          title="Cài đặt thông báo"
          open={isSettingsModalOpen}
          onOk={handleSettingsUpdate}
          onCancel={() => setIsSettingsModalOpen(false)}
          okText="Lưu"
          cancelText="Hủy"
          destroyOnClose
          maskClosable={false}
        >
          <Form form={settingsForm} layout="vertical" className="mt-4">
            <Form.Item
              name="defaultLongStockDays"
              label="Cảnh báo tồn quá lâu (ngày)"
              rules={[
                { required: true, message: "Vui lòng nhập số ngày" },
                { type: "number", min: 1, message: "Số ngày phải lớn hơn 0" },
              ]}
            >
              <InputNumber
                placeholder="Nhập số ngày"
                style={{
                  width: "100%",
                }}
                min={1}
              />
            </Form.Item>
          </Form>
        </Modal>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
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
          destroyOnClose
          maskClosable={false}
        >
          <Form form={importForm} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="materialId"
                  label="Vật liệu"
                  rules={[
                    { required: true, message: "Vui lòng chọn vật liệu" },
                  ]}
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
                      label: `${m.name} (${m.category}) - Tồn: ${m.stockQuantity} ${m.unit}`,
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
                    style={{
                      width: "100%",
                    }}
                    min={1}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="price"
                  label="Giá nhập (VND/đơn vị)"
                  tooltip="Nếu không nhập, sẽ sử dụng giá nhập hiện tại của vật liệu"
                >
                  <InputNumber
                    placeholder="Nhập giá nhập"
                    style={{
                      width: "100%",
                    }}
                    min={0}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      Number(value?.replace(/\$\s?|(,*)/g, "") || 0) as any
                    }
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
                  <DatePicker
                    style={{
                      width: "100%",
                    }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="supplier" label="Nhà cung cấp">
                  <Input placeholder="Nhập nhà cung cấp" />
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
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
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
          destroyOnClose
          maskClosable={false}
        >
          <Form form={exportForm} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="materialId"
                  label="Vật liệu"
                  rules={[
                    { required: true, message: "Vui lòng chọn vật liệu" },
                  ]}
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
                    style={{
                      width: "100%",
                    }}
                    min={1}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="price"
                  label="Giá xuất (VND/đơn vị)"
                  tooltip="Nếu không nhập, sẽ sử dụng giá nhập của vật liệu"
                >
                  <InputNumber
                    placeholder="Nhập giá xuất"
                    style={{
                      width: "100%",
                    }}
                    min={0}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      Number(value?.replace(/\$\s?|(,*)/g, "") || 0) as any
                    }
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
                  <DatePicker
                    style={{
                      width: "100%",
                    }}
                    format="DD/MM/YYYY"
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="reason"
                  label="Lý do xuất"
                  rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Nhập lý do xuất kho..."
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
      )}
    </>
  );
}
