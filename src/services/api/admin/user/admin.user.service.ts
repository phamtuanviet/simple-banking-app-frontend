// src/services/admin.service.ts
import type { PaginatedData } from "../../../../types/paginatedData";
import type { ApiResponse } from "../../auth/auth.service";
import { axiosClient } from "../../axiosClient";

export interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "customer";
  status: "active" | "locked";
  isEmailVerified: boolean;
  created_at: string;
}

export interface UserFilters {
  search?: string;
  status?: string;
  role?: string;
  isEmailVerified?: string; // API backend nhận chuỗi 'true' | 'false'
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  totalTransactions: number;
  successfulTransactions: number;
}

export const adminService = {
  /**
   * Lấy danh sách người dùng kèm bộ lọc
   */
  getUsers: async (
    page: number = 1,
    limit: number = 10,
    filters?: UserFilters,
  ): Promise<ApiResponse<PaginatedData<UserItem>>> => {
    return axiosClient.get("/admin/users", {
      params: { page, limit, ...filters },
    });
  },

  /**
   * Cập nhật trạng thái người dùng (Khóa/Mở)
   */
  updateUserStatus: async (
    id: string,
    status: "active" | "locked",
  ): Promise<ApiResponse> => {
    return axiosClient.patch(`/admin/users/${id}/status`, { status });
  },
  
  getDashboardStats: async (): Promise<ApiResponse<SystemStats>> => {
    return axiosClient.get('/admin/stats');
  },
};
