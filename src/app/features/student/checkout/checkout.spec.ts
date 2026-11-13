import { TestBed } from '@angular/core/testing';
import { resetSpies } from '../../../testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Checkout } from './checkout';
import { CartService } from '../cart.service';
import { InvoiceService } from '../invoice.service';
import { AuthService } from '../../../core/services/auth.service';
import { SUBSCRIPTION_PRICE } from '../../../core/config';
import { Course, Invoice } from '../../../core/models';

describe('Checkout', () => {
  let plan: string | null;

  const course = { id: 1, title: 'Angular Basics', price: 25 } as Course;

  const courseInvoice: Invoice = {
    id: 7,
    studentId: 3,
    items: [{ courseId: 1, price: 25 }],
    total: 25,
    date: '2026-11-10T12:00:00.000Z',
    status: 'pending',
    type: 'course'
  };

  const cartServiceMock = {
    cart: signal<Course[]>([]),
    total: signal(0),
    clear: jasmine.createSpy(),
    refresh: jasmine.createSpy()
  };

  const invoiceServiceMock = {
    checkoutCourses: jasmine.createSpy(),
    checkoutSubscription: jasmine.createSpy(),
    markPaid: jasmine.createSpy()
  };

  const authServiceMock = {
    currentUser: signal<{ id: number } | null>({ id: 3 })
  };

  const routerMock = {
    navigate: jasmine.createSpy()
  };

  function create() {
    const fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  beforeEach(async () => {
    plan = null;
    resetSpies(cartServiceMock, invoiceServiceMock, routerMock);

    cartServiceMock.cart.set([course]);
    cartServiceMock.total.set(25);
    authServiceMock.currentUser.set({ id: 3 });
    invoiceServiceMock.checkoutCourses.and.returnValue(courseInvoice);
    invoiceServiceMock.checkoutSubscription.and.returnValue({
      ...courseInvoice,
      items: [],
      total: SUBSCRIPTION_PRICE,
      type: 'subscription'
    });
    invoiceServiceMock.markPaid.and.returnValue({ id: 1 });

    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        { provide: CartService, useValue: cartServiceMock },
        { provide: InvoiceService, useValue: invoiceServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: jasmine.createSpy().and.callFake(() => plan)
              }
            }
          }
        }
      ]
    }).compileComponents();
  });

  it('should create and refresh the cart', () => {
    const { component } = create();

    expect(component).toBeTruthy();
    expect(cartServiceMock.refresh).toHaveBeenCalled();
  });

  it('Pay Now: creates the invoice, marks it paid and clears the cart', () => {
    const { fixture, component } = create();

    component.payNow();
    fixture.detectChanges();

    expect(invoiceServiceMock.checkoutCourses).toHaveBeenCalledWith(3, [course]);
    expect(invoiceServiceMock.markPaid).toHaveBeenCalledWith(7, 3);
    expect(cartServiceMock.clear).toHaveBeenCalled();
    expect(component.result()?.paid).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Payment successful');
  });

  it('Pay Later: creates the invoice but leaves it pending', () => {
    const { fixture, component } = create();

    component.payLater();
    fixture.detectChanges();

    expect(invoiceServiceMock.checkoutCourses).toHaveBeenCalled();
    expect(invoiceServiceMock.markPaid).not.toHaveBeenCalled();
    expect(cartServiceMock.clear).toHaveBeenCalled();
    expect(component.result()?.paid).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Invoice created');
  });

  it('should show a message and keep the cart if a course is already owned', () => {
    invoiceServiceMock.checkoutCourses.and.returnValue(null);
    const { component } = create();

    component.payNow();

    expect(component.message()).toContain('already own');
    expect(cartServiceMock.clear).not.toHaveBeenCalled();
    expect(invoiceServiceMock.markPaid).not.toHaveBeenCalled();
    expect(component.result()).toBeNull();
  });

  it('should not check out an empty cart', () => {
    cartServiceMock.cart.set([]);
    const { component } = create();

    component.payNow();

    expect(component.message()).toBe('Your cart is empty.');
    expect(invoiceServiceMock.checkoutCourses).not.toHaveBeenCalled();
  });

  it('should ask the user to log in if nobody is logged in', () => {
    authServiceMock.currentUser.set(null);
    const { component } = create();

    component.payNow();

    expect(component.message()).toBe('Please log in before checkout.');
    expect(invoiceServiceMock.checkoutCourses).not.toHaveBeenCalled();
  });

  it('subscription: creates a subscription invoice, pays it and keeps the cart', () => {
    plan = 'subscription';
    const { component } = create();

    component.payNow();

    expect(component.isSubscription).toBe(true);
    expect(invoiceServiceMock.checkoutSubscription).toHaveBeenCalledWith(3);
    expect(invoiceServiceMock.checkoutCourses).not.toHaveBeenCalled();
    expect(invoiceServiceMock.markPaid).toHaveBeenCalledWith(7, 3);
    expect(cartServiceMock.clear).not.toHaveBeenCalled();
    expect(component.result()?.paid).toBe(true);
  });
});