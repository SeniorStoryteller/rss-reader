import sanitizeHtmlLib from 'sanitize-html';

export function sanitizeHtml(dirty: string): string {
  return sanitizeHtmlLib(dirty, {
    allowedTags: ['a', 'b', 'br', 'em', 'i', 'img', 'li', 'ol', 'p', 'strong', 'ul'],
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt', 'title'],
    },
    allowedSchemes: ['http', 'https'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    // Drop non-https image sources to match the prior DOMPurify behaviour
    transformTags: {
      img: (tagName, attribs) => {
        if (attribs.src && !attribs.src.startsWith('https://')) {
          const { src: _src, ...rest } = attribs;
          return { tagName, attribs: rest };
        }
        return { tagName, attribs };
      },
    },
  });
}
