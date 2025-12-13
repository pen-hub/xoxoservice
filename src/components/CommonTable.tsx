import { IPagination } from "@/hooks/useFilter";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { TableColumnsType } from "antd";
import { Drawer, Pagination, Space, Table, theme } from "antd";
import { useState } from "react";

export type PropRowDetails<T> = {
    data: T | null;
    onClose: () => void;
};
interface ICommonTableProps<T> {
    sortable?: boolean;
    rowKey?: string | ((record: T) => React.Key);
    total?: number;
    dataSource?: T[];
    columns: TableColumnsType<T>;
    paging?: boolean;
    rank?: boolean;
    loading: boolean;
    pagination?: IPagination & {
        onChange: (page: number, pageSize?: number) => void;
    };
    DrawerDetails?: React.ComponentType<PropRowDetails<T>>;
    onRowClick?: (record: T) => void;
    rowSelection?: {
        selectedRowKeys: React.Key[];
        onChange: (keys: React.Key[]) => void;
    };
}

const CommonTable = <T extends object>({
    sortable = true,
    dataSource,
    total,
    DrawerDetails,
    columns,
    paging = true,
    rank = false,
    loading = false,
    pagination,
    onRowClick,
    rowSelection,
    rowKey = "code",
}: ICommonTableProps<T>) => {
    const isMobile = useIsMobile();
    const [selectedRow, setSelectedRow] = useState<T | null>(null);
    const { token } = theme.useToken();

    const dataLength = total || dataSource?.length || 0;

    const handlePageChange = (page: number, pageSize?: number) => {
        pagination?.onChange(page, pageSize);
    };

    // Slice data for pagination when using client-side pagination
    const paginatedData =
        paging && pagination && dataSource
            ? dataSource.slice(
                  (pagination.current - 1) * pagination.limit,
                  pagination.current * pagination.limit,
              )
            : dataSource;

    const onClickRow = (record: T) => {
        return {
            onClick: (event: React.MouseEvent) => {
                // Skip row click if clicking on interactive elements
                const target = event.target as HTMLElement;
                const interactiveElements = [
                    "BUTTON",
                    "A",
                    "INPUT",
                    "SELECT",
                    "TEXTAREA",
                    "svg",
                    "path",
                ];

                // Check if clicked element is interactive
                if (
                    interactiveElements.includes(target.tagName.toUpperCase())
                ) {
                    return;
                }

                // Check if clicked element is inside an interactive element
                const closestInteractive = target.closest(
                    "button, a, input, select, textarea, [role='button'], .ant-btn, .ant-dropdown-trigger, [onclick]",
                );
                if (closestInteractive) {
                    return;
                }

                // Check if any parent has onClick handler or is clickable
                let currentElement: HTMLElement | null = target;
                while (
                    currentElement &&
                    currentElement !== event.currentTarget
                ) {
                    // Check for inline onclick or React onClick
                    if (
                        currentElement.onclick ||
                        currentElement.getAttribute("onclick") ||
                        currentElement.classList.contains("cursor-pointer") ||
                        currentElement.classList.contains(
                            "ant-dropdown-trigger",
                        )
                    ) {
                        return;
                    }
                    currentElement = currentElement.parentElement;
                }

                if (onRowClick) {
                    onRowClick(record);
                } else if (DrawerDetails) {
                    setSelectedRow(record);
                }
            },
            style: {
                cursor: onRowClick || DrawerDetails ? "pointer" : "default",
            },
        };
    };

    const hasNo = columns.some((col) => col.key === "stt");
    if (rank && !hasNo && !isMobile) {
        columns.unshift({
            title: "#",
            key: "stt",
            width: 50,
            render: (_, __, index) => (
                <div>
                    {index +
                        1 +
                        ((pagination?.current ?? 1) - 1) *
                            (pagination?.limit ?? 20)}
                </div>
            ),
        });
    }

    columns.forEach((col) => {
        // Skip column groups that don't have dataIndex
        if (!("dataIndex" in col)) return;

        const column = col as any; // Cast to access dataIndex

        if (!column.sorter && column.dataIndex && sortable) {
            column.sorter = (a: T, b: T) => {
                const aValue = a[column.dataIndex as keyof T];
                const bValue = b[column.dataIndex as keyof T];
                if (typeof aValue === "number" && typeof bValue === "number") {
                    return aValue - bValue;
                }
                if (typeof aValue === "string" && typeof bValue === "string") {
                    return aValue.localeCompare(bValue);
                }
                return 0;
            };
        }

        // Set default sort order for createdAt column (newest first)
        if (column.dataIndex === "createdAt" && !column.defaultSortOrder) {
            column.defaultSortOrder = "descend";
        }

        if (column.width === undefined) {
            column.width = 100;
        }
    });
    const footerProps = {
        scroll: {
            x: "horizontal",
            y: "calc(100vh - 300px)", // Adjust based on your header/footer height
        },
    };

    // Generate rowKey with fallback logic when rowKey is string but property might not exist
    const getRowKeyWithFallback = (): string | ((record: T) => React.Key) => {
        if (typeof rowKey === "function") {
            // Remove index parameter if present
            return (record: T): React.Key => {
                const result = rowKey(record);
                return result;
            };
        }

        if (typeof rowKey === "string") {
            // Return a function that tries the rowKey property first, then falls back
            return (record: T): React.Key => {
                const keyValue = (record as any)[rowKey];
                if (keyValue !== undefined && keyValue !== null) {
                    return String(keyValue);
                }
                // Fallback: try common key properties
                if ("key" in record && (record as any).key !== undefined) {
                    return String((record as any).key);
                }
                if ("id" in record && (record as any).id !== undefined) {
                    return String((record as any).id);
                }
                // Final fallback: use a unique identifier based on record
                return `row-${JSON.stringify(record).slice(0, 50)}-${Math.random().toString(36).slice(2, 11)}`;
            };
        }

        // Default fallback function
        return (record: T): React.Key => {
            if ("key" in record && (record as any).key !== undefined) {
                return String((record as any).key);
            }
            if ("id" in record && (record as any).id !== undefined) {
                return String((record as any).id);
            }
            // Use a unique identifier based on record content
            return `row-${JSON.stringify(record).slice(0, 50)}-${Math.random().toString(36).slice(2, 11)}`;
        };
    };

    const finalRowKey = rowKey
        ? typeof rowKey === "string"
            ? getRowKeyWithFallback()
            : rowKey
        : getRowKeyWithFallback();

    return (
        <>
            <Table<T>
                // {...(paging ? footerProps : {})}
                rowKey={finalRowKey}
                bordered={true}
                loading={loading}
                columns={columns}
                dataSource={paginatedData}
                pagination={false}
                onRow={onClickRow}
                rowSelection={
                    rowSelection
                        ? {
                              type: "checkbox",
                              selectedRowKeys: rowSelection.selectedRowKeys,
                              onChange: rowSelection.onChange,
                          }
                        : undefined
                }
            />

            {paging && pagination && (
                <Space
                    className="flex justify-end w-full sticky bottom-0 z-30 bg-background p-4"
                    vertical
                    style={{
                        borderRadius: token.borderRadius,
                    }}
                    align="end"
                >
                    {paging && pagination && (
                        <Pagination
                            onChange={handlePageChange}
                            pageSize={pagination.limit}
                            total={total ?? dataSource?.length ?? 0}
                            showSizeChanger
                            onShowSizeChange={(_, size) =>
                                pagination.onChange(pagination.current, size)
                            }
                            current={pagination.current}
                            showTotal={(total) => `Tổng ${total} bản ghi`}
                        />
                    )}
                </Space>
            )}
            {DrawerDetails && selectedRow && (
                <Drawer
                    open={!!selectedRow}
                    title="Chi tiết"
                    size={isMobile ? "default" : 600}
                    onClose={() => setSelectedRow(null)}
                    destroyOnHidden
                >
                    <DrawerDetails
                        onClose={() => setSelectedRow(null)}
                        data={selectedRow}
                    />
                </Drawer>
            )}
        </>
    );
};

export default CommonTable;
