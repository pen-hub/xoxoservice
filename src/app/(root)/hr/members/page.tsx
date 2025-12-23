"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import RichTextEditor from "@/components/RichTextEditor";
import WrapperContent from "@/components/WrapperContent";
import useColumn from "@/hooks/useColumn";
import { useFileExport } from "@/hooks/useFileExport";
import { useRealtimeList } from "@/firebase/hooks/useRealtimeList";
import useFilter from "@/hooks/useFilter";
import { DepartmentService, IDepartment } from "@/services/departmentService";
import { MemberService } from "@/services/memberService";
import { SalaryService } from "@/services/salaryService";
import { RoleLabels, ROLES, RolesOptions } from "@/types/enum";
import { IMembers } from "@/types/members";
import { FirebaseOrderData, OrderStatus } from "@/types/order";
import {
    CommissionRule,
    ExtendedSalaryConfig,
    SalaryTemplate,
    SalaryType,
} from "@/types/salary";
import { genCode } from "@/utils/genCode";
import {
    DeleteOutlined,
    EditOutlined,
    FileExcelOutlined,
    InfoCircleOutlined,
    LockOutlined,
    MoreOutlined,
    PlusOutlined,
    UploadOutlined,
    UserOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
    App,
    Avatar,
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Drawer,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Progress,
    Radio,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tabs,
    Tag,
    Tooltip,
    Typography,
    Upload,
    Statistic,
} from "antd";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
} from "recharts";
import type { RcFile, UploadFile } from "antd/es/upload";
import dayjs from "dayjs";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useCallback, useEffect, useMemo, useState } from "react";

const { Option } = Select;

