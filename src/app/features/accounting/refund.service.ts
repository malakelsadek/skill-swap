import { Injectable, computed, inject, signal } from '@angular/core';
import { KEYS } from '../../core/config';
import { Invoice, Refund, User } from '../../core/models';
import { StorageService } from '../../core/services/storage.service';
import { CourseService } from '../courses/course.service'; // adjust the path if the course service lives elsewhere
import { BudgetService } from './budget.service';

export interface RefundRow {
  refund: Refund;
  studentName: string;
  total: number;
  courses: string; // course titles on the invoice
}

/**
 * Accountant refund approvals.
 * Refund requests and invoices are the mock database written by Member 3 (localStorage via StorageService).
 * Approving a refund: marks the refund approved, marks the invoice refunded,
 * and adds a "refund" entry to the budget of each course's department.
 * approve / reject return an error message, or null on success.
 */
@Injectable({ providedIn: 'root' })
export class RefundService {
  private storage = inject(StorageService);
  private courses = inject(CourseService);
  private budget = inject(BudgetService);

  private readonly refundState = signal<Refund[]>(this.readRefunds());
  private readonly invoiceState = signal<Invoice[]>(this.readInvoices());

  readonly refunds = this.refundState.asReadonly();
  readonly pendingCount = computed(() => this.refundState().filter((r) => r.status === 'pending').length);

  readonly rows = computed<RefundRow[]>(() => {
    const users = this.storage.local.get<User[]>(KEYS.users) ?? [];
    const invoices = this.invoiceState();
    return [...this.refundState()]
      .sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || b.id - a.id)
      .map((refund) => {
        const invoice = invoices.find((i) => i.id === refund.invoiceId);
        return {
          refund,
          studentName: users.find((u) => u.id === refund.studentId)?.name ?? `Student #${refund.studentId}`,
          total: invoice?.total ?? 0,
          courses: invoice ? invoice.items.map((it) => this.courses.get(it.courseId)?.title ?? `Course #${it.courseId}`).join(', ') : '',
        };
      });
  });

  private readRefunds(): Refund[] {
    return this.storage.local.get<Refund[]>(KEYS.refunds) ?? [];
  }

  private readInvoices(): Invoice[] {
    return this.storage.local.get<Invoice[]>(KEYS.invoices) ?? [];
  }

  /** Re-reads localStorage (a student may have sent a new request, or an invoice changed). */
  reload(): void {
    this.refundState.set(this.readRefunds());
    this.invoiceState.set(this.readInvoices());
  }

  private saveRefunds(list: Refund[]): void {
    this.storage.local.set(KEYS.refunds, list);
    this.refundState.set(list);
  }

  private saveInvoices(list: Invoice[]): void {
    this.storage.local.set(KEYS.invoices, list);
    this.invoiceState.set(list);
  }

  approve(refundId: number): string | null {
    this.reload();
    const refund = this.refundState().find((r) => r.id === refundId);
    if (!refund) return 'Refund request not found';
    if (refund.status !== 'pending') return 'This request was already decided';
    const invoice = this.invoiceState().find((i) => i.id === refund.invoiceId);
    if (!invoice) return 'Invoice not found';
    if (invoice.status !== 'paid') return 'Only paid invoices can be refunded';

    for (const item of invoice.items) {
      const course = this.courses.get(item.courseId);
      if (course) this.budget.addRefund(course.category, item.price, `Refund for invoice #${invoice.id}: ${course.title}`);
    }
    this.saveInvoices(this.invoiceState().map((i) => (i.id === invoice.id ? { ...i, status: 'refunded' as const } : i)));
    this.saveRefunds(this.refundState().map((r) => (r.id === refundId ? { ...r, status: 'approved' as const } : r)));
    return null;
  }

  reject(refundId: number): string | null {
    this.reload();
    const refund = this.refundState().find((r) => r.id === refundId);
    if (!refund) return 'Refund request not found';
    if (refund.status !== 'pending') return 'This request was already decided';
    this.saveRefunds(this.refundState().map((r) => (r.id === refundId ? { ...r, status: 'rejected' as const } : r)));
    return null;
  }
}