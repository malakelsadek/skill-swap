import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { Invoices } from './invoices';
import { InvoiceService } from '../invoice.service';
import { AuthService } from '../../../core/services/auth.service';
import { resetSpies } from '../../../testing';

describe('Invoices', () => {
  let component: Invoices;
  let fixture: ComponentFixture<Invoices>;

  const currentUser = signal<any>({
    id: 3,
    role: 'student'
  });

  const invoiceServiceMock = {
    getStudentInvoices: jasmine.createSpy().and.callFake(() => []),
    getAllInvoices: jasmine.createSpy().and.callFake(() => []),
    getStudentRefunds: jasmine.createSpy().and.callFake(() => []),
    getAllRefunds: jasmine.createSpy().and.callFake(() => []),
    requestRefund: jasmine.createSpy(),
    markPaid: jasmine.createSpy()
  };

  const authServiceMock = {
    currentUser
  };

  beforeEach(async () => {
    currentUser.set({ id: 3, role: 'student' });
    resetSpies(invoiceServiceMock);

    await TestBed.configureTestingModule({
      imports: [Invoices],
      providers: [
        { provide: InvoiceService, useValue: invoiceServiceMock },
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Invoices);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the current student invoices and refunds', () => {
    expect(invoiceServiceMock.getStudentInvoices).toHaveBeenCalledWith(3);
    expect(invoiceServiceMock.getStudentRefunds).toHaveBeenCalledWith(3);
  });

  it('should load all invoices for an accountant', () => {
    currentUser.set({ id: 2, role: 'accountant' });

    component.loadInvoices();

    expect(invoiceServiceMock.getAllInvoices).toHaveBeenCalled();
  });

  it('should load all invoices for an admin', () => {
    currentUser.set({ id: 1, role: 'admin' });

    component.loadInvoices();

    expect(invoiceServiceMock.getAllInvoices).toHaveBeenCalled();
  });

  it('should return an empty list when no user is logged in', () => {
    currentUser.set(null);

    component.loadInvoices();

    expect(component.invoices).toEqual([]);
    expect(component.refunds).toEqual([]);
  });

  it('should find a refund request for an invoice', () => {
    const refund = {
      id: 1,
      invoiceId: 5,
      studentId: 3,
      reason: 'Incorrect course',
      status: 'pending',
      date: '2026-11-10T12:00:00.000Z'
    } as any;

    component.refunds = [refund];

    expect(component.refundFor(5)).toBe(refund);
    expect(component.refundFor(10)).toBeUndefined();
  });

  it('should submit a refund request', () => {
    const refund = {
      id: 1,
      invoiceId: 5,
      studentId: 3,
      reason: 'Incorrect course',
      status: 'pending' as const,
      date: '2026-11-10T12:00:00.000Z'
    };

    invoiceServiceMock.requestRefund.and.returnValue(refund);

    const reasonInput = {
      value: '  Incorrect course  '
    } as HTMLInputElement;

    component.submitRefund(5, reasonInput);

    expect(invoiceServiceMock.requestRefund).toHaveBeenCalledWith(
      5,
      3,
      'Incorrect course'
    );
    expect(component.refunds).toContain(refund);
    expect(component.refundMessage).toBe(
      'Your refund request has been submitted.'
    );
    expect(reasonInput.value).toBe('');
  });

  it('should reject an empty refund reason', () => {
    const reasonInput = {
      value: '   '
    } as HTMLInputElement;

    component.submitRefund(5, reasonInput);

    expect(invoiceServiceMock.requestRefund).not.toHaveBeenCalled();
    expect(component.refundMessage).toBe(
      'Please enter a reason for your refund request.'
    );
  });

  it('should load all refunds for staff', () => {
    currentUser.set({ id: 2, role: 'accountant' });

    component.loadInvoices();

    expect(invoiceServiceMock.getAllRefunds).toHaveBeenCalled();
  });

  it('should show the LATEST refund request when there are several', () => {
    const rejected = { id: 1, invoiceId: 5, status: 'rejected' } as any;
    const pending = { id: 2, invoiceId: 5, status: 'pending' } as any;

    component.refunds = [rejected, pending];

    expect(component.refundFor(5)).toBe(pending);
  });

  it('should only allow a refund request on paid invoices without an open request', () => {
    const paid = { id: 5, status: 'paid' } as any;

    expect(component.canRequestRefund({ id: 5, status: 'pending' } as any)).toBe(false);
    expect(component.canRequestRefund({ id: 5, status: 'refunded' } as any)).toBe(false);
    expect(component.canRequestRefund(paid)).toBe(true);

    component.refunds = [{ id: 1, invoiceId: 5, status: 'pending' } as any];
    expect(component.canRequestRefund(paid)).toBe(false);

    component.refunds = [{ id: 1, invoiceId: 5, status: 'approved' } as any];
    expect(component.canRequestRefund(paid)).toBe(false);

    component.refunds = [{ id: 1, invoiceId: 5, status: 'rejected' } as any];
    expect(component.canRequestRefund(paid)).toBe(true);
  });

  it('should open and close the refund form', () => {
    component.openRefund(5);
    expect(component.refundOpenId).toBe(5);

    component.closeRefund();
    expect(component.refundOpenId).toBeNull();
  });

  it('should close the refund form after a successful request', () => {
    invoiceServiceMock.requestRefund.and.returnValue({ id: 1, invoiceId: 5 });
    component.openRefund(5);

    component.submitRefund(5, { value: 'Wrong course' } as HTMLInputElement);

    expect(component.refundOpenId).toBeNull();
  });

  it('should pay a pending invoice and reload the list', () => {
    invoiceServiceMock.markPaid.and.returnValue({ id: 1 });
    invoiceServiceMock.getStudentInvoices.calls.reset();

    component.payNow(7);

    expect(invoiceServiceMock.markPaid).toHaveBeenCalledWith(7, 3);
    expect(component.paymentMessage).toBe('Invoice #7 paid. Thank you!');
    expect(invoiceServiceMock.getStudentInvoices).toHaveBeenCalledWith(3);
  });

  it('should show a message when paying fails', () => {
    invoiceServiceMock.markPaid.and.returnValue(null);

    component.payNow(7);

    expect(component.paymentMessage).toBe('Unable to pay this invoice.');
  });

  it('should not let staff pay invoices', () => {
    currentUser.set({ id: 2, role: 'accountant' });

    component.payNow(7);

    expect(invoiceServiceMock.markPaid).not.toHaveBeenCalled();
  });

  it('should format invoice dates', () => {
    const date = '2026-11-10T12:00:00.000Z';

    expect(component.formatDate(date)).toBe(
      new Date(date).toLocaleDateString()
    );
  });
});