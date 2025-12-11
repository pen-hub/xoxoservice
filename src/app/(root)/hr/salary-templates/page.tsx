"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { SalaryService } from "@/services/salaryService";
import { SalaryTemplate, SalaryType } from "@/types/salary";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
} from "antd";
import { useEffect, useState } from "react";

const { Option } = Select;

// Template Details Component
const TemplateDetails: React.FC<PropRowDetails<SalaryTemplate>> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  const getSalaryTypeLabel = (type: SalaryType) => {
    switch (type) {
      case SalaryType.FIXED:
        return "Cố định";
      case SalaryType.BY_SHIFT:
        return "Theo ca làm việc";
      case SalaryType.BY_HOUR:
        return "Theo giờ làm việc";
      case SalaryType.BY_DAY:
        return "Theo ngày công chuẩn";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Chi tiết mẫu lương</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <span className="font-medium">Tên mẫu:</span>
            <p className="text-gray-600">{data.name}</p>
          </div>
          <div>
            <span className="font-medium">Loại lương:</span>
            <p className="text-gray-600">
              {getSalaryTypeLabel(data.salaryType)}
            </p>
          </div>
          <div>
            <span className="font-medium">Mức lương:</span>
            <p className="text-gray-600">
              {data.salaryAmount?.toLocaleString("vi-VN")} VNĐ
            </p>
          </div>
          <div>
            <span className="font-medium">Phần trăm triết khấu:</span>
            <p className="text-gray-600">{data.bonusPercentage ?? 0}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Template Form Component
interface TemplateFormProps {
  template?: SalaryTemplate;
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (template && visible) {
      form.setFieldsValue({
        name: template.name,
        salaryType: template.salaryType,
        salaryAmount: template.salaryAmount,
        bonusPercentage: template.bonusPercentage ?? 0,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        salaryType: SalaryType.FIXED,
        bonusPercentage: 0,
      });
    }
  }, [template, visible, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const templateData = {
        name: values.name,
        salaryType: values.salaryType,
        salaryAmount: values.salaryAmount,
        bonusPercentage: values.bonusPercentage ?? 0,
      };

      if (template?.id) {
        await SalaryService.updateTemplate(template.id, templateData);
        message.success("Cập nhật mẫu lương thành công!");
      } else {
        await SalaryService.createTemplate(templateData);
        message.success("Tạo mẫu lương thành công!");
      }

      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Error saving template:", error);
      message.error("Có lỗi xảy ra khi lưu mẫu lương!");
    } finally {
      setLoading(false);
    }
  };

  const salaryTypeOptions = [
    { label: "Cố định", value: SalaryType.FIXED },
    { label: "Theo ca làm việc", value: SalaryType.BY_SHIFT },
    { label: "Theo giờ làm việc", value: SalaryType.BY_HOUR },
    { label: "Theo ngày công chuẩn", value: SalaryType.BY_DAY },
  ];

  return (
    <Modal
      title={template ? "Cập nhật mẫu lương" : "Tạo mẫu lương mới"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={template ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          label="Tên mẫu lương"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên mẫu lương!" }]}
        >
          <Input placeholder="VD: Nhân viên Sales - Cố định + Thưởng" />
        </Form.Item>

        <Form.Item
          label="Loại lương"
          name="salaryType"
          rules={[{ required: true, message: "Vui lòng chọn loại lương!" }]}
          initialValue={SalaryType.FIXED}
        >
          <Select placeholder="Chọn loại lương" options={salaryTypeOptions} />
        </Form.Item>

        <Form.Item
          label="Mức lương"
          name="salaryAmount"
          rules={[
            { required: true, message: "Vui lòng nhập mức lương!" },
            {
              type: "number",
              min: 0,
              message: "Mức lương phải lớn hơn 0!",
            },
          ]}
        >
          <InputNumber
            placeholder="Nhập mức lương"
            style={{ width: "100%" }}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => Number(value?.replace(/,/g, "") || 0) as any}
            addonAfter="VNĐ"
          />
        </Form.Item>

        <Form.Item
          label="Phần trăm triết khấu (%)"
          name="bonusPercentage"
          rules={[
            { required: true, message: "Vui lòng nhập phần trăm triết khấu!" },
            {
              type: "number",
              min: 0,
              max: 100,
              message: "Phần trăm triết khấu phải từ 0 đến 100!",
            },
          ]}
          initialValue={0}
        >
          <InputNumber
            placeholder="Nhập phần trăm triết khấu"
            style={{ width: "100%" }}
            min={0}
            max={100}
            formatter={(value) => `${value}%`}
            parser={(value) => Number(value?.replace("%", "") || 0) as any}
            step={0.1}
            precision={1}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Main Salary Templates Page Component
const SalaryTemplatesPage = () => {
  const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<
    SalaryTemplate | undefined
  >();
  const { message } = App.useApp();
  const { query, applyFilter, updateQueries, reset } = useFilter();
  const filteredTemplates = applyFilter(templates);

  // Load data
  useEffect(() => {
    const unsubscribe = SalaryService.onTemplatesSnapshot((data) => {
      // Sort by createdAt desc (newest first)
      const sorted = [...data].sort((a, b) => {
        const aTime = a.createdAt || 0;
        const bTime = b.createdAt || 0;
        return bTime - aTime;
      });
      setTemplates(sorted);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await SalaryService.deleteTemplate(id);
      message.success("Xóa mẫu lương thành công!");
    } catch (error) {
      console.error("Error deleting template:", error);
      message.error("Có lỗi xảy ra khi xóa mẫu lương!");
    }
  };

  const getSalaryTypeLabel = (type: SalaryType) => {
    switch (type) {
      case SalaryType.FIXED:
        return "Cố định";
      case SalaryType.BY_SHIFT:
        return "Theo ca làm việc";
      case SalaryType.BY_HOUR:
        return "Theo giờ làm việc";
      case SalaryType.BY_DAY:
        return "Theo ngày công chuẩn";
      default:
        return type;
    }
  };

  const columns: TableColumnsType<SalaryTemplate> = [
    {
      title: "Tên mẫu",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Loại lương",
      dataIndex: "salaryType",
      key: "salaryType",
      render: (type: SalaryType) => getSalaryTypeLabel(type),
    },
    {
      title: "Mức lương",
      dataIndex: "salaryAmount",
      key: "salaryAmount",
      render: (amount: number) =>
        amount ? `${amount.toLocaleString("vi-VN")} VNĐ` : "-",
    },
    {
      title: "Phần trăm triết khấu",
      dataIndex: "bonusPercentage",
      key: "bonusPercentage",
      render: (percentage: number) => `${percentage ?? 0}%`,
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
              setEditingTemplate(record);
              setFormVisible(true);
            }}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa mẫu lương này? Tất cả nhân viên đang sử dụng mẫu này sẽ bị ảnh hưởng."
            onConfirm={() => handleDelete(record.id)}
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
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm mẫu lương...",
          filterKeys: ["name"],
        },
        buttonEnds: [
          {
            can: true,
            type: "primary",
            name: "Thêm mẫu lương",
            icon: <PlusOutlined />,
            onClick: () => {
              setEditingTemplate(undefined);
              setFormVisible(true);
            },
          },
        ],
      }}
      isLoading={loading}
    >
      <CommonTable
        dataSource={filteredTemplates}
        columns={columns}
        loading={loading}
        DrawerDetails={TemplateDetails}
        paging={true}
        rank={true}
      />

      <TemplateForm
        template={editingTemplate}
        visible={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingTemplate(undefined);
        }}
        onSuccess={() => {
          // Data will be updated through realtime listener
        }}
      />
    </WrapperContent>
  );
};

export default SalaryTemplatesPage;

