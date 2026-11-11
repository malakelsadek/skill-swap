import { Component, inject } from '@angular/core';
import { Invoice, Refund } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { InvoiceService } from '../invoice.service';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css'
})
export class Invoices {
  private invoiceService = inject(InvoiceService);
  authService = inject(AuthService);

  invoices: Invoice[] = [];
  refunds: Refund[] = [];
  refundMessage = '';
  paymentMessage = '';
  refundOpenId: number | null = null; // the invoice whose refund form is open

  constructor() {
    this.loadInvoices();
  }

  get isStudent(): boolean {
    return this.authService.currentUser()?.role === 'student';
  }

  loadInvoices(): void {
    const user = this.authService.currentUser();

    if (!user) {
      this.invoices = [];
      this.refunds = [];
      return;
    }

    if (user.role === 'student') {
      this.invoices = this.invoiceService.getStudentInvoices(user.id);
      this.refunds = this.invoiceService.getStudentRefunds(user.id);
    } else {
      this.invoices = this.invoiceService.getAllInvoices();
      this.refunds = this.invoiceService.getAllRefunds();
    }
  }

  // The LATEST request for an invoice: after a rejection the student can ask again,
  // and then the new request must be the one that is shown.
  refundFor(invoiceId: number): Refund | undefined {
    return this.refunds.filter(refund => refund.invoiceId === invoiceId).at(-1);
  }

  canRequestRefund(invoice: Invoice): boolean {
    if (invoice.status !== 'paid') return false;

    const refund = this.refundFor(invoice.id);
    return !refund || refund.status === 'rejected';
  }

  // Mark payment (pending -> paid) for an invoice created with "Pay Later"
  payNow(invoiceId: number): void {
    const user = this.authService.currentUser();

    if (!user || user.role !== 'student') return;

    const payment = this.invoiceService.markPaid(invoiceId, user.id);

    if (!payment) {
      this.paymentMessage = 'Unable to pay this invoice.';
      return;
    }

    this.paymentMessage = `Invoice #${invoiceId} paid. Thank you!`;
    this.loadInvoices();
  }

  openRefund(invoiceId: number): void {
    this.refundMessage = '';
    this.refundOpenId = invoiceId;
  }

  closeRefund(): void {
    this.refundOpenId = null;
  }

  submitRefund(invoiceId: number, reasonInput: HTMLInputElement): void {
    const user = this.authService.currentUser();
    const reason = reasonInput.value.trim();

    if (!user || user.role !== 'student') return;

    if (!reason) {
      this.refundMessage = 'Please enter a reason for your refund request.';
      return;
    }

    const refund = this.invoiceService.requestRefund(invoiceId, user.id, reason);

    if (!refund) {
      this.refundMessage = 'Unable to submit this refund request.';
      return;
    }

    this.refunds = [...this.refunds, refund];
    this.refundMessage = 'Your refund request has been submitted.';
    this.refundOpenId = null;
    reasonInput.value = '';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}