"use client";

import AppointmentCalendar from "@/components/AppointmentCalendar";
import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { AppointmentService } from "@/services/appointmentService";
import { MemberService } from "@/services/memberService";
import {
  AppointmentStatus,
  AppointmentStatusLabels,
  AppointmentStatusOptions,
  type Appointment,
} from "@/types/appointment";
import { ROLES } from "@/types/enum";
import { IMembers } from "@/types/members";
import {
  CalendarOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { TextArea } = Input;
const { Text } = Typography;

// Appointment Details Component
const AppointmentDetails: React.FC<
  PropRowDetails<Appointment> & {
    onEdit?: (appointment: Appointment) => void;
  }
> = ({ data, onClose, onEdit }) => {
  if (!data) return null;

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return "blue";
      case AppointmentStatus.CONFIRMED:
        return "green";
      case AppointmentStatus.COMPLETED:
        return "success";
      case AppointmentStatus.CANCELLED:
        return "default";
      case AppointmentStatus.NO_SHOW:
        return "red";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Chi tiết lịch hẹn</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <span className="font-medium">Khách hàng:</span>
            <p className="text-gray-600">{data.customerName}</p>
          </div>
          <div>
            <span className="font-medium">Số điện thoại:</span>
            <p className="text-gray-600">{data.customerPhone}</p>
          </div>
          {data.orderCode && (
            <div>
              <span className="font-medium">Mã đơn hàng:</span>
              <p className="text-gray-600">{data.orderCode}</p>
            </div>
          )}
          <div>
            <span className="font-medium">Mục đích:</span>
            <p className="text-gray-600">{data.purpose}</p>
          </div>
          <div>
            <span className="font-medium">Thời gian:</span>
            <p className="text-gray-600">
              {dayjs(data.scheduledDate).format("DD/MM/YYYY HH:mm")}
            </p>
          </div>
          {data.duration && (
            <div>
              <span className="font-medium">Thời lượng:</span>
              <p className="text-gray-600">{data.duration} phút</p>
            </div>
          )}
          {data.staffName && (
            <div>
              <span className="font-medium">Nhân viên:</span>
              <p className="text-gray-600">{data.staffName}</p>
            </div>
          )}
          <div>
            <span className="font-medium">Trạng thái:</span>
            <p className="mt-1">
              <Tag color={getStatusColor(data.status)}>
                {AppointmentStatusLabels[data.status]}
              </Tag>
            </p>
          </div>
          {data.orderCode && (
            <div>
              <span className="font-medium">Thông tin giao hàng:</span>
              <p className="text-gray-600 text-sm mt-1">
                {data.purpose === "Khách hàng đến lấy hàng" ? (
                  <Tag color="blue">Phương thức: Khách qua lấy</Tag>
                ) : (
                  "Không có thông tin giao hàng"
                )}
              </p>
            </div>
          )}
          {data.notes && (
            <div>
              <span className="font-medium">Ghi chú:</span>
              <p className="text-gray-600">{data.notes}</p>
            </div>
          )}
        </div>
      </div>
      {onEdit && (
        <div className="flex justify-end pt-2">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(data)}
          >
            Chỉnh sửa
          </Button>
        </div>
      )}
    </div>
  );
};

// Appointment Form Component
interface AppointmentFormProps {
  appointment?: Appointment;
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<IMembers[]>([]);
  const { message } = App.useApp();

