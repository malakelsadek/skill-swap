import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CartService } from './cart.service';
import { StorageService } from '../../core/services/storage.service';
import { CourseService } from '../courses/course.service';
import { KEYS } from '../../core/config';
import { Course } from '../../core/models';

describe('CartService', () => {
  let service: CartService;
  let savedIds: number[];

  const mockCourses: Course[] = [
    {
      id: 1,
      title: 'Angular Basics',
      category: 'Programming',
      price: 25,
      instructorId: 5,
      description: 'Learn Angular fundamentals',
      thumbnail: '',
      rating: 4.5
    },
    {
      id: 2,
      title: 'JavaScript Basics',
      category: 'Programming',
      price: 35,
      instructorId: 6,
      description: 'Learn JavaScript fundamentals',
      thumbnail: '',
      rating: 4.2
    }
  ];

  const storageMock = {
    session: {
        get: vi.fn(() => savedIds),
        set: vi.fn((_key: string, value: number[]) => {
        savedIds = value;
        })
      }
    };

  const courseServiceMock = {
    get: vi.fn((id: number) => mockCourses.find(course => course.id === id))
  };

  beforeEach(() => {
    savedIds = [];

    storageMock.session.get.mockImplementation(() => savedIds);

    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: StorageService, useValue: storageMock },
        { provide: CourseService, useValue: courseServiceMock }
      ]
    });

    service = TestBed.inject(CartService);

    vi.clearAllMocks();
    storageMock.session.get.mockImplementation(() => savedIds);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load saved courses from session storage', () => {
    savedIds = [1, 2];
    service.refresh();

    expect(service.cart().length).toBe(2);
  });

  it('should add a course', () => {
    service.add(1);

    expect(storageMock.session.set).toHaveBeenCalledWith(KEYS.cart, [1]);
    expect(service.cart().length).toBe(1);
  });

  it('should prevent adding duplicate courses', () => {
    service.add(1);
    storageMock.session.set.mockClear();

    service.add(1);

    expect(service.cart().length).toBe(1);
    expect(storageMock.session.set).not.toHaveBeenCalled();
  });

  it('should remove a course', () => {
    savedIds = [1, 2];

    service.remove(1);

    expect(storageMock.session.set).toHaveBeenCalledWith(KEYS.cart, [2]);
    expect(service.cart().length).toBe(1);
    expect(service.cart()[0].id).toBe(2);
  });

  it('should clear the cart', () => {
    savedIds = [1, 2];

    service.clear();

    expect(storageMock.session.set).toHaveBeenCalledWith(KEYS.cart, []);
    expect(service.cart().length).toBe(0);
  });

  it('should calculate the total price', () => {
    savedIds = [1, 2];
    service.refresh();

    expect(service.total()).toBe(60);
  });
  
    it('should round the total to cents', () => {
    mockCourses.push(
      { ...mockCourses[0], id: 3, price: 49.99 },
      { ...mockCourses[0], id: 4, price: 39.99 }
    );
    savedIds = [3, 4];
    service.refresh();

    expect(service.total()).toBe(89.98);

    mockCourses.splice(2, 2); // leave the shared test data as it was
  });
});
