"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import type { CustomerGroup, FirebaseCustomerGroups } from "@/types/customer";
import { genCode } from "@/utils/genCode";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
    App,
    Button,
    Descriptions,
    Form,
    Input,
    Modal,
    Typography,
} from "antd";
import {
    getDatabase,
    onValue,
    ref,
    remove,
    set,
    update,
} from "firebase/database";
import { useEffect, useState } from "react";

const { Text } = Typography;

interface CustomerGroupDetailProps extends PropRowDetails<CustomerGroup> {
    onEdit: (groupCode: string) => void;
    onDelete: (groupCode: string, onCloseDrawer?: () => void) => void;
}

const CustomerGroupDetail: React.FC<CustomerGroupDetailProps> = ({
    data,
    onClose,
    onEdit,
    onDelete,
}) => {
    if (!data) return null;

    const handleEdit = () => {
        onEdit(data.code);
        onClose();
    };

    const handleDelete = () => {
        onDelete(data.code, onClose);
    };

    return (
        <div className="space-y-4">
            <Descriptions bordered column={1}>
                <Descriptions.Item label="Mã nhóm">
                    <Text strong className="text-primary">
                        {data.code}
                    </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tên nhóm">
                    {data.name}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                    {new Date(data.createdAt).toLocaleString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày cập nhật">
                    {new Date(data.updatedAt).toLocaleString("vi-VN")}
                </Descriptions.Item>
            </Descriptions>
            <div className="flex justify-end gap-2 mt-4  p-3">
                <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                >
                    Sửa
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                    Xóa
                </Button>
            </div>
        </div>
    );
};

export default function CustomerGroupsPage() {
    const [customerGroups, setCustomerGroups] =
        useState<FirebaseCustomerGroups>({});
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(
        null,
    );
    const [form] = Form.useForm();
    const { message, modal } = App.useApp();
    const { query, updateQuery, applyFilter, reset } = useFilter();

    // Load customer groups from Firebase
    useEffect(() => {
        const database = getDatabase();
        const groupsRef = ref(database, "xoxo/customerGroups");

        const unsubscribe = onValue(
            groupsRef,
            (snapshot) => {
                const data = snapshot.val() || {};
                setCustomerGroups(data);
                setLoading(false);
            },
            (error) => {
                console.error("Error loading customer groups:", error);
                message.error("Không thể tải danh sách nhóm khách hàng!");
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [message]);

    const handleOpenModal = (groupCode?: string) => {
        if (groupCode) {
            const group = customerGroups[groupCode];
            setEditingGroup(group);
            form.setFieldsValue(group);
        } else {
            setEditingGroup(null);
            form.resetFields();
            form.setFieldsValue({
                code: genCode("GROUP_"),
            });
        }
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingGroup(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const database = getDatabase();
            const now = new Date().getTime();

            const groupData: CustomerGroup = {
                code: values.code,
                name: values.name,
                updatedAt: now,
                ...(editingGroup
                    ? { createdAt: editingGroup.createdAt }
                    : { createdAt: now }),
            };

            const groupRef = ref(
                database,
                `xoxo/customerGroups/${values.code}`,
            );

            if (editingGroup) {
                await update(groupRef, groupData);
                message.success("Cập nhật nhóm khách hàng thành công!");
            } else {
                await set(groupRef, groupData);
                message.success("Thêm nhóm khách hàng thành công!");
            }

            handleCloseModal();
        } catch (error) {
            console.error("Error saving customer group:", error);
            message.error("Có lỗi xảy ra khi lưu nhóm khách hàng!");
        }
    };

    const handleDelete = (groupCode: string, onCloseDrawer?: () => void) => {
        const group = customerGroups[groupCode];
        modal.confirm({
            title: "Xác nhận xóa",
            content: (
                <div>
                    <p>Bạn có chắc chắn muốn xóa nhóm khách hàng:</p>
                    <p className="font-semibold">{group.name}?</p>
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
                    const groupRef = ref(
                        database,
                        `xoxo/customerGroups/${groupCode}`,
                    );
                    await remove(groupRef);
                    message.success("Xóa nhóm khách hàng thành công!");
                    if (onCloseDrawer) {
                        onCloseDrawer();
                    }
                } catch (error) {
                    console.error("Error deleting customer group:", error);
                    message.error("Có lỗi xảy ra khi xóa nhóm khách hàng!");
                }
            },
        });
    };

    const dataSource = Object.entries(customerGroups).map(([code, group]) => ({
        ...group,
        key: code,
    }));

    const columns = [
        {
            title: "Mã nhóm",
            dataIndex: "code",
            key: "code",
            width: 200,
            fixed: "left" as const,
            render: (code: string) => (
                <Text strong className="text-primary">
                    {code}
                </Text>
            ),
        },
        {
            title: "Tên nhóm",
            dataIndex: "name",
            key: "name",
            width: 300,
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 180,
            sorter: (a: CustomerGroup, b: CustomerGroup) =>
                a.createdAt - b.createdAt,
            render: (date: number) => (
                <Text type="secondary">
                    {new Date(date).toLocaleString("vi-VN")}
                </Text>
            ),
        },
        {
            title: "Ngày cập nhật",
            dataIndex: "updatedAt",
            key: "updatedAt",
            width: 180,
            sorter: (a: CustomerGroup, b: CustomerGroup) =>
                a.updatedAt - b.updatedAt,
            render: (date: number) => (
                <Text type="secondary">
                    {new Date(date).toLocaleString("vi-VN")}
                </Text>
            ),
        },
    ];

    // Filter data
    const filteredData = applyFilter(dataSource);

    // Wrapper component for CustomerGroupDetail with handlers
    const CustomerGroupDetailWrapper: React.FC<
        PropRowDetails<CustomerGroup>
    > = (props) => {
        const handleDeleteWithClose = (groupCode: string) => {
            handleDelete(groupCode, props.onClose);
        };

        return (
            <CustomerGroupDetail
                {...props}
                onEdit={handleOpenModal}
                onDelete={handleDeleteWithClose}
            />
        );
    };

    return (
        <WrapperContent
            header={{
                searchInput: {
                    placeholder: "Tìm kiếm theo tên nhóm...",
                    filterKeys: ["name"],
                },
                buttonEnds: [
                    {
                        can: true,
                        name: "Thêm nhóm khách hàng",
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
                DrawerDetails={CustomerGroupDetailWrapper}
                rowKey="code"
            />

            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <Text strong>
                            {editingGroup
                                ? "Cập nhật nhóm khách hàng"
                                : "Thêm nhóm khách hàng mới"}
                        </Text>
                    </div>
                }
                open={modalVisible}
                onCancel={handleCloseModal}
                onOk={handleSubmit}
                width={600}
                okText={editingGroup ? "Cập nhật" : "Thêm mới"}
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" className="mt-6">
                    <Form.Item
                        name="code"
                        label="Mã nhóm"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập mã nhóm!",
                            },
                        ]}
                    >
                        <Input
                            placeholder="Mã tự động"
                            disabled={!!editingGroup}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="name"
                        label="Tên nhóm khách hàng"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập tên nhóm khách hàng!",
                            },
                            {
                                min: 2,
                                message: "Tên phải có ít nhất 2 ký tự!",
                            },
                        ]}
                    >
                        <Input
                            placeholder="VD: Khách hàng VIP, Khách hàng thân thiết..."
                            size="large"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </WrapperContent>
    );
}
