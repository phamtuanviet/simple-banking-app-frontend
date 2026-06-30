// 1. Định nghĩa trước các vai trò (role) hợp lệ trong hệ thống
export type UserRole = 'customer' | 'admin';

// 2. Định nghĩa cấu trúc User
export interface User {
  id: string;       // Dùng 'string' nếu database dùng UUID. Nếu DB dùng Auto Increment thì đổi thành 'number'
  email: string;
  fullName: string; // Đã đổi sang camelCase theo đúng format bạn gọi
  role: UserRole;
}