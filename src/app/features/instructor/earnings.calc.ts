import { REVENUE_SHARE } from '../../core/config';
import { Course, Invoice } from '../../core/models';

export interface EarningRow {
  invoiceId: number;
  date: string;
  courseId: number;
  courseTitle: string;
  price: number; // what the student paid for this course
  share: number; // instructor's cut of that sale
}

export interface Earnings {
  rows: EarningRow[];
  sales: number;
  gross: number; // total sales value
  earned: number; // instructor's total share
  platform: number; // what the platform keeps
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Each sale x revenue share, for one instructor.
 * Only PAID course invoices count: pending ones are not money yet and refunded ones were given back.
 * Subscription invoices are skipped here (they are not tied to one course).
 * Member 4 can reuse this for the instructor payouts page.
 */
export function calculateEarnings(
  invoices: Invoice[],
  courses: Course[],
  instructorId: number,
  rate: number = REVENUE_SHARE,
): Earnings {
  const mine = new Map(courses.filter((c) => c.instructorId === instructorId).map((c) => [c.id, c]));
  const rows: EarningRow[] = [];

  for (const invoice of invoices) {
    if (invoice.status !== 'paid' || invoice.type !== 'course') continue;
    for (const item of invoice.items) {
      const course = mine.get(item.courseId);
      if (!course) continue;
      rows.push({
        invoiceId: invoice.id,
        date: invoice.date,
        courseId: course.id,
        courseTitle: course.title,
        price: item.price,
        share: round2(item.price * rate),
      });
    }
  }

  const gross = round2(rows.reduce((sum, r) => sum + r.price, 0));
  const earned = round2(rows.reduce((sum, r) => sum + r.share, 0));
  return { rows, sales: rows.length, gross, earned, platform: round2(gross - earned) };
}
