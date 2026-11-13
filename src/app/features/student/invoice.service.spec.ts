import { TestBed } from '@angular/core/testing';
import { resetSpies } from '../../testing';
import { InvoiceService } from './invoice.service';
import { StorageService } from '../../core/services/storage.service';
import { KEYS, SUBSCRIPTION_PRICE } from '../../core/config';
import { Course, Invoice, Payment, Enrollment, Refund } from '../../core/models';

describe('InvoiceService', () => {
  let service: InvoiceService;

  const mockData: Record<string, unknown> = {};

  const storageMock = {
    local: {
      get: jasmine.createSpy().and.callFake((key: string) => mockData[key] ?? null),
      set: jasmine.createSpy().and.callFake((key: string, value: unknown) => {
        mockData[key] = value;
      })
    }
  };

  const courses = [
    { id: 1, price: 25 },
    { id: 2, price: 35 }
  ] as Course[];

  const pendingInvoice: Invoice = {
    id: 10,
    studentId: 3,
    items: [{ courseId: 1, price: 25 }],
    total: 25,
    date: '2026-11-10T12:00:00.000Z',
    status: 'pending',
    type: 'course'
  };

  const paidInvoice: Invoice = { ...pendingInvoice, status: 'paid' };

  beforeEach(() => {
    Object.keys(mockData).forEach(key => delete mockData[key]);

    TestBed.configureTestingModule({
      providers: [
        InvoiceService,
        { provide: StorageService, useValue: storageMock }
      ]
    });

    service = TestBed.inject(InvoiceService);
    resetSpies(storageMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('create invoice (checkout)', () => {
    it('should create a PENDING invoice for course purchases', () => {
      const invoice = service.checkoutCourses(3, courses)!;

      expect(invoice.studentId).toBe(3);
      expect(invoice.total).toBe(60);
      expect(invoice.status).toBe('pending');
      expect(invoice.type).toBe('course');
      expect(invoice.items.length).toBe(2);
      expect((mockData[KEYS.invoices] as unknown[]).length).toBe(1);
    });

    it('should not create a payment or enrollments yet', () => {
      service.checkoutCourses(3, courses);

      expect(mockData[KEYS.payments]).toBeUndefined();
      expect(mockData[KEYS.enrollments]).toBeUndefined();
    });

    it('should round the total to cents', () => {
      const invoice = service.checkoutCourses(3, [
        { id: 1, price: 49.99 },
        { id: 2, price: 39.99 }
      ] as Course[])!;

      expect(invoice.total).toBe(89.98);
    });

    it('should return null for an empty cart', () => {
      expect(service.checkoutCourses(3, [])).toBeNull();
      expect(mockData[KEYS.invoices]).toBeUndefined();
    });

    it('should return null if the student already owns one of the courses', () => {
      mockData[KEYS.enrollments] = [{ studentId: 3, courseId: 2, date: 'x' }];

      expect(service.checkoutCourses(3, courses)).toBeNull();
    });

    it('should allow another student to buy a course someone else owns', () => {
      mockData[KEYS.enrollments] = [{ studentId: 4, courseId: 2, date: 'x' }];

      expect(service.checkoutCourses(3, courses)).not.toBeNull();
    });

    it('should create a PENDING subscription invoice', () => {
      const invoice = service.checkoutSubscription(3);

      expect(invoice.studentId).toBe(3);
      expect(invoice.total).toBe(SUBSCRIPTION_PRICE);
      expect(invoice.status).toBe('pending');
      expect(invoice.type).toBe('subscription');
      expect(invoice.items.length).toBe(0);
    });

    it('should generate unique invoice IDs', () => {
      const first = service.checkoutCourses(3, courses)!;
      const second = service.checkoutSubscription(3);

      expect(second.id).toBeGreaterThan(first.id);
    });
  });

  describe('markPaid', () => {
    it('should turn a pending invoice into paid', () => {
      mockData[KEYS.invoices] = [pendingInvoice];

      service.markPaid(10, 3);

      const invoices = mockData[KEYS.invoices] as Invoice[];
      expect(invoices[0].status).toBe('paid');
    });

    it('should save a payment with the invoice total', () => {
      mockData[KEYS.invoices] = [pendingInvoice];

      const payment = service.markPaid(10, 3);

      const payments = mockData[KEYS.payments] as Payment[];
      expect(payment).not.toBeNull();
      expect(payments.length).toBe(1);
      expect(payments[0].invoiceId).toBe(10);
      expect(payments[0].studentId).toBe(3);
      expect(payments[0].amount).toBe(25);
    });

    it('should create enrollments for the purchased courses', () => {
      mockData[KEYS.invoices] = [pendingInvoice];

      service.markPaid(10, 3);

      const enrollments = mockData[KEYS.enrollments] as Enrollment[];
      expect(enrollments.length).toBe(1);
      expect(enrollments[0].studentId).toBe(3);
      expect(enrollments[0].courseId).toBe(1);
    });

    it('should not create enrollments for a subscription', () => {
      mockData[KEYS.invoices] = [
        { ...pendingInvoice, items: [], total: SUBSCRIPTION_PRICE, type: 'subscription' }
      ];

      service.markPaid(10, 3);

      expect(mockData[KEYS.enrollments]).toBeUndefined();
      expect((mockData[KEYS.payments] as unknown[]).length).toBe(1);
    });

    it('should return null if the invoice is already paid', () => {
      mockData[KEYS.invoices] = [paidInvoice];

      expect(service.markPaid(10, 3)).toBeNull();
      expect(mockData[KEYS.payments]).toBeUndefined();
    });

    it("should return null for another student's invoice", () => {
      mockData[KEYS.invoices] = [pendingInvoice];

      expect(service.markPaid(10, 4)).toBeNull();
      expect((mockData[KEYS.invoices] as Invoice[])[0].status).toBe('pending');
    });

    it('should return null for an unknown invoice', () => {
      mockData[KEYS.invoices] = [pendingInvoice];

      expect(service.markPaid(99, 3)).toBeNull();
    });

    it('should work end to end after checkout', () => {
      const invoice = service.checkoutCourses(3, courses)!;

      service.markPaid(invoice.id, 3);

      expect(service.getStudentInvoices(3)[0].status).toBe('paid');
      expect(service.getStudentPayments(3)[0].amount).toBe(60);
      expect((mockData[KEYS.enrollments] as Enrollment[]).length).toBe(2);
    });
  });

  describe('reading data', () => {
    it('should return only the student invoices, newest first', () => {
      mockData[KEYS.invoices] = [
        { ...pendingInvoice, id: 1, date: '2026-11-01T10:00:00.000Z' },
        { ...pendingInvoice, id: 2, studentId: 4, date: '2026-11-05T10:00:00.000Z' },
        { ...pendingInvoice, id: 3, date: '2026-11-09T10:00:00.000Z' }
      ];

      expect(service.getStudentInvoices(3).map(i => i.id)).toEqual([3, 1]);
    });

    it('should return all invoices for staff', () => {
      mockData[KEYS.invoices] = [
        { ...pendingInvoice, id: 1 },
        { ...pendingInvoice, id: 2, studentId: 4 }
      ];

      expect(service.getAllInvoices().length).toBe(2);
    });

    it('should return only the student payments', () => {
      mockData[KEYS.payments] = [
        { id: 1, invoiceId: 1, studentId: 3, amount: 10, date: '2026-11-01T10:00:00.000Z' },
        { id: 2, invoiceId: 2, studentId: 4, amount: 20, date: '2026-11-02T10:00:00.000Z' }
      ];

      const payments = service.getStudentPayments(3);
      expect(payments.length).toBe(1);
      expect(payments[0].amount).toBe(10);
    });

    it('should return empty lists when nothing is saved', () => {
      expect(service.getStudentInvoices(3)).toEqual([]);
      expect(service.getStudentPayments(3)).toEqual([]);
      expect(service.getStudentRefunds(3)).toEqual([]);
      expect(service.getAllRefunds()).toEqual([]);
    });
  });

  describe('requestRefund', () => {
    it('should create a pending refund request', () => {
      mockData[KEYS.invoices] = [paidInvoice];
      mockData[KEYS.refunds] = [];

      const result = service.requestRefund(10, 3, 'Incorrect course');

      expect(result?.status).toBe('pending');
      expect(result?.reason).toBe('Incorrect course');
      expect(result?.studentId).toBe(3);
      expect((mockData[KEYS.refunds] as unknown[]).length).toBe(1);
    });

    it('should prevent duplicate pending refund requests', () => {
      mockData[KEYS.invoices] = [paidInvoice];
      mockData[KEYS.refunds] = [
        { id: 1, invoiceId: 10, studentId: 3, reason: 'First request', status: 'pending', date: '2026-11-10T12:00:00.000Z' }
      ];

      expect(service.requestRefund(10, 3, 'Another request')).toBeNull();
      expect((mockData[KEYS.refunds] as unknown[]).length).toBe(1);
    });

    it('should reject requests for another student invoice', () => {
      mockData[KEYS.invoices] = [paidInvoice];
      mockData[KEYS.refunds] = [];

      expect(service.requestRefund(10, 4, 'Incorrect course')).toBeNull();
    });

    it('should reject requests for unpaid invoices', () => {
      mockData[KEYS.invoices] = [pendingInvoice];
      mockData[KEYS.refunds] = [];

      expect(service.requestRefund(10, 3, 'Incorrect course')).toBeNull();
    });

    it('should allow a new request after a previous rejection', () => {
      mockData[KEYS.invoices] = [paidInvoice];
      mockData[KEYS.refunds] = [
        { id: 1, invoiceId: 10, studentId: 3, reason: 'First request', status: 'rejected', date: '2026-11-10T12:00:00.000Z' }
      ];

      const result = service.requestRefund(10, 3, 'Second request');

      expect(result?.status).toBe('pending');
      expect(result?.id).toBe(2);
      expect((mockData[KEYS.refunds] as unknown[]).length).toBe(2);
    });
  });

  describe('resolveRefund', () => {
    const pendingRefund: Refund = {
      id: 1,
      invoiceId: 10,
      studentId: 3,
      reason: 'Incorrect course',
      status: 'pending',
      date: '2026-11-10T12:00:00.000Z'
    };

    beforeEach(() => {
      mockData[KEYS.invoices] = [paidInvoice];
      mockData[KEYS.refunds] = [pendingRefund];
      mockData[KEYS.enrollments] = [
        { studentId: 3, courseId: 1, date: 'x' },
        { studentId: 3, courseId: 5, date: 'x' }
      ];
    });

    it('should approve: refund approved, invoice refunded, course access removed', () => {
      const result = service.resolveRefund(1, true);

      expect(result?.status).toBe('approved');
      expect((mockData[KEYS.invoices] as Invoice[])[0].status).toBe('refunded');
      expect((mockData[KEYS.enrollments] as Enrollment[]).map(e => e.courseId)).toEqual([5]);
    });

    it('should reject: invoice stays paid and access is kept', () => {
      const result = service.resolveRefund(1, false);

      expect(result?.status).toBe('rejected');
      expect((mockData[KEYS.invoices] as Invoice[])[0].status).toBe('paid');
      expect((mockData[KEYS.enrollments] as Enrollment[]).length).toBe(2);
    });

    it('should return null for an unknown or already resolved refund', () => {
      expect(service.resolveRefund(99, true)).toBeNull();

      service.resolveRefund(1, true);
      expect(service.resolveRefund(1, false)).toBeNull();
    });
  });
});
