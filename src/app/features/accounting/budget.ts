import { Component, DestroyRef, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { CATEGORIES } from '../../core/config';
import { BudgetEntry, Category } from '../../core/models';
import { BudgetService } from './budget.service';

Chart.register(...registerables);

// Component state (form fields, error) = fields/signals here; shared data = BudgetService.
@Component({
  selector: 'app-budget',
  imports: [FormsModule, DecimalPipe],
  template: `
    <section class="wrap">
      <h1>Department budget</h1>

      <div class="chart-box">
        <canvas #chart aria-label="Income and costs per department"></canvas>
      </div>

      <h2>Summary</h2>
      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>Department</th><th>Income</th><th>Expenses</th><th>Marketing</th><th>Refunds</th><th>Net</th></tr>
          </thead>
          <tbody>
            @for (s of svc.summary(); track s.department) {
              <tr>
                <td data-label="Department">{{ s.department }}</td>
                <td data-label="Income">{{ s.income | number }}</td>
                <td data-label="Expenses">{{ s.expenses | number }}</td>
                <td data-label="Marketing">{{ s.marketing | number }}</td>
                <td data-label="Refunds">{{ s.refunds | number }}</td>
                <td data-label="Net" [class.neg]="s.net < 0"><strong>{{ s.net | number }}</strong></td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <h2>Add entry</h2>
      <form class="form" (ngSubmit)="submit()">
        <select name="department" [(ngModel)]="form.department">
          @for (d of departments; track d) { <option [value]="d">{{ d }}</option> }
        </select>
        <select name="type" [(ngModel)]="form.type">
          @for (t of types; track t) { <option [value]="t">{{ t }}</option> }
        </select>
        <input name="amount" type="number" min="0" [(ngModel)]="form.amount" placeholder="Amount" required />
        <input name="note" [(ngModel)]="form.note" placeholder="Note" required />
        <input name="date" type="date" [(ngModel)]="form.date" required />
        <button type="submit">Add</button>
      </form>
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

      <h2>All entries</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th>Date</th><th>Department</th><th>Type</th><th>Note</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            @for (e of svc.entries(); track e.id) {
              <tr>
                <td data-label="Date">{{ e.date }}</td>
                <td data-label="Department">{{ e.department }}</td>
                <td data-label="Type">{{ e.type }}</td>
                <td data-label="Note">{{ e.note }}</td>
                <td data-label="Amount">{{ e.amount | number }}</td>
                <td><button type="button" class="danger" (click)="svc.remove(e.id)">Delete</button></td>
              </tr>
            } @empty {
              <tr><td colspan="6">No entries yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: `
    .wrap { max-width: 1100px; margin: 0 auto; padding: 16px; }
    .chart-box { position: relative; height: 320px; margin: 12px 0 24px; }
    .form { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-bottom: 12px; }
    input, select, button { padding: 8px 10px; font: inherit; border: 1px solid #ccc; border-radius: 6px; }
    button { cursor: pointer; background: #2f6fed; color: #fff; border-color: #2f6fed; }
    button.danger { background: #d64545; border-color: #d64545; }
    .error { color: #d64545; margin: 0 0 12px; }
    .table-scroll { overflow-x: auto; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    .neg { color: #d64545; }
    @media (max-width: 640px) {
      .chart-box { height: 260px; }
      thead { display: none; }
      tr { display: block; margin-bottom: 12px; border: 1px solid #e5e5e5; border-radius: 8px; }
      td { display: flex; justify-content: space-between; border: 0; }
      td[data-label]::before { content: attr(data-label); font-weight: 600; }
    }
  `,
})
export class Budget {
  protected readonly svc = inject(BudgetService);
  protected readonly departments = CATEGORIES;
  protected readonly types: BudgetEntry['type'][] = ['income', 'expense', 'marketing', 'refund'];
  protected readonly error = signal('');
  protected form = this.emptyForm();

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('chart');
  private chart?: Chart;

  constructor() {
    effect(() => {
      const el = this.canvas()?.nativeElement;
      const data = this.svc.summary();
      if (!el) return;
      const labels = data.map((d) => d.department);
      const datasets = [
        { label: 'Income', data: data.map((d) => d.income), backgroundColor: '#2f9e6f' },
        { label: 'Expenses', data: data.map((d) => d.expenses), backgroundColor: '#e0803a' },
        { label: 'Marketing', data: data.map((d) => d.marketing), backgroundColor: '#6a5acd' },
        { label: 'Refunds', data: data.map((d) => d.refunds), backgroundColor: '#d64545' },
      ];
      if (this.chart) {
        this.chart.data.labels = labels;
        this.chart.data.datasets.forEach((ds, i) => (ds.data = datasets[i].data));
        this.chart.update();
      } else {
        this.chart = new Chart(el, {
          type: 'bar',
          data: { labels, datasets },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } },
        });
      }
    });
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }

  private emptyForm() {
    return {
      department: 'Design' as Category,
      type: 'income' as BudgetEntry['type'],
      amount: 0,
      note: '',
      date: new Date().toISOString().slice(0, 10),
    };
  }

  protected submit(): void {
    const error = this.svc.add({ ...this.form });
    this.error.set(error ?? '');
    if (!error) this.form = this.emptyForm();
  }
}