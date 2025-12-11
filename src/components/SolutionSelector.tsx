"use client";

import { SolutionOption } from "@/types/service-item";
import { CheckCircleOutlined, DollarOutlined } from "@ant-design/icons";
import { App, Card, Radio, Space, Tag, Typography } from "antd";
import { useState } from "react";

const { Text, Title } = Typography;

interface SolutionSelectorProps {
  solutionOptions: SolutionOption[];
  selectedSolutionId?: string;
  onSelect: (solutionId: string) => void;
  disabled?: boolean;
}

export default function SolutionSelector({
  solutionOptions,
  selectedSolutionId,
  onSelect,
  disabled = false,
}: SolutionSelectorProps) {
  const [selected, setSelected] = useState<string | undefined>(
    selectedSolutionId
  );
  const { message } = App.useApp();

  const handleSelect = (solutionId: string) => {
    if (disabled) {
      message.warning("Không thể thay đổi phương án đã chọn!");
      return;
    }
    setSelected(solutionId);
    onSelect(solutionId);
  };

  if (solutionOptions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Chưa có phương án xử lý nào
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Title level={5}>Chọn phương án xử lý:</Title>
      <Radio.Group
        value={selected}
        onChange={(e) => handleSelect(e.target.value)}
        disabled={disabled}
        className="w-full"
      >
        <Space direction="vertical" size="middle" className="w-full">
          {solutionOptions.map((option) => (
            <Radio key={option.id} value={option.id} className="w-full">
              <Card
                className={`w-full cursor-pointer transition-all ${
                  selected === option.id
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-400"
                }`}
                onClick={() => !disabled && handleSelect(option.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Title level={5} className="mb-0">
                        {option.name}
                      </Title>
                      {selected === option.id && (
                        <Tag color="blue" icon={<CheckCircleOutlined />}>
                          Đã chọn
                        </Tag>
                      )}
                    </div>
                    {option.description && (
                      <Text type="secondary" className="block mb-2">
                        {option.description}
                      </Text>
                    )}
                    <div className="flex items-center gap-4">
                      <Tag
                        color="green"
                        icon={<DollarOutlined />}
                        className="text-base"
                      >
                        {option.price.toLocaleString("vi-VN")} VNĐ
                      </Tag>
                    </div>
                  </div>
                </div>
              </Card>
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </div>
  );
}


