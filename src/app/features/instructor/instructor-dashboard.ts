import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CATEGORIES } from '../../core/config';
import { Course } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { SoundService } from '../../core/services/sound.service';
import { readImage } from '../../core/utils';
import { SuccessCheck } from '../../shared/success-check/success-check';
import { CourseService } from '../courses/course.service';

@Component({
  selector: 'app-instructor-dashboard',
  imports: [ReactiveFormsModule, RouterLink, SuccessCheck],
  template: `
    <section class="container">
      <div class="top">
        <h1>{{ isAdmin() ? 'All courses' : 'My courses' }}</h1>
        <div>
          <a class="btn secondary" routerLink="/instructor/earnings">Earnings</a>
          <button class="btn" type="button" (click)="startAdd()">Add course</button>
        </div>
      </div>

      @if (message()) {
        <p class="ok" role="status"><app-success-check /> {{ message() }}</p>
      }

      @if (formOpen()) {
        <form class="card" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <h2>{{ editingId() ? 'Edit course' : 'New course' }}</h2>

          <label for="title">Title</label>
          <input id="title" formControlName="title" />
          @if (invalid('title')) { <p class="error">Title is required</p> }

          <label for="category">Category</label>
          <select id="category" formControlName="category">
            @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
          </select>

          <label for="price">Price (USD)</label>
          <input id="price" type="number" min="0" step="0.01" formControlName="price" />
          @if (invalid('price')) { <p class="error">Enter a price of 0 or more</p> }

          <label for="description">Description</label>
          <textarea id="description" rows="4" formControlName="description"></textarea>
          @if (invalid('description')) { <p class="error">Description is required</p> }

          @if (isAdmin() && !editingId()) {
            <label for="instructor">Instructor</label>
            <select id="instructor" formControlName="instructorId">
              <option [value]="0">Choose an instructor</option>
              @for (i of instructors; track i.id) { <option [value]="i.id">{{ i.name }}</option> }
            </select>
            @if (invalid('instructorId')) { <p class="error">Choose an instructor</p> }
          }

          <label for="picture">Thumbnail (optional)</label>
          <input id="picture" type="file" accept="image/*" (change)="onPicture($event)" />
          @if (pictureError()) { <p class="error">{{ pictureError() }}</p> }

          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          <div class="row">
            <button class="btn" type="submit">{{ editingId() ? 'Save changes' : 'Add course' }}</button>
            <button class="btn secondary" type="button" (click)="formOpen.set(false)">Cancel</button>
          </div>
        </form>
      }

      @if (mine().length) {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th><th>Category</th><th>Price</th>
                @if (isAdmin()) { <th>Instructor</th> }
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of mine(); track c.id) {
                <tr>
                  <td><a [routerLink]="['/courses', c.id]">{{ c.title }}</a></td>
                  <td>{{ c.category }}</td>
                  <td>\${{ c.price.toFixed(2) }}</td>
                  @if (isAdmin()) { <td>{{ courses.instructorName(c.instructorId) }}</td> }
                  <td class="actions">
                    <button class="btn secondary" type="button" (click)="startEdit(c)">Edit</button>
                    @if (confirmId() === c.id) {
                      <button class="btn danger" type="button" (click)="remove(c)">Confirm delete</button>
                      <button class="btn secondary" type="button" (click)="confirmId.set(null)">Keep</button>
                    } @else {
                      <button class="btn danger" type="button" (click)="confirmId.set(c.id)">Delete</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="card"><p>You have no courses yet. Choose "Add course" to publish your first one.</p></div>
      }
    </section>
  `,
  styles: `
    .top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.6rem; }
    .top .btn { margin-left: 0.4rem; }
    form.card { margin: 1rem 0; max-width: 40rem; }
    .row, .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.8rem; }
    .actions { margin: 0; }
    .ok { display: flex; align-items: center; gap: 0.5rem; color: var(--success); }
  `,
})
export class InstructorDashboard {
  private auth = inject(AuthService);
  private sound = inject(SoundService);
  courses = inject(CourseService);

  categories = CATEGORIES;
  instructors = this.courses.instructors();
  isAdmin = computed(() => this.auth.hasRole('admin'));

  // Instructors see only their own courses; the service re-checks ownership on every change.
  mine = computed(() => {
    const me = this.auth.currentUser();
    const all = this.courses.courses();
    return this.isAdmin() ? all : all.filter((c) => c.instructorId === me?.id);
  });

  formOpen = signal(false);
  editingId = signal<number | null>(null);
  confirmId = signal<number | null>(null);
  message = signal('');
  error = signal('');
  pictureError = signal('');
  private picture: string | undefined;

  form = inject(FormBuilder).nonNullable.group({
    title: ['', Validators.required],
    category: [CATEGORIES[0], Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    description: ['', Validators.required],
    instructorId: [0],
  });

  invalid(field: 'title' | 'price' | 'description' | 'instructorId') {
    const c = this.form.controls[field];
    return c.invalid && c.touched;
  }

  startAdd() {
    this.form.reset({ title: '', category: CATEGORIES[0], price: 0, description: '', instructorId: 0 });
    this.open(null);
  }

  startEdit(c: Course) {
    this.form.reset({ title: c.title, category: c.category, price: c.price, description: c.description, instructorId: c.instructorId });
    this.open(c.id);
  }

  private open(id: number | null) {
    this.editingId.set(id);
    this.picture = undefined;
    this.error.set('');
    this.pictureError.set('');
    this.message.set('');
    this.confirmId.set(null);
    this.formOpen.set(true);
  }

  async onPicture(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      this.picture = await readImage(file);
      this.pictureError.set('');
    } catch (message) {
      this.picture = undefined;
      this.pictureError.set(String(message));
    }
  }

  save() {
    const v = this.form.getRawValue();
    const needsInstructor = this.isAdmin() && !this.editingId() && Number(v.instructorId) === 0;
    if (this.form.invalid || needsInstructor) {
      this.form.markAllAsTouched();
      if (needsInstructor) this.form.controls.instructorId.setErrors({ required: true });
      this.sound.play('error');
      return;
    }
    const id = this.editingId();
    const data = { title: v.title, category: v.category, price: Number(v.price), description: v.description };
    const error = id
      ? this.courses.update(id, { ...data, ...(this.picture ? { thumbnail: this.picture } : {}) })
      : this.courses.add({ ...data, thumbnail: this.picture, instructorId: Number(v.instructorId) || undefined });
    if (error) {
      this.error.set(error);
      this.sound.play('error');
      return;
    }
    this.sound.play('success');
    this.message.set(id ? 'Course updated' : 'Course added');
    this.formOpen.set(false);
  }

  remove(c: Course) {
    const error = this.courses.remove(c.id);
    this.confirmId.set(null);
    if (error) {
      this.error.set(error);
      this.sound.play('error');
      return;
    }
    this.sound.play('success');
    this.message.set('Course deleted');
  }
}
