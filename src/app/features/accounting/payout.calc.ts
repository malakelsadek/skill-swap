import { Course, Invoice, User } from '../../core/models';
import { calculateEarnings } from '../instructor/earnings.calc'; // adjust the path if the file lives elsewhere

export interface PayoutRow {
  instructorId: number;
  instructorName: string;
  sales: number;
  gross: number;
  earned: number; // what the instructor is paid
  platform: number; // what the platform keeps
}

export interface PayoutSummary {
  rows: PayoutRow[];
  totalGross: number;
  totalEarned: number;
  totalPlatform: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Accountant view of instructor revenue-share payouts.
 * Reuses Member 2's calculateEarnings per instructor so the instructor's
 * earnings page and the accountant's payout page always show the same numbers.
 * (That function already ignores pending, refunded and subscription invoices.)
 */
export function calculatePayouts(
  invoices: Invoice[],
  courses: Course[],
  instructors: User[],
  rate?: number,
): PayoutSummary {
  const rows: PayoutRow[] = instructors.map((i) => {
    const r = rate === undefined
      ? calculateEarnings(invoices, courses, i.id)
      : calculateEarnings(invoices, courses, i.id, rate);
    return { instructorId: i.id, instructorName: i.name, sales: r.sales, gross: r.gross, earned: r.earned, platform: r.platform };
  });
  return {
    rows,
    totalGross: round2(rows.reduce((t, r) => t + r.gross, 0)),
    totalEarned: round2(rows.reduce((t, r) => t + r.earned, 0)),
    totalPlatform: round2(rows.reduce((t, r) => t + r.platform, 0)),
  };
}