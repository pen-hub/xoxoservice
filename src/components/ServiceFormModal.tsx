"use client";

import type {
    FirebaseBrands,
    FirebaseServiceCategories,
    Service,
} from "@/types/service";
import { genCode } from "@/utils/genCode";
import { CustomerServiceOutlined, PlusOutlined } from "@ant-design/icons";
import {
    App,
    Button,
    Col,
    Collapse,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Tabs,
    Typography,
    Upload,
} from "antd";
import { getDatabase, ref, set, update } from "firebase/database";
import { useEffect, useState } from "react";
import BrandFormModal from "./BrandFormModal";
import RichTextEditor from "./RichTextEditor";

const { Text } = Typography;
const { Panel } = Collapse;

interface ServiceFormModalProps {
    open: boolean;
    editingService: Service | null;
    serviceCategories: FirebaseServiceCategories;
    brands: FirebaseBrands;
    onCancel: () => void;
    onSuccess: () => void;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
    open,
    editingService,
    serviceCategories,
    brands,
    onCancel,
    onSuccess,
}) => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const [brandModalVisible, setBrandModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);

    useEffect(() => {
        if (open) {
            form.resetFields();
            if (editingService) {
                form.setFieldsValue(editingService);
            } else {
                form.setFieldsValue({
                    code: genCode("SVC_"),
                });
            }
        }
    }, [open, editingService, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const database = getDatabase();
            const now = new Date().getTime();

            const serviceData: any = {
                ...values,
                updatedAt: now,
                ...(editingService
                    ? { createdAt: editingService.createdAt }
                    : { createdAt: now }),
            };

            // Remove undefined values
            const cleanedData = Object.fromEntries(
                Object.entries(serviceData).filter(
                    ([_, value]) => value !== undefined,
                ),
            ) as Service;

            const serviceRef = ref(database, `xoxo/services/${values.code}`);

            if (editingService) {
                await update(serviceRef, cleanedData);
                message.success("Cập nhật dịch vụ thành công!");
            } else {
                await set(serviceRef, cleanedData);
                message.success("Thêm dịch vụ thành công!");
            }

            onCancel();
            onSuccess();
        } catch (error) {
            console.error("Error saving service:", error);
            message.error("Có lỗi xảy ra khi lưu dịch vụ!");
        }
    };

    const categoryOptions = Object.values(serviceCategories).map((cat) => ({
        value: cat.code,
        label: cat.name,
    }));

    const brandOptions = Object.values(brands).map((brand) => ({
        value: brand.code,
        label: brand.name,
    }));

    return (
        <>
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <CustomerServiceOutlined />
                        <Text strong>
                            {editingService
                                ? "Cập nhật dịch vụ"
                                : "Tạo thẻ tài khoản"}
                        </Text>
                    </div>
                }
                open={open}
                onCancel={onCancel}
                onOk={handleSubmit}
                width={1000}
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
                                    <Row gutter={24}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="name"
                                                label="Tên hàng"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            "Vui lòng nhập tên hàng!",
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder="Bắt buộc"
                                                    size="large"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="code"
                                                label="Mã hàng"
                                            >
                                                <Input
                                                    placeholder="Tự động"
                                                    disabled
                                                    size="large"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="categoryCode"
                                                label="Nhóm hàng"
                                            >
                                                <Space.Compact
                                                    style={{ width: "100%" }}
                                                >
                                                    <Select
                                                        placeholder="Chọn nhóm hàng"
                                                        size="large"
                                                        style={{ flex: 1 }}
                                                        showSearch
                                                        allowClear
                                                        filterOption={(
                                                            input,
                                                            option,
                                                        ) =>
                                                            (
                                                                option?.label ??
                                                                ""
                                                            )
                                                                .toLowerCase()
                                                                .includes(
                                                                    input.toLowerCase(),
                                                                )
                                                        }
                                                        options={
                                                            categoryOptions
                                                        }
                                                    />
                                                    <Button
                                                        type="link"
                                                        size="large"
                                                        onClick={() =>
                                                            setCategoryModalVisible(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        Tạo mới
                                                    </Button>
                                                </Space.Compact>
                                            </Form.Item>

                                            <Form.Item
                                                name="brandCode"
                                                label="Thương hiệu"
                                            >
                                                <Space.Compact
                                                    style={{ width: "100%" }}
                                                >
                                                    <Select
                                                        placeholder="Chọn thương hiệu"
                                                        size="large"
                                                        style={{ flex: 1 }}
                                                        showSearch
                                                        allowClear
                                                        filterOption={(
                                                            input,
                                                            option,
                                                        ) =>
                                                            (
                                                                option?.label ??
                                                                ""
                                                            )
                                                                .toLowerCase()
                                                                .includes(
                                                                    input.toLowerCase(),
                                                                )
                                                        }
                                                        options={brandOptions}
                                                    />
                                                    <Button
                                                        type="link"
                                                        size="large"
                                                        onClick={() =>
                                                            setBrandModalVisible(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        Tạo mới
                                                    </Button>
                                                </Space.Compact>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Collapse
                                                defaultActiveKey={["price"]}
                                            >
                                                <Panel
                                                    header="Giá bán, mệnh giá"
                                                    key="price"
                                                >
                                                    <Form.Item
                                                        name="sellingPrice"
                                                        label="Giá bán"
                                                    >
                                                        <InputNumber
                                                            placeholder="0"
                                                            size="large"
                                                            style={{
                                                                width: "100%",
                                                            }}
                                                            formatter={(
                                                                value,
                                                            ) =>
                                                                `${value}`.replace(
                                                                    /\B(?=(\d{3})+(?!\d))/g,
                                                                    ",",
                                                                )
                                                            }
                                                            parser={(value) =>
                                                                value!.replace(
                                                                    /\$\s?|(,*)/g,
                                                                    "",
                                                                )
                                                            }
                                                        />
                                                    </Form.Item>
                                                    <Form.Item
                                                        name="faceValue"
                                                        label="Mệnh giá sử dụng"
                                                    >
                                                        <InputNumber
                                                            placeholder="0"
                                                            size="large"
                                                            style={{
                                                                width: "100%",
                                                            }}
                                                            formatter={(
                                                                value,
                                                            ) =>
                                                                `${value}`.replace(
                                                                    /\B(?=(\d{3})+(?!\d))/g,
                                                                    ",",
                                                                )
                                                            }
                                                            parser={(value) =>
                                                                value!.replace(
                                                                    /\$\s?|(,*)/g,
                                                                    "",
                                                                )
                                                            }
                                                        />
                                                    </Form.Item>
                                                </Panel>
                                                <Panel
                                                    header="Phạm vi thanh toán"
                                                    key="payment"
                                                >
                                                    <Form.Item
                                                        name="paymentScope"
                                                        label=""
                                                    >
                                                        <Input.TextArea
                                                            placeholder="Nhập phạm vi thanh toán..."
                                                            rows={3}
                                                        />
                                                    </Form.Item>
                                                </Panel>
                                            </Collapse>
                                        </Col>
                                    </Row>
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
                                            Upload tối đa 10 ảnh, dung lượng mỗi
                                            ảnh tối đa 2MB
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

            <BrandFormModal
                open={brandModalVisible}
                onCancel={() => setBrandModalVisible(false)}
                onSuccess={(brandCode) => {
                    form.setFieldsValue({ brandCode });
                    setBrandModalVisible(false);
                }}
            />
        </>
    );
};

export default ServiceFormModal;

