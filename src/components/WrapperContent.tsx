/* eslint-disable @typescript-eslint/no-explicit-any */
import AccessDenied from "@/components/AccessDenied";
import { FilterList } from "@/components/FilterList";
import LoaderApp from "@/components/LoaderApp";
import { IParams } from "@/hooks/useFilter";
import { useSetTitlePage } from "@/hooks/useSetTitlePage";
import {
    BREAK_POINT_WIDTH,
    BreakpointEnum,
    useWindowBreakpoint,
} from "@/hooks/useWindowBreakPoint";
import { ColumnSetting, FilterField } from "@/types";
import {
    ArrowLeftOutlined,
    DeleteOutlined,
    FilterOutlined,
    SearchOutlined,
    SettingOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import {
    Button,
    Checkbox,
    Divider,
    Empty,
    Form,
    FormInstance,
    Input,
    Modal,
    Popover,
    Tooltip,
} from "antd";
import dayjs from "dayjs";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";

interface LeftControlsProps {
    isMobile: boolean;
    header: {
        buttonBackTo?: string;
        searchInput?: {
            placeholder: string;
            filterKeys: (keyof any)[];
        };
        columnSettings?: {
            columns: ColumnSetting[];
            onReset?: () => void;
            onChange: (columns: ColumnSetting[]) => void;
        };
        filters?: {
            fields?: FilterField[];
            onReset?: () => void;
        };
    };
    isLoading: boolean;
    isRefetching: boolean;
    router: ReturnType<typeof useRouter>;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    isOpenColumnSettings: boolean;
    setIsOpenColumnSettings: (value: boolean) => void;
    hasActiveColumnSettings: boolean;
    hasFilters: boolean;
    hasActiveFilters: boolean;
    handleResetFilters: () => void;
    isFilterVisible: boolean;
    setIsFilterVisible: React.Dispatch<React.SetStateAction<boolean>>;
    onApplyFilter?:
        | ((
              arr: {
                  key: string;
                  value: any;
              }[],
          ) => void)
        | undefined;
    formFilter: FormInstance<any>;
    showFilterToggle?: boolean;
}

const LeftControls: React.FC<LeftControlsProps> = ({
    isMobile,
    header,
    isLoading,
    isRefetching,
    router,
    searchTerm,
    setSearchTerm,
    isOpenColumnSettings,
    setIsOpenColumnSettings,
    hasActiveColumnSettings,
    hasFilters,
    hasActiveFilters,
    handleResetFilters,
    isFilterVisible,
    setIsFilterVisible,
    onApplyFilter,
    formFilter,
    showFilterToggle = true,
}) => {
    // const previousPathname = usePreviousPathname();
    // const pathName = usePathname();
    // console.log(previousPathname, header.buttonBackTo, pathName, 22222222222222);

    if (isMobile) {
        return (
            <div>
                {header.buttonBackTo && (
                    <Button
                        disabled={isLoading || isRefetching}
                        type="default"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => {
                            if (typeof header.buttonBackTo === "string") {
                                router.push(header.buttonBackTo!);
                            } else {
                                router.back();
                            }
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-3">
                {header.buttonBackTo && (
                    <Button
                        disabled={isLoading || isRefetching}
                        type="default"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.back()}
                    >
                        Quay lại
                    </Button>
                )}

                {header.searchInput && (
                    <Input
                        style={{ width: 256 }}
                        value={searchTerm}
                        placeholder={header.searchInput.placeholder}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        prefix={<SearchOutlined />}
                    />
                )}

                {showFilterToggle &&
                    header.filters &&
                    header.filters.fields && (
                        <Tooltip
                            title={
                                isFilterVisible
                                    ? "Ẩn bộ lọc"
                                    : "Hiển thị bộ lọc"
                            }
                        >
                            <Button
                                disabled={isLoading || isRefetching}
                                type={isFilterVisible ? "primary" : "default"}
                                icon={<FilterOutlined />}
                                onClick={() =>
                                    setIsFilterVisible(!isFilterVisible)
                                }
                            />
                        </Tooltip>
                    )}
                {header.columnSettings && (
                    <Popover
                        trigger="click"
                        placement="bottomLeft"
                        content={
                            <div>
                                <div className=" flex  justify-between  items-center">
                                    <h3 className=" font-medium  mb-0">
                                        Cài đặt cột
                                    </h3>
                                    {header.columnSettings.onReset && (
                                        <Button
                                            disabled={isLoading || isRefetching}
                                            type="link"
                                            size="small"
                                            onClick={() => {
                                                if (
                                                    header.columnSettings
                                                        ?.onReset
                                                ) {
                                                    header.columnSettings.onReset();
                                                }
                                            }}
                                        >
                                            Đặt lại
                                        </Button>
                                    )}
                                </div>
                                <Divider className=" my-2" />

                                <div className="grid grid-rows-5 grid-cols-3 gap-4">
                                    {header.columnSettings.columns.map(
                                        (column) => (
                                            <Checkbox
                                                key={column.key}
                                                checked={column.visible}
                                                onChange={(e) => {
                                                    const newColumns =
                                                        header.columnSettings!.columns.map(
                                                            (col) =>
                                                                col.key ===
                                                                column.key
                                                                    ? {
                                                                          ...col,
                                                                          visible:
                                                                              e
                                                                                  .target
                                                                                  .checked,
                                                                      }
                                                                    : col,
                                                        );
                                                    header.columnSettings!.onChange(
                                                        newColumns,
                                                    );
                                                }}
                                            >
                                                {column.title}
                                            </Checkbox>
                                        ),
                                    )}
                                </div>
                            </div>
                        }
                        open={isOpenColumnSettings}
                        onOpenChange={setIsOpenColumnSettings}
                    >
                        <Tooltip title="Cài đặt cột">
                            <span>
                                <Button
                                    disabled={isLoading || isRefetching}
                                    type={
                                        hasActiveColumnSettings
                                            ? "primary"
                                            : "default"
                                    }
                                    icon={<SettingOutlined />}
                                />
                            </span>
                        </Tooltip>
                    </Popover>
                )}

                {hasFilters && header.filters?.onReset && (
                    <Tooltip title="Đặt lại bộ lọc">
                        <span>
                            <Button
                                disabled={isLoading || isRefetching}
                                onClick={handleResetFilters}
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </span>
                    </Tooltip>
                )}
            </div>
        </div>
    );
};

interface RightControlsProps {
    isMobile: boolean;
    header: {
        refetchDataWithKeys?: string[] | readonly string[];
        filters?: {
            onReset?: () => void;
        };
        buttonEnds?: {
            can?: boolean;
            danger?: boolean;
            isLoading?: boolean;
            type?:
                | "link"
                | "default"
                | "text"
                | "primary"
                | "dashed"
                | undefined;
            onClick?: () => void;
            name: string;
            icon: React.ReactNode;
        }[];
        searchInput?: {
            placeholder: string;
            filterKeys: (keyof any)[];
        };
        columnSettings?: {
            columns: ColumnSetting[];
            onChange: (columns: ColumnSetting[]) => void;
            onReset?: () => void;
        };
    };
    isLoading: boolean;
    isRefetching: boolean;
    hasFilters: boolean;
    handleResetFilters: () => void;
    hasActiveFilters: boolean;
    hasActiveColumnSettings: boolean;
    setIsMobileOptionsOpen: (value: boolean) => void;
    queriesToInvalidate?: (keys: string[] | readonly string[]) => void;
}

const RightControls: React.FC<RightControlsProps> = ({
    isMobile,
    header,
    isLoading,
    isRefetching,
    hasFilters,
    handleResetFilters,
    hasActiveColumnSettings,
    setIsMobileOptionsOpen,
    queriesToInvalidate,
    hasActiveFilters,
}) => {
    const sortedEnds = (header.buttonEnds || [])
        .slice()
        .sort((a, b) => {
            if (a.type === "primary" && b.type !== "primary") return 1;
            if (a.type !== "primary" && b.type === "primary") return -1;
            return 0;
        })
        .filter((buttonEnd) => buttonEnd.can);

    if (isMobile) {
        return (
            <div className="flex gap-2 items-center">
                {header.refetchDataWithKeys && (
                    <Tooltip title="Tải lại dữ liệu">
                        <span>
                            <Button
                                disabled={isLoading || isRefetching}
                                type="default"
                                icon={<SyncOutlined spin={isLoading} />}
                                onClick={() => {
                                    // if (header.refetchDataWithKeys) {
                                    //   queriesToInvalidate(header.refetchDataWithKeys);
                                    // }
                                }}
                            />
                        </span>
                    </Tooltip>
                )}

                {hasFilters && header.filters?.onReset && (
                    <Tooltip title="Đặt lại bộ lọc">
                        <span>
                            <Button
                                disabled={isLoading || isRefetching}
                                onClick={handleResetFilters}
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </span>
                    </Tooltip>
                )}

                {sortedEnds.map((buttonEnd, index) => {
                    if (!buttonEnd.can) return null;
                    return (
                        <Tooltip key={index} title={buttonEnd.name}>
                            <span>
                                <Button
                                    disabled={
                                        isLoading ||
                                        isRefetching ||
                                        !buttonEnd.can
                                    }
                                    loading={buttonEnd.isLoading}
                                    danger={buttonEnd.danger}
                                    type={buttonEnd.type}
                                    onClick={buttonEnd.onClick}
                                    icon={buttonEnd.icon}
                                />
                            </span>
                        </Tooltip>
                    );
                })}

                {(header.searchInput ||
                    header.filters ||
                    header.columnSettings) && (
                    <Tooltip title="Tùy chọn">
                        <Button
                            disabled={isLoading || isRefetching}
                            type={
                                hasActiveFilters || hasActiveColumnSettings
                                    ? "primary"
                                    : "default"
                            }
                            icon={<FilterOutlined />}
                            onClick={() => setIsMobileOptionsOpen(true)}
                        />
                    </Tooltip>
                )}
            </div>
        );
    }

    return (
        <div className="flex gap-3 items-center">
            {header.refetchDataWithKeys && (
                <Tooltip title="Tải lại dữ liệu">
                    <span>
                        <Button
                            disabled={isLoading || isRefetching}
                            type="default"
                            icon={
                                <SyncOutlined
                                    spin={isLoading || isRefetching}
                                />
                            }
                            onClick={() => {
                                if (header.refetchDataWithKeys) {
                                    // queriesToInvalidate(header.refetchDataWithKeys);
                                }
                            }}
                        />
                    </span>
                </Tooltip>
            )}

            {sortedEnds.map((buttonEnd, index) => (
                <Tooltip key={index} title={buttonEnd.name}>
                    <span>
                        <Button
                            disabled={
                                isLoading || buttonEnd.type === "primary"
                                    ? isLoading
                                    : isRefetching
                            }
                            loading={buttonEnd.isLoading}
                            danger={buttonEnd.danger}
                            type={buttonEnd.type}
                            onClick={buttonEnd.onClick}
                            icon={buttonEnd.icon}
                        >
                            {buttonEnd.name}
                        </Button>
                    </span>
                </Tooltip>
            ))}
        </div>
    );
};

interface WrapperContentProps<T extends object> {
    title?: string;
    children: React.ReactNode;
    isLoading?: boolean;
    isRefetching?: boolean;
    isNotAccessible?: boolean;
    isEmpty?: boolean;
    header: {
        buttonBackTo?: string;
        refetchDataWithKeys?: string[] | readonly string[];
        buttonEnds?: {
            can?: boolean;
            danger?: boolean;
            isLoading?: boolean;
            type?:
                | "link"
                | "default"
                | "text"
                | "primary"
                | "dashed"
                | undefined;
            onClick?: () => void;
            name: string;
            icon: React.ReactNode;
        }[];
        customToolbar?: React.ReactNode;
        customToolbarSecondRow?: React.ReactNode;
        searchInput?: {
            placeholder: string;
            filterKeys: (keyof T)[];
        };
        filters?: {
            fields?: FilterField[];
            query?: IParams;
            toggleIcon?: React.ReactNode;
            onApplyFilter: (arr: { key: string; value: any }[]) => void;
            onReset?: () => void;
        };
        columnSettings?: {
            columns: ColumnSetting[];
            onChange: (columns: ColumnSetting[]) => void;
            onReset?: () => void;
        };
    };
    className?: string;
}

function WrapperContent<T extends object>({
    children,
    title,
    header,
    isLoading = false,
    isRefetching = false,
    isNotAccessible = false,
    isEmpty = false,
    className = "",
}: WrapperContentProps<T>) {
    const router = useRouter();
    const [formFilter] = Form.useForm();

    useSetTitlePage(title || "");
    // desktop filter visibility is controlled by toggle button
    const [isOpenColumnSettings, setIsOpenColumnSettings] = useState(false);
    const [isMobileOptionsOpen, setIsMobileOptionsOpen] = useState(false);
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    // Load filter panel collapsed state from localStorage
    const [isFilterPanelCollapsed, setIsFilterPanelCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("filterPanelCollapsed");
            return saved === "true";
        }
        return false;
    });

    // Load toggle button position from localStorage
    const [toggleButtonTop, setToggleButtonTop] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("filterToggleButtonTop");
            return saved ? parseInt(saved, 10) : 127;
        }
        return 120;
    });

    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [dragStartTop, setDragStartTop] = useState(0);
    const breakpoint = useWindowBreakpoint();
    const isMobileView =
        BREAK_POINT_WIDTH[breakpoint] <= BREAK_POINT_WIDTH[BreakpointEnum.LG];
    const [searchTerm, setSearchTerm] = useState(() => {
        if (header.searchInput && header.filters && header.filters.query) {
            const keys = ["search", ...header.searchInput.filterKeys].join(",");
            const query = header.filters.query;
            const term = query[keys];
            return term;
        }
        return "";
    });

    const hasActiveFilters = Boolean(
        header.filters &&
        Object.entries(header.filters.query || {}).some(([key, value]) => {
            // Skip search keys
            if (key.includes("search")) return false;

            // Skip pagination keys
            if (key === "page" || key === "limit") return false;

            // Check string values
            if (typeof value === "string") {
                return value.trim() !== "";
            }

            // Check array values
            if (Array.isArray(value)) {
                return value.length > 0;
            }

            // Check object values (e.g., dateRange with from/to)
            if (value && typeof value === "object") {
                const obj = value as Record<string, any>;
                // Check if it's a date range object
                if ("from" in obj || "to" in obj) {
                    return (
                        (obj.from !== undefined &&
                            obj.from !== null &&
                            obj.from !== "") ||
                        (obj.to !== undefined &&
                            obj.to !== null &&
                            obj.to !== "")
                    );
                }
                // Check other object types
                return Object.keys(obj).length > 0;
            }

            // Check number/boolean values
            if (typeof value === "number" || typeof value === "boolean") {
                return true;
            }

            return false;
        }),
    );
    const hasFilters = hasActiveFilters;
    const hasActiveColumnSettings = Boolean(
        header.columnSettings &&
        header.columnSettings.columns.some((c) => c.visible === false),
    );

    const handleResetFilters = () => {
        if (header.filters?.onReset) {
            header.filters.onReset();
        }
        formFilter.resetFields();
        setSearchTerm("");
    };

    useEffect(() => {
        if (
            !header.filters ||
            typeof header.filters.onApplyFilter !== "function"
        )
            return;
        const getSearchKey = () => {
            if (header.searchInput && header.filters && header.filters.query) {
                const keys = ["search", ...header.searchInput.filterKeys].join(
                    ",",
                );
                return keys;
            }
            return "search";
        };
        const searchKey = getSearchKey();

        const debounced = debounce((value: string) => {
            header.filters!.onApplyFilter([{ key: searchKey, value: value }]);
        }, 500);

        debounced(searchTerm);

        return () => {
            debounced.cancel();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    // Save toggle button position to localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(
                "filterToggleButtonTop",
                toggleButtonTop.toString(),
            );
        }
    }, [toggleButtonTop]);

    // Save filter panel collapsed state to localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(
                "filterPanelCollapsed",
                isFilterPanelCollapsed.toString(),
            );
        }
    }, [isFilterPanelCollapsed]);

    // Sync form with query values
    useEffect(() => {
        if (!header.filters?.query || !header.filters?.fields) return;

        const formValues: Record<string, any> = {};
        const query = header.filters.query;

        header.filters.fields.forEach((field) => {
            const queryValue = query[field.name];

            if (
                queryValue === undefined ||
                queryValue === null ||
                queryValue === ""
            ) {
                return;
            }

            if (
                field.type === "dateRange" &&
                queryValue &&
                typeof queryValue === "object" &&
                !Array.isArray(queryValue)
            ) {
                const dateRange = queryValue as {
                    from?: Date | string;
                    to?: Date | string;
                };
                if (dateRange.from || dateRange.to) {
                    // Convert Date objects or string dates back to dayjs objects for DatePicker.RangePicker
                    const rangeValue = [
                        dateRange.from
                            ? dayjs(
                                  dateRange.from instanceof Date
                                      ? dateRange.from
                                      : new Date(dateRange.from),
                              )
                            : null,
                        dateRange.to
                            ? dayjs(
                                  dateRange.to instanceof Date
                                      ? dateRange.to
                                      : new Date(dateRange.to),
                              )
                            : null,
                    ];
                    // Only set if at least one date is present
                    if (rangeValue[0] || rangeValue[1]) {
                        formValues[field.name] = rangeValue;
                    }
                }
            } else if (field.type === "date" && queryValue) {
                // Convert date string or Date object to dayjs object
                const dateValue =
                    queryValue instanceof Date
                        ? queryValue
                        : new Date(queryValue);
                formValues[field.name] = dayjs(dateValue);
            } else {
                formValues[field.name] = queryValue;
            }
        });

        // Only update form if there are values to set
        if (Object.keys(formValues).length > 0) {
            formFilter.setFieldsValue(formValues);
        }
    }, [header.filters?.query, header.filters?.fields, formFilter]);

    // Handle drag functionality with requestAnimationFrame for smooth dragging
    useEffect(() => {
        if (!isDragging) return;

        let animationFrameId: number;

        const handleMouseMove = (e: MouseEvent) => {
            animationFrameId = requestAnimationFrame(() => {
                const deltaY = e.clientY - dragStartY;
                const newTop = Math.max(
                    60,
                    Math.min(window.innerHeight - 60, dragStartTop + deltaY),
                );
                setToggleButtonTop(newTop);
            });
        };

        const handleMouseUp = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            setIsDragging(false);
        };

        window.addEventListener("mousemove", handleMouseMove, {
            passive: true,
        });
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragStartY, dragStartTop]);

    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragStartY(e.clientY);
        setDragStartTop(toggleButtonTop);
    };

    return (
        <div className={`${className} flex flex-col justify-start relative`}>
            {!isMobileView && header.filters && header.filters.fields ? (
                <>
                    {/* Toggle Button - Fixed Position, Draggable */}
                    {header.filters.fields.length > 0 && (
                        <Button
                            type={hasFilters ? "primary" : "dashed"}
                            size="small"
                            icon={
                                header.filters?.toggleIcon || <FilterOutlined />
                            }
                            onClick={(e) => {
                                if (!isDragging) {
                                    setIsFilterPanelCollapsed(
                                        !isFilterPanelCollapsed,
                                    );
                                }
                            }}
                            onMouseDown={handleDragStart}
                            className={`bg-background shadow-md hover:shadow-lg transition-all duration-300 select-none ${
                                isDragging ? "cursor-grabbing" : "cursor-move"
                            }`}
                            style={{
                                position: "absolute",
                                zIndex: 1000,
                                width: "30px",
                                height: "30px",
                                left: isFilterPanelCollapsed ? "0" : "270px",
                                top: `${toggleButtonTop}px`,
                                pointerEvents: "auto",
                                transition: isDragging
                                    ? "none"
                                    : "all 0.3s ease",
                            }}
                        />
                    )}

                    <div className="flex gap-4 relative">
                        {/* Left Filter Panel */}
                        {header.filters.fields.length > 0 && (
                            <div
                                className={`shrink-0 transition-all duration-300 ease-in-out ${
                                    isFilterPanelCollapsed
                                        ? "w-0 opacity-0 pointer-events-none"
                                        : "w-70 opacity-100"
                                }`}
                                style={{
                                    position: "sticky",
                                    top: "20px",
                                    alignSelf: "flex-start",
                                    height: "fit-content",
                                    maxHeight: "calc(100vh - 40px)",
                                    overflowY: "auto",
                                }}
                            >
                                <div
                                    className={`transition-all duration-300 ${
                                        isFilterPanelCollapsed
                                            ? "-translate-x-full"
                                            : "translate-x-0"
                                    }`}
                                >
                                    <FilterList
                                        isMobile={false}
                                        form={formFilter}
                                        fields={header.filters?.fields || []}
                                        onApplyFilter={(arr) =>
                                            header.filters!.onApplyFilter(arr)
                                        }
                                        onReset={() =>
                                            header.filters?.onReset &&
                                            header.filters.onReset()
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        {/* Right Content Area */}
                        <div className="flex-1 min-w-0 space-y-4 transition-all duration-300 w-full">
                            <div className="flex items-center justify-between">
                                <LeftControls
                                    formFilter={formFilter}
                                    onApplyFilter={
                                        header.filters?.onApplyFilter
                                    }
                                    isMobile={isMobileView}
                                    header={header}
                                    isLoading={isLoading}
                                    isRefetching={isRefetching}
                                    router={router}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    isOpenColumnSettings={isOpenColumnSettings}
                                    setIsOpenColumnSettings={
                                        setIsOpenColumnSettings
                                    }
                                    hasActiveColumnSettings={
                                        hasActiveColumnSettings
                                    }
                                    hasFilters={hasFilters}
                                    hasActiveFilters={hasActiveFilters}
                                    handleResetFilters={handleResetFilters}
                                    isFilterVisible={isFilterVisible}
                                    setIsFilterVisible={setIsFilterVisible}
                                    showFilterToggle={false}
                                />
                                <RightControls
                                    isMobile={isMobileView}
                                    header={header}
                                    isLoading={isLoading}
                                    isRefetching={isRefetching}
                                    hasFilters={hasFilters}
                                    handleResetFilters={handleResetFilters}
                                    hasActiveFilters={hasActiveFilters}
                                    hasActiveColumnSettings={
                                        hasActiveColumnSettings
                                    }
                                    setIsMobileOptionsOpen={
                                        setIsMobileOptionsOpen
                                    }
                                />
                            </div>

                            <Suspense
                                fallback={
                                    <div className="flex min-h-[400px] items-center justify-center">
                                        <LoaderApp />
                                    </div>
                                }
                            >
                                {isNotAccessible && !isLoading && (
                                    <AccessDenied />
                                )}
                                {isEmpty &&
                                    !isNotAccessible &&
                                    !isLoading &&
                                    !isRefetching && (
                                        <div className="flex min-h-[400px] items-center justify-center">
                                            <Empty description="Không có dữ liệu" />
                                        </div>
                                    )}
                                {isLoading && !isRefetching && (
                                    <div className="flex min-h-[400px] items-center justify-center">
                                        <LoaderApp />
                                    </div>
                                )}
                                {!isLoading &&
                                    !isNotAccessible &&
                                    !isEmpty &&
                                    children}
                            </Suspense>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <LeftControls
                            formFilter={formFilter}
                            onApplyFilter={header.filters?.onApplyFilter}
                            isMobile={isMobileView}
                            header={header}
                            isLoading={isLoading}
                            isRefetching={isRefetching}
                            router={router}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            isOpenColumnSettings={isOpenColumnSettings}
                            setIsOpenColumnSettings={setIsOpenColumnSettings}
                            hasActiveColumnSettings={hasActiveColumnSettings}
                            hasFilters={hasFilters}
                            hasActiveFilters={hasActiveFilters}
                            handleResetFilters={handleResetFilters}
                            isFilterVisible={isFilterVisible}
                            setIsFilterVisible={setIsFilterVisible}
                        />
                        <RightControls
                            isMobile={isMobileView}
                            header={header}
                            isLoading={isLoading}
                            isRefetching={isRefetching}
                            hasFilters={hasFilters}
                            handleResetFilters={handleResetFilters}
                            hasActiveFilters={hasActiveFilters}
                            hasActiveColumnSettings={hasActiveColumnSettings}
                            setIsMobileOptionsOpen={setIsMobileOptionsOpen}
                        />
                    </div>

                    {/* Desktop inline filter panel (always visible on desktop) */}
                    {!isMobileView &&
                        header.filters &&
                        header.filters.fields &&
                        isFilterVisible && (
                            <div className="mt-4">
                                <FilterList
                                    isMobile={false}
                                    form={formFilter}
                                    fields={header.filters?.fields || []}
                                    onApplyFilter={(arr) =>
                                        header.filters!.onApplyFilter(arr)
                                    }
                                    onReset={() =>
                                        header.filters?.onReset &&
                                        header.filters.onReset()
                                    }
                                />
                            </div>
                        )}

                    <Suspense
                        fallback={
                            <div className="flex min-h-[400px] items-center justify-center">
                                <LoaderApp />
                            </div>
                        }
                    >
                        {isNotAccessible && !isLoading && <AccessDenied />}
                        {isEmpty &&
                            !isNotAccessible &&
                            !isLoading &&
                            !isRefetching && (
                                <div className="flex min-h-[400px] items-center justify-center">
                                    <Empty description="Không có dữ liệu" />
                                </div>
                            )}
                        {isLoading && !isRefetching && (
                            <div className="flex min-h-[400px] items-center justify-center">
                                <LoaderApp />
                            </div>
                        )}
                        {!isLoading && !isNotAccessible && !isEmpty && children}
                    </Suspense>
                </div>
            )}

            {/* Mobile modal for filters / settings */}
            <Modal
                title="Tùy chọn"
                open={isMobileOptionsOpen}
                onCancel={() => setIsMobileOptionsOpen(false)}
                footer={null}
                destroyOnHidden
            >
                <div className="space-y-4">
                    {header.searchInput && (
                        <Input
                            value={searchTerm}
                            placeholder={header.searchInput.placeholder}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            prefix={<SearchOutlined />}
                        />
                    )}

                    {header.filters && header.filters.fields && (
                        <FilterList
                            isMobile={isMobileView}
                            form={formFilter}
                            onCancel={() => setIsMobileOptionsOpen(false)}
                            fields={header.filters?.fields || []}
                            onApplyFilter={(arr) =>
                                header.filters?.onApplyFilter(arr)
                            }
                            onReset={() =>
                                header.filters?.onReset &&
                                header.filters.onReset()
                            }
                        />
                    )}
                    <Divider className=" my-2" />

                    {header.columnSettings && (
                        <div>
                            <div className=" flex  justify-between  items-center">
                                <h3 className=" font-medium  mb-0">
                                    Cài đặt cột
                                </h3>
                                {header.columnSettings.onReset && (
                                    <Button
                                        disabled={isLoading || isRefetching}
                                        type="link"
                                        size="small"
                                        onClick={() =>
                                            header.columnSettings?.onReset &&
                                            header.columnSettings.onReset()
                                        }
                                    >
                                        Đặt lại
                                    </Button>
                                )}
                            </div>
                            <Divider className=" my-2" />
                            <div className="grid grid-rows-5 grid-cols-2 justify-between gap-4">
                                {header.columnSettings.columns.map((column) => (
                                    <Checkbox
                                        key={column.key}
                                        checked={column.visible}
                                        onChange={(e) => {
                                            const newColumns =
                                                header.columnSettings!.columns.map(
                                                    (col) =>
                                                        col.key === column.key
                                                            ? {
                                                                  ...col,
                                                                  visible:
                                                                      e.target
                                                                          .checked,
                                                              }
                                                            : col,
                                                );
                                            header.columnSettings!.onChange(
                                                newColumns,
                                            );
                                        }}
                                    >
                                        {column.title}
                                    </Checkbox>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}

export default WrapperContent;
