export type BudgetDepartment = 'Design' | 'Business' | 'Programming';
export type EntryType = 'income' | 'expense' | 'marketing' | 'refund';

export interface BudgetEntry {
  id: number;
  department: BudgetDepartment;
  type: EntryType;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
}

export interface DepartmentSummary {
  department: BudgetDepartment;
  income: number;
  expenses: number;
  marketing: number;
  refunds: number;
  net: number;
}