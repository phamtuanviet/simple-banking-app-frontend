// src/pages/Customer/TransactionHistory.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Table,
  Typography,
  Alert,
  Select,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Tag,
} from "antd";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs"; // antd v5+ sử dụng dayjs thay cho moment
import { accountService } from "../../services/api/account/account.service";
import {
  transactionService,
  type TransactionFilters,
} from "../../services/api/transaction/transaction.service";
import type { Transaction } from "../../types/transaction.type";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function TransactionHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State quản lý giá trị filter đang hiển thị trên UI
  const [uiFilters, setUiFilters] = useState<TransactionFilters>({});

  // State quản lý giá trị filter thực sự được dùng để gọi API (khi bấm Áp dụng)
  const [appliedFilters, setAppliedFilters] = useState<TransactionFilters>({});

  const { data: accountRes } = useQuery({
    queryKey: ["account-me"],
    queryFn: () => accountService.getMe(),
  });
  const myAccountId = accountRes?.data?.id;

  // React Query sẽ tự động gọi lại API khi currentPage, pageSize, hoặc appliedFilters thay đổi
  const {
    data: historyRes,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["transactions", currentPage, pageSize, appliedFilters],
    queryFn: () =>
      transactionService.getHistory(currentPage, pageSize, appliedFilters),
    placeholderData: (previousData) => previousData,
  });

  const columns: ColumnsType<Transaction> = [
    {
      title: "Mã giao dịch",
      dataIndex: "id",
      key: "id",
      render: (id: string) => (
        <Text copyable={{ text: id }}>{id.substring(0, 8)}...</Text>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (dateStr: string) => new Date(dateStr).toLocaleString("vi-VN"),
    },
    {
      title: "Biến động",
      key: "amount",
      render: (_, record) => {
        // Xác định Tiền vào hay Tiền ra
        const isMoneyOut = record.fromAccountId === myAccountId;
        const sign = isMoneyOut ? "-" : "+";
        const color = isMoneyOut ? "danger" : "success";

        return (
          <Text type={color} strong>
            {sign} {new Intl.NumberFormat("vi-VN").format(record.amount)}
          </Text>
        );
      },
    },
    {
      title: "Nội dung",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        let text = status;
        if (status === "success") {
          color = "green";
          text = "Thành công";
        } else if (status === "failed") {
          color = "red";
          text = "Thất bại";
        } else if (status === "pending") {
          color = "orange";
          text = "Đang xử lý";
        }
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      },
    },
  ];

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  const handleApplyFilter = () => {
    setCurrentPage(1); // Reset về trang 1 khi lọc
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
        message="Lỗi tải dữ liệu lịch sử giao dịch."
        type="error"
        className="m-6"
      />
    );
  }

  const tableData = historyRes?.data?.items || [];
  const totalItems = historyRes?.data?.total || 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card className="shadow-sm mb-6">
        <Title level={4} className="mb-4">
          Bộ lọc tìm kiếm
        </Title>
        <Row gutter={[16, 16]} align="middle">
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
          <Col xs={24} sm={12} md={6}>
            <Select
              className="w-full"
              placeholder="Biến động (Dòng tiền)"
              allowClear
              value={uiFilters.flow}
              onChange={(value) =>
                setUiFilters((prev) => ({ ...prev, flow: value }))
              }
              options={[
                { value: "in", label: "Tiền vào (+)" },
                { value: "out", label: "Tiền ra (-)" },
              ]}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <RangePicker
              className="w-full"
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
          </Col>
          <Col xs={24} sm={24} md={4} className="flex justify-end">
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
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm">
        <Title level={3} className="mb-6">
          Lịch sử giao dịch
        </Title>
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="id"
          loading={isLoading || isFetching} // Hiển thị loading khi đổi trang hoặc đổi filter
          onChange={handleTableChange}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            showSizeChanger: true,
          }}
          scroll={{ x: 600 }}
        />
      </Card>
    </div>
  );
}
