import type { PaginatedData } from "../../../types/paginatedData";
import type { Transaction } from "../../../types/transaction.type";
import type { ApiResponse } from "../auth/auth.service";
import { axiosClient } from "../axiosClient";
import { v4 as uuidv4 } from "uuid";

export interface TransferPayload {
  toAccountNumber: string;
  amount: number;
  description: string;
}

export interface TransactionFilters {
  status?: string;
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string; // Format: YYYY-MM-DD
  flow?: "in" | "out"; // in: Tiền vào, out: Tiền ra
}

export const transactionService = {
  transfer: async (payload: TransferPayload): Promise<ApiResponse> => {
    const idempotencyKey = uuidv4();
    return axiosClient.post("/transactions/transfer", payload, {
      headers: {
        "idempotency-key": idempotencyKey,
      },
    });
  },
  getHistory: async (
    page: number = 1,
    limit: number = 10,
    filters?: TransactionFilters,
  ): Promise<ApiResponse<PaginatedData<Transaction>>> => {
    return axiosClient.get("/transactions", {
      params: { page, limit, ...filters },
    });
  },
};
