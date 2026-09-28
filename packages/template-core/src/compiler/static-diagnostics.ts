import type {
  AnalyzeOptions,
  BindingRecord,
  BlockRecord,
  ExpressionNode,
  PartialSource,
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

/** Collects the roots of `parentHops: 0` data paths inside an expression tree. */
function collectPathRoots(expr: ExpressionNode, roots: Set<string>): void {
  switch (expr.kind) {
    case 'path':
      if (expr.parentHops === 0 && expr.segments[0] && expr.segments[0] !== 'this') {
        roots.add(expr.segments[0]);
      }
      return;
    case 'helper-call':
      // The callee resolves through helpers or the scope chain — only its
      // arguments read the current scope.
      for (const arg of expr.args) collectPathRoots(arg, roots);
      return;
    case 'unary-not':
      collectPathRoots(expr.operand, roots);
      return;
    case 'binary':
    case 'logical':
      collectPathRoots(expr.left, roots);
      collectPathRoots(expr.right, roots);
      return;
    case 'literal':
      return;
  }
}

function collectContextPathDiagnostics(
  root: RootTemplate,
  sourceMap: Record<string, SourceLocation> | undefined,
  options: AnalyzeOptions,
  diagnostics: TemplateDiagnostic[],
): void {
  const known = new Set(options.contextKeys);

  const report = (path: number[], roots: Set<string>): void => {
    for (const rootSegment of roots) {
      if (known.has(rootSegment)) continue;
      diagnostics.push({
        code: 'UNKNOWN_CONTEXT_PATH',
        severity: 'warning',
        message: `Path root "${rootSegment}" is not a declared context key — it will render as empty output.`,
        template: options.name,
        sourcePath: options.sourcePath,
        nodePath: path,
        details: { rootSegment },
        ...locationForPath(sourceMap, path),
      });
    }
  };

  const checkExpr = (expr: ExpressionNode, path: number[]): void => {
    const roots = new Set<string>();
    collectPathRoots(expr, roots);
    report(path, roots);
  };

  const checkParts = (parts: TextPart[], path: number[]): void => {
    const roots = new Set<string>();
    for (const part of parts) {
      if ('expr' in part) collectPathRoots(part.expr, roots);
    }
    report(path, roots);
  };

  const walk = (template: RootTemplate): void => {
    for (const binding of template.bindings) {
      switch (binding.kind) {
        case 'text':
        case 'attr-interp':
          checkParts(binding.parts, binding.path);
          break;
        case 'raw-html':
        case 'prop-or-attr':
        case 'class':
        case 'style':
          checkExpr(binding.expr, binding.path);
          break;
        case 'bind':
          checkExpr(binding.target, binding.path);
          if (binding.setter) checkExpr(binding.setter, binding.path);
          break;
        case 'event':
          // A bare handler name resolves via the scope chain; only call-form
          // arguments read the current scope.
          if (binding.handler.kind === 'helper-call') checkExpr(binding.handler, binding.path);
          break;
        case 'action':
          // Actions resolve like event handlers.
          if (binding.expr.kind === 'helper-call') checkExpr(binding.expr, binding.path);
          break;
      }
    }
    for (const block of template.blocks) {
      switch (block.kind) {
        case 'if':
          for (const branch of block.branches) {
            if (branch.condition) checkExpr(branch.condition, block.path);
            walk(branch.template);
          }
          break;
        case 'each':
          checkExpr(block.source, block.path);
          // The body re-scopes `self` to the item, whose shape is unknown
          // statically; the `{{else}}` branch keeps the outer scope.
          if (block.empty) walk(block.empty);
          break;
        case 'switch':
          checkExpr(block.source, block.path);
          for (const branch of block.branches) walk(branch.template);
          break;
        case 'partial':
          if (block.context) checkExpr(block.context, block.path);
          if (block.args) {
            for (const expr of Object.values(block.args)) checkExpr(expr, block.path);
          }
          if (block.slots) {
            for (const slot of Object.values(block.slots)) walk(slot);
          }
          break;
      }
    }
  };

  walk(root);
}

function collectBlockDiagnostics(
  blocks: BlockRecord[],
  sourceMap: Record<string, SourceLocation> | undefined,
  options: AnalyzeOptions,
  diagnostics: TemplateDiagnostic[],
): void {
  for (const block of blocks) {
    if (block.kind === 'partial' && block.name !== 'yield') {
      const listed = options.partials !== undefined && block.name in options.partials;
      if (options.partials !== undefined && !listed) {
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
      } else {
        collectPartialPropDiagnostics(block, options.partials?.[block.name], sourceMap, options, diagnostics);
      }
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

    if (block.kind === 'partial' && block.slots) {
      for (const slot of Object.values(block.slots)) {
        collectRootDiagnostics(slot, sourceMap, options, diagnostics);
      }
    }
  }
}

function declaredPropsFor(
  name: string,
  source: PartialSource | undefined,
  options: AnalyzeOptions,
): readonly string[] | undefined {
  if (source && typeof source !== 'string' && source.props !== undefined) {
    return source.props;
  }
  return options.partialProps?.[name];
}

function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid: number[][] = Array.from({ length: rows }, (_, i) => {
    const row = Array.from({ length: cols }, (__, j) => (i === 0 ? j : 0));
    row[0] = i;
    return row;
  });
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i]![j] = Math.min(grid[i - 1]![j]! + 1, grid[i]![j - 1]! + 1, grid[i - 1]![j - 1]! + cost);
    }
  }
  return grid[a.length]![b.length]!;
}

