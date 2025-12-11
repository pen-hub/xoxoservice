"use client";

import { Button, Result } from "antd";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  return (
    <Result
      status="error"
      title="Truy cập bị từ chối"
      subTitle="Bạn không có quyền truy cập vào trang này."
      extra={[
        <Button type="primary" key="console" onClick={() => router.back()}>
          Trở về
        </Button>,
      ]}
    />
  );
};

export default Page;
