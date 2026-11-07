import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { authGuard, roleGuard } from '../guards/auth.guard';
import { NewUser, AuthService } from './auth.service';
import { SeedService } from './seed.service';

const newUser = (over: Partial<NewUser> = {}): NewUser => ({
  username: 'newbie',
  name: 'New Bie',
  email: 'newbie@test.dev',
  picture: '',
  password: 'Secret123',
  card: { holder: 'New Bie', last4: '9999', expiry: '01/30' },
  preferences: { theme: 'light', favoriteCategories: [], sound: true },
  ...over,
});

function setup() {
  localStorage.clear();
  sessionStorage.clear();
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.inject(SeedService).init();
  return TestBed.inject(AuthService);
}

describe('AuthService', () => {
  it('logs in with the right password and stores only the user id in the session', () => {
    const auth = setup();
    expect(auth.login('student1', 'Pass1234')).toBe(true);
    expect(auth.currentUser()?.role).toBe('student');
    expect(sessionStorage.getItem('sw_session')).toBe('{"userId":3}');
  });

  it('rejects a wrong password or unknown user', () => {
    const auth = setup();
    expect(auth.login('student1', 'wrong')).toBe(false);
    expect(auth.login('nobody', 'Pass1234')).toBe(false);
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('logout clears the session', () => {
    const auth = setup();
    auth.login('admin', 'Pass1234');
    auth.logout();
    expect(auth.isLoggedIn()).toBe(false);
    expect(sessionStorage.getItem('sw_session')).toBeNull();
  });

  it('restores the login after a refresh (new service instance)', () => {
    setup().login('admin', 'Pass1234');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    expect(TestBed.inject(AuthService).currentUser()?.username).toBe('admin');
  });

  it('registers a student, hashes the password, and blocks duplicates', () => {
    const auth = setup();
    expect(auth.register(newUser())).toBeNull();
    expect(auth.login('newbie', 'Secret123')).toBe(true);
    expect(auth.currentUser()?.role).toBe('student');
    expect(auth.currentUser()?.password).not.toContain('Secret');
    expect(auth.register(newUser({ email: 'x@test.dev' }))).toBe('Username already taken');
    expect(auth.register(newUser({ username: 'other' }))).toBe('Email already registered');
  });

  it('updates the profile, persists it, and blocks another user\'s email', () => {
    const auth = setup();
    auth.login('student1', 'Pass1234');
    expect(auth.updateProfile({ name: 'Sara Renamed' })).toBeNull();
    expect(auth.currentUser()?.name).toBe('Sara Renamed');
    auth.logout();
    auth.login('student1', 'Pass1234');
    expect(auth.currentUser()?.name).toBe('Sara Renamed');
    expect(auth.updateProfile({ email: 'omar@skillswap.test' })).toBe('Email already registered');
  });

  it('remembers the username in a cookie only when asked', () => {
    const auth = setup();
    auth.login('student1', 'Pass1234', true);
    expect(auth.rememberedUsername()).toBe('student1');
    auth.login('student1', 'Pass1234', false);
    expect(auth.rememberedUsername()).toBe('');
  });
});

describe('guards', () => {
  const run = (guard: ReturnType<typeof roleGuard>) =>
    TestBed.runInInjectionContext(() => guard({} as never, { url: '/secret' } as never));
  const target = (r: unknown) => TestBed.inject(Router).serializeUrl(r as UrlTree);

  it('authGuard sends visitors to login with a return url', () => {
    setup();
    expect(target(run(authGuard))).toBe('/login?returnUrl=%2Fsecret');
  });

  it('authGuard lets a logged-in user through', () => {
    setup().login('student1', 'Pass1234');
    expect(run(authGuard)).toBe(true);
  });

  it('roleGuard allows the right role and sends the wrong role to /forbidden', () => {
    const auth = setup();
    auth.login('student1', 'Pass1234');
    expect(run(roleGuard('student'))).toBe(true);
    expect(target(run(roleGuard('accountant', 'admin')))).toBe('/forbidden');
  });

  it('roleGuard sends visitors to login', () => {
    setup();
    expect(target(run(roleGuard('admin')))).toBe('/login?returnUrl=%2Fsecret');
  });
});
