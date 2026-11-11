import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { KEYS } from '../../core/config';
import { Invoice } from '../../core/models';
import { StorageService } from '../../core/services/storage.service';
import { CourseService } from '../courses/course.service'; // adjust the path if the course service lives elsewhere
import { calculatePayouts } from './payout.calc';

// Component state (invoices snapshot) = signal here; courses = CourseService; the maths = payout.calc.ts.
@Component({
  selector: 'app-payouts',
  imports: [DecimalPipe],
  template: `
    <section class="wrap">
      <header class="head">
        <h1>Instructor payouts</h1>
        <div class="report">
          <button type="button" class="ghost" (click)="refresh()">Refresh</button>
          <button type="button" (click)="download()">Download report (JSON)</button>
        </div>
      </header>
      <p class="muted">Revenue share on paid course invoices. Pending, refunded and subscription invoices are not included.</p>

      <div class="table-scroll">
        <table>
          <thead><tr><th>Instructor</th><th>Sales</th><th>Gross</th><th>Instructor share</th><th>Platform</th></tr></thead>
          <tbody>
            @for (r of summary().rows; track r.instructorId) {
              <tr>
                <td data-label="Instructor">{{ r.instructorName }}</td>
                <td data-label="Sales">{{ r.sales }}</td>
                <td data-label="Gross">{{ r.gross | number: '1.2-2' }}</td>
                <td data-label="Instructor share"><strong>{{ r.earned | number: '1.2-2' }}</strong></td>
                <td data-label="Platform">{{ r.platform | number: '1.2-2' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="5">No instructors found.</td></tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2">Total</td>
              <td>{{ summary().totalGross | number: '1.2-2' }}</td>
              <td><strong>{{ summary().totalEarned | number: '1.2-2' }}</strong></td>
              <td>{{ summary().totalPlatform | number: '1.2-2' }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  `,
  styles: `
    .wrap { max-width: 1100px; margin: 0 auto; padding: 16px; }
    .head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; }
    .report { display: flex; gap: 8px; }
    .muted { color: #666; }
    button { padding: 8px 10px; font: inherit; border: 1px solid #2f6fed; border-radius: 6px; cursor: pointer; background: #2f6fed; color: #fff; }
    button.ghost { background: transparent; color: inherit; border-color: #ccc; }
    .table-scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    @media (max-width: 640px) {
      thead { display: none; }
      tr { display: block; margin-bottom: 12px; border: 1px solid #e5e5e5; border-radius: 8px; }
      td { display: flex; justify-content: space-between; border: 0; }
      td[data-label]::before { content: attr(data-label); font-weight: 600; }
      tfoot td { display: inline-block; }
    }
  `,
})
export class Payouts {
  private readonly storage = inject(StorageService);
  private readonly courses = inject(CourseService);
  private readonly invoices = signal<Invoice[]>(this.read());

  protected readonly summary = computed(() =>
    calculatePayouts(this.invoices(), this.courses.list(), this.courses.instructors()),
  );

  private read(): Invoice[] {
    return this.storage.local.get<Invoice[]>(KEYS.invoices) ?? [];
  }

  protected refresh(): void {
    this.invoices.set(this.read());
  }

  protected download(): void {
    const report = { generatedAt: new Date().toISOString(), ...this.summary() };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instructor-payouts-${report.generatedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}