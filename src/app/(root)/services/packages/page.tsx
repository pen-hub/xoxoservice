"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import ServicePackageFormModal from "@/components/ServicePackageFormModal";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import type {
    FirebaseServiceCategories,
    FirebaseServicePackages,
    ServicePackage,
} from "@/types/service";
import { PlusOutlined } from "@ant-design/icons";
import { App, Tag, Typography } from "antd";
import { getDatabase, onValue, ref, remove } from "firebase/database";
import { useEffect, useState } from "react";

const { Text } = Typography;

export default function ServicePackagesPage() {
    const [servicePackages, setServicePackages] =
        useState<FirebaseServicePackages>({});
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(
        null,
    );
    const [serviceCategories, setServiceCategories] =
        useState<FirebaseServiceCategories>({});
    const { message, modal } = App.useApp();
    const { query, applyFilter, updateQuery, reset } = useFilter();

    // Load service packages from Firebase
    useEffect(() => {
        const database = getDatabase();
        const packagesRef = ref(database, "xoxo/servicePackages");

        const unsubscribe = onValue(
            packagesRef,
            (snapshot) => {
                const data = snapshot.val() || {};
                setServicePackages(data);
                setLoading(false);
            },
            (error) => {
                console.error("Error loading service packages:", error);
                message.error("Không thể tải danh sách gói dịch vụ!");
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [message]);

    // Load service categories
    useEffect(() => {
        const database = getDatabase();
        const categoriesRef = ref(database, "xoxo/serviceCategories");

        const unsubscribe = onValue(categoriesRef, (snapshot) => {
            const data = snapshot.val() || {};
            setServiceCategories(data);
        });

        return () => unsubscribe();
    }, []);

    const handleOpenModal = (packageCode?: string) => {
        if (packageCode) {
            const pkg = servicePackages[packageCode];
            setEditingPackage(pkg);
        } else {
            setEditingPackage(null);
        }
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingPackage(null);
    };

    const handleDelete = (packageCode: string, onCloseDrawer?: () => void) => {
        const pkg = servicePackages[packageCode];
        modal.confirm({
            title: "Xác nhận xóa",
            content: (
                <div>
                    <p>Bạn có chắc chắn muốn xóa gói dịch vụ:</p>
                    <p className="font-semibold">{pkg.name}?</p>
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
                    const packageRef = ref(
                        database,
                        `xoxo/servicePackages/${packageCode}`,
                    );
                    await remove(packageRef);
                    message.success("Xóa gói dịch vụ thành công!");
                    if (onCloseDrawer) {
                        onCloseDrawer();
                    }
                } catch (error) {
                    console.error("Error deleting service package:", error);
                    message.error("Có lỗi xảy ra khi xóa gói dịch vụ!");
                }
            },
        });
    };

    const dataSource = Object.entries(servicePackages).map(([code, pkg]) => ({
        ...pkg,
        key: code,
    }));

    const columns = [
        {
            title: "Mã gói",
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
            title: "Tên gói dịch vụ",
            dataIndex: "name",
            key: "name",
            width: 250,
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: "Số dịch vụ",
            dataIndex: "services",
            key: "servicesCount",
            width: 120,
            render: (services: any[]) => (
                <Tag color="blue">{services?.length || 0} dịch vụ</Tag>
            ),
        },
        {
            title: "Hạn sử dụng",
            dataIndex: "expirationType",
            key: "expirationType",
            width: 150,
            render: (type?: string) => {
                if (!type || type === "UNLIMITED")
                    return <Tag color="green">Vô thời hạn</Tag>;
                if (type === "DATE_RANGE") return <Tag>Theo ngày</Tag>;
                return <Tag>Theo thời hạn</Tag>;
            },
        },
    ];

    const filteredData = applyFilter(dataSource);

    // Service Package Detail Component
    const ServicePackageDetailWrapper: React.FC<
        PropRowDetails<ServicePackage>
    > = (props) => {
        const handleDeleteWithClose = (packageCode: string) => {
            handleDelete(packageCode, props.onClose);
        };

        if (!props.data) return null;

        return (
            <div className="space-y-4">
                <div className="p-4 border rounded">
                    <Text strong className="text-lg">
                        {props.data.name}
                    </Text>
                    <div className="mt-4 space-y-2">
                        <div>
                            <Text type="secondary">Mã gói: </Text>
                            <Text strong>{props.data.code}</Text>
                        </div>
                        <div>
                            <Text type="secondary">Số dịch vụ: </Text>
                            <Tag color="blue">
                                {props.data.services?.length || 0} dịch vụ
                            </Tag>
                        </div>
                        {props.data.expirationType && (
                            <div>
                                <Text type="secondary">Hạn sử dụng: </Text>
                                <Tag>
                                    {props.data.expirationType === "UNLIMITED"
                                        ? "Vô thời hạn"
                                        : "Có thời hạn"}
                                </Tag>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 p-3">
                    <button
                        onClick={() => {
                            handleOpenModal(props.data!.code);
                            props.onClose();
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Sửa
                    </button>
                    <button
                        onClick={() => handleDeleteWithClose(props.data!.code)}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Xóa
                    </button>
                </div>
            </div>
        );
    };

    return (
        <WrapperContent
            header={{
                searchInput: {
                    placeholder: "Tìm kiếm theo tên, mã gói...",
                    filterKeys: ["name", "code"],
                },
                buttonEnds: [
                    {
                        can: true,
                        name: "Thêm gói dịch vụ",
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
                DrawerDetails={ServicePackageDetailWrapper}
                rowKey="code"
            />

            <ServicePackageFormModal
                open={modalVisible}
                editingPackage={editingPackage}
                serviceCategories={serviceCategories}
                onCancel={handleCloseModal}
                onSuccess={handleCloseModal}
            />
        </WrapperContent>
    );
}

