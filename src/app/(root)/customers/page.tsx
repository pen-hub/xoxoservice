"use client";

import CommonTable from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import type { FilterField } from "@/types";
import { CustomerSource, CustomerSourceOptions } from "@/types/enum";
import { genCode } from "@/utils/genCode";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
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
import { Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";

const { Title, Text } = Typography;

interface Customer {
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  customerSource: CustomerSource;
  createdAt: number;
  updatedAt: number;
}

interface FirebaseCustomers {
  [key: string]: Customer;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<FirebaseCustomers>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { message, modal } = App.useApp();
  const { query, updateQuery, applyFilter, reset } = useFilter();

  // Load customers from Firebase
  useEffect(() => {
    const database = getDatabase();
    const customersRef = ref(database, "xoxo/customers");

    const unsubscribe = onValue(
      customersRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setCustomers(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading customers:", error);
        message.error("Không thể tải danh sách khách hàng!");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [message]);

  const handleOpenModal = (customerCode?: string) => {
    if (customerCode) {
      const customer = customers[customerCode];
      setEditingCustomer(customerCode);
      form.setFieldsValue(customer);
    } else {
      setEditingCustomer(null);
      form.resetFields();
      form.setFieldsValue({
        code: genCode("CUST_"),
        customerSource: CustomerSource.Other,
      });
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingCustomer(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const database = getDatabase();
      const now = new Date().getTime();

      const customerData: Customer = {
        ...values,
        updatedAt: now,
        ...(editingCustomer ? {} : { createdAt: now }),
      };

      const customerRef = ref(database, `xoxo/customers/${values.code}`);

      if (editingCustomer) {
        await update(customerRef, customerData);
        message.success("Cập nhật khách hàng thành công!");
      } else {
        await set(customerRef, customerData);
        message.success("Thêm khách hàng thành công!");
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving customer:", error);
      message.error("Có lỗi xảy ra khi lưu khách hàng!");
    }
  };

  const handleDelete = (customerCode: string) => {
    const customer = customers[customerCode];
    modal.confirm({
      title: "Xác nhận xóa",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa khách hàng:</p>
          <p className="font-semibold">{customer.name}?</p>
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
          const customerRef = ref(database, `xoxo/customers/${customerCode}`);
          await remove(customerRef);
          message.success("Xóa khách hàng thành công!");
        } catch (error) {
          console.error("Error deleting customer:", error);
          message.error("Có lỗi xảy ra khi xóa khách hàng!");
        }
      },
    });
  };

  const getSourceColor = (source: CustomerSource) => {
    const colors: Record<CustomerSource, string> = {
      [CustomerSource.Facebook]: "blue",
      [CustomerSource.Zalo]: "cyan",
      [CustomerSource.Instagram]: "magenta",
      [CustomerSource.Tiktok]: "purple",
      [CustomerSource.Website]: "green",
      [CustomerSource.Referral]: "gold",
      [CustomerSource.WalkIn]: "orange",
      [CustomerSource.Phone]: "volcano",
      [CustomerSource.Other]: "default",
    };
    return colors[source] || "default";
  };

  const getSourceLabel = (source: CustomerSource) => {
    const option = CustomerSourceOptions.find((opt) => opt.value === source);
    return option?.label || source;
  };

  const dataSource = Object.entries(customers).map(([code, customer]) => ({
    ...customer,
    key: code,
  }));

  const columns = [
    {
      title: "Mã KH",
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
      title: "Tên khách hàng",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <UserOutlined className="text-gray-400" />
          <Text strong>{name}</Text>
        </div>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 150,
      render: (phone: string) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <Text copyable>{phone}</Text>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 260,
      render: (email: string) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <Text copyable={email ? true : false}>{email || "-"}</Text>
        </div>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      width: 250,
      render: (address: string) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <Text ellipsis={{ tooltip: address }}>{address}</Text>
        </div>
      ),
    },
    {
      title: "Nguồn khách",
      dataIndex: "customerSource",
      key: "customerSource",
      width: 150,
      filters: CustomerSourceOptions.map((opt) => ({
        text: opt.label,
        value: opt.value,
      })),
      onFilter: (value: any, record: Customer) =>
        record.customerSource === value,
      render: (source: CustomerSource) => (
        <Tag color={getSourceColor(source)}>{getSourceLabel(source)}</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      sorter: (a: Customer, b: Customer) => a.createdAt - b.createdAt,
      render: (date: number) => (
        <Text type="secondary">
          {new Date(date).toLocaleDateString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      fixed: "right" as const,
      render: (_: any, record: Customer) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record.code)}
            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
          >
            Sửa
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.code)}
            className="hover:bg-red-50"
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // Filter data
  const filteredData = applyFilter(dataSource);

  // Filter fields for WrapperContent
  const filterFields: FilterField[] = [
    {
      name: "customerSource",
      label: "Nguồn khách hàng",
      type: "select",
      options: CustomerSourceOptions,
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm theo tên, SĐT, email...",
          filterKeys: ["name", "phone", "email"],
        },
        filters: {
          fields: filterFields,
          query: query,
          onApplyFilter: (filters) => {
            filters.forEach(({ key, value }) => updateQuery(key, value));
          },
          onReset: reset,
        },
        buttonEnds: [
          {
            name: "Thêm khách hàng",
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
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <UserOutlined />
            <Text strong>
              {editingCustomer ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}
            </Text>
          </div>
        }
        open={modalVisible}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        width={700}
        okText={editingCustomer ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item
            name="code"
            label="Mã khách hàng"
            rules={[
              { required: true, message: "Vui lòng nhập mã khách hàng!" },
            ]}
          >
            <Input placeholder="CUST_XXXXXX" disabled size="large" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên khách hàng"
            rules={[
              { required: true, message: "Vui lòng nhập tên khách hàng!" },
              { min: 2, message: "Tên phải có ít nhất 2 ký tự!" },
            ]}
          >
            <Input
              placeholder="VD: Nguyễn Văn A"
              prefix={<UserOutlined />}
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "Số điện thoại không hợp lệ!",
                  },
                ]}
              >
                <Input
                  placeholder="0123456789"
                  prefix={<Phone className="w-4 h-4 text-gray-400" />}
                  size="large"
                  maxLength={11}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: "email", message: "Email không hợp lệ!" }]}
              >
                <Input
                  placeholder="example@email.com"
                  prefix={<Mail className="w-4 h-4 text-gray-400" />}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
          >
            <Input.TextArea
              placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
              rows={3}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="customerSource"
            label="Nguồn khách hàng"
            rules={[
              { required: true, message: "Vui lòng chọn nguồn khách hàng!" },
            ]}
          >
            <Select
              placeholder="Chọn nguồn khách hàng"
              options={CustomerSourceOptions}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </WrapperContent>
  );
}
