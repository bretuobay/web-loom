import type { ESLint, Linter } from 'eslint';
import { createDiagnosticRule, RULE_CODES } from './create-rule.js';

const plugin = {
  meta: {
    name: '@web-loom/template-core-lint',
    version: '0.1.0',
  },
  rules: {
    'no-raw-html': createDiagnosticRule(RULE_CODES['no-raw-html']),
    'no-unsafe-url': createDiagnosticRule(RULE_CODES['no-unsafe-url']),
    'no-missing-partial': createDiagnosticRule(RULE_CODES['no-missing-partial'], {
      requiresPartialsManifest: true,
    }),
    'no-invalid-expression': createDiagnosticRule(RULE_CODES['no-invalid-expression']),
    'no-unsupported-modifier': createDiagnosticRule(RULE_CODES['no-unsupported-modifier']),
    'no-unknown-context-path': createDiagnosticRule(RULE_CODES['no-unknown-context-path'], {
      requiresContextKeys: true,
    }),
  },
};

const recommendedRules: Linter.RulesRecord = {
  'template-core/no-raw-html': 'warn',
  'template-core/no-unsafe-url': 'warn',
  'template-core/no-missing-partial': 'error',
  'template-core/no-invalid-expression': 'error',
  'template-core/no-unsupported-modifier': 'error',
  'template-core/no-unknown-context-path': 'warn',
};

export default plugin;

export const configs = {
  recommended: [
    {
      plugins: {
        'template-core': plugin,
      },
      rules: recommendedRules,
    },
  ] satisfies Linter.Config[],
};

export function templateCoreLint(): ESLint.Plugin {
  return plugin as unknown as ESLint.Plugin;
}

export type { TemplateCoreLintSettings } from './settings.js';
