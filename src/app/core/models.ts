export type Role = 'student' | 'instructor' | 'accountant' | 'admin';
export type Category = 'Design' | 'Business' | 'Programming';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  picture: string;
  password: string;
  role: Role;
  card: { holder: string; last4: string; expiry: string };
  preferences: { theme: 'light' | 'dark'; favoriteCategories: Category[]; sound: boolean };
}

export interface Course {
  id: number;
  title: string;
  category: Category;
  price: number;
  instructorId: number;
  description: string;
  thumbnail: string;
}

export interface Invoice {
  id: number;
  studentId: number;
  items: { courseId: number; price: number }[];
  total: number;
  date: string;
  status: 'pending' | 'paid' | 'refunded';
  type: 'course' | 'subscription';
}

export interface Payment {
  id: number;
  invoiceId: number;
  studentId: number;
  amount: number;
  date: string;
}

export interface Refund {
  id: number;
  invoiceId: number;
  studentId: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface Enrollment {
  studentId: number;
  courseId: number;
  date: string;
}

export interface Staff {
  id: number;
  name: string;
  role: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
}

export interface BudgetEntry {
  id: number;
  department: Category;
  type: 'income' | 'expense' | 'marketing' | 'refund';
  amount: number;
  date: string;
  note: string;
}
