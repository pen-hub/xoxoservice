"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import { FilterList } from "@/components/FilterList";
import useFilter from "@/hooks/useFilter";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DepartmentService, IDepartment } from "@/services/departmentService";
import { IWorkflow, WorkflowCRUDService } from "@/services/workflowCRUDService";
import { genCode } from "@/utils/genCode";
import {
  ClearOutlined,
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

// Workflow Details Drawer Component
const WorkflowDetails: React.FC<PropRowDetails<IWorkflow>> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Thông tin công đoạn</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <span className="font-medium">Mã:</span>
            <p className="text-gray-600">{data.code}</p>
          </div>
          <div>
            <span className="font-medium">Tên:</span>
            <p className="text-gray-600">{data.name}</p>
          </div>
          <div>
            <span className="font-medium">Phòng ban:</span>
            <p className="text-gray-600">{data.department}</p>
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

// Workflow Form Component
interface WorkflowFormProps {
  workflow?: IWorkflow;
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const WorkflowForm: React.FC<WorkflowFormProps> = ({
  workflow,
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const { message } = App.useApp();

  // Load departments
  useEffect(() => {
    const unsubscribe = DepartmentService.onSnapshot((data) => {
      setDepartments(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (workflow && visible) {
      form.resetFields();

      form.setFieldsValue({
        ...workflow,
      });
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({
        code: genCode("WF_"),
      });
    }
  }, [workflow, visible, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (workflow?.code) {
        await WorkflowCRUDService.update(workflow.code, values);
        message.success("Cập nhật công đoạn thành công!");
      } else {
        await WorkflowCRUDService.create(values);
        message.success("Thêm công đoạn thành công!");
      }

      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Error saving workflow:", error);
      message.error("Có lỗi xảy ra khi lưu workflow!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={workflow ? "Chỉnh sửa công đoạn" : "Thêm công đoạn mới"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={workflow ? "Mã" : "Mã (Tự động tạo)"}
          name="code"
          rules={[{ required: true, message: "Vui lòng nhập mã công đoạn!" }]}
        >
          <Input placeholder="Nhập mã" disabled />
        </Form.Item>

        <Form.Item
          label="Tên"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
        >
          <Input placeholder="Nhập tên (VD: Vệ sinh da, Sơn móng, ...)" />
        </Form.Item>

        <Form.Item
          label="Phòng ban thực hiện"
          name="department"
          rules={[{ required: true, message: "Vui lòng chọn phòng ban!" }]}
        >
          <Select
            placeholder="Chọn phòng ban thực hiện"
            allowClear
            options={departments.map((dept) => ({
              label: dept.name,
              value: dept.code,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Main Workflow Page Component
const WorkflowPage = () => {
  const [workflows, setWorkflows] = useState<IWorkflow[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterForm] = Form.useForm();
  const isMobile = useIsMobile();
  const [editingWorkflow, setEditingWorkflow] = useState<
    IWorkflow | undefined
  >();
  const { message } = App.useApp();
  const { query, applyFilter, updateQueries, reset } = useFilter();
  const filteredWorkflows = applyFilter(workflows);

  // Load data
  useEffect(() => {
    const unsubscribeWorkflows = WorkflowCRUDService.onSnapshot((data) => {
      setWorkflows(data);
      setLoading(false);
    });

    const unsubscribeDepartments = DepartmentService.onSnapshot((data) => {
      setDepartments(data);
    });

    return () => {
      unsubscribeWorkflows();
      unsubscribeDepartments();
    };
  }, []);

  // Sync filter form values with query when filter drawer opens
  useEffect(() => {
    if (filterVisible) {
      filterForm.setFieldsValue(query);
    }
  }, [filterVisible, query, filterForm]);

  const handleDelete = async (code: string) => {
    try {
      await WorkflowCRUDService.delete(code);
      message.success("Xóa công đoạn thành công!");
    } catch (error) {
      console.error("Error deleting công đoạn:", error);
      message.error("Có lỗi xảy ra khi xóa công đoạn!");
    }
  };

  const columns: TableColumnsType<IWorkflow> = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      sorter: true,
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Phòng ban",
      dataIndex: "department",
      key: "department",
      render: (departmentCode: string) => {
        const dept = departments.find((d) => d.code === departmentCode);
        return dept?.name || departmentCode;
      },
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
              setEditingWorkflow(record);
              setFormVisible(true);
            }}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa công đoạn này?"
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
        <div>
          <h2 className="text-xl font-semibold">Danh sách quy trình</h2>
          <p className="text-gray-500 text-sm mt-1">
            Hiển thị: {filteredWorkflows.length} / {workflows.length} quy trình
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterVisible(true)}
          >
            Bộ lọc
          </Button>
          {Object.keys(query).length > 0 && (
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                reset();
                filterForm.resetFields();
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingWorkflow(undefined);
              setFormVisible(true);
            }}
          >
            Thêm công đoạn
          </Button>
        </div>
      </div>

      <Drawer
        title="Bộ lọc"
        placement="right"
        onClose={() => setFilterVisible(false)}
        open={filterVisible}
        width={isMobile ? "100%" : 400}
      >
        <FilterList
          form={filterForm}
          isMobile={isMobile}
          fields={[
            {
              label: "Phòng ban",
              name: "department",
              type: "select",
              options: departments.map((dept) => ({
                label: dept.name,
                value: dept.code,
              })),
            },
          ]}
          onApplyFilter={(params) => {
            updateQueries(params);
            setFilterVisible(false);
          }}
          onReset={() => {
            reset();
            filterForm.resetFields();
          }}
          onCancel={() => setFilterVisible(false)}
        />
      </Drawer>

      <CommonTable
        rowKey="code"
        dataSource={filteredWorkflows}
        columns={columns}
        loading={loading}
        DrawerDetails={WorkflowDetails}
        paging={true}
        rank={true}
      />

      <WorkflowForm
        workflow={editingWorkflow}
        visible={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingWorkflow(undefined);
        }}
        onSuccess={() => {
          // Data will be updated through realtime listener
        }}
      />
    </div>
  );
};

export default WorkflowPage;
