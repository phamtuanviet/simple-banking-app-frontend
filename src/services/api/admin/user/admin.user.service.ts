// src/services/admin.service.ts
import type { PaginatedData } from "../../../../types/paginatedData";
import type { ApiResponse } from "../../auth/auth.service";
import { axiosClient } from "../../axiosClient";

import type { UserRole, UserStatus } from "../../../types/user.type";

export interface UserItem {
  id: string;
  fullName: string;
  email: string;

  // 1. Dùng chung kiểu dữ liệu để đồng bộ, hoặc tự định nghĩa lại nhưng phải có thêm "teller"
  role: UserRole | "admin" | "customer" | "teller";

  // 2. Trạng thái đã đủ 3 cái
  status: UserStatus | "active" | "locked" | "banned";

  isEmailVerified: boolean;

  // 3. Đổi snake_case thành camelCase (TypeORM ở Backend tự động map created_at thành createdAt)
  createdAt: string;

  // 4. [QUAN TRỌNG] Phải có trường này để giao diện đọc được thời hạn khóa
  lockoutUntil?: string | null;

  // 5. (Tùy chọn) Thêm avatar nếu sau này bạn muốn hiển thị ảnh nhỏ bé ở bảng
  avatarUrl?: string | null;
}

export interface UserFilters {
  id: string;
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
    status: "active" | "locked" | "banned",
  ): Promise<ApiResponse> => {
    return axiosClient.patch(`/admin/users/${id}/status`, { status });
  },

  getDashboardStats: async (): Promise<ApiResponse<SystemStats>> => {
    return axiosClient.get("/admin/stats");
  },
};
