import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { PaymentMethod } from "~/features/sales/invoice/enums"
import useInvoiceUtils from "~/features/sales/invoice/hooks/useInvoiceUtils"
import { InvoiceDisplayDetailsData } from "~/features/sales/invoice/interfaces/invoiceDetails"
import { IFinancialCalculations } from "~/features/sales/invoice/stores/invoice-preview.slice"
import { formatCurrency, generateCode } from "~/utils/util"

/**
 * Đăng ký font Roboto cho PDF
 * Font được load từ CDN để sử dụng trong PDF
 */
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
  fontWeight: "normal"
})

Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
  fontWeight: "bold"
})

Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf",
  fontStyle: "italic",
  fontWeight: "normal"
})

/**
 * Styles cho PDF template
 * Sử dụng StyleSheet từ @react-pdf/renderer để định nghĩa styles
 */
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto"
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    textTransform: "uppercase"
  },
  flexBetween: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    borderBottomStyle: "solid",
    marginVertical: 15
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10
  },
  textNormal: {
    fontSize: 10,
    marginBottom: 5
  },
  textBold: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5
  },
  textRight: {
    textAlign: "right"
  },
  textLg: {
    fontSize: 12
  },
  textRed: {
    color: "#EF4444"
  },
  textGreen: {
    color: "#10B981"
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    marginVertical: 10
  },
  tableRow: {
    flexDirection: "row"
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0"
  },
  tableCell: {
    flex: 1,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    padding: 5,
    fontSize: 10
  },
  tableCellHeader: {
    flex: 1,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    padding: 5,
    fontSize: 10,
    fontWeight: "bold"
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    paddingVertical: 5,
    paddingHorizontal: 8
  },
  tableColHeader: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontWeight: "bold"
  },
  summaryContainer: {
    alignItems: "flex-end",
    marginTop: 20
  },
  summaryLine: {
    flexDirection: "row",
    marginBottom: 5
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40
  },
  signatureBlock: {
    width: "40%"
  },
  textCenter: {
    textAlign: "center"
  },
  warrantyInfo: {
    backgroundColor: "#F0F9FF",
    padding: 10,
    marginVertical: 10,
    borderRadius: 4
  }
})

/**
 * Props interface cho WarrantyInvoicePDF component
 * @template T - Kiểu dữ liệu của các dòng trong bảng sản phẩm bảo hành
 */
export interface WarrantyInvoicePDFProps<T> {
  invoiceData: InvoiceDisplayDetailsData
  financialCalculations: IFinancialCalculations
  dataTable: T[]
  heads: ColumnsType<T>
  option?: string
  warrantyPeriod?: number // Thời gian bảo hành (tháng)
  warrantyStartDate?: string | Date // Ngày bắt đầu bảo hành
  warrantyEndDate?: string | Date // Ngày kết thúc bảo hành
  originalOrderCode?: string // Mã đơn hàng gốc
}

/**
 * Component WarrantyInvoicePDF
 * Template PDF cho hóa đơn bảo hành
 * 
 * @template T - Kiểu dữ liệu của các dòng trong bảng sản phẩm bảo hành
 * 
 * @param props - Props của component bao gồm:
 *   - invoiceData: Thông tin chi tiết hóa đơn bảo hành
 *   - financialCalculations: Các tính toán tài chính (tổng tiền, giảm giá, VAT, etc.)
 *   - dataTable: Dữ liệu bảng sản phẩm/dịch vụ bảo hành
 *   - heads: Cấu hình cột cho bảng
 *   - option: Tùy chọn bổ sung (ví dụ: số hóa đơn tùy chỉnh)
 *   - warrantyPeriod: Thời gian bảo hành (tháng)
 *   - warrantyStartDate: Ngày bắt đầu bảo hành
 *   - warrantyEndDate: Ngày kết thúc bảo hành
 *   - originalOrderCode: Mã đơn hàng gốc
 */
