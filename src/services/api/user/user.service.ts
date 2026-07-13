import { axiosClient } from "../axiosClient";

export const userService = {
  updateProfile: (data: any) => axiosClient.patch("/user/profile", data),

  uploadAvatar: (formData: FormData) =>
    axiosClient.post("/user/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  changePassword: (data: any) =>
    axiosClient.post("/user/change-password", data),

  initiateChangeEmail: (data: any) =>
    axiosClient.post("/user/change-email/initiate", data),

  resendChangeEmailOtp: () => axiosClient.post("/user/change-email/resend-otp"),

  confirmChangeEmail: (data: { otpCode: string }) =>
    axiosClient.post("/user/change-email/confirm", data),
};
