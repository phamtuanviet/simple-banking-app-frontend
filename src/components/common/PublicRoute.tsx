import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const PublicRoute = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  // Có token rồi thì đẩy thẳng vào trang chủ, không cho xem form Login nữa
  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;