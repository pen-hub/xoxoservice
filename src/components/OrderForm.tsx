"use client";

import { useUser } from "@/firebase/provider";
import { DiscountType } from "@/types/enum";
import {
  OrderStatus,
  type FirebaseOrderData,
  type FirebaseProductData,
  type FirebaseStaff,
  type FirebaseStageData,
  type FirebaseWorkflows,
  type FormValues,
  type OrderFormProps,
  type ProductCardProps,
  type ProductData,
  type Staff,
  type StageData,
  type Workflow,
} from "@/types/order";
import { getBase64 } from "@/utils/getBase64";
import {
  DeleteOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
} from "antd";
import dayjs from "dayjs";
import {
  ref as dbRef,
  getDatabase,
  off,
  onValue,
  push,
  update,
} from "firebase/database";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { Wrench } from "lucide-react";
import React, { useEffect, useState } from "react";

const { Title, Text } = Typography;
const { Option } = Select;

const statusOptions = [
  { value: "pending", label: "Chờ xử lý", color: "default" },
  { value: "in_progress", label: "Đang thực hiện", color: "processing" },
  { value: "completed", label: "Hoàn thành", color: "success" },
];

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onUpdate,
  onRemove,
  staffOptions,
  stageOptions,
  workflows,
}) => {
  const { message } = App.useApp();

  const addStage = () => {
    const newStageId = `STAGE_${new Date().getTime()}`;
    const firstWorkflowId = Object.keys(workflows)[0] || "";
    const firstWorkflowName = workflows[firstWorkflowId]?.name || "";
    const newStage: StageData = {
      id: newStageId,
      stageId: firstWorkflowId,
      stageName: firstWorkflowName,
      employees: [],
      status: "pending",
    };
    onUpdate({
      ...product,
      stages: [...product.stages, newStage],
    });
  };

  const updateStage = (
    stageIndex: number,
    field: string,
    value: string | string[]
  ) => {
    const updatedStages = [...product.stages];
    if (field === "stageId" && typeof value === "string") {
      updatedStages[stageIndex] = {
        ...updatedStages[stageIndex],
        stageId: value,
        stageName: workflows[value]?.name || "",
      };
    } else {
      updatedStages[stageIndex] = {
        ...updatedStages[stageIndex],
        [field]: value,
      };
    }
    onUpdate({ ...product, stages: updatedStages });
  };

  const removeStage = (stageIndex: number) => {
    const updatedStages = product.stages.filter(
      (_, index: number) => index !== stageIndex
    );
    onUpdate({ ...product, stages: updatedStages });
  };

  const updateProduct = (
    field: keyof ProductData,
    value: ProductData[keyof ProductData]
  ) => {
    onUpdate({ ...product, [field]: value });
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Wrench className="text-gold-500 w-4 h-4" />
          <Text strong>Mã sản phẩm: {product.id}</Text>
        </div>
      }
      extra={
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={onRemove}
          className="hover:bg-red-50"
        >
          Xóa
        </Button>
      }
      className="mb-4 shadow-sm border border-gray-200"
    >
      <div className="space-y-4">
        {/* Product Basic Info */}
        <Row gutter={16}>
          <Col span={12}>
            <div className="space-y-2 flex flex-col">
              <Text strong className="text-gray-700">
                Tên sản phẩm <Text type="danger">*</Text>
              </Text>
              <Input
                placeholder="VD: Túi Hermes Birkin 30cm"
                value={product.name}
                onChange={(e) => updateProduct("name", e.target.value)}
                className="w-full"
                status={!product.name.trim() ? "error" : ""}
              />
              {!product.name.trim() && (
                <Text type="danger" className="text-xs">
                  Vui lòng nhập tên sản phẩm
                </Text>
              )}
            </div>
          </Col>
          <Col span={6}>
            <div className="space-y-2 flex flex-col">
              <Text strong className="text-gray-700">
                Số lượng <Text type="danger">*</Text>
              </Text>
              <InputNumber
                min={1}
                placeholder="1"
                value={product.quantity}
                onChange={(value) => updateProduct("quantity", value || 1)}
                className="w-full"
                status={
                  !product.quantity || product.quantity < 1 ? "error" : ""
                }
              />
              {(!product.quantity || product.quantity < 1) && (
                <Text type="danger" className="text-xs">
                  Số lượng phải lớn hơn 0
                </Text>
              )}
            </div>
          </Col>
          <Col span={6}>
            <div className="space-y-2 flex flex-col">
              <Text strong className="text-gray-700">
                Giá (VNĐ) <Text type="danger">*</Text>
              </Text>
              <InputNumber
                min={0}
                placeholder="0"
                value={product.price}
                onChange={(value) => updateProduct("price", value || 0)}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => {
                  const parsed = Number(value?.replace(/,/g, "") || 0);
                  return parsed as any;
                }}
                className="w-full"
                status={!product.price || product.price < 0 ? "error" : ""}
              />
              {(!product.price || product.price < 0) && (
                <Text type="danger" className="text-xs">
                  Vui lòng nhập giá sản phẩm
                </Text>
              )}
            </div>
          </Col>
        </Row>

        {/* Product Images Upload */}
        <div className="space-y-2 flex flex-col">
          <Text strong className="text-gray-700">
            Ảnh sản phẩm (để đối chiếu) <Text type="danger">*</Text>
          </Text>
          <Upload
            listType="picture-card"
            fileList={product.images}
            beforeUpload={async (file, fileList) => {
              try {
                if (fileList && fileList.length > 1) {
                  const isLastFile =
                    fileList.indexOf(file) === fileList.length - 1;

                  if (isLastFile) {
                    const newFiles = [];

                    for (const currentFile of fileList) {
                      const base64 = await getBase64(currentFile);
                      newFiles.push({
                        uid: currentFile.uid,
                        name: currentFile.name,
                        status: "done" as const,
                        url: base64,
                        originFileObj: currentFile,
                      });
                    }

                    const updatedImages = [...product.images, ...newFiles];
                    updateProduct("images", updatedImages);
                    message.success(`Đã thêm ${fileList.length} ảnh`);
                  }
                } else {
                  const base64 = await getBase64(file);
                  const newFile = {
                    uid: file.uid,
                    name: file.name,
                    status: "done" as const,
                    url: base64,
                    originFileObj: file,
                  };

                  const updatedImages = [...product.images, newFile];
                  updateProduct("images", updatedImages);
                  message.success(`Đã thêm ảnh ${file.name}`);
                }
              } catch (error) {
                message.error(`Không thể tải ${file.name} lên!`);
                console.error("Upload error:", error);
              }
              return false;
            }}
            onRemove={(file) => {
              const updatedImages = product.images.filter(
                (item: any) => item.uid !== file.uid
              );
              updateProduct("images", updatedImages);
              return true;
            }}
            multiple
            accept="image/*"
            className={product.images.length === 0 ? "upload-error" : ""}
          >
            {product.images.length >= 8 ? null : (
              <div className="flex flex-col items-center justify-center p-2">
                <UploadOutlined className="text-xl mb-1" />
                <Text className="text-xs text-center">Tải ảnh</Text>
              </div>
            )}
          </Upload>
          {product.images.length === 0 && (
            <Text type="danger" className="text-xs">
              Vui lòng tải lên ít nhất 1 ảnh sản phẩm
            </Text>
          )}
        </div>

        <div className="flex items-center gap-2 my-4">
          <div className="h-px bg-gray-200 flex-1"></div>
          <Text strong className="text-primary px-3">
            Quy trình dịch vụ <Text type="danger">*</Text>
          </Text>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* Stages Table */}
        {product.stages.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 mb-4">
            <Table
              dataSource={product.stages.map(
                (stage: StageData, index: number) => ({
                  ...stage,
                  key: stage.id,
                  stt: index + 1,
                })
              )}
              pagination={false}
              size="small"
              className="stages-table"
              columns={[
                {
                  title: "Công đoạn",
                  dataIndex: "stt",
                  key: "stt",
                  width: 60,
                  align: "center",
                  render: (stt) => (
                    <div className="w-8 h-8 bg-primary mx-auto text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {stt}
                    </div>
                  ),
                },
                {
                  title: "Công việc",
                  dataIndex: "stageId",
                  key: "stageId",
                  width: "25%",
                  render: (value, record, index) => (
                    <Select
                      value={value}
                      onChange={(newValue) =>
                        updateStage(index, "stageId", newValue)
                      }
                      className="w-full"
                      size="small"
                    >
                      {stageOptions.map(
                        (option: { value: string; label: string }) => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        )
                      )}
                    </Select>
                  ),
                },
                {
                  title: "Nhân viên thực hiện",
                  dataIndex: "employees",
                  key: "employees",
                  width: "35%",
                  render: (value, record, index) => (
                    <Select
                      mode="multiple"
                      placeholder="Chọn nhân viên"
                      value={value}
                      onChange={(newValue) =>
                        updateStage(index, "employees", newValue)
                      }
                      className="w-full"
                      size="small"
                      maxTagCount={2}
                    >
                      {staffOptions.map(
                        (option: { value: string; label: string }) => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        )
                      )}
                    </Select>
                  ),
                },
                {
                  title: "Thao tác",
                  key: "action",
                  width: 80,
                  align: "center",
                  render: (_, record, index) => (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeStage(index)}
                      className="hover:bg-red-50"
                    />
                  ),
                },
              ]}
            />
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-red-300 rounded-lg bg-red-50 mb-4">
            <Text type="danger">
              Chưa có công đoạn nào. Nhấn "Thêm công đoạn" để bắt đầu.
            </Text>
          </div>
        )}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addStage}
          className="w-full border-blue-300 text-primary hover:border-blue-500 hover:text-primary"
        >
          Thêm công đoạn
        </Button>
      </div>
    </Card>
  );
};

