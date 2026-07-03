import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  resetUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  // Tăng 1 khi có socket bắn về
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  // Giảm 1 khi click vào 1 thông báo, giữ mức thấp nhất là 0
  decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  // Về 0 khi "Đánh dấu đọc tất cả"
  resetUnread: () => set({ unreadCount: 0 }),
}));