import { Injectable, inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

// JSON wrapper around a Web Storage object (localStorage or sessionStorage).
function jsonStore(store: Storage) {
  return {
    get<T>(key: string): T | null {
      const raw = store.getItem(key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null; // corrupted value: treat as missing
      }
    },
    set(key: string, value: unknown): void {
      store.setItem(key, JSON.stringify(value));
    },
    remove(key: string): void {
      store.removeItem(key);
    },
  };
}

/**
 * The only place features should touch browser storage.
 *  - local:   persistent mock "database" (users, courses, invoices, ...)
 *  - session: login session and cart (cleared when the tab closes)
 *  - cookie:  small preferences ("remember me", last category)
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private cookies = inject(CookieService);

  readonly local = jsonStore(localStorage);
  readonly session = jsonStore(sessionStorage);

  readonly cookie = {
    get: (key: string): string | null => this.cookies.get(key) || null,
    set: (key: string, value: string, days = 7): void =>
      this.cookies.set(key, value, { expires: days, path: '/', sameSite: 'Lax' }),
    remove: (key: string): void => this.cookies.delete(key, '/'),
  };

  /** Writes the default data into localStorage only if the key is still empty. */
  seedIfEmpty<T>(key: string, data: T[]): void {
    if (this.local.get<T[]>(key) === null) this.local.set(key, data);
  }
}