function suggestProp(unknown: string, expected: readonly string[]): string | undefined {
  const lower = unknown.toLowerCase();
  const caseMatch = expected.find((key) => key.toLowerCase() === lower);
  if (caseMatch) return caseMatch;
  let best: string | undefined;
  let bestDistance = Infinity;
  for (const key of expected) {
    const distance = editDistance(unknown, key);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = key;
    }
  }
  return best && bestDistance <= 2 ? best : undefined;
}

function collectPartialPropDiagnostics(
  block: Extract<BlockRecord, { kind: 'partial' }>,
  source: PartialSource | undefined,
  sourceMap: Record<string, SourceLocation> | undefined,
  options: AnalyzeOptions,
  diagnostics: TemplateDiagnostic[],
): void {
  const declared = declaredPropsFor(block.name, source, options);
  if (!declared) return;

  const argKeys = Object.keys(block.args ?? {});
  const severity = options.strictPartials ? 'error' : 'warning';
  const location = locationForPath(sourceMap, block.path);

  for (const arg of argKeys) {
    if (declared.includes(arg)) continue;
    const suggestion = suggestProp(arg, declared);
    diagnostics.push({
      code: 'UNKNOWN_PARTIAL_PROP',
      severity,
      message: suggestion
        ? `Unknown prop "${arg}" on partial "${block.name}". Did you mean "${suggestion}"?`
        : `Unknown prop "${arg}" on partial "${block.name}". Expected: ${declared.join(', ') || '(none)'}.`,
      template: options.name,
      sourcePath: options.sourcePath,
      nodePath: block.path,
      details: { partial: block.name, prop: arg, expected: [...declared], suggestion },
      ...location,
    });
  }

  // Legacy `{{> name ctx}}` is an opaque object — do not require listed props.
  if (block.context && block.args == null) return;

  for (const prop of declared) {
    if (argKeys.includes(prop)) continue;
    diagnostics.push({
      code: 'MISSING_PARTIAL_PROP',
      severity,
      message: `Missing prop "${prop}" on partial "${block.name}".`,
      template: options.name,
      sourcePath: options.sourcePath,
      nodePath: block.path,
      details: { partial: block.name, prop, expected: [...declared] },
      ...location,
    });
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
  if (options.contextKeys) {
    collectContextPathDiagnostics(root, sourceMap, options, diagnostics);
  }
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
