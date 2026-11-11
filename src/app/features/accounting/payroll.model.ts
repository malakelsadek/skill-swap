import { Staff } from '../../core/models';

export interface SalaryLine extends Staff {
  net: number;
}

export interface MonthlyReport {
  month: string; // e.g. "2026-11"
  generatedAt: string; // ISO date
  lines: SalaryLine[];
  totalNet: number;
}