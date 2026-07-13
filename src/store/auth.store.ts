import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/user.type";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  // Các action
  setUser: (user: User) => void;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      // Hàm gọi khi Login hoặc Refresh Token thành công
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setUser: (user) => set({ user }),

      // Hàm gọi khi User chủ động đăng xuất hoặc Refresh Token hết hạn
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "auth-storage", // Tên key lưu dưới Local Storage
      // Mặc định Zustand persist sẽ lưu vào localStorage.
      // Nếu bạn muốn lưu vào sessionStorage, cấu hình thêm: getStorage: () => sessionStorage
    },
  ),
);
