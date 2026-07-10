import { v4 as uuidv4 } from 'uuid';
import type { PaginatedData } from "../../../types/paginatedData";
import type { Transaction } from "../../../types/transaction.type";
import type { ApiResponse } from "../auth/auth.service";
import { axiosClient } from "../axiosClient";

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

export interface TransferInitiateResponse {
  transactionId: string;
  status: "completed" | "pending_otp" | "pending_approval";
  message?: string;
}

export const transactionService = {
  initiateTransfer: async (
    payload: TransferPayload,
  ): Promise<ApiResponse<TransferInitiateResponse>> => {
    const idempotencyKey = uuidv4();
    return axiosClient.post("/transactions/transfer/initiate", payload, {
      headers: {
        "idempotency-key": idempotencyKey,
      },
    });
  },

  confirmOtp: async (
    transactionId: string,
    otpCode: string,
  ): Promise<ApiResponse> => {
    return axiosClient.post("/transactions/transfer/confirm-otp", {
      transactionId,
      otpCode,
    });
  },

  resendOtp: async (transactionId: string): Promise<ApiResponse> => {
    return axiosClient.post("/transactions/transfer/resend-otp", {
      transactionId,
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
