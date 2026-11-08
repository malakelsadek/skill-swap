export type Department = 'Design' | 'Business' | 'Programming' | 'Platform';

export interface StaffMember {
  id: number;
  name: string;
  jobTitle: string;
  department: Department;
  baseSalary: number;
  allowances: number;
  deductions: number;
}

export interface SalaryLine extends StaffMember {
  net: number;
}

export interface MonthlyReport {
  month: string; // e.g. "2026-11"
  generatedAt: string; // ISO date
  lines: SalaryLine[];
  totalNet: number;
}