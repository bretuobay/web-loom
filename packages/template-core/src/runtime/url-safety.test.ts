import { describe, expect, it } from 'vitest';
import { isDangerousUrlScheme, isUrlBearingAttribute } from './url-safety.js';

describe('isUrlBearingAttribute', () => {
  it.each(['href', 'src', 'action', 'formaction', 'poster', 'cite', 'background', 'xlink:href', 'data', 'HREF'])(
    'flags %s as URL-bearing',
    (name) => {
      expect(isUrlBearingAttribute(name)).toBe(true);
    },
  );

  it.each(['title', 'aria-label', 'data-id', 'class', 'id'])('does not flag %s as URL-bearing', (name) => {
    expect(isUrlBearingAttribute(name)).toBe(false);
  });
});

describe('isDangerousUrlScheme', () => {
  it.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    '  javascript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    'DATA:TEXT/HTML,x',
  ])('flags %j as dangerous', (value) => {
    expect(isDangerousUrlScheme(value)).toBe(true);
  });

  it.each([
    'https://example.com',
    'http://example.com',
    'mailto:a@b.com',
    'tel:+15551234567',
    '/relative/path',
    '#fragment',
    'data:image/png;base64,iVBORw0KGgo=',
    '',
  ])('does not flag %j as dangerous', (value) => {
    expect(isDangerousUrlScheme(value)).toBe(false);
  });

  it('strips embedded control characters used to evade naive checks', () => {
    expect(isDangerousUrlScheme('java\x00script:alert(1)')).toBe(true);
    expect(isDangerousUrlScheme('\x01\x02javascript:alert(1)')).toBe(true);
  });
});
