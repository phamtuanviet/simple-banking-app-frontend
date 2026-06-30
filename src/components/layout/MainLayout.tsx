import React, { useState } from "react";
import { Layout, Menu, Dropdown, Avatar, message } from "antd";
import {
  DashboardOutlined,
  SwapOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { authService } from "../../services/api/auth/auth.service";

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: "Tổng quan",
    },
    // Chỉ hiện nút Chuyển khoản nếu là customer
    ...(user?.role === "customer"
      ? [
          {
            key: "/transfer",
            icon: <SwapOutlined />,
            label: "Chuyển khoản",
          },
        ]
      : []),
    {
      key: "/history",
      icon: <HistoryOutlined />,
      label: "Lịch sử giao dịch",
    },
    // Chỉ hiện menu Quản lý nếu là admin
    ...(user?.role === "admin"
      ? [
          {
            key: "/admin/users",
            icon: <TeamOutlined />,
            label: "Quản lý người dùng",
          },
        ]
      : []),
  ];

  // Menu cho Dropdown ở Header
  const userMenu = {
    items: [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Đăng xuất",
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
          <h2 className="text-lg font-semibold text-gray-800 m-0">
            {/* Có thể map location.pathname ra tên trang tương ứng ở đây */}
          </h2>

          <div className="flex items-center gap-4">
            <span className="text-gray-600">
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
                icon={<UserOutlined />}
                className="cursor-pointer bg-blue-500 hover:bg-blue-600 transition-colors"
              />
            </Dropdown>
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
