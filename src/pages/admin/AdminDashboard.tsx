// src/pages/Admin/AdminDashboard.tsx
import React from "react";
import { Card, Statistic, Row, Col, Typography, Spin, Alert } from "antd";
import {
  TeamOutlined,
  SwapOutlined,
  LockOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/auth.store";
import { adminService } from "../../services/api/admin/user/admin.user.service";

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);

  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminService.getDashboardStats(),
    refetchOnWindowFocus: false, // Dữ liệu admin không cần refetch liên tục như số dư
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Đang tải số liệu hệ thống..." />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        message="Lỗi tải dữ liệu"
        description={
          (error as any)?.message || "Không thể lấy số liệu thống kê."
        }
        type="error"
        showIcon
        className="max-w-2xl mx-auto mt-10"
      />
    );
  }

  const stats = response?.data;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <Title level={3}>Xin chào Quản trị viên, {user?.full_name}!</Title>
        <Text type="secondary">
          Dưới đây là tình hình hoạt động của hệ thống Simple Banking.
        </Text>
      </div>

      {/* Hàng 1: Thống kê Người dùng */}
      <Title level={5} className="mb-4 text-gray-600">
        Tổng quan Người dùng
      </Title>
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} md={8}>
          <Card
            bordered={false}
            className="shadow-sm border-l-4 border-l-blue-500"
          >
            <Statistic
              title="Tổng số Người dùng"
              value={stats?.totalUsers}
              prefix={<TeamOutlined className="text-blue-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            bordered={false}
            className="shadow-sm border-l-4 border-l-green-500"
          >
            <Statistic
              title="Tài khoản Hoạt động"
              value={stats?.activeUsers}
              valueStyle={{ color: "#3f8600" }}
              prefix={<CheckCircleOutlined className="mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            bordered={false}
            className="shadow-sm border-l-4 border-l-red-500"
          >
            <Statistic
              title="Tài khoản Bị khóa"
              value={stats?.lockedUsers}
              valueStyle={{ color: "#cf1322" }}
              prefix={<LockOutlined className="mr-2" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Hàng 2: Thống kê Giao dịch */}
      <Title level={5} className="mb-4 text-gray-600">
        Tổng quan Giao dịch
      </Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={12}>
          <Card
            bordered={false}
            className="shadow-sm border-l-4 border-l-purple-500"
          >
            <Statistic
              title="Tổng lượt Giao dịch"
              value={stats?.totalTransactions}
              prefix={<SwapOutlined className="text-purple-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Card
            bordered={false}
            className="shadow-sm border-l-4 border-l-green-500"
          >
            <Statistic
              title="Giao dịch Thành công"
              value={stats?.successfulTransactions}
              valueStyle={{ color: "#3f8600" }}
              prefix={<CheckCircleOutlined className="mr-2" />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
