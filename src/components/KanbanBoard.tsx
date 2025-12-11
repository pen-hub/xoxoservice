"use client";

import { KanbanCard } from "@/components/KanbanCard";
import { WorkflowUpdateModal } from "@/components/WorkflowUpdateModal";
import WrapperContent from "@/components/WrapperContent";
import { columnsKanban } from "@/configs/table";
import { database } from "@/firebase";
import { useRealtimeList } from "@/firebase/hooks/useRealtimeList";
import useFilter from "@/hooks/useFilter";
import { IMembers } from "@/types/members";
import {
  FirebaseDepartments,
  FirebaseOrderData,
  FirebaseProductData,
  FirebaseStaff,
  FirebaseWorkflowData,
  OrderStatus,
} from "@/types/order";
import { WarrantyClaimStatus, type WarrantyClaim } from "@/types/warrantyClaim";
import { PlusOutlined } from "@ant-design/icons";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { App, Badge, Empty, Typography } from "antd";
import "dayjs/locale/vi";
import { ref, update } from "firebase/database";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";

const { Text, Title } = Typography;

// Firebase update function
const updateOrderInFirebase = async (
  orderCode: string,
  updates: Partial<FirebaseOrderData>,
  type: "order" | "warranty_claim" = "order"
) => {
  try {
    const path =
      type === "warranty_claim"
        ? `xoxo/warranty_claims/${orderCode}`
        : `xoxo/orders/${orderCode}`;
    const orderRef = ref(database, path);

    // Map order status back to warranty claim status if needed
    if (type === "warranty_claim" && updates.status) {
      const statusMap: Record<OrderStatus, WarrantyClaimStatus> = {
        [OrderStatus.PENDING]: WarrantyClaimStatus.PENDING,
        [OrderStatus.CONFIRMED]: WarrantyClaimStatus.CONFIRMED,
        [OrderStatus.IN_PROGRESS]: WarrantyClaimStatus.IN_PROGRESS,
        [OrderStatus.ON_HOLD]: WarrantyClaimStatus.ON_HOLD,
        [OrderStatus.COMPLETED]: WarrantyClaimStatus.COMPLETED,
        [OrderStatus.REFUND]: WarrantyClaimStatus.CANCELLED,
        [OrderStatus.CANCELLED]: WarrantyClaimStatus.CANCELLED,
      };
      updates.status = statusMap[updates.status as OrderStatus] as any;
    }

    await update(orderRef, updates);
    console.log("✅ Updated in Firebase:", orderCode, updates);
  } catch (error) {
    console.error("❌ Failed to update in Firebase:", error);
    throw error;
  }
};

interface Workflow {
  name: string;
  department?: string;
}

// const priorityColors = {
//   urgent: { color: "#ff4d4f", text: "Khẩn cấp" },
//   high: { color: "#fa8c16", text: "Cao" },
//   normal: { color: "#52c41a", text: "Bình thường" },
//   low: { color: "#d9d9d9", text: "Thấp" },
// };

