"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import ServiceFormModal from "@/components/ServiceFormModal";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import type {
    FirebaseBrands,
    FirebaseServiceCategories,
    FirebaseServices,
    Service,
} from "@/types/service";
import { PlusOutlined } from "@ant-design/icons";
import { App, Tag, Typography } from "antd";
import { getDatabase, onValue, ref, remove } from "firebase/database";
import { useEffect, useState } from "react";

const { Text } = Typography;

export default function ServicesPage() {
    const [services, setServices] = useState<FirebaseServices>({});
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [serviceCategories, setServiceCategories] =
        useState<FirebaseServiceCategories>({});
    const [brands, setBrands] = useState<FirebaseBrands>({});
    const { message, modal } = App.useApp();
    const { query, applyFilter, updateQuery, reset } = useFilter();

    // Load services from Firebase
    useEffect(() => {
        const database = getDatabase();
        const servicesRef = ref(database, "xoxo/services");

        const unsubscribe = onValue(
            servicesRef,
            (snapshot) => {
                const data = snapshot.val() || {};
                setServices(data);
                setLoading(false);
            },
            (error) => {
                console.error("Error loading services:", error);
                message.error("Không thể tải danh sách dịch vụ!");
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

    // Load brands
    useEffect(() => {
        const database = getDatabase();
        const brandsRef = ref(database, "xoxo/brands");

        const unsubscribe = onValue(brandsRef, (snapshot) => {
            const data = snapshot.val() || {};
            setBrands(data);
        });

        return () => unsubscribe();
    }, []);

    const handleOpenModal = (serviceCode?: string) => {
        if (serviceCode) {
            const service = services[serviceCode];
            setEditingService(service);
        } else {
            setEditingService(null);
        }
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingService(null);
    };

    const handleDelete = (serviceCode: string, onCloseDrawer?: () => void) => {
        const service = services[serviceCode];
        modal.confirm({
            title: "Xác nhận xóa",
            content: (
                <div>
                    <p>Bạn có chắc chắn muốn xóa dịch vụ:</p>
                    <p className="font-semibold">{service.name}?</p>
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
                    const serviceRef = ref(
                        database,
                        `xoxo/services/${serviceCode}`,
                    );
                    await remove(serviceRef);
                    message.success("Xóa dịch vụ thành công!");
                    if (onCloseDrawer) {
                        onCloseDrawer();
                    }
                } catch (error) {
                    console.error("Error deleting service:", error);
                    message.error("Có lỗi xảy ra khi xóa dịch vụ!");
                }
            },
        });
    };

    const dataSource = Object.entries(services).map(([code, service]) => ({
        ...service,
        key: code,
    }));

    const columns = [
        {
            title: "Mã dịch vụ",
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
            title: "Tên dịch vụ",
            dataIndex: "name",
            key: "name",
            width: 250,
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: "Nhóm hàng",
            dataIndex: "categoryCode",
            key: "categoryCode",
            width: 200,
            render: (code?: string) => {
                if (!code) return <Text type="secondary">-</Text>;
                const category = serviceCategories[code];
                return category ? (
                    <Tag color="blue">{category.name}</Tag>
                ) : (
                    <Text type="secondary">{code}</Text>
                );
            },
        },
        {
            title: "Thương hiệu",
            dataIndex: "brandCode",
            key: "brandCode",
            width: 150,
            render: (code?: string) => {
                if (!code) return <Text type="secondary">-</Text>;
                const brand = brands[code];
                return brand ? (
                    <Tag>{brand.name}</Tag>
                ) : (
                    <Text type="secondary">{code}</Text>
                );
            },
        },
        {
            title: "Giá bán",
            dataIndex: "sellingPrice",
            key: "sellingPrice",
            width: 150,
            render: (price?: number) =>
                price ? (
                    <Text strong>
                        {new Intl.NumberFormat("vi-VN").format(price)} đ
                    </Text>
                ) : (
                    "-"
                ),
        },
        {
            title: "Mệnh giá",
            dataIndex: "faceValue",
            key: "faceValue",
            width: 150,
            render: (value?: number) =>
                value ? (
                    <Text>
                        {new Intl.NumberFormat("vi-VN").format(value)} đ
                    </Text>
                ) : (
                    "-"
                ),
        },
    ];

    const filteredData = applyFilter(dataSource);

    // Service Detail Component (simplified for now)
    const ServiceDetailWrapper: React.FC<PropRowDetails<Service>> = (props) => {
        const handleDeleteWithClose = (serviceCode: string) => {
            handleDelete(serviceCode, props.onClose);
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
                            <Text type="secondary">Mã dịch vụ: </Text>
                            <Text strong>{props.data.code}</Text>
                        </div>
                        {props.data.categoryCode && (
                            <div>
                                <Text type="secondary">Nhóm hàng: </Text>
                                <Tag color="blue">
                                    {
                                        serviceCategories[
                                            props.data.categoryCode
                                        ]?.name
                                    }
                                </Tag>
                            </div>
                        )}
                        {props.data.brandCode && (
                            <div>
                                <Text type="secondary">Thương hiệu: </Text>
                                <Tag>{brands[props.data.brandCode]?.name}</Tag>
                            </div>
                        )}
                        {props.data.sellingPrice && (
                            <div>
                                <Text type="secondary">Giá bán: </Text>
                                <Text strong>
                                    {new Intl.NumberFormat("vi-VN").format(
                                        props.data.sellingPrice,
                                    )}{" "}
                                    đ
                                </Text>
                            </div>
                        )}
                        {props.data.faceValue && (
                            <div>
                                <Text type="secondary">Mệnh giá: </Text>
                                <Text>
                                    {new Intl.NumberFormat("vi-VN").format(
                                        props.data.faceValue,
                                    )}{" "}
                                    đ
                                </Text>
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
                    placeholder: "Tìm kiếm theo tên, mã dịch vụ...",
                    filterKeys: ["name", "code"],
                },
                buttonEnds: [
                    {
                        can: true,
                        name: "Thêm dịch vụ",
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
                DrawerDetails={ServiceDetailWrapper}
                rowKey="code"
            />

            <ServiceFormModal
                open={modalVisible}
                editingService={editingService}
                serviceCategories={serviceCategories}
                brands={brands}
                onCancel={handleCloseModal}
                onSuccess={handleCloseModal}
            />
        </WrapperContent>
    );
}

