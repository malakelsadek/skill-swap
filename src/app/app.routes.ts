import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

// Every route is lazy-loaded. To plug in a real page, replace `stub(...)` with
// () => import('./features/<area>/<file>').then((m) => m.<Component>)
const stub = () => import('./shared/placeholder/placeholder').then((m) => m.Placeholder);
const page = (title: string, owner: string) => ({ loadComponent: stub, data: { title, owner } });

export const routes: Routes = [
  // Member 1
  { path: '', title: 'Home', loadComponent: () => import('./features/home/home').then((m) => m.Home) },
  { path: 'signup', title: 'Sign up', loadComponent: () => import('./features/auth/signup').then((m) => m.Signup) },
  { path: 'login', title: 'Log in', loadComponent: () => import('./features/auth/login').then((m) => m.Login) },
  { path: 'profile', title: 'My profile', loadComponent: () => import('./features/profile/profile').then((m) => m.Profile), canActivate: [authGuard] },
  { path: 'admin/users', title: 'Users', loadComponent: () => import('./features/admin/users').then((m) => m.AdminUsers), canActivate: [roleGuard('admin')] },
  { path: 'forbidden', title: 'Not authorized', loadComponent: () => import('./shared/forbidden/forbidden').then((m) => m.Forbidden) },

  // Member 2: courses and instructor
  { path: 'courses', loadComponent: () => import('./features/courses/catalog').then((m) => m.Catalog) },
  { path: 'courses/:id', loadComponent: () => import('./features/courses/course-detail').then((m) => m.CourseDetail) },
  { path: 'instructor', loadComponent: () => import('./features/instructor/instructor-dashboard').then((m) => m.InstructorDashboard), canActivate: [roleGuard('instructor', 'admin')] },
  { path: 'instructor/earnings', loadComponent: () => import('./features/instructor/earnings').then((m) => m.Earnings), canActivate: [roleGuard('instructor', 'admin')] },

  // Member 3: student commerce and fees
  { path: 'cart', ...page('Cart', 'Member 3'), canActivate: [roleGuard('student')] },
  { path: 'checkout', ...page('Checkout', 'Member 3'), canActivate: [roleGuard('student')] },
  { path: 'invoices', ...page('Invoices', 'Member 3'), canActivate: [roleGuard('student', 'accountant', 'admin')] },
  { path: 'payments', ...page('Payment history', 'Member 3'), canActivate: [roleGuard('student')] },

  // Member 4: accounting (accountant and admin only)
  { path: 'accounting/payroll', ...page('Staff payroll', 'Member 4'), canActivate: [roleGuard('accountant', 'admin')] },
  { path: 'accounting/budget', ...page('Department budget', 'Member 4'), canActivate: [roleGuard('accountant', 'admin')] },
  { path: 'accounting/payouts', ...page('Instructor payouts', 'Member 4'), canActivate: [roleGuard('accountant', 'admin')] },
  { path: 'accounting/refunds', ...page('Refund approvals', 'Member 4'), canActivate: [roleGuard('accountant', 'admin')] },

  { path: '**', redirectTo: '' },
];
