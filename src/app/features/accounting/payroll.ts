import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Staff } from '../../core/models';
import { PayrollService, calcNet } from './payroll.service';

const EMPTY = { name: '', role: '', baseSalary: 0, allowances: 0, deductions: 0 };

// Component state (form, editing id, month, error) = signals/fields here; shared staff data = PayrollService.
@Component({
  selector: 'app-payroll',
  imports: [FormsModule, DecimalPipe],
  template: `
    <section class="wrap">
      <header class="head">
        <h1>Staff payroll</h1>
        <div class="report">
          <input type="month" [ngModel]="month()" (ngModelChange)="month.set($event)" aria-label="Report month" />
          <button type="button" (click)="svc.downloadReport(month())">Generate monthly report (JSON)</button>
        </div>
      </header>

      <form class="form" (ngSubmit)="submit()">
        <input name="name" [(ngModel)]="form.name" placeholder="Name" required />
        <input name="role" [(ngModel)]="form.role" placeholder="Role" required />
        <input name="baseSalary" type="number" min="0" [(ngModel)]="form.baseSalary" placeholder="Salary" required />
        <input name="allowances" type="number" min="0" [(ngModel)]="form.allowances" placeholder="Allowances" />
        <input name="deductions" type="number" min="0" [(ngModel)]="form.deductions" placeholder="Deductions" />
        <button type="submit">{{ editingId() ? 'Save changes' : 'Add staff' }}</button>
        @if (editingId()) { <button type="button" class="ghost" (click)="cancel()">Cancel</button> }
      </form>
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>Name</th><th>Role</th><th>Salary</th><th>Allowances</th><th>Deductions</th><th>Net</th><th></th></tr>
          </thead>
          <tbody>
            @for (s of svc.staff(); track s.id) {
              <tr>
                <td data-label="Name">{{ s.name }}</td>
                <td data-label="Role">{{ s.role }}</td>
                <td data-label="Salary">{{ s.baseSalary | number }}</td>
                <td data-label="Allowances">{{ s.allowances | number }}</td>
                <td data-label="Deductions">{{ s.deductions | number }}</td>
                <td data-label="Net"><strong>{{ net(s) | number }}</strong></td>
                <td class="actions">
                  <button type="button" (click)="edit(s)">Edit</button>
                  <button type="button" class="danger" (click)="svc.remove(s.id)">Delete</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7">No staff yet.</td></tr>
            }
          </tbody>
          <tfoot><tr><td colspan="5">Total net payroll</td><td colspan="2"><strong>{{ svc.totalNet() | number }}</strong></td></tr></tfoot>
        </table>
      </div>
    </section>
  `,
  styles: `
    .wrap { max-width: 1100px; margin: 0 auto; padding: 16px; }
    .head { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; }
    .report { display: flex; flex-wrap: wrap; gap: 8px; }
    .form { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin: 16px 0; }
    input, select, button { padding: 8px 10px; font: inherit; border: 1px solid #ccc; border-radius: 6px; }
    button { cursor: pointer; background: #2f6fed; color: #fff; border-color: #2f6fed; }
    button.ghost { background: transparent; color: inherit; border-color: #ccc; }
    button.danger { background: #d64545; border-color: #d64545; }
    .error { color: #d64545; margin: 0 0 12px; }
    .table-scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    .actions { display: flex; gap: 6px; }
    @media (max-width: 640px) {
      thead { display: none; }
      tr { display: block; margin-bottom: 12px; border: 1px solid #e5e5e5; border-radius: 8px; }
      td { display: flex; justify-content: space-between; border: 0; }
      td[data-label]::before { content: attr(data-label); font-weight: 600; }
    }
  `,
})
export class Payroll {
  protected readonly svc = inject(PayrollService);
  protected readonly month = signal(new Date().toISOString().slice(0, 7));
  protected readonly editingId = signal<number | null>(null);
  protected readonly error = signal('');
  protected form = { ...EMPTY };

  protected net(s: Staff): number {
    return calcNet(s);
  }

  protected submit(): void {
    const id = this.editingId();
    const error = id ? this.svc.update({ ...this.form, id }) : this.svc.add({ ...this.form });
    this.error.set(error ?? '');
    if (!error) this.cancel();
  }

  protected edit(s: Staff): void {
    this.editingId.set(s.id);
    this.error.set('');
    this.form = { name: s.name, role: s.role, baseSalary: s.baseSalary, allowances: s.allowances, deductions: s.deductions };
  }

  protected cancel(): void {
    this.editingId.set(null);
    this.form = { ...EMPTY };
  }
}