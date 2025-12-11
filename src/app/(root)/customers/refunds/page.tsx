"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import RefundManager from "@/components/RefundManager";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { RefundService } from "@/services/refundService";
import {
  RefundStatus,
  RefundStatusLabels,
  RefundStatusOptions,
  RefundType,
  RefundTypeLabels,
  RefundTypeOptions,
  type RefundRequest,
} from "@/types/refund";
import { EditOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { App, Button, Modal, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { Text } = Typography;

// Refund Details Component
const RefundDetails: React.FC<PropRowDetails<RefundRequest>> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  const getStatusColor = (status: RefundStatus) => {
    switch (status) {
      case RefundStatus.PENDING:
        return "orange";
      case RefundStatus.APPROVED:
        return "green";
      case RefundStatus.REJECTED:
        return "red";
      case RefundStatus.PROCESSED:
        return "blue";
      case RefundStatus.CANCELLED:
        return "default";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: RefundType) => {
    switch (type) {
      case RefundType.FULL:
        return "red";
      case RefundType.PARTIAL:
        return "orange";
      case RefundType.COMPENSATION:
        return "purple";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Chi tiết yêu cầu</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <span className="font-medium">Mã đơn hàng:</span>
            <p className="text-gray-600">{data.orderCode}</p>
          </div>
          <div>
            <span className="font-medium">Loại yêu cầu:</span>
            <p className="mt-1">
              <Tag color={getTypeColor(data.type)}>
                {RefundTypeLabels[data.type]}
              </Tag>
            </p>
          </div>
          <div>
            <span className="font-medium">Số tiền:</span>
            <p className="font-semibold text-lg text-red-600">
              {data.amount.toLocaleString("vi-VN")} VNĐ
            </p>
          </div>
          <div>
            <span className="font-medium">Lý do:</span>
            <p className="text-gray-600">{data.reason}</p>
          </div>
          <div>
            <span className="font-medium">Trạng thái:</span>
            <p className="mt-1">
              <Tag color={getStatusColor(data.status)}>
                {RefundStatusLabels[data.status]}
              </Tag>
            </p>
          </div>
          <div>
            <span className="font-medium">Người yêu cầu:</span>
            <p className="text-gray-600">{data.requestedByName || "N/A"}</p>
          </div>
          <div>
            <span className="font-medium">Ngày yêu cầu:</span>
            <p className="text-gray-600">
              {dayjs(data.requestedAt).format("DD/MM/YYYY HH:mm")}
            </p>
          </div>
          {data.approvedBy && (
            <>
              <div>
                <span className="font-medium">Người duyệt:</span>
                <p className="text-gray-600">{data.approvedByName || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium">Ngày duyệt:</span>
                <p className="text-gray-600">
                  {data.approvedAt
                    ? dayjs(data.approvedAt).format("DD/MM/YYYY HH:mm")
                    : "N/A"}
                </p>
              </div>
            </>
          )}
          {data.rejectedBy && (
            <>
              <div>
                <span className="font-medium">Người từ chối:</span>
                <p className="text-gray-600">{data.rejectedByName || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium">Ngày từ chối:</span>
                <p className="text-gray-600">
                  {data.rejectedAt
                    ? dayjs(data.rejectedAt).format("DD/MM/YYYY HH:mm")
                    : "N/A"}
                </p>
              </div>
              {data.rejectionReason && (
                <div>
                  <span className="font-medium">Lý do từ chối:</span>
                  <p className="text-gray-600">{data.rejectionReason}</p>
                </div>
              )}
            </>
          )}
          {data.processedBy && (
            <>
              <div>
                <span className="font-medium">Người xử lý:</span>
                <p className="text-gray-600">{data.processedByName || "N/A"}</p>
              </div>
              <div>
                <span className="font-medium">Ngày xử lý:</span>
                <p className="text-gray-600">
                  {data.processedDate
                    ? dayjs(data.processedDate).format("DD/MM/YYYY HH:mm")
                    : "N/A"}
                </p>
              </div>
            </>
          )}
          {data.notes && (
            <div>
              <span className="font-medium">Ghi chú:</span>
              <p className="text-gray-600">{data.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [editingRefund, setEditingRefund] = useState<
    RefundRequest | undefined
  >();
  const router = useRouter();
  const { message } = App.useApp();
  const { query, applyFilter, updateQueries, reset } = useFilter();
  const filteredRefunds = applyFilter(refunds);

  useEffect(() => {
    const unsubscribe = RefundService.onSnapshot((data) => {
      setRefunds(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getStatusColor = (status: RefundStatus) => {
    switch (status) {
      case RefundStatus.PENDING:
        return "orange";
      case RefundStatus.APPROVED:
        return "green";
      case RefundStatus.REJECTED:
        return "red";
      case RefundStatus.PROCESSED:
        return "blue";
      case RefundStatus.CANCELLED:
        return "default";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: RefundType) => {
    switch (type) {
      case RefundType.FULL:
        return "red";
      case RefundType.PARTIAL:
        return "orange";
      case RefundType.COMPENSATION:
        return "purple";
      default:
        return "default";
    }
  };

  const columns: TableColumnsType<RefundRequest> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "orderCode",
      key: "orderCode",
      width: 140,
      render: (code: string) =>
        code ? (
          <Button
            type="link"
            onClick={() => router.push(`/sale/orders/${code}`)}
          >
            {code}
          </Button>
        ) : (
          "N/A"
        ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type: RefundType) => (
        <Tag color={getTypeColor(type)}>{RefundTypeLabels[type]}</Tag>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <Text strong className="text-red-600">
          {amount.toLocaleString("vi-VN")} VNĐ
        </Text>
      ),
      sorter: true,
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: RefundStatus) => (
        <Tag color={getStatusColor(status)}>{RefundStatusLabels[status]}</Tag>
      ),
    },
    {
      title: "Người yêu cầu",
      dataIndex: "requestedByName",
      key: "requestedByName",
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "requestedAt",
      key: "requestedAt",
      render: (date: number) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: true,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          {(record.status === RefundStatus.PENDING ||
            record.status === RefundStatus.APPROVED) && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRefund(record);
                setRefundModalVisible(true);
              }}
              title="Duyệt/Từ chối"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm yêu cầu...",
          filterKeys: [
            "orderCode",
            "reason",
            "requestedByName",
            "approvedByName",
            "rejectedByName",
            "processedByName",
            "notes",
          ],
        },
        filters: {
          fields: [
            {
              label: "Trạng thái",
              name: "status",
              type: "select",
              options: [{ label: "Tất cả", value: "" }, ...RefundStatusOptions],
            },
            {
              label: "Loại",
              name: "type",
              type: "select",
              options: [{ label: "Tất cả", value: "" }, ...RefundTypeOptions],
            },
          ],
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
      }}
      isLoading={loading}
    >
      <CommonTable
        dataSource={filteredRefunds.sort(
          (a, b) => b.requestedAt - a.requestedAt
        )}
        columns={columns}
        loading={loading}
        DrawerDetails={RefundDetails}
        paging={true}
        rank={true}
      />

      {/* Refund Management Modal */}
      {editingRefund && (
        <Modal
          title="Quản lý yêu cầu hoàn tiền"
          open={refundModalVisible}
          onCancel={() => {
            setRefundModalVisible(false);
            setEditingRefund(undefined);
          }}
          footer={null}
          width={600}
        >
          <RefundManager
            refundId={editingRefund.id}
            orderCode={editingRefund.orderCode}
            orderTotalAmount={editingRefund.amount}
            mode={
              editingRefund.status === RefundStatus.PENDING
                ? "approve"
                : editingRefund.status === RefundStatus.APPROVED
                ? "process"
                : "view"
            }
            onSuccess={() => {
              setRefundModalVisible(false);
              setEditingRefund(undefined);
            }}
          />
        </Modal>
      )}
    </WrapperContent>
  );
}


