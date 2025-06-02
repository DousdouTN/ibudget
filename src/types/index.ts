export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'expense' | 'income';
  is_recurring?: boolean;
  recurrence_interval?: 'monthly' | 'weekly' | 'yearly';
  next_due_date?: string;
  last_generated_date?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface ChartData {
  name: string;
  value: number;
  color: string;
}

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  categories?: string[];
  type?: 'expense' | 'income' | 'all';
}

export interface Goal {
  id: string;
  user_id: string;
  type: 'savings' | 'expense_reduction';
  target_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  category?: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}