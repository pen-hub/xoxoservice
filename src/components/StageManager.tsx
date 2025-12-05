"use client";

import { useFirebaseApp } from "@/firebase";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import {
  createStage,
  deleteStage,
  updateStage,
} from "@/services/workflowService";
import type { Staff, Stage } from "@/types/workflow";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";

interface StageManagerProps {
  staff: Staff[];
}

export default function StageManager({ staff }: StageManagerProps) {
  const firebaseApp = useFirebaseApp();
  const { data: stages, isLoading } =
    useRealtimeList<Omit<Stage, "id">>("xoxo/stages");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // ========== HANDLERS ==========

  const handleOpenModal = (stage?: Stage) => {
    if (stage) {
      setEditingStage(stage);
      form.setFieldsValue({
        name: stage.name,
        defaultStaff: stage.defaultStaff || [],
        order: stage.order || 0,
      });
    } else {
      setEditingStage(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStage(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingStage) {
        await updateStage(firebaseApp, editingStage.id, values);
        message.success("Cập nhật công đoạn thành công!");
      } else {
        await createStage(firebaseApp, values);
        message.success("Tạo công đoạn mới thành công!");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error submitting stage:", error);
      message.error("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (stageId: string) => {
    try {
      await deleteStage(firebaseApp, stageId);
      message.success("Xóa công đoạn thành công!");
    } catch (error) {
      console.error("Error deleting stage:", error);
      message.error("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  // ========== TABLE COLUMNS ==========

  const columns: ColumnsType<Stage> = [
    {
      title: "Thứ tự",
      dataIndex: "order",
      key: "order",
      width: 80,
      align: "center",
      render: (order) => <Tag color="blue">{order || 0}</Tag>,
    },
    {
      title: "Tên công đoạn",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span className="font-semibold text-gray-800">{name}</span>
      ),
    },
    {
      title: "Nhân viên mặc định",
      dataIndex: "defaultStaff",
      key: "defaultStaff",
      render: (staffIds: string[] = []) => (
        <Space wrap>
          {staffIds.length > 0 ? (
            staffIds.map((staffId) => {
              const staffMember = staff.find((s) => s.id === staffId);
              return (
                <Tag key={staffId} color="green">
                  {staffMember?.name || staffId}
                </Tag>
              );
            })
          ) : (
            <span className="text-gray-400">Chưa có</span>
          )}
        </Space>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (timestamp) =>
        timestamp ? new Date(timestamp).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa công đoạn này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Quản lý công đoạn sản xuất
          </h2>
          <p className="text-gray-500 mt-1">
            Định nghĩa các bước công việc trong quy trình sản xuất
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
          size="large"
        >
          Thêm công đoạn
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={stages || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} công đoạn`,
        }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingStage ? "Chỉnh sửa công đoạn" : "Thêm công đoạn mới"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={submitting}
        width={600}
        okText={editingStage ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Tên công đoạn"
            rules={[
              { required: true, message: "Vui lòng nhập tên công đoạn!" },
            ]}
          >
            <Input placeholder="VD: Cắt vải, May, Đóng gói..." size="large" />
          </Form.Item>

          <Form.Item
            name="order"
            label="Thứ tự"
            rules={[{ required: true, message: "Vui lòng nhập thứ tự!" }]}
            initialValue={0}
          >
            <Input type="number" min={0} size="large" />
          </Form.Item>

          <Form.Item
            name="defaultStaff"
            label="Nhân viên mặc định"
            help="Những nhân viên này sẽ tự động được gán khi tạo đơn hàng mới"
          >
            <Select
              mode="multiple"
              placeholder="Chọn nhân viên..."
              size="large"
              options={staff.map((s) => ({
                label: `${s.name} (${s.role})`,
                value: s.id,
              }))}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
