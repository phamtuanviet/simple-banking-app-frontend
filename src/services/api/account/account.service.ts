import type { Account } from "../../../types/account.type";
import type { ApiResponse } from "../auth/auth.service";
import { axiosClient } from "../axiosClient";

export interface RecipientInfo {
  accountNumber: string;
  fullName: string;
}

export const accountService = {
  getMe: async (): Promise<ApiResponse<Account>> => {
    return axiosClient.get("/accounts/me");
  },

  getRecipientInfo: async (
    accountNumber: string,
  ): Promise<ApiResponse<RecipientInfo>> => {
    return axiosClient.get(`/accounts/info/${accountNumber}`);
  },
};
