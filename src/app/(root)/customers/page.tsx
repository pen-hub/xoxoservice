"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import CustomerDetail from "@/components/CustomerDetail";
import CustomerFormModal from "@/components/CustomerFormModal";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import type { FilterField } from "@/types";
import type {
    Customer,
    FirebaseCustomerGroups,
    FirebaseCustomers,
    Province,
} from "@/types/customer";
import { CustomerSource, CustomerSourceOptions, LeadStatus, LeadStatusLabels, LeadStatusOptions } from "@/types/enum";
import {
    getCustomerTypeLabel,
    getSourceColor,
    getSourceLabel,
} from "@/utils/customerUtils";
import { PlusOutlined, UserOutlined, MessageOutlined, CopyOutlined } from "@ant-design/icons";
import { App, Tag, Typography, Button, Tooltip, Space } from "antd";
import { getDatabase, onValue, ref, remove } from "firebase/database";
import { Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MemberService } from "@/services/memberService";
import { IMembers } from "@/types/members";
import dayjs from "dayjs";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { getDatePresets, getDateRangeByPreset } from "@/utils/datePresets";

const { Text } = Typography;

// Helper function to check if today is a reminder day (1, 3, 5, 7 days after createdAt)
const getReminderInfo = (createdAt: number, status?: LeadStatus) => {
    if (status !== LeadStatus.Considering || !createdAt) {
        return null;
    }

    const createdDate = dayjs(createdAt);
    const today = dayjs();
    const daysDiff = today.diff(createdDate, "day");

    // Check if today is one of the reminder days (1, 3, 5, 7)
    const reminderDays = [1, 3, 5, 7];
    const isReminderDay = reminderDays.includes(daysDiff);

    // Generate auto message based on day
    let autoMessage = "";
    if (isReminderDay) {
        autoMessage = `Xin chào! Đây là tin nhắn nhắc nhở từ chúng tôi sau ${daysDiff} ngày. Chúng tôi rất mong được hỗ trợ bạn. Vui lòng liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.`;
    } else {
        // Calculate next reminder day
        const nextReminderDay = reminderDays.find(day => day > daysDiff) || reminderDays[reminderDays.length - 1];
        const daysUntilNext = nextReminderDay - daysDiff;
        autoMessage = `Tin nhắn nhắc nhở sẽ được gửi sau ${daysUntilNext} ngày nữa (ngày thứ ${nextReminderDay}).`;
    }

    if (isReminderDay) {
        return {
            isReminder: true,
            day: daysDiff,
            message: `Nhắc khách - Ngày thứ ${daysDiff}`,
            autoMessage: autoMessage,
        };
    }

    // Check if overdue (past reminder days)
    const maxReminderDay = Math.max(...reminderDays);
    if (daysDiff > maxReminderDay) {
        return {
            isReminder: true,
            day: daysDiff,
            message: `Quá hạn nhắc - ${daysDiff} ngày`,
            isOverdue: true,
            autoMessage: `Xin chào! Đã qua ${daysDiff} ngày kể từ lần liên hệ cuối. Chúng tôi rất mong được hỗ trợ bạn. Vui lòng liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.`,
        };
    }

    // Return info even if not a reminder day (to show upcoming reminder)
    return {
        isReminder: false,
        day: daysDiff,
        message: `Chưa đến ngày nhắc (${daysDiff} ngày)`,
        autoMessage: autoMessage,
    };
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<FirebaseCustomers>({});
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(
        null,
    );
    const { message, modal } = App.useApp();
    const { query, updateQuery, applyFilter, reset } = useFilter();

    // Customer Groups state
    const [customerGroups, setCustomerGroups] =
        useState<FirebaseCustomerGroups>({});

    // Location state
    const [provinces, setProvinces] = useState<Province[]>([]);

    // Members state for Sale/MKT selection
    const [members, setMembers] = useState<IMembers[]>([]);

    // Load customers from Firebase
    useEffect(() => {
        const database = getDatabase();
        const customersRef = ref(database, "xoxo/customers");

        const unsubscribe = onValue(
            customersRef,
            (snapshot) => {
                const data = snapshot.val() || {};
                setCustomers(data);
                setLoading(false);
            },
            (error) => {
                console.error("Error loading customers:", error);
                message.error("Không thể tải danh sách khách hàng!");
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [message]);

    // Load customer groups from Firebase
    useEffect(() => {
        const database = getDatabase();
        const groupsRef = ref(database, "xoxo/customerGroups");

        const unsubscribe = onValue(
            groupsRef,
            (snapshot) => {
                const data = snapshot.val() || {};
                setCustomerGroups(data);
            },
            (error) => {
                console.error("Error loading customer groups:", error);
            },
        );

        return () => unsubscribe();
    }, []);

    // Load provinces data
    useEffect(() => {
        const loadProvinces = async () => {
            try {
                const response = await fetch(
                    "https://provinces.open-api.vn/api/?depth=3",
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (Array.isArray(data)) {
                    setProvinces(data);
                } else {
                    console.error("Unexpected API response format:", data);
                }
            } catch (error) {
                console.error("Error loading provinces:", error);
                // Only show error message if it's a network error, not for silent failures
                if (
                    error instanceof TypeError &&
                    error.message === "Failed to fetch"
                ) {
                    console.warn(
                        "Provinces API unavailable, location names will show codes instead",
                    );
                } else {
                    message.error("Không thể tải danh sách tỉnh/thành phố!");
                }
            }
        };

        loadProvinces();
    }, [message]);

    // Load members for Sale/MKT selection
    useEffect(() => {
        const unsubscribe = MemberService.onSnapshot((data) => {
            setMembers(data);
        });
        return () => unsubscribe();
    }, []);

    const handleOpenModal = (customerCode?: string) => {
        if (customerCode) {
            const customer = customers[customerCode];
            setEditingCustomer(customer);
        } else {
            setEditingCustomer(null);
        }
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingCustomer(null);
    };

    const handleModalSuccess = () => {
        handleCloseModal();
    };

    const handleDelete = (customerCode: string, onCloseDrawer?: () => void) => {
        const customer = customers[customerCode];
        modal.confirm({
            title: "Xác nhận xóa",
            content: (
                <div>
                    <p>Bạn có chắc chắn muốn xóa khách hàng:</p>
                    <p className="font-semibold">{customer.name}?</p>
                    <p className="text-red-500 text-sm mt-2">
                        Thao tác này không thể hoàn tác!
                    </p>
                </div>
            ),
            okText: "Xóa",
            cancelText: "Hủy",
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    const database = getDatabase();
                    const customerRef = ref(
                        database,
                        `xoxo/customers/${customerCode}`,
                    );
                    await remove(customerRef);
                    message.success("Xóa khách hàng thành công!");
                    // Close drawer after successful deletion
                    if (onCloseDrawer) {
                        onCloseDrawer();
                    }
                } catch (error) {
                    console.error("Error deleting customer:", error);
                    message.error("Có lỗi xảy ra khi xóa khách hàng!");
                }
            },
        });
    };

    const dataSource = Object.entries(customers).map(([code, customer]) => ({
        ...customer,
        key: code,
    }));

    // Apply custom filters
    const filteredData = useMemo(() => {
        let filtered = dataSource;

        // Filter by salePerson
        if (query.salePerson && query.salePerson !== "") {
            filtered = filtered.filter(
                (customer) => customer.salePerson === query.salePerson,
            );
        }

        // Filter by mktPerson
        if (query.mktPerson && query.mktPerson !== "") {
            filtered = filtered.filter(
                (customer) => customer.mktPerson === query.mktPerson,
            );
        }

        // Filter by pageManager (search in string)
        if (query.pageManager && query.pageManager !== "") {
            const searchTerm = (query.pageManager as string).toLowerCase();
            filtered = filtered.filter(
                (customer) =>
                    customer.pageManager
                        ?.toLowerCase()
                        .includes(searchTerm),
            );
        }

        // Apply date preset filter if selected
        if (query.datePreset) {
            const dateRange = getDateRangeByPreset(query.datePreset as string);
            if (dateRange) {
                filtered = filtered.filter((customer) => {
                    if (!customer.createdAt) return false;
                    const customerDate = new Date(customer.createdAt);
                    return (
                        customerDate >= dateRange.from &&
                        customerDate <= dateRange.to
                    );
                });
            }
        }

        // Apply other filters from useFilter (customerSource, status, search, etc.)
        return applyFilter(filtered);
    }, [dataSource, query, applyFilter]);

    const columns = [
        {
            title: "Mã KH",
            dataIndex: "code",
            key: "code",
            width: 150,
            fixed: "left" as const,
            render: (code: string, record: Customer) => {
                const reminderInfo = record?.createdAt
                    ? getReminderInfo(record.createdAt, record.status)
                    : null;
                
                return (
                    <div className="flex items-center gap-2">
                        <Text strong className="text-primary">
                            {code}
                        </Text>
                        {reminderInfo && (
                            <ExclamationCircleOutlined 
                                className="text-red-500 animate-pulse" 
                                style={{ fontSize: '16px' }}
                            />
                        )}
                    </div>
                );
            },
        },
        {
            title: "Tên khách hàng",
            dataIndex: "name",
            key: "name",
            width: 200,
            render: (name: string) => (
                <div className="flex items-center gap-2">
                    <UserOutlined className="text-gray-400" />
                    <Text strong>{name}</Text>
                </div>
            ),
        },
        {
            title: "Số điện thoại",
            dataIndex: "phone",
            key: "phone",
            width: 150,
            render: (phone: string) => (
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <Text copyable>{phone}</Text>
                </div>
            ),
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            width: 260,
            render: (email: string) => (
                <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <Text copyable={email ? true : false}>{email || "-"}</Text>
                </div>
            ),
        },
        {
            title: "Địa chỉ",
            dataIndex: "address",
            key: "address",
            width: 250,
            render: (address: string) => (
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <Text ellipsis={{ tooltip: address }}>{address}</Text>
                </div>
            ),
        },
        {
            title: "Loại khách",
            dataIndex: "customerType",
            key: "customerType",
            width: 120,
            filters: [
                { text: "Cá nhân", value: "individual" },
                { text: "Doanh nghiệp", value: "enterprise" },
            ],
            onFilter: (value: any, record: Customer) =>
                record.customerType === value,
            render: (type?: "individual" | "enterprise") => (
                <Tag color={type === "enterprise" ? "blue" : "default"}>
                    {getCustomerTypeLabel(type)}
                </Tag>
            ),
        },
        {
            title: "Nhóm khách",
            dataIndex: "customerGroup",
            key: "customerGroup",
            width: 150,
            render: (groupCode?: string) => {
                if (!groupCode) return <Text type="secondary">-</Text>;
                const group = customerGroups[groupCode];
                return group ? (
                    <Tag color="cyan">{group.name}</Tag>
                ) : (
                    <Text type="secondary">{groupCode}</Text>
                );
            },
        },
        {
            title: "Nguồn khách",
            dataIndex: "customerSource",
            key: "customerSource",
            width: 150,
            filters: CustomerSourceOptions.map((opt) => ({
                text: opt.label,
                value: opt.value,
            })),
            onFilter: (value: any, record: Customer) =>
                record.customerSource === value,
            render: (source: CustomerSource) => (
                <Tag color={getSourceColor(source)}>
                    {getSourceLabel(source)}
                </Tag>
            ),
        },
        {
            title: "Sale phụ trách",
            dataIndex: "salePerson",
            key: "salePerson",
            width: 150,
            render: (salePersonId?: string) => {
                if (!salePersonId) return <Text type="secondary">-</Text>;
                const member = members.find((m) => m.id === salePersonId);
                return member ? (
                    <Text>{member.name}</Text>
                ) : (
                    <Text type="secondary">{salePersonId}</Text>
                );
            },
        },
        {
            title: "MKT phụ trách",
            dataIndex: "mktPerson",
            key: "mktPerson",
            width: 150,
            render: (mktPersonId?: string) => {
                if (!mktPersonId) return <Text type="secondary">-</Text>;
                const member = members.find((m) => m.id === mktPersonId);
                return member ? (
                    <Text>{member.name}</Text>
                ) : (
                    <Text type="secondary">{mktPersonId}</Text>
                );
            },
        },
        {
            title: "Trực page",
            dataIndex: "pageManager",
            key: "pageManager",
            width: 150,
            render: (pageManager?: string) => (
                <Text>{pageManager || "-"}</Text>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 180,
            filters: LeadStatusOptions.map((opt) => ({
                text: opt.label,
                value: opt.value,
            })),
            onFilter: (value: any, record: Customer) =>
                record.status === value,
            render: (status?: LeadStatus, record?: Customer) => {
                if (!status) return <Text type="secondary">-</Text>;
                
                const reminderInfo = record?.createdAt
                    ? getReminderInfo(record.createdAt, status)
                    : null;

                const colorMap: Record<LeadStatus, string> = {
                    [LeadStatus.Considering]: "blue",
                    [LeadStatus.WaitingForPhotos]: "orange",
                    [LeadStatus.WaitingForVisit]: "cyan",
                    [LeadStatus.WaitingForItems]: "purple",
                    [LeadStatus.NotInterested]: "red",
                    [LeadStatus.Cancel]: "default",
                };

                return (
                    <div className="flex items-center gap-2">
                        <Tag color={colorMap[status]}>
                            {LeadStatusLabels[status]}
                        </Tag>
                        {reminderInfo && (
                            <Tag
                                color="red"
                                icon={<ExclamationCircleOutlined />}
                                className="animate-pulse"
                            >
                                {reminderInfo.message}
                            </Tag>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 150,
            sorter: (a: Customer, b: Customer) => a.createdAt - b.createdAt,
            render: (date: number) => (
                <Text type="secondary">
                    {new Date(date).toLocaleDateString("vi-VN")}
                </Text>
            ),
        },
        {
            title: "Tin nhắn tự động",
            key: "autoMessage",
            width: 120,
            fixed: "right" as const,
            render: (_: unknown, record: Customer) => {
                const reminderInfo = record?.createdAt && record?.status === LeadStatus.Considering
                    ? getReminderInfo(record.createdAt, record.status)
                    : null;

                if (!reminderInfo || !reminderInfo.autoMessage) {
                    return <Text type="secondary">-</Text>;
                }

                return (
                    <Button
                        size="small"
                        type="link"
                        icon={<CopyOutlined />}
                        onClick={() => {
                            navigator.clipboard.writeText(reminderInfo.autoMessage || "");
                            message.success("Đã sao chép tin nhắn!");
                        }}
                    >
                        Sao chép
                    </Button>
                );
            },
        },
    ];

    // Date presets for quick filter
    const datePresets = getDatePresets();
    const datePresetOptions = datePresets.map((preset) => ({
        label: preset.label,
        value: preset.value,
    }));

    // Filter fields for WrapperContent
    const filterFields: FilterField[] = [
        {
            name: "datePreset",
            label: "Lọc nhanh theo ngày",
            type: "select",
            options: datePresetOptions,
            placeholder: "Chọn khoảng thời gian",
        },
        {
            name: "customerSource",
            label: "Nguồn khách hàng",
            type: "select",
            options: CustomerSourceOptions,
        },
        {
            name: "status",
            label: "Trạng thái",
            type: "select",
            options: LeadStatusOptions,
        },
        {
            name: "salePerson",
            label: "Sale phụ trách",
            type: "select",
            options: [
                { label: "Tất cả", value: "" },
                ...members
                    .filter((m) => m.role === "sales" || m.isActive !== false)
                    .map((member) => ({
                        label: member.name,
                        value: member.id,
                    })),
            ],
            placeholder: "Chọn Sale phụ trách",
        },
        {
            name: "mktPerson",
            label: "MKT phụ trách",
            type: "select",
            options: [
                { label: "Tất cả", value: "" },
                ...members
                    .filter((m) => m.isActive !== false)
                    .map((member) => ({
                        label: member.name,
                        value: member.id,
                    })),
            ],
            placeholder: "Chọn MKT phụ trách",
        },
        {
            name: "pageManager",
            label: "Trực page",
            type: "input",
            placeholder: "Nhập tên người trực page",
        },
    ];

    // Wrapper component for CustomerDetail with handlers
    const CustomerDetailWrapper: React.FC<PropRowDetails<Customer>> = (
        props,
    ) => {
        const handleDeleteWithClose = (customerCode: string) => {
            handleDelete(customerCode, props.onClose);
        };

        return (
            <CustomerDetail
                {...props}
                onEdit={handleOpenModal}
                onDelete={handleDeleteWithClose}
                provinces={provinces}
                customerGroups={customerGroups}
                members={members}
            />
        );
    };

    return (
        <WrapperContent
            title="Lead Khách hàng"
            header={{
                searchInput: {
                    placeholder: "Tìm kiếm theo tên, SĐT, email...",
                    filterKeys: ["name", "phone", "email"],
                },
                filters: {
                    fields: filterFields,
                    query: query,
                    onApplyFilter: (filters) => {
                        filters.forEach(({ key, value }) => {
                            if (key === "datePreset" && value) {
                                // Convert date preset to date range for createdAt
                                const dateRange = getDateRangeByPreset(value as string);
                                if (dateRange) {
                                    updateQuery("createdAt", {
                                        from: dateRange.from,
                                        to: dateRange.to,
                                    });
                                }
                                // Keep datePreset in query for display
                                updateQuery("datePreset", value);
                            } else {
                                updateQuery(key, value);
                            }
                        });
                    },
                    onReset: () => {
                        reset();
                        updateQuery("datePreset", undefined);
                    },
                },
                buttonEnds: [
                    {
                        can: true,
                        name: "Thêm Lead Khách hàng",
                        icon: <PlusOutlined />,
                        type: "primary",
                        onClick: () => handleOpenModal(),
                    },
                ],
            }}
        >
            <CommonTable
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                DrawerDetails={CustomerDetailWrapper}
                rowKey="code"
            />

            <CustomerFormModal
                open={modalVisible}
                editingCustomer={editingCustomer}
                customerGroups={customerGroups}
                provinces={provinces}
                members={members}
                onCancel={handleCloseModal}
                onSuccess={handleModalSuccess}
            />
        </WrapperContent>
    );
}
