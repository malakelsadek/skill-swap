import { TestBed } from '@angular/core/testing';
import { KEYS } from '../../core/config';
import { BudgetEntry } from '../../core/models';
import { BudgetService, summarize } from './budget.service';

const entry = (over: Partial<BudgetEntry>): BudgetEntry => ({
  id: 1, department: 'Design', type: 'income', amount: 100, date: '2026-11-01', note: 't', ...over,
});

describe('summarize', () => {
  it('groups by department and computes net', () => {
    const result = summarize([
      entry({ id: 1, type: 'income', amount: 1000 }),
      entry({ id: 2, type: 'expense', amount: 200 }),
      entry({ id: 3, type: 'marketing', amount: 100 }),
      entry({ id: 4, type: 'refund', amount: 50 }),
      entry({ id: 5, department: 'Business', type: 'income', amount: 500 }),
    ]);
    const design = result.find((r) => r.department === 'Design')!;
    expect(design).toEqual(jasmine.objectContaining({ income: 1000, expenses: 200, marketing: 100, refunds: 50, net: 650 }));
    expect(result.find((r) => r.department === 'Business')!.net).toBe(500);
    expect(result.find((r) => r.department === 'Programming')!.net).toBe(0);
  });
});

describe('BudgetService', () => {
  let svc: BudgetService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(BudgetService);
  });

  it('adds and removes entries and persists them', () => {
    const before = svc.entries().length;
    expect(svc.add({ department: 'Design', type: 'income', amount: 10, date: '2026-11-01', note: 'x' })).toBeNull();
    expect(svc.entries().length).toBe(before + 1);
    expect(JSON.parse(localStorage.getItem(KEYS.budget)!).length).toBe(before + 1);

    const added = svc.entries()[svc.entries().length - 1];
    svc.remove(added.id);
    expect(svc.entries().length).toBe(before);
  });

  it('rejects an empty note or a non-positive amount', () => {
    const before = svc.entries().length;
    expect(svc.add({ department: 'Design', type: 'income', amount: 0, date: '2026-11-01', note: 'x' })).toBeTruthy();
    expect(svc.add({ department: 'Design', type: 'income', amount: 10, date: '2026-11-01', note: ' ' })).toBeTruthy();
    expect(svc.entries().length).toBe(before);
  });

  it('addRefund lowers the department net', () => {
    const net = () => svc.summary().find((s) => s.department === 'Programming')!.net;
    const before = net();
    svc.addRefund('Programming', 400);
    expect(net()).toBe(before - 400);
  });
});