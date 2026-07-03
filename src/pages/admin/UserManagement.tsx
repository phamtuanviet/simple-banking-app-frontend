// src/pages/Admin/UserManagement.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Table,
  Tag,
  Typography,
  Input,
  Select,
  Switch,
  message,
  Row,
  Col,
  Popconfirm,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

import {
  type UserFilters,
  adminService,
  type UserItem,
} from "../../services/api/admin/user/admin.user.service";

const { Title, Text } = Typography;
const { Search } = Input;

export default function UserManagement() {
  const queryClient = useQueryClient();

  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State bộ lọc
  const [filters, setFilters] = useState<UserFilters>({});

  // 1. Fetch danh sách User
  const {
    data: usersRes,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-users", currentPage, pageSize, filters],
    queryFn: () => adminService.getUsers(currentPage, pageSize, filters),
    placeholderData: (previousData) => previousData,
  });

  // 2. Mutation cập nhật trạng thái User
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "locked" }) =>
      adminService.updateUserStatus(id, status),
    onSuccess: (res) => {
      message.success(res.message || "Cập nhật trạng thái thành công");
      // Refetch lại danh sách sau khi update
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật",
      );
    },
  });

  // 3. Xử lý đổi trạng thái (Khóa/Mở)
  const handleToggleStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "locked" : "active";
    updateStatusMutation.mutate({ id: userId, status: newStatus });
  };

  // 4. Cấu hình cột cho Table
  const columns: ColumnsType<UserItem> = [
    {
      title: "Họ và tên",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "admin" ? "purple" : "blue"}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Xác thực Email",
      dataIndex: "isEmailVerified",
      key: "isEmailVerified",
      render: (isVerified: boolean) => (
        <Tag color={isVerified ? "success" : "default"}>
          {isVerified ? "Đã xác thực" : "Chưa xác thực"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => {
        const isActive = record.status === "active";
        return (
          <Popconfirm
            title={`Bạn có chắc muốn ${isActive ? "khóa" : "mở khóa"} tài khoản này?`}
            onConfirm={() => handleToggleStatus(record.id, record.status)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Switch
              checked={isActive}
              checkedChildren="Hoạt động"
              unCheckedChildren="Đã khóa"
              loading={updateStatusMutation.isPending}
            />
          </Popconfirm>
        );
      },
    },
  ];

  // 5. Cập nhật state khi thay đổi bộ lọc hoặc phân trang
  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset về trang 1 khi lọc
  };

  const tableData = usersRes?.data?.items || [];
  const totalItems = usersRes?.data?.total || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Title level={3} className="mb-6">
        Quản lý người dùng
      </Title>

      {/* Khu vực Filter */}
      <Card className="shadow-sm mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Search
              placeholder="Tìm theo tên hoặc email..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(value) => handleFilterChange("search", value)}
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              className="w-full"
              placeholder="Trạng thái tài khoản"
              allowClear
              onChange={(value) => handleFilterChange("status", value)}
              options={[
                { value: "active", label: "Đang hoạt động" },
                { value: "locked", label: "Đã khóa" },
              ]}
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              className="w-full"
              placeholder="Vai trò"
              allowClear
              onChange={(value) => handleFilterChange("role", value)}
              options={[
                { value: "admin", label: "Quản trị viên" },
                { value: "customer", label: "Khách hàng" },
              ]}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              className="w-full"
              placeholder="Trạng thái xác thực"
              allowClear
              onChange={(value) => handleFilterChange("isEmailVerified", value)}
              options={[
                { value: "true", label: "Đã xác thực" },
                { value: "false", label: "Chưa xác thực" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Bảng dữ liệu */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="id"
          loading={isLoading || isFetching}
          onChange={handleTableChange}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            showSizeChanger: true,
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
