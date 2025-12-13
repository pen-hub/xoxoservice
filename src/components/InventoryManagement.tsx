"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { CategoryService } from "@/services/categoryService";
import { InventoryService } from "@/services/inventoryService";
import { Category } from "@/types/category";
import { Unit, unitOptions } from "@/types/enum";
import { Material } from "@/types/inventory";
import {
    DeleteOutlined,
    EditOutlined,
    MinusOutlined,
    PlusOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
    Button,
    Card,
    Checkbox,
    Col,
    DatePicker,
    Descriptions,
    Form,
    Input,
    InputNumber,
    Modal,
    Progress,
    Radio,
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

// Helper function to get unit label from unit value
const getUnitLabel = (unitValue: string): string => {
    const unitOption = unitOptions.find((opt) => opt.value === unitValue);
    return unitOption?.label || unitValue;
};

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
                        <Tag
                            color={getCategoryColor(data.category, categories)}
                        >
                            {data.category}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Nhà cung cấp">
                        {data.supplier || "Chưa có thông tin"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Đơn vị">
                        {getUnitLabel(data.unit)}
                    </Descriptions.Item>
                    {data.importPrice && (
                        <Descriptions.Item label="Giá nhập">
                            <Text strong>
                                {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                }).format(data.importPrice)}
                                /{getUnitLabel(data.unit)}
                            </Text>
                        </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Tồn kho hiện tại">
                        <Space vertical size="small" style={{}}>
                            <Text
                                strong
                                className={`text-lg ${isLowStock ? "text-red-600" : ""}`}
                            >
                                {isLowStock && (
                                    <WarningOutlined className="mr-2" />
                                )}
                                {data.stockQuantity} {getUnitLabel(data.unit)}
                            </Text>
                            <Progress
                                percent={Math.round(
                                    (data.stockQuantity / data.maxCapacity) *
                                        100,
                                )}
                                status={isLowStock ? "exception" : "normal"}
                            />
                            <Text className="text-xs text-gray-500">
                                Mức tối thiểu: {data.minThreshold}{" "}
                                {getUnitLabel(data.unit)} / Tối đa:{" "}
                                {data.maxCapacity} {getUnitLabel(data.unit)}
                            </Text>
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Cập nhật">
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
    categories: Category[],
): string => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.color || "default";
};

