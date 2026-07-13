// src/pages/Admin/LedgerManagement.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Table,
  Tag,
  Typography,
  Input,
  Select,
  Button,
  Row,
  Col,
  DatePicker,
  Space,
  Alert,
} from "antd";
import {
  ReloadOutlined,
  FilterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import {
  adminLedgerService,
  LedgerEntryType,
  type FilterLedgerDto,
  type LedgerEntry,
} from "../../services/api/admin/ledger/admin.ledger.service";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function LedgerManagement() {
  // State phân trang và bộ lọc
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // uiFilters: State tạm khi người dùng đang nhập liệu
  const [uiFilters, setUiFilters] = useState<FilterLedgerDto>({});
  // appliedFilters: State chính thức gửi lên API khi bấm "Lọc"
  const [appliedFilters, setAppliedFilters] = useState<FilterLedgerDto>({});

  // Fetch dữ liệu sổ cái
  const {
    data: ledgerRes,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["admin-ledger", currentPage, pageSize, appliedFilters],
    queryFn: () =>
      adminLedgerService.getLedgerEntries({
        page: currentPage,
        limit: pageSize,
        ...appliedFilters,
      }),
    placeholderData: (previousData) => previousData,
  });

  // ==========================================
  // CẤU HÌNH CỘT CHO BẢNG
  // ==========================================
  const columns: ColumnsType<LedgerEntry> = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (dateStr: string) => dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Mã giao dịch (TxID)",
      key: "transactionId",
      width: 140,
      render: (_, record) => {
        const txId = record.transaction?.id;
        return (
          // SỬA Ở ĐÂY: Truyền object { text: txId } để lấy giá trị thực tế khi copy
          <Text copyable={txId ? { text: txId } : false}>
            {txId ? `${txId.substring(0, 8)}...` : "N/A"}
          </Text>
        );
      },
    },
    {
      title: "Số tài khoản",
      key: "accountNumber",
      width: 150,
      render: (_, record) => {
        // Truy cập vào nested object account
        const accNum = record.account?.accountNumber;
        return <Text strong>{accNum || "Hệ thống"}</Text>;
      },
    },
    {
      title: "Loại bút toán",
      dataIndex: "type",
      key: "type",
      width: 150,
      render: (type: LedgerEntryType) => {
        if (type === LedgerEntryType.CREDIT) {
          return (
            <Tag color="green" icon={<ArrowDownOutlined />}>
              GHI CÓ (IN)
            </Tag>
          );
        }
        return (
          <Tag color="red" icon={<ArrowUpOutlined />}>
            GHI NỢ (OUT)
          </Tag>
        );
      },
    },
    {
      title: "Số tiền (VND)",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 160,
      render: (amount: number, record) => {
        const isCredit = record.type === LedgerEntryType.CREDIT;
        return (
          <Text
            strong
            className={`whitespace-nowrap text-base ${isCredit ? "text-green-600" : "text-red-500"}`}
          >
            {isCredit ? "+" : "-"}{" "}
            {new Intl.NumberFormat("vi-VN").format(amount)}
          </Text>
        );
      },
    },
    {
      title: "Số dư sau GD (VND)",
      dataIndex: "balanceAfter",
      key: "balanceAfter",
      align: "right",
      width: 180,
      render: (balance: number) => (
        <Text strong className="whitespace-nowrap text-base text-blue-600">
          {balance !== null && balance !== undefined
            ? new Intl.NumberFormat("vi-VN").format(balance)
            : "--"}
        </Text>
      ),
    },
  ];

  // ==========================================
  // XỬ LÝ SỰ KIỆN FILTER & PAGINATION
  // ==========================================
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
        message="Lỗi tải dữ liệu Sổ cái kế toán."
        type="error"
        className="m-6"
      />
    );
  }

  // Dữ liệu bóc tách từ Interceptor
  const tableData = ledgerRes?.data?.items || [];
  const totalItems = ledgerRes?.data?.total || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="shadow-sm mb-6 border-t-4 border-t-purple-600">
        <Title level={4} className="mb-4">
          Bộ lọc đối soát Sổ cái
        </Title>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Nhập Số tài khoản..."
              allowClear
              value={uiFilters.accountNumber}
              onChange={(e) =>
                setUiFilters((prev) => ({
                  ...prev,
                  accountNumber: e.target.value,
                }))
              }
              onPressEnter={handleApplyFilter}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Nhập Mã giao dịch (UUID)..."
              allowClear
              value={uiFilters.transactionId}
              onChange={(e) =>
                setUiFilters((prev) => ({
                  ...prev,
                  transactionId: e.target.value,
                }))
              }
              onPressEnter={handleApplyFilter}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              className="w-full"
              placeholder="Loại bút toán"
              allowClear
              value={uiFilters.type}
              onChange={(value) =>
                setUiFilters((prev) => ({ ...prev, type: value }))
              }
              options={[
                { value: LedgerEntryType.CREDIT, label: "Ghi Có (Cộng tiền)" },
                { value: LedgerEntryType.DEBIT, label: "Ghi Nợ (Trừ tiền)" },
              ]}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <RangePicker
              className="w-full"
              value={
                uiFilters.fromDate && uiFilters.toDate
                  ? [dayjs(uiFilters.fromDate), dayjs(uiFilters.toDate)]
                  : null
              }
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setUiFilters((prev) => ({
                    ...prev,
                    fromDate: dates[0].startOf("day").toISOString(),
                    toDate: dates[1].endOf("day").toISOString(),
                  }));
                } else {
                  setUiFilters((prev) => ({
                    ...prev,
                    fromDate: undefined,
                    toDate: undefined,
                  }));
                }
              }}
            />
          </Col>
        </Row>

        {/* Nút thao tác bộ lọc */}
        <div className="flex justify-end mt-4">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleResetFilter}>
              Xóa bộ lọc
            </Button>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={handleApplyFilter}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Tra cứu đối soát
            </Button>
          </Space>
        </div>
      </Card>

      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <Title level={3} className="!m-0">
            Sổ cái kế toán (Ledger)
          </Title>
          <Tag color="purple" className="text-sm px-3 py-1">
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
          scroll={{ x: 1000 }} // Đảm bảo bảng không bị vỡ trên màn hình nhỏ
        />
      </Card>
    </div>
  );
}
