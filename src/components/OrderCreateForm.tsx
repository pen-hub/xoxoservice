"use client";

import { DeleteOutlined, InboxOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
  Upload,
} from "antd";

const { TextArea } = Input;
const { Dragger } = Upload;
const { Text } = Typography;

interface OrderFormValues {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  orderDate: any;
  deliveryDate: any;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    notes: string;
  }>;
  files: any[];
  discountAmount: number;
  shippingFee: number;
  notes: string;
}

const mockCustomers = [
  { value: "customer1", label: "Công ty TNHH ABC" },
  { value: "customer2", label: "Khách hàng XYZ" },
  { value: "customer3", label: "Siêu thị DEF" },
];

const mockProducts = [
  { value: "product1", label: "Áo sơ mi nam" },
  { value: "product2", label: "Quần âu nữ" },
  { value: "product3", label: "Áo thun trẻ em" },
];

export default function OrderCreateForm() {
  const [form] = Form.useForm<OrderFormValues>();

  const calculateTotal = () => {
    const items = form.getFieldValue("items") || [];
    const discountAmount = form.getFieldValue("discountAmount") || 0;
    const shippingFee = form.getFieldValue("shippingFee") || 0;

    const subtotal = items.reduce((sum: number, item: any) => {
      const quantity = item?.quantity || 0;
      const unitPrice = item?.unitPrice || 0;
      return sum + quantity * unitPrice;
    }, 0);

    const total = subtotal - discountAmount + shippingFee;

    return { subtotal, total };
  };

  const onFinish = (values: OrderFormValues) => {
    console.log("Form values:", values);
    const { subtotal, total } = calculateTotal();
    console.log("Subtotal:", subtotal);
    console.log("Total:", total);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        items: [{ productName: "", quantity: 1, unitPrice: 0, notes: "" }],
        discountAmount: 0,
        shippingFee: 0,
      }}
      className="max-w-6xl mx-auto"
    >
      <Space vertical size="large" className="w-full">
        {/* Customer Information Section */}
        <Card title="Thông tin khách hàng" className="w-full">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="customerName"
                label="Tên khách hàng"
                rules={[
                  { required: true, message: "Vui lòng nhập tên khách hàng" },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Chọn khách hàng"
                  options={mockCustomers}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="customerPhone"
                label="Số điện thoại"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số điện thoại",
                  },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="customerEmail" label="Email">
                <Input placeholder="Nhập email" type="email" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="customerAddress" label="Địa chỉ">
                <Input placeholder="Nhập địa chỉ" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="orderDate"
                label="Ngày đặt hàng"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày đặt hàng" },
                ]}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="deliveryDate"
                label="Ngày giao hàng"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày giao hàng" },
                ]}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Service Details Section */}
        <Card title="Chi tiết dịch vụ" className="w-full">
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <Space vertical size="middle" className="w-full">
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    className="bg-gray-50"
                    extra={
                      fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        >
                          Xóa
                        </Button>
                      )
                    }
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          {...restField}
                          name={[name, "productName"]}
                          label="Tên sản phẩm"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng chọn sản phẩm",
                            },
                          ]}
                        >
                          <Select
                            showSearch
                            placeholder="Chọn sản phẩm"
                            options={mockProducts}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, "quantity"]}
                          label="Số lượng"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập số lượng",
                            },
                          ]}
                        >
                          <InputNumber
                            min={1}
                            className="w-full"
                            placeholder="Số lượng"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={12} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, "unitPrice"]}
                          label="Đơn giá (VNĐ)"
                          rules={[
                            {
                              required: true,
                              message: "Vui lòng nhập đơn giá",
                            },
                          ]}
                        >
                          <InputNumber
                            min={0}
                            className="w-full"
                            placeholder="Đơn giá"
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) =>
                              value?.replace(/\$\s?|(,*)/g, "") as any
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          {...restField}
                          name={[name, "notes"]}
                          label="Ghi chú"
                        >
                          <TextArea
                            rows={2}
                            placeholder="Ghi chú về sản phẩm"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item label="Upload hình ảnh / tài liệu">
                      <Dragger
                        multiple
                        beforeUpload={() => false}
                        className="bg-white"
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                          Click hoặc kéo thả file vào đây
                        </p>
                        <p className="ant-upload-hint">
                          Hỗ trợ định dạng: JPG, PNG, PDF, DOCX
                        </p>
                      </Dragger>
                    </Form.Item>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm sản phẩm
                </Button>
              </Space>
            )}
          </Form.List>
        </Card>

        {/* Footer Section */}
        <Card className="w-full">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="notes" label="Ghi chú đơn hàng">
                <TextArea rows={4} placeholder="Ghi chú chung về đơn hàng" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Space vertical size="middle" className="w-full">
                <Form.Item
                  name="discountAmount"
                  label="Giảm giá (VNĐ)"
                  className="mb-2"
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Số tiền giảm giá"
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as any}
                  />
                </Form.Item>

                <Form.Item
                  name="shippingFee"
                  label="Phí vận chuyển (VNĐ)"
                  className="mb-2"
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    placeholder="Phí vận chuyển"
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as any}
                  />
                </Form.Item>

                <div className="bg-blue-50 p-4 rounded">
                  <Space vertical size="small" className="w-full">
                    <div className="flex justify-between">
                      <Text>Tạm tính:</Text>
                      <Text strong className="text-base">
                        {calculateTotal().subtotal.toLocaleString("vi-VN")} đ
                      </Text>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <Text className="text-lg">Tổng cộng:</Text>
                      <Text strong className="text-xl text-blue-600">
                        {calculateTotal().total.toLocaleString("vi-VN")} đ
                      </Text>
                    </div>
                  </Space>
                </div>
              </Space>
            </Col>
          </Row>

          <div className="flex justify-end gap-2 mt-4">
            <Button size="large">Hủy</Button>
            <Button type="primary" htmlType="submit" size="large">
              Tạo đơn hàng
            </Button>
          </div>
        </Card>
      </Space>
    </Form>
  );
}
