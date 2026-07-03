// src/pages/Admin/AllTransactions.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Table,
  Tag,
  Typography,
  Alert,
  Select,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Input,
} from "antd";
import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";

import {
  type AdminTransaction,
  adminService,
  type AdminTransactionFilters,
} from "../../services/api/admin/transaction/admin.transaction.service";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

export default function AllTransactions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [uiFilters, setUiFilters] = useState<AdminTransactionFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<AdminTransactionFilters>(
    {},
  );

  const {
    data: historyRes,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["admin-transactions", currentPage, pageSize, appliedFilters],
    queryFn: () =>
      adminService.getAllTransactions(currentPage, pageSize, appliedFilters),
    placeholderData: (previousData) => previousData,
  });

  const columns: ColumnsType<AdminTransaction> = [
    {
      title: "Mã GD",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (id: string) => (
        <Text copyable={{ text: id }}>{id.substring(0, 8)}...</Text>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (dateStr: string) => new Date(dateStr).toLocaleString("vi-VN"),
    },
    {
      title: "Người gửi",
      key: "sender",
      render: (_, record) => (
        <div>
          <Text strong>
            {record.fromAccount?.user?.full_name || "Hệ thống (Nạp)"}
          </Text>
          {record.fromAccount && (
            <div>
              <Text type="secondary" className="text-xs">
                STK: {record.fromAccount.accountNumber}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Người nhận",
      key: "receiver",
      render: (_, record) => (
        <div>
          <Text strong>{record.toAccount?.user?.full_name || "N/A"}</Text>
          {record.toAccount && (
            <div>
              <Text type="secondary" className="text-xs">
                STK: {record.toAccount.accountNumber}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Số tiền (VND)",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount: number) => (
        <Text strong type="warning">
          {new Intl.NumberFormat("vi-VN").format(amount)}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          success: { color: "green", text: "Thành công" },
          failed: { color: "red", text: "Thất bại" },
          pending: { color: "orange", text: "Đang xử lý" },
        };
        const config = statusConfig[status] || {
          color: "default",
          text: status,
        };
        return <Tag color={config.color}>{config.text.toUpperCase()}</Tag>;
      },
    },
  ];

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

  if (isError) {
    return (
      <Alert
        message="Lỗi tải dữ liệu toàn hệ thống."
        type="error"
        className="m-6"
      />
    );
  }

  const tableData = historyRes?.data?.items || [];
  const totalItems = historyRes?.data?.total || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="shadow-sm mb-6">
        <Title level={4} className="mb-4">
          Bộ lọc kiểm toán
        </Title>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Tìm Mã GD, STK, Tên..."
              allowClear
              enterButton={<SearchOutlined />}
              value={uiFilters.search}
              onChange={(e) =>
                setUiFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              onSearch={handleApplyFilter}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              className="w-full"
              placeholder="Trạng thái"
              allowClear
              value={uiFilters.status}
              onChange={(value) =>
                setUiFilters((prev) => ({ ...prev, status: value }))
              }
              options={[
                { value: "success", label: "Thành công" },
                { value: "pending", label: "Đang xử lý" },
                { value: "failed", label: "Thất bại" },
              ]}
            />
          </Col>
          <Col xs={24} sm={24} md={10}>
            <div className="flex gap-4 items-center w-full justify-between">
              <RangePicker
                className="flex-grow"
                value={
                  uiFilters.startDate && uiFilters.endDate
                    ? [dayjs(uiFilters.startDate), dayjs(uiFilters.endDate)]
                    : null
                }
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setUiFilters((prev) => ({
                      ...prev,
                      startDate: dates[0].format("YYYY-MM-DD"),
                      endDate: dates[1].format("YYYY-MM-DD"),
                    }));
                  } else {
                    setUiFilters((prev) => ({
                      ...prev,
                      startDate: undefined,
                      endDate: undefined,
                    }));
                  }
                }}
              />
              <Space>
                <Button icon={<ReloadOutlined />} onClick={handleResetFilter}>
                  Xóa
                </Button>
                <Button
                  type="primary"
                  icon={<FilterOutlined />}
                  onClick={handleApplyFilter}
                >
                  Lọc
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm">
        <Title level={3} className="mb-6">
          Toàn bộ giao dịch hệ thống
        </Title>
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
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
}
