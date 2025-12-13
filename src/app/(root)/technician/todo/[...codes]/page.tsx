"use client";

import WrapperContent from "@/components/WrapperContent";
import { useRealtimeDoc, useRealtimeValue } from "@/firebase/hooks/useRealtime";
import { useFirebaseApp, useUser } from "@/firebase/provider";
import { IMembers } from "@/types/members";
import {
    FirebaseDepartments,
    FirebaseOrderData,
    FirebaseWorkflowData,
} from "@/types/order";
import { type WarrantyClaim } from "@/types/warrantyClaim";
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import {
    App,
    Avatar,
    Card,
    Checkbox,
    Empty,
    Progress,
    Space,
    Tag,
    Timeline,
    Typography,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { getDatabase, ref, update } from "firebase/database";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

const { Text, Title } = Typography;

// Extended interface for workflow with checklist
interface WorkflowWithChecklist extends FirebaseWorkflowData {
    checklist?: ChecklistTask[];
}

interface ChecklistTask {
    id: string;
    task_name: string;
    task_order: number;
    checked: boolean;
    checked_by?: string;
    checkedByName?: string;
    checked_at?: number;
    notes?: string;
}

const ProductWorkflowDetailsPage = () => {
    const params = useParams();
    const router = useRouter();
    const firebaseApp = useFirebaseApp();
    const { user } = useUser();
    const { message: antdMessage } = App.useApp();

    // Parse codes from params
    const codes = useMemo(() => {
        const codesParam = params.codes;
        if (Array.isArray(codesParam)) {
            return codesParam;
        }
        return [codesParam];
    }, [params.codes]);

    // Check if this is a warranty claim (path contains "warranty")
    const isWarrantyClaim = codes[0] === "warranty";
    const orderCode = isWarrantyClaim ? codes[1] : codes[0];
    const productCode = isWarrantyClaim ? codes[2] : codes[1];

    // Fetch order or warranty claim data
    const { data: order, isLoading: orderLoading } =
        useRealtimeDoc<FirebaseOrderData>(
            orderCode && !isWarrantyClaim ? `xoxo/orders/${orderCode}` : null,
        );

    const { data: warrantyClaim, isLoading: warrantyClaimLoading } =
        useRealtimeDoc<WarrantyClaim>(
            orderCode && isWarrantyClaim
                ? `xoxo/warranty_claims/${orderCode}`
                : null,
        );

    // Convert warranty claim to order-like format for compatibility
    const orderData = useMemo(() => {
        if (isWarrantyClaim && warrantyClaim) {
            const claim = warrantyClaim;
            return {
                code: claim.code,
                customerName: claim.customerName,
                phone: claim.phone,
                email: claim.email,
                address: claim.address,
                customerSource: claim.customerSource,
                customerCode: claim.customerCode,
                orderDate: claim.orderDate,
                deliveryDate: claim.deliveryDate,
                createdAt: claim.createdAt,
                updatedAt: claim.updatedAt,
                createdBy: claim.createdBy,
                createdByName: claim.createdByName,
                consultantId: claim.consultantId,
                consultantName: claim.consultantName,
                notes: claim.notes,
                issues: claim.issues,
                products: claim.products || {},
                status: claim.status,
                totalAmount: claim.totalAmount || 0,
            } as any as FirebaseOrderData;
        }
        return order;
    }, [isWarrantyClaim, warrantyClaim, order]);

    // Fetch members data
    const { data: membersData } = useRealtimeValue<{
        [key: string]: IMembers;
    }>("xoxo/members");

    // Fetch departments data
    const { data: departmentsData } =
        useRealtimeValue<FirebaseDepartments>("xoxo/departments");

    const membersMap = useMemo(() => {
        if (!membersData || !Object.keys(membersData).length)
            return {} as { [key: string]: IMembers };
        return membersData;
    }, [membersData]);

    const departments = useMemo(() => {
        if (!departmentsData || !Object.keys(departmentsData).length)
            return {} as FirebaseDepartments;
        return departmentsData;
    }, [departmentsData]);

    // Get product data
    const product = useMemo(() => {
        if (!orderData?.products || !productCode) return null;
        return orderData.products[productCode];
    }, [orderData?.products, productCode]);

    // Get workflows with checklist
    const workflows = useMemo(() => {
        if (!product?.workflows) return [];
        return Object.entries(product.workflows).map(
            ([workflowId, workflow]) => {
                // Initialize checklist if not exists
                let checklist: ChecklistTask[] = [];
                if ((workflow as any).checklist) {
                    checklist = (workflow as any).checklist;
                } else {
                    // Create default checklist based on workflow names
                    checklist = workflow.workflowName.map((name, index) => ({
                        id: `task_${workflowId}_${index}`,
                        task_name: name,
                        task_order: index + 1,
                        checked: false,
                    }));
                }

                return {
                    ...workflow,
                    id: workflowId,
                    checklist,
                } as WorkflowWithChecklist & { id: string };
            },
        );
    }, [product?.workflows]);

    // Handle checklist task toggle
    const handleTaskToggle = async (
        workflowId: string,
        taskId: string,
        checked: boolean,
    ) => {
        if (!orderCode || !productCode || !firebaseApp) return;

        try {
            const db = getDatabase(firebaseApp);
            const workflow = workflows.find((w) => w.id === workflowId);
            if (!workflow) return;

            // Check if previous workflow is completed
            const workflowIndex = workflows.findIndex(
                (w) => w.id === workflowId,
            );
            if (workflowIndex > 0) {
                const previousWorkflow = workflows[workflowIndex - 1];
                if (!previousWorkflow.isDone) {
                    antdMessage.warning(
                        "Vui lòng hoàn thành quy trình trước đó trước khi thực hiện quy trình này",
                    );
                    return;
                }
            }

            // Get user name from membersMap
            const checkedByName = user?.uid
                ? user.displayName || user.email || "Không rõ"
                : undefined;

            // Update checklist
            const updatedChecklist = workflow.checklist?.map((task) =>
                task.id === taskId
                    ? {
                          ...task,
                          checked,
                          checked_at: checked ? Date.now() : undefined,
                          checked_by: checked ? user?.uid : undefined,
                          checkedByName: checked ? checkedByName : undefined,
                      }
                    : task,
            );

            // Check if all tasks are completed
            const allTasksCompleted =
                updatedChecklist?.every((task) => task.checked) ?? false;

            // Update workflow in Firebase - use correct path based on type
            const basePath = isWarrantyClaim
                ? `xoxo/warranty_claims/${orderCode}/products/${productCode}/workflows/${workflowId}`
                : `xoxo/orders/${orderCode}/products/${productCode}/workflows/${workflowId}`;
            const workflowRef = ref(db, basePath);

            await update(workflowRef, {
                checklist: updatedChecklist,
                isDone: allTasksCompleted,
                updatedAt: Date.now(),
            });

            antdMessage.success(
                allTasksCompleted
                    ? "Tất cả công việc đã hoàn thành!"
                    : "Đã cập nhật công việc",
            );
        } catch (error) {
            console.error("Error updating task:", error);
            antdMessage.error(
                "Không thể cập nhật công việc. Vui lòng thử lại.",
            );
        }
    };

    // Calculate progress
    const progress = useMemo(() => {
        if (workflows.length === 0) return 0;
        const completed = workflows.filter((w) => w.isDone).length;
        return Math.round((completed / workflows.length) * 100);
    }, [workflows]);

    if (orderLoading || warrantyClaimLoading) {
        return (
            <WrapperContent
                isEmpty={false}
                isLoading={true}
                title="Đang tải..."
                header={{}}
            >
                <div></div>
            </WrapperContent>
        );
    }

    if (!orderData || !product) {
        return (
            <WrapperContent
                isEmpty={true}
                isLoading={false}
                title="Không tìm thấy sản phẩm"
                header={{}}
            >
                <Empty description="Không tìm thấy sản phẩm" />
            </WrapperContent>
        );
    }

    return (
        <WrapperContent
            isEmpty={false}
            isLoading={false}
            title={`Quy trình: ${product.name}${
                isWarrantyClaim ? " (Bảo hành)" : ""
            }`}
            header={{
                buttonBackTo: `/technician/todo`,
            }}
        >
            <div className="space-y-6 flex flex-col gap-4">
                {/* Product Info Card */}
                <Card>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <Title level={4} className="mb-2">
                                {product.name}
                            </Title>
                            <Space size="middle">
                                <Text type="secondary">
                                    Số lượng:{" "}
                                    <Text strong>{product.quantity}</Text>
                                </Text>
                                <Text type="secondary">
                                    Giá:{" "}
                                    <Text strong>
                                        {product.price?.toLocaleString("vi-VN")}{" "}
                                        VNĐ
                                    </Text>
                                </Text>
                            </Space>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <Text
                                    type="secondary"
                                    className="block text-sm"
                                >
                                    Tiến độ hoàn thành
                                </Text>
                                <Text strong className="text-lg">
                                    {progress}%
                                </Text>
                            </div>
                            <Progress
                                type="circle"
                                size={60}
                                percent={progress}
                                format={(percent) => `${percent}%`}
                            />
                        </div>
                    </div>
                </Card>

                {/* Workflow Timeline */}
                {workflows.length > 0 ? (
                    <Card>
                        <Title level={5} className="mb-4">
                            Chi tiết quy trình
                        </Title>
                        <Timeline
                            mode="left"
                            items={workflows.map((workflow, index) => {
                                const isCompleted = workflow.isDone;
                                const isProcessing =
                                    !isCompleted &&
                                    (workflow.checklist?.some(
                                        (task) => task.checked,
                                    ) ??
                                        false);
                                const isPending = !isCompleted && !isProcessing;

                                // Check if previous workflow is completed
                                const previousWorkflow =
                                    index > 0 ? workflows[index - 1] : null;
                                const isPreviousCompleted =
                                    previousWorkflow?.isDone ?? true; // First workflow is always enabled
                                const isDisabled = !isPreviousCompleted; // Disable if previous workflow is not completed

                                // Calculate checklist progress
                                const checklistProgress = workflow.checklist
                                    ? Math.round(
                                          (workflow.checklist.filter(
                                              (t) => t.checked,
                                          ).length /
                                              workflow.checklist.length) *
                                              100,
                                      )
                                    : 0;

                                return {
                                    dot: isCompleted ? (
                                        <CheckCircleOutlined
                                            style={{
                                                fontSize: 20,
                                                color: "#52c41a",
                                            }}
                                        />
                                    ) : isProcessing ? (
                                        <ClockCircleOutlined
                                            style={{
                                                fontSize: 20,
                                                color: "#1890ff",
                                            }}
                                        />
                                    ) : (
                                        <CloseCircleOutlined
                                            style={{
                                                fontSize: 20,
                                                color: "#d9d9d9",
                                            }}
                                        />
                                    ),
                                    color: isCompleted
                                        ? "green"
                                        : isProcessing
                                          ? "blue"
                                          : "gray",
                                    children: (
                                        <div className="pl-4">
                                            <Card
                                                size="small"
                                                className={`mb-4 ${
                                                    isCompleted
                                                        ? "border-green-500 bg-green-50"
                                                        : isProcessing
                                                          ? "border-blue-500 bg-blue-50"
                                                          : isDisabled
                                                            ? "border-gray-200 bg-gray-50 opacity-60"
                                                            : "border-gray-300"
                                                }`}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Text
                                                                strong
                                                                className="text-base"
                                                            >
                                                                {workflow.workflowName.join(
                                                                    ", ",
                                                                ) ||
                                                                    `Công đoạn ${index + 1}`}
                                                            </Text>
                                                            {isCompleted ? (
                                                                <Tag color="success">
                                                                    Hoàn thành
                                                                </Tag>
                                                            ) : isProcessing ? (
                                                                <Tag color="processing">
                                                                    Đang thực
                                                                    hiện
                                                                </Tag>
                                                            ) : isDisabled ? (
                                                                <Tag color="default">
                                                                    Chờ quy
                                                                    trình trước
                                                                </Tag>
                                                            ) : (
                                                                <Tag>
                                                                    Chờ xử lý
                                                                </Tag>
                                                            )}
                                                        </div>

                                                        {isDisabled && (
                                                            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                                                <Text
                                                                    type="warning"
                                                                    className="text-xs"
                                                                >
                                                                    ⚠️ Vui lòng
                                                                    hoàn thành
                                                                    quy trình
                                                                    trước đó
                                                                    trước khi
                                                                    thực hiện
                                                                    quy trình
                                                                    này
                                                                </Text>
                                                            </div>
                                                        )}

                                                        {workflow.departmentCode && (
                                                            <Text
                                                                type="secondary"
                                                                className="text-sm block mb-2"
                                                            >
                                                                Phòng ban:{" "}
                                                                {departments[
                                                                    workflow
                                                                        .departmentCode
                                                                ]?.name ||
                                                                    workflow.departmentCode}
                                                            </Text>
                                                        )}

                                                        {/* Assigned Members */}
                                                        {workflow.members &&
                                                            workflow.members
                                                                .length > 0 && (
                                                                <div className="mb-3">
                                                                    <Text
                                                                        type="secondary"
                                                                        className="text-sm block mb-1"
                                                                    >
                                                                        Nhân
                                                                        viên
                                                                        thực
                                                                        hiện:
                                                                    </Text>
                                                                    <Space
                                                                        size="small"
                                                                        wrap
                                                                    >
                                                                        {workflow.members.map(
                                                                            (
                                                                                memberId,
                                                                            ) => {
                                                                                const member =
                                                                                    membersMap[
                                                                                        memberId
                                                                                    ];
                                                                                return (
                                                                                    <Tag
                                                                                        key={
                                                                                            memberId
                                                                                        }
                                                                                    >
                                                                                        <Space
                                                                                            size={
                                                                                                4
                                                                                            }
                                                                                        >
                                                                                            <Avatar
                                                                                                size={
                                                                                                    16
                                                                                                }
                                                                                            >
                                                                                                {member?.name?.charAt(
                                                                                                    0,
                                                                                                ) ||
                                                                                                    "?"}
                                                                                            </Avatar>
                                                                                            <span>
                                                                                                {member?.name ||
                                                                                                    memberId}
                                                                                            </span>
                                                                                        </Space>
                                                                                    </Tag>
                                                                                );
                                                                            },
                                                                        )}
                                                                    </Space>
                                                                </div>
                                                            )}

                                                        {/* Checklist Tasks */}
                                                        {workflow.checklist &&
                                                            workflow.checklist
                                                                .length > 0 && (
                                                                <div className="mt-3">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <Text
                                                                            strong
                                                                            className="text-sm"
                                                                        >
                                                                            Danh
                                                                            sách
                                                                            công
                                                                            việc
                                                                        </Text>
                                                                        <Text
                                                                            type="secondary"
                                                                            className="text-xs"
                                                                        >
                                                                            {
                                                                                workflow.checklist.filter(
                                                                                    (
                                                                                        t,
                                                                                    ) =>
                                                                                        t.checked,
                                                                                )
                                                                                    .length
                                                                            }{" "}
                                                                            /{" "}
                                                                            {
                                                                                workflow
                                                                                    .checklist
                                                                                    .length
                                                                            }{" "}
                                                                            hoàn
                                                                            thành
                                                                        </Text>
                                                                    </div>
                                                                    <Progress
                                                                        percent={
                                                                            checklistProgress
                                                                        }
                                                                        size="small"
                                                                        className="mb-3"
                                                                    />
                                                                    <div className="space-y-2">
                                                                        {workflow.checklist
                                                                            .sort(
                                                                                (
                                                                                    a,
                                                                                    b,
                                                                                ) =>
                                                                                    a.task_order -
                                                                                    b.task_order,
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    task,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            task.id
                                                                                        }
                                                                                        className="flex items-start gap-2 p-2 rounded"
                                                                                        style={{
                                                                                            backgroundColor:
                                                                                                task.checked
                                                                                                    ? "#2d4a2d"
                                                                                                    : "#27272a",
                                                                                            border: `1px solid ${
                                                                                                task.checked
                                                                                                    ? "rgba(82, 196, 26, 0.3)"
                                                                                                    : "rgba(255, 255, 255, 0.1)"
                                                                                            }`,
                                                                                        }}
                                                                                    >
                                                                                        <Checkbox
                                                                                            checked={
                                                                                                task.checked
                                                                                            }
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) =>
                                                                                                handleTaskToggle(
                                                                                                    workflow.id,
                                                                                                    task.id,
                                                                                                    e
                                                                                                        .target
                                                                                                        .checked,
                                                                                                )
                                                                                            }
                                                                                            disabled={
                                                                                                isCompleted ||
                                                                                                isDisabled
                                                                                            }
                                                                                            className="mt-1"
                                                                                        />
                                                                                        <div className="flex-1">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <Text
                                                                                                    style={{
                                                                                                        color: task.checked
                                                                                                            ? "#a1a1aa"
                                                                                                            : "#fafafa",
                                                                                                    }}
                                                                                                    className={
                                                                                                        task.checked
                                                                                                            ? "line-through"
                                                                                                            : ""
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        task.task_name
                                                                                                    }
                                                                                                </Text>
                                                                                                {task.checked &&
                                                                                                    task.checkedByName && (
                                                                                                        <Tag
                                                                                                            color="success"
                                                                                                            className="text-xs"
                                                                                                        >
                                                                                                            Người
                                                                                                            thực
                                                                                                            hiên:{" "}
                                                                                                            {
                                                                                                                task.checkedByName
                                                                                                            }
                                                                                                        </Tag>
                                                                                                    )}
                                                                                            </div>
                                                                                            {task.checked &&
                                                                                                task.checked_at && (
                                                                                                    <Text
                                                                                                        type="secondary"
                                                                                                        className="text-xs block mt-1"
                                                                                                        style={{
                                                                                                            color: "#a1a1aa",
                                                                                                        }}
                                                                                                    >
                                                                                                        Hoàn
                                                                                                        thành:{" "}
                                                                                                        {dayjs(
                                                                                                            task.checked_at,
                                                                                                        ).format(
                                                                                                            "DD/MM/YYYY HH:mm",
                                                                                                        )}
                                                                                                    </Text>
                                                                                                )}
                                                                                        </div>
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                        {/* Update Time */}
                                                        {workflow.updatedAt && (
                                                            <Text
                                                                type="secondary"
                                                                className="text-xs block mt-2"
                                                            >
                                                                Cập nhật:{" "}
                                                                {dayjs(
                                                                    workflow.updatedAt,
                                                                ).format(
                                                                    "DD/MM/YYYY HH:mm",
                                                                )}
                                                            </Text>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                    ),
                                };
                            })}
                        />
                    </Card>
                ) : (
                    <Card>
                        <Empty
                            description="Chưa có quy trình nào được thiết lập"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    </Card>
                )}
            </div>
        </WrapperContent>
    );
};

export default ProductWorkflowDetailsPage;
