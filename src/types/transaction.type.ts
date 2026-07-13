export interface Transaction {
  id: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  amount: number;
  type: 'transfer' | 'deposit' | 'withdrawal' | 'reversal'; 
  status: 'success' | 'failed' | 'pending';
  description: string;
  createdAt: string;
}