import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, Input, Button, message, Typography } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/api/auth/auth.service";

const { Title, Text } = Typography;

// 1. ĐỊNH NGHĨA SCHEMA CÓ KIỂM TRA CONFIRM PASSWORD
const registerSchema = z
  .object({
    fullName: z.string().min(2, { message: "Họ tên phải có ít nhất 2 ký tự" }),
    email: z
      .string()
      .min(1, { message: "Vui lòng nhập email" })
      .email({ message: "Email không đúng định dạng" }),
    password: z
      .string()
      .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Vui lòng xác nhận mật khẩu" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"], // Hiển thị lỗi ở ô confirmPassword
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);

      // Gọi API Đăng ký
      await authService.register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
      // Điều hướng về trang đăng nhập
      navigate("/verify-email-notice", { state: { email: data.email } });
    } catch (error: any) {
      // Bắt lỗi (ví dụ: Email đã tồn tại)
      const errorMsg =
        error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!";
      message.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg rounded-xl border-0">
        <div className="text-center mb-8">
          <Title level={3} className="text-blue-600 m-0">
            Đăng ký tài khoản
          </Title>
          <Text type="secondary">Tạo tài khoản Simple Banking App</Text>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* TRƯỜNG HỌ TÊN */}
          <div>
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  size="large"
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Họ và tên"
                  status={errors.fullName ? "error" : ""}
                />
              )}
            />
            <div className="min-h-[20px] mt-1">
              {errors.fullName && (
                <p className="text-red-500 text-sm mb-0">
                  {errors.fullName.message}
                </p>
              )}
            </div>
          </div>

          {/* TRƯỜNG EMAIL */}
          <div>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  size="large"
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="Email của bạn"
                  status={errors.email ? "error" : ""}
                />
              )}
            />
            <div className="min-h-[20px] mt-1">
              {errors.email && (
                <p className="text-red-500 text-sm mb-0">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* TRƯỜNG MẬT KHẨU */}
          <div>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  size="large"
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Mật khẩu"
                  status={errors.password ? "error" : ""}
                />
              )}
            />
            <div className="min-h-[20px] mt-1">
              {errors.password && (
                <p className="text-red-500 text-sm mb-0">
                  {errors.password.message}
                </p>
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
                  placeholder="Xác nhận mật khẩu"
                  status={errors.confirmPassword ? "error" : ""}
                />
              )}
            />
            <div className="min-h-[20px] mt-1">
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mb-0">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* NÚT SUBMIT */}
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isLoading}
            className="bg-blue-600 hover:bg-blue-700 mt-2"
          >
            Đăng ký
          </Button>

          {/* LIÊN KẾT ĐĂNG NHẬP */}
          <div className="text-center mt-4">
            <Text type="secondary">Đã có tài khoản? </Text>
            <Link to="/login" className="text-blue-600 hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Register;
