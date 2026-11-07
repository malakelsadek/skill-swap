import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CATEGORIES } from '../../core/config';
import { Category } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { SoundService } from '../../core/services/sound.service';
import { last4, readImage } from '../../core/utils';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="container narrow">
      <h1>Sign up</h1>
      <form class="card" [class.shake]="shake()" (animationend)="shake.set(false)" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label for="username">Username</label>
        <input id="username" formControlName="username" autocomplete="username" />
        @if (bad('username')) { <p class="error">Username is required</p> }

        <label for="name">Full name</label>
        <input id="name" formControlName="name" autocomplete="name" />
        @if (bad('name')) { <p class="error">Name is required</p> }

        <label for="email">Email</label>
        <input id="email" type="email" formControlName="email" autocomplete="email" />
        @if (bad('email')) { <p class="error">Enter a valid email address</p> }

        <label for="picture">Picture</label>
        <input id="picture" type="file" accept="image/*" (change)="onPicture($event)" />
        @if (pictureError()) { <p class="error">{{ pictureError() }}</p> }
        @if (picture()) { <img class="preview" [src]="picture()" alt="Your picture" /> }

        <label for="password">Password</label>
        <input id="password" type="password" formControlName="password" autocomplete="new-password" />
        @if (bad('password')) { <p class="error">At least 8 characters, including a digit</p> }

        <label for="cardNumber">Credit card number</label>
        <input id="cardNumber" formControlName="cardNumber" inputmode="numeric" placeholder="1234 5678 9012 3456" autocomplete="cc-number" />
        @if (bad('cardNumber')) { <p class="error">Enter 16 digits</p> }

        <label for="expiry">Card expiry (MM/YY)</label>
        <input id="expiry" formControlName="expiry" placeholder="12/29" autocomplete="cc-exp" />
        @if (bad('expiry')) { <p class="error">Use the format MM/YY</p> }

        <fieldset>
          <legend>Preferences</legend>
          <p>Favourite categories</p>
          @for (c of categories; track c) {
            <label class="inline">
              <input type="checkbox" [checked]="selected().includes(c)" (change)="toggle(c)" /> {{ c }}
            </label>
          }
        </fieldset>

        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button class="btn" type="submit">Create account</button>
        <p>Already have an account? <a routerLink="/login">Log in</a></p>
      </form>
    </section>
  `,
  styles: `
    .narrow { max-width: 32rem; }
    .inline { display: flex; gap: 0.5rem; align-items: center; font-weight: 400; margin: 0.3rem 0; }
    .preview { width: 5rem; height: 5rem; object-fit: cover; border-radius: 50%; margin-top: 0.4rem; }
    fieldset { margin-top: 1rem; border: 1px solid var(--border); border-radius: 8px; }
    .btn { margin-top: 0.8rem; }
  `,
})
export class Signup {
  private auth = inject(AuthService);
  private router = inject(Router);
  private sound = inject(SoundService);

  shake = signal(false);

  categories = CATEGORIES;
  selected = signal<Category[]>([]);
  picture = signal('');
  pictureError = signal('');
  error = signal('');

  form = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*\d).{8,}$/)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^(\d ?){16}$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
  });

  bad(field: keyof Signup['form']['controls']) {
    const c = this.form.controls[field];
    return c.invalid && c.touched;
  }

  toggle(c: Category) {
    this.selected.update((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));
  }

  async onPicture(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      this.picture.set(await readImage(file));
      this.pictureError.set('');
    } catch (message) {
      this.picture.set('');
      this.pictureError.set(String(message));
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.fail();
      return;
    }
    const v = this.form.getRawValue();
    const error = this.auth.register({
      username: v.username.trim(),
      name: v.name.trim(),
      email: v.email.trim(),
      picture: this.picture(),
      password: v.password,
      card: { holder: v.name.trim(), last4: last4(v.cardNumber), expiry: v.expiry },
      preferences: { theme: 'light', favoriteCategories: this.selected(), sound: true },
    });
    if (error) {
      this.error.set(error);
      this.fail();
      return;
    }
    this.sound.play('success');
    this.auth.login(v.username, v.password);
    this.router.navigateByUrl('/');
  }

  private fail() {
    this.sound.play('error');
    this.shake.set(true);
  }
}
