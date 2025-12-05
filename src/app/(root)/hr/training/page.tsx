"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { ColumnSetting, FilterField } from "@/types";
import {
  BookOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Descriptions,
  Progress,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";

const { Text, Paragraph } = Typography;

interface TrainingCourse {
  id: string;
  key: string;
  title: string;
  department: "Sale" | "Technical" | "Manager" | "All";
  duration: string;
  status: "Active" | "Draft" | "Archived";
  completionRate: number;
  enrolledCount: number;
  videoCount: number;
  description: string;
  instructor: string;
  createdDate: string;
}

const mockCourses: TrainingCourse[] = [
  {
    id: "1",
    key: "1",
    title: "Kỹ năng bán hàng chuyên nghiệp",
    department: "Sale",
    duration: "8 giờ",
    status: "Active",
    completionRate: 75,
    enrolledCount: 12,
    videoCount: 15,
    description:
      "Khóa học kỹ năng bán hàng cơ bản đến nâng cao, bao gồm: tư vấn khách hàng, xử lý từ chối, chốt đơn hiệu quả",
    instructor: "Nguyễn Văn A",
    createdDate: "2024-11-01",
  },
  {
    id: "2",
    key: "2",
    title: "Kỹ thuật sửa chữa túi xách cao cấp",
    department: "Technical",
    duration: "12 giờ",
    status: "Active",
    completionRate: 60,
    enrolledCount: 8,
    videoCount: 20,
    description:
      "Hướng dẫn chi tiết quy trình sửa chữa các loại túi xách: khâu vá, thay dây, làm form, xử lý vết bẩn",
    instructor: "Trần Thị B",
    createdDate: "2024-10-15",
  },
  {
    id: "3",
    key: "3",
    title: "Quản lý nhân sự hiệu quả",
    department: "Manager",
    duration: "10 giờ",
    status: "Active",
    completionRate: 85,
    enrolledCount: 5,
    videoCount: 12,
    description:
      "Khóa học dành cho quản lý: kỹ năng lãnh đạo, quản lý team, giải quyết xung đột, đánh giá hiệu suất",
    instructor: "Lê Văn C",
    createdDate: "2024-09-20",
  },
  {
    id: "4",
    key: "4",
    title: "Phục hồi màu da chuyên nghiệp",
    department: "Technical",
    duration: "15 giờ",
    status: "Active",
    completionRate: 40,
    enrolledCount: 6,
    videoCount: 25,
    description:
      "Kỹ thuật nhuộm da, phục hồi màu cho các sản phẩm da: túi xách, giày dép, ví",
    instructor: "Phạm Thị D",
    createdDate: "2024-11-10",
  },
  {
    id: "5",
    key: "5",
    title: "Chăm sóc khách hàng xuất sắc",
    department: "All",
    duration: "6 giờ",
    status: "Active",
    completionRate: 90,
    enrolledCount: 20,
    videoCount: 10,
    description:
      "Kỹ năng giao tiếp, xử lý khiếu nại, tạo trải nghiệm tốt cho khách hàng",
    instructor: "Hoàng Văn E",
    createdDate: "2024-10-01",
  },
  {
    id: "6",
    key: "6",
    title: "Kỹ thuật xi mạ phục hồi kim loại",
    department: "Technical",
    duration: "10 giờ",
    status: "Draft",
    completionRate: 0,
    enrolledCount: 0,
    videoCount: 8,
    description:
      "Quy trình xi mạ, phục hồi các chi tiết kim loại trên túi xách và phụ kiện",
    instructor: "Đỗ Thị F",
    createdDate: "2024-11-25",
  },
];

const TrainingCourseDetail = ({
  data,
  onClose,
}: PropRowDetails<TrainingCourse>) => {
  if (!data) return null;

  const getDepartmentTag = (department: string) => {
    const deptMap: Record<string, { color: string; text: string }> = {
      Sale: { color: "blue", text: "Sale" },
      Technical: { color: "orange", text: "Kỹ thuật viên" },
      Manager: { color: "purple", text: "Quản lý" },
      All: { color: "green", text: "Tất cả bộ phận" },
    };
    const { color, text } = deptMap[department] || {
      color: "default",
      text: department,
    };
    return <Tag color={color}>{text}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      Active: { color: "success", text: "Đang hoạt động" },
      Draft: { color: "default", text: "Nháp" },
      Archived: { color: "error", text: "Đã lưu trữ" },
    };
    const { color, text } = statusMap[status] || {
      color: "default",
      text: status,
    };
    return <Tag color={color}>{text}</Tag>;
  };

  return (
    <div className="space-y-4">
      <Descriptions title="Thông tin khóa học" bordered column={1}>
        <Descriptions.Item label="Tên khóa học">
          <Text strong>{data.title}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Bộ phận">
          {getDepartmentTag(data.department)}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          {getStatusTag(data.status)}
        </Descriptions.Item>
        <Descriptions.Item label="Thời lượng">
          {data.duration}
        </Descriptions.Item>
        <Descriptions.Item label="Số video">
          <Space>
            <VideoCameraOutlined />
            <Text>{data.videoCount} video</Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Học viên">
          <Space>
            <TeamOutlined />
            <Text>{data.enrolledCount} người</Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Tỷ lệ hoàn thành">
          <Progress
            percent={data.completionRate}
            status={data.completionRate >= 80 ? "success" : "normal"}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Giảng viên">
          {data.instructor}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
          {data.createdDate}
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">
          <Paragraph className="mb-0">{data.description}</Paragraph>
        </Descriptions.Item>
      </Descriptions>

      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>Đóng</Button>
        <Button type="primary" icon={<PlayCircleOutlined />}>
          Xem khóa học
        </Button>
      </div>
    </div>
  );
};

