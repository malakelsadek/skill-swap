import { Injectable, inject } from '@angular/core';
import { KEYS } from '../config';
import { COURSES_SEED } from '../../features/courses/courses.seed';
import { USERS_SEED } from '../seed/users.seed';
import { StorageService } from './storage.service';

/**
 * Fills localStorage with demo data on first run. Teammates add their own
 * line in init(), e.g. this.storage.seedIfEmpty(KEYS.courses, COURSES_SEED).
 */
@Injectable({ providedIn: 'root' })
export class SeedService {
  private storage = inject(StorageService);

  init(): void {
    this.storage.seedIfEmpty(KEYS.users, USERS_SEED);
    this.storage.seedIfEmpty(KEYS.courses, COURSES_SEED); // Member 2
  }
}
