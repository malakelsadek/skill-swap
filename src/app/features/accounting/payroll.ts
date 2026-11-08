import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { PayrollService, calcNet } from './payroll.service';
import { Department, StaffMember } from './payroll.model';

const EMPTY = { name: '', jobTitle: '', department: 'Platform' as Department, baseSalary: 0, allowances: 0, deductions: 0 };

// Component state (form, editing id, month) = signals here; shared staff data = PayrollService.
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
        <input name="jobTitle" [(ngModel)]="form.jobTitle" placeholder="Job title" required />
        <select name="department" [(ngModel)]="form.department">
          @for (d of departments; track d) { <option [value]="d">{{ d }}</option> }
        </select>
        <input name="baseSalary" type="number" min="0" [(ngModel)]="form.baseSalary" placeholder="Salary" required />
        <input name="allowances" type="number" min="0" [(ngModel)]="form.allowances" placeholder="Allowances" />
        <input name="deductions" type="number" min="0" [(ngModel)]="form.deductions" placeholder="Deductions" />
        <button type="submit">{{ editingId() ? 'Save changes' : 'Add staff' }}</button>
        @if (editingId()) { <button type="button" class="ghost" (click)="cancel()">Cancel</button> }
      </form>

      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>Name</th><th>Title</th><th>Dept</th><th>Salary</th><th>Allowances</th><th>Deductions</th><th>Net</th><th></th></tr>
          </thead>
          <tbody>
            @for (s of svc.staff(); track s.id) {
              <tr>
                <td data-label="Name">{{ s.name }}</td>
                <td data-label="Title">{{ s.jobTitle }}</td>
                <td data-label="Dept">{{ s.department }}</td>
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
              <tr><td colspan="8">No staff yet.</td></tr>
            }
          </tbody>
          <tfoot><tr><td colspan="6">Total net payroll</td><td colspan="2"><strong>{{ total() | number }}</strong></td></tr></tfoot>
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
  protected readonly departments: Department[] = ['Design', 'Business', 'Programming', 'Platform'];
  protected readonly month = signal(new Date().toISOString().slice(0, 7));
  protected readonly editingId = signal<number | null>(null);
  protected readonly total = computed(() => this.svc.totalNet());
  protected form = { ...EMPTY };

  protected net(s: StaffMember): number {
    return calcNet(s);
  }

  protected submit(): void {
    const id = this.editingId();
    if (id) this.svc.update({ ...this.form, id });
    else this.svc.add({ ...this.form });
    this.cancel();
  }

  protected edit(s: StaffMember): void {
    this.editingId.set(s.id);
    this.form = { name: s.name, jobTitle: s.jobTitle, department: s.department, baseSalary: s.baseSalary, allowances: s.allowances, deductions: s.deductions };
  }

  protected cancel(): void {
    this.editingId.set(null);
    this.form = { ...EMPTY };
  }
}