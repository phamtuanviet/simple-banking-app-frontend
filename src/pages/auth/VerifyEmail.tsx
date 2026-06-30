import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, Result, Button, Spin, Typography } from 'antd';
import { authService } from '../../services/api/auth/auth.service';

const { Text } = Typography;

const VerifyEmail: React.FC = () => {
  // Lấy chuỗi "?token=abcxyz..." từ URL
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Quản lý 3 trạng thái màn hình: Đang load | Thành công | Lỗi
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  // Cờ đánh dấu để tránh React StrictMode gọi API 2 lần
  const hasFetched = useRef(false);

  useEffect(() => {
    // 1. Nếu không có token trên URL, báo lỗi ngay lập tức
    if (!token) {
      setStatus('error');
      setMessage('Đường dẫn xác thực không hợp lệ hoặc bị thiếu mã token.');
      return;
    }

    // 2. Chặn gọi API nhiều lần
    if (hasFetched.current) return;
    hasFetched.current = true;

    // 3. Tiến hành gọi API
    const verifyToken = async () => {
      try {
        const response = await authService.verifyEmail({ token });
        setStatus('success');
        setMessage(response.message || 'Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Xác thực thất bại. Mã liên kết có thể đã hết hạn hoặc không hợp lệ.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg rounded-xl border-0 p-4">
        
        {/* TRẠNG THÁI LOADING (ĐANG GỌI API) */}
        {status === 'loading' && (
          <div className="text-center py-10">
            <Spin size="large" />
            <h3 className="mt-4 text-lg font-medium text-gray-700">
              Đang xác thực tài khoản của bạn...
            </h3>
            <Text type="secondary">Vui lòng không đóng trình duyệt</Text>
          </div>
        )}

        {/* TRẠNG THÁI THÀNH CÔNG */}
        {status === 'success' && (
          <Result
            status="success"
            title="Xác thực thành công!"
            subTitle={<div className="mt-2 text-gray-600">{message}</div>}
            extra={[
              <Link to="/login" key="login">
                <Button type="primary" size="large" className="bg-blue-600 hover:bg-blue-700 w-full mt-4">
                  Đăng nhập ngay
                </Button>
              </Link>
            ]}
          />
        )}

        {/* TRẠNG THÁI THẤT BẠI / LỖI */}
        {status === 'error' && (
          <Result
            status="error"
            title="Xác thực thất bại"
            subTitle={<div className="mt-2 text-gray-600">{message}</div>}
            extra={[
              <Link to="/login" key="login">
                <Button size="large" className="w-full mt-4">
                  Quay lại đăng nhập
                </Button>
              </Link>
            ]}
          />
        )}

      </Card>
    </div>
  );
};

export default VerifyEmail;