"use client";

import type {
    FirebaseServiceCategories,
    Service,
    ServicePackage,
    ServicePackageItem,
} from "@/types/service";
import { genCode } from "@/utils/genCode";
import {
    DeleteOutlined,
    PlusOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import {
    App,
    Button,
    Collapse,
    Form,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
    Table,
    Tabs,
    Typography,
    Upload,
} from "antd";
import { getDatabase, onValue, ref, set, update } from "firebase/database";
import { useEffect, useState } from "react";
import RichTextEditor from "./RichTextEditor";

const { Text } = Typography;
const { Panel } = Collapse;

interface ServicePackageFormModalProps {
    open: boolean;
    editingPackage: ServicePackage | null;
    serviceCategories: FirebaseServiceCategories;
    onCancel: () => void;
    onSuccess: () => void;
}

const ServicePackageFormModal: React.FC<ServicePackageFormModalProps> = ({
    open,
    editingPackage,
    serviceCategories,
    onCancel,
    onSuccess,
}) => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const [services, setServices] = useState<Record<string, Service>>({});
    const [packageServices, setPackageServices] = useState<
        ServicePackageItem[]
    >([]);
    const [searchServiceTerm, setSearchServiceTerm] = useState("");

    // Load services from Firebase
    useEffect(() => {
        const database = getDatabase();
        const servicesRef = ref(database, "xoxo/services");

        const unsubscribe = onValue(servicesRef, (snapshot) => {
            const data = snapshot.val() || {};
            setServices(data);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (open) {
            form.resetFields();
            if (editingPackage) {
                form.setFieldsValue({
                    ...editingPackage,
                    expirationType:
                        editingPackage.expirationType || "UNLIMITED",
                    usageTimeType: editingPackage.usageTimeType || "UNLIMITED",
                    scheduleType: editingPackage.scheduleType || "FREE",
                });
                setPackageServices(editingPackage.services || []);
            } else {
                form.setFieldsValue({
                    code: genCode("PKG_"),
                    expirationType: "UNLIMITED",
                    usageTimeType: "UNLIMITED",
                    scheduleType: "FREE",
                });
                setPackageServices([]);
            }
        }
    }, [open, editingPackage, form]);

    const handleAddService = (serviceCode: string) => {
        const service = services[serviceCode];
        if (!service) return;

        const newServiceItem: ServicePackageItem = {
            serviceCode: service.code,
            serviceName: service.name,
            numberOfSessions: 1,
            costPrice: 0,
            totalCostPrice: 0,
            retailPrice: service.sellingPrice || 0,
            amount: service.sellingPrice || 0,
        };

        setPackageServices([...packageServices, newServiceItem]);
        setSearchServiceTerm("");
    };

    const handleRemoveService = (index: number) => {
        const newServices = packageServices.filter((_, i) => i !== index);
        setPackageServices(newServices);
    };

    const handleUpdateServiceItem = (
        index: number,
        field: keyof ServicePackageItem,
        value: any,
    ) => {
        const updated = [...packageServices];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-calculate totals
        if (field === "numberOfSessions" || field === "costPrice") {
            updated[index].totalCostPrice =
                updated[index].numberOfSessions * updated[index].costPrice;
        }
        if (field === "numberOfSessions" || field === "retailPrice") {
            updated[index].amount =
                updated[index].numberOfSessions * updated[index].retailPrice;
        }

        setPackageServices(updated);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const database = getDatabase();
            const now = new Date().getTime();

            const packageData: any = {
                ...values,
                services: packageServices,
                updatedAt: now,
                ...(editingPackage
                    ? { createdAt: editingPackage.createdAt }
                    : { createdAt: now }),
            };

            // Remove undefined values
            const cleanedData = Object.fromEntries(
                Object.entries(packageData).filter(
                    ([_, value]) => value !== undefined,
                ),
            ) as unknown as ServicePackage;

            const packageRef = ref(
                database,
                `xoxo/servicePackages/${values.code}`,
            );

            if (editingPackage) {
                await update(packageRef, cleanedData);
                message.success("Cập nhật gói dịch vụ thành công!");
            } else {
                await set(packageRef, cleanedData);
                message.success("Thêm gói dịch vụ thành công!");
            }

            onCancel();
            onSuccess();
        } catch (error) {
            console.error("Error saving service package:", error);
            message.error("Có lỗi xảy ra khi lưu gói dịch vụ!");
        }
    };

    const serviceColumns = [
        {
            title: "STT",
            key: "index",
            width: 60,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: "Tên dịch vụ",
            dataIndex: "serviceName",
            key: "serviceName",
            width: 200,
        },
        {
            title: "Số buổi",
            key: "numberOfSessions",
            width: 100,
            render: (_: any, record: ServicePackageItem, index: number) => (
                <InputNumber
                    min={1}
                    value={record.numberOfSessions}
                    onChange={(value) =>
                        handleUpdateServiceItem(
                            index,
                            "numberOfSessions",
                            value || 1,
                        )
                    }
                    style={{ width: "100%" }}
                />
            ),
        },
        {
            title: "Giá vốn",
            key: "costPrice",
            width: 120,
            render: (_: any, record: ServicePackageItem, index: number) => (
                <InputNumber
                    min={0}
                    value={record.costPrice}
                    onChange={(value) =>
                        handleUpdateServiceItem(index, "costPrice", value || 0)
                    }
                    formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    style={{ width: "100%" }}
                />
            ),
        },
        {
            title: "Tổng giá vốn",
            dataIndex: "totalCostPrice",
            key: "totalCostPrice",
            width: 150,
            render: (value: number) =>
                new Intl.NumberFormat("vi-VN").format(value),
        },
        {
            title: "Giá bán lẻ",
            key: "retailPrice",
            width: 120,
            render: (_: any, record: ServicePackageItem, index: number) => (
                <InputNumber
                    min={0}
                    value={record.retailPrice}
                    onChange={(value) =>
                        handleUpdateServiceItem(
                            index,
                            "retailPrice",
                            value || 0,
                        )
                    }
                    formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    style={{ width: "100%" }}
                />
            ),
        },
        {
            title: "Thành tiền",
            dataIndex: "amount",
            key: "amount",
            width: 150,
            render: (value: number) => (
                <Text strong>
                    {new Intl.NumberFormat("vi-VN").format(value)} đ
                </Text>
            ),
        },
        {
            title: "",
            key: "action",
            width: 50,
            render: (_: any, __: any, index: number) => (
                <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveService(index)}
                />
            ),
        },
    ];

    const filteredServices = Object.values(services).filter((service) =>
        service.name.toLowerCase().includes(searchServiceTerm.toLowerCase()),
    );

    return (
        <Modal
            title={
                <Text strong>
                    {editingPackage
                        ? "Cập nhật gói dịch vụ, liệu trình"
                        : "Tạo gói dịch vụ, liệu trình"}
                </Text>
            }
            open={open}
            onCancel={onCancel}
            onOk={handleSubmit}
            width={1200}
            okText="Lưu"
            cancelText="Bỏ qua"
        >
            <Tabs
                defaultActiveKey="info"
                items={[
                    {
                        key: "info",
                        label: "Thông tin",
                        children: (
                            <Form
                                form={form}
                                layout="vertical"
                                className="mt-4"
                            >
                                <Form.Item
                                    name="name"
                                    label="Tên gói dịch vụ"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Vui lòng nhập tên gói dịch vụ!",
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder="Bắt buộc"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item name="code" label="Mã gói">
                                    <Input
                                        placeholder="Tự động"
                                        disabled
                                        size="large"
                                    />
                                </Form.Item>

                                <Collapse
                                    defaultActiveKey={["services", "duration"]}
                                >
                                    <Panel
                                        header="Dịch vụ trong gói"
                                        key="services"
                                    >
                                        <div className="mb-4">
                                            <Text
                                                type="secondary"
                                                className="block mb-2"
                                            >
                                                Gói dịch vụ, liệu trình được tạo
                                                thành từ các dịch vụ khác nhau
                                            </Text>
                                            <Space.Compact
                                                style={{ width: "100%" }}
                                            >
                                                <Input
                                                    placeholder="Thêm dịch vụ trong gói"
                                                    prefix={<SearchOutlined />}
                                                    value={searchServiceTerm}
                                                    onChange={(e) =>
                                                        setSearchServiceTerm(
                                                            e.target.value,
                                                        )
                                                    }
                                                    size="large"
                                                />
                                                <Button size="large">
                                                    Thêm theo nhóm hàng
                                                </Button>
                                            </Space.Compact>
                                        </div>

                                        {filteredServices.length > 0 &&
                                            searchServiceTerm && (
                                                <div className="mb-4 border rounded p-2 max-h-40 overflow-y-auto">
                                                    {filteredServices.map(
                                                        (service) => (
                                                            <div
                                                                key={
                                                                    service.code
                                                                }
                                                                className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                                                                onClick={() =>
                                                                    handleAddService(
                                                                        service.code,
                                                                    )
                                                                }
                                                            >
                                                                <Text>
                                                                    {
                                                                        service.name
                                                                    }
                                                                </Text>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}

                                        {packageServices.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400">
                                                Chưa có dịch vụ trong gói
                                            </div>
                                        ) : (
                                            <Table
                                                columns={serviceColumns}
                                                dataSource={packageServices}
                                                pagination={false}
                                                size="small"
                                                rowKey={(_, index) =>
                                                    (index ?? 0).toString()
                                                }
                                            />
                                        )}
                                    </Panel>

                                    <Panel
                                        header="Thời hạn, lịch trình"
                                        key="duration"
                                    >
                                        <Form.Item
                                            name="expirationType"
                                            label="Hạn sử dụng"
                                        >
                                            <Select size="large">
                                                <Select.Option value="UNLIMITED">
                                                    Vô thời hạn
                                                </Select.Option>
                                                <Select.Option value="DATE_RANGE">
                                                    Theo ngày
                                                </Select.Option>
                                                <Select.Option value="FIXED_PERIOD">
                                                    Theo thời hạn
                                                </Select.Option>
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            name="usageTimeType"
                                            label="Thời gian sử dụng"
                                        >
                                            <Select size="large">
                                                <Select.Option value="UNLIMITED">
                                                    Không giới hạn thời gian
                                                </Select.Option>
                                                <Select.Option value="SPECIFIC_HOURS">
                                                    Theo giờ cụ thể
                                                </Select.Option>
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            name="scheduleType"
                                            label="Lịch sử sử dụng"
                                        >
                                            <Select size="large">
                                                <Select.Option value="FREE">
                                                    Tự do
                                                </Select.Option>
                                                <Select.Option value="FIXED_SCHEDULE">
                                                    Lịch cố định
                                                </Select.Option>
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            name="sessionInterval"
                                            label="Mỗi buổi cách nhau"
                                        >
                                            <Input
                                                placeholder="Tùy chọn theo nhu cầu"
                                                size="large"
                                            />
                                        </Form.Item>

                                        <div className="bg-red-50 p-4 rounded border border-red-200">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <Text strong>
                                                        Hoa hồng nhân viên
                                                    </Text>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        Thiết lập hoa hồng cho
                                                        nhân viên tư vấn bán,
                                                        làm dịch vụ
                                                    </div>
                                                </div>
                                                <Button type="link">
                                                    4 bảng hoa hồng &gt;
                                                </Button>
                                            </div>
                                        </div>
                                    </Panel>
                                </Collapse>
                            </Form>
                        ),
                    },
                    {
                        key: "images",
                        label: "Hình ảnh, mô tả, ghi chú",
                        children: (
                            <Form
                                form={form}
                                layout="vertical"
                                className="mt-4"
                            >
                                <Form.Item label="Hình ảnh">
                                    <Text
                                        type="secondary"
                                        className="block mb-2"
                                    >
                                        Upload tối đa 10 ảnh, dung lượng mỗi ảnh
                                        tối đa 2MB
                                    </Text>
                                    <Upload
                                        listType="picture-card"
                                        maxCount={10}
                                        accept="image/*"
                                    >
                                        <div>
                                            <PlusOutlined />
                                            <div style={{ marginTop: 8 }}>
                                                Upload
                                            </div>
                                        </div>
                                    </Upload>
                                </Form.Item>

                                <Form.Item name="description" label="Mô tả">
                                    <RichTextEditor placeholder="Nhập mô tả..." />
                                </Form.Item>

                                <Form.Item name="notes" label="Ghi chú">
                                    <Input.TextArea
                                        placeholder="Nhập ghi chú..."
                                        rows={4}
                                    />
                                </Form.Item>
                            </Form>
                        ),
                    },
                ]}
            />
        </Modal>
    );
};

export default ServicePackageFormModal;

