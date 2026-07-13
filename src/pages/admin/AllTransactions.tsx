import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Popconfirm,
  message,
  Modal,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import {
  adminService,
  ApprovalAction,
  type ReversalRequest,
} from "../../services/api/admin/transaction/admin.transaction.service";
// Sửa lại đường dẫn import adminService và các type cho đúng với project của bạn

const { Title, Text } = Typography;
const { Search, TextArea } = Input;
const { RangePicker } = DatePicker;

export default function AllTransactions() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [uiFilters, setUiFilters] = useState<any>({});
  const [appliedFilters, setAppliedFilters] = useState<any>({});

  const [reverseModal, setReverseModal] = useState<{
    open: boolean;
    transactionId: string | null;
  }>({ open: false, transactionId: null });
  const [reverseReason, setReverseReason] = useState("");

  // State cho Modal Từ chối giao dịch
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    transactionId: string | null;
  }>({ open: false, transactionId: null });
  const [rejectRemarks, setRejectRemarks] = useState("");

  // 1. Fetch dữ liệu
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

  // 2. Mutation Duyệt / Từ chối giao dịch
  const approveMutation = useMutation({
    mutationFn: (data: {
      transactionId: string;
      action: ApprovalAction;
      remarks?: string;
    }) => adminService.approveTransfer(data),
    onSuccess: (res) => {
      // res lúc này chính là ApiResponse, TypeScript sẽ gợi ý đúng chuẩn:
      // res.message -> "Chuyển khoản thành công"
      // res.data.transactionId -> "uuid-..."

      message.success(res.message || "Xử lý giao dịch thành công");

      setRejectModal({ open: false, transactionId: null });
      setRejectRemarks("");
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || "Lỗi khi xử lý giao dịch",
      );
    },
  });

  const reverseMutation = useMutation({
    mutationFn: (data: ReversalRequest) =>
      adminService.reverseTransaction(data),
    onSuccess: (res) => {
      message.success(res.message || "Hoàn tiền thành công");
      setReverseModal({ open: false, transactionId: null });
      setReverseReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "Lỗi khi hoàn tiền");
    },
  });

  const handleConfirmReverse = () => {
    if (!reverseReason.trim()) {
      message.warning("Vui lòng nhập lý do hoàn tiền");
      return;
    }
    reverseMutation.mutate({
      originalTransactionId: reverseModal.transactionId!,
      reason: reverseReason,
    });
  };

  // Hàm xử lý khi bấm Duyệt
  // const handleApprove = (transactionId: string) => {
  //   approveMutation.mutate({ transactionId, action: ApprovalAction.APPROVE });
  // };

  // Hàm xử lý khi xác nhận Từ chối trong Modal
  const handleConfirmReject = () => {
    if (!rejectRemarks.trim()) {
      message.warning("Vui lòng nhập lý do từ chối");
      return;
    }
    approveMutation.mutate({
      transactionId: rejectModal.transactionId!,
      action: ApprovalAction.REJECT,
      remarks: rejectRemarks,
    });
  };

  // 3. Cấu hình Cột
  const columns: ColumnsType<any> = [
    {
      title: "Mã GD",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (id: string) => (
        <div style={{ whiteSpace: "nowrap" }}>
          <Text copyable={{ text: id }}>{id.substring(0, 8)}...</Text>
        </div>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (dateStr: string) => dayjs(dateStr).format("DD/MM/YYYY HH:mm"),
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
            <div className="text-xs text-gray-500">
              STK: {record.fromAccount.accountNumber}
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
          <Text strong>
            {record.toAccount?.user?.full_name || "Hệ thống (Rút)"}
          </Text>
          {record.toAccount && (
            <div className="text-xs text-gray-500">
              STK: {record.toAccount.accountNumber}
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
      title: "Loại GD",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const typeConfig: Record<string, { color: string; text: string }> = {
          transfer: { color: "blue", text: "Chuyển khoản" },
          deposit: { color: "green", text: "Nạp tiền" },
          withdrawal: { color: "orange", text: "Rút tiền" },
          reversal: { color: "purple", text: "Hoàn tiền" },
        };
        const config = typeConfig[type] || { color: "default", text: type };
        return (
          <Tag color={config.color} variant="outlined">
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          pending: { color: "gold", text: "Chờ khởi tạo" },
          pending_otp: { color: "volcano", text: "Chờ mã OTP" },
          pending_approval: { color: "cyan", text: "Chờ duyệt" },
          processing: { color: "blue", text: "Đang xử lý" },
          completed: { color: "green", text: "Thành công" },
          failed: { color: "red", text: "Thất bại" },
          reversed: { color: "purple", text: "Đã hoàn tiền" },
        };
        const config = statusConfig[status] || {
          color: "default",
          text: status,
        };
        return <Tag color={config.color}>{config.text.toUpperCase()}</Tag>;
      },
    },
    // ==========================================
    // [MỚI] CỘT THAO TÁC DUYỆT GIAO DỊCH
    // ==========================================
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      width: 180,
      render: (_, record) => {
        const isProcessingApprove =
          approveMutation.isPending &&
          approveMutation.variables?.transactionId === record.id;

        const canReverse =
          record.status === "completed" &&
          record.type !== "reversal" &&
          record.fromAccount &&
          record.toAccount;

        return (
          <Space>
            {/* 1. Nút Duyệt/Từ chối: Chỉ hiện khi Chờ duyệt */}
            {record.status === "pending_approval" && (
              <>
                <Popconfirm
                  title="Phê duyệt giao dịch này?"
                  onConfirm={() =>
                    approveMutation.mutate({
                      transactionId: record.id,
                      action: ApprovalAction.APPROVE,
                    })
                  }
                  okText="Duyệt"
                  cancelText="Hủy"
                >
                  <Button
                    type="primary"
                    size="small"
                    className="bg-green-600"
                    loading={isProcessingApprove}
                  >
                    Duyệt
                  </Button>
                </Popconfirm>
                <Button
                  danger
                  size="small"
                  disabled={isProcessingApprove}
                  onClick={() =>
                    setRejectModal({ open: true, transactionId: record.id })
                  }
                >
                  Từ chối
                </Button>
              </>
            )}

            {/* 2. Nút Hoàn tiền (Reversal): Chỉ hiện khi Giao dịch đã THÀNH CÔNG và KHÔNG PHẢI là giao dịch Reversal trước đó */}
            {canReverse && (
              <Button
                type="dashed"
                danger
                size="small"
                onClick={() =>
                  setReverseModal({ open: true, transactionId: record.id })
                }
              >
                Hoàn tiền
              </Button>
            )}
          </Space>
        );
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

  if (isError)
    return (
      <Alert
        message="Lỗi tải dữ liệu toàn hệ thống."
        type="error"
        className="m-6"
      />
    );

  const tableData = historyRes?.data?.items || [];
  const totalItems = historyRes?.data?.total || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="shadow-sm mb-6 border-t-4 border-t-orange-500">
        <Title level={4} className="mb-4">
          Bộ lọc kiểm toán
        </Title>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Tìm Mã GD, STK, Tên..."
              allowClear
              value={uiFilters.search}
              onChange={(e) =>
                setUiFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              onSearch={handleApplyFilter}
              // [ĐÃ SỬA] Thay icon bằng một Button hoàn chỉnh để dễ dàng chèn class đổi màu
              enterButton={
                <Button
                  type="primary"
                  className="bg-orange-500 hover:bg-orange-600 border-none rounded-l-none"
                  icon={<SearchOutlined />}
                />
              }
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
                { value: "completed", label: "Thành công" },
                { value: "pending_approval", label: "Chờ duyệt" },
                { value: "pending_otp", label: "Chờ mã OTP" },
                { value: "failed", label: "Thất bại" },
                { value: "reversed", label: "Đã hoàn tiền" },
              ]}
            />
          </Col>
          <Col xs={24} sm={24} md={10}>
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
        </Row>

        {/* Cụm nút thao tác được tách riêng xuống góc phải, đồng bộ thiết kế */}
        <div className="flex justify-end mt-4">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleResetFilter}>
              Xóa bộ lọc
            </Button>
            <Button
              type="primary"
              className="bg-orange-500 hover:bg-orange-600 border-none"
              icon={<FilterOutlined />}
              onClick={handleApplyFilter}
            >
              Lọc giao dịch
            </Button>
          </Space>
        </div>
      </Card>
      <Card className="shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <Title level={3} className="!m-0">
            Toàn bộ giao dịch hệ thống
          </Title>
          <Tag color="orange" className="text-sm px-3 py-1">
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
          scroll={{ x: 1000 }} // Nới rộng thêm để chứa cột Thao tác
        />
      </Card>
      {/* MODAL NHẬP LÝ DO TỪ CHỐI */}
      <Modal
        title="Từ chối giao dịch"
        open={rejectModal.open}
        onOk={handleConfirmReject}
        confirmLoading={approveMutation.isPending}
        onCancel={() => {
          setRejectModal({ open: false, transactionId: null });
          setRejectRemarks("");
        }}
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
      >
        <div className="py-4">
          <div className="mb-2">Vui lòng nhập lý do từ chối (bắt buộc):</div>
          <TextArea
            rows={4}
            placeholder="Ví dụ: Tài khoản nhận có dấu hiệu lừa đảo..."
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
          />
        </div>
      </Modal>
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600">
            <ExclamationCircleOutlined /> Xác nhận hoàn tiền (Reversal)
          </div>
        }
        open={reverseModal.open}
        onOk={handleConfirmReverse}
        confirmLoading={reverseMutation.isPending}
        onCancel={() => {
          setReverseModal({ open: false, transactionId: null });
          setReverseReason("");
        }}
        okText="Thực hiện hoàn tiền"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
      >
        <div className="py-4">
          <Alert
            message="Cảnh báo hệ thống"
            description="Hành động này sẽ tạo ra một giao dịch đảo ngược (Reversal), rút tiền từ tài khoản người nhận để trả về cho người gửi. Hành động này không thể hoàn tác."
            type="warning"
            showIcon
            className="mb-4"
          />
          <div className="mb-2 font-medium">Lý do hoàn tiền (Bắt buộc):</div>
          <TextArea
            rows={3}
            placeholder="Ví dụ: Giao dịch gian lận, khách hàng chuyển nhầm..."
            value={reverseReason}
            onChange={(e) => setReverseReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
