"use client";

import { AppointmentService } from "@/services/appointmentService";
import {
  AppointmentStatus,
  AppointmentStatusLabels,
  type Appointment,
} from "@/types/appointment";
import { IMembers } from "@/types/members";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  App,
  Badge,
  Button,
  Card,
  Col,
  List,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { Calendar } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

const { Text } = Typography;

interface AppointmentCalendarProps {
  staffId?: string; // Filter by staff
  onAppointmentClick?: (appointment: Appointment) => void;
  onSlotSelect?: (start: Date, end: Date) => void;
}

export default function AppointmentCalendar({
  staffId,
  onAppointmentClick,
  onSlotSelect,
}: AppointmentCalendarProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [members, setMembers] = useState<Record<string, IMembers>>({});
  const { message } = App.useApp();

  useEffect(() => {
    const unsubscribe = AppointmentService.onSnapshot((data) => {
      let filtered = data;
      if (staffId) {
        filtered = filtered.filter((appt) => appt.staffId === staffId);
      }
      setAppointments(filtered);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [staffId]);

  // Load members for display
  useEffect(() => {
    // This would typically come from a members service
    // For now, we'll leave it empty
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

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const getAppointmentsForDate = (date: Dayjs) => {
    const dateStart = date.startOf("day").valueOf();
    const dateEnd = date.endOf("day").valueOf();
    return appointments.filter(
      (appt) =>
        appt.scheduledDate >= dateStart &&
        appt.scheduledDate <= dateEnd &&
        appt.status !== AppointmentStatus.CANCELLED
    );
  };

  const dateCellRender = (value: Dayjs) => {
    const dayAppointments = getAppointmentsForDate(value);
    if (dayAppointments.length === 0) return null;

    return (
      <div className="space-y-1">
        {dayAppointments.slice(0, 3).map((appt) => (
          <div
            key={appt.id}
            className="text-xs p-1 rounded cursor-pointer hover:bg-gray-100"
            style={{
              backgroundColor:
                getStatusColor(appt.status) === "blue"
                  ? "#e6f7ff"
                  : getStatusColor(appt.status) === "green"
                  ? "#f6ffed"
                  : getStatusColor(appt.status) === "red"
                  ? "#fff1f0"
                  : "#fafafa",
              borderLeft: `3px solid ${
                getStatusColor(appt.status) === "blue"
                  ? "#1890ff"
                  : getStatusColor(appt.status) === "green"
                  ? "#52c41a"
                  : getStatusColor(appt.status) === "red"
                  ? "#ff4d4f"
                  : "#d9d9d9"
              }`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAppointment(appt);
              setModalVisible(true);
              onAppointmentClick?.(appt);
            }}
          >
            <div className="font-medium truncate">{appt.customerName}</div>
            <div className="text-gray-500 truncate">
              {dayjs(appt.scheduledDate).format("HH:mm")} - {appt.purpose}
            </div>
          </div>
        ))}
        {dayAppointments.length > 3 && (
          <div className="text-xs text-gray-500 text-center">
            +{dayAppointments.length - 3} khác
          </div>
        )}
      </div>
    );
  };

  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <Card>
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            dateCellRender={dateCellRender}
            onSelect={(date) => {
              setSelectedDate(date);
              onSlotSelect?.(date.toDate(), date.add(1, "hour").toDate());
            }}
          />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title={`Lịch hẹn ngày ${selectedDate.format("DD/MM/YYYY")}`}>
          {selectedDateAppointments.length > 0 ? (
            <List
              dataSource={selectedDateAppointments.sort(
                (a, b) => a.scheduledDate - b.scheduledDate
              )}
              renderItem={(appt) => (
                <List.Item
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedAppointment(appt);
                    setModalVisible(true);
                    onAppointmentClick?.(appt);
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{appt.customerName}</Text>
                        <Tag color={getStatusColor(appt.status)}>
                          {AppointmentStatusLabels[appt.status]}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>
                          {dayjs(appt.scheduledDate).format("HH:mm")} -{" "}
                          {appt.purpose}
                        </div>
                        {appt.staffName && (
                          <div className="text-xs text-gray-500">
                            Nhân viên: {appt.staffName}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              Không có lịch hẹn nào
            </div>
          )}
        </Card>
      </Col>

      <Modal
        title="Chi tiết lịch hẹn"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedAppointment(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setModalVisible(false);
              setSelectedAppointment(null);
            }}
          >
            Đóng
          </Button>,
        ]}
      >
        {selectedAppointment && (
          <div className="space-y-3">
            <div>
              <Text strong>Khách hàng: </Text>
              <Text>{selectedAppointment.customerName}</Text>
            </div>
            <div>
              <Text strong>Số điện thoại: </Text>
              <Text>{selectedAppointment.customerPhone}</Text>
            </div>
            {selectedAppointment.orderCode && (
              <div>
                <Text strong>Mã đơn hàng: </Text>
                <Text>{selectedAppointment.orderCode}</Text>
              </div>
            )}
            <div>
              <Text strong>Mục đích: </Text>
              <Text>{selectedAppointment.purpose}</Text>
            </div>
            <div>
              <Text strong>Thời gian: </Text>
              <Text>
                {dayjs(selectedAppointment.scheduledDate).format(
                  "DD/MM/YYYY HH:mm"
                )}
              </Text>
            </div>
            {selectedAppointment.duration && (
              <div>
                <Text strong>Thời lượng: </Text>
                <Text>{selectedAppointment.duration} phút</Text>
              </div>
            )}
            {selectedAppointment.staffName && (
              <div>
                <Text strong>Nhân viên: </Text>
                <Text>{selectedAppointment.staffName}</Text>
              </div>
            )}
            <div>
              <Text strong>Trạng thái: </Text>
              <Tag color={getStatusColor(selectedAppointment.status)}>
                {AppointmentStatusLabels[selectedAppointment.status]}
              </Tag>
            </div>
            {selectedAppointment.notes && (
              <div>
                <Text strong>Ghi chú: </Text>
                <Text>{selectedAppointment.notes}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Row>
  );
}


