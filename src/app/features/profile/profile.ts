import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CATEGORIES } from '../../core/config';
import { Category } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { readImage } from '../../core/utils';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  template: `
    <section class="container narrow">
      <h1>My profile</h1>
      @if (auth.currentUser(); as u) {
        <div class="card">
          <div class="head">
            @if (u.picture) {
              <img class="avatar" [src]="u.picture" alt="Profile picture" />
            } @else {
              <div class="avatar initial">{{ u.name.charAt(0) }}</div>
            }
            <div>
              <h2>{{ u.name }}</h2>
              <p class="muted">&#64;{{ u.username }} &middot; {{ u.role }}</p>
            </div>
          </div>

          @if (!editing()) {
            <dl>
              <dt>Email</dt><dd>{{ u.email }}</dd>
              <dt>Credit card</dt><dd>**** **** **** {{ u.card.last4 }} (expires {{ u.card.expiry }})</dd>
              <dt>Favourite categories</dt><dd>{{ u.preferences.favoriteCategories.join(', ') || 'None chosen' }}</dd>
              <dt>Sound effects</dt><dd>{{ u.preferences.sound ? 'On' : 'Off' }}</dd>
            </dl>
            <button class="btn" type="button" (click)="startEdit()">Edit profile</button>
            @if (saved()) { <p class="ok" role="status">Profile saved</p> }
          } @else {
            <form [formGroup]="form" (ngSubmit)="save()" novalidate>
              <label for="name">Full name</label>
              <input id="name" formControlName="name" />
              @if (form.controls.name.invalid && form.controls.name.touched) { <p class="error">Name is required</p> }

              <label for="email">Email</label>
              <input id="email" type="email" formControlName="email" />
              @if (form.controls.email.invalid && form.controls.email.touched) { <p class="error">Enter a valid email address</p> }

              <label for="picture">Change picture</label>
              <input id="picture" type="file" accept="image/*" (change)="onPicture($event)" />
              @if (pictureError()) { <p class="error">{{ pictureError() }}</p> }

              <p>Favourite categories</p>
              @for (c of categories; track c) {
                <label class="inline"><input type="checkbox" [checked]="selected().includes(c)" (change)="toggle(c)" /> {{ c }}</label>
              }
              <label class="inline"><input type="checkbox" formControlName="sound" /> Sound effects</label>

              @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
              <button class="btn" type="submit">Save</button>
              <button class="btn secondary" type="button" (click)="editing.set(false)">Cancel</button>
            </form>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .narrow { max-width: 36rem; }
    .head { display: flex; gap: 1rem; align-items: center; }
    .head h2 { margin: 0; }
    .muted { margin: 0; color: var(--muted); }
    .avatar { width: 5rem; height: 5rem; border-radius: 50%; object-fit: cover; }
    .initial { display: grid; place-items: center; background: var(--primary); color: #fff; font-size: 2rem; text-transform: uppercase; }
    dt { font-weight: 600; margin-top: 0.7rem; }
    dd { margin: 0; }
    .inline { display: flex; gap: 0.5rem; align-items: center; font-weight: 400; margin: 0.3rem 0; }
    .btn { margin: 0.8rem 0.4rem 0 0; }
    .ok { color: var(--success); }
  `,
})
export class Profile {
  auth = inject(AuthService);

  categories = CATEGORIES;
  editing = signal(false);
  saved = signal(false);
  error = signal('');
  pictureError = signal('');
  selected = signal<Category[]>([]);
  private newPicture: string | null = null;

  form = inject(FormBuilder).nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    sound: [true],
  });

  startEdit() {
    const u = this.auth.currentUser()!;
    this.form.setValue({ name: u.name, email: u.email, sound: u.preferences.sound });
    this.selected.set([...u.preferences.favoriteCategories]);
    this.newPicture = null;
    this.error.set('');
    this.pictureError.set('');
    this.saved.set(false);
    this.editing.set(true);
  }

  toggle(c: Category) {
    this.selected.update((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));
  }

  async onPicture(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      this.newPicture = await readImage(file);
      this.pictureError.set('');
    } catch (message) {
      this.newPicture = null;
      this.pictureError.set(String(message));
    }
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const u = this.auth.currentUser()!;
    const error = this.auth.updateProfile({
      name: v.name.trim(),
      email: v.email.trim(),
      picture: this.newPicture ?? u.picture,
      preferences: { ...u.preferences, favoriteCategories: this.selected(), sound: v.sound },
    });
    if (error) {
      this.error.set(error);
      return;
    }
    this.editing.set(false);
    this.saved.set(true);
  }
}
