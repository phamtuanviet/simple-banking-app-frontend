// src/pages/Admin/AuditLogManagement.tsx
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
  Modal,
  Tooltip,
  Descriptions,
  message,
} from "antd";
import {
  ReloadOutlined,
  FilterOutlined,
  EyeOutlined,
  ArrowRightOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import {
  adminAuditLogService,
  type FilterAuditLogDto,
  type AuditLogItem,
} from "../../services/api/admin/auditlog/admin.auditlog.service";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Cấu hình hiển thị cho các Action (Dịch sang tiếng Việt & Màu sắc)
const actionConfig: Record<string, { color: string; text: string }> = {
  LOGIN_SUCCESS: { color: "green", text: "Đăng nhập" },
  LOGIN_FAILED: { color: "red", text: "Đăng nhập thất bại" },
  LOCK_ACCOUNT: { color: "orange", text: "Khóa tài khoản" },
  UNLOCK_ACCOUNT: { color: "cyan", text: "Mở khóa tài khoản" },
  BAN_ACCOUNT: { color: "magenta", text: "Cấm tài khoản" },
  CHANGE_PASSWORD: { color: "blue", text: "Đổi mật khẩu" },
  APPROVE_LARGE_TRANSACTION: { color: "purple", text: "Duyệt GD lớn" },
  REJECT_LARGE_TRANSACTION: { color: "volcano", text: "Từ chối GD lớn" },
};

export default function AuditLogManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [uiFilters, setUiFilters] = useState<FilterAuditLogDto>({});
  const [appliedFilters, setAppliedFilters] = useState<FilterAuditLogDto>({});

  // State quản lý Modal xem chi tiết thay đổi
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    log: AuditLogItem | null;
  }>({
    open: false,
    log: null,
  });

  const {
    data: logRes,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["admin-audit-logs", currentPage, pageSize, appliedFilters],
    queryFn: () =>
      adminAuditLogService.getAuditLogs({
        page: currentPage,
        limit: pageSize,
        ...appliedFilters,
      }),
    placeholderData: (previousData) => previousData,
  });

  // ==========================================
  // HÀM SO SÁNH (DIFF VIEW) GIỮA BEFORE & AFTER
  // ==========================================
  const renderDiff = (before: any, after: any) => {
    if (!before && !after) return <Text italic>Không có dữ liệu thay đổi</Text>;

    // Nếu chỉ có afterData (ví dụ LOGIN_SUCCESS tạo mới refresh token)
    if (!before && after) {
      return (
        <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
          {JSON.stringify(after, null, 2)}
        </pre>
      );
    }

    const changes: React.ReactNode[] = [];
    const allKeys = Array.from(
      new Set([...Object.keys(before || {}), ...Object.keys(after || {})]),
    );

    allKeys.forEach((key) => {
      // Bỏ qua các trường timestamp nội bộ thường bị cập nhật tự động
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
      return <Text italic>Không phát hiện thay đổi giá trị cụ thể</Text>;
    return <div>{changes}</div>;
  };

  // ==========================================
  // CẤU HÌNH CỘT BẢNG
  // ==========================================
  const columns: ColumnsType<AuditLogItem> = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (dateStr: string) => dayjs(dateStr).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Người thực hiện",
      key: "actor",
      width: 220,
      render: (_, record) =>
        record.actor ? (
          <div>
            <Text strong className="block">
              {record.actor.fullName}
            </Text>
            <Text type="secondary" className="text-xs">
              {record.actor.email}
            </Text>
          </div>
        ) : (
          <Text type="warning" italic>
            Hệ thống (System)
          </Text>
        ),
    },
    {
      title: "Hành động",
      dataIndex: "action",
      key: "action",
      width: 180,
      render: (action: string) => {
        const config = actionConfig[action] || {
          color: "default",
          text: action,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Đối tượng (Entity)",
      key: "entity",
      width: 160,
      render: (_, record) => (
        <div>
          <Tag color="geekblue" className="uppercase mb-1">
            {record.entity}
          </Tag>

          <div className="text-xs mt-1">
            <Text
              type="secondary"
              copyable={record.entityId ? { text: record.entityId } : false}
            >
              ID:{" "}
              {record.entityId
                ? `${record.entityId.substring(0, 8)}...`
                : "N/A"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Mạng & Thiết bị",
      key: "network",
      width: 150,
      render: (_, record) => (
        <Tooltip title={record.userAgent}>
          <div className="flex items-center gap-2 cursor-help">
            <DesktopOutlined className="text-gray-400" />
            <Text className="text-xs font-mono">{record.ipAddress}</Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Dữ liệu",
      key: "details",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Button
          type="dashed"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setDetailModal({ open: true, log: record })}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  const handleApplyFilter = () => {
    // Nếu có nhập email nhưng sai định dạng -> Báo lỗi và chặn gọi API
    if (uiFilters.email && !isValidEmail(uiFilters.email)) {
      message.warning("Vui lòng nhập đúng định dạng email trước khi tìm kiếm!");
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

  if (isError)
    return (
      <Alert
        message="Lỗi tải dữ liệu Audit Log."
        type="error"
        className="m-6"
      />
    );

  const tableData = logRes?.data?.items || [];
  const totalItems = logRes?.data?.total || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="shadow-sm mb-6 border-t-4 border-t-gray-700">
        <Title level={4} className="mb-4">
          Truy vết hệ thống (Audit Logs)
        </Title>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Email người thực hiện..."
              allowClear
              value={uiFilters.email}
              onChange={(e) =>
                setUiFilters((prev) => ({ ...prev, email: e.target.value }))
              }
              onPressEnter={handleApplyFilter}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              className="w-full"
              placeholder="Hành động"
              allowClear
              value={uiFilters.action}
              onChange={(value) =>
                setUiFilters((prev) => ({ ...prev, action: value }))
              }
              options={Object.keys(actionConfig).map((key) => ({
                value: key,
                label: actionConfig[key].text,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              className="w-full"
              placeholder="Đối tượng (Entity)"
              allowClear
              value={uiFilters.entity}
              onChange={(value) =>
                setUiFilters((prev) => ({ ...prev, entity: value }))
              }
              options={[
                { value: "users", label: "Người dùng (Users)" },
                { value: "transaction", label: "Giao dịch (Transactions)" },
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
        <div className="flex justify-end mt-4">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleResetFilter}>
              Xóa lọc
            </Button>
            <Button
              type="primary"
              className="bg-gray-700 hover:bg-gray-800"
              icon={<FilterOutlined />}
              onClick={handleApplyFilter}
            >
              Truy vết
            </Button>
          </Space>
        </div>
      </Card>

      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <Title level={3} className="!m-0">
            Nhật ký hoạt động
          </Title>
          <Tag color="default">Tổng: {totalItems} log</Tag>
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
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* MODAL XEM CHI TIẾT SỰ THAY ĐỔI */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EyeOutlined /> Chi tiết thay đổi dữ liệu
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
            <Descriptions bordered size="small" column={1} className="mb-6">
              <Descriptions.Item label="Mã Log (ID)">
                {detailModal.log.id}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian">
                {dayjs(detailModal.log.createdAt).format("DD/MM/YYYY HH:mm:ss")}
              </Descriptions.Item>
              <Descriptions.Item label="Tác nhân (Actor)">
                {detailModal.log.actor?.email || "Hệ thống"}
              </Descriptions.Item>
              <Descriptions.Item label="Hành động">
                <Tag
                  color={
                    actionConfig[detailModal.log.action]?.color || "default"
                  }
                >
                  {actionConfig[detailModal.log.action]?.text ||
                    detailModal.log.action}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
              <Title level={5} className="!mb-4 !text-gray-700">
                Dữ liệu bị thay đổi
              </Title>
              {renderDiff(
                detailModal.log.beforeData,
                detailModal.log.afterData,
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
