import { KanbanCard } from "@/components/KanbanCard";
import WrapperContent from "@/components/WrapperContent";
import { columnsKanban } from "@/configs/table";
import { database } from "@/firebase";
import { useRealtimeList } from "@/firebase/hooks/useRealtimeList";
import useFilter from "@/hooks/useFilter";
import { IMembers } from "@/types/members";
import {
  DiscountType,
  FirebaseOrderData,
  FirebaseProductData,
  FirebaseStaff,
  FirebaseWorkflowData,
  OrderStatus,
  ProductData,
} from "@/types/order";
import { PlusOutlined } from "@ant-design/icons";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { App, Badge, Empty, Typography } from "antd";
import "dayjs/locale/vi";
import { ref, update } from "firebase/database";
import { useRouter } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import { StatusUpdateModal } from "@/components/StatusUpdateModal";

const { Text, Title } = Typography;

// Firebase update function
const updateOrderInFirebase = async (
  orderCode: string,
  updates: Partial<FirebaseOrderData>
) => {
  try {
    const orderRef = ref(database, `xoxo/orders/${orderCode}`);
    await update(orderRef, updates);
    console.log("✅ Updated order in Firebase:", orderCode, updates);
  } catch (error) {
    console.error("❌ Failed to update order in Firebase:", error);
    throw error;
  }
};

