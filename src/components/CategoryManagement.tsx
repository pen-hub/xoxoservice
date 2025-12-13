"use client";

import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { CategoryService } from "@/services/categoryService";
import { Category } from "@/types/category";
import { genCode } from "@/utils/genCode";
import {
    DeleteOutlined,
    EditOutlined,
    MinusCircleOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import {
    App,
    Button,
    Card,
    Col,
    Collapse,
    Form,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Tag,
    Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";

const { Text } = Typography;

const colorOptions = [
    { label: "Xanh dương", value: "blue" },
    { label: "Xanh lá", value: "green" },
    { label: "Tím", value: "purple" },
    { label: "Cam", value: "orange" },
    { label: "Đỏ", value: "red" },
    { label: "Vàng", value: "gold" },
    { label: "Mặc định", value: "default" },
    { label: "Đen", value: "black" },
    { label: "Xám", value: "gray" },
    { label: "Nâu", value: "brown" },
    { label: "Xanh lá lam", value: "teal" },
    { label: "Xanh lá biển", value: "cyan" },
];

// Helper function to build tree structure
const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // First pass: create map of all categories
    categories.forEach((cat) => {
        categoryMap.set(cat.code, { ...cat, children: [] });
    });

    // Second pass: build tree structure
    categories.forEach((cat) => {
        const category = categoryMap.get(cat.code)!;
        if (cat.parentCode && categoryMap.has(cat.parentCode)) {
            const parent = categoryMap.get(cat.parentCode)!;
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(category);
        } else {
            rootCategories.push(category);
        }
    });

    return rootCategories;
};

// Nested Form List Component for managing categories
interface NestedCategoryFormProps {
    categories: Category[];
    onSave: (categories: Category[]) => Promise<void>;
}

const NestedCategoryForm: React.FC<NestedCategoryFormProps> = ({
    categories,
    onSave,
}) => {
    const [form] = Form.useForm();
    const { message: antdMessage } = App.useApp();
    const [saving, setSaving] = useState(false);

    // Convert categories to form data structure
    const initialValues = useMemo(() => {
        const tree = buildCategoryTree(categories);
        return { categories: tree };
    }, [categories]);

    useEffect(() => {
        form.setFieldsValue(initialValues);
    }, [form, initialValues]);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            // Flatten the nested structure and save all categories
            const flattenCategories = (
                cats: any[],
                parentCode?: string,
            ): Omit<Category, "createdAt" | "updatedAt">[] => {
                const result: Omit<Category, "createdAt" | "updatedAt">[] = [];
                cats.forEach((cat) => {
                    const categoryData: Omit<
                        Category,
                        "createdAt" | "updatedAt"
                    > = {
                        code: cat.code || genCode("CAT_"),
                        name: cat.name,
                        color: cat.color || "default",
                    };
                    if (parentCode) {
                        categoryData.parentCode = parentCode;
                    }
                    if (cat.description && cat.description.trim() !== "") {
                        categoryData.description = cat.description.trim();
                    }
                    result.push(categoryData);

                    // Recursively process children
                    if (cat.children && cat.children.length > 0) {
                        result.push(
                            ...flattenCategories(
                                cat.children,
                                categoryData.code,
                            ),
                        );
                    }
                });
                return result;
            };

            const categoriesToSave = flattenCategories(values.categories || []);
            await onSave(categoriesToSave as Category[]);
            antdMessage.success("Lưu danh mục thành công");
        } catch (error) {
            console.error("Save failed:", error);
            antdMessage.error("Có lỗi xảy ra khi lưu danh mục");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Form form={form} layout="vertical" initialValues={initialValues}>
            <div className="max-h-[600px] overflow-y-auto pr-2">
                <Form.List name="categories">
                    {(fields, { add, remove }) => (
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <CategoryFormListItem
                                    key={field.key}
                                    field={field}
                                    index={index}
                                    remove={remove}
                                    allCategories={categories}
                                />
                            ))}
                            <Button
                                type="dashed"
                                onClick={() => add({ code: genCode("CAT_") })}
                                block
                                icon={<PlusOutlined />}
                            >
                                Thêm danh mục gốc
                            </Button>
                        </div>
                    )}
                </Form.List>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                <Button onClick={() => form.resetFields()}>Đặt lại</Button>
                <Button type="primary" onClick={handleSave} loading={saving}>
                    Lưu tất cả
                </Button>
            </div>
        </Form>
    );
};

// Category Form List Item Component (nested)
interface CategoryFormListItemProps {
    field: any;
    index: number;
    remove: (index: number) => void;
    allCategories: Category[];
}

