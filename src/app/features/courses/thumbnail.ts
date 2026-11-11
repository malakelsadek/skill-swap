import { Category } from '../../core/models';

const COLORS: Record<Category, [string, string]> = {
  Design: ['#ffa73d', '#e56a00'],
  Business: ['#2d6be4', '#0a2a63'],
  Programming: ['#0f3c8a', '#ff7a00'],
};

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Generates a small SVG data URL used as a course thumbnail, so the seed data needs no image files
 * and works offline. Instructors can upload their own picture instead.
 */
export function generateThumbnail(category: Category, title: string): string {
  const [from, to] = COLORS[category];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="320" height="180" fill="url(#g)"/>` +
    `<text x="16" y="34" fill="#fff" opacity="0.85" font-family="Arial" font-size="16">${category}</text>` +
    `<text x="16" y="160" fill="#fff" font-family="Arial" font-size="20" font-weight="bold">${escapeXml(title.slice(0, 28))}</text>` +
    `</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
