"use client";

import { allMenuItems } from "@/configs/menu";
import { SearchOutlined } from "@ant-design/icons";
import { Input, Modal, Typography, Empty } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const { Text } = Typography;

interface SearchableItem {
    title: string;
    href: string;
    icon: React.ComponentType;
    parent?: string;
    keywords?: string[];
}

export default function FeatureSearch() {
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const router = useRouter();

    // Build searchable items from menu
    const searchableItems = useMemo(() => {
        const items: SearchableItem[] = [];

        allMenuItems.forEach((item) => {
            // Add parent items with href
            if (item.href) {
                items.push({
                    title: item.title,
                    href: item.href,
                    icon: item.Icon,
                    keywords: [item.title.toLowerCase()],
                });
            }

            // Add children
            if (item.children) {
                item.children.forEach((child) => {
                    items.push({
                        title: child.title,
                        href: child.href,
                        icon: child.icon,
                        parent: item.title,
                        keywords: [
                            child.title.toLowerCase(),
                            item.title.toLowerCase(),
                        ],
                    });
                });
            }
        });

        return items;
    }, []);

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchText.trim()) return searchableItems;

        const query = searchText.toLowerCase().trim();
        return searchableItems.filter((item) => {
            return (
                item.title.toLowerCase().includes(query) ||
                item.parent?.toLowerCase().includes(query) ||
                item.keywords?.some((kw) => kw.includes(query))
            );
        });
    }, [searchText, searchableItems]);

    // Handle keyboard shortcut (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setOpen(true);
            }

            // ESC to close
            if (e.key === "Escape" && open) {
                setOpen(false);
                setSearchText("");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    const handleItemClick = (href: string) => {
        router.push(href);
        setOpen(false);
        setSearchText("");
    };

    // Reset search when modal closes
    useEffect(() => {
        if (!open) {
            setSearchText("");
        }
    }, [open]);

    return (
        <>
            {/* Trigger Button */}
            <div
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                style={{ minWidth: 200 }}
            >
                <SearchOutlined className="text-gray-400" />
                <Text type="secondary" className="text-sm flex-1">
                    Tìm kiếm chức năng...
                </Text>
                <Text type="secondary" className="text-xs">
                    Ctrl+K
                </Text>
            </div>

            {/* Search Modal */}
            <Modal
                open={open}
                onCancel={() => setOpen(false)}
                footer={null}
                width={600}
                styles={{
                    body: { padding: 0 },
                }}
                closeIcon={null}
            >
                <div className="flex flex-col" style={{ maxHeight: "70vh" }}>
                    {/* Search Input */}
                    <div className="p-4 border-b">
                        <Input
                            autoFocus
                            size="large"
                            placeholder="Tìm kiếm chức năng..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onPressEnter={() => {
                                if (filteredItems.length > 0) {
                                    handleItemClick(filteredItems[0].href);
                                }
                            }}
                        />
                    </div>

                    {/* Results */}
                    <div className="overflow-y-auto" style={{ maxHeight: "50vh" }}>
                        {filteredItems.length === 0 ? (
                            <div className="p-8">
                                <Empty
                                    description="Không tìm thấy chức năng phù hợp"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            </div>
                        ) : (
                            <div className="py-2">
                                {filteredItems.map((item, index) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <div
                                            key={`${item.href}-${index}`}
                                            onClick={() => handleItemClick(item.href)}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-100 text-blue-600">
                                                <IconComponent />
                                            </div>
                                            <div className="flex-1">
                                                <Text strong className="block">
                                                    {item.title}
                                                </Text>
                                                {item.parent && (
                                                    <Text type="secondary" className="text-xs">
                                                        {item.parent}
                                                    </Text>
                                                )}
                                            </div>
                                            <Text type="secondary" className="text-xs">
                                                {item.href}
                                            </Text>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer Hint */}
                    <div className="p-3 border-t bg-gray-50">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>↑↓ để điều hướng</span>
                            <span>Enter để chọn</span>
                            <span>ESC để đóng</span>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