const CategoryFormListItem: React.FC<CategoryFormListItemProps> = ({
    field,
    index,
    remove,
    allCategories,
}) => {
    return (
        <Card
            size="small"
            className="mb-4"
            title={
                <div className="flex items-center justify-between">
                    <Text strong>Danh mục cấp {index + 1}</Text>
                    <Button
                        danger
                        size="small"
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(field.name)}
                    >
                        Xóa
                    </Button>
                </div>
            }
        >
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item
                        {...field}
                        name={[field.name, "code"]}
                        label="Mã danh mục"
                    >
                        <Input placeholder="Tự động" disabled />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        {...field}
                        name={[field.name, "name"]}
                        label="Tên danh mục"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập tên danh mục",
                            },
                        ]}
                    >
                        <Input placeholder="VD: Da bò, Chỉ may..." />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        {...field}
                        name={[field.name, "color"]}
                        label="Màu hiển thị"
                        initialValue="default"
                    >
                        <Select options={colorOptions} />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        {...field}
                        name={[field.name, "description"]}
                        label="Mô tả"
                    >
                        <Input.TextArea rows={2} placeholder="Nhập mô tả..." />
                    </Form.Item>
                </Col>
            </Row>

            {/* Nested children Form.List */}
            <Form.Item {...field} name={[field.name, "children"]}>
                <Form.List name={[field.name, "children"]}>
                    {(childFields, { add: addChild, remove: removeChild }) => (
                        <div className="ml-6 mt-4 space-y-4 border-l-2 border-gray-200 pl-4">
                            {childFields.map((childField, childIndex) => (
                                <Card
                                    key={childField.key}
                                    size="small"
                                    className="mb-2"
                                    title={
                                        <div className="flex items-center justify-between">
                                            <Text type="secondary">
                                                Danh mục con {childIndex + 1}
                                            </Text>
                                            <Button
                                                danger
                                                size="small"
                                                icon={<MinusCircleOutlined />}
                                                onClick={() =>
                                                    removeChild(childField.name)
                                                }
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    }
                                >
                                    <Row gutter={16}>
                                        <Col span={24}>
                                            <Form.Item
                                                {...childField}
                                                name={[childField.name, "code"]}
                                                label="Mã danh mục"
                                            >
                                                <Input
                                                    placeholder="Tự động"
                                                    disabled
                                                    size="small"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                {...childField}
                                                name={[childField.name, "name"]}
                                                label="Tên danh mục"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            "Vui lòng nhập tên danh mục",
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder="VD: Da bò, Chỉ may..."
                                                    size="small"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                {...childField}
                                                name={[
                                                    childField.name,
                                                    "color",
                                                ]}
                                                label="Màu hiển thị"
                                                initialValue="default"
                                            >
                                                <Select
                                                    options={colorOptions}
                                                    size="small"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                {...childField}
                                                name={[
                                                    childField.name,
                                                    "description",
                                                ]}
                                                label="Mô tả"
                                            >
                                                <Input.TextArea
                                                    rows={2}
                                                    placeholder="Nhập mô tả..."
                                                    size="small"
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* Level 3: Grandchildren */}
                                    <Form.Item
                                        {...childField}
                                        name={[childField.name, "children"]}
                                    >
                                        <Form.List
                                            name={[childField.name, "children"]}
                                        >
                                            {(
                                                grandchildFields,
                                                {
                                                    add: addGrandchild,
                                                    remove: removeGrandchild,
                                                },
                                            ) => (
                                                <div className="ml-6 mt-4 space-y-4 border-l-2 border-gray-300 pl-4">
                                                    {grandchildFields.map(
                                                        (
                                                            grandchildField,
                                                            grandchildIndex,
                                                        ) => (
                                                            <Card
                                                                key={
                                                                    grandchildField.key
                                                                }
                                                                size="small"
                                                                className="mb-2"
                                                                title={
                                                                    <div className="flex items-center justify-between">
                                                                        <Text
                                                                            type="secondary"
                                                                            className="text-xs"
                                                                        >
                                                                            Danh
                                                                            mục
                                                                            cháu{" "}
                                                                            {grandchildIndex +
                                                                                1}
                                                                        </Text>
                                                                        <Button
                                                                            danger
                                                                            size="small"
                                                                            icon={
                                                                                <MinusCircleOutlined />
                                                                            }
                                                                            onClick={() =>
                                                                                removeGrandchild(
                                                                                    grandchildField.name,
                                                                                )
                                                                            }
                                                                        >
                                                                            Xóa
                                                                        </Button>
                                                                    </div>
                                                                }
                                                            >
                                                                <Row
                                                                    gutter={16}
                                                                >
                                                                    <Col
                                                                        span={
                                                                            24
                                                                        }
                                                                    >
                                                                        <Form.Item
                                                                            {...grandchildField}
                                                                            name={[
                                                                                grandchildField.name,
                                                                                "code",
                                                                            ]}
                                                                            label="Mã danh mục"
                                                                        >
                                                                            <Input
                                                                                placeholder="Tự động"
                                                                                disabled
                                                                                size="small"
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col
                                                                        span={
                                                                            12
                                                                        }
                                                                    >
                                                                        <Form.Item
                                                                            {...grandchildField}
                                                                            name={[
                                                                                grandchildField.name,
                                                                                "name",
                                                                            ]}
                                                                            label="Tên danh mục"
                                                                            rules={[
                                                                                {
                                                                                    required: true,
                                                                                    message:
                                                                                        "Vui lòng nhập tên danh mục",
                                                                                },
                                                                            ]}
                                                                        >
                                                                            <Input
                                                                                placeholder="VD: Da bò, Chỉ may..."
                                                                                size="small"
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col
                                                                        span={
                                                                            12
                                                                        }
                                                                    >
                                                                        <Form.Item
                                                                            {...grandchildField}
                                                                            name={[
                                                                                grandchildField.name,
                                                                                "color",
                                                                            ]}
                                                                            label="Màu hiển thị"
                                                                            initialValue="default"
                                                                        >
                                                                            <Select
                                                                                options={
                                                                                    colorOptions
                                                                                }
                                                                                size="small"
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col
                                                                        span={
                                                                            24
                                                                        }
                                                                    >
                                                                        <Form.Item
                                                                            {...grandchildField}
                                                                            name={[
                                                                                grandchildField.name,
                                                                                "description",
                                                                            ]}
                                                                            label="Mô tả"
                                                                        >
                                                                            <Input.TextArea
                                                                                rows={
                                                                                    2
                                                                                }
                                                                                placeholder="Nhập mô tả..."
                                                                                size="small"
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                </Row>
                                                            </Card>
                                                        ),
                                                    )}
                                                    <Button
                                                        type="dashed"
                                                        size="small"
                                                        onClick={() =>
                                                            addGrandchild({
                                                                code: genCode(
                                                                    "CAT_",
                                                                ),
                                                            })
                                                        }
                                                        block
                                                        icon={<PlusOutlined />}
                                                    >
                                                        Thêm danh mục cháu
                                                    </Button>
                                                </div>
                                            )}
                                        </Form.List>
                                    </Form.Item>
                                </Card>
                            ))}
                            <Button
                                type="dashed"
                                size="small"
                                onClick={() =>
                                    addChild({ code: genCode("CAT_") })
                                }
                                block
                                icon={<PlusOutlined />}
                            >
                                Thêm danh mục con
                            </Button>
                        </div>
                    )}
                </Form.List>
            </Form.Item>
        </Card>
    );
};

