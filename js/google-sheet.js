/**
 * =====================================================
 * GOOGLE SHEETS DATA LOADER
 * =====================================================
 *
 * Three independent Google Sheets:
 *
 * 1. Products
 * 2. Settings
 * 3. Content
 *
 * No API key required.
 * No backend required.
 * Works with GitHub Pages.
 */

// =====================================================
// BUILD CSV URL
// =====================================================

export function buildSheetCsvUrl(spreadsheetUrl) {
  if (!spreadsheetUrl || spreadsheetUrl.includes("PASTE_")) {
    throw new Error("Google Sheet URL is not configured.");
  }

  const url = new URL(spreadsheetUrl);

  const match = url.pathname.match(
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  );

  if (!match) {
    throw new Error("Invalid Google Sheet URL.");
  }

  const spreadsheetId = match[1];

  /*
   * Cache-busting parameter ensures that updated
   * Google Sheet values are fetched fresh.
   */
  return (
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}` +
    `/gviz/tq?tqx=out:csv&_=${Date.now()}`
  );
}


// =====================================================
// FETCH ONE GOOGLE SHEET
// =====================================================

export async function fetchSheet(spreadsheetUrl, signal) {
  const endpoint = buildSheetCsvUrl(spreadsheetUrl);

  const response = await fetch(endpoint, {
    method: "GET",
    cache: "no-store",
    signal
  });

  if (!response.ok) {
    throw new Error(
      `Google Sheet request failed (${response.status}).`
    );
  }

  const csv = await response.text();

  if (!csv.trim()) {
    return [];
  }

  return parseCSV(csv);
}


// =====================================================
// FETCH ALL THREE SHEETS
// =====================================================

export async function fetchAllSheets(
  productsUrl,
  settingsUrl,
  contentUrl,
  signal
) {
  const [
    products,
    settingsRows,
    contentRows
  ] = await Promise.all([
    fetchSheet(productsUrl, signal),
    fetchSheet(settingsUrl, signal),
    fetchSheet(contentUrl, signal)
  ]);

  return {
    products,
    settings: rowsToKeyValue(settingsRows),
    content: rowsToKeyValue(contentRows)
  };
}


// =====================================================
// CONVERT SETTING/VALUE ROWS TO OBJECT
// =====================================================

function rowsToKeyValue(rows) {
  const result = {};

  for (const row of rows) {
    const key = cleanText(
      row.Setting ??
      row.Key ??
      row.Name
    );

    const value = cleanText(
      row.Value ??
      row.Content
    );

    if (key) {
      result[key] = value;
    }
  }

  return result;
}


// =====================================================
// CSV PARSER
// =====================================================

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

    } else if (
      (char === "\n" || char === "\r") &&
      !inQuotes
    ) {

      if (char === "\r" && next === "\n") {
        i++;
      }

      row.push(field);

      if (
        row.some(
          cell => cell.trim() !== ""
        )
      ) {
        rows.push(row);
      }

      row = [];
      field = "";

    } else {

      field += char;

    }
  }

  // Handle final row
  if (field.length || row.length) {

    row.push(field);

    if (
      row.some(
        cell => cell.trim() !== ""
      )
    ) {
      rows.push(row);
    }
  }

  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map(normalizeHeader);

  return rows
    .slice(1)
    .map(values => {

      const item = {};

      headers.forEach(
        (header, index) => {

          if (header) {
            item[header] =
              cleanText(
                values[index] ?? ""
              );
          }

        }
      );

      return item;
    });
}


// =====================================================
// HELPERS
// =====================================================

function normalizeHeader(value) {
  return String(value)
    .replace(/^\uFEFF/, "")
    .trim();
}

function cleanText(value) {
  return String(value ?? "").trim();
}
