"use client";

import { useRealtimeDoc, useRealtimeList } from "@/firebase/hooks/useRealtime";
import { useUser } from "@/firebase/provider";
import { WarrantyClaimService } from "@/services/warrantyClaimService";
import {
    CustomerSource,
    CustomerSourceOptions,
    DiscountType,
    ROLES,
} from "@/types/enum";
import {
    type FirebaseDepartments,
    type FirebaseOrderData,
    type FirebaseProductData,
    type FirebaseStaff,
    type FirebaseWorkflowData,
    type FirebaseWorkflows,
    OrderStatus,
    type ProductData,
    type WorkflowData,
} from "@/types/order";
import { WarrantyClaim, WarrantyClaimStatus } from "@/types/warrantyClaim";
import { genCode } from "@/utils/genCode";
import { getBase64 } from "@/utils/getBase64";
import { groupMembersByRole } from "@/utils/membersMapRole";
import {
    DeleteOutlined,
    LoadingOutlined,
    PlusOutlined,
    SaveOutlined,
    ShoppingCartOutlined,
    TagOutlined,
    UploadOutlined,
    UserOutlined,
} from "@ant-design/icons";
import {
    App,
    Button,
    Card,
    Checkbox,
    Col,
    DatePicker,
    Empty,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Table,
    Tag,
    Typography,
    Upload,
} from "antd";
import dayjs from "dayjs";
import { ref as dbRef, getDatabase, off, onValue } from "firebase/database";
import {
    getDownloadURL,
    getStorage,
    ref as storageRef,
    uploadBytes,
} from "firebase/storage";
import { Wrench } from "lucide-react";
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from "react";

const { Title, Text } = Typography;
const { Option } = Select;

