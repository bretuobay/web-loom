export interface StackFrame {
  functionName?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  source?: string;
}

export interface ParsedStackTrace {
  message: string;
  name: string;
  frames: StackFrame[];
}

export function parseStackTrace(error: Error): ParsedStackTrace {
  const stack = error.stack || '';
  const lines = stack.split('\n');

  const frames: StackFrame[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;

    const frame = parseStackLine(line);
    if (frame) {
      frames.push(frame);
    }
  }

  return {
    message: error.message,
    name: error.name,
    frames,
  };
}

function parseStackLine(line: string): StackFrame | null {
  // Clean up the line
  const cleanLine = line.trim();

  // V8 format: "    at functionName (file:line:column)"
  const v8Match = cleanLine.match(/^\s*at\s+(.+?)(?:\s+\((.+?):(\d+):(\d+)\))?$/);
  if (v8Match) {
    const [, functionName, fileName, lineNumber, columnNumber] = v8Match;
    return {
      functionName: functionName || '<anonymous>',
      fileName,
      lineNumber: lineNumber ? parseInt(lineNumber, 10) : undefined,
      columnNumber: columnNumber ? parseInt(columnNumber, 10) : undefined,
      source: cleanLine,
    };
  }

  // SpiderMonkey format: "functionName@file:line:column"
  const spiderMonkeyMatch = cleanLine.match(/^(.+?)@(.+?):(\d+):(\d+)$/);
  if (spiderMonkeyMatch) {
    const [, functionName, fileName, lineNumber, columnNumber] = spiderMonkeyMatch;
    return {
      functionName,
      fileName,
      lineNumber: parseInt(lineNumber, 10),
      columnNumber: parseInt(columnNumber, 10),
      source: cleanLine,
    };
  }

  // Fallback: just use the line as source
  return {
    source: cleanLine,
  };
}

export function normalizeStackTrace(error: Error): string {
  const parsed = parseStackTrace(error);

  const normalizedLines = [
    `${parsed.name}: ${parsed.message}`,
    ...parsed.frames.map((frame) => {
      if (frame.fileName && frame.lineNumber) {
        const func = frame.functionName || '<anonymous>';
        return `    at ${func} (${frame.fileName}:${frame.lineNumber}:${frame.columnNumber || 0})`;
      }
      return `    at ${frame.source || '<unknown>'}`;
    }),
  ];

  return normalizedLines.join('\n');
}

export function extractRelevantFrames(
  frames: StackFrame[],
  options: {
    maxFrames?: number;
    skipNodeModules?: boolean;
    skipInternalFrames?: boolean;
  } = {},
): StackFrame[] {
  const { maxFrames = 10, skipNodeModules = true, skipInternalFrames = true } = options;

  let relevantFrames = frames.filter((frame) => {
    if (!frame.fileName) return true;

    if (skipNodeModules && frame.fileName.includes('node_modules')) {
      return false;
    }

    if (skipInternalFrames && isInternalFrame(frame)) {
      return false;
    }

    return true;
  });

  // Limit the number of frames
  if (relevantFrames.length > maxFrames) {
    relevantFrames = relevantFrames.slice(0, maxFrames);
  }

  return relevantFrames;
}

function isInternalFrame(frame: StackFrame): boolean {
  if (!frame.fileName) return false;

  // Node.js internal modules
  if (frame.fileName.startsWith('internal/') || frame.fileName.startsWith('node:')) {
    return true;
  }

  // Browser internal functions
  if (frame.functionName) {
    const internalPatterns = ['Object.defineProperty', 'Function.apply', 'Function.call', 'Object.create'];

    if (internalPatterns.some((pattern) => frame.functionName!.includes(pattern))) {
      return true;
    }
  }

  return false;
}

export function enhanceStackTrace(
  error: Error,
  additionalContext?: {
    operation?: string;
    component?: string;
    metadata?: Record<string, unknown>;
  },
): string {
  const parsed = parseStackTrace(error);
  const relevantFrames = extractRelevantFrames(parsed.frames);

  const lines = [`${parsed.name}: ${parsed.message}`];

  if (additionalContext) {
    if (additionalContext.operation) {
      lines.push(`    Operation: ${additionalContext.operation}`);
    }
    if (additionalContext.component) {
      lines.push(`    Component: ${additionalContext.component}`);
    }
    if (additionalContext.metadata) {
      lines.push(`    Metadata: ${JSON.stringify(additionalContext.metadata)}`);
    }
    lines.push(''); // Empty line separator
  }

  relevantFrames.forEach((frame) => {
    if (frame.fileName && frame.lineNumber) {
      const func = frame.functionName || '<anonymous>';
      lines.push(`    at ${func} (${frame.fileName}:${frame.lineNumber}:${frame.columnNumber || 0})`);
    } else if (frame.source) {
      lines.push(`    at ${frame.source}`);
    }
  });

  return lines.join('\n');
}

export function captureStackTrace(skip = 0): StackFrame[] {
  const error = new Error();
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, captureStackTrace);
  }

  const parsed = parseStackTrace(error);
  return parsed.frames.slice(skip + 1); // Skip the captureStackTrace function itself
}

export function getCallerInfo(skip = 0): StackFrame | null {
  const frames = captureStackTrace(skip + 1); // Skip getCallerInfo itself
  return frames[0] || null;
}
