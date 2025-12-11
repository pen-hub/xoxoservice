import { WarrantyClaim, WarrantyClaimStatus } from "@/types/warrantyClaim";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import dayjs from "dayjs";

/**
 * Đăng ký font Roboto cho PDF
 */
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
  fontWeight: "normal",
});

Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
  fontWeight: "bold",
});

Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf",
  fontStyle: "italic",
  fontWeight: "normal",
});

/**
 * Styles cho PDF template
 */
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "Roboto",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  flexBetween: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    borderBottomStyle: "solid",
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  textNormal: {
    fontSize: 10,
    marginBottom: 2,
  },
  textBold: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  textRight: {
    textAlign: "right",
  },
  textLg: {
    fontSize: 12,
  },
  textRed: {
    color: "#EF4444",
  },
  textGreen: {
    color: "#10B981",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    marginVertical: 12,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
  },
  tableCell: {
    flex: 1,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 6,
    fontSize: 9,
  },
  tableCellHeader: {
    flex: 1,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    padding: 6,
    fontSize: 9,
    fontWeight: "bold",
  },
  summaryContainer: {
    alignItems: "flex-end",
    marginTop: 2,
  },
  summaryLine: {
    flexDirection: "row",
    marginBottom: 5,
    justifyContent: "space-between",
    width: "100%",
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 70,
    paddingLeft: 40,
    paddingRight: 40,
  },
  signatureBlock: {
    width: "45%",
    minHeight: 100,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderTopStyle: "solid",
    marginBottom: 70,
    width: "100%",
  },
  textCenter: {
    textAlign: "center",
  },
  infoRow: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "bold",
    width: 110,
    marginRight: 2,
  },
  infoValue: {
    fontSize: 10,
    flex: 1,
  },
  warrantyInfo: {
    backgroundColor: "#F0F9FF",
    padding: 12,
    marginVertical: 10,
    borderRadius: 4,
  },
});

/**
 * Format số tiền theo định dạng VNĐ
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Lấy label cho trạng thái bảo hành
 */
const getStatusLabel = (status?: WarrantyClaimStatus): string => {
  const statusLabels: Record<WarrantyClaimStatus, string> = {
    [WarrantyClaimStatus.PENDING]: "Chờ xử lý",
    [WarrantyClaimStatus.CONFIRMED]: "Đã xác nhận",
    [WarrantyClaimStatus.IN_PROGRESS]: "Đang thực hiện",
    [WarrantyClaimStatus.ON_HOLD]: "Tạm giữ",
    [WarrantyClaimStatus.COMPLETED]: "Hoàn thành",
    [WarrantyClaimStatus.CANCELLED]: "Đã hủy",
  };
  return status ? statusLabels[status] || status : "N/A";
};

/**
 * Props interface cho WarrantyInvoicePDF component
 */
export interface WarrantyInvoicePDFProps {
  warrantyClaim: WarrantyClaim;
  consultantInfo?: {
    code?: string;
    phone?: string;
  };
  warrantyPeriod?: number; // Thời gian bảo hành (tháng)
  warrantyStartDate?: number; // Timestamp
  warrantyEndDate?: number; // Timestamp
}

/**
 * Component WarrantyInvoicePDF
 * Template PDF cho hóa đơn bảo hành
 */
