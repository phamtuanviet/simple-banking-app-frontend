// src/pages/Customer/Profile/components/SecurityTab.tsx
import React, { useState } from "react";
import { Form, Input, Button, message, Divider, Modal, Typography } from "antd";
import { useMutation } from "@tanstack/react-query";

import { useNavigate } from "react-router-dom";
import { userService } from "../services/api/user/user.service";
import { useAuthStore } from "../store/auth.store";

const { Text } = Typography;

export default function SecurityTab() {
  const [passwordForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  // State cho Modal OTP Đổi Email
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  // ==========================================
  // 1. MUTATIONS ĐỔI MẬT KHẨU
  // ==========================================
  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => userService.changePassword(data),
    onSuccess: () => {
      message.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại!");
      passwordForm.resetFields();
      // Bị đá văng khỏi thiết bị hiện tại
      logout();
      navigate("/login");
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "Đổi mật khẩu thất bại");
    },
  });

  // ==========================================
  // 2. MUTATIONS ĐỔI EMAIL
  // ==========================================
  const initiateEmailMutation = useMutation({
    mutationFn: (data: any) => userService.initiateChangeEmail(data),
    onSuccess: (res) => {
      message.success(res.data?.message || "OTP đã được gửi đến email mới");
      setIsOtpModalOpen(true);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "Yêu cầu thất bại");
    },
  });

  const confirmEmailMutation = useMutation({
    mutationFn: () => userService.confirmChangeEmail({ otpCode: otpValue }),
    onSuccess: () => {
      message.success("Cập nhật Email thành công!");
      setIsOtpModalOpen(false);
      setOtpValue("");
      emailForm.resetFields();
      // TODO: Gọi queryClient.invalidateQueries(["account-me"]) để lấy email mới
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "OTP không hợp lệ");
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: () => userService.resendChangeEmailOtp(),
    onSuccess: (res) => {
      message.success(res.data?.message || "Đã gửi lại OTP");
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || "Không thể gửi lại OTP lúc này",
      );
    },
  });

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-4">Đổi mật khẩu</h3>
      <Form
        form={passwordForm}
        layout="vertical"
        onFinish={(values) => changePasswordMutation.mutate(values)}
        className="max-w-md"
      >
        <Form.Item
          label="Mật khẩu hiện tại"
          name="oldPassword"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
          ]}
        >
          <Input.Password placeholder="Nhập mật khẩu hiện tại" size="large" />
        </Form.Item>

        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới" },
            { min: 6, message: "Mật khẩu phải có ít nhất 8 ký tự" },
          ]}
        >
          <Input.Password placeholder="Nhập mật khẩu mới" size="large" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={changePasswordMutation.isPending}
        >
          Lưu mật khẩu mới
        </Button>
      </Form>

      <Divider />

      <h3 className="text-lg font-semibold mb-4 text-red-600">
        Thay đổi địa chỉ Email
      </h3>
      <p className="text-gray-500 mb-6 max-w-lg">
        Đây là thao tác nhạy cảm. Mã xác thực OTP sẽ được gửi đến địa chỉ Email
        MỚI để xác nhận quyền sở hữu của bạn.
      </p>

      <Form
        form={emailForm}
        layout="vertical"
        onFinish={(values) => initiateEmailMutation.mutate(values)}
        className="max-w-md"
      >
        <Form.Item
          label="Mật khẩu xác thực"
          name="currentPassword"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu để tiếp tục" },
          ]}
        >
          <Input.Password
            placeholder="Xác nhận mật khẩu của bạn"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Địa chỉ Email mới"
          name="newEmail"
          rules={[
            { required: true, message: "Vui lòng nhập email mới" },
            { type: "email", message: "Email không đúng định dạng" },
          ]}
        >
          <Input placeholder="ví dụ: user@gmail.com" size="large" />
        </Form.Item>

        <Button
          danger
          type="primary"
          htmlType="submit"
          loading={initiateEmailMutation.isPending}
        >
          Yêu cầu đổi Email
        </Button>
      </Form>

      {/* MODAL OTP BẢO VỆ CHỐNG TẮT NHẦM */}
      <Modal
        title="Xác thực địa chỉ Email mới"
        open={isOtpModalOpen}
        maskClosable={false}
        keyboard={false}
        onCancel={() => {
          setIsOtpModalOpen(false);
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
            loading={confirmEmailMutation.isPending}
            onClick={() => confirmEmailMutation.mutate()}
            disabled={otpValue.length < 6}
          >
            Xác nhận Email
          </Button>,
        ]}
      >
        <div className="py-4 text-center">
          <Text>
            Mã OTP 6 số đã được gửi đến{" "}
            <strong className="text-blue-600">
              {emailForm.getFieldValue("newEmail")}
            </strong>
            . Mã sẽ hết hạn sau 5 phút.
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
