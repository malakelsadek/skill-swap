import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES } from '../../core/config';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <h1>Learn a skill. Share a skill.</h1>
      <p>
        SkillSwap is an online course marketplace. Instructors publish courses, and students buy them one
        by one or with a subscription, all in one place.
      </p>
      <div class="actions">
        @if (!auth.isLoggedIn()) {
          <a class="btn cta" routerLink="/signup">Sign up</a>
          <a class="btn secondary" routerLink="/login">Log in</a>
        }
        <a class="btn secondary" routerLink="/courses">Browse courses</a>
        <a class="btn secondary" routerLink="/profile">My profile</a>
      </div>
    </section>

    <section class="container">
      <h2>How it works</h2>
      <div class="grid steps">
        <div class="card"><h3>1. Browse</h3><p>Find courses in Design, Business and Programming.</p></div>
        <div class="card"><h3>2. Buy</h3><p>Add several courses to your cart, or subscribe monthly.</p></div>
        <div class="card"><h3>3. Learn</h3><p>See your invoices and payment history any time.</p></div>
        <div class="card"><h3>4. Teach</h3><p>Instructors publish courses and earn a share of every sale.</p></div>
      </div>

      <h2>Categories</h2>
      <div class="grid cats">
        @for (c of categories; track c) {
          <a class="card cat" routerLink="/courses" [queryParams]="{ category: c }">{{ c }}</a>
        }
      </div>
    </section>
  `,
  styles: `
    .hero {
      text-align: center;
      padding: 3rem 1rem;
      color: #fff;
      background: linear-gradient(135deg, var(--primary), #3b6cb7);
    }
    .hero h1 { color: #fff; margin-top: 0; }
    .hero p { max-width: 40rem; margin: 0 auto 1.5rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; }
    .hero .btn.secondary { background: transparent; color: #fff; border-color: #fff; }
    .hero .btn.cta { background: var(--accent); }
    h2 { color: var(--primary); margin-top: 2rem; }
    .steps { grid-template-columns: 1fr; }
    .cats { grid-template-columns: 1fr; }
    .cat {
      text-align: center;
      font-size: 1.2rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.15s;
    }
    .cat:hover { transform: translateY(-4px); }
    @media (min-width: 600px) { .steps { grid-template-columns: repeat(2, 1fr); } .cats { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 992px) { .steps { grid-template-columns: repeat(4, 1fr); } }
  `,
})
export class Home {
  auth = inject(AuthService);
  categories = CATEGORIES;
}
