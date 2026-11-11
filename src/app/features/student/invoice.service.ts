import { Injectable, inject } from '@angular/core';
import { KEYS, SUBSCRIPTION_PRICE } from '../../core/config';
import { Course, Invoice, Payment, Enrollment, Refund } from '../../core/models';
import { StorageService } from '../../core/services/storage.service';

// Rounds to cents so 49.99 + 39.99 is stored as 89.98, not 89.97999999999999
const round2 = (n: number) => Math.round(n * 100) / 100;

// Newest first (same date: highest id first)
const newestFirst = (a: { id: number; date: string }, b: { id: number; date: string }) =>
  b.date.localeCompare(a.date) || b.id - a.id;

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private storage = inject(StorageService);

  /**
   * Step 1 of buying: creates a PENDING invoice (nothing is paid yet).
   * Returns null if the cart is empty or the student already owns one of the courses.
   */
  checkoutCourses(studentId: number, courses: Course[]): Invoice | null {
    const invoices = this.storage.local.get<Invoice[]>(KEYS.invoices) ?? [];
    const enrollments = this.storage.local.get<Enrollment[]>(KEYS.enrollments) ?? [];

    if (courses.length === 0) return null;

    const alreadyOwned = courses.some(course =>
      enrollments.some(e => e.studentId === studentId && e.courseId === course.id)
    );
    if (alreadyOwned) return null;

    const invoice: Invoice = {
      id: Math.max(0, ...invoices.map(item => item.id)) + 1,
      studentId,
      items: courses.map(course => ({
        courseId: course.id,
        price: course.price
      })),
      total: round2(courses.reduce((sum, course) => sum + course.price, 0)),
      date: new Date().toISOString(),
      status: 'pending',
      type: 'course'
    };

    this.storage.local.set(KEYS.invoices, [...invoices, invoice]);
    return invoice;
  }

  /** Creates a PENDING subscription invoice. */
  checkoutSubscription(studentId: number): Invoice {
    const invoices = this.storage.local.get<Invoice[]>(KEYS.invoices) ?? [];

    const invoice: Invoice = {
      id: Math.max(0, ...invoices.map(item => item.id)) + 1,
      studentId,
      items: [],
      total: SUBSCRIPTION_PRICE,
      date: new Date().toISOString(),
      status: 'pending',
      type: 'subscription'
    };

    this.storage.local.set(KEYS.invoices, [...invoices, invoice]);
    return invoice;
  }

  /**
   * Step 2 of buying: mark payment (pending -> paid).
   * Saves the payment and unlocks the courses. Returns null if the invoice
   * does not exist, belongs to someone else, or is not pending.
   */
  markPaid(invoiceId: number, studentId: number): Payment | null {
    const invoices = this.storage.local.get<Invoice[]>(KEYS.invoices) ?? [];
    const payments = this.storage.local.get<Payment[]>(KEYS.payments) ?? [];
    const enrollments = this.storage.local.get<Enrollment[]>(KEYS.enrollments) ?? [];

    const invoice = invoices.find(
      item => item.id === invoiceId && item.studentId === studentId
    );
    if (!invoice || invoice.status !== 'pending') return null;

    const date = new Date().toISOString();

    const payment: Payment = {
      id: Math.max(0, ...payments.map(item => item.id)) + 1,
      invoiceId,
      studentId,
      amount: invoice.total,
      date
    };

    const newEnrollments: Enrollment[] = invoice.items
      .filter(item => !enrollments.some(e => e.studentId === studentId && e.courseId === item.courseId))
      .map(item => ({ studentId, courseId: item.courseId, date }));

    this.storage.local.set(
      KEYS.invoices,
      invoices.map(item => (item.id === invoiceId ? { ...item, status: 'paid' as const } : item))
    );
    this.storage.local.set(KEYS.payments, [...payments, payment]);
    if (newEnrollments.length > 0) {
      this.storage.local.set(KEYS.enrollments, [...enrollments, ...newEnrollments]);
    }

    return payment;
  }

  getStudentInvoices(studentId: number): Invoice[] {
    const invoices = this.storage.local.get<Invoice[]>(KEYS.invoices) ?? [];
    return invoices.filter(invoice => invoice.studentId === studentId).sort(newestFirst);
  }

  getAllInvoices(): Invoice[] {
    const invoices = this.storage.local.get<Invoice[]>(KEYS.invoices) ?? [];
    return [...invoices].sort(newestFirst);
  }

  getStudentPayments(studentId: number): Payment[] {
    const payments = this.storage.local.get<Payment[]>(KEYS.payments) ?? [];
    return payments.filter(payment => payment.studentId === studentId).sort(newestFirst);
  }

  getStudentRefunds(studentId: number): Refund[] {
    const refunds = this.storage.local.get<Refund[]>(KEYS.refunds) ?? [];
    return refunds.filter(refund => refund.studentId === studentId);
  }

  /** For Member 4's accountant pages. */
  getAllRefunds(): Refund[] {
    return this.storage.local.get<Refund[]>(KEYS.refunds) ?? [];
  }

  requestRefund(invoiceId: number, studentId: number, reason: string): Refund | null {
    const invoices = this.storage.local.get<Invoice[]>(KEYS.invoices) ?? [];
    const refunds = this.storage.local.get<Refund[]>(KEYS.refunds) ?? [];

    const invoice = invoices.find(
      item => item.id === invoiceId && item.studentId === studentId
    );

    if (!invoice || invoice.status !== 'paid') return null;

    const existingRequest = refunds.find(
      refund => refund.invoiceId === invoiceId &&
        (refund.status === 'pending' || refund.status === 'approved')
    );

    if (existingRequest) return null;

    const refund: Refund = {
      id: Math.max(0, ...refunds.map(item => item.id)) + 1,
      invoiceId,
      studentId,
      reason,
      status: 'pending',
      date: new Date().toISOString()
    };

    this.storage.local.set(KEYS.refunds, [...refunds, refund]);
    return refund;
  }

  /**
   * For Member 4: approve or reject a pending refund.
   * Approving also marks the invoice 'refunded' and removes the course access.
   * (The accountant-only route guard protects the page that calls this.)
   */
  resolveRefund(refundId: number, approve: boolean): Refund | null {
    const refunds = this.storage.local.get<Refund[]>(KEYS.refunds) ?? [];
    const refund = refunds.find(item => item.id === refundId);
    if (!refund || refund.status !== 'pending') return null;

    const resolved: Refund = { ...refund, status: approve ? 'approved' : 'rejected' };
    this.storage.local.set(
      KEYS.refunds,
      refunds.map(item => (item.id === refundId ? resolved : item))
    );

    if (approve) {
      const invoices = this.storage.local.get<Invoice[]>(KEYS.invoices) ?? [];
      const enrollments = this.storage.local.get<Enrollment[]>(KEYS.enrollments) ?? [];
      const invoice = invoices.find(item => item.id === refund.invoiceId);
      const courseIds = invoice?.items.map(item => item.courseId) ?? [];

      this.storage.local.set(
        KEYS.invoices,
        invoices.map(item => (item.id === refund.invoiceId ? { ...item, status: 'refunded' as const } : item))
      );
      this.storage.local.set(
        KEYS.enrollments,
        enrollments.filter(e => !(e.studentId === refund.studentId && courseIds.includes(e.courseId)))
      );
    }

    return resolved;
  }
}