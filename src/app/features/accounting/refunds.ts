import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RefundService } from './refund.service';

// Component state (message) = signal here; refund data and decisions = RefundService.
@Component({
  selector: 'app-refunds',
  imports: [DatePipe],
  template: `
    <section class="wrap">
      <header class="head">
        <h1>Refund approvals</h1>
        <button type="button" class="ghost" (click)="svc.reload()">Refresh</button>
      </header>
      <p class="muted">{{ svc.pendingCount() }} pending request(s). Approving a refund marks the invoice refunded and adds it to the department budget.</p>
      @if (message()) { <p class="msg" [class.error]="isError()" role="status">{{ message() }}</p> }

      <div class="table-scroll">
        <table>
          <thead><tr><th>Date</th><th>Student</th><th>Invoice</th><th>Courses</th><th>Amount</th><th>Reason</th><th>Status</th><th></th></tr></thead>
          <tbody>
            @for (r of svc.rows(); track r.refund.id) {
              <tr>
                <td data-label="Date">{{ r.refund.date | date: 'dd/MM/yyyy' }}</td>
                <td data-label="Student">{{ r.studentName }}</td>
                <td data-label="Invoice">#{{ r.refund.invoiceId }}</td>
                <td data-label="Courses">{{ r.courses }}</td>
                <td data-label="Amount">{{ r.total }}</td>
                <td data-label="Reason">{{ r.refund.reason }}</td>
                <td data-label="Status"><span class="badge" [class]="r.refund.status">{{ r.refund.status }}</span></td>
                <td class="actions">
                  @if (r.refund.status === 'pending') {
                    <button type="button" (click)="approve(r.refund.id)">Approve</button>
                    <button type="button" class="danger" (click)="reject(r.refund.id)">Reject</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8">No refund requests yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: `
    .wrap { max-width: 1100px; margin: 0 auto; padding: 16px; }
    .head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .muted { color: #666; }
    .msg { color: #2f9e6f; } .msg.error { color: #d64545; }
    button { padding: 8px 10px; font: inherit; border: 1px solid #2f6fed; border-radius: 6px; cursor: pointer; background: #2f6fed; color: #fff; }
    button.ghost { background: transparent; color: inherit; border-color: #ccc; }
    button.danger { background: #d64545; border-color: #d64545; }
    .table-scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    .actions { display: flex; gap: 6px; }
    .badge { padding: 2px 8px; border-radius: 999px; font-size: 0.85em; background: #eee; }
    .badge.approved { background: #d8f3e6; } .badge.rejected { background: #fbdcdc; } .badge.pending { background: #fff0cc; }
    @media (max-width: 640px) {
      thead { display: none; }
      tr { display: block; margin-bottom: 12px; border: 1px solid #e5e5e5; border-radius: 8px; }
      td { display: flex; justify-content: space-between; gap: 12px; border: 0; }
      td[data-label]::before { content: attr(data-label); font-weight: 600; }
    }
  `,
})
export class Refunds {
  protected readonly svc = inject(RefundService);
  protected readonly message = signal('');
  protected readonly isError = signal(false);

  constructor() {
    this.svc.reload(); // pick up requests students sent after this service was created
  }

  protected approve(id: number): void {
    this.report(this.svc.approve(id), 'Refund approved');
  }

  protected reject(id: number): void {
    this.report(this.svc.reject(id), 'Refund rejected');
  }

  private report(error: string | null, success: string): void {
    this.isError.set(!!error);
    this.message.set(error ?? success);
  }
}