export default function InventoryManagement() {
    const router = useRouter();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [materialInputType, setMaterialInputType] = useState<
        "new" | "existing"
    >("new");
    const [exportForm] = Form.useForm();
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const selectedExistingMaterialId = Form.useWatch("materialId", createForm);
    const hasExistingSelection =
        materialInputType === "existing" && !!selectedExistingMaterialId;
    const updateThresholds = Form.useWatch("updateThresholds", createForm);
    const updateImportPrice = Form.useWatch("updateImportPrice", createForm);

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
                const [materialsData, categoriesData] = await Promise.all([
                    InventoryService.getAllMaterials(),
                    CategoryService.getAll(),
                ]);
                setMaterials(materialsData);
                setCategories(categoriesData);
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
            },
        );

        const unsubscribeCategories = CategoryService.onSnapshot(
            (categoriesData) => {
                setCategories(categoriesData);
            },
        );

        return () => {
            unsubscribeMaterials();
            unsubscribeCategories();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredMaterials = applyFilter(materials);

    // Handle create/import
    const handleCreate = async () => {
        try {
            const values = await createForm.validateFields();

            if (materialInputType === "existing") {
                // Nhập kho vật liệu có sẵn
                const material = materials.find(
                    (m) => m.id === values.materialId,
                );
                if (!material) {
                    message.error("Không tìm thấy vật liệu");
                    return;
                }

                // Sử dụng giá tùy chỉnh nếu có, nếu không thì dùng giá từ material
                const price = values.importPrice ?? material.importPrice ?? 0;
                const totalAmount = values.quantity * price;
                const shouldUpdateImportPrice = values.updateImportPrice;

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
                    supplier: material.supplier || undefined,
                    ...(values.note ? { note: values.note } : {}),
                });

                // Update import price if provided custom price
                if (
                    shouldUpdateImportPrice &&
                    values.importPrice !== undefined &&
                    values.importPrice !== null &&
                    values.importPrice !== material.importPrice
                ) {
                    await InventoryService.updateMaterial(material.id, {
                        importPrice: values.importPrice,
                    });
                }

                if (values.updateThresholds) {
                    await InventoryService.updateMaterial(material.id, {
                        minThreshold: values.minThreshold,
                        maxCapacity: values.maxCapacity,
                    });
                }

                message.success(
                    `Đã nhập ${values.quantity} ${getUnitLabel(material.unit)} ${
                        material.name
                    }`,
                );
            } else {
                // Tạo vật liệu mới và nhập kho
                const materialData: Omit<
                    Material,
                    "id" | "createdAt" | "updatedAt"
                > = {
                    name: values.name,
                    category: values.category,
                    stockQuantity: 0, // Sẽ được cập nhật sau khi nhập kho
                    unit: values.unit,
                    minThreshold: values.minThreshold,
                    maxCapacity: values.maxCapacity,
                    supplier: values.supplier,
                    importPrice: values.importPrice,
                    longStockAlertDays: values.longStockAlertDays,
                    lastUpdated: new Date().toISOString().split("T")[0],
                };

                const newMaterial =
                    await InventoryService.createMaterial(materialData);

                // Tự động nhập kho với số lượng ban đầu
                const quantity = values.stockQuantity || values.quantity || 0;
                const price = values.importPrice || 0;
                const totalAmount = quantity * price;

                if (quantity > 0) {
                    await InventoryService.createTransaction({
                        materialId: newMaterial.id,
                        materialName: newMaterial.name,
                        type: "import",
                        quantity: quantity,
                        unit: newMaterial.unit,
                        price: price,
                        totalAmount: totalAmount,
                        date: dayjs(values.importDate || new Date()).format(
                            "YYYY-MM-DD",
                        ),
                        supplier: values.supplier || undefined,
                        ...(values.note ? { note: values.note } : {}),
                    });
                }

                message.success("Tạo vật liệu và nhập kho thành công");
            }

            setIsCreateModalOpen(false);
            createForm.resetFields();
            setMaterialInputType("new");
        } catch (error) {
            console.error("Create/Import failed:", error);
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
                `Đã xuất ${values.quantity} ${getUnitLabel(material.unit)} ${
                    material.name
                }`,
            );
            setIsExportModalOpen(false);
            exportForm.resetFields();
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
            options: categories.map((cat) => ({
                label: cat.name,
                value: cat.name,
            })),
        },
        {
            name: "unit",
            label: "Đơn vị",
            type: "select" as const,
            options: unitOptions,
        },
    ];

    // Tính toán thống kê
    const lowStockCount = materials.filter(
        (m) => m.stockQuantity < m.minThreshold,
    ).length;
    const longStockCount = materials.filter((m) =>
        isLongStock(m.lastUpdated, m.longStockAlertDays || 30),
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
                <Tag color={getCategoryColor(category, categories)}>
                    {category}
                </Tag>
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
                        <Text
                            strong
                            className={isLowStock ? "text-red-600" : ""}
                        >
                            {isLowStock && <WarningOutlined className="mr-1" />}
                            {record.stockQuantity} {getUnitLabel(record.unit)}
                        </Text>
                        <Progress
                            percent={Math.round(
                                (record.stockQuantity / record.maxCapacity) *
                                    100,
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
                      }).format(price)}/${getUnitLabel(record.unit)}`
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
                                setMaterialInputType("existing");
                                createForm.resetFields();
                                createForm.setFieldsValue({
                                    inputType: "existing",
                                    materialId: record.id,
                                    importDate: dayjs(),
                                    updateImportPrice: false,
                                    updateThresholds: false,
                                });
                                const material = materials.find(
                                    (m) => m.id === record.id,
                                );
                                if (material) {
                                    createForm.setFieldsValue({
                                        unit: material.unit,
                                        importPrice: material.importPrice || 0,
                                        supplier: material.supplier || "",
                                    });
                                }
                                setIsCreateModalOpen(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Xuất kho">
                        <Button
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                exportForm.setFieldsValue({
                                    materialId: record.id,
                                });
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
                        // {
                        //   name: "Export Excel",
                        //   icon: <FileExcelOutlined />,
                        //   can: true,
                        //   onClick: () => {
                        //     console.log("Export Excel");
                        //   },
                        // },
                        {
                            name: "Nhập kho",
                            icon: <PlusOutlined />,
                            type: "primary",
                            can: true,
                            onClick: () => {
                                console.log(
                                    "Opening create modal, current state:",
                                    isCreateModalOpen,
                                );
                                setIsCreateModalOpen(true);
                                console.log("Set isCreateModalOpen to true");
                            },
                        },
                        {
                            name: "Xuất kho",
                            icon: <MinusOutlined />,
                            can: true,
                            onClick: () => {
                                console.log(
                                    "Opening export modal, current state:",
                                    isExportModalOpen,
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
                                    content: {
                                        color:
                                            lowStockCount > 0
                                                ? "#cf1322"
                                                : undefined,
                                    },
                                }}
                                prefix={
                                    lowStockCount > 0 ? (
                                        <WarningOutlined />
                                    ) : undefined
                                }
                            />
                        </Card>
                    </Col>
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

            {/* Create/Import Material Modal */}
            {isCreateModalOpen && (
                <Modal
                    title="Nhập kho vật liệu"
                    open={isCreateModalOpen}
                    onOk={handleCreate}
                    onCancel={() => {
                        setIsCreateModalOpen(false);
                        createForm.resetFields();
                        setMaterialInputType("new");
                    }}
                    width={700}
                    okText={
                        materialInputType === "existing"
                            ? "Nhập kho"
                            : "Tạo và nhập kho"
                    }
                    cancelText="Hủy"
                    destroyOnHidden
                >
                    <Form form={createForm} layout="vertical" className="mt-4">
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="inputType"
                                    label="Loại nhập"
                                    initialValue="new"
                                    rules={[{ required: true }]}
                                >
                                    <Radio.Group
                                        onChange={(e) => {
                                            setMaterialInputType(
                                                e.target.value,
                                            );
                                            createForm.resetFields([
                                                "inputType",
                                            ]);
                                            createForm.setFieldsValue({
                                                inputType: e.target.value,
                                            });
                                            if (e.target.value === "existing") {
                                                createForm.setFieldsValue({
                                                    importDate: dayjs(),
                                                });
                                            }
                                        }}
                                    >
                                        <Radio value="new">
                                            Nhập nguyên liệu mới
                                        </Radio>
                                        <Radio value="existing">
                                            Nguyên liệu có sẵn
                                        </Radio>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>

                            {materialInputType === "existing" ? (
                                <>
                                    <Col span={24}>
                                        <Form.Item
                                            name="materialId"
                                            label="Vật liệu"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng chọn vật liệu",
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder="Chọn vật liệu"
                                                showSearch={{
                                                    filterOption: (
                                                        input: string,
                                                        option:
                                                            | { label: string }
                                                            | undefined,
                                                    ) =>
                                                        (option?.label ?? "")
                                                            .toLowerCase()
                                                            .includes(
                                                                input.toLowerCase(),
                                                            ),
                                                }}
                                                options={materials.map((m) => ({
                                                    label: `${m.name} (${m.category}) - Tồn: ${m.stockQuantity} ${m.unit} - ${m.supplier}`,
                                                    value: m.id,
                                                }))}
                                                onChange={(value) => {
                                                    const material =
                                                        materials.find(
                                                            (m) =>
                                                                m.id === value,
                                                        );
                                                    if (material) {
                                                        createForm.setFieldsValue(
                                                            {
                                                                unit: material.unit,
                                                                importPrice:
                                                                    material.importPrice ||
                                                                    0,
                                                                supplier:
                                                                    material.supplier ||
                                                                    "",
                                                                name: material.name,
                                                                category:
                                                                    material.category,
                                                                minThreshold:
                                                                    material.minThreshold,
                                                                maxCapacity:
                                                                    material.maxCapacity,
                                                            },
                                                        );
                                                    }
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col span={12}>
                                        <Form.Item
                                            name="quantity"
                                            label="Số lượng"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập số lượng",
                                                },
                                                {
                                                    type: "number",
                                                    min: 1,
                                                    message:
                                                        "Số lượng phải lớn hơn 0",
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                placeholder="Nhập số lượng"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={1}
                                                disabled={!hasExistingSelection}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="unit" label="Đơn vị">
                                            <Input
                                                disabled
                                                placeholder="Đơn vị"
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col span={12}>
                                        <Form.Item
                                            name="importPrice"
                                            label="Giá nhập (VND/đơn vị)"
                                        >
                                            <InputNumber
                                                disabled={
                                                    !hasExistingSelection ||
                                                    !updateImportPrice
                                                }
                                                style={{
                                                    width: "100%",
                                                }}
                                                formatter={(value) =>
                                                    `${value}`.replace(
                                                        /\B(?=(\d{3})+(?!\d))/g,
                                                        ",",
                                                    )
                                                }
                                                parser={(value) => {
                                                    const parsed = Number(
                                                        value?.replace(
                                                            /,/g,
                                                            "",
                                                        ) || 0,
                                                    );
                                                    return parsed as any;
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="importDate"
                                            label="Ngày nhập"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng chọn ngày",
                                                },
                                            ]}
                                            initialValue={dayjs()}
                                        >
                                            <DatePicker
                                                style={{
                                                    width: "100%",
                                                }}
                                                disabled
                                                format="DD/MM/YYYY"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="updateImportPrice"
                                            valuePropName="checked"
                                            initialValue={false}
                                            tooltip="Bật nếu muốn lưu giá nhập tùy chỉnh thành giá nhập mặc định của vật liệu"
                                        >
                                            <Checkbox
                                                disabled={!hasExistingSelection}
                                            >
                                                Cập nhật giá nhập mặc định
                                            </Checkbox>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="updateThresholds"
                                            valuePropName="checked"
                                            initialValue={false}
                                            tooltip="Bật nếu muốn cập nhật mức tối thiểu / tối đa tồn kho cho vật liệu này"
                                        >
                                            <Checkbox
                                                disabled={!hasExistingSelection}
                                            >
                                                Cập nhật mức tồn (tối thiểu/tối
                                                đa)
                                            </Checkbox>
                                        </Form.Item>
                                    </Col>

                                    <Col span={12}>
                                        <Form.Item
                                            name="minThreshold"
                                            label="Mức tối thiểu"
                                            rules={[
                                                {
                                                    type: "number",
                                                    min: 0,
                                                    message:
                                                        "Mức tối thiểu phải >= 0",
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                formatter={(value) =>
                                                    `${value}`.replace(
                                                        /\B(?=(\d{3})+(?!\d))/g,
                                                        ",",
                                                    )
                                                }
                                                parser={(value) => {
                                                    const parsed = Number(
                                                        value?.replace(
                                                            /,/g,
                                                            "",
                                                        ) || 0,
                                                    );
                                                    return parsed as any;
                                                }}
                                                placeholder="Nhập mức tối thiểu"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={0}
                                                disabled={
                                                    !hasExistingSelection ||
                                                    !updateThresholds
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="maxCapacity"
                                            label="Mức tối đa"
                                            rules={[
                                                {
                                                    type: "number",
                                                    min: 1,
                                                    message:
                                                        "Mức tối đa phải >= 1",
                                                },
                                                ({ getFieldValue }) => ({
                                                    validator: (_, value) => {
                                                        const min =
                                                            getFieldValue(
                                                                "minThreshold",
                                                            );
                                                        if (
                                                            value ===
                                                                undefined ||
                                                            value === null ||
                                                            min === undefined ||
                                                            min === null
                                                        ) {
                                                            return Promise.resolve();
                                                        }
                                                        if (value >= min)
                                                            return Promise.resolve();
                                                        return Promise.reject(
                                                            new Error(
                                                                "Mức tối đa phải lớn hơn hoặc bằng mức tối thiểu",
                                                            ),
                                                        );
                                                    },
                                                }),
                                            ]}
                                        >
                                            <InputNumber
                                                placeholder="Nhập mức tối đa"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={1}
                                                formatter={(value) =>
                                                    `${value}`.replace(
                                                        /\B(?=(\d{3})+(?!\d))/g,
                                                        ",",
                                                    )
                                                }
                                                parser={(value) => {
                                                    const parsed = Number(
                                                        value?.replace(
                                                            /,/g,
                                                            "",
                                                        ) || 0,
                                                    );
                                                    return parsed as any;
                                                }}
                                                disabled={
                                                    !hasExistingSelection ||
                                                    !updateThresholds
                                                }
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col span={12}>
                                        <Form.Item
                                            name="supplier"
                                            label="Nhà cung cấp"
                                        >
                                            <Input
                                                disabled
                                                placeholder="Nhà cung cấp"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="note" label="Ghi chú">
                                            <Input.TextArea
                                                rows={3}
                                                placeholder="Nhập ghi chú..."
                                                disabled={!hasExistingSelection}
                                            />
                                        </Form.Item>
                                    </Col>
                                </>
                            ) : (
                                <>
                                    <Col span={12}>
                                        <Form.Item
                                            name="name"
                                            label="Tên vật liệu"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập tên vật liệu",
                                                },
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
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng chọn danh mục",
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder="Chọn danh mục"
                                                showSearch
                                                filterOption={(input, option) =>
                                                    (option?.label ?? "")
                                                        .toLowerCase()
                                                        .includes(
                                                            input.toLowerCase(),
                                                        )
                                                }
                                                options={categories.map(
                                                    (cat) => ({
                                                        label: cat.name,
                                                        value: cat.name,
                                                    }),
                                                )}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="unit"
                                            label="Đơn vị"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập đơn vị",
                                                },
                                                {
                                                    validator: (_, value) => {
                                                        if (!value)
                                                            return Promise.resolve();
                                                        const validUnits =
                                                            Object.values(Unit);
                                                        if (
                                                            validUnits.includes(
                                                                value as Unit,
                                                            )
                                                        ) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(
                                                            new Error(
                                                                "Đơn vị không hợp lệ",
                                                            ),
                                                        );
                                                    },
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder="Chọn đơn vị"
                                                options={unitOptions}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="minThreshold"
                                            label="Mức tối thiểu"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập mức tối thiểu",
                                                },
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
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập mức tối đa",
                                                },
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
                                            name="quantity"
                                            label="Số lượng nhập kho"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập số lượng",
                                                },
                                                {
                                                    type: "number",
                                                    min: 0,
                                                    message:
                                                        "Số lượng phải lớn hơn hoặc bằng 0",
                                                },
                                            ]}
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
                                        <Form.Item
                                            name="importPrice"
                                            label="Giá nhập (VND/đơn vị)"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng nhập giá nhập",
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                placeholder="Nhập giá nhập"
                                                style={{
                                                    width: "100%",
                                                }}
                                                min={0}
                                                formatter={(value) =>
                                                    `${value}`.replace(
                                                        /\B(?=(\d{3})+(?!\d))/g,
                                                        ",",
                                                    )
                                                }
                                                parser={(value) =>
                                                    Number(
                                                        value?.replace(
                                                            /\$\s?|(,*)/g,
                                                            "",
                                                        ) || 0,
                                                    ) as any
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="importDate"
                                            label="Ngày nhập"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Vui lòng chọn ngày",
                                                },
                                            ]}
                                            initialValue={dayjs()}
                                        >
                                            <DatePicker
                                                style={{
                                                    width: "100%",
                                                }}
                                                format="DD/MM/YYYY"
                                                disabled
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="supplier"
                                            label="Nhà cung cấp"
                                        >
                                            <Input placeholder="Nhập nhà cung cấp" />
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
                                    <Col span={24}>
                                        <Form.Item name="note" label="Ghi chú">
                                            <Input.TextArea
                                                rows={3}
                                                placeholder="Nhập ghi chú..."
                                            />
                                        </Form.Item>
                                    </Col>
                                </>
                            )}
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
                    destroyOnHidden
                >
                    <Form form={editForm} layout="vertical" className="mt-4">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="name"
                                    label="Tên vật liệu"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Vui lòng nhập tên vật liệu",
                                        },
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
                                        {
                                            required: true,
                                            message: "Vui lòng chọn danh mục",
                                        },
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
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng nhập đơn vị",
                                        },
                                    ]}
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
                                        {
                                            required: true,
                                            message:
                                                "Vui lòng nhập mức tối thiểu",
                                        },
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
                                        {
                                            required: true,
                                            message: "Vui lòng nhập mức tối đa",
                                        },
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
                                    name="importPrice"
                                    label="Giá nhập (VND/đơn vị)"
                                >
                                    <InputNumber
                                        placeholder="Nhập giá nhập"
                                        style={{
                                            width: "100%",
                                        }}
                                        min={0}
                                        formatter={(value) =>
                                            `${value}`.replace(
                                                /\B(?=(\d{3})+(?!\d))/g,
                                                ",",
                                            )
                                        }
                                        parser={(value) =>
                                            Number(
                                                value?.replace(
                                                    /\$\s?|(,*)/g,
                                                    "",
                                                ) || 0,
                                            ) as any
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
                    destroyOnHidden
                >
                    <p>
                        Bạn có chắc chắn muốn xóa vật liệu{" "}
                        <strong>{selectedMaterial?.name}</strong>? Hành động này
                        không thể hoàn tác.
                    </p>
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
                    destroyOnHidden
                >
                    <Form form={exportForm} layout="vertical" className="mt-4">
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="materialId"
                                    label="Vật liệu"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng chọn vật liệu",
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder="Chọn vật liệu"
                                        showSearch={{
                                            filterOption: (
                                                input: string,
                                                option:
                                                    | { label: string }
                                                    | undefined,
                                            ) =>
                                                (option?.label ?? "")
                                                    .toLowerCase()
                                                    .includes(
                                                        input.toLowerCase(),
                                                    ),
                                        }}
                                        options={materials.map((m) => ({
                                            label: `${m.name} (${m.category}) - Tồn: ${m.stockQuantity} ${m.unit} - ${m.supplier}`,
                                            value: m.id,
                                        }))}
                                        onChange={(value) => {
                                            const material = materials.find(
                                                (m) => m.id === value,
                                            );
                                            if (material) {
                                                exportForm.setFieldsValue({
                                                    unit: material.unit,
                                                    importPrice:
                                                        material.importPrice ||
                                                        0,
                                                    supplier:
                                                        material.supplier || "",
                                                });
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="quantity"
                                    label="Số lượng"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng nhập số lượng",
                                        },
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
                                <Form.Item name="unit" label="Đơn vị">
                                    <Input disabled placeholder="Đơn vị" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="importPrice"
                                    label="Giá nhập (VND/đơn vị)"
                                >
                                    <InputNumber
                                        disabled
                                        style={{
                                            width: "100%",
                                        }}
                                        formatter={(value) =>
                                            `${value}`.replace(
                                                /\B(?=(\d{3})+(?!\d))/g,
                                                ",",
                                            )
                                        }
                                        parser={(value) =>
                                            Number(
                                                value?.replace(
                                                    /\$\s?|(,*)/g,
                                                    "",
                                                ) || 0,
                                            ) as any
                                        }
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
                                        placeholder="Nhập giá xuất (tùy chọn)"
                                        style={{
                                            width: "100%",
                                        }}
                                        min={0}
                                        formatter={(value) =>
                                            `${value}`.replace(
                                                /\B(?=(\d{3})+(?!\d))/g,
                                                ",",
                                            )
                                        }
                                        parser={(value) =>
                                            Number(
                                                value?.replace(
                                                    /\$\s?|(,*)/g,
                                                    "",
                                                ) || 0,
                                            ) as any
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="exportDate"
                                    label="Ngày xuất"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng chọn ngày",
                                        },
                                    ]}
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
                                    <Input
                                        disabled
                                        placeholder="Nhà cung cấp"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    name="reason"
                                    label="Lý do xuất"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng nhập lý do",
                                        },
                                    ]}
                                >
                                    <Input.TextArea
                                        rows={3}
                                        placeholder="Nhập lý do xuất kho..."
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="note" label="Ghi chú">
                                    <Input.TextArea
                                        rows={3}
                                        placeholder="Nhập ghi chú..."
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            )}
        </>
    );
}
