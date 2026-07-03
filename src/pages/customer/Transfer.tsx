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
} from "antd";
import { accountService } from "../../services/api/account/account.service";
import { z } from "zod";
import {
  transactionService,
  type TransferPayload,
} from "../../services/api/transaction/transaction.service";
import type { Account } from "../../types/account.type";
import type { AxiosError } from "axios";

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
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(createTransferSchema(currentAccount)),
    defaultValues: {
      toAccountNumber: "",
      amount: undefined,
      description: "",
    },
    mode: "onBlur", // Validate khi người dùng click ra ngoài input
  });

  // 3. Mutation xử lý chuyển khoản
  const transferMutation = useMutation({
    mutationFn: (payload: TransferPayload) =>
      transactionService.transfer(payload),
    onSuccess: (res) => {
      // Backend (Interceptor) trả về message
      message.success(res.message || "Chuyển khoản thành công!");
      reset(); // Xóa trắng form
      // Invalidate để tự động fetch lại số dư mới nhất
      queryClient.invalidateQueries({ queryKey: ["account-me"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      message.error(
        error?.response?.data?.message ||
          "Giao dịch thất bại. Vui lòng thử lại.",
      );
    },
  });

  const onSubmit = (data: TransferFormValues) => {
    transferMutation.mutate(data);
  };

  if (isLoadingAccount) {
    return (
      <div className="text-center mt-20">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="shadow-sm">
        <Title level={3} className="mb-6">
          Chuyển khoản nội bộ
        </Title>

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
            loading={transferMutation.isPending} // isPending thay cho isLoading ở v5
          >
            Xác nhận chuyển khoản
          </Button>
        </Form>
      </Card>
    </div>
  );
}
