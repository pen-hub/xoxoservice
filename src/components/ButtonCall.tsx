import { PhoneOutlined } from "@ant-design/icons";
import { Button } from "antd";

const ButtonCall = ({ phone, size = "middle" }: { phone: string, size?: "small" | "middle" | "large" }) => {
  return (
    <Button
      type="primary"
      size={size}
      icon={<PhoneOutlined />}
      onClick={() => {
        window.location.href = `tel:${phone}`;
      }}
    >
      Gọi điện
    </Button>
  );
};

export default ButtonCall;
