"use client";

import ButtonCall from "@/components/ButtonCall";
import { IMembers } from "@/types/members";
import {
  FirebaseDepartments,
  FirebaseOrderData,
  FirebaseWorkflowData,
  Workflow,
} from "@/types/order";
import { formatCurrency } from "@/utils/formatCurrency";
import { DeleteOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Checkbox,
  Col,
  Collapse,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const { Text, Title } = Typography;

// Workflow Update Modal Component
interface WorkflowUpdateModalProps {
  visible: boolean;
  order: (FirebaseOrderData & { id: string }) | null;
  onCancel: () => void;
  onSave: (orderCode: string, updatedOrder: FirebaseOrderData) => void;
  members: Record<string, IMembers>;
  workflows: Record<string, Workflow>;
  departments: FirebaseDepartments;
}

export const WorkflowUpdateModal: React.FC<WorkflowUpdateModalProps> = ({
  visible,
  order,
  onCancel,
  onSave,
  members,
  workflows,
  departments,
}) => {
  const [form] = Form.useForm();
  const router = useRouter();
  const [localOrder, setLocalOrder] = useState<
    (FirebaseOrderData & { id: string }) | null
  >(null);
  const { message } = App.useApp();

  useEffect(() => {
    if (!order) return;

    const normalizeOrder = (
      input: FirebaseOrderData & { id: string },
      workflowTemplates: Record<string, Workflow>
    ): FirebaseOrderData & { id: string } => {
      if (!input.products) return input;

      const normalizedProducts = Object.entries(input.products).reduce(
        (acc, [productId, product]) => {
          const productWorkflows = product.workflows || {};
          const normalizedWorkflows = Object.entries(productWorkflows).reduce(
            (wfAcc, [workflowId, workflow]) => {
              const codes = workflow.workflowCode || [];
              // If multiple codes were stored in one row, split them into separate rows
              if (Array.isArray(codes) && codes.length > 1) {
                codes.forEach((code, idx) => {
                  const workflowTemplate = workflowTemplates[code];
                  const name =
                    workflow.workflowName?.[idx] ||
                    workflow.workflowName?.[0] ||
                    (workflowTemplate ? workflowTemplate.name : "") ||
                    "";
                  const newId = `${workflowId}-${idx}`;
                  wfAcc[newId] = {
                    ...workflow,
                    workflowCode: [code],
                    workflowName: name ? [name] : [],
                    members: [], // reset members to avoid wrong mapping after split
                  };
                });
              } else {
                wfAcc[workflowId] = workflow;
              }
              return wfAcc;
            },
            {} as Record<string, FirebaseWorkflowData>
          );

          acc[productId] = {
            ...product,
            workflows: normalizedWorkflows,
          };
          return acc;
        },
        {} as typeof input.products
      );

      return {
        ...input,
        products: normalizedProducts,
      };
    };

    const normalized = normalizeOrder(order, workflows);

    setLocalOrder(normalized);
    form.setFieldsValue({
      customerName: normalized.customerName,
      phone: normalized.phone,
      email: normalized.email,
      address: normalized.address,
      deliveryDate: normalized.deliveryDate ? dayjs(normalized.deliveryDate) : null,
      notes: normalized.notes || "",
    });
  }, [order, form]);

  const membersOptions = Object.entries(members).map(([id, membersMember]) => ({
    value: id,
    label: `${membersMember.name} (${membersMember.role})`,
  }));

  const workflowOptions = Object.entries(workflows).map(([id, workflow]) => ({
    value: id,
    label: workflow.name,
  }));

  // Custom tag render for displaying member names in Select
  const customTagRender = (props: any) => {
    const { label, value, closable, onClose } = props;
    const memberData = members[value];
    const memberName = memberData ? memberData.name : value; // Fallback to ID if name not found
    return (
      <Tag closable={closable} onClose={onClose} style={{ marginRight: 3 }}>
        {memberName}
      </Tag>
    );
  };

  // Custom tag render for displaying workflow fullLabel in Select
  const customWorkflowTagRender = (props: any) => {
    const { label, value, closable, onClose } = props;
    const workflowData = workflows[value];
    const workflowLabel = workflowData
      ? `${workflowData.name} (${value})`
      : value;
    return (
      <Tag closable={closable} onClose={onClose} style={{ marginRight: 3 }}>
        {workflowLabel}
      </Tag>
    );
  };

  const addWorkflow = (productId: string) => {
    if (!localOrder || !localOrder.products) return;

    const newWorkflowCode = `workflow_${new Date().getTime()}`;
    const firstWorkflowCode = Object.keys(workflows)[0] || "";
    const firstWorkflowName = workflows[firstWorkflowCode]?.name || "";

    const newWorkflow: FirebaseWorkflowData = {
      departmentCode: "",
      workflowCode: [],
      workflowName: [],
      members: [],
      isDone: false,
      updatedAt: new Date().getTime(),
      price: 0,
    };

    const updatedOrder = {
      ...localOrder,
      products: {
        ...localOrder.products,
        [productId]: {
          ...localOrder.products[productId],
          workflows: {
            ...(localOrder.products[productId]?.workflows || {}),
            [newWorkflowCode]: newWorkflow,
          },
        },
      },
    };

    setLocalOrder(updatedOrder);
  };

  const updateWorkflow = (
    productId: string,
    workflowCode: string,
    field: string,
    value: any
  ) => {
    if (!localOrder || !localOrder.products || !localOrder.products[productId])
      return;

    const workflow = localOrder.products[productId].workflows?.[workflowCode];
    if (!workflow) return;

    let updatedWorkflow = { ...workflow };

    if (field === "departmentCode") {
      updatedWorkflow = {
        ...updatedWorkflow,
        departmentCode: value,
        workflowCode: [], // Reset workflow to an empty array
        workflowName: [], // Reset workflow names
        members: [], // Reset members
      };
    } else if (field === "workflowCode") {
      const selectedCode = Array.isArray(value) ? value[0] : value;
      const selectedName = selectedCode ? workflows[selectedCode]?.name : "";

      updatedWorkflow = {
        ...updatedWorkflow,
        workflowCode: selectedCode ? [selectedCode] : [],
        workflowName: selectedName ? [selectedName] : [],
        members: [], // Clear members when workflow changes
      };
    } else {
      updatedWorkflow = {
        ...updatedWorkflow,
        [field]: value,
        updatedAt: new Date().getTime(),
      };
    }

    const updatedOrder = {
      ...localOrder,
      products: {
        ...localOrder.products,
        [productId]: {
          ...localOrder.products[productId],
          workflows: {
            ...localOrder.products[productId].workflows,
            [workflowCode]: updatedWorkflow,
          },
        },
      },
    };

    setLocalOrder(updatedOrder);
  };

  const removeWorkflow = (productId: string, workflowCode: string) => {
    if (!localOrder || !localOrder.products || !localOrder.products[productId])
      return;

    const productWorkflows = localOrder.products[productId].workflows || {};
    const { [workflowCode]: removedWorkflow, ...remainingWorkflows } =
      productWorkflows;

    const updatedOrder = {
      ...localOrder,
      products: {
        ...localOrder.products,
        [productId]: {
          ...localOrder.products[productId],
          workflows: remainingWorkflows,
        },
      },
    };

    setLocalOrder(updatedOrder);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!localOrder) return;

      const updatedOrder = {
        ...localOrder,
        customerName: values.customerName,
        phone: values.phone,
        email: values.email,
        address: values.address,
        deliveryDate: values.deliveryDate.valueOf(),
        notes: values.notes,
        updatedAt: new Date().getTime(),
      };

      onSave(localOrder.id, updatedOrder);
      message.success("Đã cập nhật đơn hàng thành công!");
      onCancel();
    } catch (error) {
      message.error("Vui lòng kiểm tra lại thông tin!");
    }
  };

  if (!localOrder) return null;

  // Check if this is a warranty claim
  const isWarrantyClaim = (localOrder as any)?.type === "warranty_claim";
  const detailUrl = isWarrantyClaim
    ? `/sale/warranty/${localOrder.code}`
    : `/sale/orders/${localOrder.code}`;

  return (
    <Modal
      title={
        <div className="flex items-center gap-4">
          <div>
            <Text strong className="text-lg">
              {isWarrantyClaim
                ? "Cập nhật phiếu bảo hành"
                : "Cập nhật đơn hàng"}
              : {localOrder.code}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="default"
              icon={<EyeOutlined />}
              onClick={() => router.push(detailUrl)}
            >
              Xem chi tiết
            </Button>
            {localOrder.phone && <ButtonCall phone={localOrder.phone} />}
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      width={1200}
      okText="Lưu"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Tên khách hàng" name="customerName">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Số điện thoại" name="phone">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Ngày giao" name="deliveryDate">
              <DatePicker disabled className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Địa chỉ" name="address">
              <Input.TextArea rows={2} disabled />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Ghi chú" name="notes">
          <Input.TextArea rows={3} disabled />
        </Form.Item>
      </Form>

      <div className="mt-6">
        <Title level={4}>Sản phẩm và công đoạn</Title>
        <Collapse
          defaultActiveKey={
            localOrder.products ? Object.keys(localOrder.products) : []
          }
          items={
            localOrder.products
              ? Object.entries(localOrder.products).map(
                  ([productId, product]) => {
                    const completedWorkflows = Object.values(
                      product.workflows || {}
                    ).filter((workflow) => workflow.isDone).length;
                    const totalWorkflows = Object.values(
                      product.workflows || {}
                    ).length;
                    const progressPercent =
                      totalWorkflows > 0
                        ? Math.round(
                            (completedWorkflows / totalWorkflows) * 100
                          )
                        : 0;

                    return {
                      key: productId,
                      label: (
                        <div className="flex justify-between items-center">
                          <div>
                            <Text strong>{product.name}</Text>
                            <br />
                            <Text type="secondary" className="text-sm">
                              {formatCurrency(product.price)} • SL:{" "}
                              {product.quantity}
                            </Text>
                          </div>
                          <div className="flex items-center gap-2">
                            <Tag
                              color={
                                progressPercent === 100
                                  ? "success"
                                  : "processing"
                              }
                            >
                              {progressPercent === 100
                                ? "Hoàn thành"
                                : "Đang thực hiện"}
                            </Tag>
                            <Progress
                              type="circle"
                              size={40}
                              percent={progressPercent}
                              format={() =>
                                `${completedWorkflows}/${totalWorkflows}`
                              }
                            />
                          </div>
                        </div>
                      ),
                      children: (
                        <div className="pl-4">
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => addWorkflow(productId)}
                            className="mb-4"
                            size="small"
                            style={{ marginBottom: 10 }}
                          >
                            Thêm công đoạn
                          </Button>

                          {/* Workflows Table */}
                          {Object.keys(product.workflows || {}).length > 0 ? (
                            <div className="overflow-hidden mb-4">
                              <Table
                                dataSource={Object.entries(
                                  product.workflows || {}
                                ).map(([workflowId, workflow]) => ({
                                  ...workflow,
                                  key: workflowId,
                                  id: workflowId,
                                  stt:
                                    Object.keys(
                                      product.workflows || {}
                                    ).findIndex((k) => k === workflowId) + 1,
                                }))}
                                pagination={false}
                                size="small"
                                className="workflows-table"
                                columns={[
                                  {
                                    title: "#",
                                    dataIndex: "stt",
                                    key: "stt",
                                    width: 60,
                                    align: "center" as const,
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
                                    width: "20%",
                                    render: (value, record) => {
                                      const departmentOptions = departments
                                        ? Object.keys(departments).map(
                                            (code) => ({
                                              value: code,
                                              label: departments[code].name,
                                            })
                                          )
                                        : [];

                                      return (
                                        <Select
                                          value={value || ""}
                                          placeholder="Chọn phòng ban"
                                          onChange={(newValue) =>
                                            updateWorkflow(
                                              productId,
                                              record.key,
                                              "departmentCode",
                                              newValue
                                            )
                                          }
                                          className="w-full"
                                          size="small"
                                        >
                                          {departmentOptions.map((opt) => (
                                            <Select.Option
                                              key={opt.value}
                                              value={opt.value}
                                            >
                                              {opt.label}
                                            </Select.Option>
                                          ))}
                                        </Select>
                                      );
                                    },
                                  },
                                  {
                                    title: "Công đoạn",
                                    dataIndex: "workflowCode",
                                    key: "workflowCode",
                                    width: "30%",
                                    render: (value, record, index) => {
                                      console.log(
                                        "Công đoạn - record.workflowCode:",
                                        record.workflowCode
                                      );

                                      const departmentCode =
                                        record.departmentCode;
                                      const availableWorkflows =
                                        departmentCode && workflows
                                          ? Object.entries(workflows)
                                              .filter(
                                                ([_, wf]: [string, any]) =>
                                                  wf.department ===
                                                  departmentCode
                                              )
                                              .map(
                                                ([code, wf]: [
                                                  string,
                                                  any
                                                ]) => ({
                                                  value: code,
                                                  label: wf.name,
                                                  fullLabel: `${wf.name}`,
                                                })
                                              )
                                          : [];

                                      console.log(
                                        "Công đoạn - availableWorkflows:",
                                        availableWorkflows
                                      );

                                      const workflowValue = Array.isArray(value)
                                        ? value[0]
                                        : value;

                                      return (
                                        <Select
                                          value={workflowValue}
                                          placeholder={
                                            departmentCode
                                              ? "Chọn công đoạn"
                                              : "Chọn phòng ban trước"
                                          }
                                          onChange={(newValue: string) =>
                                            updateWorkflow(
                                              productId,
                                              record.key,
                                              "workflowCode",
                                              newValue
                                            )
                                          }
                                          className="w-full"
                                          size="small"
                                          disabled={!departmentCode}
                                          showSearch={{
                                            optionFilterProp: "children",
                                          }}
                                        >
                                          {availableWorkflows.map((opt) => (
                                            <Select.Option
                                              key={opt.value}
                                              value={opt.value}
                                            >
                                              {opt.fullLabel}
                                            </Select.Option>
                                          ))}
                                        </Select>
                                      );
                                    },
                                  },
                                  {
                                    title: "Nhân viên thực hiện",
                                    dataIndex: "members",
                                    key: "members",
                                    width: "30%",
                                    render: (value: string[], record) => {
                                      const departmentCode =
                                        record.departmentCode;

                                      // Filter staff by department if department is selected
                                      const filteredStaffOptions =
                                        departmentCode
                                          ? Object.entries(members)
                                              .filter(([id]) =>
                                                members[
                                                  id
                                                ]?.departments?.includes(
                                                  departmentCode
                                                )
                                              )
                                              .map(([id, memberData]) => ({
                                                value: id,
                                                label: `${memberData.name} (${memberData.role})`,
                                              }))
                                          : [];

                                      return (
                                        <Select
                                          mode="multiple"
                                          placeholder={
                                            record.workflowCode?.length
                                              ? "Chọn nhân viên"
                                              : "Chọn công đoạn trước"
                                          }
                                          value={value}
                                          onChange={(newValue) =>
                                            updateWorkflow(
                                              productId,
                                              record.key,
                                              "members",
                                              newValue
                                            )
                                          }
                                          className="w-full"
                                          size="small"
                                          maxTagCount={2}
                                          disabled={
                                            !record.workflowCode?.length
                                          }
                                          tagRender={customTagRender}
                                        >
                                          {filteredStaffOptions.map(
                                            (option) => (
                                              <Select.Option
                                                key={option.value}
                                                value={option.value}
                                              >
                                                {option.label}
                                              </Select.Option>
                                            )
                                          )}
                                        </Select>
                                      );
                                    },
                                  },
                                  {
                                    title: "Ghi chú",
                                    dataIndex: "note",
                                    key: "note",
                                    width: "20%",
                                    render: (value, record) => (
                                      <Input
                                        placeholder="Nhắc nhở cho công đoạn sau"
                                        size="small"
                                        value={value}
                                        onChange={(e) =>
                                          updateWorkflow(
                                            productId,
                                            record.key,
                                            "note",
                                            e.target.value
                                          )
                                        }
                                      />
                                    ),
                                  },
                                  {
                                    title: "Giá công",
                                    dataIndex: "price",
                                    key: "price",
                                    width: "15%",
                                    render: (value, record) => (
                                      <InputNumber
                                        placeholder="Nhập giá"
                                        size="small"
                                        value={value || 0}
                                        min={0}
                                        formatter={(value) =>
                                          `${value}`.replace(
                                            /\B(?=(\d{3})+(?!\d))/g,
                                            ","
                                          )
                                        }
                                        parser={(value) =>
                                          Number(
                                            value?.replace(/,/g, "") || 0
                                          ) as any
                                        }
                                        addonAfter="VNĐ"
                                        className="w-full"
                                        onChange={(newValue) =>
                                          updateWorkflow(
                                            productId,
                                            record.key,
                                            "price",
                                            newValue || 0
                                          )
                                        }
                                      />
                                    ),
                                  },
                                  {
                                    title: "Trạng thái",
                                    dataIndex: "isDone",
                                    key: "isDone",
                                    width: "12%",
                                    render: (value, record, index) => (
                                      <Checkbox
                                        checked={value}
                                        onChange={(e) =>
                                          updateWorkflow(
                                            productId,
                                            record.key,
                                            "isDone",
                                            e.target.checked
                                          )
                                        }
                                      />
                                    ),
                                  },
                                  {
                                    title: "Đã duyệt",
                                    dataIndex: "isApproved",
                                    key: "isApproved",
                                    width: "15%",
                                    render: (value, record) => (
                                      <Checkbox
                                        checked={Boolean(value)}
                                        onChange={(e) =>
                                          updateWorkflow(
                                            productId,
                                            record.key,
                                            "isApproved",
                                            e.target.checked
                                          )
                                        }
                                      />
                                    ),
                                  },
                                  {
                                    title: "Thao tác",
                                    key: "action",
                                    width: 80,
                                    align: "center" as const,
                                    render: (_, record) => (
                                      <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() =>
                                          removeWorkflow(productId, record.key)
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
                                Chưa có công đoạn nào. Nhấn "Thêm công đoạn" để
                                bắt đầu.
                              </Text>
                            </div>
                          )}
                        </div>
                      ),
                    };
                  }
                )
              : []
          }
        />
      </div>
    </Modal>
  );
};
