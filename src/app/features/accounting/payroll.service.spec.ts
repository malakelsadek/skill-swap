import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PayrollService, calcNet } from './payroll.service';

describe('calcNet', () => {
  it('adds allowances and subtracts deductions', () => {
    expect(calcNet({ baseSalary: 10000, allowances: 1500, deductions: 700 })).toBe(10800);
  });
});

describe('PayrollService', () => {
  let svc: PayrollService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(PayrollService);
  });

  it('starts with seed staff', () => {
    expect(svc.staff().length).toBeGreaterThan(0);
  });

  it('adds, updates and removes a member and persists to localStorage', () => {
    svc.add({ name: 'Test', jobTitle: 'QA', department: 'Platform', baseSalary: 5000, allowances: 100, deductions: 50 });
    const added = svc.staff().find((s) => s.name === 'Test')!;
    expect(added.id).toBeGreaterThan(0);
    expect(JSON.parse(localStorage.getItem('skillswap_payroll_staff')!).length).toBe(svc.staff().length);

    svc.update({ ...added, baseSalary: 6000 });
    expect(svc.staff().find((s) => s.id === added.id)!.baseSalary).toBe(6000);

    svc.remove(added.id);
    expect(svc.staff().some((s) => s.id === added.id)).toBe(false);
  });

  it('generates a monthly report whose total equals the sum of nets', () => {
    const report = svc.generateReport('2026-11');
    expect(report.month).toBe('2026-11');
    expect(report.totalNet).toBe(report.lines.reduce((sum, l) => sum + l.net, 0));
    expect(report.totalNet).toBe(svc.totalNet());
  });
});