export default function TrainingPage() {
  const { message } = App.useApp();
  const { query, updateQuery, reset } = useFilter({
    search: "",
    department: "all",
    status: "all",
  });

  const [columnSettings, setColumnSettings] = useState<ColumnSetting[]>([
    { key: "title", title: "Tên khóa học", visible: true },
    { key: "department", title: "Bộ phận", visible: true },
    { key: "duration", title: "Thời lượng", visible: true },
    { key: "videoCount", title: "Số video", visible: true },
    { key: "enrolledCount", title: "Học viên", visible: true },
    { key: "completionRate", title: "Hoàn thành", visible: true },
    { key: "status", title: "Trạng thái", visible: true },
    { key: "action", title: "Thao tác", visible: true },
  ]);

  const filteredCourses = mockCourses.filter((course) => {
    const matchesSearch =
      !query.search ||
      course.title.toLowerCase().includes(query.search.toLowerCase()) ||
      course.instructor.toLowerCase().includes(query.search.toLowerCase());

    const matchesDepartment =
      !query.department ||
      query.department === "all" ||
      course.department === query.department;

    const matchesStatus =
      !query.status || query.status === "all" || course.status === query.status;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const activeCount = mockCourses.filter((c) => c.status === "Active").length;
  const totalEnrolled = mockCourses.reduce(
    (sum, c) => sum + c.enrolledCount,
    0
  );
  const avgCompletion =
    mockCourses.reduce((sum, c) => sum + c.completionRate, 0) /
    mockCourses.length;
  const totalVideos = mockCourses.reduce((sum, c) => sum + c.videoCount, 0);

  const columns: ColumnsType<TrainingCourse> = [
    {
      title: "Tên khóa học",
      dataIndex: "title",
      key: "title",
      width: 250,
      fixed: "left" as const,
      render: (title: string) => <Text strong>{title}</Text>,
    },
    {
      title: "Bộ phận",
      dataIndex: "department",
      key: "department",
      width: 150,
      render: (department: string) => {
        const deptMap: Record<string, { color: string; text: string }> = {
          Sale: { color: "blue", text: "Sale" },
          Technical: { color: "orange", text: "Kỹ thuật viên" },
          Manager: { color: "purple", text: "Quản lý" },
          All: { color: "green", text: "Tất cả" },
        };
        const { color, text } = deptMap[department] || {
          color: "default",
          text: department,
        };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Thời lượng",
      dataIndex: "duration",
      key: "duration",
      width: 120,
    },
    {
      title: "Số video",
      dataIndex: "videoCount",
      key: "videoCount",
      width: 100,
      align: "center" as const,
      render: (count: number) => (
        <Space>
          <VideoCameraOutlined />
          <Text>{count}</Text>
        </Space>
      ),
    },
    {
      title: "Học viên",
      dataIndex: "enrolledCount",
      key: "enrolledCount",
      width: 100,
      align: "center" as const,
      render: (count: number) => (
        <Space>
          <TeamOutlined />
          <Text>{count}</Text>
        </Space>
      ),
    },
    {
      title: "Tỷ lệ hoàn thành",
      dataIndex: "completionRate",
      key: "completionRate",
      width: 180,
      render: (rate: number) => (
        <Progress
          percent={rate}
          size="small"
          status={rate >= 80 ? "success" : "normal"}
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          Active: { color: "success", text: "Hoạt động" },
          Draft: { color: "default", text: "Nháp" },
          Archived: { color: "error", text: "Lưu trữ" },
        };
        const { color, text } = statusMap[status] || {
          color: "default",
          text: status,
        };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 160,
      fixed: "right" as const,
      render: (_: unknown, record: TrainingCourse) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              message.info(`Xem khóa học: ${record.title}`);
            }}
          >
            Xem
          </Button>
        </Space>
      ),
    },
  ].filter((col) => columnSettings.find((s) => s.key === col.key && s.visible));

  const filterFields: FilterField[] = [
    {
      type: "select",
      name: "department",
      label: "Bộ phận",
      options: [
        { label: "Tất cả", value: "all" },
        { label: "Sale", value: "Sale" },
        { label: "Kỹ thuật viên", value: "Technical" },
        { label: "Quản lý", value: "Manager" },
        { label: "Tất cả bộ phận", value: "All" },
      ],
    },
    {
      type: "select",
      name: "status",
      label: "Trạng thái",
      options: [
        { label: "Tất cả", value: "all" },
        { label: "Đang hoạt động", value: "Active" },
        { label: "Nháp", value: "Draft" },
        { label: "Đã lưu trữ", value: "Archived" },
      ],
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm theo tên khóa học, giảng viên",
          filterKeys: ["title", "instructor"],
        },
        filters: {
          fields: filterFields,
          query: query,
          onApplyFilter: (arr) => {
            arr.forEach((item) => updateQuery(item.key, item.value));
          },
          onReset: reset,
        },
        columnSettings: {
          columns: columnSettings,
          onChange: setColumnSettings,
          onReset: () =>
            setColumnSettings([
              { key: "title", title: "Tên khóa học", visible: true },
              { key: "department", title: "Bộ phận", visible: true },
              { key: "duration", title: "Thời lượng", visible: true },
              { key: "videoCount", title: "Số video", visible: true },
              { key: "enrolledCount", title: "Học viên", visible: true },
              { key: "completionRate", title: "Hoàn thành", visible: true },
              { key: "status", title: "Trạng thái", visible: true },
              { key: "action", title: "Thao tác", visible: true },
            ]),
        },
        buttonEnds: [
          {
            name: "Tạo khóa học",
            icon: <BookOutlined />,
            type: "primary",
            onClick: () => message.info("Chức năng đang phát triển"),
          },
        ],
      }}
    >
      <Space vertical size="large" className="w-full">
        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <Statistic
              title="Khóa học hoạt động"
              value={activeCount}
              prefix={<BookOutlined />}
              styles={{
                content: { color: "#52c41a" },
              }}
            />
          </Card>
          <Card>
            <Statistic
              title="Tổng học viên"
              value={totalEnrolled}
              prefix={<TeamOutlined />}
              styles={{
                content: { color: "#1890ff" },
              }}
            />
          </Card>
          <Card>
            <Statistic
              title="Tỷ lệ hoàn thành TB"
              value={avgCompletion}
              precision={1}
              suffix="%"
              prefix={<TrophyOutlined />}
              styles={{
                content: { color: "#fa8c16" },
              }}
            />
          </Card>
          <Card>
            <Statistic
              title="Tổng video"
              value={totalVideos}
              prefix={<VideoCameraOutlined />}
              styles={{
                content: { color: "#722ed1" },
              }}
            />
          </Card>
        </div>

        <CommonTable
          columns={columns}
          dataSource={filteredCourses}
          loading={false}
          DrawerDetails={TrainingCourseDetail}
        />
      </Space>
    </WrapperContent>
  );
}
