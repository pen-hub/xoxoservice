import { FirebaseOrderData, OrderStatus } from "@/types/order";
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
 * Font được load từ CDN để sử dụng trong PDF
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
 * Styles cho PDF templateKhách hàng
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
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
 * Lấy label cho trạng thái đơn hàng
 */
const getStatusLabel = (status?: OrderStatus): string => {
  const statusLabels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: "Chờ xử lý",
    [OrderStatus.CONFIRMED]: "Đã xác nhận",
    [OrderStatus.IN_PROGRESS]: "Đang thực hiện",
    [OrderStatus.ON_HOLD]: "Tạm giữ",
    [OrderStatus.COMPLETED]: "Hoàn thành",
    [OrderStatus.CANCELLED]: "Đã hủy",
    [OrderStatus.REFUND]: "Hoàn tiền",
  };
  return status ? statusLabels[status] || status : "N/A";
};

/**
 * Props interface cho OrderInvoicePDF component
 */
export interface OrderInvoicePDFProps {
  order: FirebaseOrderData;
  consultantInfo?: {
    code?: string;
    phone?: string;
  };
}

/**
 * Component OrderInvoicePDF
 * Template PDF cho hóa đơn đặt order
 */
function OrderInvoicePDF({ order, consultantInfo }: OrderInvoicePDFProps) {
  // Chuyển đổi products từ Record sang Array
  const products = order.products
    ? Object.entries(order.products).map(([id, product]) => ({
        id,
        ...product,
      }))
    : [];

  // Tính toán tổng tiền
  const subtotal = order.subtotal || 0;
  const discountAmount = order.discountAmount || 0;
  const shippingFee = order.shippingFee || 0;
  const totalAmount =
    order.totalAmount || subtotal - discountAmount + shippingFee;
  const deposit = order.depositAmount || 0;
  const remaining = totalAmount - deposit;

  // Format ngày tháng
  const orderDate = order.orderDate
    ? dayjs(order.orderDate).format("DD/MM/YYYY")
    : "N/A";
  const deliveryDate = order.deliveryDate
    ? dayjs(order.deliveryDate).format("DD/MM/YYYY")
    : "N/A";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Tiêu đề hóa đơn */}
        <Text style={styles.title}>HÓA ĐƠN ĐẶT DỊCH VỤ</Text>

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
              <Text style={styles.textBold}>Mã đơn hàng: </Text>
              <Text style={styles.textNormal}>{order.code}</Text>
            </View>
            <View style={styles.flexBetween}>
              <Text style={styles.textBold}>Ngày đặt: </Text>
              <Text style={styles.textNormal}>{orderDate}</Text>
            </View>
            <View style={styles.flexBetween}>
              <Text style={styles.textBold}>Ngày giao dự kiến: </Text>
              <Text style={styles.textNormal}>{deliveryDate}</Text>
            </View>
            <View style={styles.flexBetween}>
              <Text style={styles.textBold}>Trạng thái: </Text>
              <Text style={styles.textNormal}>
                {getStatusLabel(order.status)}
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
                <Text style={styles.infoValue}>{order.customerName}</Text>
              </View>
              {order.customerCode && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mã khách hàng:</Text>
                  <Text style={styles.infoValue}>{order.customerCode}</Text>
                </View>
              )}
            </View>
            <View style={{ width: "48%" }}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số điện thoại:</Text>
                <Text style={styles.infoValue}>{order.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{order.email || "N/A"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Địa chỉ:</Text>
                <Text style={styles.infoValue}>{order.address}</Text>
              </View>
            </View>
          </View>
        </View>

        {order.consultantName && (
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
                    <Text style={styles.infoValue}>{order.consultantName}</Text>
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

        {/* Bảng sản phẩm */}
        <View style={{ paddingLeft: 20, paddingRight: 20 }}>
          <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
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
              {order.discountType === "percentage"
                ? ` (${order.discount}%)`
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

          <>
            <View style={styles.summaryLine}>
              <Text style={styles.textBold}>
                Tiền cọc
                {order.depositType === "percentage" && order.deposit
                  ? ` (${order.deposit}%)`
                  : ""}
                :{" "}
              </Text>
              <Text style={styles.textNormal}>-{formatCurrency(deposit)}</Text>
            </View>
            <View style={[styles.summaryLine, { marginTop: 2 }]}>
              <Text style={[styles.textBold, styles.textLg]}>Còn lại: </Text>
              <Text style={[styles.textLg, styles.textRed]}>
                {formatCurrency(remaining)}
              </Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.textBold}>Trạng thái cọc: </Text>
              <Text style={styles.textNormal}>
                {order.isDepositPaid ? "Đã thanh toán" : "Chưa thanh toán"}
              </Text>
            </View>
          </>
        </View>

        <View style={styles.divider} />
        <View style={{ paddingLeft: 20, paddingRight: 20 }}>
          <Text style={styles.textBold}>Ghi chú: </Text>
          <Text style={styles.textNormal}>{order.notes}</Text>
        </View>
        <View style={styles.divider} />

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

export default OrderInvoicePDF;
