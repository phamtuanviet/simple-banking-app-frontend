// src/services/api/admin/ledger/admin.ledger.service.ts

import type { ApiResponse } from "../../auth/auth.service";
import { axiosClient } from "../../axiosClient";

// Enum loại bút toán (Khớp với backend)
export const LedgerEntryType = {
  DEBIT: "debit",
  CREDIT: "credit",
} as const;

export type LedgerEntryType =
  (typeof LedgerEntryType)[keyof typeof LedgerEntryType];

// Interface của DTO Filter gửi lên
export interface FilterLedgerDto {
  accountNumber?: string;
  type?: LedgerEntryType | string;
  transactionId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

// Giả định cấu trúc dữ liệu trả về của 1 dòng sổ cái (Bạn có thể sửa lại cho khớp Entity của bạn)
export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  // Cập nhật lồng object account
  account: {
    id: string;
    accountNumber: string;
  };
  // Cập nhật lồng object transaction
  transaction: {
    id: string;
    type: string;
    status: string;
    description: string;
  };
}

export interface PaginatedLedger {
  total: number;
  page: number;
  limit: number;
  items: LedgerEntry[];
}

export const adminLedgerService = {
  /**
   * Lấy danh sách biến động sổ cái (Chỉ Admin)
   * Nhớ thay đổi đường dẫn '/ledger' cho khớp với Controller của bạn
   */
  getLedgerEntries: async (
    filters: FilterLedgerDto,
  ): Promise<ApiResponse<PaginatedLedger>> => {
    return axiosClient.get("/admin/ledgers", { params: filters });
  },
};