// Main Kanban Board Component
interface KanbanBoardProps {
  currentUser?: {
    role: "worker" | "sale" | "manager";
    name: string;
  };
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  currentUser = { role: "manager", name: "Admin" },
}) => {
  // Sử dụng useRealtimeList để lấy dữ liệu từ Firebase
  const { data: ordersData, isLoading: ordersLoading } =
    useRealtimeList<FirebaseOrderData>("xoxo/orders");
  const { data: warrantyClaimsData, isLoading: warrantyClaimsLoading } =
    useRealtimeList<WarrantyClaim>("xoxo/warranty_claims");
  console.log("ordersData:", ordersData);
  const { data: membersData, isLoading: membersLoading } =
    useRealtimeList<FirebaseStaff>("xoxo/members");
  const { data: workflowsData, isLoading: workflowsLoading } =
    useRealtimeList<Workflow>("xoxo/workflows");
  const { data: departmentsData, isLoading: departmentsLoading } =
    useRealtimeList<any>("xoxo/departments");

  // Convert departments data to object format expected by WorkflowUpdateModal
  const departments = useMemo(() => {
    if (!departmentsData || departmentsData.length === 0) return {};
    const departmentsMap: FirebaseDepartments = {};
    departmentsData.forEach((item: any) => {
      departmentsMap[item.id] = item.data || item;
    });
    return departmentsMap;
  }, [departmentsData]);
  const router = useRouter();

  // Use useFilter hook for filtering
  const { query, updateQuery, updateQueries, applyFilter, reset } = useFilter({
    status: "all",
    memberId: "all",
    // priority: "all",
  });

  const [editingOrder, setEditingOrder] = useState<
    (FirebaseOrderData & { id: string }) | null
  >(null);
  const { message } = App.useApp();

  // Use only Firebase data with proper error handling
  const orders = useMemo(() => {
    if (!ordersData || ordersData.length === 0) return [];

    return ordersData.map((item) => {
      const order = {
        id: item.id,
        ...item.data,
        products: item.data?.products || {},
        type: "order" as const,
      };

      // Calculate total amount if missing
      if (!order.totalAmount && order.products) {
        const productTotal = Object.values(order.products).reduce(
          (total: number, product: any) => {
            return total + product.price * product.quantity;
          },
          0
        );
        order.totalAmount =
          productTotal + (order.shippingFee || 0) - (order.discount || 0);
      }

      return order as FirebaseOrderData & { id: string; type: "order" };
    });
  }, [ordersData]);

  // Convert warranty claims to order-like format for Kanban
  const warrantyClaimsAsOrders = useMemo(() => {
    if (!warrantyClaimsData || warrantyClaimsData.length === 0) return [];

    return warrantyClaimsData.map((item) => {
      // Handle WithId format: { id, data }
      const claim: WarrantyClaim = item.data;
      // Map warranty claim status to order status for kanban display
      const statusMap: Record<WarrantyClaimStatus, OrderStatus> = {
        [WarrantyClaimStatus.PENDING]: OrderStatus.PENDING,
        [WarrantyClaimStatus.CONFIRMED]: OrderStatus.CONFIRMED,
        [WarrantyClaimStatus.IN_PROGRESS]: OrderStatus.IN_PROGRESS,
        [WarrantyClaimStatus.ON_HOLD]: OrderStatus.ON_HOLD,
        [WarrantyClaimStatus.COMPLETED]: OrderStatus.COMPLETED,
        [WarrantyClaimStatus.CANCELLED]: OrderStatus.CANCELLED,
      };

      return {
        id: item.id,
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
        status: statusMap[claim.status] || OrderStatus.PENDING,
        totalAmount: claim.totalAmount || 0,
        type: "warranty_claim" as const,
        originalOrderCode: claim.originalOrderCode,
      } as FirebaseOrderData & {
        id: string;
        type: "warranty_claim";
        originalOrderCode: string;
      };
    });
  }, [warrantyClaimsData]);

  console.log("🔍 Debug Firebase Data:");
  console.log("orders length:", orders.length);
  // Convert members and workflows data to objects for compatibility
  const members = useMemo(() => {
    if (!membersData || membersData.length === 0) return {};
    const membersMap: Record<string, IMembers> = membersData.reduce(
      (acc: Record<string, IMembers>, item: any) => {
        acc[item.id] = {
          id: item.id,
          name: item.data?.name || item.name,
          role: item.data?.role || "worker",
          code: item.data?.code || item.code || "",
          phone: item.data?.phone || item.phone || "",
          email: item.data?.email || item.email || "",
          date_of_birth: item.data?.date_of_birth || item.date_of_birth || "",
        };
        return acc;
      },
      {}
    );
    return membersMap;
  }, [membersData]);

  const workflows = useMemo(() => {
    if (!workflowsData || workflowsData.length === 0) return {};
    const workflowMap: Record<string, Workflow> = {};
    workflowsData.forEach((item: any) => {
      workflowMap[item.id] = {
        name: item.data?.name || item.name,
        department: item.data?.department || item.department,
      };
    });
    return workflowMap;
  }, [workflowsData]);

  // Merge orders and warranty claims
  const workingOrders = useMemo(() => {
    return [...orders, ...warrantyClaimsAsOrders];
  }, [orders, warrantyClaimsAsOrders]);

  // Get unique members members
  const allStaff = useMemo(() => {
    const membersSet = new Set<string>();
    workingOrders.forEach((order: FirebaseOrderData) => {
      if (order?.products) {
        Object.values(order.products).forEach(
          (product: FirebaseProductData) => {
            if (product?.workflows) {
              Object.values(product.workflows).forEach(
                (workflow: FirebaseWorkflowData) => {
                  if (workflow?.members) {
                    workflow.members.forEach((memberId: string) => {
                      const membersMember = members[memberId];
                      if (membersMember) membersSet.add(membersMember.name);
                    });
                  }
                }
              );
            }
          }
        );
      }
    });
    return Array.from(membersSet);
  }, [workingOrders, members]);

  // Apply filters using useFilter hook with custom member filtering
  const filteredOrders = useMemo(() => {
    let filtered = workingOrders;

    // First apply useFilter for standard fields (priority, status)
    filtered = applyFilter(filtered);

    // Then apply custom member filtering for search,memberName
    if (query["search,memberName"] && query["search,memberName"] !== "all") {
      const memberName = query["search,memberName"];
      filtered = filtered.filter(
        (order: any) =>
          order?.products &&
          Object.values(order.products).some(
            (product: any) =>
              product?.workflows &&
              Object.values(product.workflows).some(
                (workflow: any) =>
                  workflow?.members &&
                  workflow.members.some(
                    (memberId: any) => members[memberId]?.name === memberName
                  )
              )
          )
      );
    }

    return filtered;
  }, [workingOrders, applyFilter, query, members]);

  // Group orders by column
  const getOrdersForColumn = (columnKey: OrderStatus) => {
    return filteredOrders.filter(
      (order: FirebaseOrderData) => order.status === columnKey
    );
  };

  // Handle drag end with Firebase update
  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (
        !destination ||
        (destination.droppableId === source.droppableId &&
          destination.index === source.index)
      ) {
        return;
      }

      // Prevent dragging from or to PENDING status
      if (
        source.droppableId === OrderStatus.PENDING ||
        destination.droppableId === OrderStatus.PENDING
      ) {
        message.warning("Đơn hàng này chưa được xác nhận!");
        return;
      }

      const newStatus = destination.droppableId as OrderStatus;

        // Find the order/claim to determine its type
        const item = workingOrders.find((o) => o.id === draggableId);
      if (!item) {
        message.error("Không tìm thấy đơn hàng!");
        return;
      }

      // Check if all workflows are completed before moving to ON_HOLD
      if (newStatus === OrderStatus.ON_HOLD) {
        const allWorkflowsCompleted = (() => {
          if (!item.products || Object.keys(item.products).length === 0) {
            return true; // No products means no workflows to check
          }

          // Check all workflows in all products
          for (const product of Object.values(item.products)) {
            if (
              !product.workflows ||
              Object.keys(product.workflows).length === 0
            ) {
              continue; // No workflows in this product
            }

            // Check if all workflows in this product are done
            for (const workflow of Object.values(product.workflows)) {
              if (!workflow.isDone) {
                return false; // Found an incomplete workflow
              }
            }
          }

          return true; // All workflows are completed
        })();

        if (!allWorkflowsCompleted) {
          message.warning(
            "Không thể chuyển sang trạng thái Thanh toán. Vui lòng hoàn thành tất cả các công đoạn trước!"
          );
          return;
        }
      }

        const itemType = (item as any)?.type || "order";

      try {
        // Update in Firebase immediately
        await updateOrderInFirebase(
          draggableId,
          {
            status: newStatus,
          },
          itemType as "order" | "warranty_claim"
        );
        console.log("✅ Successfully moved to", newStatus);
      } catch (error) {
        message.error("Không thể di chuyển. Vui lòng thử lại.");
        console.error("❌ Failed to update:", error);
        // Could show error message to user here
      }
    },
    [message, workingOrders]
  );

  const handleEditOrder = (
    order: (FirebaseOrderData & { id: string }) | null
  ) => {
    console.log("handleEditOrder order:", order, ordersData);
    setEditingOrder(order);
  };

  const handleSaveOrder = async (
    orderCode: string,
    updatedOrder: Partial<FirebaseOrderData>
  ) => {
    try {
      // Find the order/claim to determine its type
      const item = workingOrders.find((o) => o.id === orderCode);
      const itemType = (item as any)?.type || "order";

      await updateOrderInFirebase(
        orderCode,
        updatedOrder,
        itemType as "order" | "warranty_claim"
      );
      console.log("✅ Saved to Firebase successfully");
    } catch (error) {
      console.error("❌ Failed to save:", error);
    }
  };

  const handleContactCustomer = (phone: string) => {
    console.log("Contact customer:", phone);
    // Open dialer or contact app
  };

  return (
    <WrapperContent<FirebaseOrderData>
      isLoading={
        ordersLoading ||
        warrantyClaimsLoading ||
        membersLoading ||
        workflowsLoading ||
        departmentsLoading
      }
      isEmpty={workingOrders.length === 0}
      header={{
        buttonEnds: [
          {
            can: true,
            name: "Tạo đơn hàng",
            icon: <PlusOutlined />,
            type: "primary",
            onClick: () => router.push("/sale/orders/create"),
          },
        ],
        searchInput: {
          placeholder: "Tìm kiếm đơn hàng, khách hàng...",
          filterKeys: ["code", "customerName"],
        },
        filters: {
          query: query,
          onApplyFilter: updateQueries,
          onReset: reset,
          fields: [
            {
              name: "search,memberName",
              type: "select",
              label: "Nhân viên",
              options: [
                { value: "all", label: "Tất cả nhân viên" },
                ...allStaff.map((member) => ({
                  value: member,
                  label: member,
                })),
              ],
            },
            {
              name: "status",
              type: "select",
              label: "Trạng thái",
              options: [
                { value: "all", label: "Tất cả trạng thái" },
                { value: OrderStatus.PENDING, label: "Chờ xác nhận" },
                { value: OrderStatus.CONFIRMED, label: "Lên đơn" },
                { value: OrderStatus.IN_PROGRESS, label: "Sản xuất" },
                { value: OrderStatus.ON_HOLD, label: "Thanh toán" },
                { value: OrderStatus.COMPLETED, label: "CSKH" },
              ],
            },
            {
              name: "createdAt",
              label: "Ngày tạo",
              type: "dateRange",
            },
          ],
        },
      }}
    >
      <div className="space-y-6">
        {/* Custom scrollbar styles */}
        <style jsx>{`
          .kanban-scroll::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .kanban-scroll::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 3px;
          }
          .kanban-scroll::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 3px;
          }
          .kanban-scroll::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
        `}</style>

        {/* Order count info */}
        {/* <div className="bg-white p-4 rounded-lg shadow-sm border">
          <Text type="secondary" className="text-base">
            Tổng cộng: <Text strong>{workingOrders.length} đơn hàng</Text>
          </Text>
        </div> */}

        {/* Kanban Columns with Drag & Drop */}
        <div className="overflow-x-auto pb-4 kanban-scroll">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-3 min-w-max">
              {columnsKanban.map((column) => {
                const columnOrders = getOrdersForColumn(column.status);

                return (
                  <div key={column.key} className="shrink-0 w-80">
                    <div
                      className="rounded-lg p-3 h-[600px] w-full border border-gray-200 flex flex-col"
                      style={{ backgroundColor: column.bgColor }}
                    >
                      {/* Column Header */}
                      <div className="flex justify-between items-center mb-4 shrink-0">
                        <Title
                          level={5}
                          style={{ color: column.color, margin: 0 }}
                        >
                          {column.title}
                        </Title>
                        <Badge
                          count={columnOrders.length}
                          style={{ backgroundColor: column.color }}
                        />
                      </div>

                      {/* Droppable Column Content with Vertical Scroll */}
                      <Droppable droppableId={column.status}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`overflow-y-auto flex-1 pr-2 kanban-scroll ${
                              snapshot.isDraggingOver ? "bg-opacity-50" : ""
                            }`}
                          >
                            <div className="space-y-4 gap-4 flex flex-col">
                              {columnOrders.length === 0 ? (
                                <div className="text-center py-8">
                                  <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Không có đơn hàng nào"
                                    className="my-4"
                                  />
                                </div>
                              ) : (
                                columnOrders.map(
                                  (order: any, index: number) => (
                                    <KanbanCard
                                      members={members}
                                      key={order.id}
                                      order={order}
                                      index={index}
                                      onEdit={handleEditOrder}
                                      onContact={handleContactCustomer}
                                    />
                                  )
                                )
                              )}
                            </div>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>

        {/* Workflow Update Modal */}
        <WorkflowUpdateModal
          visible={!!editingOrder}
          order={editingOrder}
          onCancel={() => setEditingOrder(null)}
          onSave={handleSaveOrder}
          members={members}
          workflows={workflows}
          departments={departments}
        />
      </div>
    </WrapperContent>
  );
};

export default KanbanBoard;
