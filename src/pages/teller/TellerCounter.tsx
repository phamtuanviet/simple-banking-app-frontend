// src/pages/Teller/TellerCounter.tsx
import React, { useState } from "react";
import {
  Card,
  Tabs,
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Typography,
  Modal,
  Divider,
  Spin,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  ExclamationCircleOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { accountService } from "../../services/api/account/account.service";
import {
  tellerService,
  type TellerTransferRequest,
  type CashTransactionRequest,
} from "../../services/teller/teller.service";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function TellerCounter() {
  const [depositForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();
  const [transferForm] = Form.useForm(); // [MỚI] Form chuyển tiền tại quầy

  // Quản lý Tab đang mở
  const [activeTab, setActiveTab] = useState("deposit");

  // ==========================================
  // LOGIC THEO DÕI VÀ FETCH CHO TAB NẠP / RÚT
  // ==========================================
  const depositAcc = Form.useWatch("accountNumber", depositForm);
  const withdrawAcc = Form.useWatch("accountNumber", withdrawForm);
  const currentCashAcc = activeTab === "deposit" ? depositAcc : withdrawAcc;

  const {
    data: cashAccountRes,
    isFetching: isFetchingCashAccount,
    isError: isCashAccountError,
  } = useQuery({
    queryKey: ["teller-cash-account-info", currentCashAcc],
    queryFn: () => accountService.getRecipientInfo(currentCashAcc),
    enabled:
      (activeTab === "deposit" || activeTab === "withdraw") &&
      !!currentCashAcc &&
      currentCashAcc.length === 10,
    retry: false,
  });
  const cashAccountOwnerName = cashAccountRes?.data?.fullName || "";

  // ==========================================
  // [MỚI] LOGIC THEO DÕI VÀ FETCH CHO TAB CHUYỂN TIỀN (Sử dụng 2 Query song song)
  // ==========================================
  const fromAccWatch = Form.useWatch("fromAccountNumber", transferForm);
  const toAccWatch = Form.useWatch("toAccountNumber", transferForm);

  // Query 1: Tìm kiếm thông tin tài khoản NGUỒN (Người gửi)
  const {
    data: fromAccountRes,
    isFetching: isFetchingFromAccount,
    isError: isFromAccountError,
  } = useQuery({
    queryKey: ["teller-transfer-from", fromAccWatch],
    queryFn: () => accountService.getRecipientInfo(fromAccWatch),
    enabled:
      activeTab === "transfer" && !!fromAccWatch && fromAccWatch.length === 10,
    retry: false,
  });
  const fromAccountOwnerName = fromAccountRes?.data?.fullName || "";

  // Query 2: Tìm kiếm thông tin tài khoản ĐÍCH (Người nhận)
  const {
    data: toAccountRes,
    isFetching: isFetchingToAccount,
    isError: isToAccountError,
  } = useQuery({
    queryKey: ["teller-transfer-to", toAccWatch],
    queryFn: () => accountService.getRecipientInfo(toAccWatch),
    enabled:
      activeTab === "transfer" && !!toAccWatch && toAccWatch.length === 10,
    retry: false,
  });
  const toAccountOwnerName = toAccountRes?.data?.fullName || "";

  // ==========================================
  // MUTATIONS: NẠP, RÚT & CHUYỂN TIỀN
  // ==========================================
  const depositMutation = useMutation({
    mutationFn: (data: CashTransactionRequest) => tellerService.deposit(data),
    onSuccess: (res) => {
      message.success(res.message || "Nạp tiền thành công");
      depositForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "Lỗi khi nạp tiền");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: CashTransactionRequest) => tellerService.withdraw(data),
    onSuccess: (res) => {
      message.success(res.message || "Rút tiền thành công");
      withdrawForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "Lỗi khi rút tiền");
    },
  });

  const transferMutation = useMutation({
    mutationFn: (data: TellerTransferRequest) =>
      tellerService.tellerTransfer(data),
    onSuccess: (res) => {
      message.success(
        res.message || "Giao dịch chuyển khoản tại quầy thành công",
      );
      transferForm.resetFields();
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || "Lỗi hệ thống khi chuyển khoản",
      );
    },
  });

  // ==========================================
  // HANDLERS SUBMIT (XÁC NHẬN)
  // ==========================================
  const handleDepositSubmit = (values: any) => {
    if (!cashAccountOwnerName)
      return message.warning("Vui lòng nhập đúng Số tài khoản");
    Modal.confirm({
      title: "Xác nhận NẠP TIỀN",
      icon: <ExclamationCircleOutlined className="text-blue-500" />,
      content: (
        <div className="mt-2">
          <p>Xác nhận nạp tiền mặt cho khách hàng:</p>
          <ul>
            <li>
              Khách hàng:{" "}
              <Text strong className="uppercase text-blue-600">
                {cashAccountOwnerName}
              </Text>
            </li>
            <li>
              Số tài khoản: <Text strong>{values.accountNumber}</Text>
            </li>
            <li>
              Số tiền:{" "}
              <Text type="success" strong className="text-lg">
                {new Intl.NumberFormat("vi-VN").format(values.amount)} VND
              </Text>
            </li>
          </ul>
        </div>
      ),
      okText: "Xác nhận nạp",
      cancelText: "Hủy",
      onOk: () => depositMutation.mutate(values),
    });
  };

  const handleWithdrawSubmit = (values: any) => {
    if (!cashAccountOwnerName)
      return message.warning("Vui lòng nhập đúng Số tài khoản");
    Modal.confirm({
      title: "Xác nhận RÚT TIỀN",
      icon: <ExclamationCircleOutlined className="text-red-500" />,
      content: (
        <div className="mt-2">
          <p>Xác nhận trừ tiền tài khoản để giao tiền mặt:</p>
          <ul>
            <li>
              Khách hàng:{" "}
              <Text strong className="uppercase text-blue-600">
                {cashAccountOwnerName}
              </Text>
            </li>
            <li>
              Số tài khoản: <Text strong>{values.accountNumber}</Text>
            </li>
            <li>
              Số tiền:{" "}
              <Text type="danger" strong className="text-lg">
                {new Intl.NumberFormat("vi-VN").format(values.amount)} VND
              </Text>
            </li>
          </ul>
        </div>
      ),
      okText: "Xác nhận rút",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => withdrawMutation.mutate(values),
    });
  };

  const handleTransferSubmit = (values: any) => {
    if (!fromAccountOwnerName || !toAccountOwnerName) {
      return message.warning(
        "Vui lòng đảm bảo cả hai tài khoản nguồn và đích đều hợp lệ.",
      );
    }
    if (values.fromAccountNumber === values.toAccountNumber) {
      return message.error("Số tài khoản nguồn và đích không được trùng nhau.");
    }

    Modal.confirm({
      title: "Xác nhận CHUYỂN TIỀN TẠI QUẦY",
      icon: <ExclamationCircleOutlined className="text-orange-500" />,
      width: 500,
      content: (
        <div className="mt-3 bg-gray-50 p-4 rounded-md border border-gray-100">
          <div className="mb-2">
            <Text type="secondary" style={{ display: "block" }}>
              TÀI KHOẢN NGUỒN (NGƯỜI GỬI):
            </Text>
            <Text strong className="text-black uppercase">
              {fromAccountOwnerName}
            </Text>
            <div className="text-xs text-gray-500">
              STK: {values.fromAccountNumber}
            </div>
          </div>
          <Divider className="my-2" />
          <div className="mb-2 text-center">
            <Text type="warning" strong className="text-xl">
              ➔ {new Intl.NumberFormat("vi-VN").format(values.amount)} VND ➔
            </Text>
          </div>
          <Divider className="my-2" />
          <div>
            <Text type="secondary" style={{ display: "block" }}>
              TÀI KHOẢN ĐÍCH (NGƯỜI NHẬN):
            </Text>
            <Text strong className="text-blue-600 uppercase">
              {toAccountOwnerName}
            </Text>
            <div className="text-xs text-gray-500">
              STK: {values.toAccountNumber}
            </div>
          </div>
        </div>
      ),
      okText: "Xác nhận chuyển",
      cancelText: "Hủy",
      onOk: () => transferMutation.mutate(values),
    });
  };

  // ==========================================
  // UI RENDER: FORM NẠP / RÚT
  // ==========================================
  const renderCashForm = (type: "deposit" | "withdraw") => {
    const isDeposit = type === "deposit";
    const form = isDeposit ? depositForm : withdrawForm;
    const onFinish = isDeposit ? handleDepositSubmit : handleWithdrawSubmit;
    const isLoading = isDeposit
      ? depositMutation.isPending
      : withdrawMutation.isPending;
    const btnColor = isDeposit
      ? "bg-green-600 hover:bg-green-700"
      : "bg-red-600 hover:bg-red-700";

    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="max-w-xl mt-4"
        initialValues={{ amount: 50000 }}
      >
        <Form.Item
          label={
            <span className="font-semibold text-gray-700">
              Số tài khoản (Account Number)
            </span>
          }
          name="accountNumber"
          rules={[
            { required: true, message: "Bắt buộc nhập số tài khoản" },
            { max: 20, message: "Không vượt quá 20 ký tự" },
          ]}
        >
          <Input
            size="large"
            placeholder="Nhập số tài khoản khách hàng (10 số)..."
            allowClear
            maxLength={20}
          />
        </Form.Item>

        {currentCashAcc?.length === 10 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            {isFetchingCashAccount ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Spin size="small" /> Đang kiểm tra...
              </div>
            ) : isCashAccountError ? (
              <Text type="danger">Không tìm thấy tài khoản hợp lệ.</Text>
            ) : cashAccountOwnerName ? (
              <div>
                <Text className="text-gray-500">Tên khách hàng: </Text>
                <Text strong className="text-blue-600 text-lg uppercase">
                  {cashAccountOwnerName}
                </Text>
              </div>
            ) : null}
          </div>
        )}

        <Form.Item
          label={
            <span className="font-semibold text-gray-700">
              Số tiền giao dịch (VND)
            </span>
          }
          name="amount"
          rules={[
            { required: true, message: "Bắt buộc nhập số tiền" },
            { type: "number", min: 10000, message: "Tối thiểu 10,000 VND" },
          ]}
        >
          <InputNumber
            size="large"
            className="w-full text-lg"
            addonAfter="VND"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item
          label="Nội dung giao dịch (Tùy chọn)"
          name="description"
          rules={[{ max: 255, message: "Tối đa 255 ký tự" }]}
        >
          <TextArea
            rows={3}
            placeholder={
              isDeposit
                ? "Khách hàng nạp tiền mặt tại quầy..."
                : "Khách hàng rút tiền mặt tại quầy..."
            }
          />
        </Form.Item>

        <Divider />
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          block
          loading={isLoading}
          icon={isDeposit ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
          className={btnColor}
        >
          {isDeposit
            ? "THỰC HIỆN NẠP TIỀN (DEPOSIT)"
            : "THỰC HIỆN RÚT TIỀN (WITHDRAW)"}
        </Button>
      </Form>
    );
  };

  // ==========================================
  // [MỚI] UI RENDER: FORM CHUYỂN TIỀN
  // ==========================================
  const renderTransferForm = () => {
    return (
      <Form
        form={transferForm}
        layout="vertical"
        onFinish={handleTransferSubmit}
        className="max-w-xl mt-4"
        initialValues={{ amount: 50000 }}
      >
        {/* 1. TÀI KHOẢN NGUỒN */}
        <Form.Item
          label={
            <span className="font-semibold text-gray-700">
              Số tài khoản NGUỒN (Người gửi)
            </span>
          }
          name="fromAccountNumber"
          rules={[
            { required: true, message: "Bắt buộc nhập số tài khoản nguồn" },
            { max: 20, message: "Tối đa 20 ký tự" },
          ]}
        >
          <Input
            size="large"
            placeholder="Nhập số tài khoản trích tiền..."
            allowClear
            maxLength={20}
          />
        </Form.Item>

        {fromAccWatch?.length === 10 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-100">
            {isFetchingFromAccount ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Spin size="small" /> Đang tra cứu tài khoản nguồn...
              </div>
            ) : isFromAccountError ? (
              <Text type="danger">
                Tài khoản nguồn không hợp lệ hoặc không tồn tại.
              </Text>
            ) : fromAccountOwnerName ? (
              <div>
                <Text className="text-gray-500">Chủ tài khoản nguồn: </Text>
                <Text strong className="text-black uppercase">
                  {fromAccountOwnerName}
                </Text>
              </div>
            ) : null}
          </div>
        )}

        {/* 2. TÀI KHOẢN ĐÍCH */}
        <Form.Item
          label={
            <span className="font-semibold text-gray-700">
              Số tài khoản ĐÍCH (Người nhận)
            </span>
          }
          name="toAccountNumber"
          rules={[
            { required: true, message: "Bắt buộc nhập số tài khoản đích" },
            { max: 20, message: "Tối đa 20 ký tự" },
          ]}
        >
          <Input
            size="large"
            placeholder="Nhập số tài khoản thụ hưởng..."
            allowClear
            maxLength={20}
          />
        </Form.Item>

        {toAccWatch?.length === 10 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-100">
            {isFetchingToAccount ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Spin size="small" /> Đang tra cứu tài khoản đích...
              </div>
            ) : isToAccountError ? (
              <Text type="danger">
                Tài khoản đích không hợp lệ hoặc không tồn tại.
              </Text>
            ) : toAccountOwnerName ? (
              <div>
                <Text className="text-gray-500">Người thụ hưởng: </Text>
                <Text strong className="text-blue-600 uppercase">
                  {toAccountOwnerName}
                </Text>
              </div>
            ) : null}
          </div>
        )}

        {/* 3. SỐ TIỀN VÀ NỘI DUNG */}
        <Form.Item
          label={
            <span className="font-semibold text-gray-700">
              Số tiền trích chuyển (VND)
            </span>
          }
          name="amount"
          rules={[
            { required: true, message: "Bắt buộc nhập số tiền" },
            { type: "number", min: 10000, message: "Tối thiểu 10,000 VND" },
          ]}
        >
          <InputNumber
            size="large"
            className="w-full text-lg"
            addonAfter="VND"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item
          label="Nội dung chuyển tiền"
          name="description"
          rules={[{ max: 255, message: "Tối đa 255 ký tự" }]}
        >
          <TextArea
            rows={3}
            placeholder="Giao dịch viên chuyển tiền hộ tại quầy..."
          />
        </Form.Item>

        <Divider />
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          block
          loading={transferMutation.isPending}
          icon={<SwapOutlined />}
          className="bg-orange-500 hover:bg-orange-600 border-none"
        >
          XÁC THỰC CHUYỂN TIỀN (TELLER TRANSFER)
        </Button>
      </Form>
    );
  };

  // Cấu hình danh sách tab bao gồm cả tab Chuyển tiền mới
  const tabItems = [
    {
      key: "deposit",
      label: (
        <span className="text-base font-medium text-green-600">
          <ArrowDownOutlined /> NẠP TIỀN MẶT
        </span>
      ),
      children: renderCashForm("deposit"),
    },
    {
      key: "withdraw",
      label: (
        <span className="text-base font-medium text-red-600">
          <ArrowUpOutlined /> RÚT TIỀN MẶT
        </span>
      ),
      children: renderCashForm("withdraw"),
    },
    {
      key: "transfer",
      label: (
        <span className="text-base font-medium text-orange-500">
          <SwapOutlined /> CHUYỂN TIỀN TẠI QUẦY
        </span>
      ),
      children: renderTransferForm(),
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Title level={3} className="mb-6">
        Giao dịch tại quầy (Teller)
      </Title>
      <Card className="shadow-sm border-t-4 border-t-blue-500">
        <Tabs
          defaultActiveKey="deposit"
          items={tabItems}
          size="large"
          centered
          onChange={(key) => setActiveTab(key)} // Cập nhật tab active để tối ưu hóa việc chạy query ẩn
        />
      </Card>
    </div>
  );
}
