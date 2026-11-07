import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

// Every route is lazy-loaded. To plug in a real page, replace `stub(...)` with
// () => import('./features/<area>/<file>').then((m) => m.<Component>)
const stub = () => import('./shared/placeholder/placeholder').then((m) => m.Placeholder);
const page = (title: string, owner: string) => ({ loadComponent: stub, data: { title, owner } });

export const routes: Routes = [
  // Member 1
  { path: '', ...page('Home', 'Member 1') },
  { path: 'signup', ...page('Sign up', 'Member 1') },
  { path: 'login', ...page('Log in', 'Member 1') },
  { path: 'profile', ...page('Profile', 'Member 1'), canActivate: [authGuard] },
  { path: 'admin/users', ...page('Users', 'Member 1'), canActivate: [roleGuard('admin')] },
  { path: 'forbidden', loadComponent: () => import('./shared/forbidden/forbidden').then((m) => m.Forbidden) },

  // Member 2: courses and instructor
  { path: 'courses', ...page('Courses', 'Member 2') },
  { path: 'courses/:id', ...page('Course detail', 'Member 2') },
  { path: 'instructor', ...page('Instructor dashboard', 'Member 2'), canActivate: [roleGuard('instructor', 'admin')] },

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
