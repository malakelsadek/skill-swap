import { Category } from './models';

export const REVENUE_SHARE = 0.7; // instructor's share of each sale
export const SUBSCRIPTION_PRICE = 19.99; // monthly plan
export const CATEGORIES: Category[] = ['Design', 'Business', 'Programming'];

// Storage keys. localStorage = mock database, sessionStorage = session + cart, cookie = remember me.
export const KEYS = {
  users: 'sw_users',
  courses: 'sw_courses',
  invoices: 'sw_invoices',
  payments: 'sw_payments',
  refunds: 'sw_refunds',
  enrollments: 'sw_enrollments',
  staff: 'sw_staff',
  budget: 'sw_budget',
  theme: 'sw_theme',
  sound: 'sw_sound',
  session: 'sw_session',
  cart: 'sw_cart',
  chat: 'sw_chat',
  chatKey: 'sw_chat_key',
  rememberCookie: 'sw_remember',
} as const;
