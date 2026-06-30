import axios from 'axios';
import { useAuthStore } from "../../store/auth.store"

// Lấy URL từ biến môi trường Vite
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173';

export const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Nếu Refresh Token lưu dưới dạng HttpOnly Cookie, bắt buộc bật dòng dưới:
//   withCredentials: true, 
});

// ============================================
// 1. REQUEST INTERCEPTOR: Gắn Token vào mọi API
// ============================================
axiosClient.interceptors.request.use(
  (config) => {
    // Zustand cho phép lấy state ở ngoài React Component qua hàm getState()
    const accessToken = useAuthStore.getState().accessToken;
    
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// 2. RESPONSE INTERCEPTOR: Xử lý 401 & Refresh Token
// ============================================
let isRefreshing = false;
let failedQueue: any[] = [];

// Hàm xử lý hàng đợi các API bị kẹt lại trong lúc chờ token mới
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => {
    // Tự động bóc tách data, giúp lúc gọi API ở component không cần viết .data thêm một lần nữa
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa từng được đánh dấu là retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Bỏ qua, không cố gắng refresh nếu API đang gọi vốn dĩ là API login hoặc refresh
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Nếu có 1 request khác đang refresh token rồi, nhét request này vào hàng đợi (Queue)
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Đánh dấu để không loop vô hạn
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API lên Backend để xin cấp lại token
        // (Thay đổi endpoint dựa theo backend của bạn thực tế)
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, {
          // withCredentials: true // Mở ra nếu dùng HttpOnly Cookie
        });
        
        const newAccessToken = refreshResponse.data.accessToken;

        // Cập nhật lại token vào Zustand Store
        const user = useAuthStore.getState().user;
        if (user) {
          useAuthStore.getState().setAuth(user, newAccessToken);
        }

        // Chạy lại các request đang đợi
        processQueue(null, newAccessToken);
        
        // Gắn token mới vào request hiện tại và chạy lại
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);

      } catch (refreshError) {
        // Lỗi refresh token (ví dụ: Refresh token cũng hết hạn luôn)
        processQueue(refreshError, null);
        
        // Clear thông tin đăng nhập trong Store
        useAuthStore.getState().logout();
        
        // Đá người dùng về trang đăng nhập
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);