export default function CategoryManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
        null,
    );
    const [parentCodeForNew, setParentCodeForNew] = useState<string | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const { message: antdMessage } = App.useApp();
    const { query, applyFilter } = useFilter();

    // Load categories
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const categoriesData = await CategoryService.getAll();
                setCategories(categoriesData);
            } catch (error) {
                console.error("Error loading data:", error);
                antdMessage.error("Không thể tải dữ liệu");
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // Subscribe to real-time updates
        const unsubscribe = CategoryService.onSnapshot((categoriesData) => {
            setCategories(categoriesData);
        });

        return () => unsubscribe();
    }, [antdMessage]);

    // Build tree structure
    const categoryTree = useMemo(() => {
        return buildCategoryTree(categories);
    }, [categories]);

    const filteredCategories = applyFilter(categories);

    // Handle bulk save
    const handleBulkSave = async (categoriesToSave: Category[]) => {
        try {
            const existingCodes = new Set(categories.map((c) => c.code));
            const newCodes = new Set(
                categoriesToSave
                    .map((c) => c.code)
                    .filter((code) => code && existingCodes.has(code)),
            );

            // Delete categories that are no longer in the form
            for (const cat of categories) {
                if (!newCodes.has(cat.code)) {
                    await CategoryService.delete(cat.code);
                }
            }

            // Update or create categories
            for (const cat of categoriesToSave) {
                if (cat.code && existingCodes.has(cat.code)) {
                    // Update existing
                    await CategoryService.update(cat.code, {
                        name: cat.name,
                        description: cat.description,
                        color: cat.color,
                        parentCode: cat.parentCode,
                    });
                } else {
                    // Create new
                    await CategoryService.create({
                        code: cat.code || genCode("CAT_"),
                        name: cat.name,
                        description: cat.description,
                        color: cat.color,
                        parentCode: cat.parentCode,
                    });
                }
            }

            setIsBulkEditModalOpen(false);
        } catch (error) {
            console.error("Bulk save failed:", error);
            throw error;
        }
    };

    // Handle create
    const handleCreate = async () => {
        try {
            const values = await createForm.validateFields();
            const categoryData: Omit<Category, "createdAt" | "updatedAt"> = {
                name: values.name,
                code: genCode("CAT_"),
                color: values.color || "default",
                parentCode: parentCodeForNew || undefined,
            };

            if (values.description && values.description.trim() !== "") {
                categoryData.description = values.description.trim();
            }

            await CategoryService.create(categoryData);
            antdMessage.success("Tạo danh mục thành công");
            setIsCreateModalOpen(false);
            setParentCodeForNew(null);
            createForm.resetFields();
        } catch (error) {
            console.error("Create failed:", error);
        }
    };

    // Handle edit
    const handleEdit = async () => {
        if (!selectedCategory) return;

        try {
            const values = await editForm.validateFields();
            const updateData: Partial<Omit<Category, "code" | "createdAt">> = {
                name: values.name,
                color: values.color || "default",
                parentCode: values.parentCode || undefined,
            };

            if (values.description !== undefined) {
                if (values.description && values.description.trim() !== "") {
                    updateData.description = values.description.trim();
                } else {
                    updateData.description = "";
                }
            }

            await CategoryService.update(selectedCategory.code, updateData);
            antdMessage.success("Cập nhật danh mục thành công");
            setIsEditModalOpen(false);
            setSelectedCategory(null);
            editForm.resetFields();
        } catch (error) {
            console.error("Update failed:", error);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!selectedCategory) return;

        // Check if category has children
        const hasChildren = categories.some(
            (cat) => cat.parentCode === selectedCategory.code,
        );

        if (hasChildren) {
            antdMessage.error(
                "Không thể xóa danh mục có danh mục con. Vui lòng xóa các danh mục con trước.",
            );
            setIsDeleteModalOpen(false);
            return;
        }

        try {
            await CategoryService.delete(selectedCategory.code);
            antdMessage.success("Xóa danh mục thành công");
            setIsDeleteModalOpen(false);
            setSelectedCategory(null);
        } catch (error) {
            console.error("Delete failed:", error);
            antdMessage.error("Không thể xóa danh mục");
        }
    };

    const handleOpenCreateModal = (parentCode?: string) => {
        setParentCodeForNew(parentCode || null);
        createForm.resetFields();
        if (parentCode) {
            createForm.setFieldsValue({ parentCode });
        }
        setIsCreateModalOpen(true);
    };

    const handleOpenEditModal = (category: Category) => {
        setSelectedCategory(category);
        editForm.setFieldsValue({
            name: category.name,
            description: category.description,
            color: category.color || "default",
            parentCode: category.parentCode,
        });
        setIsEditModalOpen(true);
    };

    // Get parent category options (excluding self and descendants)
    const getParentOptions = (excludeCode?: string) => {
        return categories
            .filter((cat) => {
                if (cat.code === excludeCode) return false;
                // Exclude descendants
                if (excludeCode) {
                    let current = cat;
                    while (current.parentCode) {
                        if (current.parentCode === excludeCode) return false;
                        current =
                            categories.find(
                                (c) => c.code === current.parentCode,
                            ) || ({} as Category);
                        if (!current.code) break;
                    }
                }
                return true;
            })
            .map((cat) => ({
                value: cat.code,
                label: cat.name,
            }));
    };

    return (
        <>
            <WrapperContent
                header={{
                    buttonBackTo: "/",
                    searchInput: {
                        placeholder: "Tìm kiếm danh mục...",
                        filterKeys: ["name", "description"],
                    },
                    buttonEnds: [
                        {
                            name: "Chỉnh sửa hàng loạt",
                            icon: <EditOutlined />,
                            type: "default",
                            can: true,
                            onClick: () => setIsBulkEditModalOpen(true),
                        },
                        {
                            name: "Thêm danh mục",
                            icon: <PlusOutlined />,
                            type: "primary",
                            can: true,
                            onClick: () => handleOpenCreateModal(),
                        },
                    ],
                }}
                isEmpty={!filteredCategories?.length}
            >
                {loading ? (
                    <div className="text-center py-8">Đang tải...</div>
                ) : categoryTree.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        Chưa có danh mục nào
                    </div>
                ) : (
                    <Collapse
                        ghost
                        items={categoryTree.map((category) => ({
                            key: category.code,
                            label: (
                                <div className="flex items-center justify-between w-full pr-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        <Tag
                                            color={category.color || "default"}
                                        >
                                            {category.name}
                                        </Tag>
                                        {category.description && (
                                            <Text
                                                type="secondary"
                                                className="text-sm"
                                            >
                                                {category.description}
                                            </Text>
                                        )}
                                        <Text
                                            type="secondary"
                                            className="text-xs font-mono"
                                        >
                                            {category.code}
                                        </Text>
                                    </div>
                                    <Space onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            size="small"
                                            type="link"
                                            icon={<PlusOutlined />}
                                            onClick={() =>
                                                handleOpenCreateModal(
                                                    category.code,
                                                )
                                            }
                                        >
                                            Thêm con
                                        </Button>
                                        <Button
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() =>
                                                handleOpenEditModal(category)
                                            }
                                        />
                                        <Button
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => {
                                                setSelectedCategory(category);
                                                setIsDeleteModalOpen(true);
                                            }}
                                        />
                                    </Space>
                                </div>
                            ),
                            children:
                                category.children &&
                                category.children.length > 0 ? (
                                    <div className="ml-4 mt-2">
                                        <Collapse
                                            ghost
                                            items={category.children.map(
                                                (child) => ({
                                                    key: child.code,
                                                    label: (
                                                        <div className="flex items-center justify-between w-full pr-4">
                                                            <div className="flex items-center gap-3 flex-1">
                                                                <Tag
                                                                    color={
                                                                        child.color ||
                                                                        "default"
                                                                    }
                                                                >
                                                                    {child.name}
                                                                </Tag>
                                                                {child.description && (
                                                                    <Text
                                                                        type="secondary"
                                                                        className="text-sm"
                                                                    >
                                                                        {
                                                                            child.description
                                                                        }
                                                                    </Text>
                                                                )}
                                                                <Text
                                                                    type="secondary"
                                                                    className="text-xs font-mono"
                                                                >
                                                                    {child.code}
                                                                </Text>
                                                            </div>
                                                            <Space
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <Button
                                                                    size="small"
                                                                    type="link"
                                                                    icon={
                                                                        <PlusOutlined />
                                                                    }
                                                                    onClick={() =>
                                                                        handleOpenCreateModal(
                                                                            child.code,
                                                                        )
                                                                    }
                                                                >
                                                                    Thêm con
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    icon={
                                                                        <EditOutlined />
                                                                    }
                                                                    onClick={() =>
                                                                        handleOpenEditModal(
                                                                            child,
                                                                        )
                                                                    }
                                                                />
                                                                <Button
                                                                    size="small"
                                                                    danger
                                                                    icon={
                                                                        <DeleteOutlined />
                                                                    }
                                                                    onClick={() => {
                                                                        setSelectedCategory(
                                                                            child,
                                                                        );
                                                                        setIsDeleteModalOpen(
                                                                            true,
                                                                        );
                                                                    }}
                                                                />
                                                            </Space>
                                                        </div>
                                                    ),
                                                    children:
                                                        child.children &&
                                                        child.children.length >
                                                            0 ? (
                                                            <div className="ml-4 mt-2">
                                                                <Collapse
                                                                    ghost
                                                                    items={child.children.map(
                                                                        (
                                                                            grandchild,
                                                                        ) => ({
                                                                            key: grandchild.code,
                                                                            label: (
                                                                                <div className="flex items-center justify-between w-full pr-4">
                                                                                    <div className="flex items-center gap-3 flex-1">
                                                                                        <Tag
                                                                                            color={
                                                                                                grandchild.color ||
                                                                                                "default"
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                grandchild.name
                                                                                            }
                                                                                        </Tag>
                                                                                        {grandchild.description && (
                                                                                            <Text
                                                                                                type="secondary"
                                                                                                className="text-sm"
                                                                                            >
                                                                                                {
                                                                                                    grandchild.description
                                                                                                }
                                                                                            </Text>
                                                                                        )}
                                                                                        <Text
                                                                                            type="secondary"
                                                                                            className="text-xs font-mono"
                                                                                        >
                                                                                            {
                                                                                                grandchild.code
                                                                                            }
                                                                                        </Text>
                                                                                    </div>
                                                                                    <Space
                                                                                        onClick={(
                                                                                            e,
                                                                                        ) =>
                                                                                            e.stopPropagation()
                                                                                        }
                                                                                    >
                                                                                        <Button
                                                                                            size="small"
                                                                                            icon={
                                                                                                <EditOutlined />
                                                                                            }
                                                                                            onClick={() =>
                                                                                                handleOpenEditModal(
                                                                                                    grandchild,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                        <Button
                                                                                            size="small"
                                                                                            danger
                                                                                            icon={
                                                                                                <DeleteOutlined />
                                                                                            }
                                                                                            onClick={() => {
                                                                                                setSelectedCategory(
                                                                                                    grandchild,
                                                                                                );
                                                                                                setIsDeleteModalOpen(
                                                                                                    true,
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                    </Space>
                                                                                </div>
                                                                            ),
                                                                        }),
                                                                    )}
                                                                />
                                                            </div>
                                                        ) : null,
                                                }),
                                            )}
                                        />
                                    </div>
                                ) : null,
                        }))}
                    />
                )}
            </WrapperContent>

            {/* Bulk Edit Modal with Nested Form.List */}
            <Modal
                title="Chỉnh sửa hàng loạt danh mục"
                open={isBulkEditModalOpen}
                onCancel={() => setIsBulkEditModalOpen(false)}
                footer={null}
                width={1200}
                destroyOnClose
            >
                <NestedCategoryForm
                    categories={categories}
                    onSave={handleBulkSave}
                />
            </Modal>

            {/* Create Category Modal */}
            <Modal
                title={
                    parentCodeForNew ? "Thêm danh mục con" : "Thêm danh mục mới"
                }
                open={isCreateModalOpen}
                onOk={handleCreate}
                onCancel={() => {
                    setIsCreateModalOpen(false);
                    setParentCodeForNew(null);
                    createForm.resetFields();
                }}
                width={700}
                okText="Tạo"
                cancelText="Hủy"
                destroyOnClose
            >
                <Form form={createForm} layout="vertical" className="mt-4">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                name="name"
                                label="Tên danh mục"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập tên danh mục",
                                    },
                                ]}
                            >
                                <Input placeholder="VD: Da bò, Chỉ may, Xi mạ..." />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="parentCode"
                                label="Danh mục cha"
                                initialValue={parentCodeForNew || undefined}
                            >
                                <Select
                                    placeholder="Chọn danh mục cha (để trống nếu là danh mục gốc)"
                                    allowClear
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? "")
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    options={getParentOptions()}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="description" label="Mô tả">
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Nhập mô tả cho danh mục..."
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="color"
                                label="Màu hiển thị"
                                initialValue="default"
                            >
                                <Select
                                    placeholder="Chọn màu hiển thị"
                                    options={colorOptions}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Edit Category Modal */}
            <Modal
                title="Chỉnh sửa danh mục"
                open={isEditModalOpen}
                onOk={handleEdit}
                onCancel={() => {
                    setIsEditModalOpen(false);
                    setSelectedCategory(null);
                    editForm.resetFields();
                }}
                width={700}
                okText="Cập nhật"
                cancelText="Hủy"
                destroyOnClose
            >
                <Form form={editForm} layout="vertical" className="mt-4">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                name="name"
                                label="Tên danh mục"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập tên danh mục",
                                    },
                                ]}
                            >
                                <Input placeholder="VD: Da bò, Chỉ may, Xi mạ..." />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="parentCode" label="Danh mục cha">
                                <Select
                                    placeholder="Chọn danh mục cha (để trống nếu là danh mục gốc)"
                                    allowClear
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? "")
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    options={getParentOptions(
                                        selectedCategory?.code,
                                    )}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="description" label="Mô tả">
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Nhập mô tả cho danh mục..."
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="color" label="Màu hiển thị">
                                <Select
                                    placeholder="Chọn màu hiển thị"
                                    options={colorOptions}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                title="Xác nhận xóa"
                open={isDeleteModalOpen}
                onOk={handleDelete}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedCategory(null);
                }}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                destroyOnClose
            >
                <p>
                    Bạn có chắc chắn muốn xóa danh mục{" "}
                    <strong>{selectedCategory?.name}</strong>? Hành động này
                    không thể hoàn tác.
                </p>
            </Modal>
        </>
    );
}
