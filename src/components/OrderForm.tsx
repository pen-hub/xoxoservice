"use client";

import { useUser } from "@/firebase/provider";
import {
  CustomerSource,
  CustomerSourceOptions,
  DiscountType,
  ROLES,
} from "@/types/enum";
import {
  OrderStatus,
  type FirebaseDepartments,
  type FirebaseOrderData,
  type FirebaseProductData,
  type FirebaseStaff,
  type FirebaseWorkflowData,
  type FirebaseWorkflows,
  type FormValues,
  type OrderFormProps,
  type ProductCardProps,
  type ProductData,
  type Workflow,
  type WorkflowData,
} from "@/types/order";
import { calculateOrderTotals } from "@/utils/calcultateOrderTotals";
import { generateRandomCode } from "@/utils/generateRandomCode";
import { getBase64 } from "@/utils/getBase64";
import { groupMembersByRole } from "@/utils/membersMapRole";
import {
  CloseOutlined,
  DeleteOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
} from "antd";
import dayjs from "dayjs";
import {
  ref as dbRef,
  getDatabase,
  off,
  onValue,
  set,
  update,
} from "firebase/database";
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { Wrench } from "lucide-react";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const { Title, Text } = Typography;
const { Option } = Select;

interface Customer {
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  customerSource: CustomerSource;
  createdAt: number;
  updatedAt: number;
}

interface FirebaseCustomers {
  [key: string]: Customer;
}

const statusOptions = [
  { value: "pending", label: "Chờ xử lý", color: "default" },
  {
    value: "confirmed",
    label: "Xác nhận",
name: "Đã xác nhận",
    color: "warning",
  },
  {
    value: "in_progress",
    label: "Thực hiện",
name: "Đang thực hiện",
    color: "processing",
  },
  {
    value: "on_hold",
    label: "Thanh toán",
name: "Chờ thanh toán",
    color: "warning",
  },
  {
    value: "completed",
    label: "Hoàn thành",
name: "Đã thanh toán",
    color: "success",
  },
  { value: "cancelled", label: "Đã hủy", color: "error" },
];

const statusSequence = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.ON_HOLD,
  OrderStatus.COMPLETED,
];

// Get available status options based on current status (prevent reverting to previous statuses)
const getAvailableStatusOptions = (currentStatus: OrderStatus) => {
  return [
    {
      value: OrderStatus.PENDING,
      label: "Chờ xử lý",
      name: "Chờ xử lý",
      color: "default",
      disabled: currentStatus !== OrderStatus.PENDING
    },
    {
      value: OrderStatus.CONFIRMED,
      label: "Đã xác nhận",
      name: "Đã xác nhận",
      color: "warning",
      disabled: statusSequence.indexOf(currentStatus) >= 1
    },
    {
      value: OrderStatus.IN_PROGRESS,
      label: "Đang thực hiện",
      name: "Đang thực hiện",
      color: "processing",
      disabled: statusSequence.indexOf(currentStatus) >= 2
    },
    {
      value: OrderStatus.ON_HOLD,
      label: "Tạm giữ",
      name: "Chờ thanh toán",
      color: "warning",
      disabled: statusSequence.indexOf(currentStatus) >= 3
    },
    {
      value: OrderStatus.COMPLETED,
      label: "Hoàn thành",
      name: "Đã thanh toán",
      color: "success",
      disabled: statusSequence.indexOf(currentStatus) >= 4
    },
    {
      value: OrderStatus.CANCELLED,
      label: "Đã hủy",
      color: "error",
      disabled: false, // Cancelled is always available
    },
  ];
};

