export interface Account {
  id: string;
  accountNumber: string; // TypeORM serialize theo tên property
  balance: number;       // Đã được backend ép kiểu sang number
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}