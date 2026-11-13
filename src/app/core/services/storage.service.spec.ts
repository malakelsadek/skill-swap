import { TestBed } from '@angular/core/testing';
import { USERS_SEED } from '../seed/users.seed';
import { KEYS } from '../config';
import { hashPassword, last4 } from '../utils';
import { SeedService } from './seed.service';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let storage: StorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    storage = TestBed.inject(StorageService);
  });

  it('stores and reads objects in localStorage', () => {
    storage.local.set('k', { a: 1 });
    expect(storage.local.get('k')).toEqual({ a: 1 });
    storage.local.remove('k');
    expect(storage.local.get('k')).toBeNull();
  });

  it('keeps session data separate from local data', () => {
    storage.session.set('k', 'session');
    expect(storage.local.get('k')).toBeNull();
    expect(storage.session.get('k')).toBe('session');
  });

  it('returns null for corrupted JSON', () => {
    localStorage.setItem('bad', '{oops');
    expect(storage.local.get('bad')).toBeNull();
  });

  it('sets, reads and removes a cookie', () => {
    storage.cookie.set('sw_test', 'hello', 1);
    expect(storage.cookie.get('sw_test')).toBe('hello');
    storage.cookie.remove('sw_test');
    expect(storage.cookie.get('sw_test')).toBeNull();
  });

  it('seeds only when empty', () => {
    storage.seedIfEmpty('list', [1, 2]);
    storage.seedIfEmpty('list', [9]);
    expect(storage.local.get('list')).toEqual([1, 2]);
  });
});

describe('SeedService and utils', () => {
  it('seeds the demo users once', () => {
    localStorage.clear();
    TestBed.inject(SeedService).init();
    expect(TestBed.inject(StorageService).local.get(KEYS.users)).toEqual(USERS_SEED);
    expect(USERS_SEED.map((u) => u.role)).toEqual(
      jasmine.arrayContaining(['admin', 'accountant', 'student', 'instructor']),
    );
  });

  it('hashes passwords and keeps only the last 4 card digits', () => {
    expect(hashPassword('Pass1234')).not.toContain('Pass');
    expect(hashPassword('a')).not.toBe(hashPassword('b'));
    expect(last4('4111 1111 1111 1234')).toBe('1234');
  });
});
