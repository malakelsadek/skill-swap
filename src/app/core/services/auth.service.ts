import { Injectable, computed, inject, signal } from '@angular/core';
import { KEYS } from '../config';
import { Role, User } from '../models';
import { hashPassword } from '../utils';
import { StorageService } from './storage.service';

export type NewUser = Omit<User, 'id' | 'role'>; // password is plain here, hashed by register()

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storage = inject(StorageService);

  /** The logged-in user, or null. Restored from sessionStorage so a refresh keeps the login. */
  readonly currentUser = signal<User | null>(this.restore());
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  private users(): User[] {
    return this.storage.local.get<User[]>(KEYS.users) ?? [];
  }

  private restore(): User | null {
    const session = this.storage.session.get<{ userId: number }>(KEYS.session);
    return this.users().find((u) => u.id === session?.userId) ?? null;
  }

  /** Returns true on success. "Remember me" keeps only the username in a cookie, never the password. */
  login(username: string, password: string, remember = false): boolean {
    const user = this.users().find((u) => u.username === username.trim());
    if (!user || user.password !== hashPassword(password)) return false;
    this.storage.session.set(KEYS.session, { userId: user.id });
    if (remember) this.storage.cookie.set(KEYS.rememberCookie, user.username);
    else this.storage.cookie.remove(KEYS.rememberCookie);
    this.currentUser.set(user);
    return true;
  }

  logout(): void {
    this.storage.session.remove(KEYS.session);
    this.currentUser.set(null);
  }

  /** Creates a student account. Returns an error message, or null on success (does not log in). */
  register(data: NewUser): string | null {
    const users = this.users();
    if (users.some((u) => u.username === data.username)) return 'Username already taken';
    if (users.some((u) => u.email === data.email)) return 'Email already registered';
    const id = Math.max(0, ...users.map((u) => u.id)) + 1;
    const user: User = { ...data, id, role: 'student', password: hashPassword(data.password) };
    this.storage.local.set(KEYS.users, [...users, user]);
    return null;
  }

  /** Saves changes to the logged-in user's profile. Returns an error message, or null on success. */
  updateProfile(changes: Partial<Pick<User, 'name' | 'email' | 'picture' | 'preferences'>>): string | null {
    const me = this.currentUser();
    if (!me) return 'Not logged in';
    const users = this.users();
    if (changes.email && users.some((u) => u.id !== me.id && u.email === changes.email)) {
      return 'Email already registered';
    }
    const updated: User = { ...me, ...changes };
    this.storage.local.set(KEYS.users, users.map((u) => (u.id === me.id ? updated : u)));
    this.currentUser.set(updated);
    return null;
  }

  hasRole(...roles: Role[]): boolean {
    const user = this.currentUser();
    return user !== null && roles.includes(user.role);
  }

  /** Username saved by "remember me", used to prefill the login form. */
  rememberedUsername(): string {
    return this.storage.cookie.get(KEYS.rememberCookie) ?? '';
  }
}
