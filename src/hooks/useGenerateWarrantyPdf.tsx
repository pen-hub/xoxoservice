import WarrantyInvoicePDF from "@/components/WarrantyInvoicePDF";
import { WarrantyClaim } from "@/types/warrantyClaim";
import { pdf } from "@react-pdf/renderer";
import { App } from "antd";
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
 * Props interface cho useGenerateWarrantyPdf hook
 */
interface UseGenerateWarrantyPdfProps {
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
 * Hook useGenerateWarrantyPdf
 * Hook để generate và download PDF cho hóa đơn bảo hành
 *
 * @param props - Props của hook bao gồm:
 *   - warrantyClaim: Dữ liệu phiếu bảo hành (WarrantyClaim)
 *   - consultantInfo: Thông tin nhân viên tư vấn (optional)
 *   - warrantyPeriod: Thời gian bảo hành (tháng, optional)
 *   - warrantyStartDate: Ngày bắt đầu bảo hành (timestamp, optional)
 *   - warrantyEndDate: Ngày kết thúc bảo hành (timestamp, optional)
 *
 * @returns Object chứa:
 *   - isLoading: Trạng thái đang tải/generate PDF
 *   - generatePDF: Function để generate và download PDF
 */
function useGenerateWarrantyPdf({
  warrantyClaim,
  consultantInfo,
  warrantyPeriod = 12,
  warrantyStartDate,
  warrantyEndDate,
}: UseGenerateWarrantyPdfProps) {
  const { message } = App.useApp();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Function để generate và download PDF hóa đơn bảo hành
   *
   * @param fileName - Tên file tùy chỉnh (optional, mặc định: warranty-{claimCode}.pdf)
   * @returns Promise<void>
   */
  const generatePDF = useCallback(
    async (fileName?: string): Promise<void> => {
      setIsLoading(true);

      // Kiểm tra dữ liệu trước khi generate
      if (!warrantyClaim) {
        message.error("Không có dữ liệu phiếu bảo hành!");
        setIsLoading(false);
        return;
      }

      if (
        !warrantyClaim.products ||
        Object.keys(warrantyClaim.products).length === 0
      ) {
        message.error("Phiếu bảo hành chưa có sản phẩm!");
        setIsLoading(false);
        return;
      }

      try {
        // Generate PDF blob từ WarrantyInvoicePDF component
        const blob = await pdf(
          <WarrantyInvoicePDF
            warrantyClaim={warrantyClaim}
            consultantInfo={consultantInfo}
            warrantyPeriod={warrantyPeriod}
            warrantyStartDate={warrantyStartDate}
            warrantyEndDate={warrantyEndDate}
          />
        ).toBlob();

        // Download file với tên file theo format: warranty-{claimCode}.pdf
        const defaultFileName = `xoxo-warranty-${warrantyClaim.code}.pdf`;
        downloadFile(blob, fileName || defaultFileName);

        message.success("Đã tạo PDF thành công!");
      } catch (error) {
        console.error("Error generating warranty PDF:", error);
        message.error("Có lỗi xảy ra khi tạo PDF!");
      } finally {
        setIsLoading(false);
      }
    },
    [
      warrantyClaim,
      consultantInfo,
      warrantyPeriod,
      warrantyStartDate,
      warrantyEndDate,
      message,
    ]
  );

  return { isLoading, generatePDF };
}

export default useGenerateWarrantyPdf;
