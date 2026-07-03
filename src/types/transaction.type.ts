export interface Transaction {
  id: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  amount: number;
  type: 'transfer' | 'deposit'; 
  status: 'success' | 'failed' | 'pending';
  description: string;
  createdAt: string;
}