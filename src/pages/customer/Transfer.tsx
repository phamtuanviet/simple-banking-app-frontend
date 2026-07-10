import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Typography,
  message,
  Alert,
  Spin,
  Modal,
} from "antd";
import { accountService } from "../../services/api/account/account.service";
import { z } from "zod";
import {
  transactionService,
  type TransferPayload,
} from "../../services/api/transaction/transaction.service";
import type { Account } from "../../types/account.type";
import type { AxiosError } from "axios";
import { useState } from "react";

const createTransferSchema = (currentAccount?: Account) => {
  return z.object({
    toAccountNumber: z
      .string()
      .min(1, "Vui lòng nhập số tài khoản đích")
      .refine((val) => val !== currentAccount?.accountNumber, {
        message: "Không thể chuyển tiền vào chính tài khoản nguồn",
      }),
    amount: z
      .number({
        error: "Vui lòng nhập số tiền hợp lệ",
      })
      .positive("Số tiền phải lớn hơn 0")
      .max(
        currentAccount?.balance || 0,
        "Số dư không đủ để thực hiện giao dịch",
      )
      .refine((val) => {
        // Kiểm tra tối đa 2 chữ số thập phân
        const strVal = val.toString();
        if (strVal.includes(".")) {
          return strVal.split(".")[1].length <= 2;
        }
        return true;
      }, "Số tiền chỉ được chứa tối đa 2 chữ số thập phân"),
    description: z.string().min(1, "Vui lòng nhập nội dung chuyển khoản"),
  });
};

type TransferFormValues = z.infer<ReturnType<typeof createTransferSchema>>;

const { Title, Text } = Typography;

