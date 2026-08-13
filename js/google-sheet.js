const SHEET_TAB_NAMES = {
  products: "Products",
  settings: "Settings",
  content: "Content"
};

/**
 * Builds a Google Visualization CSV endpoint from a public Google Sheet URL.
 * No API key or backend is required.
 */
export function buildSheetCsvUrl(spreadsheetUrl, sheetName) {
  if (!spreadsheetUrl || spreadsheetUrl.includes("PASTE_YOUR")) {
    throw new Error("Google Sheet URL is not configured.");
  }

  const url = new URL(spreadsheetUrl);
  const match = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error("Invalid Google Sheet URL.");
  }

  const spreadsheetId = match[1];
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

export async function fetchSheet(spreadsheetUrl, sheetName, signal) {
  const endpoint = buildSheetCsvUrl(spreadsheetUrl, sheetName);
  const response = await fetch(endpoint, {
    method: "GET",
    cache: "no-store",
    signal
  });

  if (!response.ok) {
    throw new Error(`Google Sheet request failed (${response.status}).`);
  }

  const csv = await response.text();
  if (!csv.trim()) return [];

  return parseCSV(csv);
}

export async function fetchAllSheets(spreadsheetUrl, signal) {
  const [products, settingsRows, contentRows] = await Promise.all([
    fetchSheet(spreadsheetUrl, SHEET_TAB_NAMES.products, signal),
    fetchSheet(spreadsheetUrl, SHEET_TAB_NAMES.settings, signal),
    fetchSheet(spreadsheetUrl, SHEET_TAB_NAMES.content, signal)
  ]);

  return {
    products,
    settings: rowsToKeyValue(settingsRows),
    content: rowsToKeyValue(contentRows)
  };
}

function rowsToKeyValue(rows) {
  const result = {};
  for (const row of rows) {
    const key = cleanText(row.Setting ?? row.Key ?? row.Name);
    const value = cleanText(row.Value ?? row.Content);
    if (key) result[key] = value;
  }
  return result;
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      if (row.some(cell => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    if (row.some(cell => cell.trim() !== "")) rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map(values => {
    const item = {};
    headers.forEach((header, index) => {
      if (header) item[header] = cleanText(values[index] ?? "");
    });
    return item;
  });
}

function normalizeHeader(value) {
  return String(value).replace(/^\uFEFF/, "").trim();
}

function cleanText(value) {
  return String(value ?? "").trim();
}