// Member Details Drawer Component
const MemberDetails: React.FC<PropRowDetails<IMembers>> = ({
    data,
    onClose,
}) => {
    const [departments, setDepartments] = useState<IDepartment[]>([]);
    const [salaryInfo, setSalaryInfo] = useState<any>(null);
    const [loadingSalary, setLoadingSalary] = useState(false);

    useEffect(() => {
        const unsubscribe = DepartmentService.onSnapshot((data) => {
            setDepartments(data);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Load salary information
    useEffect(() => {
        if (data?.id) {
            setLoadingSalary(true);
            SalaryService.getSalaryByMemberId(data.id)
                .then((salary) => {
                    setSalaryInfo(salary);
                })
                .catch((error) => {
                    console.error("Error loading salary:", error);
                })
                .finally(() => {
                    setLoadingSalary(false);
                });
        }
    }, [data?.id]);

    if (!data) return null;

    const getDepartmentNames = (codes?: string[]) => {
        if (!codes || codes.length === 0) return "N/A";
        return codes
            .map(
                (code) =>
                    departments.find((d) => d.code === code)?.name || code,
            )
            .join(", ");
    };

    const getSalaryTypeLabel = (type?: SalaryType) => {
        if (!type) return "-";
        const labels: Record<SalaryType, string> = {
            [SalaryType.FIXED]: "Lương cơ bản",
            [SalaryType.BY_SHIFT]: "Lương theo ca",
            [SalaryType.BY_HOUR]: "Lương theo giờ",
            [SalaryType.BY_DAY]: "Theo ngày công chuẩn",
            [SalaryType.KPI_BONUS]: "Thưởng KPI",
        };
        return labels[type] || type;
    };

    const formatCurrency = (value?: number) => {
        if (!value && value !== 0) return "-";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value);
    };

    return (
        <div className="space-y-6">
            {/* Thông tin nhân viên */}
            <Card title="Thông tin nhân viên" size="small">
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Mã nhân viên">
                        <Typography.Text strong className="text-primary">
                            {data.code}
                        </Typography.Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Họ tên">
                        <Typography.Text strong>{data.name}</Typography.Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                        {data.phone || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                        {data.email || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Chức vụ">
                        <Tag color="blue">
                            {RoleLabels[data.role] || data.role}
                        </Tag>
                    </Descriptions.Item>
                    {data.role === ROLES.worker && (
                        <Descriptions.Item label="Phòng ban">
                            {getDepartmentNames(data.departments)}
                        </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Ngày sinh">
                        {data.date_of_birth
                            ? dayjs(data.date_of_birth).format("DD/MM/YYYY")
                            : "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        <Tag
                            color={data.isActive !== false ? "green" : "red"}
                        >
                            {data.isActive !== false
                                ? "Hoạt động"
                                : "Ngừng hoạt động"}
                        </Tag>
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            {/* Thông số tính lương */}
            <Card title="Thông số tính lương" size="small">
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Loại lương">
                        {getSalaryTypeLabel(data.salaryType) !== "-" ? (
                            <Tag color="cyan">
                                {getSalaryTypeLabel(data.salaryType)}
                            </Tag>
                        ) : (
                            <Typography.Text type="secondary">-</Typography.Text>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số giờ đi muộn">
                        {data.lateHours !== undefined ? (
                            <Typography.Text>
                                {data.lateHours} giờ
                            </Typography.Text>
                        ) : (
                            <Typography.Text type="secondary">-</Typography.Text>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày nghỉ có phép">
                        {data.approvedLeaveDays !== undefined ? (
                            <Typography.Text>
                                {data.approvedLeaveDays} ngày
                            </Typography.Text>
                        ) : (
                            <Typography.Text type="secondary">-</Typography.Text>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nghỉ không phép">
                        {data.unapprovedLeaveDays !== undefined ? (
                            <Typography.Text>
                                {data.unapprovedLeaveDays} ngày
                            </Typography.Text>
                        ) : (
                            <Typography.Text type="secondary">-</Typography.Text>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tổng tiền phạt">
                        {data.totalFines !== undefined ? (
                            <Typography.Text strong className="text-red-600">
                                {formatCurrency(data.totalFines)}
                            </Typography.Text>
                        ) : (
                            <Typography.Text type="secondary">-</Typography.Text>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tổng doanh số">
                        {data.totalRevenue !== undefined ? (
                            <Typography.Text strong className="text-green-600">
                                {formatCurrency(data.totalRevenue)}
                            </Typography.Text>
                        ) : (
                            <Typography.Text type="secondary">-</Typography.Text>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tổng thưởng hoa hồng">
                        {data.totalCommission !== undefined ? (
                            <Typography.Text strong className="text-blue-600">
                                {formatCurrency(data.totalCommission)}
                            </Typography.Text>
                        ) : (
                            <Typography.Text type="secondary">-</Typography.Text>
                        )}
                    </Descriptions.Item>
                </Descriptions>
            </Card>
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
    onCommissionRulesChange?: (rules: CommissionRule[]) => void;
}> = ({ memberId, form: salaryForm, onCommissionRulesChange }) => {
    const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
    const [loadingSalary, setLoadingSalary] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
        null,
    );
    const [enableRevenueBonus, setEnableRevenueBonus] = useState(false);
    const [enableCommission, setEnableCommission] = useState(false);
    const [enableAllowance, setEnableAllowance] = useState(false);
    const [enableDeduction, setEnableDeduction] = useState(false);
    const [commissionRules, setCommissionRules] = useState<CommissionRule[]>(
        [],
    );
    const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
    const [editingCommissionRule, setEditingCommissionRule] =
        useState<CommissionRule | null>(null);
    const [commissionForm] = Form.useForm();
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

    // Load existing salary config and member data when memberId changes
    useEffect(() => {
        if (memberId) {
            setLoadingSalary(true);
            Promise.all([
                SalaryService.getSalaryByMemberId(memberId),
                MemberService.getById(memberId),
            ])
                .then(([salary, member]) => {
                    if (salary) {
                        salaryForm.setFieldsValue({
                            salaryType: salary.salaryType,
                            salaryAmount: salary.salaryAmount,
                            bonusPercentage: salary.bonusPercentage ?? 0,
                            salaryTemplateId: salary.salaryTemplateId,
                            enableRevenueBonus:
                                salary.enableRevenueBonus || false,
                            enableCommission:
                                (salary as ExtendedSalaryConfig)
                                    .enableCommission || false,
                            enableAllowance:
                                (salary as ExtendedSalaryConfig)
                                    .enableAllowance || false,
                            enableDeduction:
                                (salary as ExtendedSalaryConfig)
                                    .enableDeduction || false,
                            // Load thông số từ member
                            lateHours: member?.lateHours ?? 0,
                            approvedLeaveDays: member?.approvedLeaveDays ?? 0,
                            unapprovedLeaveDays: member?.unapprovedLeaveDays ?? 0,
                            totalFines: member?.totalFines ?? 0,
                            totalRevenue: member?.totalRevenue ?? 0,
                            totalCommission: member?.totalCommission ?? 0,
                        });
                        setSelectedTemplateId(salary.salaryTemplateId || null);
                        setEnableRevenueBonus(
                            salary.enableRevenueBonus || false,
                        );
                        setEnableCommission(
                            (salary as ExtendedSalaryConfig).enableCommission ||
                                false,
                        );
                        setEnableAllowance(
                            (salary as ExtendedSalaryConfig).enableAllowance ||
                                false,
                        );
                        setEnableDeduction(
                            (salary as ExtendedSalaryConfig).enableDeduction ||
                                false,
                        );
                        setCommissionRules(
                            (salary as ExtendedSalaryConfig).commissionRules ||
                                [],
                        );
                    } else {
                        salaryForm.resetFields();
                        salaryForm.setFieldsValue({
                            salaryType: SalaryType.FIXED,
                            bonusPercentage: 0,
                            enableRevenueBonus: false,
                            enableCommission: false,
                            enableAllowance: false,
                            enableDeduction: false,
                            lateHours: member?.lateHours ?? 0,
                            approvedLeaveDays: member?.approvedLeaveDays ?? 0,
                            unapprovedLeaveDays: member?.unapprovedLeaveDays ?? 0,
                            totalFines: member?.totalFines ?? 0,
                            totalRevenue: member?.totalRevenue ?? 0,
                            totalCommission: member?.totalCommission ?? 0,
                        });
                        setSelectedTemplateId(null);
                        setEnableRevenueBonus(false);
                        setEnableCommission(false);
                        setEnableAllowance(false);
                        setEnableDeduction(false);
                        setCommissionRules([]);
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
                enableRevenueBonus: false,
                enableCommission: false,
                enableAllowance: false,
                enableDeduction: false,
                lateHours: 0,
                approvedLeaveDays: 0,
                unapprovedLeaveDays: 0,
                totalFines: 0,
                totalRevenue: 0,
                totalCommission: 0,
            });
            setSelectedTemplateId(null);
            setEnableRevenueBonus(false);
            setEnableCommission(false);
            setEnableAllowance(false);
            setEnableDeduction(false);
            setCommissionRules([]);
        }
    }, [memberId, salaryForm]);

    const handleTemplateChange = useCallback((templateId: string | null) => {
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
    }, [templates, salaryForm]);

    const salaryTypeOptions = [
        { label: "Lương cơ bản", value: SalaryType.FIXED },
        { label: "Lương theo giờ", value: SalaryType.BY_HOUR },
        { label: "Lương theo ca", value: SalaryType.BY_SHIFT },
        { label: "Thưởng KPI", value: SalaryType.KPI_BONUS },
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
            case SalaryType.KPI_BONUS:
                return "Mức thưởng KPI (VNĐ)";
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
            case SalaryType.KPI_BONUS:
                return "Thưởng KPI dựa trên hiệu suất làm việc và đạt mục tiêu";
            default:
                return "";
        }
    };

    const getSalaryPreview = (type: SalaryType, amount: number) => {
        if (!amount || amount <= 0) return null;
        switch (type) {
            case SalaryType.BY_SHIFT:
                return `Ví dụ: Nếu nhân viên làm 20 ca/tháng × ${amount.toLocaleString(
                    "vi-VN",
                )} VNĐ/ca = ${(20 * amount).toLocaleString("vi-VN")} VNĐ`;
            case SalaryType.BY_HOUR:
                return `Ví dụ: Nếu nhân viên làm 160 giờ/tháng × ${amount.toLocaleString(
                    "vi-VN",
                )} VNĐ/giờ = ${(160 * amount).toLocaleString("vi-VN")} VNĐ`;
            case SalaryType.BY_DAY:
                return `Ví dụ: Nếu nhân viên làm 22 ngày/tháng × ${amount.toLocaleString(
                    "vi-VN",
                )} VNĐ/ngày = ${(22 * amount).toLocaleString("vi-VN")} VNĐ`;
            default:
                return null;
        }
    };

    const handleAddCommission = useCallback(() => {
        setEditingCommissionRule(null);
        commissionForm.resetFields();
        setIsCommissionModalOpen(true);
    }, [commissionForm]);

    const handleEditCommission = useCallback((rule: CommissionRule) => {
        setEditingCommissionRule(rule);
        commissionForm.setFieldsValue(rule);
        setIsCommissionModalOpen(true);
    }, [commissionForm]);

    const handleDeleteCommission = useCallback((id: string) => {
        const newRules = commissionRules.filter((r) => r.id !== id);
        setCommissionRules(newRules);
        onCommissionRulesChange?.(newRules);
    }, [commissionRules, onCommissionRulesChange]);

    const handleSaveCommission = useCallback(() => {
        commissionForm.validateFields().then((values) => {
            let newRules: CommissionRule[];
            if (editingCommissionRule) {
                newRules = commissionRules.map((r) =>
                    r.id === editingCommissionRule.id
                        ? { ...r, ...values, updatedAt: Date.now() }
                        : r,
                );
            } else {
                const newRule: CommissionRule = {
                    id: genCode("COMM_"),
                    ...values,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                newRules = [...commissionRules, newRule];
            }
            setCommissionRules(newRules);
            onCommissionRulesChange?.(newRules);
            setIsCommissionModalOpen(false);
            commissionForm.resetFields();
            setEditingCommissionRule(null);
        });
    }, [commissionForm, editingCommissionRule, commissionRules, onCommissionRulesChange]);

    const handleEditCommissionClick = useCallback((record: CommissionRule) => () => {
        handleEditCommission(record);
    }, [handleEditCommission]);

    const handleDeleteCommissionClick = useCallback((id: string) => () => {
        handleDeleteCommission(id);
    }, [handleDeleteCommission]);

    const commissionColumns: TableColumnsType<CommissionRule> = useMemo(() => [
        {
            title: "Loại hình",
            dataIndex: "type",
            key: "type",
            width: 200,
            render: (type: string) => {
                const typeMap: Record<string, string> = {
                    service_execution: "Thực hiện dịch vụ",
                    sales_consultation: "Tư vấn bán hàng",
                };
                return typeMap[type] || type;
            },
        },
        {
            title: "Doanh thu",
            dataIndex: "revenueFrom",
            key: "revenueFrom",
            width: 200,
            render: (revenue: number) => (
                <Space>
                    <Typography.Text>Từ</Typography.Text>
                    <Typography.Text strong>
                        {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                        }).format(revenue)}
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: "Hoa hồng thụ hưởng",
            dataIndex: "commissionType",
            key: "commissionType",
            width: 200,
            render: (type: string) => {
                const typeMap: Record<string, string> = {
                    general_table: "Bảng hoa hồng chung",
                    custom: "Tùy chỉnh",
                };
                return typeMap[type] || type;
            },
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 100,
            render: (_: unknown, record: CommissionRule) => (
                <Space size="small">
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={handleEditCommissionClick(record)}
                    />
                    <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteCommissionClick(record.id)}
                    />
                </Space>
            ),
        },
    ], [handleEditCommissionClick, handleDeleteCommissionClick]);

    return (
        <Form
            form={salaryForm}
            layout="vertical"
            className="mt-4 space-y-6 flex flex-col gap-4"
        >
            {/* Section 1: Lương chính */}
            <Card
                title={<Typography.Text strong>Lương chính</Typography.Text>}
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
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn loại lương!",
                        },
                    ]}
                    initialValue={SalaryType.FIXED}
                >
                    <Select
                        placeholder="Chọn Loại lương"
                        options={salaryTypeOptions}
                        disabled={!!selectedTemplateId}
                    />
                </Form.Item>

                <Form.Item
                    label={
                        <Space>
                            <Typography.Text>Mẫu lương</Typography.Text>
                            <Tooltip title="Chọn mẫu lương có sẵn để áp dụng nhanh">
                                <InfoCircleOutlined className="text-gray-400" />
                            </Tooltip>
                        </Space>
                    }
                    name="salaryTemplateId"
                >
                    <Select
                        placeholder="Chọn mẫu lương có sẵn"
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

            {/* Section 1.5: Thông số tính lương */}
            <Card
                title={<Typography.Text strong>Thông số tính lương</Typography.Text>}
                className="border border-gray-200"
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Số giờ đi muộn"
                            name="lateHours"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    message: "Số giờ đi muộn phải lớn hơn hoặc bằng 0!",
                                },
                            ]}
                            initialValue={0}
                        >
                            <InputNumber
                                placeholder="Nhập số giờ đi muộn"
                                style={{ width: "100%" }}
                                min={0}
                                addonAfter="giờ"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Ngày nghỉ có phép"
                            name="approvedLeaveDays"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    message: "Ngày nghỉ có phép phải lớn hơn hoặc bằng 0!",
                                },
                            ]}
                            initialValue={0}
                        >
                            <InputNumber
                                placeholder="Nhập số ngày nghỉ có phép"
                                style={{ width: "100%" }}
                                min={0}
                                addonAfter="ngày"
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Nghỉ không phép"
                            name="unapprovedLeaveDays"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    message: "Nghỉ không phép phải lớn hơn hoặc bằng 0!",
                                },
                            ]}
                            initialValue={0}
                        >
                            <InputNumber
                                placeholder="Nhập số ngày nghỉ không phép"
                                style={{ width: "100%" }}
                                min={0}
                                addonAfter="ngày"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Tổng tiền phạt"
                            name="totalFines"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    message: "Tổng tiền phạt phải lớn hơn hoặc bằng 0!",
                                },
                            ]}
                            initialValue={0}
                        >
                            <InputNumber
                                placeholder="Nhập tổng tiền phạt"
                                style={{ width: "100%" }}
                                min={0}
                                formatter={(value) =>
                                    `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ",",
                                    )
                                }
                                parser={(value) =>
                                    Number(value?.replace(/,/g, "") || 0) as any
                                }
                                addonAfter="VNĐ"
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Tổng doanh số"
                            name="totalRevenue"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    message: "Tổng doanh số phải lớn hơn hoặc bằng 0!",
                                },
                            ]}
                            initialValue={0}
                        >
                            <InputNumber
                                placeholder="Nhập tổng doanh số"
                                style={{ width: "100%" }}
                                min={0}
                                formatter={(value) =>
                                    `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ",",
                                    )
                                }
                                parser={(value) =>
                                    Number(value?.replace(/,/g, "") || 0) as any
                                }
                                addonAfter="VNĐ"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Tổng thưởng hoa hồng"
                            name="totalCommission"
                            rules={[
                                {
                                    type: "number",
                                    min: 0,
                                    message: "Tổng thưởng hoa hồng phải lớn hơn hoặc bằng 0!",
                                },
                            ]}
                            initialValue={0}
                        >
                            <InputNumber
                                placeholder="Nhập tổng thưởng hoa hồng"
                                style={{ width: "100%" }}
                                min={0}
                                formatter={(value) =>
                                    `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ",",
                                    )
                                }
                                parser={(value) =>
                                    Number(value?.replace(/,/g, "") || 0) as any
                                }
                                addonAfter="VNĐ"
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            {/* Section 2: Thưởng */}
            <Card className="border border-gray-200">
                <Space className="w-full justify-between mb-4">
                    <div className="flex-1">
                        <Typography.Text strong className="text-base">
                            Thưởng
                        </Typography.Text>
                        <div className="mt-1">
                            <Typography.Text
                                type="secondary"
                                className="text-sm"
                            >
                                Thiết lập thưởng theo doanh thu cho nhân viên
                            </Typography.Text>
                        </div>
                    </div>
                    <Form.Item
                        name="enableRevenueBonus"
                        valuePropName="checked"
                        noStyle
                    >
                        <Switch
                            checked={enableRevenueBonus}
                            onChange={setEnableRevenueBonus}
                        />
                    </Form.Item>
                </Space>
                {enableRevenueBonus && (
                    <Form.Item
                        label="Phần trăm thưởng (%)"
                        name="bonusPercentage"
                        rules={[
                            {
                                type: "number",
                                min: 0,
                                max: 100,
                                message: "Phần trăm thưởng phải từ 0 đến 100!",
                            },
                        ]}
                        initialValue={0}
                    >
                        <InputNumber
                            placeholder="Nhập phần trăm thưởng"
                            style={{ width: "100%" }}
                            min={0}
                            max={100}
                            formatter={(value) => `${value}%`}
                            parser={(value) =>
                                Number(value?.replace("%", "") || 0) as any
                            }
                            step={0.1}
                            precision={1}
                        />
                    </Form.Item>
                )}
            </Card>

            {/* Section 3: Hoa hồng */}
            <Card className="border border-gray-200">
                <Space className="w-full justify-between mb-4">
                    <div className="flex-1">
                        <Typography.Text strong className="text-base">
                            Hoa hồng
                        </Typography.Text>
                        <div className="mt-1">
                            <Typography.Text
                                type="secondary"
                                className="text-sm"
                            >
                                Thiết lập mức hoa hồng theo sản phẩm hoặc dịch
                                vụ
                            </Typography.Text>
                        </div>
                    </div>
                    <Form.Item
                        name="enableCommission"
                        valuePropName="checked"
                        noStyle
                    >
                        <Switch
                            checked={enableCommission}
                            onChange={setEnableCommission}
                        />
                    </Form.Item>
                </Space>
                {enableCommission && (
                    <div className="mt-4">
                        <Table
                            columns={commissionColumns}
                            dataSource={commissionRules}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            locale={{ emptyText: "Chưa có quy tắc hoa hồng" }}
                        />
                        <Button
                            type="link"
                            icon={<PlusOutlined />}
                            onClick={handleAddCommission}
                            className="mt-2"
                        >
                            Thêm hoa hồng
                        </Button>
                    </div>
                )}
            </Card>

            {/* Section 4: Phụ cấp */}
            <Card className="border border-gray-200">
                <Space className="w-full justify-between mb-4">
                    <div className="flex-1">
                        <Typography.Text strong className="text-base">
                            Phụ cấp
                        </Typography.Text>
                        <div className="mt-1">
                            <Typography.Text
                                type="secondary"
                                className="text-sm"
                            >
                                Thiết lập khoản hỗ trợ làm việc như ăn trưa, đi
                                lại, điện thoại, ...
                            </Typography.Text>
                        </div>
                    </div>
                    <Form.Item
                        name="enableAllowance"
                        valuePropName="checked"
                        noStyle
                    >
                        <Switch
                            checked={enableAllowance}
                            onChange={setEnableAllowance}
                        />
                    </Form.Item>
                </Space>
            </Card>

            {/* Section 5: Giảm trừ */}
            <Card className="border border-gray-200">
                <Space className="w-full justify-between mb-4">
                    <div className="flex-1">
                        <Typography.Text strong className="text-base">
                            Giảm trừ
                        </Typography.Text>
                        <div className="mt-1">
                            <Typography.Text
                                type="secondary"
                                className="text-sm"
                            >
                                Thiết lập khoản giảm trừ như đi muộn, về sớm, vi
                                phạm nội quy, ...
                            </Typography.Text>
                        </div>
                    </div>
                    <Form.Item
                        name="enableDeduction"
                        valuePropName="checked"
                        noStyle
                    >
                        <Switch
                            checked={enableDeduction}
                            onChange={setEnableDeduction}
                        />
                    </Form.Item>
                </Space>
            </Card>

            {/* Commission Modal */}
            <Modal
                title={
                    editingCommissionRule
                        ? "Chỉnh sửa hoa hồng"
                        : "Thêm hoa hồng"
                }
                open={isCommissionModalOpen}
                onOk={handleSaveCommission}
                onCancel={() => {
                    setIsCommissionModalOpen(false);
                    commissionForm.resetFields();
                    setEditingCommissionRule(null);
                }}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form form={commissionForm} layout="vertical" className="mt-4">
                    <Form.Item
                        label="Loại hình"
                        name="type"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn loại hình!",
                            },
                        ]}
                    >
                        <Select
                            placeholder="Chọn loại hình"
                            options={[
                                {
                                    label: "Thực hiện dịch vụ",
                                    value: "service_execution",
                                },
                                {
                                    label: "Tư vấn bán hàng",
                                    value: "sales_consultation",
                                },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        label={
                            <Space>
                                <Typography.Text>Doanh thu</Typography.Text>
                                <Tooltip title="Doanh thu từ mức này trở lên">
                                    <InfoCircleOutlined className="text-gray-400" />
                                </Tooltip>
                            </Space>
                        }
                        name="revenueFrom"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập doanh thu!",
                            },
                        ]}
                    >
                        <Space>
                            <Typography.Text>Từ</Typography.Text>
                            <InputNumber
                                placeholder="0"
                                style={{ width: "100%" }}
                                formatter={(value) =>
                                    `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ",",
                                    )
                                }
                                parser={(value) =>
                                    Number(value?.replace(/,/g, "") || 0) as any
                                }
                                addonAfter="VNĐ"
                            />
                        </Space>
                    </Form.Item>
                    <Form.Item
                        label="Hoa hồng thụ hưởng"
                        name="commissionType"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn loại hoa hồng!",
                            },
                        ]}
                        initialValue="general_table"
                    >
                        <Select
                            placeholder="Chọn hoa hồng thụ hưởng"
                            options={[
                                {
                                    label: "Bảng hoa hồng chung",
                                    value: "general_table",
                                },
                                { label: "Tùy chỉnh", value: "custom" },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
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
    const [uploading, setUploading] = useState(false);
    const [avatarFileList, setAvatarFileList] = useState<UploadFile[]>([]);
    const [departments, setDepartments] = useState<IDepartment[]>([]);
    const [selectedRole, setSelectedRole] = useState<ROLES | null>(null);
    const [activeTab, setActiveTab] = useState("info");
    const [saveAsTemplateModalVisible, setSaveAsTemplateModalVisible] =
        useState(false);
    const [templateName, setTemplateName] = useState("");
    const [commissionRules, setCommissionRules] = useState<CommissionRule[]>(
        [],
    );
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

    // Handle avatar upload
    const handleAvatarUpload = async (file: RcFile): Promise<string> => {
        try {
            setUploading(true);
            const storage = getStorage();
            const fileName = `members/${member?.id || "new"}/avatar_${Date.now()}_${file.name}`;
            const storageReference = ref(storage, fileName);
            const snapshot = await uploadBytes(storageReference, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading avatar:", error);
            message.error("Không thể tải ảnh lên");
            throw error;
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (member && visible) {
            form.resetFields();
            salaryForm.resetFields();
            setSelectedRole(member.role);
            setActiveTab("info");
            // Set avatar file list if member has avatar
            if (member.avatar) {
                setAvatarFileList([
                    {
                        uid: "-1",
                        name: "avatar",
                        status: "done",
                        url: member.avatar,
                    },
                ]);
            } else {
                setAvatarFileList([]);
            }
            form.setFieldsValue({
                ...member,
                date_of_birth: member.date_of_birth
                    ? dayjs(member.date_of_birth)
                    : null,
                startDate: member.startDate ? dayjs(member.startDate) : null,
            });
        } else {
            form.resetFields();
            salaryForm.resetFields();
            setSelectedRole(null);
            setActiveTab("info");
            setAvatarFileList([]);
            form.setFieldsValue({
                code: genCode("MEM_"),
                isActive: true,
                gender: "male",
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

            // Get commission rules from SalarySetupTab state
            // Note: commissionRules is managed in SalarySetupTab component
            const salaryData: ExtendedSalaryConfig = {
                salaryType: salaryValues.salaryType,
                salaryAmount: salaryValues.salaryAmount,
                enableRevenueBonus: salaryValues.enableRevenueBonus || false,
                bonusPercentage: salaryValues.bonusPercentage ?? 0,
                salaryTemplateId: salaryValues.salaryTemplateId || undefined,
                enableCommission: salaryValues.enableCommission || false,
                commissionRules: salaryValues.enableCommission
                    ? commissionRules
                    : undefined,
                enableAllowance: salaryValues.enableAllowance || false,
                enableDeduction: salaryValues.enableDeduction || false,
            };

            // Save salary config to Firebase (in members collection)
            await SalaryService.setSalary(member.id, salaryData);

            // Save thông số tính lương vào member data
            await MemberService.update(member.id, {
                lateHours: salaryValues.lateHours ?? 0,
                approvedLeaveDays: salaryValues.approvedLeaveDays ?? 0,
                unapprovedLeaveDays: salaryValues.unapprovedLeaveDays ?? 0,
                totalFines: salaryValues.totalFines ?? 0,
                totalRevenue: salaryValues.totalRevenue ?? 0,
                totalCommission: salaryValues.totalCommission ?? 0,
            });

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

            // Handle avatar upload if new file was uploaded
            let avatarUrl = values.avatar;
            if (avatarFileList.length > 0 && avatarFileList[0].originFileObj) {
                avatarUrl = await handleAvatarUpload(
                    avatarFileList[0].originFileObj as RcFile,
                );
            }

            // Remove departments field if role is not worker
            const memberData = {
                ...values,
                avatar: avatarUrl,
                date_of_birth: values.date_of_birth?.format("YYYY-MM-DD"),
                startDate: values.startDate?.format("YYYY-MM-DD"),
                departments:
                    values.role === ROLES.worker
                        ? values.departments
                        : values.role,
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
                    passwordToUpdate,
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
                            salaryTemplateId:
                                salaryValues.salaryTemplateId || undefined,
                        };
                        // Save to Firebase (in members collection)
                        await SalaryService.setSalary(memberId, salaryData);
                    }
                } catch (salaryError) {
                    console.error("Error saving salary:", salaryError);
                    // Don't block member save if salary save fails, but show warning
                    message.warning(
                        "Đã lưu thông tin nhân viên nhưng có lỗi khi lưu thiết lập lương!",
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
                width={900}
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
                                <Row gutter={24}>
                                    {/* Left: Image Upload */}
                                    <Col span={8}>
                                        <Form.Item
                                            name="avatar"
                                            valuePropName="fileList"
                                        >
                                            <Upload
                                                listType="picture-card"
                                                fileList={avatarFileList}
                                                beforeUpload={async (file) => {
                                                    try {
                                                        const url =
                                                            await handleAvatarUpload(
                                                                file,
                                                            );
                                                        const newFileList = [
                                                            {
                                                                uid: file.uid,
                                                                name: file.name,
                                                                status: "done" as const,
                                                                url: url,
                                                            },
                                                        ];
                                                        setAvatarFileList(
                                                            newFileList,
                                                        );
                                                        form.setFieldValue(
                                                            "avatar",
                                                            url,
                                                        );
                                                        return false; // Prevent auto upload
                                                    } catch (error) {
                                                        return false;
                                                    }
                                                }}
                                                onRemove={() => {
                                                    setAvatarFileList([]);
                                                    form.setFieldValue(
                                                        "avatar",
                                                        undefined,
                                                    );
                                                }}
                                                maxCount={1}
                                                accept="image/*"
                                            >
                                                {avatarFileList.length ===
                                                    0 && (
                                                    <div>
                                                        <UserOutlined />
                                                        <div
                                                            style={{
                                                                marginTop: 8,
                                                            }}
                                                        >
                                                            Chọn ảnh
                                                        </div>
                                                    </div>
                                                )}
                                            </Upload>
                                        </Form.Item>
                                    </Col>

                                    {/* Right: Form Content */}
                                    <Col span={16}>
                                        <Form
                                            form={form}
                                            layout="vertical"
                                            className="space-y-4"
                                        >
                                            <Form.Item
                                                name="id"
                                                style={{ display: "none" }}
                                            >
                                                <Input hidden />
                                            </Form.Item>

                                            {/* Section: Thông tin khởi tạo */}
                                            <Card
                                                title="Thông tin khởi tạo"
                                                size="small"
                                            >
                                                <Form.Item
                                                    label={
                                                        member
                                                            ? "Mã nhân viên"
                                                            : "Mã nhân viên (Tự động tạo)"
                                                    }
                                                    name="code"
                                                    required
                                                >
                                                    <Input
                                                        placeholder="Mã nhân viên tự động"
                                                        disabled
                                                    />
                                                </Form.Item>

                                                <Form.Item
                                                    label="Tên nhân viên"
                                                    name="name"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Vui lòng nhập tên nhân viên!",
                                                        },
                                                    ]}
                                                >
                                                    <Input placeholder="Nhập tên nhân viên" />
                                                </Form.Item>

                                                <Form.Item
                                                    label="Số điện thoại"
                                                    name="phone"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Vui lòng nhập số điện thoại!",
                                                        },
                                                        {
                                                            pattern:
                                                                /^[0-9]{10,11}$/,
                                                            message:
                                                                "Số điện thoại không hợp lệ!",
                                                        },
                                                    ]}
                                                >
                                                    <Input placeholder="Nhập số điện thoại" />
                                                </Form.Item>

                                                <Form.Item
                                                    label="Chi nhánh trả lương"
                                                    name="payrollBranch"
                                                >
                                                    <Select
                                                        placeholder="Chọn Chi nhánh trả lương"
                                                        options={[
                                                            {
                                                                label: "Chi nhánh trung tâm",
                                                                value: "center",
                                                            },
                                                        ]}
                                                    />
                                                </Form.Item>

                                                <Form.Item
                                                    label="Chi nhánh làm việc"
                                                    name="workingBranches"
                                                >
                                                    <Select
                                                        mode="tags"
                                                        placeholder="Chọn Chi nhánh làm việc"
                                                        options={[
                                                            {
                                                                label: "Chi nhánh trung tâm",
                                                                value: "center",
                                                            },
                                                        ]}
                                                    />
                                                </Form.Item>
                                            </Card>

                                            {/* Section: Thông tin cá nhân */}
                                            <Card
                                                title="Thông tin cá nhân"
                                                size="small"
                                            >
                                                <Form.Item
                                                    label="Số CMND/CCCD"
                                                    name="idCard"
                                                >
                                                    <Input placeholder="Nhập số CMND/CCCD" />
                                                </Form.Item>

                                                <Form.Item
                                                    label="Ngày sinh"
                                                    name="date_of_birth"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                "Vui lòng chọn ngày sinh!",
                                                        },
                                                    ]}
                                                >
                                                    <DatePicker
                                                        placeholder="--/--/----"
                                                        format="DD/MM/YYYY"
                                                        className="w-full"
                                                    />
                                                </Form.Item>

                                                <Form.Item
                                                    label="Giới tính"
                                                    name="gender"
                                                >
                                                    <Radio.Group>
                                                        <Radio value="male">
                                                            Nam
                                                        </Radio>
                                                        <Radio value="female">
                                                            Nữ
                                                        </Radio>
                                                    </Radio.Group>
                                                </Form.Item>
                                            </Card>

                                            {/* Section: Thông tin liên hệ */}
                                            <Card
                                                title="Thông tin liên hệ"
                                                size="small"
                                            >
                                                <Row gutter={16}>
                                                    <Col span={12}>
                                                        <Form.Item
                                                            label="Tỉnh/Thành phố"
                                                            name="province"
                                                        >
                                                            <Select
                                                                placeholder="Chọn Tỉnh/Thành phố"
                                                                showSearch
                                                                options={[]}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={12}>
                                                        <Form.Item
                                                            label="Xã/Phường/Đặc khu"
                                                            name="ward"
                                                        >
                                                            <Select
                                                                placeholder="Chọn Xã/Phường/Đặc khu"
                                                                showSearch
                                                                options={[]}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                                <Form.Item
                                                    label="Địa chỉ"
                                                    name="address"
                                                >
                                                    <Input placeholder="Nhập địa chỉ" />
                                                </Form.Item>
                                                <Row gutter={16}>
                                                    <Col span={12}>
                                                        <Form.Item
                                                            label="Facebook"
                                                            name="facebook"
                                                        >
                                                            <Input placeholder="Nhập Facebook" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={12}>
                                                        <Form.Item
                                                            label="Email"
                                                            name="email"
                                                            rules={[
                                                                {
                                                                    required: true,
                                                                    message:
                                                                        "Vui lòng nhập email!",
                                                                },
                                                                {
                                                                    type: "email",
                                                                    message:
                                                                        "Email không hợp lệ!",
                                                                },
                                                            ]}
                                                        >
                                                            <Input placeholder="Nhập email" />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Card>

                                            {/* Section: Thông tin công việc */}
                                            <Card
                                                title="Thông tin công việc"
                                                size="small"
                                            >
                                                <Form.Item
                                                    label="Ngày bắt đầu làm việc"
                                                    name="startDate"
                                                >
                                                    <DatePicker
                                                        placeholder="--/--/----"
                                                        format="DD/MM/YYYY"
                                                        className="w-full"
                                                    />
                                                </Form.Item>

                                                <Form.Item
                                                    label="Phòng ban"
                                                    name="departments"
                                                >
                                                    <Space.Compact className="w-full">
                                                        <Select
                                                            mode="multiple"
                                                            placeholder="Chọn Phòng ban"
                                                            className="flex-1"
                                                            options={departments.map(
                                                                (dept) => ({
                                                                    label: dept.name,
                                                                    value: dept.code,
                                                                }),
                                                            )}
                                                        />
                                                        <Button
                                                            icon={
                                                                <PlusOutlined />
                                                            }
                                                            onClick={() => {
                                                                message.info(
                                                                    "Tính năng thêm phòng ban sẽ được implement",
                                                                );
                                                            }}
                                                        />
                                                    </Space.Compact>
                                                </Form.Item>

                                                <Form.Item
                                                    label="Chức danh"
                                                    name="position"
                                                >
                                                    <Space.Compact className="w-full">
                                                        <Select
                                                            placeholder="Chọn Chức danh"
                                                            className="flex-1"
                                                            options={RolesOptions.map(
                                                                (role) => ({
                                                                    label: role.label,
                                                                    value: role.value,
                                                                }),
                                                            )}
                                                        />
                                                        <Button
                                                            icon={
                                                                <PlusOutlined />
                                                            }
                                                            onClick={() => {
                                                                message.info(
                                                                    "Tính năng thêm chức danh sẽ được implement",
                                                                );
                                                            }}
                                                        />
                                                    </Space.Compact>
                                                </Form.Item>

                                                <Form.Item
                                                    label="Tài khoản đăng nhập"
                                                    name="loginAccount"
                                                >
                                                    <Select
                                                        placeholder="Chọn Tài khoản"
                                                        options={[]}
                                                        disabled
                                                    />
                                                </Form.Item>

                                                <Form.Item
                                                    label="Ghi chú"
                                                    name="notes"
                                                >
                                                    <RichTextEditor
                                                        placeholder="Nhập ghi chú"
                                                        value={form.getFieldValue(
                                                            "notes",
                                                        )}
                                                        onChange={(value) => {
                                                            form.setFieldValue(
                                                                "notes",
                                                                value,
                                                            );
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Card>

                                            {/* Hidden fields */}
                                            <Form.Item
                                                label="Mật khẩu"
                                                name="password"
                                                rules={[
                                                    {
                                                        required: !member,
                                                        message:
                                                            "Vui lòng nhập mật khẩu!",
                                                    },
                                                    {
                                                        min: 6,
                                                        message:
                                                            "Mật khẩu phải có ít nhất 6 ký tự!",
                                                    },
                                                ]}
                                                style={{ display: "none" }}
                                            >
                                                <Input.Password
                                                    prefix={<LockOutlined />}
                                                    placeholder={
                                                        member
                                                            ? "Để trống nếu không đổi mật khẩu"
                                                            : "Nhập mật khẩu"
                                                    }
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                label="Chức vụ"
                                                name="role"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            "Vui lòng chọn chức vụ!",
                                                    },
                                                ]}
                                                style={{ display: "none" }}
                                            >
                                                <Select
                                                    placeholder="Chọn chức vụ"
                                                    options={RolesOptions}
                                                    onChange={(value) => {
                                                        setSelectedRole(value);
                                                        if (
                                                            value !==
                                                            ROLES.worker
                                                        ) {
                                                            form.setFieldValue(
                                                                "departments",
                                                                undefined,
                                                            );
                                                        }
                                                    }}
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                label="Trạng thái hoạt động"
                                                name="isActive"
                                                valuePropName="checked"
                                                style={{ display: "none" }}
                                            >
                                                <Switch
                                                    checkedChildren="Hoạt động"
                                                    unCheckedChildren="Ngừng hoạt động"
                                                />
                                            </Form.Item>
                                        </Form>
                                    </Col>
                                </Row>
                            ),
                        },
                        {
                            key: "salary",
                            label: "Thiết lập lương",
                            children: member ? (
                                <SalarySetupTab
                                    memberId={member.id}
                                    form={salaryForm}
                                    onCommissionRulesChange={setCommissionRules}
                                />
                            ) : (
                                <div className="text-center py-8">
                                    <Typography.Text type="secondary">
                                        Vui lòng lưu thông tin nhân viên trước
                                        khi thiết lập lương
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
                                onClick={() =>
                                    setSaveAsTemplateModalVisible(true)
                                }
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
                        <Button
                            onClick={handleSubmit}
                            type="primary"
                            loading={loading}
                        >
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
                            {
                                required: true,
                                message: "Vui lòng nhập tên mẫu lương!",
                            },
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
interface MemberOrdersOverviewProps {
    member: IMembers;
    orders: any[];
}

const MemberOrdersOverview: React.FC<MemberOrdersOverviewProps> = ({
    member,
    orders,
}) => {
    const statusConfig: Record<
        string,
        { label: string; color: string }
    > = {
        [OrderStatus.PENDING]: {
            label: "Chờ xử lý",
            color: "default",
        },
        [OrderStatus.CONFIRMED]: {
            label: "Đã xác nhận",
            color: "warning",
        },
        [OrderStatus.IN_PROGRESS]: {
            label: "Đang thực hiện",
            color: "processing",
        },
        [OrderStatus.ON_HOLD]: {
            label: "Tạm giữ",
            color: "orange",
        },
        [OrderStatus.COMPLETED]: {
            label: "Hoàn thành",
            color: "success",
        },
        [OrderStatus.REFUND]: {
            label: "Hoàn tiền",
            color: "magenta",
        },
        [OrderStatus.CANCELLED]: {
            label: "Đã hủy",
            color: "error",
        },
    };

    const filtered = useMemo(() => {
        if (!orders || !Array.isArray(orders)) return [];

        return (orders as any[]).filter((item: any) => {
            const data: FirebaseOrderData = (item.data ||
                item) as FirebaseOrderData;

            const isSaleOwner =
                data.consultantId === member.id || data.createdBy === member.id;

            // Check if member appears in any workflow of any product
            let isTechnicalOwner = false;
            if (data.products) {
                for (const product of Object.values(data.products) as any[]) {
                    const workflows = product?.workflows || {};
                    for (const wf of Object.values(workflows) as any[]) {
                        if (
                            Array.isArray(wf.members) &&
                            wf.members.includes(member.id)
                        ) {
                            isTechnicalOwner = true;
                            break;
                        }
                    }
                    if (isTechnicalOwner) break;
                }
            }

            return isSaleOwner || isTechnicalOwner;
        });
    }, [orders, member.id]);

    const totalRevenue = useMemo(() => {
        return filtered.reduce((sum: number, item: any) => {
            const data = item.data || item;
            return sum + (data.totalAmount || 0);
        }, 0);
    }, [filtered]);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        filtered.forEach((item: any) => {
            const data = item.data || item;
            const status: string = data.status || OrderStatus.PENDING;
            counts[status] = (counts[status] || 0) + 1;
        });
        return counts;
    }, [filtered]);

    const statusChartData = useMemo(
        () =>
            Object.entries(statusCounts).map(([status, value]) => ({
                name: statusConfig[status]?.label || status,
                value,
            })),
        [statusCounts],
    );

    const statusChartColors = [
        "#4ade80",
        "#60a5fa",
        "#facc15",
        "#f97316",
        "#f472b6",
        "#a855f7",
        "#f87171",
    ];

    const getOrderCompletion = (data: FirebaseOrderData) => {
        if (!data?.products) {
            return { completed: 0, total: 0, percent: 0 };
        }

        let total = 0;
        let completed = 0;

        Object.values(data.products).forEach((product: any) => {
            const workflows = product.workflows || {};
            const workflowList = Object.values(workflows) as any[];
            total += workflowList.length;
            completed += workflowList.filter((w) => w.isDone).length;
        });

        const percent =
            total > 0 ? Math.round((completed / total) * 100) : 0;

        return { completed, total, percent };
    };

    const columns: TableColumnsType<any> = [
        {
            title: "Mã đơn",
            dataIndex: ["data", "code"],
            key: "code",
            width: 150,
            fixed: "left",
        },
        {
            title: "Khách hàng",
            dataIndex: ["data", "customerName"],
            key: "customerName",
            width: 200,
        },
        {
            title: "Ngày tạo",
            dataIndex: ["data", "createdAt"],
            key: "createdAt",
            width: 140,
            render: (value: number) =>
                value ? dayjs(value).format("DD/MM/YYYY") : "-",
        },
        {
            title: "Trạng thái đơn",
            dataIndex: ["data", "status"],
            key: "status",
            width: 120,
            render: (value: string) => {
                const config = statusConfig[value] || {
                    label: value || "N/A",
                    color: "default",
                };
                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: "Hoàn thành",
            key: "completion",
            width: 140,
            align: "center",
            render: (_: unknown, record: any) => {
                const data: FirebaseOrderData = record.data || record;
                const { completed, total, percent } =
                    getOrderCompletion(data);

                if (!total) {
                    return <Typography.Text type="secondary">-</Typography.Text>;
                }

                return (
                    <Progress
                        type="circle"
                        percent={percent}
                        size={44}
                        strokeColor={{
                            from: "#22c55e",
                            to: "#4ade80",
                        }}
                        strokeLinecap="round"
                        trailColor="#1f2937"
                        format={() => `${completed}/${total}`}
                    />
                );
            },
        },
        {
            title: "Doanh thu",
            dataIndex: ["data", "totalAmount"],
            key: "totalAmount",
            width: 140,
            align: "right",
            render: (value: number) =>
                new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                }).format(value || 0),
        },
    ];

    return (
        <div className="space-y-4">
            <Card
                styles={{
                    body: {
                        padding: 16,
                        background:
                            "radial-gradient(circle at top left, #111827, #020617)",
                    },
                }}
            >
                <Row gutter={16} align="middle">
                    <Col span={16}>
                        <Space size={32} align="center">
                            <Statistic
                                title="Số đơn phụ trách"
                                value={filtered.length}
                                styles={{
                                    content: {
                                        fontSize: 26,
                                        color: "#e5e7eb",
                                    },
                                    title: { color: "#9ca3af" },
                                }}
                            />
                            <Statistic
                                title="Tổng doanh thu"
                                value={totalRevenue}
                                precision={0}
                                formatter={(value) =>
                                    new Intl.NumberFormat("vi-VN", {
                                        style: "currency",
                                        currency: "VND",
                                    }).format(Number(value))
                                }
                                styles={{
                                    content: {
                                        fontSize: 22,
                                        color: "#4ade80",
                                    },
                                    title: { color: "#9ca3af" },
                                }}
                            />
                        </Space>
                    </Col>
                    <Col span={8}>
                        <div
                            className="space-y-2"
                            style={{ textAlign: "right" }}
                        >
                            <Typography.Text
                                style={{ color: "#9ca3af", fontSize: 12 }}
                            >
                                Cơ cấu theo trạng thái
                            </Typography.Text>
                            <Space size={[6, 6]} wrap className="justify-end">
                                {Object.entries(statusCounts).map(
                                    ([status, count]) => {
                                        const config =
                                            statusConfig[status] || {
                                                label: status,
                                                color: "default",
                                            };
                                        return (
                                            <Tag
                                                key={status}
                                                color={config.color}
                                                style={{
                                                    borderRadius: 999,
                                                    padding: "2px 10px",
                                                    fontSize: 11,
                                                }}
                                            >
                                                {config.label}: {count}
                                            </Tag>
                                        );
                                    },
                                )}
                                {Object.keys(statusCounts).length === 0 && (
                                    <Typography.Text
                                        style={{ color: "#6b7280" }}
                                    >
                                        Chưa có đơn nào
                                    </Typography.Text>
                                )}
                            </Space>
                            {statusChartData.length > 0 && (
                                <div
                                    style={{
                                        width: 72,
                                        height: 72,
                                        marginLeft: "auto",
                                    }}
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={statusChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={24}
                                                outerRadius={36}
                                                paddingAngle={3}
                                            >
                                                {statusChartData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={entry.name}
                                                            fill={
                                                                statusChartColors[
                                                                    index %
                                                                        statusChartColors.length
                                                                ]
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>
            </Card>

            <Table
                rowKey={(record: any) => record.id || record.code}
                columns={columns}
                dataSource={filtered}
                pagination={false}
                size="small"
                scroll={{ x: true, y: 400 }}
            />
        </div>
    );
};

const MembersPage = () => {
    const [members, setMembers] = useState<IMembers[]>([]);
    const [loading, setLoading] = useState(true);
    const [formVisible, setFormVisible] = useState(false);
    const [editingMember, setEditingMember] = useState<IMembers | undefined>();
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [departments, setDepartments] = useState<IDepartment[]>([]);
    const [ordersDrawerMember, setOrdersDrawerMember] = useState<IMembers | null>(null);
    const { message } = App.useApp();
    const {
        query,
        applyFilter,
        updateQueries,
        reset,
        pagination,
        handlePageChange,
    } = useFilter();
    const { exportToXlsx } = useFileExport();
    // Lazy load orders - only load when drawer is open
    const { data: ordersData } =
        useRealtimeList<FirebaseOrderData>(ordersDrawerMember ? "xoxo/orders" : null);

    // Load departments
    useEffect(() => {
        const unsubscribe = DepartmentService.onSnapshot((data) => {
            setDepartments(data);
        });
        return () => unsubscribe();
    }, []);

    // Apply filters
    const filteredMembers = useMemo(() => {
        let filtered = members;

        // Filter by status (isActive)
        const status = query.status;
        if (status === "working") {
            filtered = filtered.filter((member) => member.isActive !== false);
        } else if (status === "resigned") {
            filtered = filtered.filter((member) => member.isActive === false);
        }

        // Filter by department
        const department = query.department;
        if (department) {
            filtered = filtered.filter((member) =>
                member.departments?.includes(department),
            );
        }

        // Filter by position
        const position = query.position;
        if (position) {
            filtered = filtered.filter(
                (member) => member.position === position,
            );
        }

        // Apply useFilter for search and other filters
        return applyFilter(filtered);
    }, [members, query, applyFilter]);

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

    const handleDelete = useCallback(async (id: string) => {
        try {
            await MemberService.delete(id);
            message.success("Xóa nhân viên thành công!");
        } catch (error) {
            console.error("Error deleting member:", error);
            message.error("Có lỗi xảy ra khi xóa nhân viên!");
        }
    }, [message]);

    // Handle export Excel
    const handleExportExcel = useCallback(() => {
        try {
            const exportData = filteredMembers.map((member) => ({
                code: member.code,
                name: member.name,
                phone: member.phone,
                email: member.email,
                role: RoleLabels[member.role] || member.role,
                timesheetCode: member.timesheetCode || "-",
                idCard: member.idCard || "-",
                debt: member.debt || 0,
                notes: member.notes || "-",
                isActive:
                    member.isActive !== false ? "Đang làm việc" : "Đã nghỉ",
            })) as any[];
            const fileName = `Danh_sach_nhan_vien_${dayjs().format("DDMMYYYY_HHmmss")}.xlsx`;
            exportToXlsx(exportData, fileName);
            message.success("Đã xuất file Excel thành công");
        } catch (error) {
            console.error("Export failed:", error);
            message.error("Không thể xuất file Excel");
        }
    }, [filteredMembers, exportToXlsx, message]);

    // Handlers for column actions
    const handleViewOrders = useCallback((record: IMembers) => (e: React.MouseEvent) => {
        e.stopPropagation();
        setOrdersDrawerMember(record);
    }, []);

    const handleEditMember = useCallback((record: IMembers) => (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingMember(record);
        setFormVisible(true);
    }, []);

    const handleDeleteConfirm = useCallback((id: string) => (e?: React.MouseEvent) => {
        e?.stopPropagation();
        handleDelete(id);
    }, [handleDelete]);

    const handleStopPropagation = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    const handleAddNewMember = useCallback(() => {
        setEditingMember(undefined);
        setFormVisible(true);
    }, []);

    const handleImportFile = useCallback(() => {
        message.info("Tính năng nhập file sẽ được implement");
    }, [message]);

    const handleMoreMenu = useCallback(() => {
        message.info("Menu thêm sẽ được implement");
    }, [message]);

    const handleAddDepartment = useCallback(() => {
        message.info("Tính năng thêm phòng ban sẽ được implement");
    }, [message]);

    const handleAddPosition = useCallback(() => {
        message.info("Tính năng thêm chức danh sẽ được implement");
    }, [message]);

    const handleCloseOrdersDrawer = useCallback(() => {
        setOrdersDrawerMember(null);
    }, []);

    const handleCloseForm = useCallback(() => {
        setFormVisible(false);
        setEditingMember(undefined);
    }, []);

    const defaultColumns: TableColumnsType<IMembers> = useMemo(
        () => [
            {
                title: "Ảnh",
                dataIndex: "avatar",
                key: "avatar",
                width: 80,
                fixed: "left",
                render: (avatar: string) => (
                    <Avatar
                        src={avatar}
                        icon={<UserOutlined />}
                        size="large"
                        className="bg-blue-500"
                    />
                ),
            },
            {
                title: "Mã chấm công",
                dataIndex: "timesheetCode",
                key: "timesheetCode",
                width: 120,
                render: (code?: string) => code || "-",
            },
            {
                title: "Tên nhân viên",
                dataIndex: "name",
                key: "name",
                width: 200,
                fixed: "left",
                sorter: true,
            },
            {
                title: "Số điện thoại",
                dataIndex: "phone",
                key: "phone",
                width: 130,
                sorter: true,
            },
            {
                title: "Số CMND/CCCD",
                dataIndex: "idCard",
                key: "idCard",
                width: 150,
                render: (idCard?: string) => idCard || "-",
            },
            {
                title: "Nợ và tạm ứng",
                dataIndex: "debt",
                key: "debt",
                width: 150,
                align: "right",
                render: (debt?: number) =>
                    debt
                        ? new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                          }).format(debt)
                        : "0 VNĐ",
            },
            {
                title: "Ghi chú",
                dataIndex: "notes",
                key: "notes",
                width: 200,
                render: (notes?: string) => notes || "-",
            },
            {
                title: "Thao tác",
                key: "action",
                width: 160,
                fixed: "right",
                render: (_: unknown, record: IMembers) => (
                    <Space size="small">
                        <Tooltip title="Xem đơn phụ trách & doanh thu">
                            <Button
                                type="text"
                                icon={<InfoCircleOutlined />}
                                onClick={handleViewOrders(record)}
                            />
                        </Tooltip>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={handleEditMember(record)}
                        />
                        <Popconfirm
                            title="Xác nhận xóa"
                            description="Bạn có chắc chắn muốn xóa nhân viên này?"
                            onConfirm={handleDeleteConfirm(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={handleStopPropagation}
                            />
                        </Popconfirm>
                    </Space>
                ),
            },
        ],
        [handleViewOrders, handleEditMember, handleDeleteConfirm, handleStopPropagation],
    );

    const { columnsCheck, updateColumns, resetColumns, getVisibleColumns } =
        useColumn({
            defaultColumns,
            storageKey: "membersListColumnSettings",
        });

    const visibleColumns = useMemo(() => {
        return getVisibleColumns();
    }, [columnsCheck, getVisibleColumns]);

    const reversedFilteredMembers = useMemo(() => {
        return [...filteredMembers].reverse();
    }, [filteredMembers]);

    const paginationConfig = useMemo(() => ({
        ...pagination,
        onChange: handlePageChange,
    }), [pagination, handlePageChange]);

    const handleRowSelectionChange = useCallback((selectedKeys: React.Key[]) => {
        setSelectedRowKeys(selectedKeys);
    }, []);

    const rowSelection = useMemo(() => ({
        selectedRowKeys,
        onChange: handleRowSelectionChange,
    }), [selectedRowKeys, handleRowSelectionChange]);

    return (
        <WrapperContent<IMembers>
            title="Quản lý nhân viên"
            isLoading={loading}
            isEmpty={filteredMembers.length === 0}
            header={{
                searchInput: {
                    placeholder: "Tìm theo mã, tên nhân viên",
                    filterKeys: ["code", "name"],
                },
                filters: {
                    query: query,
                    onApplyFilter: updateQueries,
                    onReset: reset,
                    fields: [
                        {
                            name: "status",
                            type: "radio",
                            label: "Trạng thái nhân viên",
                            options: [
                                { label: "Đang làm việc", value: "working" },
                                { label: "Đã nghỉ", value: "resigned" },
                            ],
                        },
                        {
                            name: "department",
                            type: "select",
                            label: "Phòng ban",
                            placeholder: "Chọn phòng ban",
                            options: departments.map((dept) => ({
                                label: dept.name,
                                value: dept.code,
                            })),
                            onAddNew: handleAddDepartment,
                        },
                        {
                            name: "position",
                            type: "select",
                            label: "Chức danh",
                            placeholder: "Chọn chức danh",
                            options: RolesOptions.map((role) => ({
                                label: role.label,
                                value: role.value,
                            })),
                            onAddNew: handleAddPosition,
                        },
                    ],
                },
                columnSettings: {
                    columns: columnsCheck,
                    onChange: updateColumns,
                    onReset: resetColumns,
                },
                buttonEnds: [
                    {
                        can: true,
                        type: "primary",
                        name: "Nhân viên",
                        icon: <PlusOutlined />,
                        onClick: handleAddNewMember,
                    },
                    {
                        can: true,
                        name: "Nhập file",
                        icon: <UploadOutlined />,
                        onClick: handleImportFile,
                    },
                    {
                        can: true,
                        name: "Xuất file",
                        icon: <FileExcelOutlined />,
                        onClick: handleExportExcel,
                    },
                    {
                        can: true,
                        name: "",
                        icon: <MoreOutlined />,
                        onClick: handleMoreMenu,
                    },
                ],
            }}
        >
            <CommonTable
                rowKey="id"
                dataSource={reversedFilteredMembers}
                columns={visibleColumns}
                loading={loading}
                DrawerDetails={MemberDetails}
                pagination={paginationConfig}
                paging={true}
                rank={true}
                rowSelection={rowSelection}
            />

            <Drawer
                width={900}
                title={
                    ordersDrawerMember
                        ? `Đơn phụ trách - ${ordersDrawerMember.name}`
                        : "Đơn phụ trách"
                }
                open={!!ordersDrawerMember}
                onClose={handleCloseOrdersDrawer}
            >
                {ordersDrawerMember && (
                    <MemberOrdersOverview
                        member={ordersDrawerMember}
                        orders={ordersData || []}
                    />
                )}
            </Drawer>

            <MemberForm
                member={editingMember}
                visible={formVisible}
                onCancel={handleCloseForm}
                onSuccess={() => {
                    // Data will be updated through realtime listener
                }}
            />
        </WrapperContent>
    );
};

export default MembersPage;
