// src/services/notification.service.ts

import type { ApiResponse } from "../auth/auth.service";
import { axiosClient } from "../axiosClient";


export interface NotificationItem {
  id: string;
  type: 'transfer_in' | 'transfer_out' | 'deposit' | 'withdrawal' | 'system';
  title: string;
  message: string;
  amount?: number;
  balanceAfterTransaction?: number;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number; // Backend trả về số lượng chưa đọc ở đây
}

export const notificationService = {
  getNotifications: async (page = 1, limit = 10): Promise<ApiResponse<PaginatedNotifications>> => {
    return axiosClient.get('/notifications', { params: { page, limit } });
  },

  markAsRead: async (id: string): Promise<ApiResponse> => {
    return axiosClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<ApiResponse> => {
    return axiosClient.patch('/notifications/read-all');
  },
};