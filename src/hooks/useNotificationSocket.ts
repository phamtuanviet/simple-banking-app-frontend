// src/hooks/useNotificationSocket.ts
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { notification } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth.store";
import { useNotificationStore } from "../store/notification.store";

export const useNotificationSocket = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const incrementUnread = useNotificationStore(
    (state) => state.incrementUnread,
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    const socket: Socket = io(
      import.meta.env.VITE_API_URL || "http://localhost:3000",
      {
        auth: { token: `Bearer ${accessToken}` },
        transports: ["websocket"],
      },
    );

    socket.on("new_notification", (data) => {
      // 1. Hiển thị Toast góc phải màn hình
      notification.info({
        message: data.title,
        description: data.message,
        placement: "topRight",
        duration: 5,
      });

      // 2. +1 vào cục đỏ trên chuông ngay lập tức
      incrementUnread();

      // 3. Ép React Query tự gọi lại API để load dòng thông báo mới vào danh sách
      // và cập nhật luôn số dư ở Dashboard mà user không cần F5
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["account-me"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, incrementUnread, queryClient]);
};
