import type { Rule } from 'eslint';
import { collectTemplateLintIssues, type TemplateLintIssue } from './lint-file.js';
import { getTemplateCoreSettings } from './settings.js';

const issuesBySource = new WeakMap<object, TemplateLintIssue[]>();

export function getCachedTemplateIssues(context: Rule.RuleContext): TemplateLintIssue[] {
  const { sourceCode } = context;
  let issues = issuesBySource.get(sourceCode);
  if (!issues) {
    issues = collectTemplateLintIssues(context.filename, sourceCode.text, getTemplateCoreSettings(context.settings));
    issuesBySource.set(sourceCode, issues);
  }
  return issues;
}

export function createDiagnosticRule(
  codes: readonly string[],
  options?: { requiresPartialsManifest?: boolean; requiresContextKeys?: boolean; requiresPartialProps?: boolean },
): Rule.RuleModule {
  return {
    meta: {
      type: 'problem',
      docs: {
        description: `Report template-core diagnostics matching ${codes.join(', ')}`,
      },
      schema: [],
      messages: {
        reported: '[{{code}}] {{message}}',
      },
    },
    create(context) {
      return {
        Program() {
          const settings = getTemplateCoreSettings(context.settings);
          if (options?.requiresPartialsManifest && !settings.partials) return;
          if (options?.requiresContextKeys && !settings.contextKeys) return;
          if (options?.requiresPartialProps && !settings.partialProps) return;

          for (const issue of getCachedTemplateIssues(context)) {
            if (!codes.includes(issue.diagnosticCode)) continue;
            context.report({
              loc: {
                start: { line: issue.line, column: issue.column - 1 },
                end: {
                  line: issue.endLine ?? issue.line,
                  column: (issue.endColumn ?? issue.column + 1) - 1,
                },
              },
              messageId: 'reported',
              data: {
                code: issue.diagnosticCode,
                message: issue.templateName ? `${issue.message} (template: ${issue.templateName})` : issue.message,
              },
            });
          }
        },
      };
    },
  };
}

export const RULE_CODES = {
  'no-raw-html': ['RAW_HTML_UNSANITIZED'],
  'no-unsafe-url': ['UNSAFE_URL_SCHEME'],
  'no-missing-partial': ['MISSING_PARTIAL'],
  'no-invalid-expression': ['INVALID_EXPRESSION', 'INVALID_TEMPLATE'],
  'no-unsupported-modifier': ['MODIFIER_CONFLICT', 'UNSUPPORTED_DIRECTIVE'],
  'no-unknown-context-path': ['UNKNOWN_CONTEXT_PATH'],
  'no-invalid-partial-props': ['MISSING_PARTIAL_PROP', 'UNKNOWN_PARTIAL_PROP'],
} as const;
