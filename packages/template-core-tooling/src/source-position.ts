/** Converts a 1-based line/column in `source` to a UTF-16 code-unit offset. */
export function lineColumnToOffset(source: string, line: number, column: number): number {
  if (line < 1 || column < 1) return 0;

  let offset = 0;
  let currentLine = 1;

  while (currentLine < line && offset < source.length) {
    if (source[offset] === '\n') currentLine++;
    offset++;
  }

  return Math.min(source.length, offset + column - 1);
}

/** Converts a UTF-16 code-unit offset in `source` to 1-based line/column. */
export function offsetToLineColumn(source: string, offset: number): { line: number; column: number } {
  const clamped = Math.max(0, Math.min(offset, source.length));
  let line = 1;
  let column = 1;

  for (let index = 0; index < clamped; index++) {
    if (source[index] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column };
}
