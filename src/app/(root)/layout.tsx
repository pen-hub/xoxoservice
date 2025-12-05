"use client";

import LoaderApp from "@/components/LoaderApp";
import { allMenuItems, breadcrumbMap } from "@/configs/menu";
import { useAuth, useUser } from "@/firebase/provider";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTheme } from "@/providers/AppThemeProvider";
import { useSiteTitleStore } from "@/stores/setSiteTitle";
import {
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  Avatar,
  Breadcrumb,
  Button,
  Drawer,
  Dropdown,
  Layout,
  Menu,
  Typography,
  theme,
} from "antd";
import { signOut } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface FirebaseUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageTitle = useSiteTitleStore((state) => state.title);
  const router = useRouter();
  const pathname = usePathname();
  const { mode, themeName, setMode, setThemeName } = useTheme();
  const { token } = theme.useToken();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  // All other hooks must be called before any conditional returns
  const getBreadcrumbTitle = (path: string) => {
    // Kiểm tra exact match
    if (breadcrumbMap[path])
      return {
        title: breadcrumbMap[path],
        path: path,
      };

    // Kiểm tra dynamic routes (có /[id]/)
    for (const [key, value] of Object.entries(breadcrumbMap)) {
      if (path.startsWith(key + "/")) {
        return {
          title: value,
          path: key,
        };
      }
    }

    return { title: "Trang chủ", path: "/dashboard" };
  };

  const menuItems = allMenuItems
    .map((item) => {
      // if (item.children) {
      //   const filteredChildren = item.children.filter(
      //     (child) => !child.permission || can(child.permission, "view")
      //   );

      //   if (filteredChildren.length === 0) return null;

      //   return { ...item, children: filteredChildren };
      // }

      // if (item.permission) return null;

      return item;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const antdMenuItems: MenuProps["items"] = menuItems.map((item, idx) => {
    // Use href path as the stable key for both root items and children
    const ellipsisStyle: React.CSSProperties = {
      display: "inline-block",
      maxWidth: 140,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      verticalAlign: "middle",
      color: "white",
    };

    if (item.href) {
      return {
        key: item.href,
        icon: <item.Icon />,
        label: (
          <Link href={item.href}>
            <span style={ellipsisStyle}>{item.title}</span>
          </Link>
        ),
      };
    }

    // Group item (has children)
    return {
      key: `group-${idx}`,
      icon: <item.Icon />,
      label: <span style={ellipsisStyle}>{item.title}</span>,
      children: item.children?.map((child) => ({
        key: child.href,
        label: (
          <Link href={child.href}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span style={ellipsisStyle}>{child.title}</span>
            </div>
          </Link>
        ),
      })),
    };
  });

  // Helper: normalize a menu key (strip query string and trailing slash)
  const normalizeKey = (key?: React.Key) => {
    if (!key) return "";
    const withoutQuery = String(key).split("?")[0];
    // remove trailing slash except when the path is just '/'
    return withoutQuery === "/" ? "/" : withoutQuery.replace(/\/$/, "");
  };

  // normalized current pathname (no trailing slash)
  const normPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  // Find the most specific menu key matching the current pathname
  const getSelectedKey = () => {
    let bestKey: string | null = null;
    let bestLen = 0;

    for (const item of antdMenuItems || []) {
      // children entries (sub menu)
      if (item && "children" in item && item.children) {
        for (const child of item.children) {
          if (!child || !("key" in child)) continue;
          const key = normalizeKey(child.key);
          if (!key) continue;
          if (normPath === key || normPath.startsWith(key + "/")) {
            if (key.length > bestLen) {
              bestLen = key.length;
              bestKey = String(child.key);
            }
          }
        }
      }

      // top-level direct link entries
      if (
        item &&
        "key" in item &&
        typeof item.key === "string" &&
        !item.key.startsWith("group-")
      ) {
        const key = normalizeKey(item.key);
        if (!key) continue;
        if (normPath === key || normPath.startsWith(key + "/")) {
          if (key.length > bestLen) {
            bestLen = key.length;
            bestKey = item.key as string;
          }
        }
      }
    }

    return bestKey ? [bestKey] : [];
  };

  const getOpenKeys = () => {
    const openKeys: string[] = [];
    for (const item of antdMenuItems || []) {
      if (!item || !("children" in item) || !item.children) continue;
      const hasActiveChild = item.children.some((child) => {
        if (!child || !("key" in child)) return false;
        const key = normalizeKey(child.key);
        return key && (normPath === key || normPath.startsWith(key + "/"));
      });
      if (hasActiveChild && item.key) openKeys.push(String(item.key));
    }
    return openKeys;
  };

  // Controlled open keys for accordion behavior: keep only one submenu open at a time
  const [openKeys, setOpenKeys] = useState<string[]>(getOpenKeys());

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getBreadcrumbItems = () => {
    const items = [
      {
        title: (
          <Link href="/dashboard">
            <span className="flex gap-2 items-center">
              <DashboardOutlined /> <span>Dashboard</span>
            </span>
          </Link>
        ),
      },
    ];

    if (pathname !== "/dashboard") {
      items.push({
        title: (
          <Link href={getBreadcrumbTitle(pathname).path}>
            <span className="flex gap-2 items-center">
              <span>{getBreadcrumbTitle(pathname).title}</span>
            </span>
          </Link>
        ),
      });
    }

    return items;
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: handleLogout,
      danger: true,
    },
  ];

  const handleOpenChange = (keys: string[]) => {
    // keep only the most recently opened key (accordion)
    if (!keys || keys.length === 0) {
      setOpenKeys([]);
      return;
    }
    setOpenKeys([keys[keys.length - 1]]);
  };

  // Effects - must be called before any conditional returns
  useEffect(() => {
    // update open keys when pathname changes (e.g. navigation)
    setOpenKeys(getOpenKeys());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    setOpenKeys(getOpenKeys());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, menuItems.length]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/auth");
    }
  }, [user, isUserLoading, router]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={!isMobile && !sidebarOpen}
          width={240}
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          {!isMobile && (
            <>
              <div
                style={{
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {!isMobile && sidebarOpen ? (
                  <Text
                    style={{
                      color: token.colorPrimary,
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                  >
                    <Image src="/logo.png" alt="Logo" width={120} height={40} />
                  </Text>
                ) : (
                  <span
                    style={{ fontSize: 24 }}
                    className="text-primary font-bold"
                  >
                    X
                  </span>
                )}
              </div>

              <Menu
                style={{
                  backgroundColor: "#000000",
                }}
                mode="inline"
                theme="dark"
                selectedKeys={getSelectedKey()}
                openKeys={openKeys}
                onOpenChange={handleOpenChange}
                items={antdMenuItems}
                onClick={() => {
                  /* no-op on desktop */
                }}
              />
            </>
          )}
        </Sider>
      )}
      {isMobile && (
        <Drawer
          title={<Image src="/logo.png" alt="Logo" width={120} height={40} />}
          style={{
            backgroundColor: "#000000",
          }}
          placement="left"
          onClose={() => setSidebarOpen(false)}
          open={isMobile && sidebarOpen}
          closable={true}
          size={240}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
            }}
          >
            <div>
              <Menu
                style={{
                  backgroundColor: "#000000",
                }}
                mode="inline"
                theme="dark"
                selectedKeys={getSelectedKey()}
                openKeys={openKeys}
                onOpenChange={handleOpenChange}
                items={antdMenuItems}
                onClick={() => setSidebarOpen(false)}
              />
            </div>

            <div
              style={{
                padding: 12,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "user-info",
                      label: (
                        <div className="flex flex-col items-center p-2">
                          <Text strong style={{ color: "white" }}>
                            {user?.displayName || user?.email}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: "rgba(255, 255, 255, 0.65)",
                            }}
                          >
                            {user?.email}
                          </Text>
                        </div>
                      ),
                      disabled: true,
                    },
                    { type: "divider" },
                    ...userMenuItems,
                  ],
                  style: {
                    backgroundColor: "#141414",
                    border: "1px solid #434343",
                  },
                  className: "user-dropdown-menu",
                }}
                placement="topLeft"
                trigger={["click"]}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderRadius: token.borderRadius,
                    transition: "background-color 0.2s",
                  }}
                  className="hover:bg-gray-800"
                >
                  <Avatar
                    icon={<UserOutlined />}
                    style={{
                      marginRight: 8,
                      backgroundColor: token.colorPrimary,
                    }}
                  />
                  <div className="flex flex-col">
                    <Text strong style={{ color: "white" }}>
                      {user?.displayName || user?.email}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "rgba(255, 255, 255, 0.65)",
                      }}
                    >
                      {user?.email}
                    </Text>
                  </div>
                </div>
              </Dropdown>
            </div>
          </div>
        </Drawer>
      )}
      <Layout
        style={{
          marginLeft: !isMobile && sidebarOpen ? 240 : isMobile ? 0 : 80,
          transition: "all 0.2s",
        }}
      >
        <Header
          style={{
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${token.colorBorder}`,
            borderLeft: `1px solid ${token.colorBorder}`,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div className="flex gap-3 items-center">
            <Button
              type="text"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              icon={sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            />

            <Breadcrumb
              items={[
                ...getBreadcrumbItems(),
                {
                  title: <span>{pageTitle}</span>,
                },
              ]}
            />
          </div>

          {!isMobile && (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    marginRight: 8,
                    backgroundColor: token.colorPrimary,
                  }}
                />
                <div className="flex flex-col">
                  <Text strong>{user?.displayName || user?.email}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {user?.email}
                  </Text>
                </div>
              </div>
            </Dropdown>
          )}
        </Header>

        <Content
          style={{
            margin: "10px",
            padding: 20,
            background: token.colorBgContainer,
            minHeight: 280,
            borderRadius: token.borderRadius,
          }}
        >
          {isUserLoading ? (
            <div
              style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LoaderApp />
            </div>
          ) : (
            children
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
