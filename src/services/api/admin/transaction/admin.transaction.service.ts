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

export const TransactionType = {
  TRANSFER: "transfer",
  DEPOSIT: "deposit",
  WITHDRAWAL: "withdrawal",
  REVERSAL: "reversal",
} as const;

export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionStatus = {
  PENDING: "pending",
  PENDING_OTP: "pending_otp",
  PENDING_APPROVAL: "pending_approval",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REVERSED: "reversed",
} as const;

export type TransactionStatus =
  (typeof TransactionStatus)[keyof typeof TransactionStatus];
// Hành động duyệt giao dịch
export const ApprovalAction = {
  APPROVE: "approved",
  REJECT: "rejected",
} as const;

export type ApprovalAction =
  (typeof ApprovalAction)[keyof typeof ApprovalAction];

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

export interface ReversalRequest {
  originalTransactionId: string;
  reason: string;
}

export interface PaginatedAdminTransactions {
  items: AdminTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface ApproveTransferRequest {
  transactionId: string;
  action: ApprovalAction;
  remarks?: string;
}

// ĐÂY LÀ PHẦN LÕI BÊN TRONG CỦA 'data'
export interface ApproveTransferData {
  transactionId: string;
  status: TransactionStatus;
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

  approveTransfer: async (
    data: ApproveTransferRequest,
  ): Promise<ApiResponse<ApproveTransferData>> => {
    const body = {
      action: data.action,
      remarks: data.remarks,
    };
    return axiosClient.post(
      `/admin/transactions/approve/${data.transactionId}`,
      body,
    );
  },

  reverseTransaction: async (
    data: ReversalRequest,
  ): Promise<ApiResponse<any>> => {
    return axiosClient.post("/admin/transactions/reverse", data);
  },
};
