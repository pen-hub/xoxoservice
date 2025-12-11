"use client";

import WarrantyClaimForm from "@/components/WarrantyClaimForm";
import WrapperContent from "@/components/WrapperContent";
import { useRouter } from "next/navigation";
import React from "react";

interface UpdateWarrantyClaimPageProps {
  params: Promise<{
    code: string;
  }>;
}

const UpdateWarrantyClaimPage: React.FC<UpdateWarrantyClaimPageProps> = ({
  params,
}) => {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const claimCode = resolvedParams.code;

  const handleSuccess = (updatedClaimCode: string) => {
    router.push(`/sale/warranty/${updatedClaimCode}`);
  };

  const handleCancel = () => {
    router.push(`/sale/warranty/${claimCode}`);
  };

  if (!claimCode) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500">Mã phiếu không hợp lệ! {claimCode}</p>
        </div>
      </div>
    );
  }

  return (
    <WrapperContent
      title="Cập nhật phiếu nhập bảo hành"
      header={{
        buttonBackTo: `/sale/warranty/${claimCode}`,
      }}
    >
      <WarrantyClaimForm
        mode="update"
        claimCode={claimCode}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </WrapperContent>
  );
};

export default UpdateWarrantyClaimPage;


