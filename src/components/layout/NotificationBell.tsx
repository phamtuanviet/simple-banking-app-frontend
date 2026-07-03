// src/components/NotificationBell.tsx
import React, { useEffect } from "react";
import { Badge, Popover, List, Typography, Button, Space } from "antd";
import {
  BellOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "../../store/notification.store";
import { notificationService, type NotificationItem } from "../../services/api/notification/notification.service";

const { Text } = Typography;

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const { unreadCount, setUnreadCount, decrementUnread, resetUnread } =
    useNotificationStore();

  // 1. Fetch danh sách thông báo
  const { data: res, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getNotifications(1, 10),
  });

  // Đồng bộ unreadCount từ API vào Zustand ở lần load đầu tiên
  useEffect(() => {
    if (res?.data?.unreadCount !== undefined) {
      setUnreadCount(res.data.unreadCount);
    }
  }, [res, setUnreadCount]);

  // 2. Đánh dấu 1 tin đã đọc
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      decrementUnread();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // 3. Đánh dấu đọc tất cả
  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      resetUnread();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
  };

  // 4. Giao diện bên trong Dropdown/Popover
  const content = (
    <div className="w-80 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2 px-4 pt-2">
        <Text strong>Thông báo</Text>
        <Button
          type="link"
          size="small"
          onClick={() => markAllMutation.mutate()}
          disabled={unreadCount === 0}
        >
          Đánh dấu đã đọc tất cả
        </Button>
      </div>
      <List
        loading={isLoading}
        dataSource={res?.data?.items || []}
        renderItem={(item) => {
          // Render icon dựa vào type
          let Icon = InfoCircleOutlined;
          let iconColor = "text-blue-500";
          if (item.type === "transfer_in") {
            Icon = ArrowDownOutlined;
            iconColor = "text-green-500";
          }
          if (item.type === "transfer_out") {
            Icon = ArrowUpOutlined;
            iconColor = "text-red-500";
          }

          return (
            <List.Item
              className={`cursor-pointer hover:bg-gray-50 px-4 ${!item.isRead ? "bg-blue-50/50" : ""}`}
              onClick={() => handleItemClick(item)}
            >
              <List.Item.Meta
                avatar={<Icon className={`text-xl ${iconColor} mt-1`} />}
                title={<Text strong={!item.isRead}>{item.title}</Text>}
                description={
                  <Space direction="vertical" size={0}>
                    <Text
                      className="text-sm text-gray-600"
                      strong={!item.isRead}
                    >
                      {item.message}
                    </Text>
                    <Text type="secondary" className="text-xs">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
        locale={{ emptyText: "Không có thông báo nào" }}
      />
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      arrow={false}
    >
      <Badge count={unreadCount} overflowCount={99} className="cursor-pointer">
        <div className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
          <BellOutlined className="text-xl text-gray-700" />
        </div>
      </Badge>
    </Popover>
  );
}
