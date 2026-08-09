import { describe, expect, it } from 'vitest';
import { syntaxErrorToDiagnostic } from './syntax-diagnostic.js';
import { TemplateSyntaxError } from '../errors.js';

describe('syntaxErrorToDiagnostic', () => {
  it('maps expression parser failures to INVALID_EXPRESSION with coordinates', () => {
    const error = new TemplateSyntaxError(
      'Unexpected content in expression "count + 1" at position 6: "+ 1". Arithmetic...',
    );
    const diagnostic = syntaxErrorToDiagnostic(error, '<p>{{ count + 1 }}</p>', {
      name: 'Counter',
      sourcePath: 'src/counter.ts',
    });
    expect(diagnostic).toMatchObject({
      code: 'INVALID_EXPRESSION',
      severity: 'error',
      template: 'Counter',
      sourcePath: 'src/counter.ts',
      line: 1,
    });
  });

  it('maps modifier conflicts to MODIFIER_CONFLICT', () => {
    const error = new TemplateSyntaxError('Event modifiers .passive and .prevent cannot be combined.');
    expect(syntaxErrorToDiagnostic(error, '<button on:click.prevent.passive="x"></button>').code).toBe(
      'MODIFIER_CONFLICT',
    );
  });

  it('maps unclosed blocks to INVALID_TEMPLATE', () => {
    const error = new TemplateSyntaxError('Unclosed {{#if}} block');
    expect(syntaxErrorToDiagnostic(error, '{{#if a}}A').code).toBe('INVALID_TEMPLATE');
  });
});
