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

interface WorkflowTemplateManagerProps {
  employees: Staff[];
}

export default function WorkflowTemplateManager({
  employees,
}: WorkflowTemplateManagerProps) {
  const firebaseApp = useFirebaseApp();
  const { data: workflows, isLoading } =
    useRealtimeList<Omit<Stage, "id">>("workflows");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Stage | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // ========== HANDLERS ==========

  const handleOpenModal = (workflow?: Stage) => {
    if (workflow) {
      setEditingWorkflow(workflow);
      form.setFieldsValue({
        name: workflow.name,
        defaultStaff: workflow.defaultStaff || [],
        order: workflow.order || 0,
      });
    } else {
      setEditingWorkflow(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWorkflow(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingWorkflow) {
        // Update existing workflow
        await updateStage(firebaseApp, editingWorkflow.id, values);
        message.success("Cập nhật workflow thành công!");
      } else {
        // Create new workflow
        await createStage(firebaseApp, values);
        message.success("Tạo workflow mới thành công!");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error submitting workflow:", error);
      message.error("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (workflowId: string) => {
    try {
      await deleteStage(firebaseApp, workflowId);
      message.success("Xóa workflow thành công!");
    } catch (error) {
      console.error("Error deleting workflow:", error);
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
      dataIndex: "defaultEmployees",
      key: "defaultEmployees",
      render: (employeeIds: string[] = []) => (
        <Space wrap>
          {employeeIds.length > 0 ? (
            employeeIds.map((empId) => {
              const employee = employees.find((e) => e.id === empId);
              return (
                <Tag key={empId} color="green">
                  {employee?.name || empId}
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
        dataSource={workflows || []}
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
        title={editingWorkflow ? "Chỉnh sửa công đoạn" : "Thêm công đoạn mới"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={submitting}
        width={600}
        okText={editingWorkflow ? "Cập nhật" : "Tạo mới"}
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
            name="defaultEmployees"
            label="Nhân viên mặc định"
            help="Những nhân viên này sẽ tự động được gán khi tạo đơn hàng mới"
          >
            <Select
              mode="multiple"
              placeholder="Chọn nhân viên..."
              size="large"
              options={employees.map((emp) => ({
                label: `${emp.name} (${emp.role})`,
                value: emp.id,
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
