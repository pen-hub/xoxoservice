"use client";

import ButtonCall from "@/components/ButtonCall";
import { PropRowDetails } from "@/components/CommonTable";
import type { Customer, CustomerGroup, Province } from "@/types/customer";
import {
    getCustomerTypeLabel,
    getGenderLabel,
    getSourceColor,
    getSourceLabel,
} from "@/utils/customerUtils";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Descriptions, Tag, Typography } from "antd";
import dayjs from "dayjs";

interface CustomerDetailProps extends PropRowDetails<Customer> {
    onEdit: (customerCode: string) => void;
    onDelete: (customerCode: string, onCloseDrawer?: () => void) => void;
    provinces?: Province[];
    customerGroups?: Record<string, CustomerGroup>;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({
    data,
    onClose,
    onEdit,
    onDelete,
    provinces = [],
    customerGroups = {},
}) => {
    if (!data) return null;

    // Helper function to get location name from code
    const getLocationName = (
        code: string | undefined,
        type: "province" | "district" | "ward",
    ): string => {
        if (!code || provinces.length === 0) return code || "";

        if (type === "province") {
            const province = provinces.find((p) => p.code === code);
            return province?.name || code;
        }

        if (type === "district") {
            for (const province of provinces) {
                const district = province.districts?.find(
                    (d) => d.code === code,
                );
                if (district) return district.name;
            }
            return code;
        }

        if (type === "ward") {
            for (const province of provinces) {
                for (const district of province.districts || []) {
                    const ward = district.wards?.find((w) => w.code === code);
                    if (ward) return ward.name;
                }
            }
            return code;
        }

        return code;
    };

    const getFullAddress = () => {
        const parts = [];
        // Thứ tự: Địa chỉ (Đường), Xã/Phường, Quận/Huyện, Tỉnh/Thành phố
        if (data.address) parts.push(data.address);
        if (data.ward) {
            const wardName = getLocationName(data.ward, "ward");
            parts.push(wardName);
        }
        if (data.district) {
            const districtName = getLocationName(data.district, "district");
            parts.push(districtName);
        }
        if (data.province) {
            const provinceName = getLocationName(data.province, "province");
            parts.push(provinceName);
        }
        return parts.length > 0 ? parts.join(", ") : "-";
    };

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
                <Descriptions.Item label="Mã KH">{data.code}</Descriptions.Item>
                <Descriptions.Item label="Tên khách hàng">
                    {data.name}
                </Descriptions.Item>
                <Descriptions.Item label="Loại khách">
                    {getCustomerTypeLabel(data.customerType)}
                </Descriptions.Item>
                <Descriptions.Item label="Giới tính">
                    {getGenderLabel(data.gender)}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                    {data.phone || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                    {data.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày sinh">
                    {data.dateOfBirth
                        ? dayjs(data.dateOfBirth).format("DD/MM/YYYY")
                        : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                    {getFullAddress()}
                </Descriptions.Item>
                <Descriptions.Item label="Nguồn khách hàng">
                    <Tag color={getSourceColor(data.customerSource)}>
                        {getSourceLabel(data.customerSource)}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Nhóm khách hàng">
                    {data.customerGroup ? (
                        customerGroups[data.customerGroup] ? (
                            <Tag color="cyan">
                                {customerGroups[data.customerGroup].name}
                            </Tag>
                        ) : (
                            <Typography.Text type="secondary">
                                {data.customerGroup}
                            </Typography.Text>
                        )
                    ) : (
                        "-"
                    )}
                </Descriptions.Item>
                <Descriptions.Item label="Mã số thuế">
                    {data.taxCode || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Facebook">
                    {data.facebook || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ghi chú">
                    {data.notes || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                    {data.createdAt
                        ? dayjs(data.createdAt).format("DD/MM/YYYY HH:mm")
                        : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày cập nhật">
                    {data.updatedAt
                        ? dayjs(data.updatedAt).format("DD/MM/YYYY HH:mm")
                        : "-"}
                </Descriptions.Item>
            </Descriptions>
            <div className="flex justify-end gap-2 mt-4 p-3">
                <ButtonCall phone={data.phone || ""} />
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

export default CustomerDetail;

