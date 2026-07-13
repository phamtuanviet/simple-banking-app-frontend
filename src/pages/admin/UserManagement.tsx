import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, Table, Tag, Typography, Input, Select, Button,
  Row, Col, Modal, message, Space
} from "antd";
import {
  FilterOutlined, ReloadOutlined, ExclamationCircleOutlined
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { adminService } from "../../services/api/admin/user/admin.user.service";
// Thay đường dẫn import này cho khớp với file service của bạn

const { Title, Text } = Typography;

// Giả định Interface (Hãy đảm bảo trong file service của bạn UserFilters có thêm trường 'id')
export interface UserFilters {
  id?: string;
  search?: string;
  status?: string;
  role?: string;
  isEmailVerified?: string;
}

type UserStatusType = "active" | "locked" | "banned";

export default function UserManagement() {
  const queryClient = useQueryClient();
  
  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // State bộ lọc (Đồng bộ logic UI/API giống các trang khác)
  const [uiFilters, setUiFilters] = useState<UserFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>({});

  // 1. Fetch danh sách User
  const {
    data: usersRes,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-users", currentPage, pageSize, appliedFilters],
    queryFn: () => adminService.getUsers(currentPage, pageSize, appliedFilters),
    placeholderData: (previousData) => previousData,
  });

  // 2. Mutation cập nhật trạng thái User
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatusType }) =>
      adminService.updateUserStatus(id, status),
    onSuccess: (res) => {
      message.success(res.message || "Cập nhật trạng thái người dùng thành công");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái"
      );
    },
  });

  // 3. Xử lý đổi trạng thái (Kèm cảnh báo Banned)
  const handleStatusChange = (userId: string, newStatus: UserStatusType) => {
    if (newStatus === "banned") {
      Modal.confirm({
        title: "Xác nhận cấm người dùng?",
        icon: <ExclamationCircleOutlined className="text-red-500" />,
        content:
          "Tài khoản bị cấm sẽ không thể đăng nhập hoặc thực hiện bất kỳ giao dịch nào vô thời hạn. Bạn có chắc chắn?",
        okText: "Xác nhận cấm",
        okType: "danger",
        cancelText: "Hủy",
        onOk: () => {
          updateStatusMutation.mutate({ id: userId, status: newStatus });
        },
      });
    } else {
      updateStatusMutation.mutate({ id: userId, status: newStatus });
    }
  };

  // 4. Cấu hình cột
  const columns: ColumnsType<any> = [
    {
      title: "Mã KH (ID)",
      dataIndex: "id",
      key: "id",
      width: 140,
      render: (id: string) => (
        <Text copyable={{ text: id }}>{id ? `${id.substring(0, 8)}...` : "N/A"}</Text>
      ),
    },
    {
      title: "Họ và tên",
      dataIndex: "fullName",
      key: "fullName",
      width: 180,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 220,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 130,
      render: (role: string) => {
        let color = "blue";
        if (role === "admin") color = "purple";
        if (role === "teller") color = "cyan";
        return <Tag color={color}>{role?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Xác thực",
      dataIndex: "isEmailVerified",
      key: "isEmailVerified",
      width: 130,
      render: (isVerified: boolean) => (
        <Tag color={isVerified ? "success" : "default"}>
          {isVerified ? "Đã xác thực" : "Chưa xác thực"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái & Thao tác",
      key: "status",
      width: 220,
      render: (_, record) => {
        const isCurrentLoading =
          updateStatusMutation.isPending &&
          updateStatusMutation.variables?.id === record.id;
          
        return (
          <div className="flex flex-col gap-1">
            <Select
              value={record.status}
              className="w-36"
              onChange={(value: UserStatusType) =>
                handleStatusChange(record.id, value)
              }
              loading={isCurrentLoading}
              disabled={isCurrentLoading}
              options={[
                { value: "active", label: <span className="text-green-600 font-medium">Hoạt động</span> },
                { value: "locked", label: <span className="text-orange-500 font-medium">Tạm khóa</span> },
                { value: "banned", label: <span className="text-red-500 font-medium">Bị cấm</span> },
              ]}
            />
            {record.status === "locked" && (
              <div className="mt-1">
                {record.lockoutUntil ? (
                  <Text type="secondary" className="text-xs block bg-orange-50 p-1 rounded border border-orange-100">
                    Khóa đến: {dayjs(record.lockoutUntil).format("DD/MM/YYYY HH:mm")}
                  </Text>
                ) : (
                  <Text type="warning" className="text-xs block bg-gray-50 p-1 rounded border border-gray-200">
                    Khóa vô thời hạn
                  </Text>
                )}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  // 5. Xử lý Filters & Pagination
  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  const handleApplyFilter = () => {
    setCurrentPage(1);
    setAppliedFilters(uiFilters);
  };

  const handleResetFilter = () => {
    setUiFilters({});
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const tableData = usersRes?.data?.items || [];
  const totalItems = usersRes?.data?.total || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* KHU VỰC BỘ LỌC (Đồng bộ UI với Audit / Ledger) */}
      <Card className="shadow-sm mb-6 border-t-4 border-t-blue-500">
        <Title level={4} className="mb-4">Bộ lọc tìm kiếm</Title>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={5}>
            <Input
              placeholder="Nhập Mã (ID) người dùng..."
              allowClear
              value={uiFilters.id}
              onChange={(e) => setUiFilters(prev => ({ ...prev, id: e.target.value }))}
              onPressEnter={handleApplyFilter}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Input
              placeholder="Tìm theo Tên hoặc Email..."
              allowClear
              value={uiFilters.search}
              onChange={(e) => setUiFilters(prev => ({ ...prev, search: e.target.value }))}
              onPressEnter={handleApplyFilter}
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              className="w-full"
              placeholder="Trạng thái tài khoản"
              allowClear
              value={uiFilters.status}
              onChange={(value) => setUiFilters(prev => ({ ...prev, status: value }))}
              options={[
                { value: "active", label: "Đang hoạt động" },
                { value: "locked", label: "Đang tạm khóa" },
                { value: "banned", label: "Bị cấm (Banned)" },
              ]}
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              className="w-full"
              placeholder="Vai trò hệ thống"
              allowClear
              value={uiFilters.role}
              onChange={(value) => setUiFilters(prev => ({ ...prev, role: value }))}
              options={[
                { value: "admin", label: "Quản trị viên" },
                { value: "teller", label: "Giao dịch viên" },
                { value: "customer", label: "Khách hàng" },
              ]}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              className="w-full"
              placeholder="Xác thực Email"
              allowClear
              value={uiFilters.isEmailVerified}
              onChange={(value) => setUiFilters(prev => ({ ...prev, isEmailVerified: value }))}
              options={[
                { value: "true", label: "Đã xác thực" },
                { value: "false", label: "Chưa xác thực" },
              ]}
            />
          </Col>
        </Row>

        <div className="flex justify-end mt-4">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleResetFilter}>
              Xóa bộ lọc
            </Button>
            <Button type="primary" className="bg-blue-600 hover:bg-blue-700" icon={<FilterOutlined />} onClick={handleApplyFilter}>
              Tra cứu
            </Button>
          </Space>
        </div>
      </Card>

      {/* BẢNG DỮ LIỆU */}
      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <Title level={3} className="!m-0">Quản lý người dùng</Title>
          <Tag color="blue" className="text-sm px-3 py-1">
            Tổng cộng: {totalItems} bản ghi
          </Tag>
        </div>
        
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
          scroll={{ x: 1000 }} // Đảm bảo không vỡ khung khi mở trên tablet/màn hình nhỏ
        />
      </Card>
    </div>
  );
}