export interface TableColumn {
  header: string;
  width: number;
  align: 'left' | 'right' | 'center';
}

export interface TableRow {
  [key: string]: string | number;
}

export interface TableDefinition {
  [key: string]: TableColumn;
}

export function renderTable(columns: TableDefinition, rows: TableRow[]): string {
  if (rows.length === 0) {
    return 'No data to display';
  }

  const columnKeys = Object.keys(columns);
  const output: string[] = [];

  // Calculate actual column widths based on content
  const actualWidths = columnKeys.map((key) => {
    const column = columns[key];
    if (!column) return 0;

    const headerLength = column.header.length;
    const maxContentLength = Math.max(...rows.map((row) => String(row[key] || '').length), 0);
    return Math.max(column.width, headerLength, maxContentLength);
  });

  // Create header
  const headerRow = columnKeys
    .map((key, index) => {
      const column = columns[key];
      if (!column) return '';

      const width = actualWidths[index] || 0;
      return padString(column.header, width, column.align);
    })
    .join(' | ');

  output.push(headerRow);

  // Create separator
  const separator = actualWidths.map((width) => '-'.repeat(width)).join('-+-');
  output.push(separator);

  // Create data rows
  for (const row of rows) {
    const dataRow = columnKeys
      .map((key, index) => {
        const column = columns[key];
        if (!column) return '';

        const width = actualWidths[index] || 0;
        const value = String(row[key] || '');
        return padString(value, width, column.align);
      })
      .join(' | ');

    output.push(dataRow);
  }

  return output.join('\n');
}

function padString(str: string, width: number, align: 'left' | 'right' | 'center'): string {
  if (str.length >= width) {
    return str;
  }

  const padding = width - str.length;

  switch (align) {
    case 'right':
      return ' '.repeat(padding) + str;
    case 'center':
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
    default: // 'left'
      return str + ' '.repeat(padding);
  }
}

export function outputJson(data: any, pretty: boolean = true): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

export function outputResult(data: any, asJson: boolean = false, pretty: boolean = true): void {
  if (asJson) {
    console.log(outputJson(data, pretty));
  } else if (data.table && data.columns && data.rows) {
    // Table format
    console.log(renderTable(data.columns, data.rows));
  } else if (typeof data === 'string') {
    console.log(data);
  } else {
    // Fallback to JSON for complex objects
    console.log(outputJson(data, pretty));
  }
}

// Helper function for creating standard table formats
export function createSimpleTable(
  headers: string[],
  rows: string[][],
): {
  columns: TableDefinition;
  rows: TableRow[];
} {
  const columns: TableDefinition = {};
  const tableRows: TableRow[] = [];

  // Create columns
  headers.forEach((header, index) => {
    columns[`col${index}`] = {
      header,
      width: header.length,
      align: 'left',
    };
  });

  // Create rows
  rows.forEach((row) => {
    const tableRow: TableRow = {};
    row.forEach((cell, index) => {
      tableRow[`col${index}`] = cell;
    });
    tableRows.push(tableRow);
  });

  return { columns, rows: tableRows };
}

// Helper for creating aligned numeric tables
export function createNumericTable(
  headers: string[],
  rows: (string | number)[][],
): {
  columns: TableDefinition;
  rows: TableRow[];
} {
  const columns: TableDefinition = {};
  const tableRows: TableRow[] = [];

  // Create columns - last column is typically numeric and right-aligned
  headers.forEach((header, index) => {
    columns[`col${index}`] = {
      header,
      width: header.length,
      align: index === headers.length - 1 ? 'right' : 'left',
    };
  });

  // Create rows
  rows.forEach((row) => {
    const tableRow: TableRow = {};
    row.forEach((cell, index) => {
      tableRow[`col${index}`] = cell;
    });
    tableRows.push(tableRow);
  });

  return { columns, rows: tableRows };
}
