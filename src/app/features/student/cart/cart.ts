import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  private cartService = inject(CartService);

  cart = this.cartService.cart;
  total = this.cartService.total;

  constructor() {
    this.cartService.refresh();
  }

  removeCourse(courseId: number): void {
    this.cartService.remove(courseId);
  }

  clearCart(): void {
    this.cartService.clear();
  }
}
