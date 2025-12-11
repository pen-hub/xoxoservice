"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { DepartmentService, IDepartment } from "@/services/departmentService";
import { MemberService } from "@/services/memberService";
import { SalaryService } from "@/services/salaryService";
import { RoleLabels, ROLES, RolesOptions } from "@/types/enum";
import { IMembers } from "@/types/members";
import { SalaryTemplate, SalaryType } from "@/types/salary";
import { genCode } from "@/utils/genCode";
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  LockOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  Alert,
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tabs,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

const { Option } = Select;

// Member Details Drawer Component
const MemberDetails: React.FC<PropRowDetails<IMembers>> = ({
  data,
  onClose,
}) => {
  const [departments, setDepartments] = useState<IDepartment[]>([]);

  useEffect(() => {
    const unsubscribe = DepartmentService.onSnapshot((data) => {
      setDepartments(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!data) return null;

  const getDepartmentNames = (codes?: string[]) => {
    if (!codes || codes.length === 0) return "N/A";
    return codes
      .map((code) => departments.find((d) => d.code === code)?.name || code)
      .join(", ");
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Thông tin nhân viên</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <span className="font-medium">Họ tên:</span>
            <p className="text-gray-600">{data.name}</p>
          </div>
          <div>
            <span className="font-medium">Số điện thoại:</span>
            <p className="text-gray-600">{data.phone}</p>
          </div>
          <div>
            <span className="font-medium">Email:</span>
            <p className="text-gray-600">{data.email}</p>
          </div>
          <div>
            <span className="font-medium">Chức vụ:</span>
            <p className="text-gray-600">
              {RoleLabels[data.role] || data.role}
            </p>
          </div>
          {data.role === ROLES.worker && (
            <div>
              <span className="font-medium">Phòng ban:</span>
              <p className="text-gray-600">
                {getDepartmentNames(data.departments)}
              </p>
            </div>
          )}
          <div>
            <span className="font-medium">Ngày sinh:</span>
            <p className="text-gray-600">
              {dayjs(data.date_of_birth).format("DD/MM/YYYY")}
            </p>
          </div>
          <div>
            <span className="font-medium">Trạng thái:</span>
            <p className="text-gray-600">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  data.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {data.isActive !== false ? "Hoạt động" : "Ngừng hoạt động"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Member Form Component
interface MemberFormProps {
  member?: IMembers;
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

// Salary Setup Tab Component
const SalarySetupTab: React.FC<{
  memberId?: string;
  form: any;
}> = ({ memberId, form: salaryForm }) => {
  const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const { message } = App.useApp();

  // Load salary templates - sort by createdAt desc (newest first)
  useEffect(() => {
    const unsubscribe = SalaryService.onTemplatesSnapshot((data) => {
      // Sort templates: newest first (highest createdAt)
      const sorted = [...data].sort((a, b) => {
        const aTime = a.createdAt || 0;
        const bTime = b.createdAt || 0;
        return bTime - aTime; // Descending order
      });
      setTemplates(sorted);
    });
    return () => unsubscribe();
  }, []);

  // Load existing salary config when memberId changes
  useEffect(() => {
    if (memberId) {
      setLoadingSalary(true);
      SalaryService.getSalaryByMemberId(memberId)
        .then((salary) => {
          if (salary) {
            salaryForm.setFieldsValue({
              salaryType: salary.salaryType,
              salaryAmount: salary.salaryAmount,
              bonusPercentage: salary.bonusPercentage ?? 0,
              salaryTemplateId: salary.salaryTemplateId,
            });
            setSelectedTemplateId(salary.salaryTemplateId || null);
          } else {
            salaryForm.resetFields();
            salaryForm.setFieldsValue({
              salaryType: SalaryType.FIXED,
              bonusPercentage: 0,
            });
            setSelectedTemplateId(null);
          }
        })
        .catch((error) => {
          console.error("Error loading salary:", error);
        })
        .finally(() => {
          setLoadingSalary(false);
        });
    } else {
      salaryForm.resetFields();
      salaryForm.setFieldsValue({
        salaryType: SalaryType.FIXED,
        bonusPercentage: 0,
      });
      setSelectedTemplateId(null);
    }
  }, [memberId, salaryForm]);

  const handleTemplateChange = (templateId: string | null) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      // Clear template selection - enable fields
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // Fill all fields from template
      salaryForm.setFieldsValue({
        salaryType: template.salaryType,
        salaryAmount: template.salaryAmount,
        bonusPercentage: template.bonusPercentage ?? 0,
        salaryTemplateId: templateId,
      });
    }
  };

  const salaryTypeOptions = [
    { label: "Cố định", value: SalaryType.FIXED },
    { label: "Theo ca làm việc", value: SalaryType.BY_SHIFT },
    { label: "Theo giờ làm việc", value: SalaryType.BY_HOUR },
    { label: "Theo ngày công chuẩn", value: SalaryType.BY_DAY },
  ];

  const getSalaryAmountLabel = (type: SalaryType) => {
    switch (type) {
      case SalaryType.FIXED:
        return "Mức lương (VNĐ/tháng)";
      case SalaryType.BY_SHIFT:
        return "Mức lương (VNĐ/ca)";
      case SalaryType.BY_HOUR:
        return "Mức lương (VNĐ/giờ)";
      case SalaryType.BY_DAY:
        return "Mức lương (VNĐ/ngày)";
      default:
        return "Mức lương";
    }
  };

  const getSalaryTypeDescription = (type: SalaryType) => {
    switch (type) {
      case SalaryType.FIXED:
        return "Lương cố định hàng tháng, không phụ thuộc số ca/giờ làm việc";
      case SalaryType.BY_SHIFT:
        return "Lương = số ca làm × mức lương/ca (cần nhập số ca để tính lương thực tế)";
      case SalaryType.BY_HOUR:
        return "Lương = số giờ làm × mức lương/giờ (cần nhập số giờ để tính lương thực tế)";
      case SalaryType.BY_DAY:
        return "Lương = số ngày làm × mức lương/ngày (cần nhập số ngày để tính lương thực tế)";
      default:
        return "";
    }
  };

  const getSalaryPreview = (type: SalaryType, amount: number) => {
    if (!amount || amount <= 0) return null;
    switch (type) {
      case SalaryType.BY_SHIFT:
        return `Ví dụ: Nếu nhân viên làm 20 ca/tháng × ${amount.toLocaleString(
          "vi-VN"
        )} VNĐ/ca = ${(20 * amount).toLocaleString("vi-VN")} VNĐ`;
      case SalaryType.BY_HOUR:
        return `Ví dụ: Nếu nhân viên làm 160 giờ/tháng × ${amount.toLocaleString(
          "vi-VN"
        )} VNĐ/giờ = ${(160 * amount).toLocaleString("vi-VN")} VNĐ`;
      case SalaryType.BY_DAY:
        return `Ví dụ: Nếu nhân viên làm 22 ngày/tháng × ${amount.toLocaleString(
          "vi-VN"
        )} VNĐ/ngày = ${(22 * amount).toLocaleString("vi-VN")} VNĐ`;
      default:
        return null;
    }
  };

  return (
    <Form form={salaryForm} layout="vertical" className="mt-4 space-y-6">
      {/* Section 1: Lương cơ bản */}
      <Card
        title={<Typography.Text strong>Lương cơ bản</Typography.Text>}
        className="border border-gray-200"
      >
        <Form.Item
          label={
            <Space>
              <Typography.Text>Loại lương</Typography.Text>
              <Tooltip title="Chọn loại lương phù hợp với cách tính lương của nhân viên">
                <InfoCircleOutlined className="text-gray-400" />
              </Tooltip>
            </Space>
          }
          name="salaryType"
          rules={[{ required: true, message: "Vui lòng chọn loại lương!" }]}
          initialValue={SalaryType.FIXED}
        >
          <Select
            placeholder="Chọn loại lương"
            options={salaryTypeOptions}
            disabled={!!selectedTemplateId}
          />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.salaryType !== currentValues.salaryType ||
            prevValues.salaryAmount !== currentValues.salaryAmount
          }
        >
          {({ getFieldValue }) => {
            const salaryType = getFieldValue("salaryType");
            const salaryAmount = getFieldValue("salaryAmount");
            const preview = getSalaryPreview(salaryType, salaryAmount);
            return (
              <>
                <Form.Item
                  label={
                    <Space>
                      <Typography.Text>
                        {getSalaryAmountLabel(salaryType)}
                      </Typography.Text>
                      <Tooltip title={getSalaryTypeDescription(salaryType)}>
                        <InfoCircleOutlined className="text-gray-400" />
                      </Tooltip>
                    </Space>
                  }
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
                    parser={(value) =>
                      Number(value?.replace(/,/g, "") || 0) as any
                    }
                    addonAfter="VNĐ"
                    disabled={!!selectedTemplateId}
                  />
                </Form.Item>
                {preview && (
                  <Alert
                    message={preview}
                    type="info"
                    showIcon
                    className="mb-4"
                  />
                )}
              </>
            );
          }}
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <Typography.Text>Mẫu lương</Typography.Text>
              <Tooltip title="Chọn mẫu lương có sẵn để áp dụng nhanh (tùy chọn)">
                <InfoCircleOutlined className="text-gray-400" />
              </Tooltip>
            </Space>
          }
          name="salaryTemplateId"
        >
          <Select
            placeholder="Chọn mẫu lương (tùy chọn)"
            allowClear
            showSearch
            optionFilterProp="label"
            onChange={handleTemplateChange}
            options={templates.map((t) => ({
              label: t.name,
              value: t.id,
            }))}
            value={selectedTemplateId}
          />
        </Form.Item>
      </Card>

      {/* Section 2: Phần trăm triết khấu */}
      <Card
        title={<Typography.Text strong>Phần trăm triết khấu</Typography.Text>}
        className="border border-blue-200 bg-blue-50"
      >
        <Form.Item
          label="Phần trăm triết khấu (%)"
          name="bonusPercentage"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập phần trăm triết khấu!",
            },
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
            disabled={!!selectedTemplateId}
          />
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.bonusPercentage !== currentValues.bonusPercentage
          }
        >
          {({ getFieldValue }) => {
            const bonusPercentage = getFieldValue("bonusPercentage");
            if (bonusPercentage && bonusPercentage > 0) {
              return (
                <Alert
                  message={`Ví dụ: Nếu doanh thu 50,000,000 VNĐ × ${bonusPercentage}% = ${(
                    (50000000 * bonusPercentage) /
                    100
                  ).toLocaleString("vi-VN")} VNĐ thưởng`}
                  type="info"
                  showIcon
                />
              );
            }
            return null;
          }}
        </Form.Item>
      </Card>

      {/* Section 3: Hoa hồng từ đơn hàng */}
      <Alert
        message="Hoa hồng từ đơn hàng"
        description="Hoa hồng được tự động tính từ phần trăm triết khấu khi nhân viên được chọn làm tư vấn trong đơn hàng. Không cần thiết lập thêm ở đây."
        type="info"
        showIcon
        className="bg-yellow-50 border-yellow-200"
      />
    </Form>
  );
};

const MemberForm: React.FC<MemberFormProps> = ({
  member,
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [salaryForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [selectedRole, setSelectedRole] = useState<ROLES | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [saveAsTemplateModalVisible, setSaveAsTemplateModalVisible] =
    useState(false);
  const [templateName, setTemplateName] = useState("");
  const { message, modal } = App.useApp();

  // Load departments
  useEffect(() => {
    const unsubscribe = DepartmentService.onSnapshot((data) => {
      setDepartments(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (member && visible) {
      form.resetFields();
      salaryForm.resetFields();
      setSelectedRole(member.role);
      setActiveTab("info");
      form.setFieldsValue({
        ...member,
        date_of_birth: member.date_of_birth
          ? dayjs(member.date_of_birth)
          : null,
      });
    } else {
      form.resetFields();
      salaryForm.resetFields();
      setSelectedRole(null);
      setActiveTab("info");
      form.setFieldsValue({
        code: genCode("MEM_"),
        isActive: true,
      });
      salaryForm.setFieldsValue({
        salaryType: SalaryType.FIXED,
        enableRevenueBonus: false,
      });
    }
  }, [member, visible, form, salaryForm]);

  const getErrorMessage = (error: any): string => {
    // Handle API errors
    if (error.message) {
      return error.message;
    }

    // Handle Firebase Auth errors
    switch (error.code) {
      case "auth/email-already-in-use":
        return "Email này đã được sử dụng";
      case "auth/invalid-email":
        return "Email không hợp lệ";
      case "auth/operation-not-allowed":
        return "Đăng ký email/mật khẩu chưa được kích hoạt";
      case "auth/weak-password":
        return "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn";
      default:
        return "Đăng ký thất bại. Vui lòng thử lại";
    }
  };

  const handleSaveSalary = async (saveAsTemplate: boolean = false) => {
    try {
      setLoading(true);
      if (!member?.id) {
        message.warning("Vui lòng lưu thông tin nhân viên trước!");
        setLoading(false);
        return;
      }

      // validateFields() will throw if validation fails, so if we get here, all required fields are valid
      const salaryValues = await salaryForm.validateFields();

      const salaryData = {
        salaryType: salaryValues.salaryType,
        salaryAmount: salaryValues.salaryAmount,
        bonusPercentage: salaryValues.bonusPercentage ?? 0,
        salaryTemplateId: salaryValues.salaryTemplateId || undefined,
      };

      // Save salary config to Firebase (in members collection)
      await SalaryService.setSalary(member.id, salaryData);

      // Save as template if requested
      if (saveAsTemplate) {
        if (!templateName.trim()) {
          message.warning("Vui lòng nhập tên mẫu lương!");
          setLoading(false);
          return;
        }
        await SalaryService.createTemplate({
          name: templateName.trim(),
          salaryType: salaryData.salaryType,
          salaryAmount: salaryData.salaryAmount,
          bonusPercentage: salaryData.bonusPercentage ?? 0,
        });
        message.success("Đã lưu và tạo mẫu lương mới!");
        setSaveAsTemplateModalVisible(false);
        setTemplateName("");
      } else {
        message.success("Đã lưu thiết lập lương!");
      }

      // Close modal after successful save
      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Error saving salary:", error);
      message.error("Có lỗi xảy ra khi lưu thiết lập lương!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Remove departments field if role is not worker
      const memberData = {
        ...values,
        date_of_birth: values.date_of_birth?.format("YYYY-MM-DD"),
        departments:
          values.role === ROLES.worker ? values.departments : values.role,
      };

      let memberId: string;
      if (member?.id) {
        // For updates, use updateWithPassword to handle password changes
        // Only pass password if it's provided (not empty)
        const passwordToUpdate =
          values.password && values.password.trim() !== ""
            ? values.password
            : undefined;
        await MemberService.updateWithPassword(
          member.id,
          memberData,
          passwordToUpdate
        );
        memberId = member.id;
        message.success("Cập nhật nhân viên thành công!");
      } else {
        // For new members, use create (which already handles password)
        const newMember = await MemberService.create(memberData);
        memberId = newMember.id;
        message.success("Thêm nhân viên thành công!");
      }

      // If on salary tab, also save salary
      if (activeTab === "salary" && memberId) {
        try {
          const salaryValues = await salaryForm.validateFields();

          // Only save salary if required fields are present
          if (
            salaryValues.salaryType &&
            salaryValues.salaryAmount !== undefined
          ) {
            const salaryData = {
              salaryType: salaryValues.salaryType,
              salaryAmount: salaryValues.salaryAmount,
              bonusPercentage: salaryValues.bonusPercentage ?? 0,
              salaryTemplateId: salaryValues.salaryTemplateId || undefined,
            };
            // Save to Firebase (in members collection)
            await SalaryService.setSalary(memberId, salaryData);
          }
        } catch (salaryError) {
          console.error("Error saving salary:", salaryError);
          // Don't block member save if salary save fails, but show warning
          message.warning(
            "Đã lưu thông tin nhân viên nhưng có lỗi khi lưu thiết lập lương!"
          );
        }
      }

      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Error saving member:", error);
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = member
    ? `Cập nhật nhân viên | ${member.name}`
    : "Thêm nhân viên mới";

  return (
    <>
      <Modal
        title={modalTitle}
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "info",
              label: "Thông tin",
              children: (
                <Form form={form} layout="vertical">
                  <Form.Item
                    label={
                      member ? "Mã nhân viên" : "Mã nhân viên (Tự động tạo)"
                    }
                    name="code"
                    required
                  >
                    <Input placeholder="Nhập mã nhân viên" disabled />
                  </Form.Item>
                  <Form.Item name="id" style={{ display: "none" }}>
                    <Input hidden className="fixed" />
                  </Form.Item>
                  <Form.Item
                    label="Họ tên"
                    name="name"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ tên!" },
                    ]}
                  >
                    <Input placeholder="Nhập họ tên" />
                  </Form.Item>

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
                    <Input placeholder="Nhập số điện thoại" />
                  </Form.Item>

                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email!" },
                      { type: "email", message: "Email không hợp lệ!" },
                    ]}
                  >
                    <Input placeholder="Nhập email" />
                  </Form.Item>
                  <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[
                      {
                        required: !member,
                        message: "Vui lòng nhập mật khẩu!",
                      },
                      {
                        min: 6,
                        message: "Mật khẩu phải có ít nhất 6 ký tự!",
                      },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder={
                        member
                          ? "Để trống nếu không đổi mật khẩu"
                          : "Nhập mật khẩu"
                      }
                      type="password"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Ngày sinh"
                    name="date_of_birth"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn ngày sinh!",
                      },
                    ]}
                  >
                    <DatePicker
                      placeholder="Chọn ngày sinh"
                      format="DD/MM/YYYY"
                      className="w-full"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Chức vụ"
                    name="role"
                    rules={[
                      { required: true, message: "Vui lòng chọn chức vụ!" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn chức vụ"
                      allowClear
                      options={RolesOptions}
                      onChange={(value) => {
                        setSelectedRole(value);
                        // Clear departments when role changes
                        if (value !== ROLES.worker) {
                          form.setFieldValue("departments", undefined);
                        }
                      }}
                    />
                  </Form.Item>

                  {selectedRole === ROLES.worker && (
                    <Form.Item
                      label="Phòng ban"
                      name="departments"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn ít nhất một phòng ban!",
                        },
                      ]}
                    >
                      <Select
                        mode="multiple"
                        placeholder="Chọn phòng ban"
                        allowClear
                        options={departments.map((dept) => ({
                          label: dept.name,
                          value: dept.code,
                        }))}
                      />
                    </Form.Item>
                  )}

                  <Form.Item
                    label="Trạng thái hoạt động"
                    name="isActive"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="Hoạt động"
                      unCheckedChildren="Ngừng hoạt động"
                    />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: "salary",
              label: "Thiết lập lương",
              children: member ? (
                <SalarySetupTab memberId={member.id} form={salaryForm} />
              ) : (
                <div className="text-center py-8">
                  <Typography.Text type="secondary">
                    Vui lòng lưu thông tin nhân viên trước khi thiết lập lương
                  </Typography.Text>
                </div>
              ),
            },
          ]}
        />

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button onClick={onCancel}>Bỏ qua</Button>
          {activeTab === "salary" && member && (
            <>
              <Button
                onClick={() => setSaveAsTemplateModalVisible(true)}
                type="default"
              >
                Lưu và tạo mẫu lương mới
              </Button>
              <Button
                onClick={() => handleSaveSalary(false)}
                type="primary"
                loading={loading}
              >
                Lưu
              </Button>
            </>
          )}
          {activeTab === "info" && (
            <Button onClick={handleSubmit} type="primary" loading={loading}>
              {member ? "Cập nhật" : "Tạo mới"}
            </Button>
          )}
        </div>
      </Modal>

      {/* Modal for saving as template */}
      <Modal
        title="Tạo mẫu lương mới"
        open={saveAsTemplateModalVisible}
        onCancel={() => {
          setSaveAsTemplateModalVisible(false);
          setTemplateName("");
        }}
        onOk={() => handleSaveSalary(true)}
        okText="Tạo mẫu"
        cancelText="Hủy"
      >
        <Form layout="vertical">
          <Form.Item
            label="Tên mẫu lương"
            rules={[
              { required: true, message: "Vui lòng nhập tên mẫu lương!" },
            ]}
          >
            <Input
              placeholder="VD: Nhân viên Sales - Cố định + Thưởng"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

// Main Members Page Component
const MembersPage = () => {
  const [members, setMembers] = useState<IMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<IMembers | undefined>();
  const { message } = App.useApp();
  const { query, applyFilter, updateQueries, reset } = useFilter();
  const filteredMembers = applyFilter(members);

  // Load data
  useEffect(() => {
    const unsubscribeMembers = MemberService.onSnapshot((data) => {
      setMembers(data);
      setLoading(false);
    });

    return () => {
      unsubscribeMembers();
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await MemberService.delete(id);
      message.success("Xóa nhân viên thành công!");
    } catch (error) {
      console.error("Error deleting member:", error);
      message.error("Có lỗi xảy ra khi xóa nhân viên!");
    }
  };

  const columns: TableColumnsType<IMembers> = [
    {
      title: "Họ tên",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Chức vụ ",
      dataIndex: "role",
      key: "role",
      render: (role: ROLES) => RoleLabels[role] || role,
    },
    {
      title: "Ngày sinh",
      dataIndex: "date_of_birth",
      key: "date_of_birth",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    // {
    //   title: "Trạng thái",
    //   dataIndex: "isActive",
    //   key: "isActive",
    //   width: 120,
    //   render: (isActive: boolean) => (
    //     <span
    //       className={`px-2 py-1 rounded-full text-xs font-medium ${
    //         isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    //       }`}
    //     >
    //       {isActive !== false ? "Hoạt động" : "Ngừng hoạt động"}
    //     </span>
    //   ),
    // },
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
              setEditingMember(record);
              setFormVisible(true);
            }}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa nhân viên này?"
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
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm nhân viên...",
          filterKeys: ["name", "email", "phone", "role", "isActive"],
        },
        filters: {
          fields: [
            {
              label: "Chức vụ ",
              name: "role",
              type: "select",
              options: RolesOptions,
            },
            {
              label: "Trạng thái",
              name: "isActive",
              type: "select",
              options: [
                { label: "Tất cả", value: "" },
                { label: "Hoạt động", value: true },
                { label: "Ngừng hoạt động", value: false },
              ],
            },
          ],
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
        buttonEnds: [
          {
            can: true,
            type: "primary",
            name: "Thêm nhân viên",
            icon: <PlusOutlined />,
            onClick: () => {
              setEditingMember(undefined);
              setFormVisible(true);
            },
          },
        ],
      }}
      isLoading={loading}
    >
      <CommonTable
        dataSource={filteredMembers.reverse()}
        columns={columns}
        loading={loading}
        DrawerDetails={MemberDetails}
        paging={true}
        rank={true}
      />

      <MemberForm
        member={editingMember}
        visible={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingMember(undefined);
        }}
        onSuccess={() => {
          // Data will be updated through realtime listener
        }}
      />
    </WrapperContent>
  );
};

export default MembersPage;