const OrderForm: React.FC<OrderFormProps> = ({
  mode,
  orderId,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [staff, setStaff] = useState<FirebaseStaff>({});
  const [workflows, setWorkflows] = useState<FirebaseWorkflows>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useUser();
  const { message } = App.useApp();

  // Load staff and workflows from Firebase
  useEffect(() => {
    const database = getDatabase();
    const staffRef = dbRef(database, "xoxo/employees");
    const workflowsRef = dbRef(database, "xoxo/workflows");

    const loadData = async () => {
      try {
        onValue(staffRef, (snapshot) => {
          const staffData = snapshot.val() || {};
          setStaff(staffData);
        });

        onValue(workflowsRef, (snapshot) => {
          const workflowData = snapshot.val() || {};
          setWorkflows(workflowData);
        });

        // Load existing order data if in update mode
        if (mode === "update" && orderId) {
          const orderRef = dbRef(database, `xoxo/orders/${orderId}`);
          onValue(orderRef, (snapshot) => {
            const orderData = snapshot.val();
            if (orderData) {
              populateFormWithOrderData(orderData);
            }
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading Firebase data:", error);
        message.error("Không thể tải dữ liệu nhân viên và quy trình!");
        setLoading(false);
      }
    };

    loadData();

    return () => {
      off(staffRef);
      off(workflowsRef);
    };
  }, [message, mode, orderId]);

  // Populate form with existing order data
  const populateFormWithOrderData = (orderData: FirebaseOrderData) => {
    form.setFieldsValue({
      code: orderData.code,
      customerName: orderData.customerName,
      phone: orderData.phone,
      email: orderData.email,
      address: orderData.address,
      orderDate: dayjs(orderData.orderDate),
      deliveryDate: dayjs(orderData.deliveryDate),
      createdByName: orderData.createdByName,
      createdBy: orderData.createdBy,
      notes: orderData.notes || "",
      discount: orderData.discount || 0,
      discountType: orderData.discountType || DiscountType.Amount,
      shippingFee: orderData.shippingFee || 0,
      status: orderData.status || OrderStatus.PENDING,
    });

    // Convert products data back to form format
    const productsArray = Object.entries(orderData.products || {}).map(
      ([productId, productData]: [string, FirebaseProductData]) => ({
        id: productId,
        name: productData.name,
        quantity: productData.quantity,
        price: productData.price || 0,
        images:
          productData.images?.map((img: any, index: number) => ({
            uid: img.uid || `img-${index}`,
            name: img.name || `image-${index}`,
            status: "done" as const,
            url: img.url,
            firebaseUrl: img.url,
          })) || [],
        stages: Object.entries(productData.stages || {}).map(
          ([stageId, stageData]: [string, FirebaseStageData]) => ({
            id: stageId,
            stageId: stageData.workflowId,
            stageName: stageData.name,
            employees: stageData.employees || [],
            status: stageData.status || "pending",
          })
        ),
      })
    );

    setProducts(productsArray);
  };

  // Prepare options for selects
  const staffOptions = Object.entries(staff).map(([id, staffMember]) => ({
    value: id,
    label: `${(staffMember as Staff).name} (${(staffMember as Staff).role})`,
  }));

  const stageOptions = Object.entries(workflows).map(([id, workflow]) => ({
    value: id,
    label: (workflow as Workflow).name,
  }));

  const addProduct = () => {
    const newProductId = `PRODUCT_${new Date().getTime()}`;
    const newProduct: ProductData = {
      id: newProductId,
      name: "",
      quantity: 1,
      price: 0,
      images: [],
      stages: [],
    };
    products.unshift(newProduct);
    setProducts([...products]);
  };

  const updateProduct = (index: number, updatedProduct: ProductData) => {
    const updatedProducts = [...products];
    updatedProducts[index] = updatedProduct;
    setProducts(updatedProducts);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const generateOrderId = () => {
    return `ORD_${new Date().getTime()}`;
  };

  const uploadImageToFirebase = async (
    file: File,
    productId: string,
    imageIndex: number
  ): Promise<string> => {
    const storage = getStorage();
    const fileName = `orders/${new Date().getTime()}_${productId}_${imageIndex}_${
      file.name
    }`;
    const storageRef = ref(storage, fileName);

    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const onFinish = async (values: FormValues) => {
    console.log(values, "vvvvvvvvvvvvvv");
    if (products.length === 0) {
      message.warning("Vui lòng thêm ít nhất một sản phẩm!");
      return;
    }

    if (
      values.discountType === DiscountType.Percentage &&
      (values.discount || 0) > 100
    ) {
      message.warning("Giảm giá theo phần trăm không được vượt quá 100%!");
      return;
    }
    // Validate products
    for (const product of products) {
      if (!product.name.trim()) {
        message.warning("Vui lòng nhập tên cho tất cả sản phẩm!");
        return;
      }
      if (!product.quantity || product.quantity < 1) {
        message.warning("Vui lòng nhập số lượng hợp lệ cho tất cả sản phẩm!");
        return;
      }
      if (!product.price || product.price < 0) {
        message.warning("Vui lòng nhập giá hợp lệ cho tất cả sản phẩm!");
        return;
      }
      if (product.images.length === 0) {
        message.warning("Vui lòng tải lên ít nhất 1 ảnh cho mỗi sản phẩm!");
        return;
      }
      if (product.stages.length === 0) {
        message.warning("Mỗi sản phẩm phải có ít nhất một công đoạn!");
        return;
      }
      for (const stage of product.stages) {
        if (!stage.stageId) {
          message.warning("Vui lòng chọn công đoạn cho tất cả các bước!");
          return;
        }
        if (!stage.employees || stage.employees.length === 0) {
          message.warning(
            "Vui lòng chọn nhân viên thực hiện cho tất cả công đoạn!"
          );
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const hideLoading = message.loading("Đang tải ảnh lên Firebase...", 0);

      // Upload all images to Firebase
      const productsWithUploadedImages = await Promise.all(
        products.map(async (product) => {
          const uploadedImages = await Promise.all(
            product.images.map(async (image: any, index: number) => {
              if (image.originFileObj) {
                try {
                  const firebaseUrl = await uploadImageToFirebase(
                    image.originFileObj as File,
                    product.id,
                    index
                  );
                  return {
                    uid: image.uid,
                    name: image.name,
                    url: firebaseUrl,
                    firebaseUrl,
                  };
                } catch (error) {
                  console.error(`Error uploading image ${image.name}:`, error);
                  message.error(`Không thể tải ảnh ${image.name} lên Firebase`);
                  return {
                    uid: image.uid,
                    name: image.name,
                    url: image.url,
                    error: true,
                  };
                }
              }
              return image;
            })
          );

          return {
            ...product,
            images: uploadedImages,
          };
        })
      );

      hideLoading();

      const now = new Date().getTime();
      const orderData: FirebaseOrderData = {
        orderId: mode === "create" ? generateOrderId() : orderId!,
        code: values.code,
        status: values.status || OrderStatus.PENDING,
        customerName: values.customerName,
        phone: values.phone,
        email: values.email,
        address: values.address,

        orderDate: values.orderDate
          ? values.orderDate.valueOf()
          : new Date().getTime(),
        deliveryDate: values.deliveryDate
          ? values.deliveryDate.valueOf()
          : new Date().getTime(),
        createdBy: user?.uid || "unknown",
        createdByName:
          values.createdByName ||
          user?.displayName ||
          user?.email ||
          "Người dùng hiện tại",
        notes: values.notes || "",
        discount: values.discount || 0,
        discountType: values.discountType || DiscountType.Amount,
        shippingFee: values.shippingFee || 0,
        ...(mode === "create" && { createdAt: now }),
        updatedAt: now,
        products: productsWithUploadedImages.reduce((acc, product) => {
          acc[product.id] = {
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            images: product.images.map((img: any) => ({
              uid: img.uid,
              name: img.name,
              url: img.firebaseUrl || img.url || "",
            })),
            stages: product.stages.reduce((stageAcc: any, stage: StageData) => {
              stageAcc[stage.id] = {
                workflowId: stage.stageId,
                workflowName: workflows[stage.stageId]?.name || "",
                employees: stage.employees,
                status: stage.status,
                updatedAt: now,
              };
              return stageAcc;
            }, {} as Record<string, FirebaseStageData>),
          };
          return acc;
        }, {} as Record<string, FirebaseProductData>),
      };

      const database = getDatabase();

      if (mode === "create") {
        const ordersRef = dbRef(database, "xoxo/orders");
        const newOrderRef = await push(ordersRef, orderData);
        message.success("Đơn hàng đã được tạo thành công!");
        onSuccess?.(newOrderRef.key!);
      } else {
        const orderRef = dbRef(database, `xoxo/orders/${orderId}`);
        await update(orderRef, orderData);
        message.success("Đơn hàng đã được cập nhật thành công!");
        onSuccess?.(orderId!);
      }

      // Reset form for create mode
      if (mode === "create") {
        form.resetFields();
        setProducts([]);
      }
    } catch (error) {
      console.error("Error saving order:", error);
      message.error("Có lỗi xảy ra khi lưu đơn hàng!");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-fill current user when component mounts (create mode only)
  useEffect(() => {
    if (mode === "create" && user) {
      form.setFieldsValue({
        createdByName: user.displayName || user.email || "Người dùng hiện tại",
        createdBy: user.uid,
      });
    }
  }, [user, form, mode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <div className="gap-6 flex flex-col">
        {/* Order Basic Information */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <UserOutlined />
              <Text strong>
                {mode === "create" ? "Thông tin đơn hàng" : "Cập nhật đơn hàng"}
              </Text>
            </div>
          }
          className="bg-white shadow-sm"
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="Mã đơn hàng"
                name="code"
                rules={[
                  { required: true, message: "Vui lòng nhập mã đơn hàng!" },
                ]}
              >
                <Input placeholder="VD: XOX2024120001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Tên khách hàng"
                name="customerName"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên khách hàng!",
                  },
                ]}
              >
                <Input placeholder="VD: Nguyễn Thị Lan Anh" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
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
                <Input placeholder="VD: 0123456789" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input placeholder="VD: khachhang@email.com" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                label="Địa chỉ"
                name="address"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
              >
                <Input placeholder="VD: 123 Đường ABC, Quận XYZ, TP.HN" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="Ngày đặt"
                name="orderDate"
                initialValue={mode === "create" ? dayjs() : undefined}
                rules={[{ required: true, message: "Vui lòng chọn ngày đặt!" }]}
              >
                <DatePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày đặt"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Ngày giao dự kiến"
                name="deliveryDate"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày giao!" },
                ]}
              >
                <DatePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày giao"
                  disabledDate={(current) =>
                    current && current < dayjs().endOf("day")
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Nhân viên tạo đơn" name="createdByName">
                <Input
                  disabled
                  placeholder="Đang tải thông tin người dùng..."
                  prefix={<UserOutlined className="text-gray-400" />}
                  className="bg-gray-50"
                />
              </Form.Item>
              <Form.Item name="createdBy">
                <Input disabled hidden />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item label="Ghi chú đơn hàng" name="notes">
                <Input.TextArea
                  rows={3}
                  placeholder="Ghi chú chung về đơn hàng..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Products Section */}
        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TagOutlined />
                <Text strong>Danh sách sản phẩm</Text>
                <Tag color="yellow">{products.length} sản phẩm</Tag>
              </div>
              <Button
                type="primary"
                htmlType="button"
                icon={<PlusOutlined />}
                onClick={addProduct}
                className="bg-primary hover:bg-primary"
              >
                Thêm sản phẩm
              </Button>
            </div>
          }
          className="bg-white shadow-sm"
        >
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Empty
                description={`Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.`}
              />
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] flex flex-col gap-4 overflow-y-auto pr-2">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onUpdate={(updatedProduct: ProductData) =>
                    updateProduct(index, updatedProduct)
                  }
                  onRemove={() => removeProduct(index)}
                  staffOptions={staffOptions}
                  stageOptions={stageOptions}
                  workflows={workflows}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Order Summary */}
        {products.length > 0 && (
          <Card
            title={
              <div className="flex items-center gap-2">
                <ShoppingCartOutlined />
                <Text strong>Tổng kết đơn hàng</Text>
              </div>
            }
            className="bg-white shadow-sm"
          >
            <Row gutter={24}>
              <Col span={14}>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {products.map((product, index) => {
                    const subtotal = product.quantity * product.price;
                    return (
                      <div
                        key={product.id}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-1">
                          <Text>{product.name || `Sản phẩm ${index + 1}`}</Text>
                          <br />
                          <Text type="secondary" className="text-sm">
                            {product.quantity} x{" "}
                            {product.price?.toLocaleString("vi-VN")} VNĐ
                          </Text>
                        </div>
                        <div className="text-right">
                          <Text strong>
                            {subtotal.toLocaleString("vi-VN")} VNĐ
                          </Text>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Col>
              <Col span={10}>
                <div className="space-y-4 border-l border-gray-200 pl-4">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <Form.Item dependencies={["discountType"]}>
                        {({ getFieldValue }) => {
                          const discountType =
                            getFieldValue("discountType") ||
                            DiscountType.Amount;
                          const isPercentage =
                            discountType === DiscountType.Percentage;

                          // Rules validation luôn kiểm tra cả 2 trường hợp
                          const validationRules = [
                            {
                              validator: (_: any, value: any) => {
                                if (!value || value === 0)
                                  return Promise.resolve();

                                // Lấy giá trị discountType hiện tại từ form
                                const currentDiscountType =
                                  form.getFieldValue("discountType") ||
                                  DiscountType.Amount;
                                const currentIsPercentage =
                                  currentDiscountType ===
                                  DiscountType.Percentage;

                                if (currentIsPercentage) {
                                  if (value <= 0 || value >= 100) {
                                    return Promise.reject(
                                      new Error("Chỉ từ 0.1% đến 99.9%")
                                    );
                                  }
                                } else {
                                  if (value < 0) {
                                    return Promise.reject(
                                      new Error("Giá trị phải lớn hơn 0")
                                    );
                                  }
                                }
                                return Promise.resolve();
                              },
                            },
                          ];

                          return (
                            <div>
                              <div className="mb-2">
                                <Text>Chiết khấu</Text>
                              </div>
                              <Space.Compact>
                                <Form.Item
                                  name="discount"
                                  initialValue={0}
                                  rules={validationRules}
                                  style={{
                                    flex: 1,
                                    marginRight: 0,
                                    marginBottom: 0,
                                  }}
                                >
                                  <InputNumber
                                    min={0}
                                    max={isPercentage ? 99.9 : undefined}
                                    placeholder="0"
                                    step={isPercentage ? 0.1 : 1000}
                                    formatter={(value) => {
                                      if (isPercentage) {
                                        return `${value}`;
                                      }
                                      return `${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ","
                                      );
                                    }}
                                    parser={(value) => {
                                      if (isPercentage) {
                                        return Number(value || 0) as any;
                                      }
                                      const parsed = Number(
                                        value?.replace(/,/g, "") || 0
                                      );
                                      return parsed as any;
                                    }}
                                    className="w-full"
                                  />
                                </Form.Item>
                                <Form.Item
                                  name="discountType"
                                  initialValue={DiscountType.Amount}
                                  style={{ marginRight: 0, marginBottom: 0 }}
                                >
                                  <Select
                                    style={{ width: 80 }}
                                    onChange={() => {
                                      // Trigger validation khi thay đổi loại chiết khấu
                                      setTimeout(() => {
                                        form.validateFields(["discount"]);
                                      }, 0);
                                    }}
                                  >
                                    <Option value={DiscountType.Amount}>
                                      VNĐ
                                    </Option>
                                    <Option value={DiscountType.Percentage}>
                                      %
                                    </Option>
                                  </Select>
                                </Form.Item>
                              </Space.Compact>
                            </div>
                          );
                        }}
                      </Form.Item>
                    </div>

                    <div className="flex-1">
                      <Form.Item
                        label="Phí vận chuyển (VNĐ)"
                        name="shippingFee"
                        initialValue={0}
                      >
                        <InputNumber
                          min={0}
                          placeholder="0"
                          formatter={(value) =>
                            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(value) => {
                            const parsed = Number(
                              value?.replace(/,/g, "") || 0
                            );
                            return parsed as any;
                          }}
                          className="w-full"
                        />
                      </Form.Item>
                    </div>
                  </div>

                  <Form.Item
                    dependencies={["discount", "discountType", "shippingFee"]}
                  >
                    {({ getFieldValue }) => {
                      const discount = getFieldValue("discount") || 0;
                      const discountType =
                        getFieldValue("discountType") || DiscountType.Amount;
                      const shippingFee = getFieldValue("shippingFee") || 0;
                      const subtotal = products.reduce(
                        (sum, product) =>
                          sum + product.quantity * product.price,
                        0
                      );
                      const discountAmount =
                        discountType === DiscountType.Percentage
                          ? (subtotal * discount) / 100
                          : discount;
                      const total = subtotal - discountAmount + shippingFee;

                      return (
                        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between">
                            <Text>Tạm tính:</Text>
                            <Text>
                              {subtotal
                                ? subtotal.toLocaleString("vi-VN")
                                : "0"}{" "}
                              VNĐ
                            </Text>
                          </div>
                          <div className="flex justify-between">
                            <Text>Chiết khấu:</Text>
                            <Text>
                              -{discountAmount.toLocaleString("vi-VN")} VNĐ
                              {discountType === DiscountType.Percentage &&
                                discount > 0 &&
                                ` (${discount}%)`}
                            </Text>
                          </div>
                          <div className="flex justify-between">
                            <Text>Phí vận chuyển:</Text>
                            <Text>
                              +{shippingFee.toLocaleString("vi-VN")} VNĐ
                            </Text>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-300">
                            <Text strong className="text-lg">
                              Tổng cộng:
                            </Text>
                            <Text strong className="text-lg text-primary">
                              {total.toLocaleString("vi-VN")} VNĐ
                            </Text>
                          </div>
                        </div>
                      );
                    }}
                  </Form.Item>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4 py-4 mt-4 border-t bg-white border-gray-200">
          <Button size="large" onClick={onCancel}>
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={submitting}
            className="bg-primary hover:bg-primary min-w-32"
          >
            {mode === "create" ? "Tạo đơn hàng" : "Cập nhật đơn hàng"}
          </Button>
        </div>
      </div>
    </Form>
  );
};

export default OrderForm;
