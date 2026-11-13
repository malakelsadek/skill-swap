import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KEYS, REVENUE_SHARE } from '../../core/config';
import { Invoice } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { StorageService } from '../../core/services/storage.service';
import { CourseService } from '../courses/course.service';
import { calculateEarnings } from './earnings.calc';

@Component({
  selector: 'app-earnings',
  imports: [RouterLink, DatePipe],
  template: `
    <section class="container">
      <a routerLink="/instructor">&larr; My courses</a>
      <h1>My earnings</h1>
      <p class="muted">You receive {{ share }}% of every paid course sale. Pending and refunded invoices are not counted.</p>

      <div class="grid stats">
        <div class="card"><p class="label">Paid sales</p><p class="value">{{ data().sales }}</p></div>
        <div class="card"><p class="label">Total sales</p><p class="value">\${{ data().gross.toFixed(2) }}</p></div>
        <div class="card"><p class="label">Your earnings</p><p class="value earn">\${{ data().earned.toFixed(2) }}</p></div>
        <div class="card"><p class="label">Platform share</p><p class="value">\${{ data().platform.toFixed(2) }}</p></div>
      </div>

      <h2>Sales</h2>
      @if (data().rows.length) {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Course</th><th>Invoice</th><th>Sale price</th><th>Your share</th></tr>
            </thead>
            <tbody>
              @for (r of data().rows; track r.invoiceId + '-' + r.courseId) {
                <tr>
                  <td>{{ r.date | date: 'dd/MM/yyyy' }}</td>
                  <td>{{ r.courseTitle }}</td>
                  <td>#{{ r.invoiceId }}</td>
                  <td>\${{ r.price.toFixed(2) }}</td>
                  <td>\${{ r.share.toFixed(2) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="card"><p>No paid sales yet. Earnings appear here when students pay for your courses.</p></div>
      }
    </section>
  `,
  styles: `
    .muted { color: var(--muted); }
    .stats { margin: 1rem 0; }
    .label { margin: 0; color: var(--muted); font-size: 0.9rem; }
    .value { margin: 0.2rem 0 0; font-size: 1.5rem; font-weight: 700; color: var(--primary); }
    .earn { color: var(--success); }
  `,
})
export class Earnings {
  private auth = inject(AuthService);
  private storage = inject(StorageService);
  private courses = inject(CourseService);

  share = Math.round(REVENUE_SHARE * 100);

  /** An instructor sees only their own sales; an admin sees the total over every instructor. */
  data = computed(() => {
    const me = this.auth.currentUser();
    const invoices = this.storage.local.get<Invoice[]>(KEYS.invoices) ?? [];
    const all = this.courses.list();
    if (me?.role === 'admin') {
      const ids = [...new Set(all.map((c) => c.instructorId))];
      const parts = ids.map((id) => calculateEarnings(invoices, all, id));
      const rows = parts.flatMap((p) => p.rows).sort((a, b) => b.date.localeCompare(a.date));
      const sum = (key: 'gross' | 'earned' | 'platform') => Math.round(parts.reduce((s, p) => s + p[key], 0) * 100) / 100;
      return { rows, sales: rows.length, gross: sum('gross'), earned: sum('earned'), platform: sum('platform') };
    }
    const result = calculateEarnings(invoices, all, me?.id ?? -1);
    return { ...result, rows: [...result.rows].sort((a, b) => b.date.localeCompare(a.date)) };
  });
}
