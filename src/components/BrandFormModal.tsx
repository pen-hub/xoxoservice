"use client";

import { genCode } from "@/utils/genCode";
import { App, Form, Input, Modal } from "antd";
import { getDatabase, ref, set } from "firebase/database";

interface BrandFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess?: (brandCode: string) => void;
}

const BrandFormModal: React.FC<BrandFormModalProps> = ({
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

            const brandCode = genCode("BRAND_");
            const brandData = {
                code: brandCode,
                name: values.name,
                createdAt: now,
                updatedAt: now,
            };

            const brandRef = ref(database, `xoxo/brands/${brandCode}`);
            await set(brandRef, brandData);

            message.success("Thêm thương hiệu thành công!");
            form.resetFields();
            onCancel();
            onSuccess?.(brandCode);
        } catch (error) {
            console.error("Error creating brand:", error);
            message.error("Có lỗi xảy ra khi tạo thương hiệu!");
        }
    };

    return (
        <Modal
            title="Thêm thương hiệu mới"
            open={open}
            onCancel={() => {
                onCancel();
                form.resetFields();
            }}
            onOk={handleSubmit}
            okText="Tạo mới"
            cancelText="Hủy"
            width={500}
        >
            <Form form={form} layout="vertical" className="mt-4">
                <Form.Item
                    name="name"
                    label="Tên thương hiệu"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập tên thương hiệu!",
                        },
                        { min: 2, message: "Tên phải có ít nhất 2 ký tự!" },
                    ]}
                >
                    <Input placeholder="Nhập tên thương hiệu" size="large" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default BrandFormModal;