  useEffect(() => {
    const unsubscribe = MemberService.onSnapshot((data) => {
      setMembers(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (appointment && visible) {
      form.setFieldsValue({
        ...appointment,
        scheduledDate: dayjs(appointment.scheduledDate),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        duration: 60,
        status: AppointmentStatus.SCHEDULED,
      });
    }
  }, [appointment, visible, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const appointmentData: Omit<
        Appointment,
        "id" | "createdAt" | "updatedAt"
      > = {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerId: values.customerId,
        orderId: values.orderId,
        orderCode: values.orderCode,
        scheduledDate: values.scheduledDate.valueOf(),
        duration: values.duration || 60,
        purpose: values.purpose,
        staffId: values.staffId,
        staffName: values.staffId
          ? members.find((m) => m.id === values.staffId)?.name
          : undefined,
        status: values.status || AppointmentStatus.SCHEDULED,
        notes: values.notes,
      };

      if (appointment?.id) {
        await AppointmentService.update(appointment.id, appointmentData);
        message.success("Cập nhật lịch hẹn thành công!");
      } else {
        await AppointmentService.create(appointmentData);
        message.success("Tạo lịch hẹn thành công!");
      }

      onSuccess();
      onCancel();
    } catch (error: any) {
      console.error("Error saving appointment:", error);
      message.error(error.message || "Có lỗi xảy ra khi lưu lịch hẹn!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={appointment ? "Chỉnh sửa lịch hẹn" : "Tạo lịch hẹn mới"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên khách hàng"
          name="customerName"
          rules={[{ required: true, message: "Vui lòng nhập tên khách hàng!" }]}
        >
          <Input placeholder="Nhập tên khách hàng" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="customerPhone"
          rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item label="Mã đơn hàng (tùy chọn)" name="orderCode">
          <Input placeholder="Nhập mã đơn hàng" />
        </Form.Item>

        <Form.Item
          label="Mục đích"
          name="purpose"
          rules={[{ required: true, message: "Vui lòng nhập mục đích!" }]}
        >
          <Input placeholder="VD: Mang sản phẩm đến để kiểm tra" />
        </Form.Item>

        <Form.Item
          label="Thời gian"
          name="scheduledDate"
          rules={[{ required: true, message: "Vui lòng chọn thời gian!" }]}
        >
          <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            className="w-full"
            placeholder="Chọn thời gian"
          />
        </Form.Item>

        <Form.Item label="Thời lượng (phút)" name="duration" initialValue={60}>
          <Input type="number" min={15} max={480} placeholder="60" />
        </Form.Item>

        <Form.Item label="Nhân viên (tùy chọn)" name="staffId">
          <Select
            placeholder="Chọn nhân viên"
            allowClear
            options={members
              .filter((m) => m.role === ROLES.sales)
              .map((m) => ({
                label: m.name,
                value: m.id,
              }))}
          />
        </Form.Item>

        <Form.Item label="Trạng thái" name="status">
          <Select options={AppointmentStatusOptions} />
        </Form.Item>

        <Form.Item label="Ghi chú" name="notes">
          <TextArea rows={3} placeholder="Nhập ghi chú (tùy chọn)" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [calendarView, setCalendarView] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<
    Appointment | undefined
  >();
  const router = useRouter();
  const { message } = App.useApp();
  const { query, applyFilter, updateQueries, reset } = useFilter();
  const filteredAppointments = applyFilter(appointments);

  useEffect(() => {
    const unsubscribe = AppointmentService.onSnapshot((data) => {
      setAppointments(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return "blue";
      case AppointmentStatus.CONFIRMED:
        return "green";
      case AppointmentStatus.COMPLETED:
        return "success";
      case AppointmentStatus.CANCELLED:
        return "default";
      case AppointmentStatus.NO_SHOW:
        return "red";
      default:
        return "default";
    }
  };

  const columns: TableColumnsType<Appointment> = [
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
      title: "Mã đơn hàng",
      dataIndex: "orderCode",
      key: "orderCode",
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
      title: "Mục đích",
      dataIndex: "purpose",
      key: "purpose",
    },
    {
      title: "Thời gian",
      dataIndex: "scheduledDate",
      key: "scheduledDate",
      render: (date: number) => dayjs(date).format("DD/MM/YYYY HH:mm"),
      sorter: true,
    },
    {
      title: "Nhân viên",
      dataIndex: "staffName",
      key: "staffName",
      render: (name: string) => name || "N/A",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: AppointmentStatus) => (
        <Tag color={getStatusColor(status)}>
          {AppointmentStatusLabels[status]}
        </Tag>
      ),
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm lịch hẹn...",
          filterKeys: [
            "customerName",
            "customerPhone",
            "orderCode",
            "purpose",
            "notes",
          ],
        },
        filters: {
          fields: [
            {
              label: "Trạng thái",
              name: "status",
              type: "select",
              options: [
                { label: "Tất cả", value: "" },
                ...AppointmentStatusOptions,
              ],
            },
          ],
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
        buttonEnds: [
          {
            can: true,
            type: "default",
            name: calendarView ? "Xem danh sách" : "Xem lịch",
            icon: <CalendarOutlined />,
            onClick: () => setCalendarView(!calendarView),
          },
          {
            can: true,
            type: "primary",
            name: "Tạo lịch hẹn",
            icon: <PlusOutlined />,
            onClick: () => {
              setEditingAppointment(undefined);
              setFormVisible(true);
            },
          },
        ],
      }}
      isLoading={loading}
    >
      {calendarView ? (
        <AppointmentCalendar
          onAppointmentClick={(appt) => {
            setEditingAppointment(appt);
            setFormVisible(true);
          }}
        />
      ) : (
        <CommonTable
          dataSource={filteredAppointments.sort(
            (a, b) => b.scheduledDate - a.scheduledDate
          )}
          columns={columns}
          loading={loading}
          DrawerDetails={({ data, onClose }) => (
            <AppointmentDetails
              data={data}
              onClose={onClose}
              onEdit={(appt) => {
                setEditingAppointment(appt);
                setFormVisible(true);
                onClose?.();
              }}
            />
          )}
          paging={true}
          rank={true}
        />
      )}

      <AppointmentForm
        appointment={editingAppointment}
        visible={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingAppointment(undefined);
        }}
        onSuccess={() => {
          // Data will be updated through realtime listener
        }}
      />
    </WrapperContent>
  );
}


