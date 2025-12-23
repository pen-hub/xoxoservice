import {
    AppstoreOutlined,
    CalendarOutlined,
    CommentOutlined,
    CustomerServiceOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    DollarOutlined,
    ExperimentOutlined,
    HistoryOutlined,
    IdcardOutlined,
    InboxOutlined,
    LayoutOutlined,
    SafetyCertificateOutlined,
    ShoppingCartOutlined,
    TeamOutlined,
    ToolOutlined,
    UserOutlined,
    HomeOutlined,
    BarChartOutlined,
    ContactsOutlined,
    UsergroupAddOutlined,
    PhoneOutlined,
    MessageOutlined,
    ShopOutlined,
    FileTextOutlined,
    BoxPlotOutlined,
    SettingOutlined,
    ApartmentOutlined,
    ReconciliationOutlined,
    UserSwitchOutlined,
} from "@ant-design/icons";

export const allMenuItems: Array<{
    title: string;
    Icon: React.ComponentType;
    href?: string;
    permission?: string | null;
    prefix?: string;
    disable?: boolean;
    color?: string; // Added color property
    children?: Array<{
        icon: React.ComponentType;
        title: string;
        nonPrefix?: boolean;
        href: string;
        permission?: string;
        disable?: boolean;
        color?: string; // Added color property for children
    }>;
}> = [
        {
            title: "Trung tâm",
            href: "/center",
            Icon: HomeOutlined,
            permission: null,
        },
        {
            title: "Thống kê",
            href: "/dashboard",
            Icon: BarChartOutlined,
            permission: null,
        },
        {
            title: "Khách hàng",
            prefix: "Quản lý",
            Icon: ContactsOutlined,
            color: "#52c41a", // Green
            children: [
                {
                    icon: ContactsOutlined,
                    title: "Lead Khách hàng",
                    href: "/customers",
                    color: "#52c41a",
                },
                {
                    icon: UsergroupAddOutlined,
                    title: "Nhóm khách",
                    href: "/customers/groups",
                    color: "#52c41a",
                },
                // {
                //   icon: ContactsOutlined,
                //   title: "Leads",
                //   href: "/customers/leads",
                // },
                {
                    icon: PhoneOutlined,
                    nonPrefix: true,
                    title: "CSKH",
                    href: "/customers/customer-care",
                    color: "#13c2c2", // Cyan
                },
                {
                    icon: MessageOutlined,
                    title: "Feedback",
                    href: "/customers/feedback",
                    color: "#722ed1", // Purple
                },
                {
                    icon: CalendarOutlined,
                    title: "Lịch hẹn",
                    href: "/customers/appointments",
                },

                {
                    icon: DollarOutlined,
                    title: "Hoàn tiền",
                    href: "/censor/refunds",
                },
            ],
        },
        {
            title: "Bán hàng",
            prefix: "Quản lý",
            Icon: ShopOutlined,
            color: "#1890ff", // Blue
            children: [
                {
                    icon: FileTextOutlined,
                    title: "Đơn hàng",
                    href: "/sale/orders",
                },

                {
                    icon: SafetyCertificateOutlined,
                    title: "Bảo hành",
                    href: "/sale/warranty",
                },
                {
                    icon: LayoutOutlined,
                    nonPrefix: true,
                    title: "Kanban",
                    href: "/sale/kanban",
                    color: "#fa8c16", // Orange
                },
            ],
        },
        {
            title: "Kho",
            prefix: "Quản lý",
            Icon: BoxPlotOutlined,
            color: "#fa8c16", // Orange
            children: [
                {
                    icon: DatabaseOutlined,
                    title: "Tồn kho",
                    href: "/inventory",
                    color: "#fa8c16",
                },
                {
                    icon: AppstoreOutlined,
                    title: "Danh mục",
                    href: "/inventory/categories",
                    color: "#fa8c16",
                },
                {
                    icon: HistoryOutlined,
                    title: "Lịch sử",
                    href: "/inventory/history",
                    color: "#fa8c16",
                },
            ],
        },
        {
            title: "Dịch vụ",
            prefix: "Quản lý",
            Icon: SettingOutlined,
            color: "#faad14", // Gold/Yellow
            children: [
                {
                    icon: CustomerServiceOutlined,
                    title: "Dịch vụ",
                    href: "/services",
                    color: "#faad14",
                },
                {
                    icon: InboxOutlined,
                    title: "Gói dịch vụ",
                    href: "/services/packages",
                    color: "#faad14",
                },
            ],
        },
        // {
        //   title: "Tài chính",
        //   prefix: "Quản lý",
        //   Icon: DollarOutlined,
        //   children: [
        //     {
        //       icon: MoneyCollectOutlined,
        //       title: "Thu Chi",
        //       href: "/finance",
        //     },
        //     {
        //       icon: CalculatorOutlined,
        //       disable: true,

        //       title: "Lương & Hoa hồng",
        //       href: "/_old/payroll",
        //     },
        //   ],
        // },
        {
            title: "Nhân sự",
            prefix: "Quản lý",
            Icon: UsergroupAddOutlined,
            color: "#eb2f96", // Pink
            children: [
                {
                    icon: IdcardOutlined,
                    title: "Nhân viên",
                    href: "/hr/members",
                    color: "#eb2f96",
                },
                {
                    icon: DollarOutlined,
                    title: "Mẫu lương",
                    href: "/hr/salary-templates",
                    color: "#eb2f96",
                },
                // {
                //   icon: BookOutlined,
                //   title: "Đào tạo",
                //   href: "/hr/training",
                // },
            ],
        },
        {
            title: "Kỹ thuật",
            Icon: SettingOutlined,
            color: "#2f54eb", // Geekblue
            children: [
                {
                    icon: UserSwitchOutlined,
                    title: "Giao việc",
                    href: "/technician/task-assignment",
                    color: "#13c2c2", // Cyan
                },
                {
                    icon: ApartmentOutlined,
                    title: "Phòng ban",
                    href: "/technician/departments",
                    color: "#2f54eb",
                },
                {
                    icon: ReconciliationOutlined,
                    title: "Quy trình",
                    href: "/technician/workflows",
                    color: "#2f54eb",
                },
                {
                    icon: FileTextOutlined,
                    title: "Công việc",
                    href: "/technician/todo",
                    color: "#2f54eb",
                },
            ],
        },
    ];

function normalizePath(p?: string) {
    if (!p) return "";
    let path = p.trim();
    if (!path.startsWith("/")) path = "/" + path;
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return path;
}

function generateBreadcrumbMap(
    items: typeof allMenuItems,
): Record<string, string> {
    const map: Record<string, string> = {};

    items.forEach((item) => {
        if (item.href) {
            map[normalizePath(item.href)] = item.title;
        }

        if (item.children && item.children.length) {
            // derive a base path for the parent menu (e.g. '/inventory') from the first child's href
            const firstChildHref = item.children.find((c) => !!c.href)?.href;
            if (firstChildHref) {
                const segments = normalizePath(firstChildHref).split("/");
                const base = segments[1] ? `/${segments[1]}` : "";
                if (base) map[base] = item.title;
            }

            item.children.forEach((child) => {
                if (child.href) {
                    map[normalizePath(child.href)] = child.nonPrefix
                        ? child.title
                        : item.prefix
                            ? item.prefix + " " + child.title
                            : child.title;
                }
            });
        }
    });

    return map;
}

export const breadcrumbMap: Record<string, string> = {
    ...generateBreadcrumbMap(allMenuItems),
};
