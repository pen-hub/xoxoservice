import { PhoneOutlined } from "@ant-design/icons";
import { Button } from "antd";

const ButtonCall = ({
    phone,
    size = "middle",
    type = "primary",
}: {
    phone: string;
    size?: "small" | "middle" | "large";
    type?: "primary" | "default" | "dashed" | "link" | "text";
}) => {
    return (
        <Button
            type={type}
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
