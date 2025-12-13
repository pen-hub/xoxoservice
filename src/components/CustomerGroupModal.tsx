"use client";

import { genCode } from "@/utils/genCode";
import { App, Form, Input, Modal } from "antd";
import { getDatabase, ref, set } from "firebase/database";

interface CustomerGroupModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess?: (groupCode: string) => void;
}

const CustomerGroupModal: React.FC<CustomerGroupModalProps> = ({
    open,
    onCancel,
    onSuccess,
}) => {
    const [form] = Form.useForm();
    const { message } = App.useApp();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const database = getDatabase();
            const now = new Date().getTime();

            const groupCode = genCode("GROUP_");
            const groupData = {
                code: groupCode,
                name: values.name,
                createdAt: now,
                updatedAt: now,
            };

            const groupRef = ref(database, `xoxo/customerGroups/${groupCode}`);
            await set(groupRef, groupData);

            message.success("Thêm nhóm khách hàng thành công!");
            form.resetFields();
            onCancel();
            onSuccess?.(groupCode);
        } catch (error) {
            console.error("Error creating customer group:", error);
            message.error("Có lỗi xảy ra khi tạo nhóm khách hàng!");
        }
    };

    return (
        <Modal
            title="Thêm nhóm khách hàng mới"
            open={open}
            onCancel={() => {
                onCancel();
                form.resetFields();
            }}
            onOk={handleSubmit}
            okText="Thêm mới"
            cancelText="Hủy"
            width={500}
        >
            <Form form={form} layout="vertical" className="mt-4">
                <Form.Item
                    name="name"
                    label="Tên nhóm khách hàng"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập tên nhóm khách hàng!",
                        },
                        { min: 2, message: "Tên phải có ít nhất 2 ký tự!" },
                    ]}
                >
                    <Input
                        placeholder="VD: Khách hàng VIP, Khách hàng thân thiết..."
                        size="large"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CustomerGroupModal;

