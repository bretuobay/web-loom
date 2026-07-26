const URL_BEARING_ATTRS = new Set([
  'href',
  'src',
  'action',
  'formaction',
  'poster',
  'cite',
  'background',
  'xlink:href',
  'data',
]);

// eslint-disable-next-line no-control-regex -- deliberately matching ASCII control chars used to evade scheme checks
const CONTROL_CHARS_RE = /[\x00-\x1f\x7f]/g;

/** Attribute names that conventionally hold a URL, checked for unsafe schemes. */
export function isUrlBearingAttribute(name: string): boolean {
  return URL_BEARING_ATTRS.has(name.toLowerCase());
}

/**
 * Deny-list check only — never a sanitizer or allow-list. Flags the small,
 * well-known set of schemes that execute as code when bound into a URL
 * context (`javascript:`, `vbscript:`, `data:text/html`), tolerant of
 * leading/embedded control characters and whitespace used to evade naive
 * checks. Anything else (other `data:` subtypes, `mailto:`, `tel:`,
 * relative paths, `#fragment`) is left alone — validating those is an
 * application concern (see docs/PRD.md §9).
 */
export function isDangerousUrlScheme(value: string): boolean {
  const normalized = value.replace(CONTROL_CHARS_RE, '').trim().toLowerCase();
  return (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('data:text/html')
  );
}
