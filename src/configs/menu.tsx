import {
  AppstoreOutlined,
  CalculatorOutlined,
  CalendarOutlined,
  CommentOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DollarOutlined,
  ExperimentOutlined,
  IdcardOutlined,
  InboxOutlined,
  LayoutOutlined,
  MoneyCollectOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";

export const allMenuItems: Array<{
  title: string;
  Icon: React.ComponentType;
  href?: string;
  permission?: string | null;
  prefix?: string;
  disable?: boolean;
  children?: Array<{
    icon: React.ComponentType;
    title: string;
    nonPrefix?: boolean;
    href: string;
    permission?: string;
    disable?: boolean;
  }>;
}> = [
  {
    title: "Trung tâm",
    href: "/center",
    Icon: AppstoreOutlined,
    permission: null,
  },
  {
    title: "Thống kê",
    href: "/dashboard",
    Icon: DashboardOutlined,
    permission: null,
  },
  {
    title: "Khách hàng",
    prefix: "Quản lý",
    Icon: UserOutlined,
    children: [
      {
        icon: IdcardOutlined,
        title: "Khách hàng",
        href: "/customers",
      },
      // {
      //   icon: ContactsOutlined,
      //   title: "Leads",
      //   href: "/customers/leads",
      // },
      {
        icon: CustomerServiceOutlined,
        nonPrefix: true,
        title: "CSKH",
        href: "/customers/customer-care",
      },
      {
        icon: CommentOutlined,
        title: "Feedback",
        href: "/customers/feedback",
      },
      {
        icon: CalendarOutlined,
        title: "Lịch hẹn",
        href: "/customers/appointments",
      },

      {
        icon: DollarOutlined,
        title: "Hoàn tiền",
        href: "/customers/refunds",
      },
    ],
  },
  {
    title: "Bán hàng",
    prefix: "Quản lý",
    Icon: ShoppingCartOutlined,
    children: [
      {
        icon: InboxOutlined,
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
      },
    ],
  },
  {
    title: "Kho",
    prefix: "Quản lý",
    Icon: DatabaseOutlined,
    children: [
      {
        icon: DatabaseOutlined,
        title: "Tồn kho",
        href: "/inventory",
      },
      {
        icon: AppstoreOutlined,
        title: "Danh mục",
        href: "/inventory/categories",
      },
      {
        icon: DatabaseOutlined,
        title: "Lịch sử",
        href: "/inventory/history",
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
    Icon: TeamOutlined,
    children: [
      {
        icon: IdcardOutlined,
        title: "Nhân viên",
        href: "/hr/members",
      },
      {
        icon: DollarOutlined,
        title: "Mẫu lương",
        href: "/hr/salary-templates",
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
    Icon: ToolOutlined,
    children: [
      {
        icon: IdcardOutlined,
        title: "Phòng ban",
        href: "/technician/departments",
      },
      {
        icon: ExperimentOutlined,
        title: "Quy trình",
        href: "/technician/workflows",
      },
      {
        icon: InboxOutlined,
        title: "Công việc",
        href: "/technician/todo",
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
  items: typeof allMenuItems
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
