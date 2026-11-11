import { Injectable, inject, signal } from '@angular/core';
import { KEYS } from '../../core/config';
import { Staff } from '../../core/models';
import { StorageService } from '../../core/services/storage.service';
import { MonthlyReport } from './payroll.model';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calcNet(s: Pick<Staff, 'baseSalary' | 'allowances' | 'deductions'>): number {
  return round2(s.baseSalary + s.allowances - s.deductions);
}

const SEED: Staff[] = [
  { id: 1, name: 'Nour Hassan', role: 'Support Lead', baseSalary: 12000, allowances: 1500, deductions: 700 },
  { id: 2, name: 'Youssef Adel', role: 'Marketing Manager', baseSalary: 15000, allowances: 2000, deductions: 1000 },
  { id: 3, name: 'Mona Fathy', role: 'Content Reviewer', baseSalary: 9000, allowances: 800, deductions: 400 },
  { id: 4, name: 'Hady Samir', role: 'Platform Engineer', baseSalary: 18000, allowances: 2500, deductions: 1200 },
];

/**
 * Staff payroll.
 * State strategy: one signal holds the staff list so every page updates together;
 * each change is written to localStorage (via StorageService) so it survives refreshes.
 * add / update return an error message, or null on success (same style as CourseService).
 */
@Injectable({ providedIn: 'root' })
export class PayrollService {
  private storage = inject(StorageService);

  readonly staff = signal<Staff[]>(this.load());

  private load(): Staff[] {
    this.storage.seedIfEmpty(KEYS.staff, SEED);
    return this.storage.local.get<Staff[]>(KEYS.staff) ?? SEED;
  }

  private save(list: Staff[]): void {
    this.storage.local.set(KEYS.staff, list);
    this.staff.set(list);
  }

  private validate(d: Omit<Staff, 'id'>): string | null {
    if (!d.name.trim()) return 'Name is required';
    if (!d.role.trim()) return 'Role is required';
    for (const n of [d.baseSalary, d.allowances, d.deductions]) {
      if (!Number.isFinite(n) || n < 0) return 'Salary, allowances and deductions must be 0 or more';
    }
    if (d.deductions > d.baseSalary + d.allowances) return 'Deductions cannot be more than salary plus allowances';
    return null;
  }

  add(data: Omit<Staff, 'id'>): string | null {
    const error = this.validate(data);
    if (error) return error;
    const id = Math.max(0, ...this.staff().map((s) => s.id)) + 1;
    this.save([...this.staff(), { ...data, name: data.name.trim(), role: data.role.trim(), id }]);
    return null;
  }

  update(member: Staff): string | null {
    const error = this.validate(member);
    if (error) return error;
    this.save(this.staff().map((s) => (s.id === member.id ? { ...member, name: member.name.trim(), role: member.role.trim() } : s)));
    return null;
  }

  remove(id: number): void {
    this.save(this.staff().filter((s) => s.id !== id));
  }

  totalNet(): number {
    return round2(this.staff().reduce((sum, s) => sum + calcNet(s), 0));
  }

  generateReport(month: string): MonthlyReport {
    const lines = this.staff().map((s) => ({ ...s, net: calcNet(s) }));
    return {
      month,
      generatedAt: new Date().toISOString(),
      lines,
      totalNet: round2(lines.reduce((sum, l) => sum + l.net, 0)),
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