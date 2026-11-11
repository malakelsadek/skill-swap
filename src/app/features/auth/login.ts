import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SoundService } from '../../core/services/sound.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="container narrow">
      <h1>Log in</h1>
      <form class="card" [class.shake]="shake()" (animationend)="shake.set(false)" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label for="username">Username</label>
        <input id="username" formControlName="username" autocomplete="username" />
        @if (touched('username')) { <p class="error">Username is required</p> }

        <label for="password">Password</label>
        <div class="pw">
          <input id="password" formControlName="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="current-password" />
          <button
            type="button"
            class="eye"
            [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
            [attr.aria-pressed]="showPassword()"
            (click)="showPassword.set(!showPassword())"
          >
            @if (showPassword()) {
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c5 0 8.5 4 9.6 6a14 14 0 0 1-3.2 3.8M6.5 7.6A14 14 0 0 0 2.4 12C3.5 14 7 18 12 18c1.5 0 2.8-.4 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M2.4 12C3.5 10 7 6 12 6s8.5 4 9.6 6c-1.1 2-4.6 6-9.6 6S3.5 14 2.4 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2" />
              </svg>
            }
          </button>
        </div>
        @if (touched('password')) { <p class="error">Password is required</p> }

        <label class="inline"><input type="checkbox" formControlName="remember" /> Remember me</label>

        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button class="btn" type="submit">Log in</button>
        <p>No account yet? <a routerLink="/signup">Sign up</a></p>
      </form>
    </section>
  `,
  styles: `
    .narrow { max-width: 28rem; margin-top: 1.5rem; }
    h1 { text-align: center; margin-bottom: 1rem; }
    .inline { display: flex; gap: 0.5rem; align-items: center; font-weight: 400; margin-top: 0.9rem; }
    .btn { width: 100%; margin: 0.9rem 0; }
    .pw { position: relative; }
    .pw input { padding-right: 2.8rem; }
    .eye { position: absolute; top: 50%; right: 0.4rem; transform: translateY(-50%); display: grid; place-items: center; width: 2.2rem; height: 2.2rem; border: none; border-radius: 50%; background: none; color: var(--muted); cursor: pointer; }
    .eye:hover { color: var(--primary); background: var(--tint); }
  `,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sound = inject(SoundService);

  shake = signal(false);

  showPassword = signal(false);
  error = signal('');
  form = inject(FormBuilder).nonNullable.group({
    username: [this.auth.rememberedUsername(), Validators.required],
    password: ['', Validators.required],
    remember: [this.auth.rememberedUsername() !== ''],
  });

  touched(field: 'username' | 'password') {
    const c = this.form.controls[field];
    return c.invalid && c.touched;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.fail();
      return;
    }
    const { username, password, remember } = this.form.getRawValue();
    if (!this.auth.login(username, password, remember)) {
      this.error.set('Wrong username or password');
      this.fail();
      return;
    }
    this.sound.play('success');
    this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') ?? '/');
  }

  private fail() {
    this.sound.play('error');
    this.shake.set(true);
  }
}
