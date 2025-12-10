"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { DepartmentService, IDepartment } from "@/services/departmentService";
import { MemberService } from "@/services/memberService";
import { SalaryService } from "@/services/salaryService";
import { RoleLabels, ROLES, RolesOptions } from "@/types/enum";
import { IMembers } from "@/types/members";
import { SalaryConfig, SalaryTemplate, SalaryType } from "@/types/salary";
import { generateRandomCode } from "@/utils/generateRandomCode";
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  LockOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  App,
  Button,
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
}> = ({ memberId, form }) => {
  const [salaryForm] = Form.useForm();
  const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [enableRevenueBonus, setEnableRevenueBonus] = useState(false);
  const { message } = App.useApp();

  // Load salary templates
  useEffect(() => {
    const unsubscribe = SalaryService.onTemplatesSnapshot((data) => {
      setTemplates(data);
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
            salaryForm.setFieldsValue(salary);
            setEnableRevenueBonus(salary.enableRevenueBonus || false);
          } else {
            salaryForm.resetFields();
            salaryForm.setFieldsValue({
              salaryType: SalaryType.FIXED,
              enableRevenueBonus: false,
            });
            setEnableRevenueBonus(false);
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
        enableRevenueBonus: false,
      });
      setEnableRevenueBonus(false);
    }
  }, [memberId, salaryForm]);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      salaryForm.setFieldsValue({
        salaryType: template.salaryType,
        salaryAmount: template.salaryAmount,
        enableRevenueBonus: template.enableRevenueBonus,
        bonusPercentage: template.bonusPercentage,
        salaryTemplateId: templateId,
      });
      setEnableRevenueBonus(template.enableRevenueBonus || false);
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

  return (
    <Form form={salaryForm} layout="vertical" className="mt-4">
      <Form.Item
        label={
          <Space>
            <Typography.Text>Loại lương</Typography.Text>
            <InfoCircleOutlined className="text-gray-400" />
          </Space>
        }
        name="salaryType"
        rules={[{ required: true, message: "Vui lòng chọn loại lương!" }]}
        initialValue={SalaryType.FIXED}
      >
        <Select placeholder="Chọn loại lương" options={salaryTypeOptions} />
      </Form.Item>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.salaryType !== currentValues.salaryType
        }
      >
        {({ getFieldValue }) => {
          const salaryType = getFieldValue("salaryType");
          return (
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
                className="w-full"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => Number(value?.replace(/,/g, "") || 0) as any}
                addonAfter="VNĐ"
              />
            </Form.Item>
          );
        }}
      </Form.Item>

      <Form.Item
        label={
          <Space>
            <Typography.Text>Mẫu lương</Typography.Text>
            <InfoCircleOutlined className="text-gray-400" />
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
        />
      </Form.Item>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <Form.Item
          name="enableRevenueBonus"
          valuePropName="checked"
          className="mb-4"
        >
          <Switch
            checkedChildren="Bật"
            unCheckedChildren="Tắt"
            onChange={(checked) => setEnableRevenueBonus(checked)}
          />
        </Form.Item>
        <span className="text-sm text-gray-600 block mb-4">
          Thiết lập thưởng theo doanh thu cho nhân viên
        </span>

        {enableRevenueBonus && (
          <Form.Item
            label="% Thưởng theo doanh thu"
            name="bonusPercentage"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập % thưởng!",
              },
              {
                type: "number",
                min: 0,
                max: 100,
                message: "% thưởng phải từ 0 đến 100!",
              },
            ]}
          >
            <InputNumber
              placeholder="Nhập % thưởng"
              className="w-full"
              min={0}
              max={100}
              formatter={(value) => `${value}%`}
              parser={(value) => Number(value?.replace("%", "") || 0) as any}
              step={0.1}
              precision={1}
            />
          </Form.Item>
        )}
      </div>
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
        code: generateRandomCode("MEM_"),
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
      if (!member?.id) {
        message.warning("Vui lòng lưu thông tin nhân viên trước!");
        return;
      }

      // validateFields() will throw if validation fails, so if we get here, all required fields are valid
      const salaryValues = await salaryForm.validateFields();

      const salaryConfig: SalaryConfig = {
        salaryType: salaryValues.salaryType,
        salaryAmount: salaryValues.salaryAmount,
        enableRevenueBonus: salaryValues.enableRevenueBonus || false,
        bonusPercentage: salaryValues.enableRevenueBonus
          ? salaryValues.bonusPercentage
          : undefined,
        salaryTemplateId: salaryValues.salaryTemplateId || undefined,
      };

      // Save salary config
      await SalaryService.setSalary(member.id, salaryConfig);

      // Save as template if requested
      if (saveAsTemplate) {
        if (!templateName.trim()) {
          message.warning("Vui lòng nhập tên mẫu lương!");
          return;
        }
        await SalaryService.createTemplate({
          name: templateName.trim(),
          salaryType: salaryConfig.salaryType,
          salaryAmount: salaryConfig.salaryAmount,
          enableRevenueBonus: salaryConfig.enableRevenueBonus,
          bonusPercentage: salaryConfig.bonusPercentage,
        });
        message.success("Đã lưu và tạo mẫu lương mới!");
        setSaveAsTemplateModalVisible(false);
        setTemplateName("");
      } else {
        message.success("Đã lưu thiết lập lương!");
      }
    } catch (error) {
      console.error("Error saving salary:", error);
      message.error("Có lỗi xảy ra khi lưu thiết lập lương!");
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
            const salaryConfig: SalaryConfig = {
              salaryType: salaryValues.salaryType,
              salaryAmount: salaryValues.salaryAmount,
              enableRevenueBonus: salaryValues.enableRevenueBonus || false,
              bonusPercentage: salaryValues.enableRevenueBonus
                ? salaryValues.bonusPercentage
                : undefined,
              salaryTemplateId: salaryValues.salaryTemplateId || undefined,
            };
            await SalaryService.setSalary(memberId, salaryConfig);
          }
        } catch (salaryError) {
          console.error("Error saving salary:", salaryError);
          // Don't block member save if salary save fails
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
