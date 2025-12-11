import OrderInvoicePDF from "@/components/OrderInvoicePDF";
import { FirebaseOrderData } from "@/types/order";
import { pdf } from "@react-pdf/renderer";
import { App } from "antd";
import dayjs from "dayjs";
import { useCallback, useState } from "react";

/**
 * Helper function để download file từ blob
 */
const downloadFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Props interface cho useGenerateOrderPdf hook
 */
interface UseGenerateOrderPdfProps {
  order: FirebaseOrderData;
  consultantInfo?: {
    code?: string;
    phone?: string;
  };
}

/**
 * Hook useGenerateOrderPdf
 * Hook để generate và download PDF cho hóa đơn đặt order
 *
 * @param props - Props của hook bao gồm:
 *   - order: Dữ liệu đơn hàng (FirebaseOrderData)
 *
 * @returns Object chứa:
 *   - isLoading: Trạng thái đang tải/generate PDF
 *   - generatePDF: Function để generate và download PDF
 */
function useGenerateOrderPdf({
  order,
  consultantInfo,
}: UseGenerateOrderPdfProps) {
  const { message } = App.useApp();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Function để generate và download PDF hóa đơn đặt order
   *
   * @param fileName - Tên file tùy chỉnh (optional, mặc định: order-{orderCode}.pdf)
   * @returns Promise<void>
   */
  const generatePDF = useCallback(
    async (fileName?: string): Promise<void> => {
      setIsLoading(true);

      // Kiểm tra dữ liệu trước khi generate
      if (!order) {
        message.error("Không có dữ liệu đơn hàng!");
        setIsLoading(false);
        return;
      }

      if (!order.products || Object.keys(order.products).length === 0) {
        message.error("Đơn hàng chưa có sản phẩm!");
        setIsLoading(false);
        return;
      }

      try {
        // Generate PDF blob từ OrderInvoicePDF component
        const blob = await pdf(
          <OrderInvoicePDF order={order} consultantInfo={consultantInfo} />
        ).toBlob();

        // Download file với tên file theo format: order-{orderCode}.pdf
        const defaultFileName = `xoxo-order-${order.code}.pdf`;
        downloadFile(blob, fileName || defaultFileName);

        message.success("Đã tạo PDF thành công!");
      } catch (error) {
        console.error("Error generating order PDF:", error);
        message.error("Có lỗi xảy ra khi tạo PDF!");
      } finally {
        setIsLoading(false);
      }
    },
    [order, consultantInfo, message]
  );

  return { isLoading, generatePDF };
}

export default useGenerateOrderPdf;
