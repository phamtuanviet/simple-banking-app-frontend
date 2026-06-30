import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Input, Button, Result, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { authService } from '../../services/api/auth/auth.service';

const { Title, Text } = Typography;

// 1. ĐỊNH NGHĨA SCHEMA KHỚP VỚI DTO CỦA BACKEND
const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
      .max(50, { message: 'Mật khẩu tối đa 50 ký tự' }),
    confirmPassword: z.string().min(1, { message: 'Vui lòng xác nhận mật khẩu mới' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  // 2. NẾU KHÔNG CÓ TOKEN TRÊN URL -> CHẶN NGAY LẬP TỨC
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg rounded-xl border-0 p-4">
          <Result
            status="error"
            title="Đường dẫn không hợp lệ"
            subTitle="Mã xác thực không tồn tại hoặc đường dẫn đã bị thay đổi."
            extra={[
              <Link to="/login" key="login">
                <Button type="primary">Về trang đăng nhập</Button>
              </Link>,
            ]}
          />
        </Card>
      </div>
    );
  }

  // 3. HÀM SUBMIT MẬT KHẨU MỚI
  const onSubmit = async (data: ResetPasswordValues) => {
    try {
      setIsLoading(true);
      
      // Truyền đúng token lấy từ URL và newPassword từ form
      await authService.resetPassword({
        token: token,
        newPassword: data.newPassword,
      });

      // Render màn hình thành công
      setIsSuccess(true);
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Đổi mật khẩu thất bại. Mã xác thực có thể đã hết hạn.';
      message.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg rounded-xl border-0">
        
        {/* NẾU THÀNH CÔNG: Hiển thị thông báo Result */}
        {isSuccess ? (
          <Result
            status="success"
            title="Đổi mật khẩu thành công!"
            subTitle="Mật khẩu của bạn đã được cập nhật an toàn. Bạn có thể đăng nhập bằng mật khẩu mới."
            extra={[
              <Link to="/login" key="login">
                <Button type="primary" size="large" className="bg-blue-600 hover:bg-blue-700 w-full mt-4">
                  Đăng nhập ngay
                </Button>
              </Link>,
            ]}
          />
        ) : (
          
          /* NẾU CHƯA XONG: Hiển thị form nhập mật khẩu */
          <>
            <div className="text-center mb-6">
              <Title level={3} className="text-blue-600 m-0">Tạo mật khẩu mới</Title>
              <Text type="secondary" className="block mt-2">
                Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
              </Text>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* TRƯỜNG MẬT KHẨU MỚI */}
              <div>
                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      size="large"
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder="Mật khẩu mới (Tối thiểu 6 ký tự)"
                      status={errors.newPassword ? 'error' : ''}
                    />
                  )}
                />
                <div className="min-h-[20px] mt-1">
                  {errors.newPassword && (
                    <p className="text-red-500 text-sm mb-0">{errors.newPassword.message}</p>
                  )}
                </div>
              </div>

              {/* TRƯỜNG XÁC NHẬN MẬT KHẨU */}
              <div>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      size="large"
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder="Xác nhận mật khẩu mới"
                      status={errors.confirmPassword ? 'error' : ''}
                    />
                  )}
                />
                <div className="min-h-[20px] mt-1">
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mb-0">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={isLoading}
                className="bg-blue-600 hover:bg-blue-700 mt-2"
              >
                Xác nhận đổi mật khẩu
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;