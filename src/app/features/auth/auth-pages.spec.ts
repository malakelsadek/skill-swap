import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SeedService } from '../../core/services/seed.service';
import { Login } from './login';
import { Signup } from './signup';

function setup() {
  localStorage.clear();
  sessionStorage.clear();
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.inject(SeedService).init();
}

const validSignup = {
  username: 'newbie',
  name: 'New Bie',
  email: 'newbie@test.dev',
  password: 'Secret123',
  cardNumber: '4111 1111 1111 1234',
  expiry: '12/29',
};

describe('Signup form', () => {
  const make = () => {
    setup();
    return TestBed.createComponent(Signup).componentInstance;
  };

  it('is invalid when empty', () => {
    expect(make().form.valid).toBe(false);
  });

  it('accepts a fully valid form', () => {
    const page = make();
    page.form.setValue(validSignup);
    expect(page.form.valid).toBe(true);
  });

  for (const [field, value] of [
    ['email', 'not-an-email'],
    ['password', 'short1'],
    ['password', 'nodigitshere'],
    ['cardNumber', '1234'],
    ['expiry', '13/29'],
  ]) {
    it(`rejects a bad ${field} (${value})`, () => {
      const page = make();
      page.form.setValue({ ...validSignup, [field]: value });
      expect(page.form.valid).toBe(false);
    });
  }

  it('creates the account, stores only the last 4 card digits, and logs in', () => {
    const page = make();
    const auth = TestBed.inject(AuthService);
    page.form.setValue(validSignup);
    page.submit();
    expect(auth.currentUser()?.username).toBe('newbie');
    expect(auth.currentUser()?.card.last4).toBe('1234');
    expect(JSON.stringify(localStorage)).not.toContain('4111');
  });

  it('shows an error for a taken username', () => {
    const page = make();
    page.form.setValue({ ...validSignup, username: 'student1' });
    page.submit();
    expect(page.error()).toBe('Username already taken');
  });
});

describe('Login form', () => {
  const make = () => {
    setup();
    return TestBed.createComponent(Login).componentInstance;
  };

  it('requires username and password', () => {
    expect(make().form.valid).toBe(false);
  });

  it('shows an error for a wrong password', () => {
    const page = make();
    page.form.patchValue({ username: 'student1', password: 'nope' });
    page.submit();
    expect(page.error()).toBe('Wrong username or password');
  });

  it('logs in and goes home', () => {
    const page = make();
    const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    page.form.patchValue({ username: 'student1', password: 'Pass1234' });
    page.submit();
    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
