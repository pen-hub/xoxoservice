import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import weekOfYear from "dayjs/plugin/weekOfYear";

dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);

export interface DatePreset {
    label: string;
    value: string;
    getRange: () => { from: Date; to: Date };
}

export const getDatePresets = (): DatePreset[] => {
    const today = dayjs();
    const yesterday = today.subtract(1, "day");
    
    // Tuần này (Thứ 2 đến Chủ nhật)
    const startOfWeek = today.startOf("isoWeek");
    const endOfWeek = today.endOf("isoWeek");
    
    // Tuần trước
    const startOfLastWeek = startOfWeek.subtract(1, "week");
    const endOfLastWeek = endOfWeek.subtract(1, "week");
    
    // Tháng này
    const startOfMonth = today.startOf("month");
    const endOfMonth = today.endOf("month");
    
    return [
        {
            label: "Hôm nay",
            value: "today",
            getRange: () => ({
                from: today.startOf("day").toDate(),
                to: today.endOf("day").toDate(),
            }),
        },
        {
            label: "Hôm qua",
            value: "yesterday",
            getRange: () => ({
                from: yesterday.startOf("day").toDate(),
                to: yesterday.endOf("day").toDate(),
            }),
        },
        {
            label: "Tuần này",
            value: "thisWeek",
            getRange: () => ({
                from: startOfWeek.startOf("day").toDate(),
                to: endOfWeek.endOf("day").toDate(),
            }),
        },
        {
            label: "Tuần trước",
            value: "lastWeek",
            getRange: () => ({
                from: startOfLastWeek.startOf("day").toDate(),
                to: endOfLastWeek.endOf("day").toDate(),
            }),
        },
        {
            label: "Tháng này",
            value: "thisMonth",
            getRange: () => ({
                from: startOfMonth.startOf("day").toDate(),
                to: endOfMonth.endOf("day").toDate(),
            }),
        },
        // Tháng 1 đến 12 của năm hiện tại
        ...Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const monthStart = dayjs().month(month - 1).startOf("month");
            const monthEnd = dayjs().month(month - 1).endOf("month");
            return {
                label: `Tháng ${month}`,
                value: `month_${month}`,
                getRange: () => ({
                    from: monthStart.startOf("day").toDate(),
                    to: monthEnd.endOf("day").toDate(),
                }),
            };
        }),
    ];
};

export const getDateRangeByPreset = (presetValue: string): { from: Date; to: Date } | null => {
    const presets = getDatePresets();
    const preset = presets.find((p) => p.value === presetValue);
    return preset ? preset.getRange() : null;
};