// Reuse ProductCard from OrderForm logic
const ProductCard: React.FC<{
    product: ProductData;
    onUpdate: (product: ProductData) => void;
    onRemove: () => void;
    staffOptions: Array<{ value: string; label: string }>;
    workflowOptions: Array<{ value: string; label: string }>;
    workflows: FirebaseWorkflows;
    staff: FirebaseStaff;
    departments: FirebaseDepartments;
    status: WarrantyClaimStatus;
}> = ({
    product,
    onUpdate,
    onRemove,
    staffOptions,
    workflowOptions,
    workflows,
    staff,
    departments,
    status,
}) => {
    const { message } = App.useApp();

    const addWorkflow = () => {
        const newWorkflowCode = genCode("WF_");
        const newWorkflow: WorkflowData = {
            id: newWorkflowCode,
            members: [],
            isDone: false,
            workflowCode: [],
            workflowName: [],
        } as any;
        onUpdate({
            ...product,
            workflows: [...product.workflows, newWorkflow],
        });
    };

    const updateWorkflow = (
        workflowIndex: number,
        field: string,
        value: string | string[] | boolean,
    ) => {
        const updatedWorkflows = [...product.workflows];
        const currentWorkflow = updatedWorkflows[workflowIndex];

        if (field === "departmentCode") {
            updatedWorkflows[workflowIndex] = {
                ...(currentWorkflow as any),
                departmentCode: value as string,
                workflowCode: [],
                workflowName: [],
                members: [],
            };
        } else if (field === "workflowCode" && Array.isArray(value)) {
            const selectedWorkflowCodes = value;
            const selectedWorkflowNames = selectedWorkflowCodes
                .map((code) => workflows[code]?.name)
                .filter(Boolean) as string[];

            updatedWorkflows[workflowIndex] = {
                ...updatedWorkflows[workflowIndex],
                workflowCode: selectedWorkflowCodes,
                workflowName: selectedWorkflowNames,
                members: [],
            };
        } else {
            updatedWorkflows[workflowIndex] = {
                ...updatedWorkflows[workflowIndex],
                [field]: value,
            };
        }
        onUpdate({ ...product, workflows: updatedWorkflows });
    };

    const removeWorkflow = (workflowIndex: number) => {
        const updatedWorkflows = product.workflows.filter(
            (_, index: number) => index !== workflowIndex,
        );
        onUpdate({ ...product, workflows: updatedWorkflows });
    };

    const updateProduct = (
        field: keyof ProductData,
        value: ProductData[keyof ProductData],
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
                <Row gutter={16}>
                    <Col xs={24} sm={12} lg={10}>
                        <div className="space-y-2 flex flex-col">
                            <Text strong className="text-gray-700">
                                Tên sản phẩm <Text type="danger">*</Text>
                            </Text>
                            <Input
                                placeholder="VD: Túi Hermes Birkin 30cm"
                                value={product.name}
                                onChange={(e) =>
                                    updateProduct("name", e.target.value)
                                }
                                className="w-full"
                                status={!product.name.trim() ? "error" : ""}
                            />
                        </div>
                    </Col>
                    <Col xs={12} sm={6} lg={4}>
                        <div className="space-y-2 flex flex-col">
                            <Text strong className="text-gray-700">
                                Số lượng <Text type="danger">*</Text>
                            </Text>
                            <InputNumber
                                min={1}
                                placeholder="1"
                                value={product.quantity}
                                onChange={(value) =>
                                    updateProduct("quantity", value || 1)
                                }
                                className="w-full"
                            />
                        </div>
                    </Col>
                </Row>

                {/* Product Images Upload - NEW IMAGES ONLY */}
                <div className="space-y-2 flex flex-col">
                    <Text strong className="text-gray-700">
                        Ảnh sản phẩm (ảnh mới khi nhận bảo hành)
                    </Text>
                    <Upload
                        listType="picture-card"
                        fileList={product.images}
                        beforeUpload={async (file, fileList) => {
                            try {
                                if (fileList && fileList.length > 1) {
                                    const isLastFile =
                                        fileList.indexOf(file) ===
                                        fileList.length - 1;

                                    if (isLastFile) {
                                        const newFiles = [];

                                        for (const currentFile of fileList) {
                                            const base64 =
                                                await getBase64(currentFile);
                                            newFiles.push({
                                                uid: currentFile.uid,
                                                name: currentFile.name,
                                                status: "done" as const,
                                                url: base64,
                                                originFileObj: currentFile,
                                            });
                                        }

                                        const updatedImages = [
                                            ...product.images,
                                            ...newFiles,
                                        ];
                                        updateProduct("images", updatedImages);
                                        message.success(
                                            `Đã thêm ${fileList.length} ảnh`,
                                        );
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

                                    const updatedImages = [
                                        ...product.images,
                                        newFile,
                                    ];
                                    updateProduct("images", updatedImages);
                                    message.success(`Đã thêm ảnh ${file.name}`);
                                }
                            } catch (error) {
                                message.error(
                                    `Không thể tải ${file.name} lên!`,
                                );
                                console.error("Upload error:", error);
                            }
                            return false;
                        }}
                        onRemove={(file) => {
                            const updatedImages = product.images.filter(
                                (item: any) => item.uid !== file.uid,
                            );
                            updateProduct("images", updatedImages);
                            return true;
                        }}
                        multiple
                        accept="image/*"
                    >
                        {product.images.length >= 8 ? null : (
                            <div className="flex flex-col items-center justify-center p-2">
                                <UploadOutlined className="text-xl mb-1" />
                                <Text className="text-xs text-center">
                                    Tải ảnh
                                </Text>
                            </div>
                        )}
                    </Upload>
                </div>

                {/* Workflows Table */}
                {product.workflows.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200 mb-4">
                        <Table
                            dataSource={product.workflows.map(
                                (workflow: WorkflowData, index: number) => ({
                                    ...workflow,
                                    key: workflow.id,
                                    stt: index + 1,
                                }),
                            )}
                            pagination={false}
                            size="small"
                            columns={[
                                {
                                    title: "#",
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
                                    title: "Phòng ban",
                                    dataIndex: "departmentCode",
                                    key: "departmentCode",
                                    width: "25%",
                                    render: (value, record, index) => {
                                        const selectedDepartmentCodes =
                                            product.workflows
                                                .map((w: any, i) =>
                                                    i === index
                                                        ? null
                                                        : w.departmentCode,
                                                )
                                                .filter(Boolean);

                                        const departmentOptions = Object.keys(
                                            departments,
                                        )
                                            .filter(
                                                (code) =>
                                                    !selectedDepartmentCodes.includes(
                                                        code,
                                                    ),
                                            )
                                            .map((code) => ({
                                                value: code,
                                                label: departments[code].name,
                                            }));

                                        return (
                                            <Select
                                                value={value}
                                                placeholder="Chọn phòng ban"
                                                onChange={(newValue) =>
                                                    updateWorkflow(
                                                        index,
                                                        "departmentCode",
                                                        newValue,
                                                    )
                                                }
                                                className="w-full"
                                                size="small"
                                                showSearch
                                                optionFilterProp="children"
                                            >
                                                {departmentOptions.map(
                                                    (opt) => (
                                                        <Option
                                                            key={opt.value}
                                                            value={opt.value}
                                                        >
                                                            {opt.label}
                                                        </Option>
                                                    ),
                                                )}
                                            </Select>
                                        );
                                    },
                                },
                                {
                                    title: "Công đoạn",
                                    dataIndex: "workflowCode",
                                    key: "workflowCode",
                                    width: "40%",
                                    render: (value, record, index) => (
                                        <Select
                                            mode="multiple"
                                            value={value || []}
                                            placeholder="Chọn công đoạn"
                                            onChange={(newValue) =>
                                                updateWorkflow(
                                                    index,
                                                    "workflowCode",
                                                    newValue,
                                                )
                                            }
                                            className="w-full"
                                            size="small"
                                            showSearch
                                            optionFilterProp="children"
                                        >
                                            {workflowOptions.map((opt) => (
                                                <Option
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    ),
                                },
                                {
                                    title: "Nhân viên",
                                    dataIndex: "members",
                                    key: "members",
                                    width: "35%",
                                    render: (value, record, index) => (
                                        <Select
                                            mode="multiple"
                                            value={value || []}
                                            placeholder="Chọn nhân viên"
                                            onChange={(newValue) =>
                                                updateWorkflow(
                                                    index,
                                                    "members",
                                                    newValue,
                                                )
                                            }
                                            className="w-full"
                                            size="small"
                                            showSearch
                                            optionFilterProp="children"
                                        >
                                            {staffOptions.map((opt) => (
                                                <Option
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    ),
                                },
                                {
                                    title: "Trạng thái",
                                    dataIndex: "isDone",
                                    key: "isDone",
                                    width: "35%",
                                    hidden: true,
                                    render: (value, record, index) => (
                                        <Checkbox
                                            checked={value}
                                            onChange={(e) =>
                                                updateWorkflow(
                                                    index,
                                                    "isDone",
                                                    e.target.checked,
                                                )
                                            }
                                        />
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
                                            onClick={() =>
                                                removeWorkflow(index)
                                            }
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
                            Chưa có công đoạn nào. Nhấn "Thêm công đoạn" để bắt
                            đầu.
                        </Text>
                    </div>
                )}

                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={addWorkflow}
                    className="w-full border-blue-300 text-primary hover:border-blue-500 hover:text-primary"
                >
                    Thêm công đoạn
                </Button>
            </div>
        </Card>
    );
};

interface ChildHandle {
    onResetForm: () => void;
}

interface WarrantyClaimFormProps {
    mode?: "create" | "update";
    claimCode?: string;
    onSuccess?: (claimCode: string) => void;
    onCancel?: () => void;
}

const WarrantyClaimForm = forwardRef<ChildHandle, WarrantyClaimFormProps>(
    ({ mode = "create", claimCode, onSuccess, onCancel }, ref) => {
        const [form] = Form.useForm();
        const [products, setProducts] = useState<ProductData[]>([]);
        const [staff, setStaff] = useState<FirebaseStaff>({});
        const [workflows, setWorkflows] = useState<FirebaseWorkflows>({});
        const [departments, setDepartments] = useState<FirebaseDepartments>({});
        const [loading, setLoading] = useState(true);
        const [submitting, setSubmitting] = useState(false);
        const [selectedOrderCode, setSelectedOrderCode] = useState<string>("");
        const { user } = useUser();
        const { message } = App.useApp();

        const { data: ordersDataList } =
            useRealtimeList<FirebaseOrderData>("xoxo/orders");

        // Load warranty claim data if in update mode
        const { data: existingClaim, isLoading: claimLoading } =
            useRealtimeDoc<WarrantyClaim>(
                mode === "update" && claimCode
                    ? `xoxo/warranty_claims/${claimCode}`
                    : null,
            );

        // Only show completed orders for warranty claims
        const ordersData = useMemo(() => {
            return (ordersDataList || []).filter(
                (order) => order.status === OrderStatus.COMPLETED,
            );
        }, [ordersDataList]);

        const memberOptions = groupMembersByRole(staff);

        const workflowOptions = Object.entries(workflows).map(
            ([id, workflow]) => ({
                value: id,
                label: (workflow as any).name,
            }),
        );

        const handleResetForm = () => {
            form.resetFields();
            setProducts([]);
            setSelectedOrderCode("");
            if (user) {
                form.setFieldsValue({
                    createdBy: user.uid,
                    createdByName:
                        user.displayName || user.email || "Người dùng hiện tại",
                    code: genCode("WC_"),
                    orderDate: dayjs(),
                });
            }
        };

        useImperativeHandle(
            ref,
            () => ({
                onResetForm: handleResetForm,
            }),
            [],
        );

        const handleOrderSelect = (orderCode: string) => {
            if (!orderCode || !ordersData) return;

            const order = ordersData.find((o) => o.code === orderCode);
            if (!order) return;

            setSelectedOrderCode(orderCode);

            // Fill customer info
            form.setFieldsValue({
                customerName: order.customerName,
                phone: order.phone,
                email: order.email,
                address: order.address,
                customerSource: order.customerSource,
                customerCode: order.customerCode,
                consultantId: order.consultantId,
                orderDate: dayjs(order.orderDate),
                // Không fill deliveryDate từ đơn hàng cũ
                discount: 0,
                discountType: DiscountType.Amount,
                shippingFee: 0,
                notes: order.notes || "",
            });

            // Fill products (but NOT images - user must upload new images)
            const productsArray = Object.entries(order.products || {}).map(
                ([productId, productData]: [string, FirebaseProductData]) => ({
                    id: productId,
                    name: productData.name,
                    quantity: productData.quantity,
                    price: 0, // Warranty claims don't have price
                    commissionPercentage: 0, // Warranty claims don't have commission
                    images: [], // NEW IMAGES - don't fill from order
                    workflows: Object.entries(productData.workflows || {}).map(
                        ([workflowId, workflowData]: [
                            string,
                            FirebaseWorkflowData,
                        ]) => {
                            // Ensure departmentCode is properly filled from order
                            const workflow: WorkflowData = {
                                id: workflowId,
                                departmentCode:
                                    workflowData.departmentCode || undefined,
                                workflowCode: workflowData.workflowCode || [],
                                workflowName: workflowData.workflowName || [],
                                members: workflowData.members || [],
                                isDone: false, // Reset workflow status
                            };
                            return workflow;
                        },
                    ),
                }),
            );

            setProducts(productsArray);
        };

        const addProduct = () => {
            const newProductId = genCode("PRO_");
            const newProduct: ProductData = {
                id: newProductId,
                name: "",
                quantity: 1,
                price: 0, // Warranty claims don't have price
                images: [],
                workflows: [],
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

        const uploadImageToFirebase = async (
            file: File,
            productId: string,
            imageIndex: number,
        ): Promise<string> => {
            const storage = getStorage();
            const fileName = `warranty_claims/${new Date().getTime()}_${productId}_${imageIndex}_${
                file.name
            }`;
            const storageReference = storageRef(storage, fileName);

            const snapshot = await uploadBytes(storageReference, file);
            return await getDownloadURL(snapshot.ref);
        };

        const onFinish = async (values: any) => {
            if (products.length === 0) {
                message.warning("Vui lòng thêm ít nhất một sản phẩm!");
                return;
            }

            if (mode === "create" && !selectedOrderCode) {
                message.warning("Vui lòng chọn đơn hàng gốc!");
                return;
            }

            // Validate products
            for (const product of products) {
                if (!product.name.trim()) {
                    message.warning(
                        `Vui lòng nhập tên cho sản phẩm ${product.id}!`,
                    );
                    return;
                }
                if (!product.quantity || product.quantity < 1) {
                    message.warning(
                        `Vui lòng nhập số lượng hợp lệ cho sản phẩm ${product.id}!`,
                    );
                    return;
                }
                // Không validate giá, hoa hồng, chiết khấu cho phiếu bảo hành
                // Không validate ảnh khi tạo phiếu (status PENDING)
                // Ảnh sẽ được validate ở các trạng thái sau
                if (product.workflows.length === 0) {
                    message.warning(
                        `Sản phẩm ${product.id} phải có ít nhất một công đoạn!`,
                    );
                    return;
                }
                for (const workflow of product.workflows) {
                    if (
                        !workflow.workflowCode ||
                        workflow.workflowCode.length === 0
                    ) {
                        message.warning(
                            `Vui lòng chọn công đoạn cho tất cả các bước trong sản phẩm ${product.id}!`,
                        );
                        return;
                    }
                    if (!workflow.members || workflow.members.length === 0) {
                        message.warning(
                            `Vui lòng chọn nhân viên thực hiện cho tất cả công đoạn trong sản phẩm ${product.id}!`,
                        );
                        return;
                    }
                }
            }

            setSubmitting(true);

            try {
                const hideLoading = message.loading(
                    "Đang tải ảnh lên Firebase...",
                    0,
                );

                // Upload all images to Firebase
                const productsWithUploadedImages = await Promise.all(
                    products.map(async (product) => {
                        const uploadedImages = await Promise.all(
                            product.images.map(
                                async (image: any, index: number) => {
                                    if (image.originFileObj) {
                                        try {
                                            const firebaseUrl =
                                                await uploadImageToFirebase(
                                                    image.originFileObj as File,
                                                    `${product.id}_before`,
                                                    index,
                                                );
                                            return { ...image, firebaseUrl };
                                        } catch (error) {
                                            console.error(
                                                `Error uploading image ${image.name}:`,
                                                error,
                                            );
                                            message.error(
                                                `Không thể tải ảnh ${image.name} lên Firebase`,
                                            );
                                            return { ...image, error: true };
                                        }
                                    }
                                    return image;
                                },
                            ),
                        );

                        return {
                            ...product,
                            images: uploadedImages.filter((img) => !img.error),
                        };
                    }),
                );

                hideLoading();

                const now = new Date().getTime();

                // Warranty claims don't have price/discount/shipping fee
                const totals = {
                    subtotal: 0,
                    discountAmount: 0,
                    total: 0,
                };

                const originalOrderCode =
                    mode === "update"
                        ? existingClaim?.originalOrderCode ||
                          values.originalOrderCode
                        : selectedOrderCode;
                const originalOrder = ordersData?.find(
                    (o) => o.code === originalOrderCode,
                );

                const claimData: Omit<
                    WarrantyClaim,
                    "id" | "createdAt" | "updatedAt"
                > = {
                    code:
                        mode === "update" && existingClaim
                            ? existingClaim.code
                            : values.code || genCode("WC_"),
                    originalOrderId: originalOrder?.code || originalOrderCode,
                    originalOrderCode: originalOrderCode,
                    customerName: values.customerName,
                    phone: values.phone,
                    email: values.email,
                    address: values.address,
                    customerSource:
                        values.customerSource || CustomerSource.Other,
                    customerCode: values.customerCode,
                    orderDate: values.orderDate
                        ? values.orderDate.valueOf()
                        : new Date().getTime(),
                    deliveryDate: values.deliveryDate
                        ? values.deliveryDate.valueOf()
                        : new Date().getTime(),
                    createdBy:
                        mode === "update" && existingClaim
                            ? existingClaim.createdBy
                            : user?.uid || "unknown",
                    createdByName:
                        mode === "update" && existingClaim
                            ? existingClaim.createdByName
                            : values.createdByName ||
                              user?.displayName ||
                              user?.email ||
                              "Người dùng hiện tại",
                    ...(values.consultantId && {
                        consultantId: values.consultantId,
                        consultantName: staff[values.consultantId]?.name || "",
                    }),
                    notes: values.notes || "",
                    discount: 0,
                    discountType: DiscountType.Amount,
                    shippingFee: 0,
                    status:
                        mode === "update" && existingClaim
                            ? existingClaim.status
                            : WarrantyClaimStatus.PENDING,
                    totalAmount: 0,
                    discountAmount: 0,
                    subtotal: 0,
                    products: productsWithUploadedImages.reduce(
                        (acc, product) => {
                            acc[product.id] = {
                                name: product.name,
                                quantity: product.quantity,
                                price: 0, // Warranty claims don't have price
                                images: product.images.map((img: any) => ({
                                    uid: img.uid,
                                    name: img.name,
                                    url: img.firebaseUrl || img.url || "",
                                })),
                                workflows: product.workflows.reduce(
                                    (
                                        workflowAcc: any,
                                        workflow: WorkflowData,
                                    ) => {
                                        const workflowNames =
                                            workflow.workflowCode
                                                .map(
                                                    (code) =>
                                                        workflows[code]?.name,
                                                )
                                                .filter(Boolean) as string[];

                                        workflowAcc[workflow.id] = {
                                            departmentCode: (workflow as any)
                                                .departmentCode,
                                            workflowCode: workflow.workflowCode,
                                            workflowName: workflowNames,
                                            members: workflow.members,
                                            isDone: workflow.isDone,
                                            updatedAt: now,
                                        };
                                        return workflowAcc;
                                    },
                                    {} as Record<string, FirebaseWorkflowData>,
                                ),
                            };
                            return acc;
                        },
                        {} as Record<string, FirebaseProductData>,
                    ),
                };

                if (mode === "create") {
                    const createdClaim =
                        await WarrantyClaimService.create(claimData);
                    message.success(
                        "Phiếu nhập bảo hành đã được tạo thành công!",
                    );
                    onSuccess?.(createdClaim.code);

                    // Reset form
                    handleResetForm();
                } else if (mode === "update" && claimCode) {
                    // Preserve status when updating
                    const existingClaim =
                        await WarrantyClaimService.getById(claimCode);
                    if (existingClaim) {
                        await WarrantyClaimService.update(claimCode, {
                            ...claimData,
                            status: existingClaim.status, // Preserve status
                        });
                        message.success(
                            "Phiếu nhập bảo hành đã được cập nhật thành công!",
                        );
                        onSuccess?.(claimCode);
                    }
                }
            } catch (error) {
                console.error("Error saving warranty claim:", error);
                message.error("Có lỗi xảy ra khi lưu phiếu nhập bảo hành!");
            } finally {
                setSubmitting(false);
            }
        };

        // Populate form with existing warranty claim data
        const populateFormWithClaimData = (claimData: WarrantyClaim) => {
            setSelectedOrderCode(claimData.originalOrderCode);

            form.setFieldsValue({
                code: claimData.code,
                originalOrderCode: claimData.originalOrderCode,
                customerName: claimData.customerName,
                phone: claimData.phone,
                email: claimData.email,
                address: claimData.address,
                customerSource: claimData.customerSource,
                customerCode: claimData.customerCode,
                consultantId: claimData.consultantId,
                orderDate: dayjs(claimData.orderDate),
                deliveryDate: claimData.deliveryDate
                    ? dayjs(claimData.deliveryDate)
                    : undefined,
                notes: claimData.notes || "",
                discount: claimData.discount || 0,
                discountType: claimData.discountType || DiscountType.Amount,
                shippingFee: claimData.shippingFee || 0,
            });

            // Convert products data back to form format
            const productsArray = Object.entries(claimData.products || {}).map(
                ([productId, productData]: [string, any]) => ({
                    id: productId,
                    name: productData.name,
                    quantity: productData.quantity,
                    price: productData.price || 0,
                    commissionPercentage: productData.commissionPercentage || 0,
                    images: (productData.images || []).map(
                        (img: any, index: number) => ({
                            uid: img.uid || `img-${index}`,
                            name: img.name || `image-${index}`,
                            url: img.url,
                            firebaseUrl: img.url,
                        }),
                    ),
                    workflows: Object.entries(productData.workflows || {}).map(
                        (entry) => {
                            const [workflowId, workflowData] = entry;
                            const wf = workflowData as FirebaseWorkflowData;
                            const workflow: WorkflowData = {
                                id: workflowId,
                                departmentCode: wf.departmentCode || undefined,
                                workflowCode: wf.workflowCode || [],
                                workflowName: wf.workflowName || [],
                                members: wf.members || [],
                                isDone: wf.isDone || false,
                            };
                            return workflow;
                        },
                    ),
                }),
            );

            setProducts(productsArray);
        };

        // Auto-fill current user when component mounts (create mode)
        // Or populate with existing data (update mode)
        useEffect(() => {
            if (mode === "create" && user) {
                form.setFieldsValue({
                    createdBy: user.uid,
                    createdByName:
                        user.displayName || user.email || "Người dùng hiện tại",
                    code: genCode("WC_"),
                    orderDate: dayjs(),
                });
            } else if (mode === "update" && existingClaim) {
                populateFormWithClaimData(existingClaim);
            }
        }, [user, form, mode, existingClaim]);

        // Load staff and workflows from Firebase
        useEffect(() => {
            const database = getDatabase();
            const staffRef = dbRef(database, "xoxo/members");
            const workflowsRef = dbRef(database, "xoxo/workflows");
            const departmentsRef = dbRef(database, "xoxo/departments");

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

                    onValue(departmentsRef, (snapshot) => {
                        const departmentsData = snapshot.val() || {};
                        setDepartments(departmentsData);
                    });

                    setLoading(false);
                } catch (error) {
                    console.error("Error loading Firebase data:", error);
                    message.error(
                        "Không thể tải dữ liệu nhân viên và quy trình!",
                    );
                    setLoading(false);
                }
            };

            loadData();

            return () => {
                off(staffRef);
                off(workflowsRef);
                off(departmentsRef);
            };
        }, [mode]);

        // Warranty claims don't have any monetary values
        const totalAmount = React.useMemo(() => {
            return 0;
        }, []);

        React.useEffect(() => {
            form.setFieldsValue({ totalAmount });
        }, [totalAmount, form]);

        if (loading || (mode === "update" && claimLoading)) {
            return (
                <div className="flex justify-center items-center py-20">
                    <LoadingOutlined style={{ fontSize: 48 }} spin />
                </div>
            );
        }

        return (
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <div className="gap-6 flex flex-col">
                    {/* Order Selection Section - Only show in create mode */}
                    {mode === "create" && (
                        <Card
                            title={
                                <div className="flex items-center gap-2">
                                    <ShoppingCartOutlined />
                                    <Text strong>Chọn đơn hàng gốc</Text>
                                </div>
                            }
                            className="bg-background shadow-sm"
                        >
                            <Form.Item
                                label="Đơn hàng gốc"
                                name="originalOrderCode"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng chọn đơn hàng gốc!",
                                    },
                                ]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Tìm và chọn đơn hàng theo mã hoặc tên khách hàng"
                                    value={selectedOrderCode}
                                    onChange={handleOrderSelect}
                                    filterOption={(input, option) => {
                                        const order = ordersData?.find(
                                            (o) => o.code === option?.value,
                                        );
                                        if (!order) return false;
                                        const searchableText =
                                            `${order.code} ${order.customerName}`.toLowerCase();
                                        return searchableText.includes(
                                            input.toLowerCase(),
                                        );
                                    }}
                                >
                                    {ordersData?.map((order) => (
                                        <Option
                                            key={order.code}
                                            value={order.code}
                                        >
                                            {order.code} - {order.customerName}{" "}
                                            - {order.phone}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Card>
                    )}

                    {/* Claim Basic Information - Show when order is selected (create) or always (update) */}
                    {(selectedOrderCode || mode === "update") && (
                        <Card
                            title={
                                <div className="flex items-center gap-2">
                                    <UserOutlined />
                                    <Text strong>
                                        Thông tin phiếu nhập bảo hành
                                    </Text>
                                </div>
                            }
                            className="bg-background shadow-sm"
                        >
                            <Row gutter={16}>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Mã phiếu (tự động)"
                                        name="code"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    "Vui lòng nhập mã phiếu!",
                                            },
                                        ]}
                                    >
                                        <Input
                                            disabled
                                            placeholder="VD: WC_AD2342"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        label="Tên khách hàng"
                                        name="customerName"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    "Vui lòng nhập tên khách hàng!",
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder="VD: Nguyễn Thị Lan Anh"
                                            disabled
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={24} md={8}>
                                    <Form.Item
                                        label="Số điện thoại"
                                        name="phone"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    "Vui lòng nhập số điện thoại!",
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder="VD: 0123456789"
                                            disabled
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    <Form.Item label="Email" name="email">
                                        <Input
                                            placeholder="VD: email@example.com"
                                            disabled
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label="Nguồn khách hàng"
                                        name="customerSource"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    "Vui lòng chọn nguồn khách hàng!",
                                            },
                                        ]}
                                    >
                                        <Select
                                            options={CustomerSourceOptions}
                                            placeholder="Chọn nguồn"
                                            disabled
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item label="Địa chỉ" name="address">
                                <Input.TextArea
                                    rows={2}
                                    placeholder="Nhập địa chỉ khách hàng"
                                    disabled
                                />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col xs={24} sm={12} lg={8}>
                                    <Form.Item
                                        label="Ngày đặt"
                                        name="orderDate"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    "Vui lòng chọn ngày đặt!",
                                            },
                                        ]}
                                    >
                                        <DatePicker
                                            disabled
                                            className="w-full"
                                            format="DD/MM/YYYY"
                                            placeholder="Chọn ngày đặt"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} lg={8}>
                                    <Form.Item
                                        label="Ngày giao dự kiến"
                                        name="deliveryDate"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    "Vui lòng chọn ngày giao!",
                                            },
                                        ]}
                                    >
                                        <DatePicker
                                            className="w-full"
                                            format="DD/MM/YYYY"
                                            placeholder="Chọn ngày giao"
                                            disabledDate={(current) =>
                                                current &&
                                                current < dayjs().endOf("day")
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col xs={24} sm={24} md={12}>
                                    <Form.Item
                                        required
                                        label="Nhân viên tạo phiếu"
                                        name="createdByName"
                                    >
                                        <Input
                                            disabled
                                            placeholder="Đang tải thông tin người dùng..."
                                            prefix={
                                                <UserOutlined className="text-gray-400" />
                                            }
                                            className="bg-gray-50"
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        name="createdBy"
                                        className="absolute"
                                    >
                                        <Input disabled hidden />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={24} md={12}>
                                    <Form.Item
                                        required
                                        label="Nhân viên tư vấn"
                                        name="consultantId"
                                    >
                                        <Select
                                            placeholder="Chọn nhân viên tư vấn"
                                            className="w-full"
                                            allowClear
                                            showSearch={{
                                                optionFilterProp: "children",
                                                filterOption: (input, option) =>
                                                    String(option?.label || "")
                                                        .toLowerCase()
                                                        .includes(
                                                            input.toLowerCase(),
                                                        ),
                                            }}
                                        >
                                            {memberOptions[ROLES.sales]?.map(
                                                (option: any) => (
                                                    <Option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </Option>
                                                ),
                                            )}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item label="Ghi chú đơn hàng" name="notes">
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Ghi chú chung về phiếu nhập bảo hành..."
                                    maxLength={500}
                                    showCount
                                />
                            </Form.Item>
                        </Card>
                    )}

                    {/* Products Section - Show when order is selected (create) or always (update) */}
                    {(selectedOrderCode || mode === "update") && (
                        <Card
                            title={
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TagOutlined />
                                        <Text strong>Danh sách sản phẩm</Text>
                                        <Tag color="yellow">
                                            {products.length} sản phẩm
                                        </Tag>
                                    </div>
                                    <Button
                                        type="primary"
                                        htmlType="button"
                                        icon={<PlusOutlined />}
                                        onClick={addProduct}
                                        className="bg-primary hover:bg-primary"
                                    >
                                        Thêm
                                    </Button>
                                </div>
                            }
                            className="bg-background shadow-sm"
                        >
                            {products.length === 0 ? (
                                <div className="text-center py-8">
                                    <Empty
                                        description={`Chưa có sản phẩm nào. Chọn đơn hàng để tự động điền sản phẩm hoặc nhấn "Thêm sản phẩm" để bắt đầu.`}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[600px] flex flex-col gap-4 overflow-y-auto pr-2">
                                    {products.map((product, index) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onUpdate={(
                                                updatedProduct: ProductData,
                                            ) =>
                                                updateProduct(
                                                    index,
                                                    updatedProduct,
                                                )
                                            }
                                            onRemove={() =>
                                                removeProduct(index)
                                            }
                                            staffOptions={
                                                memberOptions[ROLES.worker] ||
                                                []
                                            }
                                            workflowOptions={workflowOptions}
                                            workflows={workflows}
                                            staff={staff}
                                            departments={departments}
                                            status={WarrantyClaimStatus.PENDING}
                                        />
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Order Summary - Show when order is selected (create) or always (update) and has products */}
                    {(selectedOrderCode || mode === "update") &&
                        products.length > 0 && (
                            <Card
                                title={
                                    <div className="flex items-center gap-2">
                                        <ShoppingCartOutlined />
                                        <Text strong>
                                            Tổng kết phiếu nhập bảo hành
                                        </Text>
                                    </div>
                                }
                                className="bg-background shadow-sm"
                            >
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {products.map((product, index) => {
                                        return (
                                            <div
                                                key={product.id}
                                                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                                            >
                                                <div className="flex-1">
                                                    <Text>
                                                        {product.name ||
                                                            `Sản phẩm ${index + 1}`}
                                                    </Text>
                                                    <br />
                                                    <Text
                                                        type="secondary"
                                                        className="text-sm"
                                                    >
                                                        Số lượng:{" "}
                                                        {product.quantity}
                                                    </Text>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Form.Item
                                    name="totalAmount"
                                    hidden
                                    initialValue={0}
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item
                                    name="shippingFee"
                                    hidden
                                    initialValue={0}
                                >
                                    <Input />
                                </Form.Item>
                            </Card>
                        )}

                    {/* Action Buttons - Show when order is selected (create) or always (update) */}
                    {(selectedOrderCode || mode === "update") && (
                        <div className="flex justify-end gap-2">
                            {onCancel && (
                                <Button onClick={onCancel} size="large">
                                    Hủy
                                </Button>
                            )}
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                size="large"
                                icon={<SaveOutlined />}
                            >
                                {mode === "create" ? "Tạo phiếu" : "Cập nhật"}
                            </Button>
                        </div>
                    )}
                </div>
            </Form>
        );
    },
);

WarrantyClaimForm.displayName = "WarrantyClaimForm";

export default WarrantyClaimForm;
