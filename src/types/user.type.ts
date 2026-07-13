// 1. Định nghĩa trước các vai trò (role) hợp lệ trong hệ thống

// src/types/user.type.ts

// Định nghĩa lại các Enum để Frontend dùng kiểm tra điều kiện (ví dụ: phân quyền điều hướng, hiển thị Tag)
export type UserRole = "customer" | "admin" | "teller";

export type UserStatus = "active" | "locked" | "banned";

export interface User {
  id: string; // Khớp với PrimaryGeneratedColumn('uuid') ở Backend
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus; // Thêm trạng thái để hiển thị hoặc xử lý khóa tài khoản ở Frontend

  // ==========================================
  // THÔNG TIN CÁ NHÂN (PROFILE) - Có thể null từ DB
  // ==========================================
  dateOfBirth: string | null; // Kiểu 'date' từ Postgres khi API trả về JSON sẽ có dạng chuỗi "YYYY-MM-DD"
  avatarUrl: string | null; // Chuỗi URL trả về từ Cloudinary
  address: string | null;
  phoneNumber: string | null;

  // ==========================================
  // THÔNG TIN BẢO MẬT (Nếu Frontend cần dùng để ẩn/hiển thị nút nhận diện)
  // ==========================================
  isEmailVerified?: boolean;
}
