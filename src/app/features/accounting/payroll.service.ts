import { Injectable, signal } from '@angular/core';
import { MonthlyReport, StaffMember } from './payroll.model';

const KEY = 'skillswap_payroll_staff';

export function calcNet(s: Pick<StaffMember, 'baseSalary' | 'allowances' | 'deductions'>): number {
  return s.baseSalary + s.allowances - s.deductions;
}

const SEED: StaffMember[] = [
  { id: 1, name: 'Nour Hassan', jobTitle: 'Support Lead', department: 'Platform', baseSalary: 12000, allowances: 1500, deductions: 700 },
  { id: 2, name: 'Youssef Adel', jobTitle: 'Marketing Manager', department: 'Business', baseSalary: 15000, allowances: 2000, deductions: 1000 },
  { id: 3, name: 'Mona Fathy', jobTitle: 'Content Reviewer', department: 'Design', baseSalary: 9000, allowances: 800, deductions: 400 },
  { id: 4, name: 'Hady Samir', jobTitle: 'Platform Engineer', department: 'Programming', baseSalary: 18000, allowances: 2500, deductions: 1200 },
];

// Shared state lives in this service (signal); persisted in localStorage so it survives refresh.
@Injectable({ providedIn: 'root' })
export class PayrollService {
  readonly staff = signal<StaffMember[]>(this.load());

  private load(): StaffMember[] {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as StaffMember[];
    } catch {
      /* ignore corrupted or blocked storage */
    }
    return SEED;
  }

  private save(list: StaffMember[]): void {
    this.staff.set(list);
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      /* storage unavailable: keep in-memory state */
    }
  }

  add(data: Omit<StaffMember, 'id'>): void {
    const list = this.staff();
    const id = list.length ? Math.max(...list.map((s) => s.id)) + 1 : 1;
    this.save([...list, { ...data, id }]);
  }

  update(member: StaffMember): void {
    this.save(this.staff().map((s) => (s.id === member.id ? member : s)));
  }

  remove(id: number): void {
    this.save(this.staff().filter((s) => s.id !== id));
  }

  totalNet(): number {
    return this.staff().reduce((sum, s) => sum + calcNet(s), 0);
  }

  generateReport(month: string): MonthlyReport {
    const lines = this.staff().map((s) => ({ ...s, net: calcNet(s) }));
    return {
      month,
      generatedAt: new Date().toISOString(),
      lines,
      totalNet: lines.reduce((sum, l) => sum + l.net, 0),
    };
  }

  downloadReport(month: string): void {
    const report = this.generateReport(month);
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-report-${month}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}