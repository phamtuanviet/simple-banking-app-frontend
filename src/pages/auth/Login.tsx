import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, Input, Button, message, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "../../types/user.type";
import { useAuthStore } from "../../store/auth.store";
import { authService } from "../../services/api/auth/auth.service";

const { Title, Text } = Typography;

// 1. ĐỊNH NGHĨA SCHEMA VALIDATION VỚI ZOD
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Vui lòng nhập email" })
    .email({ message: "Email không đúng định dạng" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);

      // 2. SỬ DỤNG SERVICE THAY VÌ GỌI AXIOS TRỰC TIẾP
      // Code bây giờ đọc vào là hiểu ngay nghiệp vụ: "Đang gọi service login bằng data truyền vào"
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      setAuth(response.data.user, response.data.accessToken);
      message.success("Đăng nhập thành công!");
      navigate("/");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại!";
      message.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Sử dụng Tailwind CSS để căn giữa toàn màn hình
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg rounded-xl border-0">
        <div className="text-center mb-8">
          <Title level={3} className="text-blue-600 m-0">
            Simple Banking App
          </Title>
          <Text type="secondary">Đăng nhập để quản lý tài khoản của bạn</Text>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* TRƯỜNG EMAIL */}
          <div>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  size="large"
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Email đăng nhập"
                  status={errors.email ? "error" : ""}
                />
              )}
            />
            {/* Hiển thị lỗi Validation */}
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

            {/* Vùng hiển thị lỗi Validation VÀ Link Quên mật khẩu */}
            <div className="flex justify-between items-start mt-1 min-h-[20px]">
              <span className="text-red-500 text-sm">
                {errors.password?.message}
              </span>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:underline whitespace-nowrap ml-2"
              >
                Quên mật khẩu?
              </Link>
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
            Đăng nhập
          </Button>

          {/* LIÊN KẾT ĐĂNG KÝ */}
          <div className="text-center mt-4">
            <Text type="secondary">Chưa có tài khoản? </Text>
            <Link to="/register" className="text-blue-600 hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Login;
