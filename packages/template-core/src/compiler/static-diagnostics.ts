import type {
  AnalyzeOptions,
  BindingRecord,
  BlockRecord,
  ExpressionNode,
  RootTemplate,
  SourceLocation,
  TemplateDiagnostic,
  TextPart,
} from '../types.js';
import { isDangerousUrlScheme, isUrlBearingAttribute } from '../runtime/url-safety.js';

function locationForPath(
  sourceMap: Record<string, SourceLocation> | undefined,
  path: number[],
): Pick<TemplateDiagnostic, 'line' | 'column'> {
  const location = sourceMap?.[path.join('.')];
  return location ? { line: location.line, column: location.column } : {};
}

function joinStaticParts(parts: TextPart[]): string {
  return parts
    .filter((part): part is { static: string } => 'static' in part)
    .map((part) => part.static)
    .join('');
}

function collectBindingDiagnostics(
  bindings: BindingRecord[],
  sourceMap: Record<string, SourceLocation> | undefined,
  options: AnalyzeOptions,
  diagnostics: TemplateDiagnostic[],
): void {
  for (const binding of bindings) {
    if (binding.kind === 'raw-html') {
      diagnostics.push({
        code: 'RAW_HTML_UNSANITIZED',
        severity: 'warning',
        message:
          'A {{{ }}} raw-HTML binding was found. template-core does not sanitize HTML content — sanitize ' +
          'untrusted values in the ViewModel before binding. See docs/PRD.md §9 (Security).',
        template: options.name,
        sourcePath: options.sourcePath,
        nodePath: binding.path,
        ...locationForPath(sourceMap, binding.path),
      });
    }

    if (binding.kind === 'attr-interp' && isUrlBearingAttribute(binding.name)) {
      const value = joinStaticParts(binding.parts);
      if (value && isDangerousUrlScheme(value)) {
        diagnostics.push(unsafeUrlDiagnostic(binding.path, binding.name, options, sourceMap));
      }
    }

    if (binding.kind === 'prop-or-attr' && isUrlBearingAttribute(binding.name)) {
      const value = literalStringValue(binding.expr);
      if (value && isDangerousUrlScheme(value)) {
        diagnostics.push(unsafeUrlDiagnostic(binding.path, binding.name, options, sourceMap));
      }
    }
  }
}

function literalStringValue(expr: ExpressionNode): string | undefined {
  return expr.kind === 'literal' && typeof expr.value === 'string' ? expr.value : undefined;
}

function unsafeUrlDiagnostic(
  path: number[],
  attribute: string,
  options: AnalyzeOptions,
  sourceMap: Record<string, SourceLocation> | undefined,
): TemplateDiagnostic {
  return {
    code: 'UNSAFE_URL_SCHEME',
    severity: 'warning',
    message:
      `Attribute "${attribute}" uses a potentially unsafe URL scheme. template-core does not validate URLs — ` +
      'allow-list http(s)/mailto/tel in the ViewModel for untrusted data. See docs/PRD.md §9 (Security).',
    template: options.name,
    sourcePath: options.sourcePath,
    nodePath: path,
    details: { attribute },
    ...locationForPath(sourceMap, path),
  };
}

function collectBlockDiagnostics(
  blocks: BlockRecord[],
  sourceMap: Record<string, SourceLocation> | undefined,
  options: AnalyzeOptions,
  diagnostics: TemplateDiagnostic[],
): void {
  for (const block of blocks) {
    if (block.kind === 'partial' && options.partials !== undefined && !(block.name in options.partials)) {
      diagnostics.push({
        code: 'MISSING_PARTIAL',
        severity: options.strictPartials ? 'error' : 'warning',
        message: `Missing partial "${block.name}".`,
        template: options.name,
        sourcePath: options.sourcePath,
        nodePath: block.path,
        details: { partial: block.name },
        ...locationForPath(sourceMap, block.path),
      });
    }

    if (block.kind === 'if') {
      for (const branch of block.branches) {
        collectRootDiagnostics(branch.template, sourceMap, options, diagnostics);
      }
      continue;
    }

    if (block.kind === 'each') {
      collectRootDiagnostics(block.template, sourceMap, options, diagnostics);
      if (block.empty) collectRootDiagnostics(block.empty, sourceMap, options, diagnostics);
      continue;
    }

    if (block.kind === 'switch') {
      for (const branch of block.branches) {
        collectRootDiagnostics(branch.template, sourceMap, options, diagnostics);
      }
    }
  }
}

/** Collects compile-time warnings/errors that do not require a live ViewModel. */
export function collectStaticDiagnostics(
  root: RootTemplate,
  sourceMap: Record<string, SourceLocation> | undefined,
  options: AnalyzeOptions,
): TemplateDiagnostic[] {
  const diagnostics: TemplateDiagnostic[] = [];
  collectRootDiagnostics(root, sourceMap, options, diagnostics);
  return diagnostics;
}

function collectRootDiagnostics(
  root: RootTemplate,
  sourceMap: Record<string, SourceLocation> | undefined,
  options: AnalyzeOptions,
  diagnostics: TemplateDiagnostic[],
): void {
  collectBindingDiagnostics(root.bindings, sourceMap, options, diagnostics);
  collectBlockDiagnostics(root.blocks, sourceMap, options, diagnostics);
}
