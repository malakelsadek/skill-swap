import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './core/services/auth.service';
import { SeedService } from './core/services/seed.service';

async function render(loginAs?: string) {
  localStorage.clear();
  sessionStorage.clear();
  TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] });
  TestBed.inject(SeedService).init();
  if (loginAs) TestBed.inject(AuthService).login(loginAs, 'Pass1234');
  const fixture = TestBed.createComponent(App);
  await fixture.whenStable();
  return (fixture.nativeElement as HTMLElement).querySelector('nav')!.textContent!;
}

describe('App navbar', () => {
  it('shows Log in and Sign up to visitors only', async () => {
    const nav = await render();
    expect(nav).toContain('Log in');
    expect(nav).toContain('Sign up');
    expect(nav).not.toContain('Payroll');
    expect(nav).not.toContain('Log out');
  });

  it('shows student links but not accounting links to a student', async () => {
    const nav = await render('student1');
    expect(nav).toContain('Cart');
    expect(nav).toContain('Log out');
    expect(nav).not.toContain('Payroll');
  });

  it('shows accounting links to the accountant', async () => {
    const nav = await render('accountant');
    expect(nav).toContain('Payroll');
    expect(nav).not.toContain('Cart');
  });
});
