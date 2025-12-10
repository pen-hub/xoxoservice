import { pdf } from "@react-pdf/renderer"
import { message } from "antd"
import { saveAs } from "file-saver"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import OrderInvoicePDF, { OrderInvoicePDFProps } from "~/components/OrderInvoicePDF"
import { useAppSelector } from "~/stores/hook"

/**
 * Props interface cho useGenerateOrderPdf hook
 * Tái sử dụng logic từ useGeneratePdf nhưng dành riêng cho Order Invoice
 * 
 * @template T - Kiểu dữ liệu của các dòng trong bảng sản phẩm
 */
type IUseGenerateOrderPdfProps<T> = Omit<OrderInvoicePDFProps<T>, "financialCalculations" | "dataTable"> &
  Partial<Pick<OrderInvoicePDFProps<T>, "financialCalculations" | "dataTable">>

/**
 * Hook useGenerateOrderPdf
 * Hook để generate PDF cho hóa đơn đặt order
 * 
 * Tái sử dụng logic từ useGeneratePdf nhưng sử dụng OrderInvoicePDF component
 * 
 * @template T - Kiểu dữ liệu của các dòng trong bảng sản phẩm
 * 
 * @param props - Props của hook bao gồm:
 *   - heads: Cấu hình cột cho bảng
 *   - invoiceData: Thông tin chi tiết hóa đơn
 *   - dataTable: Dữ liệu bảng sản phẩm/dịch vụ (optional, có thể lấy từ store)
 *   - financialCalculations: Các tính toán tài chính (optional, có thể lấy từ store)
 * 
 * @returns Object chứa:
 *   - isLoading: Trạng thái đang tải/generate PDF
 *   - generatePDF: Function để generate và download PDF
 */
function useGenerateOrderPdf<T extends Object>({
  heads,
  invoiceData,
  dataTable,
  financialCalculations
}: IUseGenerateOrderPdfProps<T>) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  
  // Lấy dữ liệu từ Redux store nếu không được truyền vào
  const financialCalculationsStore = useAppSelector((state) => state.previewInvoiceClient.financialCalculations)
  const pickedItems = useAppSelector((state) => state.previewInvoiceClient.pickedItems)
  
  /**
   * Function để generate và download PDF hóa đơn đặt order
   * 
   * @param option - Tùy chọn bổ sung (ví dụ: số hóa đơn tùy chỉnh)
   * @returns Promise<void>
   */
  const generatePDF = useCallback(
    async (option?: string): Promise<void> => {
      setIsLoading(true)
      
      // Kiểm tra dữ liệu trước khi generate
      if (!dataTable && pickedItems.length === 0) {
        message.error(t("alert.noData"))
        setIsLoading(false)
        return
      }
      
      try {
        // Generate PDF blob từ OrderInvoicePDF component
        const blob = await pdf(
          <OrderInvoicePDF
            option={option}
            dataTable={dataTable || (pickedItems as any)}
            heads={heads}
            financialCalculations={financialCalculations || financialCalculationsStore}
            invoiceData={invoiceData}
          />
        ).toBlob()
        
        // Download file với tên file theo format: order-{invoiceNumber}.pdf
        const fileName = `order-${invoiceData.invoiceNumber}.pdf`
        saveAs(blob, fileName)
        
        message.success(t("alert.pdfGenerated") || "Đã tạo PDF thành công")
      } catch (error) {
        console.error("Error generating order PDF:", error)
        message.error(t("alert.pdfError") || "Có lỗi xảy ra khi tạo PDF!")
      } finally {
        setIsLoading(false)
      }
    },
    [pickedItems, heads, financialCalculations, invoiceData, financialCalculationsStore, t]
  )
  
  return { isLoading, generatePDF }
}

export default useGenerateOrderPdf

