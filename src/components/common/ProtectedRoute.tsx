import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import type { UserRole } from "../../types/user.type";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]; // Mảng chứa các role được phép truy cập trang này
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  if (!accessToken) {
    console.log("Access token not found");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Đá người dùng về trang chủ (hoặc trang thông báo từ chối truy cập)
    return <Navigate to="/" replace />;
  }

  // Nếu đã đăng nhập, cho phép hiển thị các component con bên trong (Dashboard, Transfer,...)
  return <Outlet />;
};

export default ProtectedRoute;
