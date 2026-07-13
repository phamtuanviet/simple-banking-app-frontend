import type { ApiResponse } from "../../auth/auth.service";
import { axiosClient } from "../../axiosClient";

export interface FilterUserHistoryDto {
  userId?: string;
  email?: string;
  changedById?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface UserHistoryItem {
  id: string;
  changedById: string | null;
  previousData: any; // Backend của bạn dùng previousData
  reason: string; // Backend của bạn dùng reason
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    status: string;
  };
  changedBy?: { email: string; fullName: string }; // Tuỳ chọn nếu có join
}

export interface PaginatedUserHistory {
  total: number;
  page: number;
  limit: number;
  items: UserHistoryItem[];
}

export const adminUserHistoryService = {
  getUserHistories: async (
    filters: FilterUserHistoryDto,
  ): Promise<ApiResponse<PaginatedUserHistory>> => {
    return axiosClient.get("/admin/user-history", { params: filters });
  },
};
