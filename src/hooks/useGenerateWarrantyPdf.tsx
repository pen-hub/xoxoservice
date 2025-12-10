import { pdf } from "@react-pdf/renderer"
import { message } from "antd"
import { saveAs } from "file-saver"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import WarrantyInvoicePDF, { WarrantyInvoicePDFProps } from "~/components/WarrantyInvoicePDF"
import { useAppSelector } from "~/stores/hook"

/**
 * Props interface cho useGenerateWarrantyPdf hook
 * Tái sử dụng logic từ useGeneratePdf nhưng dành riêng cho Warranty Invoice
 * 
 * @template T - Kiểu dữ liệu của các dòng trong bảng sản phẩm bảo hành
 */
type IUseGenerateWarrantyPdfProps<T> = Omit<WarrantyInvoicePDFProps<T>, "financialCalculations" | "dataTable"> &
  Partial<Pick<WarrantyInvoicePDFProps<T>, "financialCalculations" | "dataTable">>

/**
 * Hook useGenerateWarrantyPdf
 * Hook để generate PDF cho hóa đơn bảo hành
 * 
 * Tái sử dụng logic từ useGeneratePdf nhưng sử dụng WarrantyInvoicePDF component
 * 
 * @template T - Kiểu dữ liệu của các dòng trong bảng sản phẩm bảo hành
 * 
 * @param props - Props của hook bao gồm:
 *   - heads: Cấu hình cột cho bảng
 *   - invoiceData: Thông tin chi tiết hóa đơn bảo hành
 *   - dataTable: Dữ liệu bảng sản phẩm/dịch vụ bảo hành (optional, có thể lấy từ store)
 *   - financialCalculations: Các tính toán tài chính (optional, có thể lấy từ store)
 *   - warrantyPeriod: Thời gian bảo hành (tháng)
 *   - warrantyStartDate: Ngày bắt đầu bảo hành
 *   - warrantyEndDate: Ngày kết thúc bảo hành
 *   - originalOrderCode: Mã đơn hàng gốc
 * 
 * @returns Object chứa:
 *   - isLoading: Trạng thái đang tải/generate PDF
 *   - generatePDF: Function để generate và download PDF
 */
function useGenerateWarrantyPdf<T extends Object>({
  heads,
  invoiceData,
  dataTable,
  financialCalculations,
  warrantyPeriod,
  warrantyStartDate,
  warrantyEndDate,
  originalOrderCode
}: IUseGenerateWarrantyPdfProps<T>) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  
  // Lấy dữ liệu từ Redux store nếu không được truyền vào
  const financialCalculationsStore = useAppSelector((state) => state.previewInvoiceClient.financialCalculations)
  const pickedItems = useAppSelector((state) => state.previewInvoiceClient.pickedItems)
  
  /**
   * Function để generate và download PDF hóa đơn bảo hành
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
        // Generate PDF blob từ WarrantyInvoicePDF component
        const blob = await pdf(
          <WarrantyInvoicePDF
            option={option}
            dataTable={dataTable || (pickedItems as any)}
            heads={heads}
            financialCalculations={financialCalculations || financialCalculationsStore}
            invoiceData={invoiceData}
            warrantyPeriod={warrantyPeriod}
            warrantyStartDate={warrantyStartDate}
            warrantyEndDate={warrantyEndDate}
            originalOrderCode={originalOrderCode}
          />
        ).toBlob()
        
        // Download file với tên file theo format: warranty-{invoiceNumber}.pdf
        const fileName = `warranty-${invoiceData.invoiceNumber}.pdf`
        saveAs(blob, fileName)
        
        message.success(t("alert.pdfGenerated") || "Đã tạo PDF thành công")
      } catch (error) {
        console.error("Error generating warranty PDF:", error)
        message.error(t("alert.pdfError") || "Có lỗi xảy ra khi tạo PDF!")
      } finally {
        setIsLoading(false)
      }
    },
    [
      pickedItems, 
      heads, 
      financialCalculations, 
      invoiceData, 
      financialCalculationsStore, 
      warrantyPeriod,
      warrantyStartDate,
      warrantyEndDate,
      originalOrderCode,
      t
    ]
  )
  
  return { isLoading, generatePDF }
}

export default useGenerateWarrantyPdf