function WarrantyInvoicePDF<T extends Object>({
  financialCalculations,
  dataTable,
  heads,
  invoiceData,
  option,
  warrantyPeriod = 12,
  warrantyStartDate,
  warrantyEndDate,
  originalOrderCode
}: WarrantyInvoicePDFProps<T>) {
  const { t } = useTranslation()
  const { invoiceStatusLabel, paymentMethodMap } = useInvoiceUtils()
  
  // Lấy danh sách các cột từ heads configuration
  const columns = heads.map((item) => ("dataIndex" in item ? (item.dataIndex as string) : (item.key as string)))

  // Tính toán ngày bảo hành nếu chưa có
  const startDate = warrantyStartDate ? dayjs(warrantyStartDate) : dayjs(invoiceData.issueDate)
  const endDate = warrantyEndDate 
    ? dayjs(warrantyEndDate) 
    : startDate.add(warrantyPeriod, "months")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Tiêu đề hóa đơn bảo hành */}
        <Text style={styles.title}>{t("invoiceDetails.warrantyInvoice.title") || "HÓA ĐƠN BẢO HÀNH"}</Text>

        <View style={styles.flexBetween}>
          {/* Thông tin công ty */}
          <View>
            <Text style={styles.sectionTitle}>{t("invoiceDetails.companyInfo.name")}</Text>
            <Text style={styles.textNormal}>{t("invoiceDetails.companyInfo.address")}</Text>
            <Text style={styles.textNormal}>{t("invoiceDetails.companyInfo.phone")}</Text>
            <Text style={styles.textNormal}>{t("invoiceDetails.companyInfo.email")}</Text>
          </View>
          
          {/* Thông tin hóa đơn bảo hành */}
          <View>
            <View style={styles.flexBetween}>
              <Text style={styles.textBold}>{t("invoiceDetails.invoiceNumber")}: </Text>
              <Text style={styles.textNormal}>{option ? option : invoiceData.invoiceNumber}</Text>
            </View>
            <View style={styles.flexBetween}>
              <Text style={styles.textBold}>{t("invoiceDetails.date")}: </Text>
              <Text style={styles.textNormal}>
                {invoiceData.issueDate && dayjs(invoiceData.issueDate).format("DD/MM/YYYY")}
              </Text>
            </View>
            {originalOrderCode && (
              <View style={styles.flexBetween}>
                <Text style={styles.textBold}>{t("invoiceDetails.warrantyInvoice.originalOrder") || "Đơn hàng gốc"}: </Text>
                <Text style={styles.textNormal}>{originalOrderCode}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Thông tin khách hàng */}
        <Text style={styles.sectionTitle}>{t("invoiceDetails.customerInfo.title")}</Text>
        <View style={styles.flexBetween}>
          <View>
            <View style={styles.flexBetween}>
              <Text style={styles.textBold}>{t("invoiceDetails.customerInfo.customer")}: </Text>
              <Text style={styles.textNormal}>{invoiceData.customerName}</Text>
            </View>
            <View style={styles.flexBetween}>
              <Text style={styles.textBold}>{t("invoiceDetails.customerInfo.quotationCode")}: </Text>
              <Text style={styles.textNormal}>{invoiceData.quotationCode || "-"}</Text>
            </View>
          </View>
          <View>
            <View style={styles.flexBetween}>
              <Text style={styles.textBold}>{t("invoiceDetails.customerInfo.phone")}: </Text>
              <Text style={styles.textNormal}>{invoiceData.customerPhone}</Text>
            </View>
            <View style={styles.flexBetween}>
              <Text style={styles.textBold}>{t("invoiceDetails.customerInfo.address")}: </Text>
              <Text style={styles.textNormal}>{invoiceData.customerAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Thông tin bảo hành */}
        <View style={styles.warrantyInfo}>
          <Text style={[styles.sectionTitle, styles.textGreen]}>
            {t("invoiceDetails.warrantyInvoice.warrantyInfo") || "THÔNG TIN BẢO HÀNH"}
          </Text>
          <View style={styles.flexBetween}>
            <Text style={styles.textBold}>
              {t("invoiceDetails.warrantyInvoice.startDate") || "Ngày bắt đầu bảo hành"}:{" "}
            </Text>
            <Text style={styles.textNormal}>{startDate.format("DD/MM/YYYY")}</Text>
          </View>
          <View style={styles.flexBetween}>
            <Text style={styles.textBold}>
              {t("invoiceDetails.warrantyInvoice.endDate") || "Ngày kết thúc bảo hành"}:{" "}
            </Text>
            <Text style={[styles.textNormal, styles.textGreen]}>{endDate.format("DD/MM/YYYY")}</Text>
          </View>
          <View style={styles.flexBetween}>
            <Text style={styles.textBold}>
              {t("invoiceDetails.warrantyInvoice.period") || "Thời hạn bảo hành"}:{" "}
            </Text>
            <Text style={styles.textNormal}>{warrantyPeriod} {t("invoiceDetails.warrantyInvoice.months") || "tháng"}</Text>
          </View>
        </View>

        {/* Bảng sản phẩm/dịch vụ bảo hành */}
        <Text style={styles.sectionTitle}>
          {t("invoiceDetails.warrantyInvoice.warrantyItems") || "Sản phẩm/Dịch vụ bảo hành"}
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            {heads.map((head) => (
              <View key={head.key} style={styles.tableCellHeader}>
                <Text>{head.title as string}</Text>
              </View>
            ))}
          </View>

          {dataTable.map((row) => (
            <View style={styles.tableRow} key={(row as any)._id || generateCode(4)}>
              {columns.map((col: string) => (
                <View key={col + row[col as keyof T]} style={styles.tableCell}>
                  <Text>{String(row[col as keyof T])}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Tổng kết thanh toán */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryLine}>
            <Text style={styles.textBold}>{t("invoiceDetails.summary.paymentMethod")}: </Text>
            <Text style={styles.textNormal}>{paymentMethodMap.get(invoiceData.paymentTerm as PaymentMethod)}</Text>
          </View>

          <View style={styles.summaryLine}>
            <Text style={styles.textBold}>{t("invoiceDetails.summary.totalProducts")}: </Text>
            <Text style={styles.textNormal}>{formatCurrency(financialCalculations.subTotal)}</Text>
          </View>

          <View style={styles.summaryLine}>
            <Text style={styles.textBold}>
              {t("invoiceDetails.summary.discount", {
                percentage: invoiceData.discountRate + "%"
              })}
              :{" "}
            </Text>
            <Text style={styles.textNormal}>
              {formatCurrency(financialCalculations.totalDiscountCommon + financialCalculations.totalDiscount)}
            </Text>
          </View>

          <View style={styles.summaryLine}>
            <Text style={styles.textBold}>{t("invoiceDetails.summary.afterDiscount")}: </Text>
            <Text style={styles.textNormal}>{formatCurrency(financialCalculations.totalAmountAfterDiscount)}</Text>
          </View>

          <View style={styles.summaryLine}>
            <Text style={styles.textBold}>{t("invoiceDetails.summary.vatRate")}: </Text>
            <Text style={styles.textNormal}>{invoiceData.vatRate} %</Text>
          </View>

          <View style={styles.summaryLine}>
            <Text style={styles.textBold}>{t("invoiceDetails.summary.vatAmount")}: </Text>
            <Text style={styles.textNormal}>{formatCurrency(financialCalculations.vatAmount)}</Text>
          </View>

          <View style={styles.summaryLine}>
            <Text style={[styles.textBold, styles.textLg]}>{t("invoiceDetails.summary.grandTotal")}: </Text>
            <Text style={styles.textLg}>{formatCurrency(financialCalculations.finalAmount)}</Text>
          </View>

          <View style={styles.summaryLine}>
            <Text style={[styles.textBold, styles.textLg]}>{t("invoiceDetails.summary.prepaidAmount")}: </Text>
            <Text style={styles.textLg}>{formatCurrency(financialCalculations.prepaidAmount)}</Text>
          </View>

          <View style={styles.summaryLine}>
            <Text style={styles.textBold}>{t("invoiceDetails.summary.remaining")}: </Text>
            <Text style={[styles.textLg, styles.textRed]}>{formatCurrency(financialCalculations.remainingAmount)}</Text>
          </View>
          
          <View style={styles.summaryLine}>
            <Text style={styles.textBold}>{t("invoiceDetails.summary.status")}: </Text>
            <Text style={[styles.textLg]}>{invoiceData.status && invoiceStatusLabel[invoiceData.status]}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Lưu ý về bảo hành */}
        <View style={styles.warrantyInfo}>
          <Text style={[styles.textBold, styles.textNormal]}>
            {t("invoiceDetails.warrantyInvoice.note") || "Lưu ý:"}
          </Text>
          <Text style={styles.textNormal}>
            {t("invoiceDetails.warrantyInvoice.noteContent") || 
              "Sản phẩm được bảo hành trong thời gian quy định. Vui lòng giữ hóa đơn này để được hưởng chế độ bảo hành."}
          </Text>
        </View>

        {/* Footer - Chữ ký */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <Text style={[styles.textBold, styles.textCenter]}>{t("invoiceDetails.footer.customer")}</Text>
            <Text style={[styles.textNormal, styles.textCenter]}>{t("invoiceDetails.footer.signature")}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={[styles.textBold, styles.textCenter]}>{t("invoiceDetails.footer.seller")}</Text>
            <Text style={[styles.textNormal, styles.textCenter]}>{t("invoiceDetails.footer.signature")}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default WarrantyInvoicePDF

