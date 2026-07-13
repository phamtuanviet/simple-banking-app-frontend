import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Modal,
  Input,
  message,
} from "antd";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { accountService } from "../../services/api/account/account.service";
import { transactionService } from "../../services/api/transaction/transaction.service";
import type { AxiosError } from "axios";

// Giả sử bạn đã export các interface này từ service
import type { TransactionFilters } from "../../services/api/transaction/transaction.service";
import type { Transaction } from "../../types/transaction.type";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function TransactionHistory() {
  const queryClient = useQueryClient();

  // State phân trang và filter
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [uiFilters, setUiFilters] = useState<TransactionFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<TransactionFilters>({});

  // State quản lý Modal OTP
  const [resumeTxId, setResumeTxId] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState("");

  const { data: accountRes } = useQuery({
    queryKey: ["account-me"],
    queryFn: () => accountService.getMe(),
  });
  const myAccountId = accountRes?.data?.id;

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

  // Mutation Xác nhận OTP
  const confirmOtpMutation = useMutation({
    mutationFn: () => transactionService.confirmOtp(resumeTxId!, otpValue),
    onSuccess: (res) => {
      message.success(res.message || "Xác thực OTP thành công!");
      setResumeTxId(null);
      setOtpValue("");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["account-me"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      message.error(
        error?.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn.",
      );
    },
  });

  // Mutation Gửi lại OTP
  const resendOtpMutation = useMutation({
    mutationFn: () => transactionService.resendOtp(resumeTxId!),
    onSuccess: () => {
      message.success("Đã gửi lại mã OTP vào email của bạn.");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      message.error(
        error?.response?.data?.message || "Không thể gửi lại OTP lúc này.",
      );
    },
  });

  const columns: ColumnsType<Transaction> = [
    {
      title: "Mã giao dịch",
      dataIndex: "id",
      key: "id",
      width: 130, // Cố định độ rộng
      render: (id: string) => (
        <Text copyable={{ text: id }}>{id.substring(0, 8)}...</Text>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170, // Đủ chỗ cho ngày giờ
      render: (dateStr: string) => new Date(dateStr).toLocaleString("vi-VN"),
    },
    // ==========================================
    // [MỚI] CỘT LOẠI GIAO DỊCH
    // ==========================================
    {
      title: "Loại GD",
      dataIndex: "type",
      key: "type",
      width: 130,
      render: (type: string) => {
        const typeConfig: Record<string, { color: string; text: string }> = {
          transfer: { color: "blue", text: "Chuyển khoản" },
          deposit: { color: "green", text: "Nạp tiền" },
          withdrawal: { color: "orange", text: "Rút tiền" },
          reversal: { color: "purple", text: "Hoàn tiền" },
        };
        const config = typeConfig[type] || {
          color: "default",
          text: type?.toUpperCase(),
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    // ==========================================
    // [ĐÃ SỬA] CỘT BIẾN ĐỘNG (CHỐNG XUỐNG DÒNG)
    // ==========================================
    {
      title: "Biến động (VND)",
      key: "amount",
      align: "right", // Căn phải cho số tiền dễ nhìn
      width: 160,
      render: (_, record) => {
        // Nếu là Nạp tiền (deposit) hoặc Hoàn tiền (reversal) thì coi như tiền vào
        // Nếu là rút (withdrawal) thì coi như tiền ra
        // Nếu là chuyển khoản (transfer) thì kiểm tra xem mình là người gửi hay nhận
        let isMoneyOut = false;
        if (record.type === "withdrawal") {
          isMoneyOut = true;
        } else if (
          record.type === "transfer" &&
          record.fromAccountId === myAccountId
        ) {
          isMoneyOut = true;
        }

        const sign = isMoneyOut ? "-" : "+";
        const color = isMoneyOut ? "danger" : "success";

        return (
          // Thêm className="whitespace-nowrap" để chặn việc text bị rớt dòng
          <Text type={color} strong className="whitespace-nowrap text-base">
            {sign} {new Intl.NumberFormat("vi-VN").format(record.amount)}
          </Text>
        );
      },
    },
    {
      title: "Nội dung",
      dataIndex: "description",
      key: "description",
      // Thêm minWidth để cột nội dung co giãn linh hoạt chiếm phần không gian còn lại
      render: (text: string) => <div style={{ minWidth: 200 }}>{text}</div>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status: string) => {
        let color = "default";
        let text = status;
        switch (status?.toLowerCase()) {
          case "completed":
            color = "green";
            text = "Thành công";
            break;
          case "failed":
            color = "red";
            text = "Thất bại";
            break;
          case "processing":
            color = "blue";
            text = "Đang xử lý";
            break;
          case "pending_otp":
            color = "warning";
            text = "Chờ xác thực OTP";
            break;
          case "pending_approval":
            color = "purple";
            text = "Chờ Admin duyệt";
            break;
          case "reversed":
            color = "volcano";
            text = "Đã hoàn tiền";
            break;
          default:
            text = status?.toUpperCase();
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => {
        if (
          record.status?.toLowerCase() === "pending_otp" &&
          record.fromAccountId === myAccountId
        ) {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => setResumeTxId(record.id)}
            >
              Xác thực ngay
            </Button>
          );
        }
        return null;
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
                { value: "completed", label: "Thành công" },
                { value: "processing", label: "Đang xử lý" },
                { value: "pending_otp", label: "Chờ OTP" },
                { value: "pending_approval", label: "Chờ duyệt" },
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
          loading={isLoading || isFetching}
          onChange={handleTableChange}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            showSizeChanger: true,
          }}
          scroll={{ x: 800 }} // Nới rộng scroll để phù hợp thêm cột Hành động
        />
      </Card>

      {/* MODAL OTP DÙNG CHUNG ĐỂ TIẾP TỤC XÁC THỰC */}
      <Modal
        title="Tiếp tục xác thực OTP"
        open={!!resumeTxId}
        maskClosable={false}
        keyboard={false}
        onCancel={() => {
          setResumeTxId(null);
          setOtpValue("");
        }}
        footer={[
          <Button
            key="resend"
            onClick={() => resendOtpMutation.mutate()}
            loading={resendOtpMutation.isPending}
          >
            Gửi lại OTP
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={confirmOtpMutation.isPending}
            onClick={() => confirmOtpMutation.mutate()}
            disabled={otpValue.length < 6}
          >
            Xác nhận
          </Button>,
        ]}
      >
        <div className="py-4 text-center">
          <Text>
            Mã OTP đã được gửi đến email của bạn. Giao dịch sẽ hết hạn sau 5
            phút.
          </Text>
          <div className="mt-6 flex justify-center">
            <Input.OTP
              length={6}
              value={otpValue}
              onChange={setOtpValue}
              size="large"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
