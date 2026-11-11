import { Injectable, computed, inject, signal } from '@angular/core';
import { KEYS } from '../../core/config';
import { Course } from '../../core/models';
import { StorageService } from '../../core/services/storage.service';
import { CourseService } from '../courses/course.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private storage = inject(StorageService);
  private courses = inject(CourseService);

  private ids = signal<number[]>(
    this.storage.session.get<number[]>(KEYS.cart) ?? []
  );

  readonly cart = computed(() =>
    this.ids()
      .map(id => this.courses.get(id))
      .filter((course): course is Course => course !== undefined)
  );

  readonly total = computed(() =>
    Math.round(this.cart().reduce((sum, course) => sum + course.price, 0) * 100) / 100
  );

  refresh(): void {
    const savedIds = this.storage.session.get<number[]>(KEYS.cart) ?? [];
    this.ids.set(savedIds);
  }

  add(courseId: number): void {
    this.refresh();

    const currentIds = this.ids();

    if (currentIds.includes(courseId)) return;

    const updatedIds = [...currentIds, courseId];

    this.ids.set(updatedIds);
    this.storage.session.set(KEYS.cart, updatedIds);
  }

  remove(courseId: number): void {
    this.refresh();

    const updatedIds = this.ids().filter(id => id !== courseId);

    this.ids.set(updatedIds);
    this.storage.session.set(KEYS.cart, updatedIds);
  }

  clear(): void {
    this.ids.set([]);
    this.storage.session.set(KEYS.cart, []);
  }
}
