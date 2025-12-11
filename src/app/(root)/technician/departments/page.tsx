"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import useFilter from "@/hooks/useFilter";
import { DepartmentService, IDepartment } from "@/services/departmentService";
import { genCode } from "@/utils/genCode";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { App, Button, Form, Input, Modal, Popconfirm } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

// Department Details Drawer Component
const DepartmentDetails: React.FC<PropRowDetails<IDepartment>> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Thông tin phòng ban</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <span className="font-medium">Mã phòng ban:</span>
            <p className="text-gray-600">{data.code}</p>
          </div>
          <div>
            <span className="font-medium">Tên phòng ban:</span>
            <p className="text-gray-600">{data.name}</p>
          </div>
          <div>
            <span className="font-medium">Ngày tạo:</span>
            <p className="text-gray-600">
              {data.createdAt
                ? dayjs(data.createdAt).format("DD/MM/YYYY HH:mm")
                : "N/A"}
            </p>
          </div>
          <div>
            <span className="font-medium">Cập nhật lần cuối:</span>
            <p className="text-gray-600">
              {data.updatedAt
                ? dayjs(data.updatedAt).format("DD/MM/YYYY HH:mm")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Department Form Component
interface DepartmentFormProps {
  department?: IDepartment;
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({
  department,
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (department && visible) {
      form.setFieldsValue({
        ...department,
      });
    } else if (visible) {
      form.setFieldsValue({
        code: genCode("DEPT_"),
      });
    }
  }, [department, visible, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (department?.code) {
        await DepartmentService.update(department.code, values);
        message.success("Cập nhật phòng ban thành công!");
      } else {
        await DepartmentService.create(values);
        message.success("Thêm phòng ban thành công!");
      }

      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Error saving department:", error);
      message.error("Có lỗi xảy ra khi lưu phòng ban!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={department ? "Chỉnh sửa phòng ban" : "Thêm phòng ban mới"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={department ? "Mã phòng ban" : "Mã phòng ban (Tự động tạo)"}
          name="code"
          rules={[{ required: true, message: "Vui lòng nhập mã phòng ban!" }]}
        >
          <Input placeholder="Nhập mã phòng ban" disabled />
        </Form.Item>

        <Form.Item
          label="Tên phòng ban"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên phòng ban!" }]}
        >
          <Input placeholder="Nhập tên phòng ban (VD: Phòng sản xuất, Phòng bảo trì, ...)" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Main Department Page Component
const DepartmentPage = () => {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<
    IDepartment | undefined
  >();
  const { message } = App.useApp();
  const { query, applyFilter, updateQueries, reset } = useFilter();
  const filteredDepartments = applyFilter(departments);

  // Load data
  useEffect(() => {
    const unsubscribeDepartments = DepartmentService.onSnapshot((data) => {
      setDepartments(data);
      setLoading(false);
    });

    return () => {
      unsubscribeDepartments();
    };
  }, []);

  const handleDelete = async (code: string) => {
    try {
      await DepartmentService.delete(code);
      message.success("Xóa phòng ban thành công!");
    } catch (error) {
      console.error("Error deleting department:", error);
      message.error("Có lỗi xảy ra khi xóa phòng ban!");
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      message.success("Đã copy mã phòng ban!");
    } catch (error) {
      message.error("Không thể copy mã phòng ban!");
    }
  };

  const columns: TableColumnsType<IDepartment> = [
    {
      title: "Mã phòng ban",
      dataIndex: "code",
      key: "code",
      sorter: true,
      render: (code: string) => (
        <div className="flex items-center gap-2">
          <span>{code}</span>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyCode(code)}
          />
        </div>
      ),
    },
    {
      title: "Tên phòng ban",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: number) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "N/A",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingDepartment(record);
              setFormVisible(true);
            }}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa phòng ban này?"
            onConfirm={() => handleDelete(record.code)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Danh sách phòng kỹ thuật</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingDepartment(undefined);
            setFormVisible(true);
          }}
        >
          Thêm phòng ban
        </Button>
      </div>

      <CommonTable
        rowKey="code"
        dataSource={filteredDepartments.reverse()}
        columns={columns}
        loading={loading}
        DrawerDetails={DepartmentDetails}
        paging={true}
        rank={true}
      />

      <DepartmentForm
        department={editingDepartment}
        visible={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingDepartment(undefined);
        }}
        onSuccess={() => {
          // Data will be updated through realtime listener
        }}
      />
    </div>
  );
};

export default DepartmentPage;
