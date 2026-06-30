import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Dashboard from "../pages/dashboard/Dashboard";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import PublicRoute from "../components/common/PublicRoute";
import VerifyEmailNotice from "../pages/auth/VerifyEmailNotice";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ResetPassword from "../pages/auth/ResetPassword";

export const router = createBrowserRouter([
  // Routes không cần Layout
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/verify-email-notice", element: <VerifyEmailNotice /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/verify-email", element: <VerifyEmail /> },
      { path: '/reset-password', element: <ResetPassword /> },
    ],
  },
  // Nhóm Routes sử dụng MainLayout
  {
    element: <ProtectedRoute allowedRoles={["customer", "admin"]} />,
    children: [
      {
        // Nhúng MainLayout vào đây. Nó sẽ bọc tất cả các trang bên dưới.
        element: <MainLayout />,
        children: [{ path: "/", element: <Dashboard /> }],
      },
    ],
  },

  // Nhóm chỉ Customer
  {
    element: <ProtectedRoute allowedRoles={["customer"]} />,
    children: [
      {
        element: <MainLayout />,
      },
    ],
  },

  // Nhóm chỉ Admin
  {
    path: "/admin",
    element: <ProtectedRoute allowedRoles={["admin"]} />,
    children: [
      {
        element: <MainLayout />,
      },
    ],
  },

  {
    path: "*",
    element: <div className="text-center mt-20 text-2xl">404 Not Found</div>,
  },
]);
