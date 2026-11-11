import { Enrollment, Invoice, Payment, Refund } from '../../core/models';

// Demo data for Member 3's pages. Student ids match users.seed.ts: 3 = Sara, 4 = Omar.
// Course ids and prices match Member 2's courses.seed.ts.
const at = (day: string) => `${day}T10:00:00.000Z`;

export const INVOICES_SEED: Invoice[] = [
  { id: 1, studentId: 3, items: [{ courseId: 7, price: 69.99 }], total: 69.99, date: at('2026-10-20'), status: 'paid', type: 'course' },
  { id: 2, studentId: 3, items: [{ courseId: 1, price: 49.99 }], total: 49.99, date: at('2026-11-03'), status: 'pending', type: 'course' },
  { id: 3, studentId: 4, items: [{ courseId: 4, price: 54.99 }, { courseId: 8, price: 64.99 }], total: 119.98, date: at('2026-10-25'), status: 'paid', type: 'course' },
  { id: 4, studentId: 4, items: [], total: 19.99, date: at('2026-11-01'), status: 'paid', type: 'subscription' },
  { id: 5, studentId: 3, items: [{ courseId: 3, price: 39.99 }], total: 39.99, date: at('2026-10-28'), status: 'paid', type: 'course' },
];

export const PAYMENTS_SEED: Payment[] = [
  { id: 1, invoiceId: 1, studentId: 3, amount: 69.99, date: at('2026-10-20') },
  { id: 2, invoiceId: 3, studentId: 4, amount: 119.98, date: at('2026-10-25') },
  { id: 3, invoiceId: 4, studentId: 4, amount: 19.99, date: at('2026-11-01') },
  { id: 4, invoiceId: 5, studentId: 3, amount: 39.99, date: at('2026-10-28') },
];

export const REFUNDS_SEED: Refund[] = [
  { id: 1, invoiceId: 5, studentId: 3, reason: 'The course was not what I expected', status: 'pending', date: at('2026-10-30') },
];

export const ENROLLMENTS_SEED: Enrollment[] = [
  { studentId: 3, courseId: 7, date: at('2026-10-20') },
  { studentId: 3, courseId: 3, date: at('2026-10-28') },
  { studentId: 4, courseId: 4, date: at('2026-10-25') },
  { studentId: 4, courseId: 8, date: at('2026-10-25') },
];