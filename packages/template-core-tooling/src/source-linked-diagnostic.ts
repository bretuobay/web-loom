import type { TemplateDiagnostic } from '@web-loom/template-core';
import type { CompileCallMatch } from './find-compile-calls.js';
import { lineColumnToOffset, offsetToLineColumn } from './source-position.js';

/**
 * A template-core diagnostic anchored to a position in the host `.ts`/`.tsx` source file
 * (inside or near a `compile(\`...\`)` template literal), suitable for editors and CI.
 */
export interface SourceLinkedDiagnostic {
  code: string;
  severity: 'warning' | 'error';
  message: string;
  filePath: string;
  /** 1-based line in the host source file. */
  line: number;
  /** 1-based column in the host source file. */
  column: number;
  /** Optional end line for range highlighting (1-based, inclusive). */
  endLine?: number;
  /** Optional end column for range highlighting (1-based, exclusive). */
  endColumn?: number;
  templateName?: string;
  /** 1-based line inside the template literal, when known. */
  templateLine?: number;
  /** 1-based column inside the template literal, when known. */
  templateColumn?: number;
}

export interface LinkTemplateDiagnosticOptions {
  filePath: string;
  hostSource: string;
  match: CompileCallMatch;
  diagnostic: Pick<TemplateDiagnostic, 'code' | 'severity' | 'message' | 'line' | 'column'>;
}

/** Maps a template-relative diagnostic to a host-file line/column. */
export function linkTemplateDiagnosticToFile(options: LinkTemplateDiagnosticOptions): SourceLinkedDiagnostic {
  const { filePath, hostSource, match, diagnostic } = options;
  const templateLine = diagnostic.line;
  const templateColumn = diagnostic.column;

  if (templateLine !== undefined && templateColumn !== undefined) {
    const templateOffset = lineColumnToOffset(match.templateSource, templateLine, templateColumn);
    const fileOffset = match.templateContentStart + templateOffset;
    const { line, column } = offsetToLineColumn(hostSource, fileOffset);

    return {
      code: diagnostic.code,
      severity: diagnostic.severity,
      message: diagnostic.message,
      filePath,
      line,
      column,
      templateName: match.name,
      templateLine,
      templateColumn,
    };
  }

  const { line, column } = offsetToLineColumn(hostSource, match.start);
  return {
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    filePath,
    line,
    column,
    templateName: match.name,
  };
}

/** Stable terminal line for Vite dev analyze and VS Code problem matchers. */
export function formatSourceLinkedDiagnostic(diagnostic: SourceLinkedDiagnostic): string {
  const location = `${diagnostic.filePath}:${diagnostic.line}:${diagnostic.column}`;
  const label = diagnostic.templateName ? ` (${diagnostic.templateName})` : '';
  return `[template-core] ${location}${label}: ${diagnostic.message} [${diagnostic.code}]`;
}
