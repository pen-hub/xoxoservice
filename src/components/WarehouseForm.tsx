"use client";

// Define inline types
enum WarehouseType {
  MAIN = "main",
  BRANCH = "branch",
  TEMP = "temp",
}

interface WarehouseFormValues {
  id?: number;
  warehouseName: string;
  warehouseType: WarehouseType;
  isActive: boolean;
  branchId?: number;
}

interface WarehouseOptions {
  branches: { id: number; branchName: string }[];
}
import { Button, Form, Input, Select, Switch } from "antd";

function WarehouseForm({
  initialValues,
  branches,
  onCancel,
  onSubmit,
  loading,
}: {
  initialValues?: Partial<WarehouseFormValues>;
  branches: { id: number; branchName: string }[];
  onCancel: () => void;
  onSubmit: (v: WarehouseFormValues) => void;
  loading?: boolean;
}) {
  const [form] = Form.useForm<WarehouseFormValues>();

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={(v) => onSubmit(v as WarehouseFormValues)}
    >
      <Form.Item
        name="warehouseCode"
        label="Mã kho"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="warehouseName"
        label="Tên kho"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="warehouseType"
        label="Loại kho"
        rules={[{ required: true }]}
      >
        <Select<WarehouseType>
          options={[
            { value: WarehouseType.MAIN, label: "Kho chính" },
            { value: WarehouseType.BRANCH, label: "Kho chi nhánh" },
            { value: WarehouseType.TEMP, label: "Kho tạm" },
          ]}
        />
      </Form.Item>
      <Form.Item name="branchId" label="Chi nhánh" rules={[{ required: true }]}>
        <Select>
          {branches.map((b) => (
            <Select.Option key={b.id} value={b.id}>
              {b.branchName}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="address" label="Địa chỉ">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
        <Switch checkedChildren="Hoạt động" unCheckedChildren="Khóa" />
      </Form.Item>
      <div className="flex gap-2 justify-end">
        <Button onClick={onCancel}>Hủy</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          Lưu
        </Button>
      </div>
    </Form>
  );
}
export default WarehouseForm;
