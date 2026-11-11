import { Course, Invoice, User } from '../../core/models';
import { calculatePayouts } from './payout.calc';

// Cast so the test keeps compiling if the shared Course model gains or loses optional fields.
const course = (id: number, instructorId: number, price: number): Course =>
  ({ id, title: `Course ${id}`, category: 'Design', price, instructorId, description: 'd', thumbnail: '' }) as Course;
const invoice = (id: number, status: Invoice['status'], items: [number, number][], type: Invoice['type'] = 'course'): Invoice => ({
  id, studentId: 3, status, type, date: '2026-11-01',
  items: items.map(([courseId, price]) => ({ courseId, price })),
  total: items.reduce((s, [, p]) => s + p, 0),
});
const instructor = (id: number, name: string) => ({ id, name, role: 'instructor' }) as User;

const COURSES = [course(1, 5, 100), course(2, 5, 50), course(3, 6, 80)];
const INSTRUCTORS = [instructor(5, 'Dina'), instructor(6, 'Karim')];

describe('calculatePayouts', () => {
  it('splits a mixed invoice between the two instructors', () => {
    const result = calculatePayouts([invoice(1, 'paid', [[1, 100], [3, 80]])], COURSES, INSTRUCTORS);
    expect(result.rows.find((r) => r.instructorId === 5)).toMatchObject({ gross: 100, earned: 70, platform: 30 });
    expect(result.rows.find((r) => r.instructorId === 6)).toMatchObject({ gross: 80, earned: 56, platform: 24 });
  });

  it('totals add up across instructors', () => {
    const result = calculatePayouts([invoice(1, 'paid', [[1, 100], [3, 80]])], COURSES, INSTRUCTORS);
    expect(result.totalGross).toBe(180);
    expect(result.totalEarned).toBe(126);
    expect(result.totalPlatform).toBe(54);
  });

  it('ignores pending, refunded and subscription invoices', () => {
    const invoices = [
      invoice(1, 'pending', [[1, 100]]),
      invoice(2, 'refunded', [[2, 50]]),
      invoice(3, 'paid', [[3, 80]], 'subscription'),
    ];
    const result = calculatePayouts(invoices, COURSES, INSTRUCTORS);
    expect(result.totalEarned).toBe(0);
    expect(result.rows.every((r) => r.sales === 0)).toBe(true);
  });

  it('uses a custom revenue rate when given', () => {
    const result = calculatePayouts([invoice(1, 'paid', [[1, 100]])], COURSES, INSTRUCTORS, 0.5);
    expect(result.rows.find((r) => r.instructorId === 5)!.earned).toBe(50);
  });

  it('returns a zero row for each instructor when there are no invoices', () => {
    const result = calculatePayouts([], COURSES, INSTRUCTORS);
    expect(result.rows.length).toBe(2);
    expect(result.totalEarned).toBe(0);
  });
});