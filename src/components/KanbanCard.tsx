"use client";

import {
    CalendarOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    EditOutlined,
    PhoneOutlined,
    TagOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { Draggable } from "@hello-pangea/dnd";
import { Card, Progress, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import React, { useMemo } from "react";

import MemberTag from "@/components/MemberTag";
import { columnsKanban } from "@/configs/table";
import { FirebaseOrderData } from "@/types/order";
import { formatCurrency } from "@/utils/formatCurrency";
import type { MenuProps } from "antd";

const { Text } = Typography;

// Types
interface KanbanCardProps {
    members: Record<string, { name: string; role: string }>;
    order: FirebaseOrderData & { id: string };
    index: number;
    onEdit: (order: FirebaseOrderData & { id: string }) => void;
    onContact: (phone: string) => void;
}

interface CardMetrics {
    progressPercent: number;
    completedWorkflows: number;
    totalWorkflows: number;
    daysRemaining: number;
    urgencyLevel: "urgent" | "warning" | "normal";
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
    members,
    order,
    index,
    onEdit,
    onContact,
}) => {
    // Memoized calculations for performance
    const metrics: CardMetrics = useMemo(() => {
        const allWorkflows = order?.products
            ? Object.values(order.products).flatMap((product) =>
                  product?.workflows ? Object.values(product.workflows) : [],
              )
            : [];

        const completed = allWorkflows.filter((workflow) => workflow?.isDone);
        const progressPercent =
            allWorkflows.length > 0
                ? Math.round((completed.length / allWorkflows.length) * 100)
                : 0;

        const daysRemaining = order?.deliveryDate
            ? Math.ceil(
                  (order.deliveryDate - new Date().getTime()) /
                      (1000 * 60 * 60 * 24),
              )
            : 0;

        const urgencyLevel: CardMetrics["urgencyLevel"] =
            daysRemaining <= 1
                ? "urgent"
                : daysRemaining <= 2
                  ? "warning"
                  : "normal";

        return {
            progressPercent,
            completedWorkflows: completed.length,
            totalWorkflows: allWorkflows.length,
            daysRemaining,
            urgencyLevel,
        };
    }, [order]);

    const cardActions: MenuProps["items"] = [
        {
            key: "edit",
            label: "Cập nhật công đoạn",
            icon: <EditOutlined />,
            onClick: () => onEdit(order),
        },
        {
            key: "contact",
            label: "Liên hệ khách hàng",
            icon: <PhoneOutlined />,
            onClick: () => onContact(order.phone || ""),
        },
    ];

    const columnStyle = columnsKanban.find((col) => col.key === order.status);
    return (
        <Draggable draggableId={order.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`mb-2 transition-transform duration-200 ${
                        snapshot.isDragging
                            ? "rotate-1 scale-105 shadow-lg"
                            : ""
                    }`}
                >
                    <Card
                        onClick={() => onEdit(order)}
                        size="small"
                        className="shadow-sm hover:shadow-md transition-all cursor-pointer w-full"
                        style={{
                            borderLeft: `4px solid ${columnStyle?.color || "#3f3f46"}`,
                            backgroundColor: "#27272a",
                            color: "#d9d9d9",
                        }}
                        styles={{
                            body: {
                                padding: "12px",
                                backgroundColor: "#27272a",
                            },
                        }}
                    >
                        <div className="space-y-2">
                            {/* Header - Compact Info */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <Text
                                            strong
                                            className="text-sm"
                                            style={{ color: "#fafafa" }}
                                        >
                                            {order.code}
                                        </Text>
                                        {(order as any).type ===
                                            "warranty_claim" && (
                                            <Tag
                                                color="purple"
                                                className="text-xs"
                                            >
                                                Bảo hành
                                            </Tag>
                                        )}
                                    </div>
                                    <Tag
                                        style={{
                                            backgroundColor: "#1677ff",
                                            color: "#fafafa",
                                            border: "none",
                                        }}
                                        icon={<ClockCircleOutlined />}
                                        className="text-xs"
                                    >
                                        {metrics.daysRemaining > 0
                                            ? `${metrics.daysRemaining}d`
                                            : "Quá hạn"}
                                    </Tag>
                                </div>

                                <div
                                    className="flex items-center gap-1 text-xs"
                                    style={{ color: "#d9d9d9" }}
                                >
                                    <UserOutlined className="w-3 h-3" />
                                    <Text
                                        className="truncate"
                                        style={{ color: "#d9d9d9" }}
                                        title={order.customerName}
                                    >
                                        {order.customerName}
                                    </Text>
                                </div>
                            </div>

                            {/* Progress - Compact Display */}
                            <div className="space-y-1">
                                <div
                                    className="flex items-center justify-between text-xs"
                                    style={{ color: "#fafafa" }}
                                >
                                    <span style={{ color: "#fafafa" }}>
                                        Tiến độ
                                    </span>
                                    <span
                                        className="font-medium"
                                        style={{ color: "#fafafa" }}
                                    >
                                        {metrics.completedWorkflows}/
                                        {metrics.totalWorkflows}
                                    </span>
                                </div>
                                <Progress
                                    percent={metrics.progressPercent}
                                    size="small"
                                    status={
                                        metrics.progressPercent === 100
                                            ? "success"
                                            : "active"
                                    }
                                    strokeColor={
                                        metrics.progressPercent === 100
                                            ? "#52c41a"
                                            : columnStyle?.color || "#fadb14"
                                    }
                                    trailColor="#3f3f46"
                                    showInfo={false}
                                    strokeWidth={6}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </Draggable>
    );
};
