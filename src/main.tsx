import "./index.css";
import ReactDOM from "react-dom/client";
import React from "react";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import viVN from "antd/locale/vi_VN"; // Đổi ngôn ngữ mặc định của Antd sang Tiếng Việt
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Không tự động gọi lại API khi user chuyển tab trình duyệt
      retry: 1, // Chỉ thử gọi lại API 1 lần nếu bị lỗi (tránh spam server)
      staleTime: 5 * 60 * 1000, // Dữ liệu được coi là "mới" trong 5 phút
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 2. Bọc toàn bộ App bằng QueryClientProvider để dùng React Query */}
    <QueryClientProvider client={queryClient}>
      {/* 3. Bọc ConfigProvider để đồng bộ theme và ngôn ngữ cho các component của Ant Design */}
      <ConfigProvider
        locale={viVN}
        theme={{
          token: {
            colorPrimary: "#1677ff", // Màu xanh dương chủ đạo (bạn có thể đổi theo màu của ngân hàng)
            borderRadius: 6, // Bo góc nhẹ cho các input, button
          },
        }}
      >
        <App />
      </ConfigProvider>

      {/* Công cụ debug cực mạnh của React Query (Chỉ hiện ở môi trường dev) */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  </React.StrictMode>,
);
