"use client";

import { useFirebaseApp } from "@/firebase";
import { useRealtimeList } from "@/firebase/hooks/useRealtime";
import {
    createStaff,
    deleteStaff,
    updateStaff,
} from "@/services/workflowService";
import type { Staff, StaffRole } from "@/types/workflow";
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    UserOutlined,
} from "@ant-design/icons";
import {
    Button,
    Form,
    Input,
    message,
    Modal,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";

const ROLE_COLORS: Record<StaffRole, string> = {
    worker: "blue",
    sale: "green",
    manager: "orange",
    admin: "red",
};

const ROLE_LABELS: Record<StaffRole, string> = {
    worker: "Công nhân",
    sale: "Sale",
    manager: "Quản lý",
    admin: "Admin",
};

export default function MemberManager() {
    const firebaseApp = useFirebaseApp();
    const { data: members, isLoading } =
        useRealtimeList<Omit<Staff, "id">>("members");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Staff | null>(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // ========== HANDLERS ==========

    const handleOpenModal = (member?: Staff) => {
        if (member) {
            setEditingMember(member);
            form.setFieldsValue({
                name: member.name,
                role: member.role,
            });
        } else {
            setEditingMember(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMember(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            if (editingMember) {
                await updateStaff(firebaseApp, editingMember.id, values);
                message.success("Cập nhật nhân viên thành công!");
            } else {
                await createStaff(firebaseApp, values);
                message.success("Thêm nhân viên mới thành công!");
            }

            handleCloseModal();
        } catch (error) {
            console.error("Error submitting member:", error);
            message.error("Có lỗi xảy ra, vui lòng thử lại!");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (memberId: string) => {
        try {
            await deleteStaff(firebaseApp, memberId);
            message.success("Xóa nhân viên thành công!");
        } catch (error) {
            console.error("Error deleting member:", error);
            message.error("Có lỗi xảy ra, vui lòng thử lại!");
        }
    };

    // ========== TABLE COLUMNS ==========

    const columns: ColumnsType<Staff> = [
        {
            title: "Mã NV",
            dataIndex: "id",
            key: "id",
            width: 120,
            render: (id) => <Tag color="purple">{id.slice(0, 8)}</Tag>,
        },
        {
            title: "Tên nhân viên",
            dataIndex: "name",
            key: "name",
            render: (name) => (
                <Space>
                    <UserOutlined className="text-blue-500" />
                    <span className="font-semibold text-gray-800">{name}</span>
                </Space>
            ),
        },
        {
            title: "Vai trò",
            dataIndex: "role",
            key: "role",
            width: 150,
            filters: [
                { text: "Công nhân", value: "worker" },
                { text: "Sale", value: "sale" },
                { text: "Quản lý", value: "manager" },
                { text: "Admin", value: "admin" },
            ],
            onFilter: (value, record) => record.role === value,
            render: (role: StaffRole) => (
                <Tag color={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Tag>
            ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 150,
            sorter: (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
            render: (timestamp) =>
                timestamp
                    ? new Date(timestamp).toLocaleDateString("vi-VN")
                    : "-",
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 150,
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(record)}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Xác nhận xóa?"
                        description="Bạn có chắc muốn xóa nhân viên này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="bg-background rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Quản lý nhân viên
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Danh sách tất cả nhân viên trong hệ thống
                    </p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenModal()}
                    size="large"
                >
                    Thêm nhân viên
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={members || []}
                loading={isLoading}
                rowKey="id"
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} nhân viên`,
                }}
            />

            {/* Create/Edit Modal */}
            <Modal
                title={
                    editingMember ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"
                }
                open={isModalOpen}
                onOk={handleSubmit}
                onCancel={handleCloseModal}
                confirmLoading={submitting}
                width={500}
                okText={editingMember ? "Cập nhật" : "Tạo mới"}
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="name"
                        label="Tên nhân viên"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập tên nhân viên!",
                            },
                            { min: 2, message: "Tên phải có ít nhất 2 ký tự!" },
                        ]}
                    >
                        <Input placeholder="Nguyễn Văn A" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Vai trò"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn vai trò!",
                            },
                        ]}
                        initialValue="worker"
                    >
                        <Select size="large">
                            <Select.Option value="worker">
                                <Tag color={ROLE_COLORS.worker}>
                                    {ROLE_LABELS.worker}
                                </Tag>
                            </Select.Option>
                            <Select.Option value="sale">
                                <Tag color={ROLE_COLORS.sale}>
                                    {ROLE_LABELS.sale}
                                </Tag>
                            </Select.Option>
                            <Select.Option value="manager">
                                <Tag color={ROLE_COLORS.manager}>
                                    {ROLE_LABELS.manager}
                                </Tag>
                            </Select.Option>
                            <Select.Option value="admin">
                                <Tag color={ROLE_COLORS.admin}>
                                    {ROLE_LABELS.admin}
                                </Tag>
                            </Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
