"use client";

import WrapperContent from "@/components/WrapperContent";
import { Form, Input, DatePicker } from "antd";
import { useRealtimeList } from "@/firebase/hooks/useRealtimeList";
import { Card, Col, Row, Typography, Modal, Table, Tag, Badge, Empty, Button, Select, message, Space } from "antd";
import {
    UserSwitchOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    UserOutlined,
    SafetyOutlined,
    ControlOutlined,
    InfoCircleOutlined,
    CheckOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { useState, useMemo } from "react";
import type { FirebaseOrderData } from "@/types/order";
import { IMembers } from "@/types/members";
import dayjs from "dayjs";
import { ref, update, getDatabase, remove } from "firebase/database";
import { useFirebaseApp } from "@/firebase/provider";

const { Text } = Typography;

type OrderWithId = FirebaseOrderData & { id: string };

interface AssignableTask {
    key: string;
    orderId: string;
    orderCode: string;
    productCode: string;
    productName: string;
    customerName: string;
    currentAssignee: string;
    stepName: string;
    deliveryDate: number;
    workflowId: string;
    suggestedAssignee?: string;
    reason?: string;
    isStandalone?: boolean;
    taskType?: string;
}

interface StandaloneTask {
    id: string;
    title: string;
    description: string;
    assignee: string;
    deadline?: number;
    createdAt: number;
    createdBy: string;
    status: string;
    isDone?: boolean;
    type?: string;
}

const TASK_TYPES = [
    { value: "strategy_1", label: "Giữ nguyên người nhận việc & giai đoạn trước", color: "#1890ff" },
    { value: "strategy_2", label: "Giao về cho người nhận nhiệm vụ đầu tiên", color: "#52c41a" },
    { value: "strategy_3", label: "Giao lại cho người nhận nhiệm vụ trước của giai đoạn được chọn", color: "#faad14" },
    { value: "strategy_4", label: "Giao lại ngẫu nhiên", color: "#722ed1" },
    { value: "strategy_5", label: "Giao ngẫu nhiên cho người ít nhiệm vụ nhất", color: "#eb2f96" },
    { value: "strategy_6", label: "Để người nhận nhiệm vụ hiện tại quyết định", color: "#13c2c2" },
    { value: "strategy_7", label: "Không giao cho ai. Để người quản lý giai đoạn quyết định", color: "#fa8c16" },
];

interface MemberWorkload {
    memberId: string;
    memberName: string;
    activeTasks: number;
}

export default function TaskAssignmentPage() {
    const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);
    const [assignments, setAssignments] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [tasksWithSuggestions, setTasksWithSuggestions] = useState<AssignableTask[]>([]);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm] = Form.useForm();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<AssignableTask | null>(null);
    const [editForm] = Form.useForm();

    const firebaseApp = useFirebaseApp();
    const { data: ordersData, isLoading } = useRealtimeList<OrderWithId>("xoxo/orders");
    const { data: standaloneTasksData } = useRealtimeList<StandaloneTask>("xoxo/standalone_tasks");
    const { data: membersData } = useRealtimeList<IMembers>("xoxo/members");

    const memberWorkload = useMemo(() => {
        if (!ordersData || !membersData) return [];

        const workloadMap = new Map<string, MemberWorkload>();

        (membersData as any[]).forEach((item: any) => {
            const member: IMembers = item.data || item;
            workloadMap.set(member.id, {
                memberId: member.id,
                memberName: member.name,
                activeTasks: 0,
            });
        });

        ordersData.forEach((orderItem: any) => {
            // Handle both WithId format and direct format
            const order: OrderWithId = (orderItem as any).data || orderItem;
            if (!order.products) return;

            Object.values(order.products).forEach((product: any) => {
                const workflows = product.workflows || {};

                Object.values(workflows).forEach((workflow: any) => {
                    if (!workflow.isDone && Array.isArray(workflow.members)) {
                        workflow.members.forEach((memberId: string) => {
                            const current = workloadMap.get(memberId);
                            if (current) {
                                current.activeTasks++;
                            }
                        });
                    }
                });
            });
        });

        // Also count standalone tasks
        if (standaloneTasksData) {
            standaloneTasksData.forEach((taskItem: any) => {
                // Handle both WithId format and direct format
                const task = (taskItem as any).data || taskItem;
                const isDone = task.isDone || false;
                if (task.assignee && !isDone) {
                    const current = workloadMap.get(task.assignee);
                    if (current) {
                        current.activeTasks++;
                    }
                }
            });
        }

        return Array.from(workloadMap.values()).sort((a, b) => a.activeTasks - b.activeTasks);
    }, [ordersData, membersData, standaloneTasksData]);

    const assignableTasks = useMemo(() => {
        const tasks: AssignableTask[] = [];

        // 1. Process Order Tasks
        if (ordersData) {
            ordersData.forEach((orderItem: any) => {
                // Handle both WithId format and direct format
                const order = (orderItem as any).data || orderItem;
                if (!order.products) return;

                Object.entries(order.products).forEach(([productCode, product]: [string, any]) => {
                    const workflows = product.workflows || {};

                    Object.entries(workflows).forEach(([workflowId, workflow]: [string, any]) => {
                        const stepName = Array.isArray(workflow.workflowName) && workflow.workflowName[0]
                            ? workflow.workflowName[0]
                            : "Chưa đặt tên";

                        const assignee = Array.isArray(workflow.members) && workflow.members.length > 0
                            ? workflow.members[0]
                            : "Chưa gán";

                        if (!workflow.isDone) {
                            const orderId = orderItem.id || order.id;
                            const taskKey = [orderId, productCode, workflowId].join("_");
                            const orderAny = order as any;
                            tasks.push({
                                key: taskKey,
                                orderId: orderId,
                                orderCode: orderAny.code || "N/A",
                                productCode,
                                productName: product.name || productCode,
                                customerName: orderAny.customerName || "N/A",
                                currentAssignee: assignee,
                                stepName,
                                deliveryDate: orderAny.deliveryDate || 0,
                                workflowId,
                                isStandalone: false,
                            });
                        }
                    });
                });
            });
        }

        // 2. Process Standalone Tasks
        if (standaloneTasksData) {
            standaloneTasksData.forEach((taskItem: any) => {
                // Handle both WithId format and direct format
                const task = (taskItem as any).data || taskItem;
                const taskId = (taskItem as any).id || task.id;
                const isDone = task.isDone || false;
                
                if (!isDone) { // Only show pending tasks
                    tasks.push({
                        key: taskId,
                        orderId: "standalone",
                        orderCode: "Công việc lẻ",
                        productCode: "standalone",
                        productName: task.title || "Chưa có tiêu đề",
                        customerName: "Nội bộ",
                        currentAssignee: task.assignee || "Chưa gán",
                        stepName: "Thực hiện",
                        deliveryDate: task.deadline || 0,
                        workflowId: taskId,
                        isStandalone: true,
                        taskType: task.type || "",
                    });
                }
            });
        }

        return tasks;
    }, [ordersData, standaloneTasksData]);

    const applyStrategy = (strategyId: number) => {
        const newAssignments: Record<string, string> = {};
        const updatedTasks = assignableTasks.map(task => {
            let suggestedAssignee = task.currentAssignee;
            let reason = "";

            switch (strategyId) {
                case 1:
                    suggestedAssignee = task.currentAssignee;
                    reason = "Giữ nguyên người đang làm để duy trì tính liên tục";
                    break;

                case 2:
                    suggestedAssignee = task.currentAssignee;
                    reason = "Giao về cho người nhận nhiệm vụ đầu tiên trong quy trình";
                    break;

                case 3:
                    suggestedAssignee = task.currentAssignee;
                    reason = "Giao cho người đã làm giai đoạn trước đó";
                    break;

                case 4:
                    if (memberWorkload.length > 0) {
                        const randomMember = memberWorkload[Math.floor(Math.random() * memberWorkload.length)];
                        suggestedAssignee = randomMember.memberId;
                        reason = "Chọn ngẫu nhiên - " + randomMember.memberName;
                    }
                    break;

                case 5:
                    if (memberWorkload.length > 0) {
                        const leastBusy = memberWorkload[0];
                        suggestedAssignee = leastBusy.memberId;
                        reason = "Người ít việc nhất (" + leastBusy.activeTasks + " công việc đang làm)";
                    }
                    break;

                case 6:
                    suggestedAssignee = task.currentAssignee;
                    reason = "Để người hiện tại quyết định";
                    break;

                case 7:
                    suggestedAssignee = task.currentAssignee;
                    reason = "Để quản lý phòng ban quyết định";
                    break;
            }

            newAssignments[task.key] = suggestedAssignee;

            return {
                ...task,
                suggestedAssignee,
                reason,
            };
        });

        setAssignments(newAssignments);
        return updatedTasks;
    };

    const handleApplyStrategy = (strategyId: number) => {
        const updated = applyStrategy(strategyId);
        setTasksWithSuggestions(updated);
        message.success("Đã áp dụng quy tắc phân công!");
    };

    const handleAssignmentChange = (taskKey: string, newAssignee: string) => {
        setAssignments(prev => ({
            ...prev,
            [taskKey]: newAssignee,
        }));

        setTasksWithSuggestions(prev =>
            prev.map(task =>
                task.key === taskKey
                    ? { ...task, suggestedAssignee: newAssignee, reason: "Chỉnh sửa thủ công" }
                    : task
            )
        );
    };

    const handleCreateTask = async (values: any) => {
        setSaving(true);
        try {
            const db = getDatabase(firebaseApp);
            const taskId = "task_" + Date.now();
            const taskData = {
                title: values.title,
                description: values.description || "",
                assignee: values.assignee,
                deadline: values.deadline ? values.deadline.valueOf() : null,
                createdAt: Date.now(),
                createdBy: "current_user",
                status: "pending",
                isDone: false,
                type: values.type || "other",
            };

            const taskRef = ref(db, "xoxo/standalone_tasks/" + taskId);
            await update(taskRef, taskData);

            message.success("Đã tạo công việc mới thành công!");
            setCreateModalOpen(false);
            createForm.resetFields();
        } catch (error) {
            console.error("Error creating task:", error);
            message.error("Có lỗi xảy ra khi tạo công việc!");
        } finally {
            setSaving(false);
        }
    };

    const handleEditTask = (task: AssignableTask) => {
        if (!task.isStandalone) {
            message.warning("Chỉ có thể sửa công việc lẻ!");
            return;
        }
        setEditingTask(task);
        // Load task data for editing - task.key is the task id
        const standaloneTask = standaloneTasksData?.find((t: any) => {
            // Handle both WithId format and direct format
            const taskId = (t as any).id || (t as any).data?.id;
            return taskId === task.key;
        });
        if (standaloneTask) {
            const taskData = (standaloneTask as any).data || standaloneTask;
            editForm.setFieldsValue({
                title: taskData.title || task.productName,
                description: taskData.description || "",
                assignee: taskData.assignee || task.currentAssignee,
                deadline: taskData.deadline ? dayjs(taskData.deadline) : (task.deliveryDate ? dayjs(task.deliveryDate) : null),
                type: taskData.type || "other",
            });
        } else {
            // Fallback to task data if not found in standaloneTasksData
            editForm.setFieldsValue({
                title: task.productName,
                description: "",
                assignee: task.currentAssignee !== "Chưa gán" ? task.currentAssignee : undefined,
                deadline: task.deliveryDate ? dayjs(task.deliveryDate) : null,
                type: "other",
            });
        }
        setEditModalOpen(true);
    };

    const handleUpdateTask = async (values: any) => {
        if (!editingTask) return;
        setSaving(true);
        try {
            const db = getDatabase(firebaseApp);
            const taskRef = ref(db, `xoxo/standalone_tasks/${editingTask.key}`);
            const taskData = {
                title: values.title,
                description: values.description || "",
                assignee: values.assignee,
                deadline: values.deadline ? values.deadline.valueOf() : null,
                type: values.type || "other",
            };

            await update(taskRef, taskData);
            message.success("Đã cập nhật công việc thành công!");
            setEditModalOpen(false);
            setEditingTask(null);
            editForm.resetFields();
        } catch (error) {
            console.error("Error updating task:", error);
            message.error("Có lỗi xảy ra khi cập nhật công việc!");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTask = (task: AssignableTask) => {
        if (!task.isStandalone) {
            message.warning("Chỉ có thể xóa công việc lẻ!");
            return;
        }
        Modal.confirm({
            title: "Xác nhận xóa",
            content: `Bạn có chắc chắn muốn xóa công việc "${task.productName}"?`,
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const db = getDatabase(firebaseApp);
                    const taskRef = ref(db, `xoxo/standalone_tasks/${task.key}`);
                    await remove(taskRef);
                    message.success("Đã xóa công việc thành công!");
                } catch (error) {
                    console.error("Error deleting task:", error);
                    message.error("Có lỗi xảy ra khi xóa công việc!");
                }
            },
        });
    };

    const handleSaveAssignments = async () => {
        setSaving(true);
        try {
            const updates: Record<string, any> = {};

            tasksWithSuggestions.forEach(task => {
                const newAssignee = assignments[task.key] || task.suggestedAssignee;
                if (newAssignee && newAssignee !== "Chưa gán") {
                    if (task.isStandalone) {
                        // Update standalone task
                        updates[`xoxo/standalone_tasks/${task.key}/assignee`] = newAssignee;
                    } else {
                        // Update order workflow
                        const pathParts = ["xoxo/orders", task.orderId, "products", task.productCode, "workflows", task.workflowId, "members"];
                        const path = pathParts.join("/");
                        updates[path] = [newAssignee];
                    }
                }
            });

            if (Object.keys(updates).length > 0) {
                const db = getDatabase(firebaseApp);
                await update(ref(db), updates);
                message.success("Đã phân công " + Object.keys(updates).length + " công việc thành công!");
                setSelectedStrategy(null);
                setAssignments({});
                setTasksWithSuggestions([]);
            } else {
                message.warning("Không có thay đổi nào để lưu");
            }
        } catch (error) {
            console.error("Error saving assignments:", error);
            message.error("Có lỗi xảy ra khi lưu phân công!");
        } finally {
            setSaving(false);
        }
    };

    const strategies = [
        { id: 1, title: "Giữ nguyên người nhận việc & giai đoạn trước", icon: ClockCircleOutlined, color: "#1890ff" },
        { id: 2, title: "Giao về cho người nhận nhiệm vụ đầu tiên", icon: UserOutlined, color: "#52c41a" },
        { id: 3, title: "Giao lại cho người nhận nhiệm vụ trước của giai đoạn được chọn", icon: ControlOutlined, color: "#faad14" },
        { id: 4, title: "Giao lại ngẫu nhiên", icon: ThunderboltOutlined, color: "#722ed1" },
        { id: 5, title: "Giao ngẫu nhiên cho người ít nhiệm vụ nhất", icon: TeamOutlined, color: "#eb2f96" },
    ];

    const manualStrategies = [
        { id: 6, title: "Để người nhận nhiệm vụ hiện tại quyết định", icon: UserOutlined, color: "#13c2c2" },
        { id: 7, title: "Không giao cho ai. Để người quản lý giai đoạn quyết định", icon: SafetyOutlined, color: "#fa8c16" },
    ];

    const columns = [
        { title: "Mã đơn", dataIndex: "orderCode", key: "orderCode", width: 120 },
        { title: "Sản phẩm", dataIndex: "productName", key: "productName", width: 180 },
        { title: "Khách hàng", dataIndex: "customerName", key: "customerName", width: 140 },
        { title: "Bước hiện tại", dataIndex: "stepName", key: "stepName", width: 140 },
        {
            title: "Người hiện tại",
            dataIndex: "currentAssignee",
            key: "currentAssignee",
            width: 120,
            render: (text: string) => <Tag color={text === "Chưa gán" ? "default" : "blue"}>{text}</Tag>,
        },
        {
            title: "Người được giao",
            key: "suggestedAssignee",
            width: 200,
            render: (_: any, record: AssignableTask) => (
                <Space direction="vertical" size="small" className="w-full">
                    <Select
                        value={assignments[record.key] || record.suggestedAssignee || record.currentAssignee}
                        onChange={(value) => handleAssignmentChange(record.key, value)}
                        style={{ width: "100%" }}
                        size="small"
                        options={memberWorkload.map(m => ({
                            label: m.memberName + " (" + m.activeTasks + " việc)",
                            value: m.memberId,
                        }))}
                    />
                    {record.reason && (
                        <Text type="secondary" className="text-xs flex items-center gap-1">
                            <InfoCircleOutlined />
                            {record.reason}
                        </Text>
                    )}
                </Space>
            ),
        },
        {
            title: "Ngày hẹn",
            dataIndex: "deliveryDate",
            key: "deliveryDate",
            width: 110,
            render: (date: number) => (
                <Text type="secondary" className="text-xs">
                    {date ? dayjs(date).format("DD/MM/YYYY") : "-"}
                </Text>
            ),
        },
    ];

    const handleStrategyClick = (strategyId: number) => {
        setSelectedStrategy(strategyId);
        setAssignments({});
        // Auto apply strategy to show full task list
        const updated = applyStrategy(strategyId);
        setTasksWithSuggestions(updated);
    };

    const displayTasks = tasksWithSuggestions.length > 0 ? tasksWithSuggestions : assignableTasks;

    // Helper to safely get strategy data
    const getStrategyData = (id: number | null) => {
        if (id === null) return undefined;
        return [...strategies, ...manualStrategies].find(s => s.id === id);
    };

    const currentStrategy = getStrategyData(selectedStrategy);

    return (
        // Wrapper content for task assignment page
        <WrapperContent
            title="Giao việc"
            header={{
                buttonEnds: [
                    {
                        name: "Tạo công việc",
                        icon: <PlusOutlined />,
                        type: "primary",
                        onClick: () => setCreateModalOpen(true),
                        can: true,
                    }
                ]
            }}
        >
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <UserSwitchOutlined />
                                <span>Phần mềm giao việc</span>
                                <Badge count={assignableTasks.length} showZero />
                            </div>
                        }
                        size="small"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                            {strategies.map((strategy) => {
                                const IconComponent = strategy.icon;
                                // Calculate tasks count for this strategy (all tasks can apply any strategy)
                                const tasksCount = assignableTasks.length;
                                return (
                                    <Card
                                        key={strategy.id}
                                        size="small"
                                        hoverable
                                        onClick={() => handleStrategyClick(strategy.id)}
                                        className="cursor-pointer transition-all h-full"
                                        styles={{ body: { padding: "12px" } }}
                                    >
                                        <div className="flex flex-col items-start gap-2 h-full">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <div
                                                        className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                                                        style={{ backgroundColor: strategy.color + "20" }}
                                                    >
                                                        <IconComponent style={{ fontSize: 16, color: strategy.color }} />
                                                    </div>
                                                    <Text className="text-xs line-clamp-2 flex-1" title={strategy.title}>
                                                        {strategy.title}
                                                    </Text>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <Badge 
                                                        count={tasksCount} 
                                                        showZero 
                                                        style={{ backgroundColor: strategy.color }}
                                                    />
                                                    <div
                                                        className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: strategy.color }}
                                                    >
                                                        <Text strong style={{ color: "white", fontSize: 10 }}>{strategy.id}</Text>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={10}>
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <TeamOutlined />
                                <span>Người dùng giao việc</span>
                            </div>
                        }
                        size="small"
                    >
                        <div className="space-y-2">
                            {manualStrategies.map((strategy) => {
                                const IconComponent = strategy.icon;
                                return (
                                    <Card
                                        key={strategy.id}
                                        size="small"
                                        hoverable
                                        onClick={() => handleStrategyClick(strategy.id)}
                                        className="cursor-pointer transition-all"
                                        styles={{ body: { padding: "12px 16px" } }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                                                style={{ backgroundColor: strategy.color + "20" }}
                                            >
                                                <IconComponent style={{ fontSize: 20, color: strategy.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: strategy.color }}
                                                    >
                                                        <Text strong style={{ color: "white", fontSize: 12 }}>{strategy.id}</Text>
                                                    </div>
                                                    <Text strong className="text-sm">{strategy.title}</Text>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </Card>
                </Col>
            </Row >

            <Card
                className="mt-4"
                size="small"
                title={
                    <div className="flex items-center gap-2">
                        <InfoCircleOutlined />
                        <span>Danh sách công việc cần giao</span>
                        <Badge count={assignableTasks.length} showZero />
                    </div>
                }
            >
                <Table
                    columns={[
                        {
                            title: "Sản phẩm/Tiêu đề",
                            dataIndex: "productName",
                            key: "productName",
                            width: 200,
                            render: (text: string) => <Text>{text || "-"}</Text>,
                        },
                        {
                            title: "Khách hàng",
                            dataIndex: "customerName",
                            key: "customerName",
                            width: 150,
                            render: (text: string) => <Text>{text || "-"}</Text>,
                        },
                        {
                            title: "Phần mềm giao việc",
                            dataIndex: "taskType",
                            key: "taskType",
                            width: 200,
                            render: (taskType: string, record: AssignableTask) => {
                                if (!record.isStandalone) return <Text>-</Text>;
                                const typeInfo = TASK_TYPES.find(t => t.value === taskType);
                                return typeInfo ? (
                                    <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                                ) : <Text>-</Text>;
                            },
                        },
                        {
                            title: "Người hiện tại",
                            dataIndex: "currentAssignee",
                            key: "currentAssignee",
                            width: 200,
                            render: (text: string, record: AssignableTask) => {
                                // Find member name if text is an ID
                                const member = memberWorkload.find(m => m.memberId === text);
                                const displayName = member ? member.memberName : (text === "Chưa gán" ? "Chưa gán" : text);
                                
                                return (
                                    <Select
                                        style={{ width: "100%" }}
                                        value={text === "Chưa gán" ? null : text}
                                        placeholder="Chọn người làm"
                                        options={memberWorkload.map(m => ({
                                            value: m.memberId,
                                            label: `${m.memberName} (${m.activeTasks} việc)`
                                        }))}
                                        onChange={(value) => {
                                            const newAssignee = value;
                                            // Update directly
                                            const updates: Record<string, any> = {};
                                            if (record.isStandalone) {
                                                updates[`xoxo/standalone_tasks/${record.key}/assignee`] = newAssignee;
                                            } else {
                                                const pathParts = ["xoxo/orders", record.orderId, "products", record.productCode, "workflows", record.workflowId, "members"];
                                                const path = pathParts.join("/");
                                                updates[path] = [newAssignee];
                                            }
                                            const db = getDatabase(firebaseApp);
                                            update(ref(db), updates).then(() => {
                                                message.success("Đã cập nhật người thực hiện!");
                                            });
                                        }}
                                        allowClear
                                    />
                                );
                            },
                        },
                        {
                            title: "Ngày hẹn",
                            dataIndex: "deliveryDate",
                            key: "deliveryDate",
                            width: 120,
                            render: (date) => (
                                <Text type="secondary">
                                    {date ? dayjs(date).format("DD/MM/YYYY") : "-"}
                                </Text>
                            ),
                        },
                        {
                            title: "Thao tác",
                            key: "action",
                            width: 120,
                            fixed: "right" as const,
                            render: (_: any, record: AssignableTask) => (
                                <Space size="small">
                                    {record.isStandalone && (
                                        <>
                                            <Button
                                                type="primary"
                                                icon={<EditOutlined />}
                                                size="small"
                                                onClick={() => handleEditTask(record)}
                                            >
                                                Sửa
                                            </Button>
                                            <Button
                                                type="primary"
                                                danger
                                                icon={<DeleteOutlined />}
                                                size="small"
                                                onClick={() => handleDeleteTask(record)}
                                            >
                                                Xóa
                                            </Button>
                                        </>
                                    )}
                                </Space>
                            ),
                        },
                    ]}
                    dataSource={assignableTasks}
                    loading={isLoading}
                    pagination={{ pageSize: 10 }}
                    size="small"
                    scroll={{ x: 1000 }}
                />
            </Card>

            <Modal
                title={
                    currentStrategy ? (
                        <div className="flex items-center gap-2">
                            <currentStrategy.icon style={{ color: currentStrategy.color }} />
                            <span>Quy tắc {selectedStrategy}: {currentStrategy.title}</span>
                        </div>
                    ) : null
                }
                open={selectedStrategy !== null}
                onCancel={() => {
                    setSelectedStrategy(null);
                    setAssignments({});
                    setTasksWithSuggestions([]);
                }}
                width={1200}
                footer={
                    <div className="flex justify-between items-center">
                        <div>
                            {tasksWithSuggestions.length > 0 && (
                                <Text type="secondary">
                                    Đã áp dụng quy tắc cho {tasksWithSuggestions.length} công việc
                                </Text>
                            )}
                        </div>
                        <Space>
                            <Button onClick={() => {
                                setSelectedStrategy(null);
                                setAssignments({});
                                setTasksWithSuggestions([]);
                            }}>
                                Hủy
                            </Button>
                            {tasksWithSuggestions.length === 0 && selectedStrategy !== null && (
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    onClick={() => handleApplyStrategy(selectedStrategy)}
                                >
                                    Áp dụng quy tắc
                                </Button>
                            )}
                            {tasksWithSuggestions.length > 0 && (
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    loading={saving}
                                    onClick={handleSaveAssignments}
                                >
                                    Lưu phân công
                                </Button>
                            )}
                        </Space>
                    </div>
                }
            >
                {assignableTasks.length === 0 ? (
                    <Empty description="Không có công việc cần giao" />
                ) : (
                    <div>
                        <div className="mb-4 p-3 bg-blue-50 rounded">
                            <Text>
                                Tìm thấy <Text strong>{assignableTasks.length}</Text> công việc có thể áp dụng quy tắc này
                            </Text>
                        </div>
                        <Table
                            columns={columns}
                            dataSource={displayTasks}
                            loading={isLoading}
                            pagination={{ pageSize: 10 }}
                            size="small"
                            scroll={{ x: 1000 }}
                        />
                    </div>
                )}
            </Modal>

            <Modal
                title="Tạo công việc mới"
                open={createModalOpen}
                onCancel={() => {
                    setCreateModalOpen(false);
                    createForm.resetFields();
                }}
                onOk={() => createForm.submit()}
                confirmLoading={saving}
                okText="Tạo công việc"
                cancelText="Hủy"
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreateTask}
                >
                    <Form.Item
                        name="title"
                        label="Tên công việc"
                        rules={[{ required: true, message: "Vui lòng nhập tên công việc" }]}
                    >
                        <Input placeholder="Nhập tên công việc..." />
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Loại công việc"
                        rules={[{ required: true, message: "Vui lòng chọn loại công việc" }]}
                        initialValue="strategy_5"
                    >
                        <Select options={TASK_TYPES} />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Mô tả chi tiết công việc..."
                        />
                    </Form.Item>

                    <Form.Item
                        name="assignee"
                        label="Người thực hiện"
                        rules={[{ required: true, message: "Vui lòng chọn người thực hiện" }]}
                    >
                        <Select
                            placeholder="Chọn người thực hiện..."
                            options={memberWorkload.map(m => ({
                                label: m.memberName + " (" + m.activeTasks + " việc)",
                                value: m.memberId,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="deadline"
                        label="Deadline"
                    >
                        <DatePicker
                            style={{ width: "100%" }}
                            format="DD/MM/YYYY"
                            placeholder="Chọn deadline..."
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Sửa công việc"
                open={editModalOpen}
                onCancel={() => {
                    setEditModalOpen(false);
                    setEditingTask(null);
                    editForm.resetFields();
                }}
                onOk={() => editForm.submit()}
                confirmLoading={saving}
                okText="Cập nhật"
                cancelText="Hủy"
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={handleUpdateTask}
                >
                    <Form.Item
                        name="title"
                        label="Tên công việc"
                        rules={[{ required: true, message: "Vui lòng nhập tên công việc" }]}
                    >
                        <Input placeholder="Nhập tên công việc..." />
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Loại công việc"
                        rules={[{ required: true, message: "Vui lòng chọn loại công việc" }]}
                    >
                        <Select options={TASK_TYPES} />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Mô tả chi tiết công việc..."
                        />
                    </Form.Item>

                    <Form.Item
                        name="assignee"
                        label="Người thực hiện"
                        rules={[{ required: true, message: "Vui lòng chọn người thực hiện" }]}
                    >
                        <Select
                            placeholder="Chọn người thực hiện..."
                            options={memberWorkload.map(m => ({
                                label: m.memberName + " (" + m.activeTasks + " việc)",
                                value: m.memberId,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="deadline"
                        label="Deadline"
                    >
                        <DatePicker
                            style={{ width: "100%" }}
                            format="DD/MM/YYYY"
                            placeholder="Chọn deadline..."
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </WrapperContent >
    );
}