const StatusStepper = ({ form, products, message, modal }: any) => {
  const currentStatus = Form.useWatch("status", form) || OrderStatus.PENDING;
  const isDepositPaid = Form.useWatch("isDepositPaid", form);

  const currentIndex = statusSequence.indexOf(currentStatus);
  const nextStatus =
    currentIndex < statusSequence.length - 1
      ? statusSequence[currentIndex + 1]
      : null;

  const handleAdvanceStatus = () => {
    if (!nextStatus) return;

    modal.confirm({
      title: "Xác nhận chuyển trạng thái",
      content: `Bạn có chắc muốn chuyển trạng thái đơn hàng sang "${
        statusOptions.find((opt) => opt.value === nextStatus)?.label
      }"?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: () => {
        // Validation before moving to CONFIRMED
        if (nextStatus === OrderStatus.CONFIRMED) {
          if (products.some((p: ProductData) => p.images.length === 0)) {
            message.error(
              "Vui lòng tải lên ít nhất một ảnh cho mỗi sản phẩm trước khi xác nhận."
            );
            return;
          }
          if (!isDepositPaid) {
            message.error("Vui lòng xác nhận khách hàng đã đặt cọc.");
            return;
          }
        }

        // Validation before moving to COMPLETED
        if (
          nextStatus === OrderStatus.COMPLETED &&
          currentStatus === OrderStatus.ON_HOLD
        ) {
          if (
            products.some(
              (p: ProductData) => !p.imagesDone || p.imagesDone.length === 0
            )
          ) {
            message.error(
              "Vui lòng tải lên ảnh sau khi hoàn thiện cho tất cả sản phẩm."
            );
            return;
          }
        }

        // Validation before moving to ON_HOLD
        if (nextStatus === OrderStatus.ON_HOLD) {
          const allWorkflowsDone = products.every((product: ProductData) =>
              Object.values(product.workflows || {}).every((workflow: any) => workflow.isDone)
          );
          if (!allWorkflowsDone) {
              message.error("Đội kỹ thuật chưa làm xong!");
              return;
          }
        }

        form.setFieldsValue({ status: nextStatus }); // Update form state
        form.submit(); // Trigger onFinish of the parent form
      },
    });
  };

  const currentStatusInfo =
    statusOptions.find((opt) => opt.value === currentStatus) ||
    statusOptions[0];

  return (
    <div className="space-y-2 flex items-center gap-4">
      <Tag color={currentStatusInfo.color} className="text-sm px-2 py-1">
        {currentStatusInfo.name}
      </Tag>

      {/* Deposit Paid Switch */}
      <div className="flex items-center gap-2">
        {(currentStatus === OrderStatus.PENDING ||
          currentStatus === OrderStatus.CONFIRMED) && (
          <Form.Item
            name="isDepositPaid"
            valuePropName="checked"
            className="mb-0"
            noStyle
          >
            <Switch
              size="small"
              checkedChildren="Đã cọc"
              unCheckedChildren="Chưa cọc"
            />
          </Form.Item>
        )}

        {nextStatus && (
          <Button
            onClick={handleAdvanceStatus} // No htmlType="submit" here
            size="small"
            type="primary"
          >
            {statusOptions.find((opt) => opt.value === nextStatus)?.label}
          </Button>
        )}
      </div>
    </div>
  );
};

const ProductCard: React.FC<ProductCardProps & { status: OrderStatus }> = ({
  product,
  onUpdate,
  onRemove,
  staffOptions,
  workflowOptions,
  workflows,
  staff,
  departments,
  status,
}) => {
  const { message } = App.useApp();

  const addWorkflow = () => {
    const newWorkflowCode = `STAGE_${new Date().getTime()}`;
    const newWorkflow: WorkflowData = {
      id: newWorkflowCode,
      members: [],
      isDone: false,
      workflowCode: [],
      workflowName: [],
    } as any;
    onUpdate({
      ...product,
      workflows: [...product.workflows, newWorkflow],
    });
  };

  const updateWorkflow = (
    workflowIndex: number,
    field: string,
    value: string | string[] | boolean
  ) => {
    const updatedWorkflows = [...product.workflows];
    const currentWorkflow = updatedWorkflows[workflowIndex];

    if (field === "departmentCode") {
      updatedWorkflows[workflowIndex] = {
        ...(currentWorkflow as any),
        departmentCode: value as string,
        workflowCode: [], // Reset workflow to an empty array
        workflowName: [], // Reset workflow names
        members: [], // Reset members
      };
    } else if (field === "workflowCode" && Array.isArray(value)) {
      const selectedWorkflowCodes = value;
      const selectedWorkflowNames = selectedWorkflowCodes
        .map((code) => workflows[code]?.name)
        .filter(Boolean) as string[];

      updatedWorkflows[workflowIndex] = {
        ...updatedWorkflows[workflowIndex],
        workflowCode: selectedWorkflowCodes,
        workflowName: selectedWorkflowNames,
        members: [], // Clear members when workflows change
      };
    } else {
      updatedWorkflows[workflowIndex] = {
        ...updatedWorkflows[workflowIndex],
        [field]: value,
      };
    }
    onUpdate({ ...product, workflows: updatedWorkflows });
  };

  const removeWorkflow = (workflowIndex: number) => {
    const updatedWorkflows = product.workflows.filter(
      (_, index: number) => index !== workflowIndex
    );
    onUpdate({ ...product, workflows: updatedWorkflows });
  };

  const updateProduct = (
    field: keyof ProductData,
    value: ProductData[keyof ProductData]
  ) => {
    onUpdate({ ...product, [field]: value });
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Wrench className="text-gold-500 w-4 h-4" />
          <Text strong>Mã sản phẩm: {product.id}</Text>
        </div>
      }
      extra={
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={onRemove}
          className="hover:bg-red-50"
        >
          Xóa
        </Button>
      }
      className="mb-4 shadow-sm border border-gray-200"
    >
      <div className="space-y-4">
        {/* Product Basic Info */}
        <Row gutter={16}>
          <Col span={10}>
            <div className="space-y-2 flex flex-col">
              <Text strong className="text-gray-700">
                Tên sản phẩm <Text type="danger">*</Text>
              </Text>
              <Input
                placeholder="VD: Túi Hermes Birkin 30cm"
                value={product.name}
                onChange={(e) => updateProduct("name", e.target.value)}
                className="w-full"
                status={!product.name.trim() ? "error" : ""}
              />
              {!product.name.trim() && (
                <Text type="danger" className="text-xs">
                  Vui lòng nhập tên sản phẩm
                </Text>
              )}
            </div>
          </Col>
          <Col span={4}>
            <div className="space-y-2 flex flex-col">
              <Text strong className="text-gray-700">
                Số lượng <Text type="danger">*</Text>
              </Text>
              <InputNumber
                min={1}
                placeholder="1"
                value={product.quantity}
                onChange={(value) => updateProduct("quantity", value || 1)}
                className="w-full"
                status={
                  !product.quantity || product.quantity < 1 ? "error" : ""
                }
              />
              {(!product.quantity || product.quantity < 1) && (
                <Text type="danger" className="text-xs">
                  Số lượng phải lớn hơn 0
                </Text>
              )}
            </div>
          </Col>
          <Col span={5}>
            <div className="space-y-2 flex flex-col">
              <Text strong className="text-gray-700">
                Giá (VNĐ) <Text type="danger">*</Text>
              </Text>
              <InputNumber
                min={0}
                placeholder="0"
                value={product.price}
                onChange={(value) => updateProduct("price", value || 0)}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => {
                  const parsed = Number(value?.replace(/,/g, "") || 0);
                  return parsed as any;
                }}
                className="w-full"
                status={!product.price || product.price < 0 ? "error" : ""}
              />
              {(!product.price || product.price < 0) && (
                <Text type="danger" className="text-xs">
                  Vui lòng nhập giá sản phẩm
                </Text>
              )}
            </div>
          </Col>
          <Col span={5}>
            <div className="space-y-2 flex flex-col">
              <Text strong className="text-gray-700">
                Hoa hồng (%){" "}
                <Text type="secondary" className="text-xs">
                  (Tùy chọn)
                </Text>
              </Text>
              <InputNumber
                min={0}
                max={100}
                placeholder="0"
                value={product.commissionPercentage || 0}
                onChange={(value) =>
                  updateProduct("commissionPercentage", value || 0)
                }
                formatter={(value) => `${value}%`}
                parser={(value) => Number(value?.replace("%", "") || 0) as any}
                className="w-full"
                step={0.1}
                precision={1}
              />
              <Text type="secondary" className="text-xs">
                {product.commissionPercentage && product.price
                  ? `≈ ${(
                      (product.price * (product.commissionPercentage || 0)) /
                      100
                    ).toLocaleString("vi-VN")} VNĐ`
                  : "Nhập % hoa hồng"}
              </Text>
            </div>
          </Col>
        </Row>

        {/* Product Images Upload */}
        <div className="space-y-2 flex flex-col">
          <Text strong className="text-gray-700">
            Ảnh sản phẩm (để đối chiếu) <Text type="danger">*</Text>
          </Text>
          <Upload
            listType="picture-card"
            fileList={product.images}
            beforeUpload={async (file, fileList) => {
              try {
                if (fileList && fileList.length > 1) {
                  const isLastFile =
                    fileList.indexOf(file) === fileList.length - 1;

                  if (isLastFile) {
                    const newFiles = [];

                    for (const currentFile of fileList) {
                      const base64 = await getBase64(currentFile);
                      newFiles.push({
                        uid: currentFile.uid,
                        name: currentFile.name,
                        status: "done" as const,
                        url: base64,
                        originFileObj: currentFile,
                      });
                    }

                    const updatedImages = [...product.images, ...newFiles];
                    updateProduct("images", updatedImages);
                    message.success(`Đã thêm ${fileList.length} ảnh`);
                  }
                } else {
                  const base64 = await getBase64(file);
                  const newFile = {
                    uid: file.uid,
                    name: file.name,
                    status: "done" as const,
                    url: base64,
                    originFileObj: file,
                  };

                  const updatedImages = [...product.images, newFile];
                  updateProduct("images", updatedImages);
                  message.success(`Đã thêm ảnh ${file.name}`);
                }
              } catch (error) {
                message.error(`Không thể tải ${file.name} lên!`);
                console.error("Upload error:", error);
              }
              return false;
            }}
            onRemove={(file) => {
              const updatedImages = product.images.filter(
                (item: any) => item.uid !== file.uid
              );
              updateProduct("images", updatedImages);
              return true;
            }}
            multiple
            accept="image/*"
            className={product.images.length === 0 ? "upload-error" : ""}
          >
            {product.images.length >= 8 ? null : (
              <div className="flex flex-col items-center justify-center p-2">
                <UploadOutlined className="text-xl mb-1" />
                <Text className="text-xs text-center">Tải ảnh</Text>
              </div>
            )}
          </Upload>
          {product.images.length === 0 && (
            <Text type="danger" className="text-xs">
              Vui lòng tải lên ít nhất 1 ảnh sản phẩm
            </Text>
          )}
        </div>

        {/* Post-completion Images Upload */}
        {status === OrderStatus.ON_HOLD && (
          <div className="space-y-2 flex flex-col mt-4 p-4 border border-dashed border-yellow-500 rounded-lg bg-yellow-50">
            <Text strong className="text-yellow-700">
              Ảnh sau khi hoàn thiện <Text type="danger">*</Text>
            </Text>
            <Upload
              listType="picture-card"
              fileList={product.imagesDone}
              beforeUpload={async (file) => {
                const base64 = await getBase64(file);
                const newFile = {
                  uid: file.uid,
                  name: file.name,
                  status: "done" as const,
                  url: base64,
                  originFileObj: file,
                };
                updateProduct("imagesDone", [
                  ...(product.imagesDone || []),
                  newFile,
                ]);
                return false;
              }}
              onRemove={(file) => {
                const updatedImages = (product.imagesDone || []).filter(
                  (item: any) => item.uid !== file.uid
                );
                updateProduct("imagesDone", updatedImages);
                return true;
              }}
              multiple
              accept="image/*"
            >
              {product.imagesDone && product.imagesDone.length >= 5 ? null : (
                <div className="flex flex-col items-center justify-center p-2">
                  <UploadOutlined className="text-xl mb-1" />
                  <Text className="text-xs text-center">Tải ảnh</Text>
                </div>
              )}
            </Upload>
            {(!product.imagesDone || product.imagesDone.length === 0) && (
              <Text type="danger" className="text-xs">
                Vui lòng tải lên ảnh sau khi hoàn thiện.
              </Text>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 my-4">
          <div className="h-px bg-gray-200 flex-1"></div>
          <Text strong className="text-primary px-3">
            Quy trình dịch vụ <Text type="danger">*</Text>
          </Text>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* Workflows Table */}
        {product.workflows.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 mb-4">
            <Table
              dataSource={product.workflows.map(
                (workflow: WorkflowData, index: number) => ({
                  ...workflow,
                  key: workflow.id,
                  stt: index + 1,
                })
              )}
              pagination={false}
              size="small"
              className="workflows-table"
              columns={[
                {
                  title: "#",
                  dataIndex: "stt",
                  key: "stt",
                  width: 60,
                  align: "center",
                  render: (stt) => (
                    <div className="w-8 h-8 bg-primary mx-auto text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {stt}
                    </div>
                  ),
                },
                {
                  title: "Phòng ban",
                  dataIndex: "departmentCode",
                  key: "departmentCode",
                  width: "25%",
                  render: (value, record, index) => {
                    // Get departments already used in other rows
                    const selectedDepartmentCodes = product.workflows
                      .map((w: any, i) =>
                        i === index ? null : w.departmentCode
                      )
                      .filter(Boolean);

                    const departmentOptions = Object.keys(departments)
                      .filter((code) => !selectedDepartmentCodes.includes(code))
                      .map((code) => ({
                        value: code,
                        label: departments[code].name,
                      }));

                    return (
                      <Select
                        value={value}
                        placeholder="Chọn phòng ban"
                        onChange={(newValue) =>
                          updateWorkflow(index, "departmentCode", newValue)
                        }
                        className="w-full"
                        size="small"
                        showSearch
                        optionFilterProp="children"
                      >
                        {departmentOptions.map((opt) => (
                          <Option key={opt.value} value={opt.value}>
                            {opt.label}
                          </Option>
                        ))}
                      </Select>
                    );
                  },
                },
                {
                  title: "Công đoạn",
                  dataIndex: "workflowCode",
                  key: "workflowCode",
                  width: "25%",
                  render: (value, record, index) => {
                    const departmentCode = (record as any).departmentCode;
                    const availableWorkflows = departmentCode
                      ? Object.entries(workflows)
                          .filter(
                            ([, wf]: [string, any]) =>
                              wf.department === departmentCode
                          )
                          .map(([code, wf]: [string, any]) => ({
                            value: code,
                            label: wf.name,
                          }))
                      : [];

                    return (
                      <Select
                        mode="multiple"
                        maxTagCount={1}
                        value={value}
                        placeholder={
                          departmentCode
                            ? "Chọn công đoạn"
                            : "Chọn phòng ban trước"
                        }
                        onChange={(newValue: string[]) =>
                          updateWorkflow(index, "workflowCode", newValue)
                        }
                        className="w-full"
                        size="small"
                        disabled={!departmentCode}
                        showSearch
                        optionFilterProp="children"
                      >
                        {availableWorkflows.map((opt) => (
                          <Option key={opt.value} value={opt.value}>
                            {opt.label}
                          </Option>
                        ))}
                      </Select>
                    );
                  },
                },
                {
                  title: "Nhân viên thực hiện",
                  dataIndex: "members",
                  key: "members",
                  width: "35%",
                  render: (value, record, index) => {
                    const departmentCode = (record as any).departmentCode;

                    // Filter staff by department if department is selected
                    const filteredStaffOptions = departmentCode
                      ? staffOptions.filter(
                          (option: {
                            value: string;
                            label: string;
                            departmentCodes?: string[];
                          }) => {
                            const staffMember = staff[option.value];
                            return staffMember?.departments?.includes(
                              departmentCode
                            );
                          }
                        )
                      : [];

                    return (
                      <Select
                        mode="multiple"
                        placeholder={
                          record.workflowCode?.length
                            ? "Chọn nhân viên"
                            : "Chọn công đoạn trước"
                        }
                        value={value}
                        onChange={(newValue) =>
                          updateWorkflow(index, "members", newValue)
                        }
                        className="w-full"
                        size="small"
                        maxTagCount={2}
                        disabled={!record.workflowCode?.length}
                      >
                        {filteredStaffOptions.map(
                          (option: { value: string; label: string }) => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          )
                        )}
                      </Select>
                    );
                  },
                },
                {
                  title: "Trạng thái",
                  dataIndex: "isDone",
                  key: "isDone",
                  width: "35%",
                  hidden: true,
                  render: (value, record, index) => (
                    <Checkbox
                      checked={value}
                      onChange={(e) =>
                        updateWorkflow(index, "isDone", e.target.checked)
                      }
                    />
                  ),
                },
                {
                  title: "Thao tác",
                  key: "action",
                  width: 80,
                  align: "center",
                  render: (_, record, index) => (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeWorkflow(index)}
                      className="hover:bg-red-50"
                    />
                  ),
                },
              ]}
            />
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-red-300 rounded-lg bg-red-50 mb-4">
            <Text type="danger">
              Chưa có công đoạn nào. Nhấn "Thêm công đoạn" để bắt đầu.
            </Text>
          </div>
        )}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addWorkflow}
          className="w-full border-blue-300 text-primary hover:border-blue-500 hover:text-primary"
        >
          Thêm công đoạn
        </Button>
      </div>
    </Card>
  );
};

interface ChildHandle {
  onResetForm: () => void;
}

const OrderForm = forwardRef<ChildHandle, OrderFormProps>(
  ({ mode, orderCode, onSuccess, onCancel }, ref) => {
    const [form] = Form.useForm();
    const [products, setProducts] = useState<ProductData[]>([]);
    const [staff, setStaff] = useState<FirebaseStaff>({});
    const [workflows, setWorkflows] = useState<FirebaseWorkflows>({});
    const [departments, setDepartments] = useState<FirebaseDepartments>({});
    const [customers, setCustomers] = useState<FirebaseCustomers>({});
    const [customerType, setCustomerType] = useState<"new" | "existing">("new");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { user } = useUser();
    const { message, modal } = App.useApp();

    useEffect(() => {
      if (mode === "update") {
        setCustomerType("existing");
      }
    }, [mode]);

    // Calculate total amount and update form when dependencies change
    const totalAmount = React.useMemo(() => {
      const subtotal = products.reduce(
        (sum, product) => sum + product.quantity * product.price,
        0
      );
      const discount = form.getFieldValue("discount") || 0;
      const discountType =
        form.getFieldValue("discountType") || DiscountType.Amount;
      const shippingFee = form.getFieldValue("shippingFee") || 0;
      const discountAmount =
        discountType === DiscountType.Percentage
          ? (subtotal * discount) / 100
          : discount;
      return subtotal - discountAmount + shippingFee;
    }, [products, form]);

    // Update form field when total changes
    React.useEffect(() => {
      form.setFieldsValue({ totalAmount });
    }, [totalAmount, form]);

    const handleResetForm = () => {
      form.resetFields();
      // Auto-fill current user again for create mode
      if (mode === "create" && user) {
        setProducts([]);
        form.setFieldsValue({
          createdBy: user.uid,
          createdByName: user.displayName,
          code: generateRandomCode("ORD_"),
          orderDate: dayjs(),
        });
      } else {
        populateFormWithOrderData(orderDataRef.current);
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        onResetForm: handleResetForm,
      }),
      []
    );

    // Populate form with existing order data
    const populateFormWithOrderData = (orderData: FirebaseOrderData) => {
      form.setFieldsValue({
        code: orderData.code,
        customerName: orderData.customerName,
        phone: orderData.phone,
        email: orderData.email,
        address: orderData.address,
        customerSource: orderData.customerSource,
        orderDate: dayjs(orderData.orderDate),
        deliveryDate: dayjs(orderData.deliveryDate),
        createdBy: orderData.createdBy,
        consultantId: orderData.consultantId || "",
        notes: orderData.notes || "",
        discount: orderData.discount || 0,
        discountType: orderData.discountType || DiscountType.Amount,
        shippingFee: orderData.shippingFee || 0,
        status: orderData.status || OrderStatus.PENDING,
        totalAmount: orderData.totalAmount,
        deposit: orderData.deposit || 0,
        depositType: orderData.depositType || DiscountType.Percentage,
        isDepositPaid: orderData.isDepositPaid || false,
      });

      // Convert products data back to form format
      const productsArray = Object.entries(orderData.products || {}).map(
        ([productId, productData]: [string, FirebaseProductData]) => ({
          id: productId,
          name: productData.name,
          quantity: productData.quantity,
          price: productData.price || 0,
          commissionPercentage: productData.commissionPercentage || 0,
          images:
            productData.images?.map((img: any, index: number) => ({
              uid: img.uid || `img-${index}`,
              name: img.name || `image-${index}`,
              url: img.url,
              firebaseUrl: img.url,
            })) || [],
          imagesDone:
            productData.imagesDone?.map((img: any, index: number) => ({
              uid: img.uid || `img-done-${index}`,
              name: img.name || `image-done-${index}`,
              url: img.url,
              firebaseUrl: img.url,
            })) || [],
          workflows: Object.entries(productData.workflows || {}).map(
            ([workflowId, workflowData]: [string, FirebaseWorkflowData]) => ({
              id: workflowId,
              departmentCode: workflowData.departmentCode,
              workflowCode: workflowData.workflowCode || [],
              workflowName: workflowData.workflowName || [],
              members: workflowData.members || [],
              isDone: workflowData.isDone || false,
            })
          ),
        })
      );

      setProducts(productsArray);
    };

    const memberOptions = groupMembersByRole(staff);

    const workflowOptions = Object.entries(workflows).map(([id, workflow]) => ({
      value: id,
      label: (workflow as Workflow).name,
    }));

    const orderDataRef = useRef<any>(null);

    const addProduct = () => {
      const newProductId = `PRODUCT_${new Date().getTime()}`;
      const newProduct: ProductData = {
        id: newProductId,
        name: "",
        quantity: 1,
        price: 0,
        commissionPercentage: 0,
        images: [],
        imagesDone: [],
        workflows: [],
      };
      products.unshift(newProduct);
      setProducts([...products]);
    };

    const updateProduct = (index: number, updatedProduct: ProductData) => {
      const updatedProducts = [...products];
      updatedProducts[index] = updatedProduct;
      setProducts(updatedProducts);
    };

    const removeProduct = (index: number) => {
      setProducts(products.filter((_, i) => i !== index));
    };

    const uploadImageToFirebase = async (
      file: File,
      productId: string,
      imageIndex: number
    ): Promise<string> => {
      const storage = getStorage();
      const fileName = `orders/${new Date().getTime()}_${productId}_${imageIndex}_${
        file.name
      }`;
      const storageReference = storageRef(storage, fileName);

      const snapshot = await uploadBytes(storageReference, file);
      return await getDownloadURL(snapshot.ref);
    };

    const onFinish = async (values: FormValues) => {
      // --- VALIDATION ---
      if (products.length === 0) {
        message.warning("Vui lòng thêm ít nhất một sản phẩm!");
        return;
      }

      if (
        values.discountType === DiscountType.Percentage &&
        (values.discount || 0) > 100
      ) {
        message.warning("Giảm giá theo phần trăm không được vượt quá 100%!");
        return;
      }

      const status = values.status || OrderStatus.PENDING;

      // Validate products
      for (const product of products) {
        if (!product.name.trim()) {
          message.warning(`Vui lòng nhập tên cho sản phẩm ${product.id}!`);
          return;
        }
        if (!product.quantity || product.quantity < 1) {
          message.warning(
            `Vui lòng nhập số lượng hợp lệ cho sản phẩm ${product.id}!`
          );
          return;
        }
        if (!product.price || product.price < 0) {
          message.warning(
            `Vui lòng nhập giá hợp lệ cho sản phẩm ${product.id}!`
          );
          return;
        }
        // Image validation based on status
        if (
          mode === "update" &&
          status !== OrderStatus.PENDING &&
          product.images.length === 0
        ) {
          message.warning(
            `Vui lòng tải lên ít nhất 1 ảnh cho sản phẩm ${product.id} vì đơn hàng không ở trạng thái "Chờ xử lý".`
          );
          return;
        }
        if (product.workflows.length === 0) {
          message.warning(
            `Sản phẩm ${product.id} phải có ít nhất một công đoạn!`
          );
          return;
        }
        for (const workflow of product.workflows) {
          if (!workflow.workflowCode || workflow.workflowCode.length === 0) {
            message.warning(
              `Vui lòng chọn công đoạn cho tất cả các bước trong sản phẩm ${product.id}!`
            );
            return;
          }
          if (!workflow.members || workflow.members.length === 0) {
            message.warning(
              `Vui lòng chọn nhân viên thực hiện cho tất cả công đoạn trong sản phẩm ${product.id}!`
            );
            return;
          }
        }
      }

      // Confirmed status validation
      const totals = calculateOrderTotals(
        products,
        values.discount,
        values.discountType,
        values.shippingFee
      );
      const depositValue = values.deposit || 0;
      const depositType = values.depositType || DiscountType.Percentage;
      const depositAmount =
        depositType === DiscountType.Percentage
          ? (totals.total * depositValue) / 100
          : depositValue;

      if (status === OrderStatus.CONFIRMED && depositAmount <= 0) {
        message.warning(
          'Đơn hàng "Đã xác nhận" phải có số tiền cọc lớn hơn 0.'
        );
        return;
      }

      setSubmitting(true);
      const database = getDatabase();
      let customerCodeToSave =
        mode === "update"
          ? orderDataRef.current?.customerCode
          : values.customerCode;

      try {
        // New Customer Validation and Creation
        if (customerType === "new") {
          const existingCustomerByPhone = Object.values(customers).find(
            (c) => c.phone === values.phone
          );
          if (existingCustomerByPhone) {
            message.error(
              `Số điện thoại ${values.phone} đã tồn tại cho khách hàng ${existingCustomerByPhone.name}.`
            );
            setSubmitting(false);
            return;
          }
          if (values.email) {
            const existingCustomerByEmail = Object.values(customers).find(
              (c) => c.email && c.email === values.email
            );
            if (existingCustomerByEmail) {
              message.error(
                `Email ${values.email} đã tồn tại cho khách hàng ${existingCustomerByEmail.name}.`
              );
              setSubmitting(false);
              return;
            }
          }

          // Create new customer
          const newCustomerCode = generateRandomCode("CUST_");
          const now = new Date().getTime();
          const newCustomer: Customer = {
            code: newCustomerCode,
            name: values.customerName,
            phone: values.phone,
            email: values.email,
            address: values.address,
            customerSource: values.customerSource || CustomerSource.Other,
            createdAt: now,
            updatedAt: now,
          };
          const customerRef = dbRef(
            database,
            `xoxo/customers/${newCustomerCode}`
          );
          await set(customerRef, newCustomer);
          customerCodeToSave = newCustomerCode;
          message.success(`Đã tạo khách hàng mới: ${newCustomer.name}`);
        }

        const hideLoading = message.loading("Đang tải ảnh lên Firebase...", 0);

        // Upload all images to Firebase
        const productsWithUploadedImages = await Promise.all(
          products.map(async (product) => {
            const uploadedImages = await Promise.all(
              product.images.map(async (image: any, index: number) => {
                if (image.originFileObj) {
                  try {
                    const firebaseUrl = await uploadImageToFirebase(
                      image.originFileObj as File,
                      `${product.id}_before`,
                      index
                    );
                    return { ...image, firebaseUrl };
                  } catch (error) {
                    console.error(
                      `Error uploading image ${image.name}:`,
                      error
                    );
                    message.error(
                      `Không thể tải ảnh ${image.name} lên Firebase`
                    );
                    return { ...image, error: true };
                  }
                }
                return image;
              })
            );

            const uploadedImagesDone = await Promise.all(
              (product.imagesDone || []).map(
                async (image: any, index: number) => {
                  if (image.originFileObj) {
                    try {
                      const firebaseUrl = await uploadImageToFirebase(
                        image.originFileObj as File,
                        `${product.id}_after`,
                        index
                      );
                      return { ...image, firebaseUrl };
                    } catch (error) {
                      console.error(
                        `Error uploading image ${image.name}:`,
                        error
                      );
                      message.error(
                        `Không thể tải ảnh ${image.name} lên Firebase`
                      );
                      return { ...image, error: true };
                    }
                  }
                  return image;
                }
              )
            );

            return {
              ...product,
              images: uploadedImages.filter((img) => !img.error),
              imagesDone: uploadedImagesDone.filter((img) => !img.error),
            };
          })
        );

        hideLoading();

        // --- PREPARE ORDER DATA ---
        const now = new Date().getTime();
        const {
          discount,
          discountType = DiscountType.Amount,
          shippingFee,
          deposit,
          depositType = DiscountType.Percentage,
        } = values;

        const totals = calculateOrderTotals(
          products,
          discount,
          discountType,
          shippingFee
        );

        const orderIssues: string[] = [];
        if (
          status === OrderStatus.PENDING &&
          products.some((p) => p.images.length === 0)
        ) {
          orderIssues.push("pending_images");
        }

        const depositAmount =
          depositType === DiscountType.Percentage
            ? (totals.total * (deposit || 0)) / 100
            : deposit || 0;

        const orderData: FirebaseOrderData = {
          code: values.code,
          status: status,
          customerCode: customerCodeToSave,
          customerName: values.customerName,
          phone: values.phone,
          email: values.email,
          address: values.address,
          customerSource: values.customerSource || CustomerSource.Other,
          orderDate: values.orderDate
            ? values.orderDate.valueOf()
            : new Date().getTime(),
          totalAmount: totals.total,
          discountAmount: totals.discountAmount,
          subtotal: totals.subtotal,
          deposit: values.deposit || 0,
          depositType: depositType,
          depositAmount: depositAmount,
          isDepositPaid: values.isDepositPaid || false,
          deliveryDate: values.deliveryDate
            ? values.deliveryDate.valueOf()
            : new Date().getTime(),
          createdBy: user?.uid || "unknown",
          createdByName:
            values.createdByName ||
            user?.displayName ||
            user?.email ||
            "Người dùng hiện tại",
          ...(values.consultantId && {
            consultantId: values.consultantId,
            consultantName: staff[values.consultantId]?.name || "",
          }),
          notes: values.notes || "",
          discount: discount || 0,
          discountType: discountType,
          shippingFee: shippingFee || 0,
          issues: orderIssues,
          ...(mode === "create" && { createdAt: now }),
          updatedAt: now,
          products: productsWithUploadedImages.reduce((acc, product) => {
            acc[product.id] = {
              name: product.name,
              quantity: product.quantity,
              price: product.price,
              commissionPercentage: product.commissionPercentage || 0,
              images: product.images.map((img: any) => ({
                uid: img.uid,
                name: img.name,
                url: img.firebaseUrl || img.url || "",
              })),
              imagesDone: (product.imagesDone || []).map((img: any) => ({
                uid: img.uid,
                name: img.name,
                url: img.firebaseUrl || img.url || "",
              })),
              workflows: product.workflows.reduce(
                (workflowAcc: any, workflow: WorkflowData) => {
                  const workflowNames = workflow.workflowCode
                    .map((code) => workflows[code]?.name)
                    .filter(Boolean) as string[];

                  workflowAcc[workflow.id] = {
                    departmentCode: (workflow as any).departmentCode,
                    workflowCode: workflow.workflowCode,
                    workflowName: workflowNames,
                    members: workflow.members,
                    isDone: workflow.isDone,
                    updatedAt: now,
                  };
                  return workflowAcc;
                },
                {} as Record<string, FirebaseWorkflowData>
              ),
            };
            return acc;
          }, {} as Record<string, FirebaseProductData>),
        };

        // --- SAVE TO FIREBASE ---
        if (mode === "create") {
          const orderRef = dbRef(database, `xoxo/orders/${orderData.code}`);
          await set(orderRef, orderData);
          message.success("Đơn hàng đã được tạo thành công!");
          onSuccess?.(orderData.code);
        } else {
          const orderRef = dbRef(database, `xoxo/orders/${orderCode}`);
          await update(orderRef, orderData);
          message.success("Đơn hàng đã được cập nhật thành công!");
          onSuccess?.(orderCode!);
        }

        // Reset form for create mode
        if (mode === "create") {
          form.resetFields();
          setProducts([]);
          setCustomerType("new");
          form.setFieldsValue({
            code: generateRandomCode("ORD_"),
            createdBy: user?.uid,
            createdByName:
              user?.displayName || user?.email || "Người dùng hiện tại",
            orderDate: dayjs(),
            status: OrderStatus.PENDING,
          });
        }
      } catch (error) {
        console.error("Error saving order:", error);
        message.error("Có lỗi xảy ra khi lưu đơn hàng!");
      } finally {
        setSubmitting(false);
      }
    };

    // Auto-fill current user when component mounts (create mode only)
    useEffect(() => {
      if (mode === "create" && user) {
        form.setFieldsValue({
          createdBy: user.uid,
          createdByName:
            user.displayName || user.email || "Người dùng hiện tại",
          code: generateRandomCode("ORD_"),
        });
      }
    }, [user, form, mode]);

    // Load staff and workflows from Firebase
    useEffect(() => {
      const database = getDatabase();
      const staffRef = dbRef(database, "xoxo/members");
      const workflowsRef = dbRef(database, "xoxo/workflows");
      const departmentsRef = dbRef(database, "xoxo/departments");
      const customersRef = dbRef(database, "xoxo/customers");

      const loadData = async () => {
        try {
          onValue(staffRef, (snapshot) => {
            const staffData = snapshot.val() || {};
            setStaff(staffData);
          });

          onValue(workflowsRef, (snapshot) => {
            const workflowData = snapshot.val() || {};
            setWorkflows(workflowData);
          });

          onValue(departmentsRef, (snapshot) => {
            const departmentsData = snapshot.val() || {};
            setDepartments(departmentsData);
          });

          onValue(customersRef, (snapshot) => {
            const customersData = snapshot.val() || {};
            setCustomers(customersData);
          });

          // Load existing order data if in update mode
          if (mode === "update" && orderCode) {
            const orderRef = dbRef(database, `xoxo/orders/${orderCode}`);
            onValue(orderRef, (snapshot) => {
              const orderData = snapshot.val();
              console.log("orderData:", orderData);
              if (orderData) {
                populateFormWithOrderData(orderData);
                orderDataRef.current = orderData;
              }
            });
          }

          setLoading(false);
        } catch (error) {
          console.error("Error loading Firebase data:", error);
          message.error("Không thể tải dữ liệu nhân viên và quy trình!");
          setLoading(false);
        }
      };

      loadData();

      return () => {
        off(staffRef);
        off(workflowsRef);
        off(departmentsRef);
        off(customersRef);
      };
    }, [mode, orderCode]);

    return (
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="gap-6 flex flex-col">
          {/* Order Basic Information */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <UserOutlined />
                <Text strong>
                  {mode === "create"
                    ? "Thông tin đơn hàng"
                    : "Cập nhật đơn hàng"}
                </Text>
              </div>
            }
            className="bg-white shadow-sm"
          >
            {/* Thông tin khách hàng */}
            <div className="mb-6">
              <div className="mb-3 pb-2 border-b border-gray-200 flex justify-between items-center">
                <Text strong>Khách hàng</Text>
                {mode === "create" && (
                  <Radio.Group
                    value={customerType}
                    onChange={(e) => {
                      setCustomerType(e.target.value);
                      form.resetFields([
                        "customerCode",
                        "customerName",
                        "phone",
                        "email",
                        "address",
                      ]);
                    }}
                    optionType="button"
                    buttonStyle="solid"
                    size="small"
                  >
                    <Radio.Button value="new">Khách mới</Radio.Button>
                    <Radio.Button value="existing">Khách cũ</Radio.Button>
                  </Radio.Group>
                )}
              </div>

              <Form.Item name="customerCode" hidden>
                <Input />
              </Form.Item>

              {mode === "create" && customerType === "existing" ? (
                <Form.Item
                  label="Chọn khách hàng"
                  name="customerCode"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn một khách hàng!",
                    },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder="Tìm và chọn khách hàng theo tên hoặc SĐT"
                    onChange={(customerCode) => {
                      const customer = customers[customerCode];
                      if (customer) {
                        form.setFieldsValue({
                          customerCode: customer.code,
                          customerName: customer.name,
                          phone: customer.phone,
                          email: customer.email,
                          address: customer.address,
                          customerSource: customer.customerSource,
                        });
                      }
                    }}
                    filterOption={(input, option) => {
                      const customer = customers[option?.value as string];
                      if (!customer) return false;
                      const searchableText =
                        `${customer.name} ${customer.phone}`.toLowerCase();
                      return searchableText.includes(input.toLowerCase());
                    }}
                  >
                    {Object.values(customers).map((customer) => (
                      <Option key={customer.code} value={customer.code}>
                        {customer.name} - {customer.phone} - {customer.email}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null}

              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item
                    label={
                      mode === "create"
                        ? "Mã đơn hàng (tự động)"
                        : "Mã đơn hàng"
                    }
                    name="code"
                    rules={[
                      { required: true, message: "Vui lòng nhập mã đơn hàng!" },
                    ]}
                  >
                    <Input disabled placeholder="VD: ORD_AD2342" />
                  </Form.Item>
                </Col>
                <Col span={9}>
                  <Form.Item
                    label="Tên khách hàng"
                    name="customerName"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập tên khách hàng!",
                      },
                    ]}
                  >
                    <Input
                      placeholder="VD: Nguyễn Thị Lan Anh"
                      disabled={
                        mode === "update" || customerType === "existing"
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={9}>
                  <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập số điện thoại!",
                      },
                      {
                        pattern: /^[0-9]{10,11}$/,
                        message: "Số điện thoại không hợp lệ!",
                      },
                    ]}
                  >
                    <Input
                      placeholder="VD: 0123456789"
                      disabled={
                        mode === "update" || customerType === "existing"
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={9}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ type: "email", message: "Email không hợp lệ!" }]}
                  >
                    <Input
                      placeholder="VD: khachhang@email.com"
                      disabled={
                        mode === "update" || customerType === "existing"
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={15}>
                  <Form.Item label="Nguồn khách hàng" name="customerSource">
                    <Select
                      placeholder="Chọn nguồn khách hàng"
                      className="w-full"
                      allowClear
                      disabled={
                        mode === "update" || customerType === "existing"
                      }
                      showSearch={{
                        optionFilterProp: "children",
                        filterOption: (input, option) =>
                          String(option?.label || "")
                            .toLowerCase()
                            .includes(input.toLowerCase()),
                      }}
                    >
                      {CustomerSourceOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                {/* <Col span={6}> */}

                {/* </Col> */}
              </Row>
              <Form.Item
                label="Địa chỉ"
                name="address"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
              >
                <Input.TextArea
                  rows={2}
                  placeholder="VD: 123 Đường ABC, Quận XYZ, TP.HN"
                  disabled={mode === "update" || customerType === "existing"}
                />
              </Form.Item>
            </div>

            {/* Thông tin đơn hàng */}
            <div className="mb-6">
              <div className="mb-3 pb-2 border-b border-gray-200">
                <Text strong>Thời gian</Text>
              </div>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="Ngày đặt"
                    name="orderDate"
                    initialValue={mode === "create" ? dayjs() : undefined}
                    rules={[
                      { required: true, message: "Vui lòng chọn ngày đặt!" },
                    ]}
                  >
                    <DatePicker
                      disabled
                      className="w-full"
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày đặt"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Ngày giao dự kiến"
                    name="deliveryDate"
                    rules={[
                      { required: true, message: "Vui lòng chọn ngày giao!" },
                    ]}
                  >
                    <DatePicker
                      className="w-full"
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày giao"
                      disabledDate={(current) =>
                        current && current < dayjs().endOf("day")
                      }
                    />
                  </Form.Item>
                </Col>
                {mode === "update" && (
                  <Col span={8}>
                    <Form.Item label="Trạng thái" required>
                      <StatusStepper
                        form={form}
                        products={products}
                        message={message}
                        modal={modal}
                      />
                    </Form.Item>{" "}
                    <Form.Item name="status" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="isDepositPaid"
                      valuePropName="checked"
                      hidden
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                )}
              </Row>
            </div>

            {/* Thông tin nhân viên */}
            <div className="">
              <div className="mb-3 pb-2 border-b border-gray-200">
                <Text strong>Nhân viên</Text>
              </div>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    required
                    label="Nhân viên tạo đơn"
                    name="createdByName"
                  >
                    <Input
                      disabled
                      placeholder="Đang tải thông tin người dùng..."
                      prefix={<UserOutlined className="text-gray-400" />}
                      className="bg-gray-50"
                    />
                  </Form.Item>
                  <Form.Item name="createdBy" className="absolute">
                    <Input disabled hidden />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    required
                    label="Nhân viên tư vấn"
                    name="consultantId"
                  >
                    <Select
                      placeholder="Chọn nhân viên tư vấn"
                      className="w-full"
                      allowClear
                      showSearch={{
                        optionFilterProp: "children",
                        filterOption: (input, option) =>
                          String(option?.label || "")
                            .toLowerCase()
                            .includes(input.toLowerCase()),
                      }}
                    >
                      {memberOptions[ROLES.sales].map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Ghi chú đơn hàng" name="notes">
                <Input.TextArea
                  rows={3}
                  placeholder="Ghi chú chung về đơn hàng..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </div>
          </Card>

          {/* Products Section */}
          <Card
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TagOutlined />
                  <Text strong>Danh sách sản phẩm</Text>
                  <Tag color="yellow">{products.length} sản phẩm</Tag>
                </div>
                <Button
                  type="primary"
                  htmlType="button"
                  icon={<PlusOutlined />}
                  onClick={addProduct}
                  className="bg-primary hover:bg-primary"
                >
                  Thêm sản phẩm
                </Button>
              </div>
            }
            className="bg-white shadow-sm"
          >
            {products.length === 0 ? (
              <div className="text-center py-8">
                <Empty
                  description={`Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.`}
                />
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] flex flex-col gap-4 overflow-y-auto pr-2">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onUpdate={(updatedProduct: ProductData) =>
                      updateProduct(index, updatedProduct)
                    }
                    onRemove={() => removeProduct(index)}
                    staffOptions={memberOptions[ROLES.worker]}
                    workflowOptions={workflowOptions}
                    workflows={workflows}
                    staff={staff}
                    departments={departments}
                    status={form.getFieldValue("status") || OrderStatus.PENDING}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Order Summary */}
          {products.length > 0 && (
            <Card
              title={
                <div className="flex items-center gap-2">
                  <ShoppingCartOutlined />
                  <Text strong>Tổng kết đơn hàng</Text>
                </div>
              }
              className="bg-white shadow-sm"
            >
              <Row gutter={24}>
                <Col span={14}>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {products.map((product, index) => {
                      const subtotal = product.quantity * product.price;
                      return (
                        <div
                          key={product.id}
                          className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex-1">
                            <Text>
                              {product.name || `Sản phẩm ${index + 1}`}
                            </Text>
                            <br />
                            <Text type="secondary" className="text-sm">
                              {product.quantity} x{" "}
                              {product.price?.toLocaleString("vi-VN")} VNĐ
                            </Text>
                          </div>
                          <div className="text-right">
                            <Text strong>
                              {subtotal.toLocaleString("vi-VN")} VNĐ
                            </Text>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Col>
                <Col span={10}>
                  <div className="space-y-4 border-l border-gray-200 pl-4">
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <Form.Item dependencies={["discountType"]}>
                          {({ getFieldValue }) => {
                            const discountType =
                              getFieldValue("discountType") ||
                              DiscountType.Amount;
                            const isPercentage =
                              discountType === DiscountType.Percentage;
                            return (
                              <div>
                                <div className="mb-2">
                                  <Text>Chiết khấu</Text>
                                </div>
                                <Space.Compact className="w-full">
                                  <Form.Item
                                    name="discount"
                                    initialValue={0}
                                    noStyle
                                  >
                                    <InputNumber
                                      min={0}
                                      max={isPercentage ? 99.9 : undefined}
                                      placeholder="0"
                                      step={isPercentage ? 0.1 : 1000}
                                      className="w-full"
                                    />
                                  </Form.Item>
                                  <Form.Item
                                    name="discountType"
                                    initialValue={DiscountType.Amount}
                                    noStyle
                                  >
                                    <Select style={{ width: 80 }}>
                                      <Option value={DiscountType.Amount}>
                                        VNĐ
                                      </Option>
                                      <Option value={DiscountType.Percentage}>
                                        %
                                      </Option>
                                    </Select>
                                  </Form.Item>
                                </Space.Compact>
                              </div>
                            );
                          }}
                        </Form.Item>
                      </div>

                      <div className="flex-1">
                        <Form.Item
                          label="Phí vận chuyển"
                          name="shippingFee"
                          initialValue={0}
                        >
                          <InputNumber
                            min={0}
                            placeholder="0"
                            formatter={(v) =>
                              `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => {
                              const parsed = Number(
                                value?.replace(/,/g, "") || 0
                              );
                              return parsed as any;
                            }}
                            className="w-full"
                          />
                        </Form.Item>
                      </div>
                    </div>

                    {/* Deposit Field */}
                    <div className="flex-1">
                      <Form.Item dependencies={["depositType"]}>
                        {({ getFieldValue }) => {
                          const depositType =
                            getFieldValue("depositType") ||
                            DiscountType.Percentage;
                          const isPercentage =
                            depositType === DiscountType.Percentage;
                          return (
                            <div>
                              <div className="mb-2">
                                <Text>Tiền cọc</Text>
                              </div>
                              <Space.Compact className="w-full">
                                <Form.Item
                                  name="deposit"
                                  initialValue={50}
                                  noStyle
                                >
                                  <InputNumber
                                    min={0}
                                    max={isPercentage ? 100 : undefined}
                                    placeholder="0"
                                    step={isPercentage ? 10 : 1000}
                                    className="w-full"
                                  />
                                </Form.Item>
                                <Form.Item
                                  name="depositType"
                                  initialValue={DiscountType.Percentage}
                                  noStyle
                                >
                                  <Select style={{ width: 80 }}>
                                    <Option value={DiscountType.Amount}>
                                      VNĐ
                                    </Option>
                                    <Option value={DiscountType.Percentage}>
                                      %
                                    </Option>
                                  </Select>
                                </Form.Item>
                              </Space.Compact>
                            </div>
                          );
                        }}
                      </Form.Item>
                    </div>

                    <Form.Item
                      dependencies={[
                        "discount",
                        "discountType",
                        "shippingFee",
                        "deposit",
                        "depositType",
                      ]}
                    >
                      {({ getFieldValue }) => {
                        const discount = getFieldValue("discount") || 0;
                        const discountType =
                          getFieldValue("discountType") || DiscountType.Amount;
                        const shippingFee = getFieldValue("shippingFee") || 0;
                        const depositValue = getFieldValue("deposit") || 0;
                        const depositType =
                          getFieldValue("depositType") ||
                          DiscountType.Percentage;

                        const totals = calculateOrderTotals(
                          products,
                          discount,
                          discountType,
                          shippingFee
                        );

                        const depositAmount =
                          depositType === DiscountType.Percentage
                            ? (totals.total * depositValue) / 100
                            : depositValue;

                        const remaining = totals.total - depositAmount;

                        return (
                          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between">
                              <Text>Tạm tính:</Text>
                              <Text>
                                {totals.subtotal.toLocaleString("vi-VN")} VNĐ
                              </Text>
                            </div>
                            <div className="flex justify-between">
                              <Text>Chiết khấu:</Text>
                              <Text>
                                -{totals.discountAmount.toLocaleString("vi-VN")}{" "}
                                VNĐ
                                {discountType === DiscountType.Percentage &&
                                  discount > 0 &&
                                  ` (${discount}%)`}
                              </Text>
                            </div>
                            <div className="flex justify-between">
                              <Text>Phí vận chuyển:</Text>
                              <Text>
                                +{shippingFee.toLocaleString("vi-VN")} VNĐ
                              </Text>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-300">
                              <Text strong className="text-lg">
                                Tổng cộng:
                              </Text>
                              <Text strong className="text-lg text-primary">
                                {totals.total.toLocaleString("vi-VN")} VNĐ
                              </Text>
                            </div>
                            <div className="flex justify-between">
                              <Text>Tiền cọc:</Text>
                              <Text>
                                -{depositAmount.toLocaleString("vi-VN")} VNĐ
                                {depositType === DiscountType.Percentage &&
                                  depositValue > 0 &&
                                  ` (${depositValue}%)`}
                              </Text>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-300">
                              <Text strong className="text-lg">
                                Còn lại:
                              </Text>
                              <Text strong className="text-lg text-red-500">
                                {remaining.toLocaleString("vi-VN")} VNĐ
                              </Text>
                            </div>
                          </div>
                        );
                      }}
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4 py-4 sticky bottom-0 mt-4 border-t bg-white border-gray-200">
            <Button
              disabled={submitting}
              icon={<CloseOutlined />}
              size="large"
              onClick={onCancel}
            >
              Hủy bỏ
            </Button>
            <Button
              size="large"
              type="dashed"
              icon={<ReloadOutlined />}
              disabled={submitting}
              onClick={handleResetForm}
              className="min-w-32"
            >
              Đặt lại
            </Button>
            <Button
              disabled={submitting}
              icon={submitting ? <LoadingOutlined spin /> : <SaveOutlined />}
              type="primary"
              size="large"
              htmlType="submit"
              loading={submitting}
              className="bg-primary hover:bg-primary min-w-32"
            >
              {mode === "create" ? "Tạo đơn hàng" : "Cập nhật đơn hàng"}
            </Button>
          </div>
        </div>
        <Form.Item name="totalAmount" hidden>
          <Input />
        </Form.Item>
      </Form>
    );
  }
);

export default OrderForm;
