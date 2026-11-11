import { Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CartService } from '../cart.service';
import { InvoiceService } from '../invoice.service';
import { AuthService } from '../../../core/services/auth.service';
import { SUBSCRIPTION_PRICE } from '../../../core/config';
import { Invoice } from '../../../core/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout {
  private cartService = inject(CartService);
  private invoiceService = inject(InvoiceService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  cart = this.cartService.cart;
  total = this.cartService.total;

  isSubscription = this.route.snapshot.queryParamMap.get('plan') === 'subscription';
  subscriptionPrice = SUBSCRIPTION_PRICE;

  message = signal('');

  // Set after the order is placed: the invoice, and whether it was paid or left pending
  result = signal<{ invoice: Invoice; paid: boolean } | null>(null);

  constructor() {
    this.cartService.refresh(); // pick up courses added from the course page
  }

  payNow(): void {
    this.placeOrder(true);
  }

  payLater(): void {
    this.placeOrder(false);
  }

  private placeOrder(payNow: boolean): void {
    const student = this.authService.currentUser();

    if (!student) {
      this.message.set('Please log in before checkout.');
      return;
    }

    this.message.set('');
    let invoice: Invoice | null;

    if (this.isSubscription) {
      invoice = this.invoiceService.checkoutSubscription(student.id);
    } else {
      const courses = this.cart();

      if (courses.length === 0) {
        this.message.set('Your cart is empty.');
        return;
      }

      invoice = this.invoiceService.checkoutCourses(student.id, courses);

      if (!invoice) {
        this.message.set('You already own one of these courses. Remove it from your cart and try again.');
        return;
      }

      this.cartService.clear(); // the items now live on the invoice
    }

    // Mock payment: "Pay now" marks the invoice paid straight away, "Pay later" leaves it pending
    const paid = payNow && this.invoiceService.markPaid(invoice.id, student.id) !== null;
    this.result.set({ invoice, paid });
  }
}