export default function Transfer() {
  const queryClient = useQueryClient();

  // 1. Fetch thông tin tài khoản để lấy số dư và số tài khoản nguồn

  const [isOtpModalVisible, setIsOtpModalVisible] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<
    string | null
  >(null);
  const [otpValue, setOtpValue] = useState("");

  const { data: accountRes, isLoading: isLoadingAccount } = useQuery({
    queryKey: ["account-me"],
    queryFn: () => accountService.getMe(),
  });

  const currentAccount = accountRes?.data;

  // 2. Khởi tạo Form với dynamic schema
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(createTransferSchema(currentAccount)),
    defaultValues: {
      toAccountNumber: "",
      amount: null as unknown as number, // Ép kiểu null để form hiểu trạng thái rỗng
      description: "",
    },
    mode: "onBlur",
  });

  const toAccountNumber = watch("toAccountNumber");

  const {
    data: recipientRes,
    isFetching: isFetchingRecipient,
    isError: isRecipientError,
  } = useQuery({
    queryKey: ["recipient-info", toAccountNumber],
    queryFn: () => accountService.getRecipientInfo(toAccountNumber),
    // CHỈ GỌI API KHI: có nhập liệu VÀ đúng 10 ký tự
    enabled: !!toAccountNumber && toAccountNumber.length === 10,
    retry: false, // Tắt retry để tránh gọi lại API liên tục nếu STK sai/không tồn tại
  });

  const recipientName = recipientRes?.data?.fullName;

  // 3. Mutation xử lý chuyển khoản
  const initiateMutation = useMutation({
    mutationFn: (payload: { data: TransferPayload }) =>
      transactionService.initiateTransfer(payload.data),
    onSuccess: (res) => {
      const data = res.data;
      console.log("Hello" + res);

      // Xử lý luồng dựa trên status backend trả về
      if (data.status === "completed") {
        message.success(
          res.message || "Giao dịch đã được ghi nhận, đang xử lý!",
        );
        resetFormAndRefresh();
      } else if (data.status === "pending_otp") {
        setCurrentTransactionId(data.transactionId);
        setIsOtpModalVisible(true);
        message.info("Vui lòng kiểm tra email để lấy mã OTP.");
      } else if (data.status === "pending_approval") {
        message.warning("Giao dịch lớn cần được Quản trị viên phê duyệt.");
        resetFormAndRefresh();
      }
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.log(error);
      message.error(error?.response?.data?.message || "Giao dịch thất bại.");
    },
  });

  // 2. Mutation Xác nhận OTP
  const confirmOtpMutation = useMutation({
    mutationFn: () =>
      transactionService.confirmOtp(currentTransactionId!, otpValue),
    onSuccess: (res) => {
      message.success(
        res.message || "Xác thực OTP và chuyển khoản thành công!",
      );
      setIsOtpModalVisible(false);
      setOtpValue("");
      resetFormAndRefresh();
    },
    onError: (error: AxiosError<{ message: string }>) => {
      message.error(
        error?.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn.",
      );
    },
  });

  // 3. Mutation Gửi lại OTP
  const resendOtpMutation = useMutation({
    mutationFn: () => transactionService.resendOtp(currentTransactionId!),
    onSuccess: (res) => {
      message.success("Đã gửi lại mã OTP vào email của bạn.");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      message.error(
        error?.response?.data?.message || "Không thể gửi lại OTP lúc này.",
      );
    },
  });

  const resetFormAndRefresh = () => {
    reset({
      toAccountNumber: "",
      amount: null as unknown as number,
      description: "",
    });
    setCurrentTransactionId(null);
    queryClient.invalidateQueries({ queryKey: ["account-me"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  const onSubmit = (data: TransferFormValues) => {
    // Sinh UUID duy nhất cho mỗi lần bấm nút chuyển tiền

    initiateMutation.mutate({ data });
  };

  if (isLoadingAccount)
    return (
      <div className="text-center mt-20">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="shadow-sm">
        <Title level={3} className="mb-6">
          Chuyển khoản nội bộ
        </Title>

        {/* 1. LUÔN HIỂN THỊ THÔNG TIN TÀI KHOẢN NGUỒN */}
        <Alert
          message="Thông tin tài khoản nguồn"
          description={
            <div>
              <Text strong>Số tài khoản: </Text>{" "}
              <Text>{currentAccount?.accountNumber}</Text>
              <br />
              <Text strong>Số dư khả dụng: </Text>
              <Text type="success" strong>
                {new Intl.NumberFormat("vi-VN").format(
                  currentAccount?.balance || 0,
                )}{" "}
                {currentAccount?.currency}
              </Text>
            </div>
          }
          type="info"
          showIcon
          className="mb-6"
        />

        {/* 2. LỚP BẢO VỆ UX: HIỂN THỊ CẢNH BÁO NẾU CÓ GIAO DỊCH ĐANG CHỜ OTP */}
        {currentTransactionId && !isOtpModalVisible && (
          <Alert
            message="Giao dịch đang chờ xác thực OTP"
            description="Bạn có một giao dịch đang chờ nhập mã OTP. Hệ thống sẽ tự hủy sau 5 phút nếu không xác thực."
            type="warning"
            showIcon
            className="mb-6"
            action={
              <div className="flex flex-col gap-2">
                <Button 
                  size="small" 
                  type="primary" 
                  onClick={() => setIsOtpModalVisible(true)}
                >
                  Tiếp tục nhập OTP
                </Button>
                <Button 
                  size="small" 
                  danger 
                  onClick={() => {
                    // Xóa ID giao dịch hiện tại để user có thể tạo giao dịch mới
                    setCurrentTransactionId(null);
                    setOtpValue("");
                    resetFormAndRefresh();
                  }}
                >
                  Hủy & Tạo giao dịch mới
                </Button>
              </div>
            }
          />
        )}

        {/* 3. CHỈ HIỂN THỊ FORM KHI KHÔNG CÓ GIAO DỊCH NÀO ĐANG CHỜ OTP */}
        {!currentTransactionId && (
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label="Số tài khoản đích"
              validateStatus={errors.toAccountNumber ? "error" : ""}
              help={errors.toAccountNumber?.message}
              required
            >
              <Controller
                name="toAccountNumber"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Nhập số tài khoản người nhận"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            {toAccountNumber?.length === 10 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-100">
                {isFetchingRecipient ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Spin size="small" /> Đang kiểm tra thông tin...
                  </div>
                ) : isRecipientError ? (
                  <Text type="danger">
                    Không tìm thấy tài khoản người nhận hợp lệ.
                  </Text>
                ) : recipientName ? (
                  <div>
                    <Text className="text-gray-500">Người nhận: </Text>
                    <Text strong className="text-blue-600 text-lg uppercase">
                      {recipientName}
                    </Text>
                  </div>
                ) : null}
              </div>
            )}

            <Form.Item
              label="Số tiền chuyển"
              validateStatus={errors.amount ? "error" : ""}
              help={errors.amount?.message}
              required
            >
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    className="w-full"
                    placeholder="0.00"
                    size="large"
                    min={0}
                    step={1000}
                    onKeyPress={(event) => {
                      if (!/[0-9]/.test(event.key)) {
                        event.preventDefault();
                      }
                    }}
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      parseFloat(value!.replace(/\$\s?|(,*)/g, "")) || 0
                    }
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Nội dung chuyển khoản"
              validateStatus={errors.description ? "error" : ""}
              help={errors.description?.message}
              required
            >
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Input.TextArea
                    {...field}
                    rows={3}
                    placeholder="Nhập nội dung..."
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={initiateMutation.isPending}
            >
              Xác nhận chuyển khoản
            </Button>
          </Form>
        )}
      </Card>

      {/* 4. MODAL OTP - ĐÃ THÊM MASKCLOSABLE VÀ KEYBOARD ĐỂ CHỐNG TẮT NHẦM */}
      <Modal
        title="Xác thực OTP"
        open={isOtpModalVisible}
        maskClosable={false} // Ngăn click ra ngoài vùng tối để đóng
        keyboard={false}     // Ngăn nhấn phím ESC để đóng
        onCancel={() => {
          // Bấm nút X thì chỉ ẩn Modal, KHÔNG xóa currentTransactionId
          setIsOtpModalVisible(false);
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
              onChange={(val) => setOtpValue(val)}
              size="large"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
