// shortcut: simple non-cryptographic hash so plain passwords are not stored; a real hash (bcrypt) comes with the backend in Milestone 2.
export function hashPassword(password: string): string {
  let h = 5381;
  for (const ch of password) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return 'h' + (h >>> 0).toString(16);
}

/** Keeps only the last 4 digits; the full card number is never stored. */
export function last4(cardNumber: string): string {
  return cardNumber.replace(/\D/g, '').slice(-4);
}
