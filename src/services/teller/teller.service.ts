import type { ApiResponse } from "../api/auth/auth.service";
import { axiosClient } from "../api/axiosClient";

export interface CashTransactionRequest {
  accountNumber: string; // Trong thực tế có thể là số tài khoản (accountNumber), Backend của bạn đang dùng accountId (UUID)
  amount: number;
  description?: string;
}

export interface TellerTransferRequest {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  description?: string;
}

export const tellerService = {
  /**
   * Nạp tiền mặt vào tài khoản khách hàng
   */
  deposit: async (data: CashTransactionRequest): Promise<ApiResponse<any>> => {
    return axiosClient.post("/transactions/deposit", data);
  },

  /**
   * Khách hàng rút tiền mặt tại quầy
   */
  withdraw: async (data: CashTransactionRequest): Promise<ApiResponse<any>> => {
    return axiosClient.post("/transactions/withdraw", data);
  },

  tellerTransfer: async (
    data: TellerTransferRequest,
  ): Promise<ApiResponse<any>> => {
    return axiosClient.post("/admin/teller-transfer", data);
  },
};
