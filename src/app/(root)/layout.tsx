"use client";

import LoaderApp from "@/components/LoaderApp";
import FeatureSearch from "@/components/FeatureSearch";
import { allMenuItems, breadcrumbMap } from "@/configs/menu";
import ROLES_CONFIG from "@/configs/role";
import { useAuth, useUser } from "@/firebase/provider";
import { useIsMobile } from "@/hooks/useIsMobile";
import ProtectedRoutes from "@/middlewares/ProtectedRoutes";
import { useSiteTitleStore } from "@/stores/setSiteTitle";
import { RoleLabels } from "@/types/enum";
import {
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
    HomeOutlined,
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
import { useEffect, useMemo, useState } from "react";

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
    modal,
}: {
    children: React.ReactNode;
    modal: React.ReactNode;
}) {
    const pageTitle = useSiteTitleStore((state) => state.title);
    const router = useRouter();
    const pathname = usePathname();
    const { token } = theme.useToken();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const isMobile = useIsMobile();
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [allowedPaths, setAllowedPaths] = useState<string[]>([]);

    // Get user role from token
    useEffect(() => {
        if (!user || isUserLoading) return;

        const getRole = async () => {
            try {
                const token = await user.getIdTokenResult();
                const role = token.claims.role as string;
                setUserRole(role);

                const paths =
                    ROLES_CONFIG[role as keyof typeof ROLES_CONFIG] || [];
                setAllowedPaths(paths);
            } catch (error) {
                console.error("Error getting user role:", error);
            }
        };

        getRole();
    }, [user, isUserLoading]);

    // Filter menu items based on role
    const filteredMenuItems = useMemo(() => {
        if (!userRole || allowedPaths.length === 0) {
            return [];
        }

        // Helper function to check if a path is allowed
        const isPathAllowed = (path: string | undefined): boolean => {
            if (!path) return false;
            if (allowedPaths.includes("all")) return true;

            // Normalize path (remove trailing slash, ensure starts with /)
            const normalizedPath = path.startsWith("/") ? path : `/${path}`;
            const cleanPath =
                normalizedPath.endsWith("/") && normalizedPath !== "/"
                    ? normalizedPath.slice(0, -1)
                    : normalizedPath;

            // Check exact match or if path starts with any allowed path (prefix matching)
            return allowedPaths.some((allowedPath) => {
                if (allowedPath === "all") return true;

                // Normalize allowed path
                const normalizedAllowed = allowedPath.startsWith("/")
                    ? allowedPath
                    : `/${allowedPath}`;
                const cleanAllowed =
                    normalizedAllowed.endsWith("/") && normalizedAllowed !== "/"
                        ? normalizedAllowed.slice(0, -1)
                        : normalizedAllowed;

                // Exact match
                if (cleanPath === cleanAllowed) return true;

                // Prefix match: if menu path starts with allowed path + "/"
                // Example: "/sale/orders" matches allowed path "/sale"
                if (cleanPath.startsWith(cleanAllowed + "/")) return true;

                return false;
            });
        };

        return allMenuItems
            .map((item) => {
                // If item has direct href, check if it's allowed
                if (item.href) {
                    return isPathAllowed(item.href) ? item : null;
                }

                // If item has children, filter children and keep parent if any child is allowed
                if (item.children && item.children.length > 0) {
                    const allowedChildren = item.children.filter((child) =>
                        isPathAllowed(child.href),
                    );

                    // Keep parent menu if it has at least one allowed child
                    if (allowedChildren.length > 0) {
                        // Return a new object with filtered children (don't mutate original)
                        return {
                            ...item,
                            children: allowedChildren,
                        };
                    }
                    return null;
                }

                // If no href and no children, exclude it
                return null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
    }, [userRole, allowedPaths]);

    // All other hooks must be called before any conditional returns
    const getBreadcrumbTitle = (path: string) => {
        // Kiểm tra exact match
        if (breadcrumbMap[path]) {
            const parentItem = allMenuItems.find((item) =>
                item.children?.some((child) => child.href === path),
            );

            // Get parent path from first child href
            let parentPath: string | null = null;
            if (parentItem?.children && parentItem.children.length > 0) {
                const firstChildHref = parentItem.children.find((c) => !!c.href)?.href;
                if (firstChildHref) {
                    const segments = firstChildHref.split("/");
                    parentPath = segments[1] ? `/${segments[1]}` : null;
                }
            }

            return {
                title: breadcrumbMap[path],
                path: path,
                parent: parentItem?.title || null,
                parentPath: parentPath,
            };
        }

        // // Kiểm tra dynamic routes (có /[id]/)
        // for (const [key, value] of Object.entries(breadcrumbMap)) {
        //   if (path.startsWith(key + "/")) {
        //     return {
        //       title: value,
        //       path: key,
        //       parent: value,
        //     };
        //   }
        // }

        return { title: "Trang chủ", path: "/dashboard", parent: null, parentPath: null };
    };

    // Contextual Menu Logic
    const menuItems = useMemo(() => {
        // 1. Always ensure 'Center' is available at the top/start logic
        const homeItem = (filteredMenuItems.find((item) => item.href === "/center") || {
            title: "Trung tâm",
            href: "/center",
            Icon: HomeOutlined,
            permission: null,
            prefix: undefined,
            disable: false,
            children: undefined,
            color: undefined,
        }) as (typeof allMenuItems)[number];

        // 2. Identify current active module based on pathname
        // Ex: /customers/leads -> belongs to 'Khách hàng' module
        const activeModule = filteredMenuItems.find((item) =>
            item.children?.some((child) => {
                const childPath = child.href.split("?")[0]; // remove query params
                return pathname === childPath || pathname.startsWith(childPath + "/");
            })
        );

        // 3. If we are in a specific module (and it has children), show Home + Module Submenu
        if (activeModule && activeModule.children && activeModule.children.length > 0) {
            // Check if we are actually allowed to see this module (already filtered by filteredMenuItems)

            // Map children to top-level menu items format
            const moduleSubItems = activeModule.children.map(child => ({
                ...child,
                Icon: child.icon, // map 'icon' (component) to 'Icon' (prop expected by renderer or keep consistency)
                // Ensure structure matches what antdMenuItems map expects.
                // Currently antdMenuItems maps: item.Icon -> <item.Icon />
                // The children have 'icon' property.
            }));

            // We need to adapt the children structure to match the top-level structure
            // expected by the rendering logic down below.
            // Rendering logic expects: title, href, Icon (ComponentType), children?

            // Re-map children to fit the top-level schema
            const contextualItems = moduleSubItems.map(child => ({
                title: child.title,
                href: child.href,
                Icon: child.icon,
                permission: child.permission,
                disable: child.disable,
                prefix: child.title, // Use title as prefix or undefined
                color: child.color,
                children: undefined, // Flattened
            })) as (typeof allMenuItems)[number][];

            // Only show Home + Contextual Items
            // But if we are ON the center page, show full list?
            // pathname check:
            if (pathname === '/center' || pathname === '/dashboard') {
                return filteredMenuItems;
            }

            return [homeItem, ...contextualItems];
        }

        // 4. Fallback: Show full menu if no specific module matched or on Dashboard/Center
        return filteredMenuItems;
    }, [filteredMenuItems, pathname]);

    // Build menu items with SubMenu for parent items with children
    const antdMenuItems: MenuProps["items"] = useMemo(() => {
        const items: MenuProps["items"] = [];

        const ellipsisStyle: React.CSSProperties = {
            display: "inline-block",
            maxWidth: 140,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            verticalAlign: "middle",
            color: "white",
        };

        const disabledStyle: React.CSSProperties = {
            opacity: 0.5,
            cursor: "not-allowed",
        };

        menuItems.forEach((item) => {
            // If item has direct href, add it as a top-level item
            if (item.href) {
                items.push({
                    key: item.href,
                    icon: <item.Icon />,
                    disabled: item.disable,
                    label: (
                        <Link href={item.disable ? "#" : item.href}>
                            <span
                                style={
                                    item.disable
                                        ? { ...ellipsisStyle, ...disabledStyle }
                                        : ellipsisStyle
                                }
                            >
                                {item.title}
                            </span>
                        </Link>
                    ),
                });
            }

            // If item has children, add as SubMenu (collapsible)
            if (item.children && item.children.length > 0) {
                items.push({
                    key: `group-${item.title}`,
                    icon: <item.Icon />,
                    label: (
                        <span style={ellipsisStyle}>
                            {item.title}
                        </span>
                    ),
                    children: item.children.map((child) => ({
                        key: child.href,
                        icon: <child.icon />,
                        disabled: child.disable,
                        label: (
                            <Link href={child.disable ? "#" : child.href}>
                                <span
                                    style={
                                        child.disable
                                            ? { ...ellipsisStyle, ...disabledStyle }
                                            : ellipsisStyle
                                    }
                                >
                                    {child.title}
                                </span>
                            </Link>
                        ),
                    })),
                });
            }
        });

        return items;
    }, [menuItems]);

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

    // No longer need openKeys state since menu is flat (no accordion)

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/auth");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const getBreadcrumbItems = () => {
        const rootPath = "/center";
        const rootTitle = "Trung tâm";

        const items = [
            {
                title: (
                    <Link href={rootPath}>
                        <span className="flex gap-2 items-center">
                            <span
                                className={
                                    pathname === rootPath
                                        ? "font-bold text-primary"
                                        : ""
                                }
                            >
                                {rootTitle}
                            </span>
                        </span>
                    </Link>
                ),
            },
        ];

        // Only add additional breadcrumb items if not on root path
        if (pathname !== rootPath) {
            const breadcrumbInfo = getBreadcrumbTitle(pathname);

            // Add parent if exists and different from root
            if (breadcrumbInfo.parent && breadcrumbInfo.parent !== rootTitle) {
                const parentPath = breadcrumbInfo.parentPath || "/center";
                items.push({
                    title: (
                        <Link href={parentPath}>
                            <span className="flex gap-2 items-center">
                                <span
                                    className={
                                        pathname === parentPath || pathname.startsWith(parentPath + "/")
                                            ? "font-bold text-primary"
                                            : ""
                                    }
                                >
                                    {breadcrumbInfo.parent}
                                </span>
                            </span>
                        </Link>
                    ),
                });
            }

            // Add current page if different from root
            if (breadcrumbInfo.title && breadcrumbInfo.title !== rootTitle) {
                items.push({
                    title: (
                        <Link href={breadcrumbInfo.path}>
                            <span className="flex gap-2 items-center">
                                <span
                                    className={
                                        pathname === breadcrumbInfo.path
                                            ? "font-bold text-primary"
                                            : ""
                                    }
                                >
                                    {breadcrumbInfo.title}
                                </span>
                            </span>
                        </Link>
                    ),
                });
            }
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

    // No longer need handleOpenChange or openKeys effects since menu is flat

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
                    width={200}
                    style={{
                        overflow: "auto",
                        height: "100vh",
                        position: "fixed",
                        color: "white",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 90,
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
                                        <Image
                                            src="/logo.png"
                                            alt="Logo"
                                            width={120}
                                            height={40}
                                        />
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
                                    color: "white",
                                }}
                                mode="inline"
                                theme="dark"
                                selectedKeys={getSelectedKey()}
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
                    title={
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={120}
                            height={40}
                        />
                    }
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
                                                    <Text
                                                        strong
                                                        style={{
                                                            color: "white",
                                                        }}
                                                    >
                                                        {user?.displayName ||
                                                            user?.email}
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
                                            {user?.displayName || user?.email}{" "}
                                            {`(${RoleLabels[userRole as keyof typeof RoleLabels]})`}
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
                    marginLeft:
                        !isMobile && sidebarOpen ? 200 : isMobile ? 0 : 80,
                    transition: "all 0.2s",
                }}
            >
                <Header
                    style={{
                        paddingTop: "env(safe-area-inset-top, 0px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: `1px solid ${token.colorBorder}`,
                        borderRadius: token.borderRadius,
                        position: "sticky",
                        top: 0,
                        zIndex: 20,
                        minHeight: `calc(64px + env(safe-area-inset-top, 0px))`,
                        boxSizing: "border-box",
                        background: token.colorBgContainer,
                        margin: "0px 10px 0 10px",
                        padding: 20,
                    }}
                >
                    <div className="flex gap-3 items-center">
                        <Button
                            type="text"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            icon={
                                sidebarOpen ? (
                                    <MenuFoldOutlined />
                                ) : (
                                    <MenuUnfoldOutlined />
                                )
                            }
                        />

                        <Breadcrumb
                            items={[
                                ...getBreadcrumbItems(),
                                ...(pageTitle
                                    ? [
                                        {
                                            title: (
                                                <span className="font-bold text-primary">
                                                    {pageTitle}
                                                </span>
                                            ),
                                        },
                                    ]
                                    : []),
                            ]}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <FeatureSearch />

                        {!isMobile && (
                            <Dropdown
                                menu={{ items: userMenuItems }}
                                placement="bottomRight"
                            >
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
                                        <Text strong>
                                            {" "}
                                            {user?.displayName || user?.email}{" "}
                                            {`(${RoleLabels[userRole as keyof typeof RoleLabels]})`}
                                        </Text>
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: 12 }}
                                        >
                                            {user?.email}
                                        </Text>
                                    </div>
                                </div>
                            </Dropdown>
                        )}
                    </div>
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
                        <ProtectedRoutes>
                            {children}
                            {modal}
                        </ProtectedRoutes>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
}
