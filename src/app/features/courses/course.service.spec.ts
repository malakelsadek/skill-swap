import { TestBed } from '@angular/core/testing';
import { KEYS } from '../../core/config';
import { Course } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { SeedService } from '../../core/services/seed.service';
import { StorageService } from '../../core/services/storage.service';
import { COURSES_SEED } from './courses.seed';
import { CourseService } from './course.service';

const NEW_COURSE = { title: 'Test Course', category: 'Design' as const, price: 10, description: 'A test course' };

describe('CourseService', () => {
  let courses: CourseService;
  let auth: AuthService;

  // Dina = instructor1 (id 5), Karim = instructor2 (id 6)
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.inject(SeedService).init();
    auth = TestBed.inject(AuthService);
    courses = TestBed.inject(CourseService);
  });

  it('seeds courses in all three categories', () => {
    expect(courses.list().length).toBe(COURSES_SEED.length);
    expect(new Set(courses.list().map((c) => c.category))).toEqual(new Set(['Design', 'Business', 'Programming']));
  });

  it('gets a course by id and returns undefined for an unknown id', () => {
    expect(courses.get(1)?.title).toBe('UI Design Fundamentals');
    expect(courses.get(999)).toBeUndefined();
  });

  it('searches by title and description, ignoring case and spaces', () => {
    expect(courses.search('  ANGULAR ').map((c) => c.id)).toEqual([7]);
    expect(courses.search('pandas').map((c) => c.id)).toEqual([8]);
    expect(courses.search('no such course')).toEqual([]);
  });

  it('filters by category and combines it with a search', () => {
    expect(courses.search('', 'Business').every((c) => c.category === 'Business')).toBe(true);
    expect(courses.search('', '').length).toBe(COURSES_SEED.length);
    expect(courses.search('git', 'Design')).toEqual([]);
    expect(courses.search('git', 'Programming').map((c) => c.id)).toEqual([9]);
  });

  it('lists only the courses of one instructor', () => {
    const dina = courses.forInstructor(5);
    expect(dina.length).toBeGreaterThan(0);
    expect(dina.every((c) => c.instructorId === 5)).toBe(true);
  });

  it('refuses to add a course when logged out or as a student', () => {
    expect(courses.add(NEW_COURSE)).toBe('Only instructors can add courses');
    auth.login('student1', 'Pass1234');
    expect(courses.add(NEW_COURSE)).toBe('Only instructors can add courses');
    expect(courses.list().length).toBe(COURSES_SEED.length);
  });

  it('adds a course owned by the logged-in instructor and saves it to localStorage', () => {
    auth.login('instructor1', 'Pass1234');
    expect(courses.add({ ...NEW_COURSE, price: 12.345 })).toBeNull();
    const added = courses.list().at(-1)!;
    expect(added).toEqual(jasmine.objectContaining({ id: COURSES_SEED.length + 1, instructorId: 5, price: 12.35 }));
    expect(added.thumbnail).toContain('data:image/svg+xml'); // generated when none uploaded
    const stored = TestBed.inject(StorageService).local.get<Course[]>(KEYS.courses)!;
    expect(stored.length).toBe(COURSES_SEED.length + 1);
  });

  it('ignores an instructorId sent by an instructor (they always own what they add)', () => {
    auth.login('instructor1', 'Pass1234');
    courses.add({ ...NEW_COURSE, instructorId: 6 });
    expect(courses.list().at(-1)!.instructorId).toBe(5);
  });

  it('lets an admin add a course for a chosen instructor, but not without one', () => {
    auth.login('admin', 'Pass1234');
    expect(courses.add(NEW_COURSE)).toBe('Choose an instructor for this course');
    expect(courses.add({ ...NEW_COURSE, instructorId: 6 })).toBeNull();
    expect(courses.list().at(-1)!.instructorId).toBe(6);
  });

  it('validates title, price and description', () => {
    auth.login('instructor1', 'Pass1234');
    expect(courses.add({ ...NEW_COURSE, title: '   ' })).toBe('Title is required');
    expect(courses.add({ ...NEW_COURSE, price: -1 })).toBe('Price must be 0 or more');
    expect(courses.add({ ...NEW_COURSE, price: NaN })).toBe('Price must be 0 or more');
    expect(courses.add({ ...NEW_COURSE, description: '' })).toBe('Description is required');
    expect(courses.list().length).toBe(COURSES_SEED.length);
  });

  it('lets an instructor edit their own course', () => {
    auth.login('instructor1', 'Pass1234');
    expect(courses.update(1, { title: 'UI Design Pro', price: 55 })).toBeNull();
    expect(courses.get(1)).toEqual(jasmine.objectContaining({ title: 'UI Design Pro', price: 55, instructorId: 5 }));
  });

  it("blocks an instructor from editing or deleting another instructor's course", () => {
    auth.login('instructor1', 'Pass1234');
    expect(courses.update(3, { price: 1 })).toBe('You can only edit your own courses'); // course 3 is Karim's
    expect(courses.remove(3)).toBe('You can only delete your own courses');
    expect(courses.get(3)?.price).toBe(39.99);
  });

  it('keeps an uploaded thumbnail when other fields change', () => {
    auth.login('instructor1', 'Pass1234');
    courses.update(1, { thumbnail: 'data:image/png;base64,AAAA' });
    courses.update(1, { title: 'Renamed' });
    expect(courses.get(1)?.thumbnail).toBe('data:image/png;base64,AAAA');
  });

  it('deletes an own course, and reports an unknown one', () => {
    auth.login('instructor1', 'Pass1234');
    expect(courses.remove(1)).toBeNull();
    expect(courses.get(1)).toBeUndefined();
    expect(courses.remove(1)).toBe('Course not found');
    expect(courses.update(1, { price: 5 })).toBe('Course not found');
  });

  it('lets an admin edit and delete any course', () => {
    auth.login('admin', 'Pass1234');
    expect(courses.update(3, { price: 9 })).toBeNull();
    expect(courses.remove(4)).toBeNull();
  });

  it('knows who can manage a course', () => {
    const course = courses.get(1)!; // Dina's
    expect(courses.canManage(course)).toBe(false); // logged out
    auth.login('student1', 'Pass1234');
    expect(courses.canManage(course)).toBe(false);
    auth.login('instructor2', 'Pass1234');
    expect(courses.canManage(course)).toBe(false);
    auth.login('instructor1', 'Pass1234');
    expect(courses.canManage(course)).toBe(true);
  });

  it('resolves instructor names', () => {
    expect(courses.instructorName(5)).toBe('Dina Instructor');
    expect(courses.instructorName(404)).toBe('Unknown instructor');
    expect(courses.instructors().map((u) => u.id)).toEqual([5, 6]);
  });
});
