import { Injectable, computed, inject, signal } from '@angular/core';
import { CATEGORIES, KEYS } from '../../core/config';
import { BudgetEntry, Category } from '../../core/models';
import { StorageService } from '../../core/services/storage.service';

export interface DepartmentSummary {
  department: Category;
  income: number;
  expenses: number;
  marketing: number;
  refunds: number;
  net: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarize(entries: BudgetEntry[]): DepartmentSummary[] {
  return CATEGORIES.map((department) => {
    const sum = (type: BudgetEntry['type']) =>
      round2(entries.filter((e) => e.department === department && e.type === type).reduce((t, e) => t + e.amount, 0));
    const income = sum('income');
    const expenses = sum('expense');
    const marketing = sum('marketing');
    const refunds = sum('refund');
    return { department, income, expenses, marketing, refunds, net: round2(income - expenses - marketing - refunds) };
  });
}

const SEED: BudgetEntry[] = [
  { id: 1, department: 'Design', type: 'income', amount: 42000, date: '2026-10-05', note: 'Course sales' },
  { id: 2, department: 'Design', type: 'expense', amount: 9000, date: '2026-10-08', note: 'Platform costs' },
  { id: 3, department: 'Design', type: 'marketing', amount: 5000, date: '2026-10-10', note: 'Social ads' },
  { id: 4, department: 'Business', type: 'income', amount: 58000, date: '2026-10-06', note: 'Course sales' },
  { id: 5, department: 'Business', type: 'expense', amount: 12000, date: '2026-10-09', note: 'Content production' },
  { id: 6, department: 'Business', type: 'marketing', amount: 8000, date: '2026-10-11', note: 'Search ads' },
  { id: 7, department: 'Business', type: 'refund', amount: 2500, date: '2026-10-20', note: 'Refunds' },
  { id: 8, department: 'Programming', type: 'income', amount: 76000, date: '2026-10-07', note: 'Course sales' },
  { id: 9, department: 'Programming', type: 'expense', amount: 15000, date: '2026-10-12', note: 'Hosting and tools' },
  { id: 10, department: 'Programming', type: 'marketing', amount: 11000, date: '2026-10-15', note: 'Influencer campaign' },
  { id: 11, department: 'Programming', type: 'refund', amount: 3200, date: '2026-10-22', note: 'Refunds' },
];

/**
 * Department budget (Design, Business, Programming).
 * State strategy: one signal holds the entries and a computed signal holds the summary,
 * so the chart and tables update together; entries are saved to localStorage via StorageService.
 * add returns an error message, or null on success.
 */
@Injectable({ providedIn: 'root' })
export class BudgetService {
  private storage = inject(StorageService);

  readonly entries = signal<BudgetEntry[]>(this.load());
  readonly summary = computed(() => summarize(this.entries()));

  private load(): BudgetEntry[] {
    this.storage.seedIfEmpty(KEYS.budget, SEED);
    return this.storage.local.get<BudgetEntry[]>(KEYS.budget) ?? SEED;
  }

  private save(list: BudgetEntry[]): void {
    this.storage.local.set(KEYS.budget, list);
    this.entries.set(list);
  }

  /** Re-reads localStorage (another service may have changed it). */
  reload(): void {
    this.entries.set(this.storage.local.get<BudgetEntry[]>(KEYS.budget) ?? []);
  }

  add(data: Omit<BudgetEntry, 'id'>): string | null {
    if (!Number.isFinite(data.amount) || data.amount <= 0) return 'Amount must be more than 0';
    if (!data.note.trim()) return 'Note is required';
    const id = Math.max(0, ...this.entries().map((e) => e.id)) + 1;
    this.save([...this.entries(), { ...data, amount: round2(data.amount), note: data.note.trim(), id }]);
    return null;
  }

  remove(id: number): void {
    this.save(this.entries().filter((e) => e.id !== id));
  }

  /** Called when the accountant approves a refund. */
  addRefund(department: Category, amount: number, note = 'Approved refund'): string | null {
    return this.add({ department, type: 'refund', amount, note, date: new Date().toISOString().slice(0, 10) });
  }
}