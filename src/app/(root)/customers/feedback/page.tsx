"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import FeedbackForm from "@/components/FeedbackForm";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { FeedbackService } from "@/services/feedbackService";
import {
  FeedbackType,
  FeedbackTypeLabels,
  FeedbackTypeOptions,
  type CustomerFeedback,
} from "@/types/feedback";
import { EyeOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { App, Button, Modal, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { Text } = Typography;

// Feedback Details Component
const FeedbackDetails: React.FC<PropRowDetails<CustomerFeedback>> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  const getFeedbackColor = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.PRAISE:
        return "green";
      case FeedbackType.NEUTRAL:
        return "blue";
      case FeedbackType.COMPLAINT:
        return "orange";
      case FeedbackType.ANGRY:
        return "red";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Chi tiết Feedback</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <span className="font-medium">Mã đơn hàng:</span>
            <p className="text-gray-600">{data.orderCode}</p>
          </div>
          <div>
            <span className="font-medium">Khách hàng:</span>
            <p className="text-gray-600">{data.customerName}</p>
          </div>
          <div>
            <span className="font-medium">Số điện thoại:</span>
            <p className="text-gray-600">{data.customerPhone}</p>
          </div>
          <div>
            <span className="font-medium">Loại feedback:</span>
            <p className="mt-1">
              <Tag color={getFeedbackColor(data.feedbackType)}>
                {FeedbackTypeLabels[data.feedbackType]}
              </Tag>
            </p>
          </div>
          {data.rating && (
            <div>
              <span className="font-medium">Đánh giá:</span>
              <p className="text-gray-600">{data.rating} / 5 sao</p>
            </div>
          )}
          {data.notes && (
            <div>
              <span className="font-medium">Ghi chú:</span>
              <p className="text-gray-600">{data.notes}</p>
            </div>
          )}
          <div>
            <span className="font-medium">Thu thập bởi:</span>
            <p className="text-gray-600">{data.collectedByName || "N/A"}</p>
          </div>
          <div>
            <span className="font-medium">Ngày thu thập:</span>
            <p className="text-gray-600">
              {dayjs(data.collectedAt).format("DD/MM/YYYY HH:mm")}
            </p>
          </div>
          {data.requiresReService && (
            <div>
              <span className="font-medium">Yêu cầu xử lý lại:</span>
              <p className="text-red-600 font-semibold">Có</p>
              {data.reServiceOrderId && (
                <p className="text-gray-600 text-sm">
                  Đơn xử lý lại: {data.reServiceOrderId}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<
    CustomerFeedback | undefined
  >();
  const { message } = App.useApp();
  const router = useRouter();
  const { query, applyFilter, updateQueries, reset } = useFilter();
  const filteredFeedbacks = applyFilter(feedbacks);

  useEffect(() => {
    const unsubscribe = FeedbackService.onSnapshot((data) => {
      setFeedbacks(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getFeedbackColor = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.PRAISE:
        return "green";
      case FeedbackType.NEUTRAL:
        return "blue";
      case FeedbackType.COMPLAINT:
        return "orange";
      case FeedbackType.ANGRY:
        return "red";
      default:
        return "default";
    }
  };

  const columns: TableColumnsType<CustomerFeedback> = [
    {
      title: "Mã đơn hàng",
      dataIndex: "orderCode",
      key: "orderCode",
      sorter: true,
      render: (code: string, record) => (
        <Button type="link" onClick={() => router.push(`/sale/orders/${code}`)}>
          {code}
        </Button>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      sorter: true,
    },
    {
      title: "Số điện thoại",
      dataIndex: "customerPhone",
      key: "customerPhone",
    },
    {
      title: "Loại feedback",
      dataIndex: "feedbackType",
      key: "feedbackType",
      render: (type: FeedbackType) => (
        <Tag color={getFeedbackColor(type)}>{FeedbackTypeLabels[type]}</Tag>
      ),
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      render: (rating?: number) => (rating ? `${rating}/5` : "N/A"),
    },
    {
      title: "Ngày thu thập",
      dataIndex: "collectedAt",
      key: "collectedAt",
      render: (date: number) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: true,
    },
    {
      title: "Yêu cầu xử lý lại",
      dataIndex: "requiresReService",
      key: "requiresReService",
      render: (requires: boolean) => (
        <Tag color={requires ? "red" : "green"}>
          {requires ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => {
              setEditingFeedback(record);
              setFormVisible(true);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm feedback...",
          filterKeys: ["orderCode", "customerName", "customerPhone", "notes"],
        },
        filters: {
          fields: [
            {
              label: "Loại feedback",
              name: "feedbackType",
              type: "select",
              options: [{ label: "Tất cả", value: "" }, ...FeedbackTypeOptions],
            },
            {
              label: "Yêu cầu xử lý lại",
              name: "requiresReService",
              type: "select",
              options: [
                { label: "Tất cả", value: "" },
                { label: "Có", value: true },
                { label: "Không", value: false },
              ],
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
        dataSource={filteredFeedbacks.reverse()}
        columns={columns}
        loading={loading}
        DrawerDetails={FeedbackDetails}
        paging={true}
        rank={true}
      />

      <Modal
        title={editingFeedback ? "Chi tiết Feedback" : "Thêm Feedback"}
        open={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingFeedback(undefined);
        }}
        footer={null}
        width={600}
      >
        {editingFeedback && (
          <FeedbackForm
            orderId={editingFeedback.orderId}
            orderCode={editingFeedback.orderCode}
            customerName={editingFeedback.customerName}
            customerPhone={editingFeedback.customerPhone}
            customerId={editingFeedback.customerId}
            initialFeedback={editingFeedback}
            onSuccess={() => {
              setFormVisible(false);
              setEditingFeedback(undefined);
            }}
            onCancel={() => {
              setFormVisible(false);
              setEditingFeedback(undefined);
            }}
          />
        )}
      </Modal>
    </WrapperContent>
  );
}


