"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import { ProcessTemplateForm } from "@/components/ProcessTemplateForm";
import useFilter from "@/hooks/useFilter";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ProcessTemplateService } from "@/services/processTemplateService";
import type { ProcessTemplate } from "@/types/processTemplate";
import { DeleteOutlined, EditOutlined, PlusOutlined, PlayCircleOutlined, PictureOutlined, DragOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { App, Button, Card, Collapse, Descriptions, Drawer, Popconfirm, Tag, Typography, Image, Empty } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Process Template Details Drawer Component
const ProcessTemplateDetails: React.FC<PropRowDetails<ProcessTemplate>> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <Descriptions
        title="Thông tin quy trình"
        column={1}
        size="small"
        bordered
        items={[
          {
            key: "name",
            label: "Tên quy trình",
            children: <Typography.Text strong>{data.name}</Typography.Text>,
          },
          {
            key: "code",
            label: "Mã",
            children: <Typography.Text code className="text-xs">{data.code}</Typography.Text>,
          },
          ...(data.description ? [{
            key: "description",
            label: "Mô tả",
            children: data.description,
          }] : []),
          {
            key: "stages",
            label: "Số giai đoạn",
            children: <Tag color="blue">{data.stages.length} giai đoạn</Tag>,
          },
          {
            key: "createdAt",
            label: "Ngày tạo",
            children: data.createdAt
              ? dayjs(data.createdAt).format("DD/MM/YYYY HH:mm")
              : "N/A",
          },
          {
            key: "updatedAt",
            label: "Cập nhật lần cuối",
            children: data.updatedAt
              ? dayjs(data.updatedAt).format("DD/MM/YYYY HH:mm")
              : "N/A",
          },
        ]}
      />

      {data.stages.length > 0 && (
        <div>
          <h4 className="font-semibold mb-4">Quy trình thực hiện</h4>
          <div className="relative">
            {data.stages.map((stage, index) => (
              <div key={stage.id} className="relative">
                {/* Connection line (dashed) */}
                {index < data.stages.length - 1 && (
                  <div
                    className="absolute left-6 top-full w-0.5 bg-gray-400"
                    style={{
                      height: "40px",
                      borderLeft: "2px dashed #999",
                      zIndex: 0,
                    }}
                  />
                )}

                {/* Stage Card */}
                <Card
                  size="small"
                  className="bg-white mb-4 relative z-10"
                  style={{ border: "1px solid #d9d9d9" }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {/* Step Number Circle */}
                      <div
                        className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md"
                        style={{ minWidth: "48px", zIndex: 10 }}
                      >
                        {index + 1}
                      </div>

                      {/* Stage Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Typography.Text strong className="text-base">
                            {stage.name}
                          </Typography.Text>
                          <Tag color="blue">{stage.tasks.length} công việc</Tag>
                        </div>
                        {stage.description && (
                          <Typography.Text type="secondary" className="text-sm block mb-2">
                            {stage.description}
                          </Typography.Text>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span>
                            <span className="font-medium">Phòng ban:</span>{" "}
                            <Tag>{stage.departmentName}</Tag>
                          </span>
                          {stage.expectedDurationHours && (
                            <span>
                              <span className="font-medium">Thời gian:</span>{" "}
                              <Tag>{stage.expectedDurationHours}h</Tag>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tasks */}
                    {stage.tasks.length > 0 && (
                      <div className="mt-3 ml-16 space-y-2">
                        {stage.tasks.map((task, taskIndex) => (
                          <Card key={task.id} size="small" className="bg-gray-50">
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <Tag color="default">{taskIndex + 1}</Tag>
                                <div className="flex-1">
                                  <Typography.Text strong className="text-sm">
                                    {task.name}
                                  </Typography.Text>
                                  {task.description && (
                                    <Typography.Text type="secondary" className="block text-xs mt-1">
                                      {task.description}
                                    </Typography.Text>
                                  )}
                                </div>
                                {task.required !== false && (
                                  <Tag color="green">Bắt buộc</Tag>
                                )}
                              </div>

                              {(task.imageUrl || task.videoUrl) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                  {task.imageUrl && (
                                    <div>
                                      <div className="flex items-center gap-1 mb-1">
                                        <PictureOutlined className="text-xs" />
                                        <Typography.Text type="secondary" className="text-xs">Ảnh</Typography.Text>
                                      </div>
                                      <Image
                                        src={task.imageUrl}
                                        alt={task.name}
                                        className="rounded"
                                        style={{ maxHeight: 150, objectFit: "cover", width: "100%" }}
                                        fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='14' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EẢnh không tải được%3C/text%3E%3C/svg%3E"
                                      />
                                    </div>
                                  )}

                                  {task.videoUrl && (
                                    <div>
                                      <div className="flex items-center gap-1 mb-1">
                                        <PlayCircleOutlined className="text-xs" />
                                        <Typography.Text type="secondary" className="text-xs">Video</Typography.Text>
                                      </div>
                                      <div className="rounded overflow-hidden bg-black">
                                        {task.videoUrl.includes("youtube.com") || task.videoUrl.includes("youtu.be") ? (
                                          <iframe
                                            width="100%"
                                            height="150"
                                            src={task.videoUrl.includes("youtube.com/watch?v=") 
                                              ? task.videoUrl.replace("watch?v=", "embed/")
                                              : task.videoUrl.includes("youtu.be/")
                                              ? `https://www.youtube.com/embed/${task.videoUrl.split("youtu.be/")[1]}`
                                              : task.videoUrl}
                                            title={task.name}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          />
                                        ) : (
                                          <video
                                            src={task.videoUrl}
                                            controls
                                            className="w-full"
                                            style={{ maxHeight: 150 }}
                                          >
                                            Trình duyệt của bạn không hỗ trợ video.
                                          </video>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// Sortable Card Component
const SortableCard: React.FC<{
  template: ProcessTemplate;
  onEdit: (template: ProcessTemplate) => void;
  onDelete: (id: string) => void;
  onView: (template: ProcessTemplate) => void;
}> = ({ template, onEdit, onDelete, onView }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalTasks = template.stages.reduce(
    (sum, stage) => sum + stage.tasks.length,
    0
  );

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        hoverable
        className="h-full cursor-pointer"
        onClick={() => onView(template)}
        actions={[
          <Button
            key="edit"
            type="text"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(template);
            }}
          >
            Sửa
          </Button>,
          <Popconfirm
            key="delete"
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa quy trình này?"
            onConfirm={(e) => {
              e?.stopPropagation();
              onDelete(template.id);
            }}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              onClick={(e) => e.stopPropagation()}
            >
              Xóa
            </Button>
          </Popconfirm>,
        ]}
      >
        <div className="flex items-start gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing flex-shrink-0 mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <DragOutlined className="text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <Typography.Title level={5} className="mb-2">
              {template.name}
            </Typography.Title>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag color="blue">{template.stages.length} giai đoạn</Tag>
                <Tag>{totalTasks} công việc</Tag>
              </div>
              <Typography.Text type="secondary" className="text-xs block">
                {dayjs(template.createdAt).format("DD/MM/YYYY HH:mm")}
              </Typography.Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Main Process Template Page Component
const WorkflowPage = () => {
  const [templates, setTemplates] = useState<ProcessTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const { isAdmin } = useIsAdmin();
  const [editingTemplate, setEditingTemplate] = useState<
    ProcessTemplate | undefined
  >();
  const [viewingTemplate, setViewingTemplate] = useState<
    ProcessTemplate | undefined
  >();
  const { message } = App.useApp();
  const { query, applyFilter, updateQueries, reset } = useFilter();
  const filteredTemplates = applyFilter(templates);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group templates by department
  const groupedByDepartment = useMemo(() => {
    const groups = new Map<string, ProcessTemplate[]>();
    
    filteredTemplates.forEach((template) => {
      if (!template.stages || template.stages.length === 0) {
        const key = "Chưa phân loại";
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(template);
        return;
      }
      
      // Get all unique departments from stages
      const departments = new Set<string>();
      template.stages.forEach((stage) => {
        if (stage.departmentName) {
          departments.add(stage.departmentName);
        }
      });
      
      if (departments.size === 0) {
        const key = "Chưa phân loại";
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(template);
      } else {
        // Add template to all departments it belongs to
        departments.forEach((dept) => {
          if (!groups.has(dept)) {
            groups.set(dept, []);
          }
          groups.get(dept)!.push(template);
        });
      }
    });
    
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredTemplates]);

  // Load data
  useEffect(() => {
    const unsubscribe = ProcessTemplateService.onSnapshot((data) => {
      setTemplates(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await ProcessTemplateService.delete(id);
      message.success("Xóa quy trình thành công!");
    } catch (error) {
      console.error("Error deleting process template:", error);
      message.error("Có lỗi xảy ra khi xóa quy trình!");
    }
  };

  const handleDragEnd = (event: DragEndEvent, department: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const departmentGroup = groupedByDepartment.find(([dept]) => dept === department);
    if (!departmentGroup) return;

    const [, templates] = departmentGroup;
    const oldIndex = templates.findIndex((t) => t.id === active.id);
    const newIndex = templates.findIndex((t) => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTemplates = arrayMove(templates, oldIndex, newIndex);
      // Update local state - Note: This is just UI reordering, not persisted
      // If you want to persist order, you'd need to update Firebase with order field
      setTemplates((prev) => {
        const updated = [...prev];
        newTemplates.forEach((template, index) => {
          const templateIndex = updated.findIndex((t) => t.id === template.id);
          if (templateIndex !== -1) {
            updated[templateIndex] = template;
          }
        });
        return updated;
      });
    }
  };

  const columns: TableColumnsType<ProcessTemplate> = [
    {
      title: "Tên quy trình",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Số giai đoạn",
      key: "stagesCount",
      width: 120,
      render: (_, record) => (
        <Tag color="blue">{record.stages.length} giai đoạn</Tag>
      ),
    },
    {
      title: "Tổng số công việc",
      key: "tasksCount",
      width: 140,
      render: (_, record) => {
        const totalTasks = record.stages.reduce(
          (sum, stage) => sum + stage.tasks.length,
          0,
        );
        return <Tag>{totalTasks} công việc</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: number) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "N/A",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      fixed: "right" as const,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTemplate(record);
              setFormVisible(true);
            }}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa quy trình này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <>
      <WrapperContent
        isLoading={loading}
        isEmpty={!loading && filteredTemplates.length === 0}
        title="Quản lý quy trình"
        header={{
          searchInput: {
            placeholder: "Tìm kiếm quy trình...",
            filterKeys: ["code", "name", "description"],
          },
          filters: {
            fields: [],
            query,
            onApplyFilter: updateQueries,
            onReset: reset,
          },
          buttonEnds: [
            {
              can: isAdmin,
              type: "primary",
              name: "Thêm quy trình",
              icon: <PlusOutlined />,
              onClick: () => {
                setEditingTemplate(undefined);
                setFormVisible(true);
              },
            },
          ],
        }}
      >
        <div className="space-y-4">
          {groupedByDepartment.map(([department, deptTemplates]) => (
            <Card
              key={department}
              title={
                <div className="flex items-center gap-2">
                  <span>{department}</span>
                  <Tag color="blue">{deptTemplates.length} quy trình</Tag>
                </div>
              }
              size="small"
            >
              {deptTemplates.length === 0 ? (
                <Empty description="Không có quy trình" />
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, department)}
                >
                  <SortableContext
                    items={deptTemplates.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deptTemplates.map((template) => (
                        <SortableCard
                          key={template.id}
                          template={template}
                          onEdit={(t) => {
                            setEditingTemplate(t);
                            setFormVisible(true);
                          }}
                          onDelete={handleDelete}
                          onView={(t) => setViewingTemplate(t)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </Card>
          ))}
        </div>
      </WrapperContent>

      <ProcessTemplateForm
        template={editingTemplate}
        visible={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingTemplate(undefined);
        }}
        onSuccess={() => {
          // Data will be updated through realtime listener
        }}
      />

      <Drawer
        title="Chi tiết quy trình"
        placement="right"
        onClose={() => setViewingTemplate(undefined)}
        open={viewingTemplate !== undefined}
        width={600}
      >
        {viewingTemplate && (
          <ProcessTemplateDetails
            data={viewingTemplate}
            onClose={() => setViewingTemplate(undefined)}
          />
        )}
      </Drawer>
    </>
  );
};

export default WorkflowPage;
