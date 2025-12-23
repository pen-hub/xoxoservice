"use client";

import type {
    Customer,
    CustomerGroup,
    District,
    Province,
    Ward,
} from "@/types/customer";
import { CustomerSource, CustomerSourceOptions, LeadStatus, LeadStatusOptions } from "@/types/enum";
import { IMembers } from "@/types/members";
import { genCode } from "@/utils/genCode";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import {
    App,
    Button,
    Col,
    DatePicker,
    Form,
    Input,
    Modal,
    Radio,
    Row,
    Select,
    Space,
    Typography,
} from "antd";
import dayjs from "dayjs";
import { getDatabase, ref, set, update } from "firebase/database";
import { Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import CustomerGroupModal from "./CustomerGroupModal";

const { Text } = Typography;

interface CustomerFormModalProps {
    open: boolean;
    editingCustomer: Customer | null;
    customerGroups: Record<string, CustomerGroup>;
    provinces: Province[];
    members?: IMembers[];
    onCancel: () => void;
    onSuccess: () => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
    open,
    editingCustomer,
    customerGroups,
    provinces,
    members = [],
    onCancel,
    onSuccess,
}) => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const [selectedProvince, setSelectedProvince] = useState<
        string | undefined
    >();
    const [districts, setDistricts] = useState<District[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<
        string | undefined
    >();
    const [wards, setWards] = useState<Ward[]>([]);
    const [groupModalVisible, setGroupModalVisible] = useState(false);

    // Load districts when province is selected
    useEffect(() => {
        if (selectedProvince) {
            const province = provinces.find((p) => p.code === selectedProvince);
            if (province) {
                setDistricts(province.districts || []);
                setSelectedDistrict(undefined);
                setWards([]);
                form.setFieldsValue({ ward: undefined });
            }
        } else {
            setDistricts([]);
            setSelectedDistrict(undefined);
            setWards([]);
        }
    }, [selectedProvince, provinces, form]);

    // Load wards when district is selected
    useEffect(() => {
        if (selectedDistrict && districts.length > 0) {
            const district = districts.find((d) => d.code === selectedDistrict);
            if (district) {
                setWards(district.wards || []);
                form.setFieldsValue({ ward: undefined });
            }
        } else {
            setWards([]);
        }
    }, [selectedDistrict, districts, form]);

    // Initialize form when editing or creating
    useEffect(() => {
        if (open) {
            if (editingCustomer) {
                const formValues = {
                    ...editingCustomer,
                    dateOfBirth: editingCustomer.dateOfBirth
                        ? dayjs(editingCustomer.dateOfBirth)
                        : undefined,
                };
                form.setFieldsValue(formValues);
                // Set province and district for cascading dropdown
                if (editingCustomer.province) {
                    setSelectedProvince(editingCustomer.province);
                    // Wait for provinces to load, then set district
                    setTimeout(() => {
                        const province = provinces.find(
                            (p) => p.code === editingCustomer.province,
                        );
                        if (province && editingCustomer.district) {
                            setSelectedDistrict(editingCustomer.district);
                        } else if (province && editingCustomer.ward) {
                            // Find district from ward if district not saved
                            const district = province.districts?.find((d) =>
                                d.wards?.some(
                                    (w) => w.code === editingCustomer.ward,
                                ),
                            );
                            if (district) {
                                setSelectedDistrict(district.code);
                                form.setFieldsValue({
                                    district: district.code,
                                });
                            }
                        }
                    }, 100);
                }
            } else {
                form.resetFields();
                form.setFieldsValue({
                    code: genCode("CUST_"),
                    customerSource: CustomerSource.WalkIn,
                    customerType: "individual",
                });
                setSelectedProvince(undefined);
                setSelectedDistrict(undefined);
                setWards([]);
            }
        }
    }, [open, editingCustomer, form, provinces]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const database = getDatabase();
            const now = new Date().getTime();

            // Convert dateOfBirth from dayjs to timestamp if exists
            const customerData: any = {
                ...values,
                dateOfBirth: values.dateOfBirth
                    ? dayjs(values.dateOfBirth).valueOf()
                    : undefined,
                updatedAt: now,
                ...(editingCustomer
                    ? { createdAt: editingCustomer.createdAt }
                    : { createdAt: now }),
            };

            // Remove undefined values (Firebase doesn't allow undefined)
            const cleanedData = Object.fromEntries(
                Object.entries(customerData).filter(
                    ([_, value]) => value !== undefined,
                ),
            ) as Record<string, any> as Customer;

            const customerRef = ref(database, `xoxo/customers/${values.code}`);

            if (editingCustomer) {
                await update(customerRef, cleanedData);
                message.success("Cập nhật Lead Khách hàng thành công!");
            } else {
                await set(customerRef, cleanedData);
                message.success("Thêm Lead Khách hàng thành công!");
            }

            handleClose();
            onSuccess();
        } catch (error) {
            console.error("Error saving customer:", error);
            message.error("Có lỗi xảy ra khi lưu khách hàng!");
        }
    };

    const handleClose = () => {
        form.resetFields();
        setSelectedProvince(undefined);
        setSelectedDistrict(undefined);
        setWards([]);
        onCancel();
    };

    const handleGroupCreated = (groupCode: string) => {
        form.setFieldsValue({ customerGroup: groupCode });
    };

    return (
        <>
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <UserOutlined />
                        <Text strong>
                            {editingCustomer
                                ? "Cập nhật Lead Khách hàng"
                                : "Thêm Lead Khách hàng mới"}
                        </Text>
                    </div>
                }
                open={open}
                onCancel={handleClose}
                onOk={handleSubmit}
                width={1000}
                okText={editingCustomer ? "Cập nhật" : "Thêm mới"}
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" className="mt-6">
                    <Row gutter={24}>
                        {/* Left Column */}
                        <Col span={12}>
                            <Form.Item
                                name="code"
                                label="Mã khách hàng"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập mã khách hàng!",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="Mã tự động"
                                    disabled
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                name="name"
                                label="Tên khách hàng"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Vui lòng nhập tên khách hàng!",
                                    },
                                    {
                                        min: 2,
                                        message: "Tên phải có ít nhất 2 ký tự!",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="Nhập tên khách hàng"
                                    prefix={<UserOutlined />}
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                name="phone"
                                label="Điện thoại"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập số điện thoại!",
                                    },
                                    {
                                        pattern: /^[0-9]{10,11}$/,
                                        message: "Số điện thoại không hợp lệ!",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="0912345678"
                                    prefix={
                                        <Phone className="w-4 h-4 text-gray-400" />
                                    }
                                    size="large"
                                    maxLength={11}
                                />
                            </Form.Item>

                            <Form.Item name="dateOfBirth" label="Ngày sinh">
                                <DatePicker
                                    placeholder="--/--/----"
                                    format="DD/MM/YYYY"
                                    className="w-full"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                name="address"
                                label="Địa chỉ"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập địa chỉ!",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="Vui lòng nhập địa chỉ"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item name="province" label="Tỉnh/Thành phố">
                                <Select
                                    placeholder="Chọn Tỉnh/Thành phố"
                                    size="large"
                                    showSearch
                                    allowClear
                                    value={selectedProvince}
                                    onChange={(value) => {
                                        setSelectedProvince(value);
                                        form.setFieldsValue({
                                            province: value,
                                            district: undefined,
                                            ward: undefined,
                                        });
                                    }}
                                    filterOption={(input, option) =>
                                        (option?.label ?? "")
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    options={provinces.map((p) => ({
                                        value: p.code,
                                        label: p.name,
                                    }))}
                                />
                            </Form.Item>

                            <Form.Item name="district" label="Quận/Huyện">
                                <Select
                                    placeholder="Chọn Quận/Huyện"
                                    size="large"
                                    showSearch
                                    allowClear
                                    disabled={
                                        !selectedProvince ||
                                        districts.length === 0
                                    }
                                    value={selectedDistrict}
                                    onChange={(value) => {
                                        setSelectedDistrict(value);
                                        form.setFieldsValue({
                                            district: value,
                                            ward: undefined,
                                        });
                                    }}
                                    filterOption={(input, option) =>
                                        (option?.label ?? "")
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    options={districts.map((d) => ({
                                        value: d.code,
                                        label: d.name,
                                    }))}
                                />
                            </Form.Item>

                            <Form.Item name="ward" label="Xã/Phường">
                                <Select
                                    placeholder="Chọn Xã/Phường"
                                    size="large"
                                    showSearch
                                    allowClear
                                    disabled={
                                        !selectedDistrict || wards.length === 0
                                    }
                                    filterOption={(input, option) =>
                                        (option?.label ?? "")
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    options={wards.map((w) => ({
                                        value: w.code,
                                        label: w.name,
                                    }))}
                                />
                            </Form.Item>
                        </Col>

                        {/* Right Column */}
                        <Col span={12}>
                            <Form.Item
                                name="customerType"
                                label="Loại khách"
                                initialValue="individual"
                            >
                                <Radio.Group size="large">
                                    <Radio value="individual">Cá nhân</Radio>
                                    <Radio value="enterprise">
                                        Doanh nghiệp
                                    </Radio>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item name="gender" label="Giới tính">
                                <Radio.Group size="large">
                                    <Radio value="male">Nam</Radio>
                                    <Radio value="female">Nữ</Radio>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item
                                name="customerSource"
                                label="Nguồn khách hàng"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Vui lòng chọn nguồn khách hàng!",
                                    },
                                ]}
                                initialValue={CustomerSource.WalkIn}
                            >
                                <Select
                                    placeholder="Chọn nguồn khách hàng"
                                    options={CustomerSourceOptions}
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item name="customerGroup" label="Nhóm khách">
                                <Space.Compact style={{ width: "100%" }}>
                                    <Select
                                        placeholder="Chọn nhóm khách"
                                        size="large"
                                        style={{ flex: 1 }}
                                        showSearch
                                        allowClear
                                        filterOption={(input, option) =>
                                            (option?.label ?? "")
                                                .toLowerCase()
                                                .includes(input.toLowerCase())
                                        }
                                        options={Object.values(
                                            customerGroups,
                                        ).map((group) => ({
                                            value: group.code,
                                            label: group.name,
                                        }))}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        size="large"
                                        onClick={() =>
                                            setGroupModalVisible(true)
                                        }
                                        title="Thêm nhanh"
                                    >
                                        +
                                    </Button>
                                </Space.Compact>
                            </Form.Item>

                            <Form.Item name="taxCode" label="Mã số thuế">
                                <Input
                                    placeholder="Nhập mã số thuế"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    {
                                        type: "email",
                                        message: "Email không hợp lệ!",
                                    },
                                ]}
                            >
                                <Input
                                    placeholder="Nhập email"
                                    prefix={
                                        <Mail className="w-4 h-4 text-gray-400" />
                                    }
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item name="facebook" label="Facebook">
                                <Input
                                    placeholder="Nhập Facebook"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item name="salePerson" label="Sale phụ trách">
                                <Select
                                    placeholder="Chọn Sale phụ trách"
                                    size="large"
                                    showSearch
                                    allowClear
                                    filterOption={(input, option) =>
                                        (option?.label ?? "")
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    options={members
                                        .filter((m) => m.role === "sales" || m.isActive !== false)
                                        .map((member) => ({
                                            value: member.id,
                                            label: member.name,
                                        }))}
                                />
                            </Form.Item>

                            <Form.Item name="mktPerson" label="MKT phụ trách">
                                <Select
                                    placeholder="Chọn MKT phụ trách"
                                    size="large"
                                    showSearch
                                    allowClear
                                    filterOption={(input, option) =>
                                        (option?.label ?? "")
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    options={members
                                        .filter((m) => m.isActive !== false)
                                        .map((member) => ({
                                            value: member.id,
                                            label: member.name,
                                        }))}
                                />
                            </Form.Item>

                            <Form.Item name="pageManager" label="Trực page">
                                <Input
                                    placeholder="Nhập tên người trực page"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item name="status" label="Trạng thái">
                                <Select
                                    placeholder="Chọn trạng thái"
                                    size="large"
                                    options={LeadStatusOptions}
                                />
                            </Form.Item>

                            <Form.Item name="notes" label="Ghi chú">
                                <Input.TextArea
                                    placeholder="Nhập ghi chú..."
                                    rows={4}
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <CustomerGroupModal
                open={groupModalVisible}
                onCancel={() => setGroupModalVisible(false)}
                onSuccess={handleGroupCreated}
            />
        </>
    );
};

export default CustomerFormModal;

