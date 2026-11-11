import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { KEYS } from '../../core/config';
import { Course, Invoice, Refund } from '../../core/models';
import { StorageService } from '../../core/services/storage.service';
import { CourseService } from '../courses/course.service'; // same path as in refund.service.ts
import { BudgetService } from './budget.service';
import { RefundService } from './refund.service';

const COURSES = [
  { id: 1, title: 'UI Design', category: 'Design', price: 100, instructorId: 5 },
  { id: 2, title: 'Angular', category: 'Programming', price: 50, instructorId: 6 },
] as unknown as Course[];

const invoice = (id: number, status: Invoice['status']): Invoice => ({
  id, studentId: 3, status, type: 'course', date: '2026-11-01',
  items: [{ courseId: 1, price: 100 }, { courseId: 2, price: 50 }], total: 150,
});
const refund = (id: number, invoiceId: number, status: Refund['status'] = 'pending'): Refund => ({
  id, invoiceId, studentId: 3, reason: 'Changed my mind', status, date: '2026-11-02',
});

describe('RefundService', () => {
  let svc: RefundService;
  let budget: BudgetService;
  let storage: StorageService;

  function setup(invoices: Invoice[], refunds: Refund[]) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: CourseService, useValue: { get: (id: number) => COURSES.find((c) => c.id === id) } }],
    });
    storage = TestBed.inject(StorageService);
    storage.local.set(KEYS.invoices, invoices);
    storage.local.set(KEYS.refunds, refunds);
    budget = TestBed.inject(BudgetService);
    svc = TestBed.inject(RefundService);
  }

  const net = (dept: string) => budget.summary().find((s) => s.department === dept)!.net;

  beforeEach(() => setup([invoice(1, 'paid'), invoice(2, 'pending')], [refund(1, 1), refund(2, 2)]));

  it('approving marks the refund approved and the invoice refunded', () => {
    expect(svc.approve(1)).toBeNull();
    expect(svc.refunds().find((r) => r.id === 1)!.status).toBe('approved');
    expect(storage.local.get<Invoice[]>(KEYS.invoices)!.find((i) => i.id === 1)!.status).toBe('refunded');
    expect(storage.local.get<Refund[]>(KEYS.refunds)!.find((r) => r.id === 1)!.status).toBe('approved');
  });

  it('approving adds a refund to the budget of each course department', () => {
    const design = net('Design');
    const programming = net('Programming');
    svc.approve(1);
    expect(net('Design')).toBe(design - 100);
    expect(net('Programming')).toBe(programming - 50);
  });

  it('cannot approve a refund for an invoice that is not paid', () => {
    expect(svc.approve(2)).toBe('Only paid invoices can be refunded');
    expect(svc.refunds().find((r) => r.id === 2)!.status).toBe('pending');
  });

  it('cannot decide the same request twice', () => {
    svc.approve(1);
    expect(svc.approve(1)).toBe('This request was already decided');
    expect(svc.reject(1)).toBe('This request was already decided');
  });

  it('rejecting leaves the invoice and budget unchanged', () => {
    const design = net('Design');
    expect(svc.reject(1)).toBeNull();
    expect(svc.refunds().find((r) => r.id === 1)!.status).toBe('rejected');
    expect(storage.local.get<Invoice[]>(KEYS.invoices)!.find((i) => i.id === 1)!.status).toBe('paid');
    expect(net('Design')).toBe(design);
  });

  it('reports an unknown request', () => {
    expect(svc.approve(99)).toBe('Refund request not found');
  });

  it('counts pending requests', () => {
    expect(svc.pendingCount()).toBe(2);
    svc.reject(2);
    expect(svc.pendingCount()).toBe(1);
  });
});