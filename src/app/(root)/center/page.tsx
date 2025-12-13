"use client";

import WrapperContent from "@/components/WrapperContent";
import { allMenuItems } from "@/configs/menu";
import ROLES_CONFIG from "@/configs/role";
import { useUser } from "@/firebase/provider";
import { Card, Col, Row, Typography, theme } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const { Title } = Typography;

export default function CenterPage() {
  const { token } = theme.useToken();
  const { user, isUserLoading } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [allowedPaths, setAllowedPaths] = useState<string[]>([]);

  // Get user role from token
  useEffect(() => {
    if (!user || isUserLoading) {
      setUserRole(null);
      setAllowedPaths([]);
      return;
    }

    const getRole = async () => {
      try {
        const tokenResult = await user.getIdTokenResult();
        const role = tokenResult.claims.role as string;
        setUserRole(role);

        const paths = ROLES_CONFIG[role as keyof typeof ROLES_CONFIG] || [];
        setAllowedPaths(paths);
      } catch (error) {
        console.error("Error getting user role:", error);
        setUserRole(null);
        setAllowedPaths([]);
      }
    };

    getRole();
  }, [user, isUserLoading]);

  // Filter menu items based on role
  const filteredMenuItems = useMemo(() => {
    if (!userRole || allowedPaths.length === 0) {
      return [];
    }

    // Helper function to check if a path is allowed (defined inside useMemo to avoid stale closure)
    const isPathAllowed = (path: string | undefined): boolean => {
      if (!path) return false;
      if (allowedPaths.includes("all")) return true;

      // Normalize path
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      const cleanPath =
        normalizedPath.endsWith("/") && normalizedPath !== "/"
          ? normalizedPath.slice(0, -1)
          : normalizedPath;

      // Check exact match or prefix match
      return allowedPaths.some((allowedPath) => {
        if (allowedPath === "all") return true;

        const normalizedAllowed = allowedPath.startsWith("/")
          ? allowedPath
          : `/${allowedPath}`;
        const cleanAllowed =
          normalizedAllowed.endsWith("/") && normalizedAllowed !== "/"
            ? normalizedAllowed.slice(0, -1)
            : normalizedAllowed;

        // Exact match
        if (cleanPath === cleanAllowed) return true;

        // Prefix match
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
          const allowedChildren = item.children.filter(
            (child) => !child.disable && isPathAllowed(child.href)
          );

          // Keep parent menu if it has at least one allowed child
          if (allowedChildren.length > 0) {
            return {
              ...item,
              children: allowedChildren,
            };
          }
          return null;
        }

        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [userRole, allowedPaths]);

  if (isUserLoading || !userRole) {
    return null;
  }

  return (
    <WrapperContent header={{}}>
      {filteredMenuItems.map((section, sectionIndex) => {
        // Skip if section has direct href (like dashboard)
        if (section.href) {
          return null;
        }

        // Only show sections with children
        if (!section.children || section.children.length === 0) {
          return null;
        }

        return (
          <Card key={sectionIndex} style={{ marginBottom: 48 }}>
            {/* Section Title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  color: token.colorPrimary,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <section.Icon />
              </span>
              <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
                {section.title}
              </Title>
            </div>

            {/* Section Cards */}
            <Row gutter={[16, 16]}>
              {section.children.map((child, childIndex) => {
                const IconComponent = child.icon;
                return (
                  <Col
                    key={childIndex}
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                    xl={6}
                    xxl={4}
                  >
                    <Link href={child.href} style={{ textDecoration: "none" }}>
                      <Card
                        hoverable
                        style={{
                          height: "100%",
                          borderRadius: token.borderRadius,
                          border: `1px solid ${token.colorBorder}`,
                          transition: "all 0.3s",
                        }}
                        styles={{
                          body: {
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "24px 16px",
                            textAlign: "center",
                            minHeight: 120,
                          },
                        }}
                      >
                        <span
                          style={{
                            fontSize: 32,
                            color: token.colorPrimary,
                            marginBottom: 12,
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <IconComponent />
                        </span>
                        <Typography.Text
                          strong
                          style={{
                            fontSize: 14,
                            color: token.colorText,
                          }}
                        >
                          {child.title}
                        </Typography.Text>
                      </Card>
                    </Link>
                  </Col>
                );
              })}
            </Row>
          </Card>
        );
      })}
    </WrapperContent>
  );
}
