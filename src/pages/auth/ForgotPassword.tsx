import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Input, Button, Typography, Result, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api/auth/auth.service';

const { Title, Text } = Typography;

// 1. SCHEMA KIỂM TRA EMAIL
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Vui lòng nhập email' })
    .email({ message: 'Email không đúng định dạng' }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // State kiểm soát giao diện
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    try {
      setIsLoading(true);
      
      // Gọi API yêu cầu reset mật khẩu
      await authService.forgotPassword({ email: data.email });
      
      // Lưu lại email để hiển thị lên màn hình thông báo
      setSubmittedEmail(data.email);
      
      // Chuyển cờ thành true để ẩn Form, hiện màn hình Result
      setIsSubmitted(true);
      
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!';
      message.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg rounded-xl border-0">
        
        {/* RENDER CÓ ĐIỀU KIỆN: Nếu ĐÃ submit thành công thì hiện cái này */}
        {isSubmitted ? (
          <Result
            status="success"
            title="Đã gửi liên kết khôi phục!"
            subTitle={
              <div className="mt-2 text-gray-600">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu tới email <br/>
                <Text strong className="text-blue-600">{submittedEmail}</Text>
              </div>
            }
            extra={[
              <Link to="/login" key="login">
                <Button type="primary" size="large" className="bg-blue-600 hover:bg-blue-700 w-full mt-4">
                  Quay lại đăng nhập
                </Button>
              </Link>
            ]}
          />
        ) : (
          
          /* RENDER CÓ ĐIỀU KIỆN: Nếu CHƯA submit thì hiện Form nhập email */
          <>
            <div className="text-center mb-6">
              <Title level={3} className="text-blue-600 m-0">Khôi phục mật khẩu</Title>
              <Text type="secondary" className="block mt-2">
                Nhập email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
              </Text>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      size="large"
                      prefix={<MailOutlined className="text-gray-400" />}
                      placeholder="Nhập email của bạn"
                      status={errors.email ? 'error' : ''}
                    />
                  )}
                />
                <div className="min-h-[20px] mt-1">
                  {errors.email && (
                    <p className="text-red-500 text-sm mb-0">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Gửi liên kết khôi phục
              </Button>

              <div className="text-center mt-6">
                <Link to="/login" className="text-gray-500 hover:text-blue-600 inline-flex items-center gap-1 transition-colors">
                  <ArrowLeftOutlined /> Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </>
        )}

      </Card>
    </div>
  );
};

export default ForgotPassword;