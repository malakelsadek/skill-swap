// shortcut: simple non-cryptographic hash so plain passwords are not stored; a real hash (bcrypt) comes with the backend in Milestone 2.
export function hashPassword(password: string): string {
  let h = 5381;
  for (const ch of password) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return 'h' + (h >>> 0).toString(16);
}

export const MAX_PICTURE_BYTES = 500 * 1024; // keeps localStorage from filling up

/** Reads an image file as a data URL, or rejects with a message the user can read. */
export function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject('Please choose an image file');
    if (file.size > MAX_PICTURE_BYTES) return reject('Picture must be under 500 KB');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject('Could not read the file');
    reader.readAsDataURL(file);
  });
}

/** Keeps only the last 4 digits; the full card number is never stored. */
export function last4(cardNumber: string): string {
  return cardNumber.replace(/\D/g, '').slice(-4);
}
