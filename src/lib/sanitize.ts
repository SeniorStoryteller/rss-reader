import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window as unknown as typeof globalThis);

purify.addHook('afterSanitizeAttributes', (node) => {
  if (node.hasAttribute('src')) {
    const src = node.getAttribute('src') || '';
    if (!src.startsWith('https://')) {
      node.removeAttribute('src');
    }
  }
});

export function sanitizeHtml(dirty: string): string {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['a', 'b', 'br', 'em', 'i', 'img', 'li', 'ol', 'p', 'strong', 'ul'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
  });
}
