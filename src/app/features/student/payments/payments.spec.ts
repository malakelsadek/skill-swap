
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { Payments } from './payments';
import { InvoiceService } from '../invoice.service';
import { AuthService } from '../../../core/services/auth.service';
import { resetSpies } from '../../../testing';

describe('Payments', () => {
  let component: Payments;
  let fixture: ComponentFixture<Payments>;

  const currentUser = signal<any>({
    id: 3,
    role: 'student'
  });

  const invoiceServiceMock = {
    getStudentPayments: jasmine.createSpy().and.callFake(() => [])
  };

  const authServiceMock = {
    currentUser
  };

  beforeEach(async () => {
    currentUser.set({ id: 3, role: 'student' });
    resetSpies(invoiceServiceMock);

    await TestBed.configureTestingModule({
      imports: [Payments],
      providers: [
        { provide: InvoiceService, useValue: invoiceServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Payments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load payments for the current student', () => {
    expect(invoiceServiceMock.getStudentPayments).toHaveBeenCalledWith(3);
  });

  it('should return an empty list when no user is logged in', () => {
    currentUser.set(null);

    component.loadPayments();

    expect(component.payments).toEqual([]);
  });
    it('should add up the total paid, rounded to cents', () => {
    component.payments = [
      { id: 1, invoiceId: 1, studentId: 3, amount: 49.99, date: '' },
      { id: 2, invoiceId: 2, studentId: 3, amount: 39.99, date: '' }
    ];

    expect(component.totalPaid).toBe(89.98);
  });

  it('should have a total of 0 when there are no payments', () => {
    component.payments = [];

    expect(component.totalPaid).toBe(0);
  });
  
  it('should format payment dates', () => {
    const date = '2026-11-10T12:00:00.000Z';

    expect(component.formatDate(date)).toBe(
      new Date(date).toLocaleDateString()
    );
  });
});
