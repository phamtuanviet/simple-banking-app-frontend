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
import Transfer from "../pages/customer/Transfer";
import TransactionHistory from "../pages/customer/TransactionHistory";
import UserManagement from "../pages/admin/UserManagement";
import AllTransactions from "../pages/admin/AllTransactions";
import AdminDashboard from "../pages/admin/AdminDashboard";
import ProfilePage from "../pages/profile/ProfilePage";
import TellerCounter from "../pages/teller/TellerCounter";
import LedgerManagement from "../pages/admin/LedgerManagement";
import AuditLogManagement from "../pages/admin/AuditLogManagement";
import UserHistoryManagement from "../pages/admin/UserHistoryManagement";

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
      { path: "/reset-password", element: <ResetPassword /> },
    ],
  },
  // Nhóm Routes sử dụng MainLayout
  {
    element: <ProtectedRoute allowedRoles={["customer", "admin"]} />,
    children: [
      {
        // Nhúng MainLayout vào đây. Nó sẽ bọc tất cả các trang bên dưới.
        element: <MainLayout />,
        children: [
          { path: "/", element: <Dashboard /> },
          { path: "/transfer", element: <Transfer /> },
          { path: "/history", element: <TransactionHistory /> },
          { path: "/profile", element: <ProfilePage /> },
        ],
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
        children: [
          { path: "", element: <AdminDashboard /> },
          { path: "users", element: <UserManagement /> },
          { path: "transactions", element: <AllTransactions /> },
          { path: "ledger", element: <LedgerManagement /> },
          { path: "audit-logs", element: <AuditLogManagement /> },
          { path: "user-history", element: <UserHistoryManagement /> },
          {
            path: "counter",
            element: <TellerCounter />,
          },
        ],
      },
    ],
  },

  {
    path: "*",
    element: <div className="text-center mt-20 text-2xl">404 Not Found</div>,
  },
]);
