/**
 * Thrown by `compile()` for malformed templates: unclosed/mismatched block
 * tags, expressions outside the CSP-safe grammar (PRD §6.7), or directives
 * not yet implemented in Phase 1 (`use:`, `bind:`, event modifiers,
 * `{{#switch}}`, `{{> partial }}`). Always names the offending construct.
 */
export class TemplateSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateSyntaxError';
  }
}
