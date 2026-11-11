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
  return fixture;
}

const el = (fixture: { nativeElement: unknown }) => fixture.nativeElement as HTMLElement;
const tabs = (fixture: { nativeElement: unknown }) => el(fixture).querySelector('nav')!.textContent!;
const corner = (fixture: { nativeElement: unknown }) => el(fixture).querySelector('.actions')!.textContent!;

describe('App navbar', () => {
  it('shows Log in, Sign up and a profile button to visitors, and no role tabs', async () => {
    const page = await render();
    expect(corner(page)).toContain('Log in');
    expect(corner(page)).toContain('Sign up');
    expect(el(page).querySelector('[aria-label="Profile"]')).toBeTruthy();
    expect(tabs(page)).not.toContain('Payroll');
  });

  it('shows student tabs, and Log out only inside the profile menu', async () => {
    const page = await render('student1');
    expect(tabs(page)).toContain('Cart');
    expect(tabs(page)).not.toContain('Payroll');
    expect(corner(page)).not.toContain('Log in');
    expect(corner(page)).not.toContain('Log out'); // menu is closed

    (el(page).querySelector('.avatar-btn') as HTMLButtonElement).click();
    page.detectChanges();
    expect(el(page).querySelector('.menu')!.textContent).toContain('Log out');
  });

  it('shows accounting tabs to the accountant', async () => {
    const page = await render('accountant');
    expect(tabs(page)).toContain('Payroll');
    expect(tabs(page)).not.toContain('Cart');
  });
});
