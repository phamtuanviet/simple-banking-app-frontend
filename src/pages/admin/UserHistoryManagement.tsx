// src/pages/Admin/UserHistoryManagement.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Table,
  Typography,
  Input,
  Button,
  Row,
  Col,
  DatePicker,
  Space,
  Alert,
  Modal,
  Tag,
  message,
} from "antd";
import {
  FilterOutlined,
  ReloadOutlined,
  EyeOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import {
  adminUserHistoryService,
  type FilterUserHistoryDto,
  type UserHistoryItem,
} from "../../services/api/admin/userhistory/admin.userhistory.service";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function UserHistoryManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [uiFilters, setUiFilters] = useState<FilterUserHistoryDto>({});
  const [appliedFilters, setAppliedFilters] = useState<FilterUserHistoryDto>(
    {},
  );

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    log: UserHistoryItem | null;
  }>({
    open: false,
    log: null,
  });

  const {
    data: historyRes,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["admin-user-history", currentPage, pageSize, appliedFilters],
    queryFn: () =>
      adminUserHistoryService.getUserHistories({
        page: currentPage,
        limit: pageSize,
        ...appliedFilters,
      }),
    placeholderData: (previousData) => previousData,
  });

  // ==========================================
  // XỬ LÝ FILTER VÀ VALIDATE
  // ==========================================
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleApplyFilter = () => {
    if (uiFilters.email && !isValidEmail(uiFilters.email)) {
      message.warning("Vui lòng nhập đúng định dạng email mục tiêu!");
      return;
    }
    setCurrentPage(1);
    setAppliedFilters(uiFilters);
  };

  const handleResetFilter = () => {
    setUiFilters({});
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  // ==========================================
  // DIFF VIEWER (XEM SỰ THAY ĐỔI)
  // ==========================================
  const renderDiff = (before: any, after: any) => {
    if (!before && !after)
      return <Text italic>Không có chi tiết thay đổi</Text>;

    const changes: React.ReactNode[] = [];
    const allKeys = Array.from(
      new Set([...Object.keys(before || {}), ...Object.keys(after || {})]),
    );

    allKeys.forEach((key) => {
      if (["updatedAt", "created_at", "updated_at"].includes(key)) return;

      const valBefore = before?.[key];
      const valAfter = after?.[key];

      if (valBefore !== valAfter) {
        changes.push(
          <div
            key={key}
            className="mb-3 border-b border-gray-100 pb-2 last:border-0"
          >
            <Text strong className="block mb-1 text-gray-600">
              {key}:
            </Text>
            <div className="flex items-center gap-3">
              <Text
                delete
                type="danger"
                className="bg-red-50 px-2 py-1 rounded max-w-[200px] truncate"
                title={String(valBefore)}
              >
                {valBefore !== undefined && valBefore !== null
                  ? String(valBefore)
                  : "null"}
              </Text>
              <ArrowRightOutlined className="text-gray-400" />
              <Text
                type="success"
                className="bg-green-50 px-2 py-1 rounded max-w-[200px] truncate"
                title={String(valAfter)}
              >
                {valAfter !== undefined && valAfter !== null
                  ? String(valAfter)
                  : "null"}
              </Text>
            </div>
          </div>,
        );
      }
    });

    if (changes.length === 0)
      return (
        <Text italic>
          Không phát hiện thay đổi cụ thể trên các trường dữ liệu
        </Text>
      );
    return <div>{changes}</div>;
  };

  // ==========================================
  // CẤU HÌNH CỘT BẢNG
  // ==========================================
  const columns: ColumnsType<UserHistoryItem> = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (dateStr: string) => dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Tài khoản bị tác động",
      key: "targetUser",
      width: 200,
      render: (_, record) => {
        // Lấy ID từ record.user.id (theo JSON thực tế)
        const targetId = record.user?.id;

        return (
          <div>
            <Text strong className="block">
              {record.user?.email || "Unknown Email"}
            </Text>
            {/* Thêm dấu ? trước substring để chống crash nếu targetId bị undefined */}
            {targetId && (
              <Text
                type="secondary"
                className="text-xs"
                copyable={{ text: targetId }}
              >
                ID: {targetId?.substring(0, 8)}...
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Hành động / Lý do",
      dataIndex: "reason", // Map với trường 'reason' trong JSON
      key: "reason",
      width: 160,
      render: (reason: string) => (
        <Tag color="geekblue">{reason || "Cập nhật"}</Tag>
      ),
    },
    {
      title: "Người thực hiện",
      key: "changedBy",
      width: 200,
      render: (_, record) => {
        const targetId = record.user?.id;

        // Nếu ID người đổi trùng ID bị đổi -> Tự đổi
        if (record.changedById === targetId) {
          return <Tag color="green">Chủ tài khoản (Self)</Tag>;
        }
        if (!record.changedById) {
          return <Tag color="default">Hệ thống (System)</Tag>;
        }

        return (
          <div>
            <Text className="block text-orange-600 font-medium">
              {record.changedBy?.email || "Admin / Teller"}
            </Text>
            {record.changedById && (
              <Text
                type="secondary"
                className="text-xs"
                copyable={{ text: record.changedById }}
              >
                ID: {record.changedById?.substring(0, 8)}...
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Chi tiết",
      key: "details",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Button
          type="dashed"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setDetailModal({ open: true, log: record })}
        >
          Xem
        </Button>
      ),
    },
  ];

  if (isError)
    return (
      <Alert
        message="Lỗi tải dữ liệu Lịch sử người dùng."
        type="error"
        className="m-6"
      />
    );

  const tableData = historyRes?.data?.items || [];
  const totalItems = historyRes?.data?.total || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="shadow-sm mb-6 border-t-4 border-t-cyan-600">
        <Title level={4} className="mb-4">
          Bộ lọc lịch sử tài khoản
        </Title>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={5}>
            <Input
              placeholder="Email tài khoản mục tiêu..."
              allowClear
              value={uiFilters.email}
              status={
                uiFilters.email && !isValidEmail(uiFilters.email) ? "error" : ""
              }
              onChange={(e) =>
                setUiFilters((prev) => ({ ...prev, email: e.target.value }))
              }
              onPressEnter={handleApplyFilter}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Input
              placeholder="ID tài khoản mục tiêu (UUID)..."
              allowClear
              value={uiFilters.userId}
              onChange={(e) =>
                setUiFilters((prev) => ({ ...prev, userId: e.target.value }))
              }
              onPressEnter={handleApplyFilter}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="ID Người thực hiện (Admin/Teller)..."
              allowClear
              value={uiFilters.changedById}
              onChange={(e) =>
                setUiFilters((prev) => ({
                  ...prev,
                  changedById: e.target.value,
                }))
              }
              onPressEnter={handleApplyFilter}
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
        <div className="flex justify-end mt-4">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleResetFilter}>
              Xóa lọc
            </Button>
            <Button
              type="primary"
              className="bg-cyan-600 hover:bg-cyan-700"
              icon={<FilterOutlined />}
              onClick={handleApplyFilter}
            >
              Tra cứu lịch sử
            </Button>
          </Space>
        </div>
      </Card>

      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <Title level={3} className="!m-0">
            Lịch sử người dùng
          </Title>
          <Tag color="cyan">Tổng: {totalItems} bản ghi</Tag>
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
          scroll={{ x: 900 }}
        />
      </Card>

      {/* MODAL CHI TIẾT */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EyeOutlined /> Chi tiết thay đổi tài khoản
          </div>
        }
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, log: null })}
        footer={
          <Button
            type="primary"
            onClick={() => setDetailModal({ open: false, log: null })}
          >
            Đóng
          </Button>
        }
        width={700}
      >
        {detailModal.log && (
          <div className="py-4">
            <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
              <Title level={5} className="!mb-2 !text-gray-700">
                Lý do thay đổi
              </Title>
              <p className="mb-4 text-blue-600 font-medium">
                {detailModal.log.reason}
              </p>

              <Title level={5} className="!mb-2 !text-gray-700">
                Dữ liệu trước khi đổi (Previous Data)
              </Title>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto border border-gray-100">
                {JSON.stringify(detailModal.log.previousData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
