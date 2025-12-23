"use client";

import { ProcessTemplateService } from "@/services/processTemplateService";
import { DepartmentService, IDepartment } from "@/services/departmentService";
import type { ProcessTemplate, ProcessStage, ProcessTask } from "@/types/processTemplate";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Typography,
  Select,
  InputNumber,
  Switch,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  DragOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { genCode } from "@/utils/genCode";

const { Text } = Typography;

interface ProcessTemplateFormProps {
  template?: ProcessTemplate;
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ProcessTemplateForm: React.FC<ProcessTemplateFormProps> = ({
  template,
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const { message } = App.useApp();

  // Load departments
  useEffect(() => {
    const unsubscribe = DepartmentService.onSnapshot((data) => {
      setDepartments(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (template && visible) {
      // Get main department from first stage if exists
      const mainDepartmentCode = template.stages?.[0]?.departmentCode || "";
      form.setFieldsValue({
        code: template.code,
        name: template.name,
        description: template.description,
        mainDepartmentCode,
        stages: template.stages.map((stage) => ({
          ...stage,
          tasks: stage.tasks || [],
        })),
      });
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({
        code: genCode("PROC_"),
        stages: [],
      });
    }
  }, [template, visible, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const templateData: Omit<ProcessTemplate, "id" | "createdAt" | "updatedAt"> = {
        code: values.code,
        name: values.name,
        description: values.description,
        stages: (values.stages || []).map((stage: any, index: number) => ({
          id: stage.id || genCode("STAGE_"),
          stageOrder: index + 1,
          name: stage.name,
          description: stage.description,
          departmentCode: values.mainDepartmentCode || stage.departmentCode,
          departmentName:
            departments.find((d) => d.code === (values.mainDepartmentCode || stage.departmentCode))?.name ||
            (values.mainDepartmentCode || stage.departmentCode),
          expectedDurationHours: stage.expectedDurationHours,
          tasks: (stage.tasks || []).map((task: any, taskIndex: number) => ({
            id: task.id || genCode("TASK_"),
            taskOrder: taskIndex + 1,
            name: task.name,
            description: task.description,
            required: task.required ?? true,
            imageUrl: task.imageUrl,
            videoUrl: task.videoUrl,
          })),
        })),
      };

      if (template?.id) {
        await ProcessTemplateService.update(template.id, templateData);
        message.success("Cập nhật quy trình thành công!");
      } else {
        await ProcessTemplateService.create(templateData);
        message.success("Tạo quy trình mới thành công!");
      }

      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Error saving process template:", error);
      message.error("Có lỗi xảy ra khi lưu quy trình!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={template ? "Chỉnh sửa quy trình" : "Thêm quy trình mới"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={900}
      style={{ top: 20 }}
      styles={{
        body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto" },
      }}
    >
      <Form form={form} layout="vertical" className="space-y-4">
        {/* Hidden code field - auto-generated */}
        <Form.Item
          name="code"
          rules={[{ required: true, message: "Vui lòng nhập mã quy trình!" }]}
          style={{ display: "none" }}
        >
          <Input />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label="Phòng ban chính"
            name="mainDepartmentCode"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn phòng ban chính!",
              },
            ]}
          >
            <Select
              placeholder="Chọn phòng ban chính"
              size="large"
              options={departments.map((dept) => ({
                label: dept.name,
                value: dept.code,
              }))}
              onChange={(value) => {
                // Auto-set main department for first stage if it doesn't have one
                const stages = form.getFieldValue("stages") || [];
                if (stages.length > 0 && !stages[0]?.departmentCode) {
                  form.setFieldValue(["stages", 0, "departmentCode"], value);
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label="Tên quy trình"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên quy trình!" }]}
          >
            <Input 
              placeholder="Ví dụ: Quy trình xi mạ vàng 18k" 
              size="large"
            />
          </Form.Item>
        </div>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea
            rows={3}
            placeholder="Mô tả về quy trình này..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.List name="stages">
          {(fields, { add, remove }) => (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Text strong className="text-base">Giai đoạn</Text>
                  <Text type="secondary" className="ml-2 text-sm">
                    ({fields.length} giai đoạn)
                  </Text>
                </div>
                <Button
                  type="primary"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  size="middle"
                >
                  Thêm giai đoạn
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card
                  key={field.key}
                  size="small"
                  title={
                    <div className="flex items-center gap-2">
                      <Text strong>Giai đoạn {index + 1}</Text>
                    </div>
                  }
                  extra={
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                      size="small"
                    >
                      Xóa
                    </Button>
                  }
                  className="bg-card mb-4"
                  style={{ border: "1px solid #d9d9d9" }}
                >
                  <Space direction="vertical" className="w-full" size="middle">
                    <Form.Item
                      {...field}
                      label="Tên giai đoạn"
                      name={[field.name, "name"]}
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập tên giai đoạn!",
                        },
                      ]}
                    >
                      <Input
                        placeholder="Ví dụ: Loại bỏ lớp mạ cũ"
                      />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      label="Mô tả"
                      name={[field.name, "description"]}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="Mô tả về giai đoạn này..."
                      />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      label="Thời gian dự kiến (giờ)"
                      name={[field.name, "expectedDurationHours"]}
                    >
                      <InputNumber
                        min={0}
                        step={0.5}
                        placeholder="Nhập số giờ"
                        className="w-full"
                        size="middle"
                      />
                    </Form.Item>

                    <Form.List name={[field.name, "tasks"]}>
                      {(
                        taskFields,
                        { add: addTask, remove: removeTask },
                      ) => (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <Text strong className="text-sm">Công việc</Text>
                              <Text type="secondary" className="ml-2 text-xs">
                                ({taskFields.length} công việc)
                              </Text>
                            </div>
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => addTask()}
                              icon={<PlusOutlined />}
                            >
                              Thêm công việc
                            </Button>
                          </div>

                          {taskFields.map((taskField, taskIndex) => (
                            <Card
                              key={taskField.key}
                              size="small"
                              className="bg-gray-50 mb-2"
                              style={{ border: "1px solid #e8e8e8" }}
                            >
                              <Space
                                direction="vertical"
                                className="w-full"
                                size="small"
                              >
                                <div className="flex items-start gap-2">
                                  <DragOutlined className="mt-2 text-muted-foreground" />
                                  <div className="flex-1">
                                    <Form.Item
                                      {...taskField}
                                      label={`Công việc ${taskIndex + 1}`}
                                      name={[taskField.name, "name"]}
                                      rules={[
                                        {
                                          required: true,
                                          message:
                                            "Vui lòng nhập tên công việc!",
                                        },
                                      ]}
                                      className="mb-2"
                                    >
                                      <Input
                                        placeholder="Ví dụ: Ngâm sản phẩm trong nước bóc Au chuyên dụng (50–60°C)"
                                      />
                                    </Form.Item>

                                    <Form.Item
                                      {...taskField}
                                      label="Mô tả"
                                      name={[taskField.name, "description"]}
                                      className="mb-2"
                                    >
                                      <Input.TextArea
                                        rows={2}
                                        placeholder="Mô tả chi tiết công việc..."
                                      />
                                    </Form.Item>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                      <Form.Item
                                        {...taskField}
                                        label="Link ảnh"
                                        name={[taskField.name, "imageUrl"]}
                                        help="Nhập URL ảnh để minh họa"
                                      >
                                        <Input
                                          placeholder="https://example.com/image.jpg"
                                        />
                                      </Form.Item>

                                      <Form.Item
                                        {...taskField}
                                        label="Link YouTube"
                                        name={[taskField.name, "videoUrl"]}
                                        help="Nhập link YouTube để demo"
                                      >
                                        <Input
                                          placeholder="https://youtube.com/watch?v=..."
                                        />
                                      </Form.Item>
                                    </div>

                                    <div className="flex justify-between items-center">
                                      <Form.Item
                                        {...taskField}
                                        name={[taskField.name, "required"]}
                                        valuePropName="checked"
                                        className="mb-0"
                                      >
                                        <Switch
                                          checkedChildren="Bắt buộc"
                                          unCheckedChildren="Tùy chọn"
                                          defaultChecked
                                        />
                                      </Form.Item>

                                      <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeTask(taskField.name)}
                                      >
                                        Xóa
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </Space>
                            </Card>
                          ))}
                        </div>
                      )}
                    </Form.List>
                  </Space>
                </Card>
              ))}
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

