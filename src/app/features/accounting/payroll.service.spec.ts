import { TestBed } from '@angular/core/testing';
import { KEYS } from '../../core/config';
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
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(PayrollService);
  });

  it('starts with seed staff and saves them', () => {
    expect(svc.staff().length).toBeGreaterThan(0);
    expect(JSON.parse(localStorage.getItem(KEYS.staff)!).length).toBe(svc.staff().length);
  });

  it('adds, updates and removes a member and persists to localStorage', () => {
    expect(svc.add({ name: 'Test', role: 'QA', baseSalary: 5000, allowances: 100, deductions: 50 })).toBeNull();
    const added = svc.staff().find((s) => s.name === 'Test')!;
    expect(JSON.parse(localStorage.getItem(KEYS.staff)!).length).toBe(svc.staff().length);

    expect(svc.update({ ...added, baseSalary: 6000 })).toBeNull();
    expect(svc.staff().find((s) => s.id === added.id)!.baseSalary).toBe(6000);

    svc.remove(added.id);
    expect(svc.staff().some((s) => s.id === added.id)).toBe(false);
  });

  it('rejects invalid input', () => {
    const before = svc.staff().length;
    expect(svc.add({ name: ' ', role: 'QA', baseSalary: 5000, allowances: 0, deductions: 0 })).toBe('Name is required');
    expect(svc.add({ name: 'A', role: 'QA', baseSalary: -1, allowances: 0, deductions: 0 })).toBeTruthy();
    expect(svc.add({ name: 'A', role: 'QA', baseSalary: 100, allowances: 0, deductions: 500 })).toBeTruthy();
    expect(svc.staff().length).toBe(before);
  });

  it('generates a monthly report whose total equals the sum of nets', () => {
    const report = svc.generateReport('2026-11');
    expect(report.month).toBe('2026-11');
    expect(report.totalNet).toBe(report.lines.reduce((sum, l) => sum + l.net, 0));
    expect(report.totalNet).toBe(svc.totalNet());
  });
});