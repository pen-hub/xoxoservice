"use client";

import CommonTable from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import { useFileExport } from "@/hooks/useFileExport";
import useFilter from "@/hooks/useFilter";
import { InventoryService } from "@/services/inventoryService";
import { InventoryTransaction } from "@/types/inventory";
import { ArrowLeftOutlined, FileExcelOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  Card,
  Col,
  DatePicker,
  Form,
  message,
  Row,
  Statistic,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const { Text } = Typography;
const { RangePicker } = DatePicker;

// Define columns first for useFileExport
const getColumns = (): TableColumnsType<InventoryTransaction> => [
  {
    title: "Mã giao dịch",
    dataIndex: "code",
    key: "code",
    width: 150,
    fixed: "left",
  },
  {
    title: "Ngày",
    dataIndex: "date",
    key: "date",
    width: 120,
  },
  {
    title: "Loại",
    dataIndex: "type",
    key: "type",
    width: 100,
  },
  {
    title: "Vật liệu",
    dataIndex: "materialName",
    key: "materialName",
    width: 200,
  },
  {
    title: "Số lượng",
    dataIndex: "quantity",
    key: "quantity",
    width: 120,
  },
  {
    title: "Đơn vị",
    dataIndex: "unit",
    key: "unit",
    width: 100,
  },
  {
    title: "Đơn giá",
    dataIndex: "price",
    key: "price",
    width: 150,
  },
  {
    title: "Thành tiền",
    dataIndex: "totalAmount",
    key: "totalAmount",
    width: 150,
  },
  {
    title: "Kho",
    dataIndex: "warehouse",
    key: "warehouse",
    width: 120,
  },
  {
    title: "Nhà cung cấp",
    dataIndex: "supplier",
    key: "supplier",
    width: 180,
  },
  {
    title: "Lý do xuất",
    dataIndex: "reason",
    key: "reason",
    width: 200,
  },
  {
    title: "Ghi chú",
    dataIndex: "note",
    key: "note",
    width: 200,
  },
];

export default function InventoryHistory() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterForm] = Form.useForm();
  const { exportToXlsx } = useFileExport<InventoryTransaction>(getColumns());

  const {
    query,
    pagination,
    updateQueries,
    reset,
    applyFilter,
    handlePageChange,
  } = useFilter();

  // Load transactions and materials
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [transactionsData, materialsData] = await Promise.all([
          InventoryService.getAllTransactions(),
          InventoryService.getAllMaterials(),
        ]);
        setTransactions(transactionsData);
        setMaterials(materialsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribe = InventoryService.onTransactionsSnapshot(
      (transactionsData) => {
        setTransactions(transactionsData);
      }
    );

    return () => unsubscribe();
  }, []);

  // Apply date filter
  const handleDateFilter = (dates: any) => {
    if (!dates || dates.length !== 2) {
      updateQueries([{ key: "dateRange", value: undefined }]);
      return;
    }
    updateQueries([
      {
        key: "dateRange",
        value: {
          from: dates[0].format("YYYY-MM-DD"),
          to: dates[1].format("YYYY-MM-DD"),
        },
      },
    ]);
  };

  // Filter transactions
  const filteredTransactions = applyFilter(
    transactions.filter((t) => {
      // Date range filter
      const dateRange = query.dateRange as
        | { from: string; to: string }
        | undefined;
      if (dateRange) {
        const transactionDate = dayjs(t.date);
        const from = dayjs(dateRange.from);
        const to = dayjs(dateRange.to);
        if (transactionDate.isBefore(from) || transactionDate.isAfter(to)) {
          return false;
        }
      }
      return true;
    })
  );

  // Calculate statistics
  const totalImport = filteredTransactions
    .filter((t) => t.type === "import")
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const totalExport = filteredTransactions
    .filter((t) => t.type === "export")
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const importCount = filteredTransactions.filter(
    (t) => t.type === "import"
  ).length;
  const exportCount = filteredTransactions.filter(
    (t) => t.type === "export"
  ).length;

  // Handle export Excel
  const handleExportExcel = () => {
    try {
      // Prepare data for export with formatted values
      const exportData = filteredTransactions.map((t) => ({
        id: t.code.slice(-8).toUpperCase(),
        date: dayjs(t.date).format("DD/MM/YYYY"),
        type: t.type === "import" ? "Nhập kho" : "Xuất kho",
        materialName: t.materialName,
        quantity: `${t.quantity} ${t.unit}`,
        unit: t.unit,
        price: t.price
          ? `${new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(t.price)}/${t.unit}`
          : "-",
        totalAmount: t.totalAmount
          ? new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(t.totalAmount)
          : "-",
        warehouse: t.warehouse || "-",
        supplier: t.supplier || "-",
        reason: t.reason || "-",
        note: t.note || "-",
        createdAt: t.createdAt
          ? dayjs(t.createdAt).format("DD/MM/YYYY HH:mm")
          : "-",
      })) as any[];

      const fileName = `Lich_su_xuat_nhap_kho_${dayjs().format(
        "DDMMYYYY_HHmmss"
      )}.xlsx`;
      exportToXlsx(exportData, fileName);
      message.success("Đã xuất file Excel thành công");
    } catch (error) {
      console.error("Export failed:", error);
      message.error("Không thể xuất file Excel");
    }
  };

  const columns: TableColumnsType<InventoryTransaction> = [
    {
      title: "Mã giao dịch",
      dataIndex: "code",
      key: "id",
      width: 150,
      fixed: "left",
      render: (code: string) => (
        <Text strong className="font-mono text-xs">
          {code.slice(-8).toUpperCase()}
        </Text>
      ),
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 120,
      sorter: (a: InventoryTransaction, b: InventoryTransaction) =>
        dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: string) => (
        <Tag color={type === "import" ? "green" : "red"}>
          {type === "import" ? "Nhập" : "Xuất"}
        </Tag>
      ),
    },
    {
      title: "Vật liệu",
      dataIndex: "materialName",
      key: "materialName",
      width: 200,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      render: (quantity: number, record: InventoryTransaction) => (
        <Text>
          {quantity} {record.unit}
        </Text>
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      width: 150,
      render: (_: unknown, record: InventoryTransaction) => {
        const price = record.price;
        return price
          ? `${new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(price)}/${record.unit}`
          : "-";
      },
    },
    {
      title: "Thành tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 150,
      render: (_: unknown, record: InventoryTransaction) => {
        const amount = record.totalAmount;
        return amount
          ? new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(amount)
          : "-";
      },
    },
    {
      title: "Kho",
      dataIndex: "warehouse",
      key: "warehouse",
      width: 120,
      render: (warehouse?: string) => warehouse || "-",
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "supplier",
      key: "supplier",
      width: 180,
      render: (supplier?: string) => supplier || "-",
    },
    {
      title: "Lý do xuất",
      dataIndex: "reason",
      key: "reason",
      width: 200,
      render: (reason?: string) => reason || "-",
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      width: 200,
      render: (note?: string) => note || "-",
    },
  ];

  // Filter fields
  const filterFields = [
    {
      name: "type",
      label: "Loại giao dịch",
      type: "select" as const,
      options: [
        { label: "Nhập kho", value: "import" },
        { label: "Xuất kho", value: "export" },
      ],
    },
    {
      name: "materialId",
      label: "Vật liệu",
      type: "select" as const,
      options: materials.map((m) => ({
        label: m.name,
        value: m.id,
      })),
    },
    {
      name: "warehouse",
      label: "Kho",
      type: "select" as const,
      options: [
        { label: "Kho A", value: "Kho A" },
        { label: "Kho B", value: "Kho B" },
        { label: "Kho C", value: "Kho C" },
      ],
    },
  ];

  return (
    <WrapperContent
      header={{
        searchInput: {
          placeholder: "Tìm kiếm giao dịch...",
          filterKeys: ["materialName", "supplier", "reason", "note"],
        },
        filters: {
          fields: filterFields,
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
        buttonEnds: [
          {
            name: "Quay lại",
            icon: <ArrowLeftOutlined />,
            onClick: () => router.push("/inventory"),
          },
          {
            name: "Export Excel",
            icon: <FileExcelOutlined />,
            can: true,
            onClick: handleExportExcel,
          },
        ],
      }}
      isEmpty={!filteredTransactions?.length}
    >
      {/* Date Range Filter */}
      <Card className="mb-4">
        <Form form={filterForm} layout="inline">
          <Form.Item label="Lọc theo ngày">
            <RangePicker
              format="DD/MM/YYYY"
              onChange={handleDateFilter}
              defaultValue={
                query.dateRange
                  ? [dayjs(query.dateRange.from), dayjs(query.dateRange.to)]
                  : undefined
              }
            />
          </Form.Item>
        </Form>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng giao dịch"
              value={filteredTransactions.length}
              suffix="giao dịch"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Số lần nhập"
              value={importCount}
              suffix="lần"
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Số lần xuất"
              value={exportCount}
              suffix="lần"
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng giá trị nhập"
              value={totalImport}
              prefix="+"
              suffix="VND"
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng giá trị xuất"
              value={totalExport}
              prefix="-"
              suffix="VND"
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Chênh lệch"
              value={totalImport - totalExport}
              suffix="VND"
              valueStyle={{
                color: totalImport - totalExport >= 0 ? "#3f8600" : "#cf1322",
              }}
            />
          </Card>
        </Col>
      </Row>

      <CommonTable<InventoryTransaction>
        columns={columns}
        dataSource={filteredTransactions}
        pagination={{
          ...pagination,
          onChange: handlePageChange,
        }}
        loading={loading}
        rank
        paging
      />
    </WrapperContent>
  );
}
