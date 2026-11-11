
import { Component, inject } from '@angular/core';
import { Payment } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { InvoiceService } from '../invoice.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [],
  templateUrl: './payments.html',
  styleUrl: './payments.css'
})
export class Payments {
  private invoiceService = inject(InvoiceService);
  private authService = inject(AuthService);

  payments: Payment[] = [];

  constructor() {
    this.loadPayments();
  }

  loadPayments(): void {
    const user = this.authService.currentUser();

    if (!user) {
      this.payments = [];
      return;
    }

    this.payments = this.invoiceService.getStudentPayments(user.id);
  }

    // Sum of all payments, rounded to cents
  get totalPaid(): number {
    const sum = this.payments.reduce((total, payment) => total + payment.amount, 0);
    return Math.round(sum * 100) / 100;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}