import type { Account } from "../../../types/account.type";
import type { ApiResponse } from "../auth/auth.service";
import { axiosClient } from "../axiosClient";

export const accountService = {
  getMe: async (): Promise<ApiResponse<Account>> => {
    return axiosClient.get("/accounts/me");
  },
};
