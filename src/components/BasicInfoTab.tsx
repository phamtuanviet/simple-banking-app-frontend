// src/pages/Customer/Profile/components/BasicInfoTab.tsx
import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Upload,
  Avatar,
  Spin,
  DatePicker,
} from "antd";
import {
  UserOutlined,
  UploadOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UploadProps } from "antd";
import dayjs from "dayjs";
import { useAuthStore } from "../store/auth.store";
import { userService } from "../services/api/user/user.service";

export default function BasicInfoTab() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Lấy thông tin user hiện tại từ Zustand (hoặc bạn có thể dùng useQuery fetch lại)
  const { user, setUser } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);

  // Khởi tạo giá trị mặc định cho Form
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        // Ép kiểu chuỗi ngày sinh từ DB thành object Dayjs cho Antd DatePicker
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : undefined,
      });
    }
  }, [user, form]);

  // ==========================================
  // 1. MUTATION: CẬP NHẬT THÔNG TIN CƠ BẢN
  // ==========================================
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userService.updateProfile(data),
    onSuccess: () => {
      message.success("Cập nhật thông tin cá nhân thành công!");
      // Yêu cầu React Query fetch lại data mới nhất để đồng bộ toàn app
      queryClient.invalidateQueries({ queryKey: ["account-me"] });
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || "Lỗi khi cập nhật thông tin",
      );
    },
  });

  const onFinish = (values: any) => {
    // Chuyển đổi Dayjs object về lại chuỗi YYYY-MM-DD để gửi xuống Backend
    const formattedData = {
      ...values,
      dateOfBirth: values.dateOfBirth
        ? values.dateOfBirth.format("YYYY-MM-DD")
        : null,
    };
    updateProfileMutation.mutate(formattedData);
  };

  // ==========================================
  // 2. LOGIC: UPLOAD AVATAR TRỰC TIẾP
  // ==========================================
  const customUploadRequest: UploadProps["customRequest"] = async ({
    file,
    onSuccess,
    onError,
  }) => {
    const formData = new FormData();
    formData.append("file", file as Blob);

    setIsUploading(true);
    try {
      const res = await userService.uploadAvatar(formData);
      console.log(
        "🚀 ~ file: BasicInfoTab.tsx:45 ~ customUploadRequest ~ res:",
        res,
      );

      message.success("Cập nhật ảnh đại diện thành công!");

      // Cập nhật lại URL ảnh mới vào store để Header nhận diện được ngay lập tức
      if (setUser && user) {
        setUser({ ...user, avatarUrl: res.data });
      }

      onSuccess?.(res.data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể tải ảnh lên");
      onError?.(error);
    } finally {
      setIsUploading(false);
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Bạn chỉ có thể tải lên file hình ảnh!");
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Dung lượng ảnh phải nhỏ hơn 5MB!");
    }
    // Trả về true nếu pass kiểm tra để Upload component gọi customRequest
    return isImage && isLt5M;
  };

  return (
    <div className="py-4 flex flex-col md:flex-row gap-10">
      {/* CỘT TRÁI: AVATAR */}
      <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
        <div className="relative">
          <Avatar
            size={120}
            src={user?.avatarUrl}
            icon={!user?.avatarUrl && <UserOutlined />}
            className="border border-gray-200 shadow-sm"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center">
              <Spin
                indicator={
                  <LoadingOutlined
                    style={{ fontSize: 24, color: "white" }}
                    spin
                  />
                }
              />
            </div>
          )}
        </div>

        <Upload
          customRequest={customUploadRequest}
          beforeUpload={beforeUpload}
          showUploadList={false}
          accept="image/*"
        >
          <Button icon={<UploadOutlined />} loading={isUploading}>
            Thay đổi Avatar
          </Button>
        </Upload>
        <p className="text-xs text-gray-400 text-center mt-2">
          Định dạng: JPEG, PNG, JPG.
          <br />
          Dung lượng tối đa: 5MB.
        </p>
      </div>

      {/* CỘT PHẢI: FORM THÔNG TIN */}
      <div className="w-full md:w-2/3">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="max-w-md"
        >
          <Form.Item
            label="Họ và Tên"
            name="fullName"
            rules={[
              { required: true, message: "Vui lòng nhập họ và tên" },
              { max: 100, message: "Tên không được vượt quá 100 ký tự" },
            ]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phoneNumber"
            rules={[
              {
                pattern: /^[0-9]{10,11}$/,
                message: "Số điện thoại không hợp lệ",
              },
            ]}
          >
            <Input size="large" placeholder="Ví dụ: 0912345678" />
          </Form.Item>

          <Form.Item label="Ngày sinh" name="dateOfBirth">
            <DatePicker
              size="large"
              className="w-full"
              format="DD/MM/YYYY"
              placeholder="Chọn ngày sinh"
            />
          </Form.Item>

          <Form.Item
            label="Địa chỉ"
            name="address"
            rules={[{ max: 255, message: "Địa chỉ quá dài" }]}
          >
            <Input.TextArea
              size="large"
              rows={3}
              placeholder="Nhập địa chỉ của bạn"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={updateProfileMutation.isPending}
          >
            Lưu thông tin
          </Button>
        </Form>
      </div>
    </div>
  );
}
