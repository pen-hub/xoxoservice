import {
  DashboardOutlined,
  DollarOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

export const allMenuItems: Array<{
  title: string;
  Icon: React.ComponentType;
  href?: string;
  permission?: string | null;
  prefix?: string;
  children?: Array<{
    title: string;
    href: string;
    permission?: string;
    warehouseType?: "NVL" | "THANH_PHAM";
    warehouseCode?: string;
    noPrefix?: boolean;
  }>;
}> = [
  {
    title: "Thống kê",
    href: "/center",
    Icon: DashboardOutlined,
    permission: null,
  },
  {
    title: "Bán hàng",
    prefix: "",
    Icon: UserOutlined,
    children: [
      {
        title: "Quản lý Leads",
        href: "/leads",
        noPrefix: true,
      },
      {
        title: "Chăm sóc khách hàng",
        href: "/customer-care",
        noPrefix: true,
      },
      {
        title: "Danh sách đơn hàng",
        href: "/orders",
        noPrefix: true,
      },
      // {
      //   title: "Tạo đơn hàng",
      //   href: "/orders/create",
      //   noPrefix: true,
      // },
      {
        title: "Lịch sử mua hàng",
        href: "/orders/history",
        noPrefix: true,
      },
    ],
  },
  {
    title: "Vận hành & Sản xuất",
    prefix: "",
    Icon: ShopOutlined,
    children: [
      {
        title: "Quản lý sản xuất",
        href: "/workflow-management",
        noPrefix: true,
      },
      {
        title: "Kanban dịch vụ",
        href: "/kanban",
        noPrefix: true,
      },
      {
        title: "Theo dõi hàng hóa",
        href: "/product-tracking",
        noPrefix: true,
      },
      {
        title: "Quản lý kho",
        href: "/inventory",
        noPrefix: true,
      },
    ],
  },
  {
    title: "Tài chính",
    prefix: "Quản lý",
    Icon: DollarOutlined,
    children: [
      {
        title: "Thu Chi",
        href: "/finance",
      },
      {
        title: "Lương & Hoa hồng",
        href: "/payroll",
      },
    ],
  },
  {
    title: "Nhân sự",
    prefix: "Quản lý",
    Icon: TeamOutlined,
    children: [
      {
        title: "Tuyển dụng",
        href: "/hr/recruitment",
      },
      {
        title: "Đào tạo",
        href: "/hr/training",
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
          map[normalizePath(child.href)] =
            (child.noPrefix ? "" : item.prefix + " ") + child.title;
        }
      });
    }
  });

  return map;
}

export const breadcrumbMap: Record<string, string> ={
  ...generateBreadcrumbMap(allMenuItems),
}

