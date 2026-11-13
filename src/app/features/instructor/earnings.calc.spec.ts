import { Course, Invoice } from '../../core/models';
import { calculateEarnings } from './earnings.calc';

const course = (id: number, instructorId: number, price: number): Course => ({
  id, title: `Course ${id}`, category: 'Design', price, instructorId, description: 'd', thumbnail: '',
});
const invoice = (id: number, status: Invoice['status'], items: [number, number][], type: Invoice['type'] = 'course'): Invoice => ({
  id, studentId: 3, status, type, date: '2026-11-01',
  items: items.map(([courseId, price]) => ({ courseId, price })),
  total: items.reduce((s, [, p]) => s + p, 0),
});

const COURSES = [course(1, 5, 100), course(2, 5, 50), course(3, 6, 80)];

describe('calculateEarnings', () => {
  it('gives the instructor 70% of each paid sale', () => {
    const result = calculateEarnings([invoice(1, 'paid', [[1, 100]])], COURSES, 5);
    expect(result).toEqual(jasmine.objectContaining({ sales: 1, gross: 100, earned: 70, platform: 30 }));
    expect(result.rows[0]).toEqual(jasmine.objectContaining({ invoiceId: 1, courseId: 1, courseTitle: 'Course 1', price: 100, share: 70 }));
  });

  it('counts only the instructor\'s courses inside a mixed invoice', () => {
    const result = calculateEarnings([invoice(1, 'paid', [[1, 100], [3, 80]])], COURSES, 5);
    expect(result).toEqual(jasmine.objectContaining({ sales: 1, gross: 100, earned: 70 }));
    expect(calculateEarnings([invoice(1, 'paid', [[1, 100], [3, 80]])], COURSES, 6)).toEqual(jasmine.objectContaining({ gross: 80, earned: 56 }));
  });

  it('ignores pending and refunded invoices', () => {
    const invoices = [invoice(1, 'pending', [[1, 100]]), invoice(2, 'refunded', [[2, 50]]), invoice(3, 'paid', [[2, 50]])];
    expect(calculateEarnings(invoices, COURSES, 5)).toEqual(jasmine.objectContaining({ sales: 1, gross: 50, earned: 35 }));
  });

  it('ignores subscription invoices', () => {
    expect(calculateEarnings([invoice(1, 'paid', [[1, 19.99]], 'subscription')], COURSES, 5).sales).toBe(0);
  });

  it('sums many sales and rounds to cents', () => {
    const invoices = [invoice(1, 'paid', [[1, 19.99]]), invoice(2, 'paid', [[1, 19.99]]), invoice(3, 'paid', [[2, 0.1]])];
    const result = calculateEarnings(invoices, COURSES, 5);
    expect(result.sales).toBe(3);
    expect(result.gross).toBe(40.08);
    expect(result.earned).toBe(28.05); // 13.99 + 13.99 + 0.07 (each share rounded to cents)
    expect(result.platform).toBe(12.03);
  });

  it('supports a different revenue rate', () => {
    expect(calculateEarnings([invoice(1, 'paid', [[1, 100]])], COURSES, 5, 0.5).earned).toBe(50);
  });

  it('returns zeros when there are no sales or the instructor has no courses', () => {
    expect(calculateEarnings([], COURSES, 5)).toEqual({ rows: [], sales: 0, gross: 0, earned: 0, platform: 0 });
    expect(calculateEarnings([invoice(1, 'paid', [[1, 100]])], COURSES, 99).sales).toBe(0);
  });
});