interface Workflow {
  name: string;
}

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
  const { data: membersData, isLoading: membersLoading } =
    useRealtimeList<FirebaseStaff>("xoxo/members");
  const { data: workflowsData, isLoading: workflowsLoading } =
    useRealtimeList<Workflow>("xoxo/workflows");
  const router = useRouter();

  // Use useFilter hook for filtering
  const { query, updateQuery, updateQueries, applyFilter, reset } = useFilter({
    status: "all",
    memberId: "all",
  });

  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [orderToUpdateStatus, setOrderToUpdateStatus] = useState<
    (FirebaseOrderData & { id: string; products: ProductData[] }) | null
  >(null);
  const [proposedNewStatus, setProposedNewStatus] = useState<OrderStatus | null>(null);
  const { message } = App.useApp();

  // Use only Firebase data with proper error handling
  const orders = useMemo(() => {
    if (!ordersData || ordersData.length === 0) return [];

    return ordersData.map((item) => {
      const order = {
        id: item.id,
        ...item.data,
        products: Object.entries(item.data?.products || {}).map(([productId, productData]: [string, any]) => ({
          id: productId,
          name: productData.name,
          quantity: productData.quantity,
          price: productData.price || 0,
          commissionPercentage: productData.commissionPercentage || 0,
          images: productData.images || [],
          imagesDone: productData.imagesDone || [],
          workflows: Object.entries(productData.workflows || {}).map(([workflowId, workflowDetails]: [string, any]) => ({
            id: workflowId,
            departmentCode: workflowDetails.departmentCode,
            workflowCode: workflowDetails.workflowCode || [],
            workflowName: workflowDetails.workflowName || [],
            members: workflowDetails.members || [],
            isDone: workflowDetails.isDone || false,
            updatedAt: workflowDetails.updatedAt,
          })),
        })) as ProductData[],
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

      return order as FirebaseOrderData & { id: string };
    });
  }, [ordersData]);

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
          // Add other member fields as needed
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
      workflowMap[item.id] = { name: item.data?.name || item.name };
    });
    return workflowMap;
  }, [workflowsData]);

  // Use orders directly instead of local state for better performance
  const workingOrders = orders;

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
  const onDragEnd = useCallback(async (result: DragDropContextProps["onDragEnd"]) => {
    const { destination, source, draggableId } = result;

    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    const draggedOrder = workingOrders.find((order) => order.id === draggableId);
    if (!draggedOrder) {
      message.error("Không tìm thấy đơn hàng để cập nhật.");
      return;
    }

    const newStatus = destination.droppableId as OrderStatus;

    // Set state to open the status update modal
    setOrderToUpdateStatus(draggedOrder);
    setProposedNewStatus(newStatus);
    setIsStatusModalVisible(true);
  }, [workingOrders, message]);

  // Handler for when StatusUpdateModal confirms a status change
  const handleStatusModalConfirm = useCallback(
    async (
      orderCode: string,
      newStatus: OrderStatus,
      isDepositPaid?: boolean,
      deposit?: number,
      depositType?: DiscountType
    ) => {
      try {
        const updates: Partial<FirebaseOrderData> = { status: newStatus };
        if (isDepositPaid !== undefined) {
          updates.isDepositPaid = isDepositPaid;
        }
        if (deposit !== undefined) {
          updates.deposit = deposit;
        }
        if (depositType !== undefined) {
          updates.depositType = depositType;
        }

        // Recalculate depositAmount if necessary before saving
        const currentOrder = workingOrders.find((o) => o.id === orderCode);
        if (currentOrder) {
          const subtotal = (currentOrder.products as ProductData[]).reduce((sum, p) => sum + p.price * p.quantity, 0);
          const discountAmount = currentOrder.discountType === DiscountType.Percentage
              ? (subtotal * (currentOrder.discount || 0)) / 100
              : (currentOrder.discount || 0);
          const orderTotal = subtotal - discountAmount + (currentOrder.shippingFee || 0);

          if (depositType === DiscountType.Percentage && deposit !== undefined) {
              updates.depositAmount = (orderTotal * deposit) / 100;
          } else if (deposit !== undefined) {
              updates.depositAmount = deposit;
          }
        }


        await updateOrderInFirebase(orderCode, updates);
        message.success(`Trạng thái đơn hàng ${orderCode} đã được cập nhật.`);
      } catch (error) {
        message.error("Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.");
        console.error("❌ Error confirming status change:", error);
      } finally {
        setIsStatusModalVisible(false);
        setOrderToUpdateStatus(null);
        setProposedNewStatus(null);
      }
    },
    [message, workingOrders]
  );

  // Handler for when StatusUpdateModal is cancelled
  const handleCancelStatusModal = useCallback(() => {
    setIsStatusModalVisible(false);
    setOrderToUpdateStatus(null);
    setProposedNewStatus(null);
  }, []);

  const handleEditOrder = (
    order: (FirebaseOrderData & { id: string; products: ProductData[] }) | null
  ) => {
    router.push(`/sale/orders/${order?.id}/update`); // Navigate to update page
  };

  return (
    <WrapperContent<FirebaseOrderData>
      isLoading={ordersLoading || membersLoading || workflowsLoading}
      isEmpty={workingOrders.length === 0}
      header={{
        buttonEnds: [
          {
            name: "Tạo đơn hàng",
            icon: <PlusOutlined />,
            type: "primary",
                          onClick: () => router.push("/sale/orders/create"),          },
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
            // {
            //   name: "priority",
            //   type: "select",
            //   label: "Độ ưu tiên",
            //   options: [
            //     { value: "all", label: "Tất cả mức độ" },
            //     { value: "urgent", label: "Khẩn cấp" },
            //     { value: "high", label: "Cao" },
            //     { value: "normal", label: "Bình thường" },
            //     { value: "low", label: "Thấp" },
            //   ],
            // },
            {
              name: "status",
              type: "select",
              label: "Trạng thái",
              options: [
                { value: "all", label: "Tất cả trạng thái" },
                { value: OrderStatus.PENDING, label: "Chờ xử lý" },
                { value: OrderStatus.IN_PROGRESS, label: "Đang thực hiện" },
                { value: OrderStatus.ON_HOLD, label: "Tạm dừng" },
                { value: OrderStatus.COMPLETED, label: "Hoàn thành" },
                { value: OrderStatus.CANCELLED, label: "Đã hủy" },
              ],
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

        {/* Status Update Modal */}
        <StatusUpdateModal
          visible={isStatusModalVisible}
          order={orderToUpdateStatus}
          products={orderToUpdateStatus?.products || []}
          currentStatus={orderToUpdateStatus?.status || OrderStatus.PENDING}
          proposedNextStatus={proposedNewStatus}
          onConfirm={handleStatusModalConfirm}
          onCancel={handleCancelStatusModal}
          members={members}
          workflows={workflows}
          departments={departments}
        />
      </div>
    </WrapperContent>
  );
};

export default KanbanBoard;
