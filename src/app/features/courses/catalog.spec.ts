import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SeedService } from '../../core/services/seed.service';
import { Catalog } from './catalog';

async function open(url: string) {
  localStorage.clear();
  document.cookie = 'sw_last_category=; Max-Age=0; path=/';
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'courses', component: Catalog }])] });
  TestBed.inject(SeedService).init();
  return RouterTestingHarness.create().then((h) => h.navigateByUrl(url, Catalog));
}

describe('Catalog category link from Home', () => {
  it('opens already filtered for /courses?category=Design', async () => {
    const page = await open('/courses?category=Design');
    expect(page.category()).toBe('Design');
    expect(page.results().every((c) => c.category === 'Design')).toBe(true);
  });

  it('ignores an unknown category', async () => {
    const page = await open('/courses?category=Cooking');
    expect(page.category()).toBe('');
  });
});
