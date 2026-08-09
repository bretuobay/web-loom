import ts from 'typescript';

export interface CompileCallMatch {
  /** Start offset of the whole `compile(...)` call expression in the source text. */
  start: number;
  /** End offset of the whole `compile(...)` call expression in the source text. */
  end: number;
  /** Offset of the first character inside the template/string literal (after opening quote). */
  templateContentStart: number;
  /** Offset after the last character inside the template/string literal (before closing quote). */
  templateContentEnd: number;
  /** Decoded template/string literal source text (the first argument). */
  templateSource: string;
  /** Verbatim source text of the second argument, if present — never parsed. */
  optionsText?: string;
  /** Module specifier the matched `compile` binding was imported from. */
  specifier: string;
  /** Best-effort name from an `export const x = compile(...)` shape, for plan diagnostics. */
  name?: string;
}

export interface FindCompileCallsResult {
  matches: CompileCallMatch[];
  /** Specifiers with >=1 static match that don't already import `fromPrecompiled`. */
  specifiersNeedingImport: Map<string, { afterPos: number }>;
}

const EMPTY_RESULT: FindCompileCallsResult = { matches: [], specifiersNeedingImport: new Map() };

interface CompileBinding {
  localName: string;
  specifier: string;
}

function walk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node);
  ts.forEachChild(node, (child) => walk(child, visit));
}

function inferName(call: ts.CallExpression): string | undefined {
  const parent = call.parent;
  if (parent && ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
    return parent.name.text;
  }
  return undefined;
}

/**
 * AST scan for static `compile(...)` call sites imported from target specifiers.
 * Shared by the Vite plugin and ESLint rules — no type-checker, no Vite dependency.
 */
export function findCompileCalls(code: string, id: string, specifiers: string[]): FindCompileCallsResult {
  const scriptKind = id.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true, scriptKind);

  const bindingsByLocalName = new Map<string, CompileBinding>();
  const importDeclEndBySpecifier = new Map<string, number>();
  const hasFromPrecompiledBySpecifier = new Set<string>();
  let primarySpecifier: string | undefined;

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    if (!specifiers.includes(specifier)) continue;

    primarySpecifier ??= specifier;

    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) continue;

    for (const element of namedBindings.elements) {
      const importedName = (element.propertyName ?? element.name).text;
      if (importedName === 'compile') {
        bindingsByLocalName.set(element.name.text, { localName: element.name.text, specifier });
        importDeclEndBySpecifier.set(specifier, statement.getEnd());
      } else if (importedName === 'fromPrecompiled') {
        hasFromPrecompiledBySpecifier.add(specifier);
      }
    }
  }

  if (bindingsByLocalName.size === 0 && !primarySpecifier) return EMPTY_RESULT;

  const matches: CompileCallMatch[] = [];

  walk(sourceFile, (node) => {
    if (!ts.isCallExpression(node)) return;

    const arg0 = node.arguments[0];
    if (!arg0 || !(ts.isStringLiteral(arg0) || ts.isNoSubstitutionTemplateLiteral(arg0))) return;

    let specifier: string | undefined;

    if (ts.isIdentifier(node.expression)) {
      specifier = bindingsByLocalName.get(node.expression.text)?.specifier;
    } else if (
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'compile' &&
      primarySpecifier
    ) {
      specifier = primarySpecifier;
    }

    if (!specifier) return;

    const arg1 = node.arguments[1];
    const literalStart = arg0.getStart(sourceFile);
    const literalEnd = arg0.getEnd();
    matches.push({
      start: node.getStart(sourceFile),
      end: node.getEnd(),
      templateContentStart: literalStart + 1,
      templateContentEnd: literalEnd - 1,
      templateSource: arg0.text,
      optionsText: arg1 ? code.slice(arg1.getStart(sourceFile), arg1.getEnd()) : undefined,
      specifier,
      name: inferName(node),
    });
  });

  if (matches.length === 0) return EMPTY_RESULT;

  const specifiersNeedingImport = new Map<string, { afterPos: number }>();
  for (const match of matches) {
    if (hasFromPrecompiledBySpecifier.has(match.specifier) || specifiersNeedingImport.has(match.specifier)) continue;
    const afterPos = importDeclEndBySpecifier.get(match.specifier);
    if (afterPos !== undefined) specifiersNeedingImport.set(match.specifier, { afterPos });
  }

  return { matches, specifiersNeedingImport };
}
