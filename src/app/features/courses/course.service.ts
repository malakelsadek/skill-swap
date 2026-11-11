import { Injectable, computed, inject, signal } from '@angular/core';
import { KEYS } from '../../core/config';
import { Category, Course, User } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { StorageService } from '../../core/services/storage.service';
import { generateThumbnail } from './thumbnail';

/** What the instructor form provides. instructorId is only read for admins; instructors always own what they add. */
export type NewCourse = Pick<Course, 'title' | 'category' | 'price' | 'description'> & {
  thumbnail?: string;
  instructorId?: number;
};

export type CourseChanges = Partial<Pick<Course, 'title' | 'category' | 'price' | 'description' | 'thumbnail'>>;

/**
 * Shared course catalogue (other members inject this too: cart, invoices, payouts).
 * State strategy: one signal holds the list so every page updates together;
 * each change is written to localStorage so courses survive refreshes (mock database).
 * add / update / remove return an error message, or null on success (same style as AuthService).
 */
@Injectable({ providedIn: 'root' })
export class CourseService {
  private storage = inject(StorageService);
  private auth = inject(AuthService);

  private readonly state = signal<Course[]>(this.storage.local.get<Course[]>(KEYS.courses) ?? []);
  readonly courses = this.state.asReadonly();
  readonly count = computed(() => this.state().length);

  /** Re-reads localStorage (used after the seed runs or another service changed it). */
  reload(): void {
    this.state.set(this.storage.local.get<Course[]>(KEYS.courses) ?? []);
  }

  list(): Course[] {
    return this.state();
  }

  get(id: number): Course | undefined {
    return this.state().find((c) => c.id === id);
  }

  forInstructor(instructorId: number): Course[] {
    return this.state().filter((c) => c.instructorId === instructorId);
  }

  /** Display name of a course's instructor, read from the users table. */
  instructorName(instructorId: number): string {
    const users = this.storage.local.get<User[]>(KEYS.users) ?? [];
    return users.find((u) => u.id === instructorId)?.name ?? 'Unknown instructor';
  }

  /** Instructor accounts (admins pick one when adding a course for somebody). */
  instructors(): User[] {
    return (this.storage.local.get<User[]>(KEYS.users) ?? []).filter((u) => u.role === 'instructor');
  }

  /** Case-insensitive match on title, description and category; optional category filter. */
  search(query = '', category: Category | '' = ''): Course[] {
    const q = query.trim().toLowerCase();
    return this.state().filter(
      (c) =>
        (!category || c.category === category) &&
        (!q || [c.title, c.description, c.category].some((text) => text.toLowerCase().includes(q))),
    );
  }

  /** Admins manage every course; an instructor manages only their own. */
  canManage(course: Course): boolean {
    const me = this.auth.currentUser();
    if (!me) return false;
    return me.role === 'admin' || (me.role === 'instructor' && course.instructorId === me.id);
  }

  add(data: NewCourse): string | null {
    const me = this.auth.currentUser();
    if (!me || (me.role !== 'instructor' && me.role !== 'admin')) return 'Only instructors can add courses';
    const error = this.validate(data);
    if (error) return error;
    const instructorId = me.role === 'admin' ? data.instructorId : me.id;
    if (!instructorId) return 'Choose an instructor for this course';
    const course: Course = {
      id: Math.max(0, ...this.state().map((c) => c.id)) + 1,
      title: data.title.trim(),
      category: data.category,
      price: round2(data.price),
      description: data.description.trim(),
      instructorId,
      thumbnail: data.thumbnail || generateThumbnail(data.category, data.title.trim()),
    };
    this.save([...this.state(), course]);
    return null;
  }

  update(id: number, changes: CourseChanges): string | null {
    const course = this.get(id);
    if (!course) return 'Course not found';
    if (!this.canManage(course)) return 'You can only edit your own courses';
    const merged = { ...course, ...changes };
    const error = this.validate(merged);
    if (error) return error;
    const updated: Course = {
      ...merged,
      title: merged.title.trim(),
      description: merged.description.trim(),
      price: round2(merged.price),
      // a generated thumbnail follows the title/category; an uploaded one is kept
      thumbnail:
        changes.thumbnail ??
        (course.thumbnail.startsWith('data:image/svg+xml')
          ? generateThumbnail(merged.category, merged.title.trim())
          : course.thumbnail),
    };
    this.save(this.state().map((c) => (c.id === id ? updated : c)));
    return null;
  }

  remove(id: number): string | null {
    const course = this.get(id);
    if (!course) return 'Course not found';
    if (!this.canManage(course)) return 'You can only delete your own courses';
    this.save(this.state().filter((c) => c.id !== id));
    return null;
  }

  private validate(c: Pick<Course, 'title' | 'price' | 'description'>): string | null {
    if (!c.title.trim()) return 'Title is required';
    if (!Number.isFinite(c.price) || c.price < 0) return 'Price must be 0 or more';
    if (!c.description.trim()) return 'Description is required';
    return null;
  }

  private save(courses: Course[]): void {
    this.storage.local.set(KEYS.courses, courses);
    this.state.set(courses);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
