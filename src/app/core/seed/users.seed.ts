import { User } from '../models';
import { hashPassword } from '../utils';

// Demo accounts for testing only. Every account's password is "Pass1234".
const pw = hashPassword('Pass1234');
const prefs = { theme: 'light', favoriteCategories: [], sound: true } as User['preferences'];
const card = (last4: string, holder: string) => ({ holder, last4, expiry: '12/29' });

export const USERS_SEED: User[] = [
  { id: 1, username: 'admin', name: 'Alex Admin', email: 'admin@skillswap.test', picture: '', password: pw, role: 'admin', card: card('0001', 'Alex Admin'), preferences: prefs },
  { id: 2, username: 'accountant', name: 'Amira Accountant', email: 'accountant@skillswap.test', picture: '', password: pw, role: 'accountant', card: card('0002', 'Amira Accountant'), preferences: prefs },
  { id: 3, username: 'student1', name: 'Sara Student', email: 'sara@skillswap.test', picture: '', password: pw, role: 'student', card: card('1111', 'Sara Student'), preferences: prefs },
  { id: 4, username: 'student2', name: 'Omar Student', email: 'omar@skillswap.test', picture: '', password: pw, role: 'student', card: card('2222', 'Omar Student'), preferences: prefs },
  { id: 5, username: 'instructor1', name: 'Dina Instructor', email: 'dina@skillswap.test', picture: '', password: pw, role: 'instructor', card: card('3333', 'Dina Instructor'), preferences: prefs },
  { id: 6, username: 'instructor2', name: 'Karim Instructor', email: 'karim@skillswap.test', picture: '', password: pw, role: 'instructor', card: card('4444', 'Karim Instructor'), preferences: prefs },
];
