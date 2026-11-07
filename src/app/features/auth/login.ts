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
        <input id="password" formControlName="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="current-password" />
        @if (touched('password')) { <p class="error">Password is required</p> }

        <label class="inline"><input type="checkbox" (change)="showPassword.set(!showPassword())" /> Show password</label>
        <label class="inline"><input type="checkbox" formControlName="remember" /> Remember me</label>

        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button class="btn" type="submit">Log in</button>
        <p>No account yet? <a routerLink="/signup">Sign up</a></p>
      </form>
    </section>
  `,
  styles: `
    .narrow { max-width: 28rem; }
    .inline { display: flex; gap: 0.5rem; align-items: center; font-weight: 400; }
    .btn { margin-top: 0.8rem; }
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
