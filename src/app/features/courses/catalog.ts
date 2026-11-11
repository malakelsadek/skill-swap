import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CATEGORIES } from '../../core/config';
import { Category } from '../../core/models';
import { StorageService } from '../../core/services/storage.service';
import { CourseService } from './course.service';

const CATEGORY_COOKIE = 'sw_last_category';

@Component({
  selector: 'app-catalog',
  imports: [RouterLink],
  template: `
    <section class="container">
      <h1>Courses</h1>

      <div class="filters card">
        <div>
          <label for="search">Search</label>
          <input
            id="search"
            type="search"
            placeholder="Search by title, topic or category"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        </div>
        <div>
          <label for="category">Category</label>
          <select id="category" [value]="category()" (change)="setCategory($any($event.target).value)">
            <option value="">All categories</option>
            @for (c of categories; track c) {
              <option [value]="c" [selected]="category() === c">{{ c }}</option>
            }
          </select>
        </div>
        <div>
          <label for="sort">Sort by</label>
          <select id="sort" [value]="sort()" (change)="sort.set($any($event.target).value)">
            <option value="title">Title (A-Z)</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
          </select>
        </div>
      </div>

      <p class="count" role="status">{{ results().length }} course{{ results().length === 1 ? '' : 's' }} found</p>

      @if (results().length) {
        <div class="grid">
          @for (c of results(); track c.id) {
            <a class="card course" [routerLink]="['/courses', c.id]">
              <img [src]="c.thumbnail" [alt]="c.title + ' thumbnail'" loading="lazy" width="320" height="180" />
              <span class="badge">{{ c.category }}</span>
              <h2>{{ c.title }}</h2>
              <p class="by">by {{ instructorName(c.instructorId) }}</p>
              <p class="meta">
                <strong>\${{ c.price.toFixed(2) }}</strong>
              </p>
            </a>
          }
        </div>
      } @else {
        <div class="card empty">
          <p>No courses match your search.</p>
          <button class="btn secondary" type="button" (click)="reset()">Clear filters</button>
        </div>
      }
    </section>
  `,
  styles: `
    .filters { display: grid; gap: 0.2rem 1rem; grid-template-columns: 1fr; margin-bottom: 0.5rem; }
    @media (min-width: 768px) { .filters { grid-template-columns: 2fr 1fr 1fr; } }
    .count { color: var(--muted); }
    .course { display: block; text-decoration: none; color: inherit; }
    .course img { width: 100%; border-radius: 8px; display: block; background: #e8eef9; }
    .course h2 { font-size: 1.05rem; margin: 0.4rem 0 0; color: var(--primary); }
    .badge { display: inline-block; margin-top: 0.6rem; padding: 0.1rem 0.6rem; border-radius: 999px; background: #e8eef9; font-size: 0.8rem; }
    .by { margin: 0.2rem 0; color: var(--muted); font-size: 0.9rem; }
    .meta { display: flex; justify-content: space-between; margin: 0.3rem 0 0; }
    .empty { text-align: center; }
  `,
})
export class Catalog {
  private courseService = inject(CourseService);
  private storage = inject(StorageService);
  private route = inject(ActivatedRoute);

  categories = CATEGORIES;
  // Local UI state lives in signals inside this component; only the chosen category is remembered (cookie).
  query = signal('');
  category = signal<Category | ''>(this.initialCategory());
  sort = signal<'title' | 'priceAsc' | 'priceDesc'>('title');

  results = computed(() => {
    const list = [...this.courseService.search(this.query(), this.category())];
    switch (this.sort()) {
      case 'priceAsc': return list.sort((a, b) => a.price - b.price);
      case 'priceDesc': return list.sort((a, b) => b.price - a.price);
      default: return list.sort((a, b) => a.title.localeCompare(b.title));
    }
  });

  setCategory(value: Category | '') {
    this.category.set(value);
    if (value) this.storage.cookie.set(CATEGORY_COOKIE, value, 30);
    else this.storage.cookie.remove(CATEGORY_COOKIE);
  }

  reset() {
    this.query.set('');
    this.setCategory('');
  }

  instructorName(id: number): string {
    return this.courseService.instructorName(id);
  }

  /** A ?category=Design link (from Home) wins over the remembered cookie. */
  private initialCategory(): Category | '' {
    const fromUrl = this.route.snapshot.queryParamMap.get('category');
    return CATEGORIES.find((c) => c === fromUrl) ?? this.savedCategory();
  }

  private savedCategory(): Category | '' {
    const saved = this.storage.cookie.get(CATEGORY_COOKIE);
    return CATEGORIES.find((c) => c === saved) ?? '';
  }
}
