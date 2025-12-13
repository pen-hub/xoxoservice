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
import { CustomerSource, CustomerSourceOptions } from "@/types/enum";
import {
    getCustomerTypeLabel,
    getSourceColor,
    getSourceLabel,
} from "@/utils/customerUtils";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { App, Tag, Typography } from "antd";
import { getDatabase, onValue, ref, remove } from "firebase/database";
import { Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";

const { Text } = Typography;

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

    const columns = [
        {
            title: "Mã KH",
            dataIndex: "code",
            key: "code",
            width: 150,
            fixed: "left" as const,
            render: (code: string) => (
                <Text strong className="text-primary">
                    {code}
                </Text>
            ),
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
    ];

    // Filter data
    const filteredData = applyFilter(dataSource);

    // Filter fields for WrapperContent
    const filterFields: FilterField[] = [
        {
            name: "customerSource",
            label: "Nguồn khách hàng",
            type: "select",
            options: CustomerSourceOptions,
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
            />
        );
    };

    return (
        <WrapperContent
            header={{
                searchInput: {
                    placeholder: "Tìm kiếm theo tên, SĐT, email...",
                    filterKeys: ["name", "phone", "email"],
                },
                filters: {
                    fields: filterFields,
                    query: query,
                    onApplyFilter: (filters) => {
                        filters.forEach(({ key, value }) =>
                            updateQuery(key, value),
                        );
                    },
                    onReset: reset,
                },
                buttonEnds: [
                    {
                        can: true,
                        name: "Thêm khách hàng",
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
                onCancel={handleCloseModal}
                onSuccess={handleModalSuccess}
            />
        </WrapperContent>
    );
}