function WarrantyInvoicePDF({
  warrantyClaim,
  consultantInfo,
  warrantyPeriod = 12,
  warrantyStartDate,
  warrantyEndDate,
}: WarrantyInvoicePDFProps) {
  // Chuyển đổi products từ Record sang Array
  const products = warrantyClaim.products
    ? Object.entries(warrantyClaim.products).map(([id, product]) => ({
        id,
        ...product,
      }))
    : [];

  // Tính toán tổng tiền
  const subtotal = warrantyClaim.subtotal || 0;
  const discountAmount = warrantyClaim.discountAmount || 0;
  const shippingFee = warrantyClaim.shippingFee || 0;
  const totalAmount =
    warrantyClaim.totalAmount || subtotal - discountAmount + shippingFee;

  // Format ngày tháng
  const claimDate = warrantyClaim.createdAt
    ? dayjs(warrantyClaim.createdAt).format("DD/MM/YYYY")
    : "N/A";
  const orderDate = warrantyClaim.orderDate
    ? dayjs(warrantyClaim.orderDate).format("DD/MM/YYYY")
    : "N/A";
  const deliveryDate = warrantyClaim.deliveryDate
    ? dayjs(warrantyClaim.deliveryDate).format("DD/MM/YYYY")
    : "N/A";

  // Tính toán ngày bảo hành
  const startDate = warrantyStartDate
    ? dayjs(warrantyStartDate)
    : dayjs(warrantyClaim.createdAt || Date.now());
  const endDate = warrantyEndDate
    ? dayjs(warrantyEndDate)
    : startDate.add(warrantyPeriod, "months");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Tiêu đề hóa đơn */}
        <Text style={styles.title}>HÓA ĐƠN BẢO HÀNH</Text>

        <View style={styles.flexBetween}>
          {/* Thông tin công ty */}
          <View style={{ paddingLeft: 20 }}>
            <Text
              style={[styles.sectionTitle, { fontSize: 16, letterSpacing: 1 }]}
            >
              XOXO
            </Text>
            <Text style={[styles.textNormal, { fontSize: 9 }]}>
              Địa chỉ công ty
            </Text>
            <Text style={[styles.textNormal, { fontSize: 9 }]}>
              Số điện thoại: 0123456789
            </Text>
            <Text style={[styles.textNormal, { fontSize: 9 }]}>
              Email: info@xoxo.com
            </Text>
          </View>

          {/* Thông tin hóa đơn */}
          <View style={{ paddingRight: 20 }}>
            <View style={styles.flexBetween}>
              <Text style={styles.textBold}>Mã phiếu bảo hành: </Text>
              <Text style={styles.textNormal}>{warrantyClaim.code}</Text>
            </View>
            <View style={styles.flexBetween}>
              <Text style={styles.textBold}>Ngày tạo: </Text>
              <Text style={styles.textNormal}>{claimDate}</Text>
            </View>
            {warrantyClaim.originalOrderCode && (
              <View style={styles.flexBetween}>
                <Text style={styles.textBold}>Đơn hàng gốc: </Text>
                <Text style={styles.textNormal}>
                  {warrantyClaim.originalOrderCode}
                </Text>
              </View>
            )}
            <View style={styles.flexBetween}>
              <Text style={styles.textBold}>Trạng thái: </Text>
              <Text style={styles.textNormal}>
                {getStatusLabel(warrantyClaim.status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Thông tin khách hàng */}
        <View style={{ paddingLeft: 20, paddingRight: 20 }}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ width: "48%" }}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tên khách hàng:</Text>
                <Text style={styles.infoValue}>
                  {warrantyClaim.customerName}
                </Text>
              </View>
              {warrantyClaim.customerCode && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mã khách hàng:</Text>
                  <Text style={styles.infoValue}>
                    {warrantyClaim.customerCode}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ width: "48%" }}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số điện thoại:</Text>
                <Text style={styles.infoValue}>{warrantyClaim.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>
                  {warrantyClaim.email || "N/A"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Địa chỉ:</Text>
                <Text style={styles.infoValue}>{warrantyClaim.address}</Text>
              </View>
            </View>
          </View>
        </View>

        {warrantyClaim.consultantName && (
          <>
            <View style={styles.divider} />
            <View style={{ paddingLeft: 20, paddingRight: 20 }}>
              <Text style={styles.sectionTitle}>Nhân viên tư vấn</Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ width: "48%" }}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tên:</Text>
                    <Text style={styles.infoValue}>
                      {warrantyClaim.consultantName}
                    </Text>
                  </View>
                  {consultantInfo?.code && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Mã NV:</Text>
                      <Text style={styles.infoValue}>
                        {consultantInfo.code}
                      </Text>
                    </View>
                  )}
                </View>
                {consultantInfo?.phone && (
                  <View style={{ width: "48%" }}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>SĐT:</Text>
                      <Text style={styles.infoValue}>
                        {consultantInfo.phone}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        <View style={styles.divider} />

        {/* Thông tin bảo hành */}
        <View
          style={[styles.warrantyInfo, { paddingLeft: 20, paddingRight: 20 }]}
        >
          <Text style={[styles.sectionTitle, styles.textGreen]}>
            THÔNG TIN BẢO HÀNH
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày bắt đầu:</Text>
            <Text style={styles.infoValue}>
              {startDate.format("DD/MM/YYYY")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày kết thúc:</Text>
            <Text style={[styles.infoValue, styles.textGreen]}>
              {endDate.format("DD/MM/YYYY")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thời hạn bảo hành:</Text>
            <Text style={styles.infoValue}>{warrantyPeriod} tháng</Text>
          </View>
        </View>

        {/* Bảng sản phẩm */}
        <View style={{ paddingLeft: 20, paddingRight: 20 }}>
          <Text style={styles.sectionTitle}>Danh sách sản phẩm bảo hành</Text>
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableRowHeader}>
              <View style={[styles.tableCellHeader, { flex: 0.5 }]}>
                <Text>STT</Text>
              </View>
              <View style={[styles.tableCellHeader, { flex: 2 }]}>
                <Text>Tên sản phẩm</Text>
              </View>
              <View style={[styles.tableCellHeader, { flex: 0.8 }]}>
                <Text>Số lượng</Text>
              </View>
              <View style={[styles.tableCellHeader, { flex: 1.2 }]}>
                <Text>Đơn giá</Text>
              </View>
              <View style={[styles.tableCellHeader, { flex: 1.5 }]}>
                <Text>Thành tiền</Text>
              </View>
            </View>

            {/* Rows */}
            {products.map((product, index) => {
              const productTotal = product.quantity * product.price;
              return (
                <View key={product.id || index} style={styles.tableRow}>
                  <View style={[styles.tableCell, { flex: 0.5 }]}>
                    <Text>{index + 1}</Text>
                  </View>
                  <View style={[styles.tableCell, { flex: 2 }]}>
                    <Text>{product.name}</Text>
                  </View>
                  <View style={[styles.tableCell, { flex: 0.8 }]}>
                    <Text>{product.quantity}</Text>
                  </View>
                  <View style={[styles.tableCell, { flex: 1.2 }]}>
                    <Text>{formatCurrency(product.price)}</Text>
                  </View>
                  <View style={[styles.tableCell, { flex: 1.5 }]}>
                    <Text>{formatCurrency(productTotal)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Tổng kết thanh toán */}
        <View
          style={[
            styles.summaryContainer,
            { paddingLeft: 20, paddingRight: 20 },
          ]}
        >
          <View style={styles.summaryLine}>
            <Text style={styles.textBold}>Tạm tính: </Text>
            <Text style={styles.textNormal}>{formatCurrency(subtotal)}</Text>
          </View>

          <View style={styles.summaryLine}>
            <Text style={styles.textBold}>
              Chiết khấu
              {warrantyClaim.discountType === "percentage"
                ? ` (${warrantyClaim.discount}%)`
                : ""}
              :{" "}
            </Text>
            <Text style={styles.textNormal}>
              -{formatCurrency(discountAmount)}
            </Text>
          </View>

          <View style={styles.summaryLine}>
            <Text style={styles.textBold}>Phí vận chuyển: </Text>
            <Text style={styles.textNormal}>
              +{formatCurrency(shippingFee)}
            </Text>
          </View>

          <View style={[styles.summaryLine, { marginTop: 2 }]}>
            <Text style={[styles.textBold, styles.textLg]}>Tổng cộng: </Text>
            <Text style={styles.textLg}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.divider} />
        {warrantyClaim.notes && (
          <View style={{ paddingLeft: 20, paddingRight: 20 }}>
            <Text style={styles.textBold}>Ghi chú: </Text>
            <Text style={styles.textNormal}>{warrantyClaim.notes}</Text>
          </View>
        )}
        <View style={styles.divider} />

        {/* Lưu ý về bảo hành */}
        <View
          style={[styles.warrantyInfo, { paddingLeft: 20, paddingRight: 20 }]}
        >
          <Text style={[styles.textBold, { marginBottom: 5 }]}>Lưu ý:</Text>
          <Text style={styles.textNormal}>
            Sản phẩm được bảo hành trong thời gian quy định. Vui lòng giữ hóa
            đơn này để được hưởng chế độ bảo hành.
          </Text>
        </View>

        {/* Footer - Chữ ký */}
        <View style={styles.signatureSection}>
          <View>
            <Text
              style={[
                styles.textBold,
                styles.textCenter,
                { marginBottom: 8, fontSize: 11 },
              ]}
            >
              Khách hàng
            </Text>
            <Text
              style={[
                styles.textNormal,
                styles.textCenter,
                { marginTop: 3, fontSize: 9 },
              ]}
            >
              (Ký và ghi rõ họ tên)
            </Text>
          </View>
          <View>
            <Text
              style={[
                styles.textBold,
                styles.textCenter,
                { marginBottom: 8, fontSize: 11 },
              ]}
            >
              Người bán
            </Text>
            <Text
              style={[
                styles.textNormal,
                styles.textCenter,
                { marginTop: 3, fontSize: 9 },
              ]}
            >
              (Ký và ghi rõ họ tên)
            </Text>
          </View>
        </View>

        {/* Cảm ơn */}
        <View style={[styles.divider]} />
        <View style={{ marginTop: 4, paddingLeft: 40, paddingRight: 40 }}>
          <Text
            style={[
              styles.textNormal,
              styles.textCenter,
              { fontSize: 11, marginBottom: 10 },
            ]}
          >
            Cảm ơn quý khách đã tin tưởng sử dụng dịch vụ của XOXO - Quality of
            Life
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default WarrantyInvoicePDF;
