// src/services/admin.service.ts

import type { PaginatedData } from "../../../../types/paginatedData";
import type { ApiResponse } from "../../auth/auth.service";
import { axiosClient } from "../../axiosClient";

export interface AdminTransactionFilters {
  search?: string; // Tìm theo Mã GD, Tên người gửi/nhận, Số tài khoản
  status?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

// Kiểu dữ liệu Transaction mở rộng chứa thông tin Account & User
export interface AdminTransaction {
  id: string;
  amount: number;
  type: string;
  status: "success" | "failed" | "pending";
  description: string;
  createdAt: string;
  fromAccount?: {
    id: string;
    accountNumber: string;
    user?: {
      id: string;
      full_name: string;
      email: string;
    };
  };
  toAccount?: {
    id: string;
    accountNumber: string;
    user?: {
      id: string;
      full_name: string;
      email: string;
    };
  };
}

export interface PaginatedAdminTransactions {
  items: AdminTransaction[];
  total: number;
  page: number;
  limit: number;
}

export const adminService = {
  // ... (giữ lại các hàm getUsers, updateUserStatus cũ)

  /**
   * Lấy toàn bộ giao dịch hệ thống cho Admin
   */
  getAllTransactions: async (
    page: number = 1,
    limit: number = 10,
    filters?: AdminTransactionFilters,
  ): Promise<ApiResponse<PaginatedData<AdminTransaction>>> => {
    return axiosClient.get("/admin/transactions", {
      params: { page, limit, ...filters },
    });
  },
};
