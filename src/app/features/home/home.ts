import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES } from '../../core/config';

const STEPS = [
  { img: 'step-browse', title: 'Browse', text: 'Explore courses in Design, Business and Programming.' },
  { img: 'step-buy', title: 'Buy', text: 'Add several courses to your cart, or subscribe monthly.' },
  { img: 'step-learn', title: 'Learn', text: 'Keep every invoice and see your payment history any time.' },
  { img: 'step-teach', title: 'Teach', text: 'Instructors publish courses and earn a share of every sale.' },
];

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-text">
          <span class="eyebrow">Online course marketplace</span>
          <h1>Learn a skill. <span>Share a skill.</span></h1>
          <p>
            SkillSwap is where instructors publish courses and students buy them one by one or with a
            subscription. Pick up a new skill today, or teach the one you already have.
          </p>
          <a class="btn cta browse" routerLink="/courses">Browse courses</a>
        </div>
        <img class="hero-img" src="/images/hero.svg" alt="An online lesson on a laptop" />
      </div>
    </section>

    <section class="container">
      <h2>Explore categories</h2>
      <div class="cats">
        @for (c of categories; track c) {
          <a class="cat" [routerLink]="['/courses']" [queryParams]="{ category: c }">
            <img [src]="'/images/cat-' + c.toLowerCase() + '.svg'" [alt]="c + ' courses'" loading="lazy" />
            <strong class="cat-label">{{ c }}</strong>
          </a>
        }
      </div>
    </section>

    <section class="how">
      <div class="container">
        <h2>How it works</h2>
        <div class="steps">
          @for (s of steps; track s.title; let i = $index) {
            <div class="step">
              <img [src]="'/images/' + s.img + '.svg'" [alt]="s.title" loading="lazy" />
              <h3><span class="num">{{ i + 1 }}</span> {{ s.title }}</h3>
              <p>{{ s.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .hero { background: linear-gradient(180deg, var(--tint), var(--bg)); }
    .hero-inner { max-width: 1140px; margin: 0 auto; padding: 2rem 1rem 1.5rem; display: grid; gap: 1.5rem; align-items: center; }
    .eyebrow { display: inline-block; padding: 0.25rem 0.8rem; border-radius: 999px; background: var(--accent-tint); color: var(--accent-dark); font-weight: 700; font-size: 0.85rem; }
    .hero h1 { margin: 0.7rem 0; font-size: 2.2rem; }
    .hero h1 span { color: var(--accent); }
    .hero p { color: var(--muted); font-size: 1.05rem; max-width: 34rem; }
    .browse { margin-top: 0.4rem; }
    .hero-img { width: 100%; max-width: 560px; justify-self: center; }

    h2 { margin: 1.6rem 0 0.9rem; }

    .cats { display: grid; gap: 1rem; grid-template-columns: 1fr; }
    .cat { position: relative; display: block; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); text-decoration: none; transition: transform 0.15s; }
    .cat:hover { transform: translateY(-4px); }
    .cat img { display: block; width: 100%; }
    .cat-label { position: absolute; left: 0; right: 0; bottom: 0; padding: 0.8rem 1rem; color: #fff; font-size: 1.2rem; background: linear-gradient(transparent, rgba(10, 42, 99, 0.9)); }

    .how { background: #fff; margin-top: 2rem; border-top: 1px solid var(--border); }
    .steps { display: grid; gap: 1.2rem; grid-template-columns: 1fr; padding-bottom: 1.5rem; }
    .step { text-align: center; }
    .step img { width: 110px; height: 110px; }
    .step h3 { margin: 0.5rem 0 0.2rem; }
    .step p { margin: 0; color: var(--muted); }
    .num { display: inline-grid; place-items: center; width: 1.6rem; height: 1.6rem; margin-right: 0.3rem; border-radius: 50%; background: var(--accent); color: #fff; font-size: 0.9rem; }

    @media (min-width: 600px) {
      .cats { grid-template-columns: repeat(3, 1fr); }
      .steps { grid-template-columns: repeat(2, 1fr); }
    }
    @media (min-width: 992px) {
      .hero-inner { grid-template-columns: 1.1fr 1fr; padding: 3rem 1rem 2.5rem; }
      .hero h1 { font-size: 3rem; }
      .steps { grid-template-columns: repeat(4, 1fr); }
    }
  `,
})
export class Home {
  categories = CATEGORIES;
  steps = STEPS;
}
