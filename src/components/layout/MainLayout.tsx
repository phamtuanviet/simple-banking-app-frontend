import React, { useState } from "react";
import { Layout, Menu, Dropdown, Avatar, message } from "antd";
import {
  DashboardOutlined,
  SwapOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  BankOutlined,
  SettingOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { authService } from "../../services/api/auth/auth.service";
import { useNotificationSocket } from "../../hooks/useNotificationSocket";
import NotificationBell from "./NotificationBell";

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useNotificationSocket();

  // Lấy thông tin user và hàm logout từ Zustand
  const { user, logout } = useAuthStore();

  // Xử lý đăng xuất
  const handleLogout = async () => {
    // Hiển thị loading nhỏ ở góc màn hình để user biết hệ thống đang xử lý
    const hideLoading = message.loading("Đang đăng xuất...", 0);

    try {
      // 1. Gọi API báo Backend thu hồi Refresh Token
      await authService.logout();
    } catch (error) {
      // Bỏ qua lỗi nếu có (ví dụ: mất mạng, token lỗi) để không chặn tiến trình thoát
      console.error("Lỗi khi gọi API logout:", error);
    } finally {
      // 2. Tắt thông báo loading
      hideLoading();

      // 3. Xóa thông tin user + access token trong Local Storage (Zustand)
      logout();

      // 4. Đá về trang Login
      navigate("/login");
    }
  };

  // Cấu hình menu sidebar
  const menuItems = [
    // Chỉ hiện nút Chuyển khoản nếu là customer
    ...(user?.role === "customer"
      ? [
          {
            key: "/",
            icon: <DashboardOutlined />,
            label: "Tổng quan",
          },
          {
            key: "/transfer",
            icon: <SwapOutlined />,
            label: "Chuyển khoản",
          },
          {
            key: "/history",
            icon: <HistoryOutlined />,
            label: "Lịch sử giao dịch",
          },
          {
            key: "/profile",
            icon: <SettingOutlined />,
            label: "Cài đặt tài khoản",
          },
        ]
      : []),

    // Chỉ hiện menu Quản lý nếu là admin
    ...(user?.role === "admin"
      ? [
          {
            key: "/admin",
            icon: <DashboardOutlined />,
            label: "Tổng quan",
          },
          {
            key: "/admin/users",
            icon: <TeamOutlined />,
            label: "Quản lý người dùng",
          },
          {
            key: "/admin/transactions",
            icon: <HistoryOutlined />,
            label: "Quản lý giao dịch",
          },
          // ==========================================
          {
            key: "/admin/ledger",
            icon: <BookOutlined />, // Icon quyển sổ
            label: "Quản lý sổ cái",
          },
          {
            key: "/admin/audit-logs",
            icon: <SafetyCertificateOutlined />, // Icon bảo mật/truy vết
            label: "Nhật ký hệ thống",
          },
          {
            key: "/admin/user-history",
            icon: <ProfileOutlined />,
            label: "Lịch sử tài khoản",
          },
          {
            key: "/admin/counter", // Đường dẫn tới trang TellerCounter
            icon: <BankOutlined />,
            label: "Giao dịch tại quầy",
          },
        ]
      : []),
    ...(user?.role === "teller"
      ? [
          {
            key: "/teller/counter",
            icon: <BankOutlined />,
            label: "Giao dịch tại quầy",
          },
          // Sau này bạn có thể thêm trang "Lịch sử nạp rút" riêng cho Teller ở đây
        ]
      : []),
  ];

  // Menu cho Dropdown ở Header
  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Hồ sơ cá nhân",
        onClick: () => navigate("/profile"), // Điều hướng sang trang Profile
      },
      {
        type: "divider", // Đường kẻ ngang phân cách
      },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Đăng xuất",
        danger: true, // Thêm màu đỏ cho nút đăng xuất
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout className="min-h-screen">
      {/* SIDEBAR */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        className="shadow-md z-10"
      >
        <div className="h-16 flex items-center justify-center font-bold text-xl text-blue-600 border-b border-gray-200">
          {collapsed ? "SBA" : "Simple Banking"}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="mt-4 border-r-0"
        />
      </Sider>

      {/* KHU VỰC CHÍNH */}
      <Layout>
        {/* HEADER */}
        <Header className="bg-white px-6 shadow-sm flex justify-between items-center z-0">
          <h2 className="text-lg font-semibold text-gray-800 m-0"></h2>

          <div className="flex items-center gap-6">
            {/* QUẢ CHUÔNG THÔNG BÁO Ở ĐÂY */}
            <NotificationBell />

            {/* AVATAR VÀ MENU CŨ */}
            <div className="flex items-center gap-3">
              <span className="text-gray-600 hidden sm:block">
                Xin chào,{" "}
                <strong className="text-black">
                  {user?.fullName || "Khách"}
                </strong>
              </span>
              <Dropdown
                menu={userMenu}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Avatar
                  size="default"
                  src={user?.avatarUrl} // Lấy link ảnh từ Zustand Store
                  icon={<UserOutlined />} // Fallback tự động nếu ảnh rỗng hoặc bị lỗi mạng
                  className="cursor-pointer bg-blue-500 hover:bg-blue-600 transition-colors"
                />
              </Dropdown>
            </div>
          </div>
        </Header>

        {/* NỘI DUNG TRANG (CONTENT) */}
        <Content className="m-6 p-6 bg-white rounded-lg shadow-sm overflow-auto">
          {/* Outlet là nơi React Router sẽ render Dashboard, TransferPage, v.v. vào */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
