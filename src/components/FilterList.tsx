/* eslint-disable @typescript-eslint/no-explicit-any */
import { FilterField } from "@/types";
import { PlusOutlined } from "@ant-design/icons";
import {
    Button,
    Card,
    DatePicker,
    Divider,
    Form,
    Input,
    Radio,
    Select,
    Space,
} from "antd";
import { FormInstance } from "antd/lib";
import dayjs from "dayjs";
import React, { useEffect } from "react";

interface FilterListProps {
    fields: FilterField[];
    onApplyFilter: (arr: { key: string; value: any }[]) => void;
    onReset?: () => void;
    onCancel?: () => void;
    form: FormInstance<any>;
    isMobile: boolean;
    instant?: boolean;
    initValues?: Record<string, any>;
    layout?: "vertical" | "horizontal";
}

export const FilterList: React.FC<FilterListProps> = ({
    fields,
    onApplyFilter,
    onReset,
    onCancel = () => { },
    isMobile,
    form,
    instant = false,
    initValues,
    layout = "vertical",
}) => {
    const handleReset = () => {
        form.resetFields();
        if (onReset) {
            onReset();
        }
    };

    const handleFinish = (values: Record<string, any>) => {
        const payload: {
            key: string;
            value: any;
        }[] = [];
        const normalize = (v: any) => {
            // dayjs objects from DatePicker/RangePicker have toDate()
            if (v && typeof v.toDate === "function") {
                return v.toDate();
            }
            // RangePicker: [start, end]
            if (
                Array.isArray(v) &&
                v.length === 2 &&
                v[0] &&
                typeof v[0].toDate === "function"
            ) {
                const from = v[0].toDate();
                const to = v[1] ? v[1].toDate() : null;
                return { from, to };
            }
            return v;
        };

        Object.entries(values).forEach(([key, value]) => {
            const nv = normalize(value);
            if (nv !== undefined && nv !== null && nv !== "") {
                payload.push({ key, value: nv });
            }
        });
        onApplyFilter(payload);
        onCancel();
    };

    const handleValuesChange = (_: any, values: Record<string, any>) => {
        if (!instant) return;
        const payload: { key: string; value: any }[] = [];
        const normalize = (v: any) => {
            if (v && typeof v.toDate === "function") return v.toDate();
            if (
                Array.isArray(v) &&
                v.length === 2 &&
                v[0] &&
                typeof v[0].toDate === "function"
            ) {
                const from = v[0].toDate();
                const to = v[1] ? v[1].toDate() : null;
                return { from, to };
            }
            return v;
        };

        Object.entries(values).forEach(([key, value]) => {
            const nv = normalize(value);
            if (nv !== undefined && nv !== null && nv !== "") {
                payload.push({ key, value: nv });
            }
        });
        onApplyFilter(payload);
    };

    const renderField = (field: FilterField) => {
        switch (field.type) {
            case "input":
                return (
                    <Form.Item
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        className="mb-2"
                    >
                        <Input
                            placeholder={field.placeholder || field.label}
                            allowClear
                            size="small"
                        />
                    </Form.Item>
                );

            case "radio":
                return (
                    <Form.Item
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        className="mb-2"
                    >
                        <Radio.Group size="small">
                            <Space direction="vertical" size="small">
                                {field.options?.map((option) => (
                                    <Radio
                                        key={String(option.value)}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </Radio>
                                ))}
                            </Space>
                        </Radio.Group>
                    </Form.Item>
                );

            case "select":
                return (
                    <Form.Item
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        className="mb-2"
                    >
                        {field.onAddNew ? (
                            <Space.Compact style={{ width: "100%" }}>
                                <Select
                                    mode={
                                        field.isMultiple
                                            ? "multiple"
                                            : undefined
                                    }
                                    options={field.options || []}
                                    placeholder={
                                        field.placeholder ||
                                        `Chọn ${field.label}`
                                    }
                                    allowClear
                                    size="small"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={field.onAddNew}
                                    size="small"
                                />
                            </Space.Compact>
                        ) : (
                            <Select
                                mode={field.isMultiple ? "multiple" : undefined}
                                options={field.options || []}
                                placeholder={
                                    field.placeholder || `Chọn ${field.label}`
                                }
                                allowClear
                                size="small"
                            />
                        )}
                    </Form.Item>
                );

            case "month":
                return (
                    <Form.Item
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        className="mb-2"
                    >
                        <DatePicker
                            className="w-full"
                            placeholder={field.placeholder || field.label}
                            picker="month"
                            size="small"
                        />
                    </Form.Item>
                );

            case "date":
                return (
                    <Form.Item
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        className="mb-2"
                    >
                        <DatePicker
                            className="w-full"
                            placeholder={field.placeholder || field.label}
                            size="small"
                        />
                    </Form.Item>
                );

            case "dateRange":
                return (
                    <Form.Item
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        className="mb-2"
                    >
                        <DatePicker.RangePicker
                            className="w-full"
                            size="small"
                            presets={field.presets?.map((preset) => ({
                                ...preset,
                                value: [...preset.value],
                            }))}
                        />
                    </Form.Item>
                );

            default:
                return null;
        }
    };

    useEffect(() => {
        if (initValues) {
            const value = fields.reduce(
                (acc, field) => {
                    if (initValues[field.name] !== undefined) {
                        if (
                            field.type === "month" ||
                            field.type === "date" ||
                            field.type === "dateRange"
                        ) {
                            if (field.type === "dateRange") {
                                const range = initValues[field.name];
                                acc[field.name] = [
                                    range.from ? dayjs(range.from) : null,
                                    range.to ? dayjs(range.to) : null,
                                ];
                            } else {
                                acc[field.name] = dayjs(initValues[field.name]);
                            }
                        } else {
                            acc[field.name] = initValues[field.name];
                        }
                    }
                    return acc;
                },
                {} as Record<string, any>,
            );
            form.setFieldsValue(value);
        }
    }, []);

    if (fields.length === 0) {
        return null;
    }

    const isHorizontal = layout === "horizontal";

    return (
        <Card title={instant ? "Bộ lọc" : null} className="h-fit">
            {!instant && !isHorizontal && (
                <>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold mb-0">Bộ lọc</h3>
                    </div>
                    <Divider className="my-2" />
                </>
            )}
            <Form
                layout={isHorizontal ? "inline" : "vertical"}
                form={form}
                onFinish={handleFinish}
                onValuesChange={handleValuesChange}
            >
                <div className={isHorizontal ? "flex flex-wrap gap-3 items-end" : "space-y-4"}>
                    {fields.map((field) => renderField(field))}

                    {!instant && isHorizontal && (
                        <div className="flex gap-2">
                            <Button onClick={handleReset}>Đặt lại</Button>
                            <Button type="primary" htmlType="submit">
                                Áp dụng
                            </Button>
                        </div>
                    )}
                </div>

                {!instant && !isHorizontal && (
                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={handleReset}>Đặt lại</Button>
                        <Button type="primary" htmlType="submit">
                            Áp dụng
                        </Button>
                    </div>
                )}
            </Form>
        </Card>
    );
};
