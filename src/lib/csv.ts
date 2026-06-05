// Tiny dependency-free CSV helpers. The generated files open directly in Excel
// (UTF-8 BOM so Indonesian characters render correctly); the parser round-trips
// what we emit and tolerates Excel's quoting of commas / quotes / newlines.

/** Serialise rows to a CSV string with a header line and a UTF-8 BOM. */
export function toCSV(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))];
  return "﻿" + lines.join("\r\n");
}

/** Parse a CSV string into a matrix of cell strings (handles quotes/newlines). */
export function parseCSV(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  // Flush the trailing cell/row unless the file ended on a clean newline.
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Map a parsed CSV matrix (first row = headers) to objects keyed by header. */
export function csvToRecords(matrix: string[][]): Record<string, string>[] {
  if (matrix.length === 0) return [];
  const headers = matrix[0].map((h) => h.trim());
  return matrix.slice(1).map((cells) => {
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => (rec[h] = cells[i] ?? ""));
    return rec;
  });
}

/** Trigger a browser download of text content. */
export function download(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
