import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { KEYS, SUBSCRIPTION_PRICE } from '../../core/config';
import { Enrollment } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { SoundService } from '../../core/services/sound.service';
import { StorageService } from '../../core/services/storage.service';
import { SuccessCheck } from '../../shared/success-check/success-check';
import { CartService } from '../student/cart.service';
import { CourseService } from './course.service';

@Component({
  selector: 'app-course-detail',
  imports: [RouterLink, SuccessCheck],
  template: `
    <section class="container">
      <a routerLink="/courses">&larr; All courses</a>

      @if (course(); as c) {
        <div class="detail">
          <img [src]="c.thumbnail" [alt]="c.title + ' thumbnail'" width="320" height="180" />
          <div class="info card">
            <span class="badge">{{ c.category }}</span>
            <h1>{{ c.title }}</h1>
            <p class="by">by {{ instructorName() }}</p>
            <p>{{ c.description }}</p>
            <p class="price">\${{ c.price.toFixed(2) }}</p>

            @if (!auth.isLoggedIn()) {
              <p>
                <a class="btn" [routerLink]="['/login']" [queryParams]="{ returnUrl: '/courses/' + c.id }">Log in to buy this course</a>
              </p>
            } @else if (auth.hasRole('student')) {
              @if (owned()) {
                <p class="ok"><app-success-check /> You already own this course</p>
              } @else {
                <div class="actions">
                  <button class="btn" type="button" [disabled]="inCart()" (click)="addToCart()">
                    {{ inCart() ? 'In your cart' : 'Add to cart' }}
                  </button>
                  <button class="btn secondary" type="button" (click)="subscribe()">
                    Subscribe (\${{ plan }}/month)
                  </button>
                </div>
                @if (inCart()) { <p role="status"><a routerLink="/cart">Go to cart</a></p> }
              }
            } @else if (courses.canManage(c)) {
              <a class="btn" routerLink="/instructor">Manage this course</a>
            } @else {
              <p class="muted">Only student accounts can buy courses.</p>
            }
          </div>
        </div>
      } @else {
        <div class="card">
          <h1>Course not found</h1>
          <p>This course does not exist or was removed.</p>
          <a class="btn" routerLink="/courses">Browse courses</a>
        </div>
      }
    </section>
  `,
  styles: `
    .detail { display: grid; gap: 1rem; margin-top: 0.8rem; grid-template-columns: 1fr; }
    @media (min-width: 768px) { .detail { grid-template-columns: 1fr 2fr; align-items: start; } }
    .detail img { width: 100%; border-radius: 10px; }
    .badge { display: inline-block; padding: 0.1rem 0.6rem; border-radius: 999px; background: #e8eef9; font-size: 0.8rem; }
    h1 { margin: 0.4rem 0; }
    .by, .muted { color: var(--muted); }
    .price { font-size: 1.6rem; font-weight: 700; color: var(--primary); margin: 0.5rem 0; }
    .actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
    .ok { display: flex; align-items: center; gap: 0.5rem; color: var(--success); }
  `,
})
export class CourseDetail {
  auth = inject(AuthService);
  courses = inject(CourseService);
  private storage = inject(StorageService);
  private sound = inject(SoundService);
  private router = inject(Router);

  plan = SUBSCRIPTION_PRICE.toFixed(2);
  private id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => Number(p.get('id')))), { initialValue: NaN });
  course = computed(() => this.courses.get(this.id()));
  instructorName = computed(() => {
    const c = this.course();
    return c ? this.courses.instructorName(c.instructorId) : '';
  });

  private cartService = inject(CartService);
  inCart = computed(() => this.cartService.cart().some((c) => c.id === this.id()));

  owned = computed(() => {
    const me = this.auth.currentUser();
    const list = this.storage.local.get<Enrollment[]>(KEYS.enrollments) ?? [];
    return !!me && list.some((e) => e.studentId === me.id && e.courseId === this.id());
  });

  addToCart() {
    if (this.inCart()) return;
    this.cartService.add(this.id());
    this.sound.play('cart');
  }

  /** The subscription is paid for at checkout (Member 3). */
  subscribe() {
    this.router.navigate(['/checkout'], { queryParams: { plan: 'subscription' } });
  }
}
