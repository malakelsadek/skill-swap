import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

// Every page is a lazy-loaded route. `title` becomes the browser tab title ("Home | SkillSwap").
export const routes: Routes = [
  // Member 1: foundation, login, user pages
  { path: '', title: 'Home', loadComponent: () => import('./features/home/home').then((m) => m.Home) },
  { path: 'signup', title: 'Sign up', loadComponent: () => import('./features/auth/signup').then((m) => m.Signup) },
  { path: 'login', title: 'Log in', loadComponent: () => import('./features/auth/login').then((m) => m.Login) },
  {
    path: 'profile',
    title: 'My profile',
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
    canActivate: [authGuard],
  },
  {
    path: 'admin/users',
    title: 'Users',
    loadComponent: () => import('./features/admin/users').then((m) => m.AdminUsers),
    canActivate: [roleGuard('admin')],
  },
  { path: 'forbidden', title: 'Not authorized', loadComponent: () => import('./shared/forbidden/forbidden').then((m) => m.Forbidden) },

  // Member 2: courses and instructor
  { path: 'courses', title: 'Courses', loadComponent: () => import('./features/courses/catalog').then((m) => m.Catalog) },
  { path: 'courses/:id', title: 'Course', loadComponent: () => import('./features/courses/course-detail').then((m) => m.CourseDetail) },
  {
    path: 'instructor',
    title: 'Instructor dashboard',
    loadComponent: () => import('./features/instructor/instructor-dashboard').then((m) => m.InstructorDashboard),
    canActivate: [roleGuard('instructor', 'admin')],
  },
  {
    path: 'instructor/earnings',
    title: 'My earnings',
    loadComponent: () => import('./features/instructor/earnings').then((m) => m.Earnings),
    canActivate: [roleGuard('instructor', 'admin')],
  },

  // Member 3: student commerce and fees
  {
    path: 'cart',
    title: 'Cart',
    loadComponent: () => import('./features/student/cart/cart').then((m) => m.Cart),
    canActivate: [roleGuard('student')],
  },
  {
    path: 'checkout',
    title: 'Checkout',
    loadComponent: () => import('./features/student/checkout/checkout').then((m) => m.Checkout),
    canActivate: [roleGuard('student')],
  },
  {
    path: 'invoices',
    title: 'Invoices',
    loadComponent: () => import('./features/student/invoices/invoices').then((m) => m.Invoices),
    canActivate: [roleGuard('student', 'accountant', 'admin')],
  },
  {
    path: 'payments',
    title: 'Payment history',
    loadComponent: () => import('./features/student/payments/payments').then((m) => m.Payments),
    canActivate: [roleGuard('student')],
  },

  // Member 4: accounting (accountant and admin only)
  {
    path: 'accounting/payroll',
    title: 'Staff payroll',
    loadComponent: () => import('./features/accounting/payroll').then((m) => m.Payroll),
    canActivate: [roleGuard('accountant', 'admin')],
  },
  {
    path: 'accounting/budget',
    title: 'Department budget',
    loadComponent: () => import('./features/accounting/budget').then((m) => m.Budget),
    canActivate: [roleGuard('accountant', 'admin')],
  },
  {
    path: 'accounting/payouts',
    title: 'Instructor payouts',
    loadComponent: () => import('./features/accounting/payouts').then((m) => m.Payouts),
    canActivate: [roleGuard('accountant', 'admin')],
  },
  {
    path: 'accounting/refunds',
    title: 'Refund approvals',
    loadComponent: () => import('./features/accounting/refunds').then((m) => m.Refunds),
    canActivate: [roleGuard('accountant', 'admin')],
  },

  { path: '**', redirectTo: '' },
];
