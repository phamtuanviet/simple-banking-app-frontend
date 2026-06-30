import React, { useEffect, useState } from "react";
import { Button, Result, Card, Typography, message } from "antd";
import { MailOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../services/api/auth/auth.service";

const { Text } = Typography;

const VerifyEmailNotice: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy email từ state khi điều hướng từ trang Register sang.
  // Nếu không có (do người dùng gõ thẳng URL), để mặc định là rỗng.
  const email = location.state?.email || "hộp thư của bạn";

  const [countdown, setCountdown] = useState(60); // Đếm ngược 60s
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Nếu countdown lớn hơn 0, giảm 1 sau mỗi 1 giây (1000ms)
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer); // Xóa timer để tránh memory leak
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!email) {
      message.error("Không tìm thấy địa chỉ email hợp lệ.");
      return;
    }

    try {
      setIsResending(true);

      await authService.resendVerification({ email });

      message.success(
        "Đã gửi lại email xác thực! Vui lòng kiểm tra hộp thư của bạn.",
      );

      // Reset lại bộ đếm thời gian sau khi gửi thành công
      setCountdown(60);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        "Không thể gửi lại email lúc này. Vui lòng thử lại sau!";
      message.error(errorMsg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-lg rounded-xl border-0 p-4">
        <Result
          icon={<MailOutlined className="text-blue-500" />}
          title={<span className="text-2xl font-bold text-gray-800">Kiểm tra hộp thư của bạn</span>}
          subTitle={
            <div className="text-base text-gray-600 mt-2 space-y-2">
              <p>
                Chúng tôi đã gửi một email chứa liên kết xác thực đến <Text strong className="text-blue-600">{email || 'hộp thư của bạn'}</Text>.
              </p>
              <p>
                Vui lòng kiểm tra hộp thư đến (và cả thư mục Spam/Junk) để kích hoạt tài khoản của bạn trước khi đăng nhập.
              </p>
            </div>
          }
          extra={[
            <div key="actions" className="flex flex-col gap-3 items-center mt-4">
              <Button 
                type="primary" 
                size="large"
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-64"
                onClick={() => navigate('/login')}
              >
                Quay lại trang Đăng nhập
              </Button>

              {/* Nút gửi lại email với logic đếm ngược */}
              <Button
                type="default"
                size="large"
                icon={<ReloadOutlined />}
                disabled={countdown > 0 || !email}
                loading={isResending}
                onClick={handleResend}
                className="w-full sm:w-64"
              >
                {countdown > 0 ? `Gửi lại email sau (${countdown}s)` : 'Gửi lại email xác thực'}
              </Button>
            </div>
          ]}
        />
      </Card>
    </div>
  );
};

export default VerifyEmailNotice;
