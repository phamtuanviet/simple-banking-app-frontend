import React from "react";
import { Card, Statistic, Row, Col, Typography, Spin, Alert } from "antd";
import { WalletOutlined, CreditCardOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/auth.store";
import { accountService } from "../../services/api/account/account.service";

const { Title, Text } = Typography;

export default function Dashboard() {
  // Lấy thông tin user từ Zustand để hiển thị lời chào
  const user = useAuthStore((state) => state.user);

  // Fetch dữ liệu tài khoản bằng React Query
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["account-me"],
    queryFn: () => accountService.getMe(),
    // Tùy chọn: Tự động refetch khi user focus lại vào tab để số dư luôn mới
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Đang tải thông tin tài khoản..." />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        message="Lỗi tải dữ liệu"
        description={
          (error as any)?.message || "Không thể lấy thông tin tài khoản."
        }
        type="error"
        showIcon
        className="max-w-2xl mx-auto mt-10"
      />
    );
  }

  const account = response?.data;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <Title level={3}>Xin chào, {user?.fullName || "Khách hàng"}!</Title>
        <Text type="secondary">Chào mừng bạn quay trở lại hệ thống.</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Card Số dư */}
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            className="shadow-sm hover:shadow-md transition-shadow h-full"
          >
            <Statistic
              title="Số dư khả dụng"
              value={account?.balance}
              precision={0} // Hiển thị 2 chữ số thập phân
              valueStyle={{ color: "#3f8600", fontWeight: "bold" }}
              prefix={<WalletOutlined className="mr-2" />}
              suffix={account?.currency || "VND"}
            />
          </Card>
        </Col>

        {/* Card Thông tin tài khoản */}
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            className="shadow-sm hover:shadow-md transition-shadow h-full"
          >
            <Statistic
              title="Số tài khoản"
              value={account?.accountNumber}
              valueStyle={{ fontWeight: "500" }}
              prefix={<CreditCardOutlined className="mr-2" />}
              groupSeparator=""
              // Thêm nút Copy ở đuôi (suffix)
              suffix={
                account?.accountNumber && (
                  <Text
                    className="ml-2 text-gray-400 hover:text-blue-500"
                    copyable={{
                      text: String(account?.accountNumber),
                      tooltips: ["Sao chép", "Đã sao chép!"],
                    }}
                  />
                )
              }
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
