/** Parser CSV mínimo (comillas y comas). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      if (ch === "\r") i += 1;
      continue;
    }

    if (ch === "\r") continue;
    cell += ch;
  }

  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);

  return rows;
}

export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function rowsToCsv(rows: string[][]): string {
  return rows.map((row) => row.map((c) => escapeCsvField(c)).join(",")).join("\n");
}

export function parseCsvRecords(text: string): Record<string, string>[] {
  const grid = parseCsv(text.replace(/^\uFEFF/, ""));
  if (grid.length < 2) return [];

  const headers = grid[0].map((h) => h.trim().toLowerCase());
  return grid.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (header) record[header] = (cells[idx] ?? "").trim();
    });
    return record;
  });
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
