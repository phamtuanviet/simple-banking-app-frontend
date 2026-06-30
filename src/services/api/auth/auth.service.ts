import type { User } from "../../../types/user.type";
import { axiosClient } from "../axiosClient";

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

// Định nghĩa kiểu dữ liệu gửi lên (Payload)
export interface LoginPayload {
  email: string;
  password: string;
}

// Định nghĩa kiểu dữ liệu nhận về (Response)

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export const authService = {
  /**
   * Gọi API đăng nhập hệ thống
   * @param payload Chứa email và password
   * @returns LoginResponse gồm Token và thông tin User
   */
  login: async (
    payload: LoginPayload,
  ): Promise<ApiResponse<{ accessToken: string; user: User }>> => {
    // Vì axiosClient đã bóc tách response.data ở interceptor,
    // chúng ta chỉ cần return thẳng hàm post là nó sẽ trả về đúng LoginResponse
    return axiosClient.post("/auth/login", payload);
  },

  /**
   * Hàm ví dụ cho API đăng ký (Bạn có thể tự implement sau)
   */
  register: async (payload: any): Promise<ApiResponse<string>> => {
    return axiosClient.post("/auth/register", payload);
  },

  forgotPassword: async (payload: ForgotPasswordPayload): Promise<ApiResponse<any>> => {
    return axiosClient.post('/auth/forgot-password', payload);
  },

  resendVerification: async (payload: { email: string }): Promise<ApiResponse<any>> => {
    return axiosClient.post('/auth/resend-verification', payload);
  },

  verifyEmail: async (payload: { token: string }): Promise<ApiResponse<any>> => {
    return axiosClient.get('/auth/verify-email', { 
      params: { 
        token: payload.token 
      } 
    });
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<ApiResponse<any>> => {
    return axiosClient.post('/auth/reset-password', payload);
  },

  logout: async (): Promise<ApiResponse<any>> => {
    return axiosClient.post('/auth/logout');
  },
  // Các hàm khác như changePassword, forgotPassword sẽ nằm hết ở đây
};
