"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { CategoryService } from "@/services/categoryService";
import { Category } from "@/types/category";
import { genCode } from "@/utils/genCode";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { Text } = Typography;

// Category Detail Drawer
const CategoryDetailDrawer: React.FC<PropRowDetails<Category>> = ({ data }) => {
  if (!data) return null;

  return (
    <div>
      <Space vertical size="middle" className="w-full">
        <div>
          <Text type="secondary">Mô tả:</Text>
          <div className="mt-2">
            <Text>{data.description || "Chưa có mô tả"}</Text>
          </div>
        </div>
        <div>
          <Text type="secondary">Màu hiển thị:</Text>
          <div className="mt-2">
            <Tag color={data.color || "default"}>{data.name}</Tag>
          </div>
        </div>
      </Space>
    </div>
  );
};

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
  { label: "Xanh lá biển", value: "cyan" },
];

export default function CategoryManagement() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const {
    query,
    pagination,
    updateQueries,
    reset,
    applyFilter,
    handlePageChange,
  } = useFilter();

  // Load categories
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const categoriesData = await CategoryService.getAll();
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
    const unsubscribe = CategoryService.onSnapshot((categoriesData) => {
      setCategories(categoriesData);
    });

    return () => unsubscribe();
  }, []);

  const filteredCategories = applyFilter(categories);

  // Handle create
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const categoryData: Omit<Category, "createdAt" | "updatedAt"> = {
        name: values.name,
        code: genCode("CAT_"),
        color: values.color || "default",
      };

      // Only add description if it has a value
      if (values.description && values.description.trim() !== "") {
        categoryData.description = values.description.trim();
      }

      await CategoryService.create(categoryData);
      message.success("Tạo danh mục thành công");
      setIsCreateModalOpen(false);
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
      };

      // Only add description if it has a value, or set to empty string to clear it
      if (values.description !== undefined) {
        if (values.description && values.description.trim() !== "") {
          updateData.description = values.description.trim();
        } else {
          updateData.description = "";
        }
      }

      await CategoryService.update(selectedCategory.code, updateData);
      message.success("Cập nhật danh mục thành công");
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

    try {
      await CategoryService.delete(selectedCategory.code);
      message.success("Xóa danh mục thành công");
      setIsDeleteModalOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error("Delete failed:", error);
      message.error("Không thể xóa danh mục");
    }
  };

  const columns: TableColumnsType<Category> = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 200,
      fixed: "left",
      render: (code: string, record: Category) => (
        <Text strong className="font-mono text-xs">
          {code}
        </Text>
      ),
    },
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
      width: 200,
      fixed: "left",
      render: (name: string, record: Category) => (
        <Tag color={record.color || "default"} className="text-base px-3 py-1">
          {name}
        </Tag>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 300,
      render: (description?: string) => description || "-",
    },
    {
      title: "Màu hiển thị",
      dataIndex: "color",
      key: "color",
      width: 150,
      render: (color?: string) => {
        const colorOption = colorOptions.find((opt) => opt.value === color);
        return colorOption ? colorOption.label : "Mặc định";
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_: unknown, record: Category) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCategory(record);
              editForm.setFieldsValue({
                name: record.name,
                description: record.description,
                color: record.color || "default",
              });
              setIsEditModalOpen(true);
            }}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCategory(record);
              setIsDeleteModalOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

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
              name: "Thêm danh mục",
              icon: <PlusOutlined />,
              type: "primary",
              can: true,
              onClick: () => setIsCreateModalOpen(true),
            },
          ],
        }}
        isEmpty={!filteredCategories?.length}
      >
        <CommonTable<Category>
          columns={columns}
          dataSource={filteredCategories}
          pagination={{
            ...pagination,
            onChange: handlePageChange,
          }}
          loading={loading}
          rank
          paging
          DrawerDetails={CategoryDetailDrawer}
        />
      </WrapperContent>
      {/* Create Category Modal */}
      {isCreateModalOpen && (
        <Modal
          title="Thêm danh mục mới"
          open={isCreateModalOpen}
          onOk={handleCreate}
          onCancel={() => {
            setIsCreateModalOpen(false);
            createForm.resetFields();
          }}
          width={600}
          okText="Tạo"
          cancelText="Hủy"
          destroyOnHidden
        >
          <Form form={createForm} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="name"
                  label="Tên danh mục"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên danh mục" },
                  ]}
                >
                  <Input placeholder="VD: Da bò, Chỉ may, Xi mạ..." />
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
      )}
      {/* Edit Category Modal */}
      {isEditModalOpen && (
        <Modal
          title="Chỉnh sửa danh mục"
          open={isEditModalOpen}
          onOk={handleEdit}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedCategory(null);
            editForm.resetFields();
          }}
          width={600}
          okText="Cập nhật"
          cancelText="Hủy"
          destroyOnHidden
        >
          <Form form={editForm} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="name"
                  label="Tên danh mục"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên danh mục" },
                  ]}
                >
                  <Input placeholder="VD: Da bò, Chỉ may, Xi mạ..." />
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
      )}
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
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
          destroyOnHidden
        >
          <p>
            Bạn có chắc chắn muốn xóa danh mục{" "}
            <strong>{selectedCategory?.name}</strong>? Hành động này không thể
            hoàn tác.
          </p>
        </Modal>
      )}
    </>
  );
}
