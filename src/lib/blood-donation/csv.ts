/**
 * CSV handling for the bulk donation import.
 *
 * Plain module, no server actions: the template route and the preview UI both
 * need these without going through the action protocol.
 */

export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_ROWS = 2000;

export const COLUMNS = [
  "full_name",
  "father_name",
  "mobile_number",
  "phone_country_code",
  "email",
  "blood_group",
  "date_of_birth",
  "gender",
  "city",
  "area",
  "address",
  "last_donation_date",
  "units",
  "donation_date",
  "external_ref",
] as const;

export type ImportColumn = (typeof COLUMNS)[number];

export type ImportRow = Record<ImportColumn, string> & {
  /** 1-based line number in the uploaded file, for error messages. */
  line: number;
};

const KNOWN_GROUPS = new Set(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]);
const KNOWN_GENDERS = new Set(["male", "female", "other", "prefer_not_to_say", ""]);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

/** Minimal RFC 4180 reader: quoted fields, embedded commas and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // Ignore; newlines are handled on \n.
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop trailing blank lines.
  while (rows.length > 0 && rows[rows.length - 1].every((cell) => cell.trim() === "")) {
    rows.pop();
  }

  return rows;
}

/** The downloadable template, with one example row and a comment line. */
export function donationImportTemplate(): string {
  const header = COLUMNS.join(",");
  const example = [
    "Srinivasa Reddy",
    "Laxma Reddy",
    "9876543210",
    "91",
    "donor@example.com",
    "O+",
    "1990-04-12",
    "male",
    "Karimnagar",
    "Sriramapuram",
    "1-2-3 Main Road",
    "2024-01-15",
    "1",
    "2026-01-26",
    "CAMP26-001",
  ].join(",");

  return [
    "# TSSS blood donation import. Delete this line and the example before uploading.",
    "# Dates are YYYY-MM-DD. blood_group must be one of O+ O- A+ A- B+ B- AB+ AB-.",
    "# external_ref must be unique per camp; leave it blank to auto-generate.",
    header,
    example,
    "",
  ].join("\n");
}

export function normaliseMobile(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function validateImportRow(row: ImportRow, campId: string | null): string[] {
  const errors: string[] = [];

  if (row.full_name.trim().length < 2) errors.push("Full name is required.");
  if (row.full_name.trim().length > 120) errors.push("Full name is too long.");

  const mobile = normaliseMobile(row.mobile_number);
  if (mobile.length !== 10) {
    errors.push("Mobile number must be 10 digits.");
  } else if (!/^[6-9]/.test(mobile)) {
    errors.push("Mobile number must start with 6, 7, 8 or 9.");
  }

  if (!KNOWN_GROUPS.has(row.blood_group.trim().toUpperCase())) {
    errors.push("Blood group must be one of O+ O- A+ A- B+ B- AB+ AB-.");
  }

  if (row.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
    errors.push("Email address is invalid.");
  }

  if (row.gender.trim() && !KNOWN_GENDERS.has(row.gender.trim().toLowerCase())) {
    errors.push("Gender must be male, female, other or blank.");
  }

  if (row.date_of_birth.trim() && !isValidDate(row.date_of_birth.trim())) {
    errors.push("Date of birth must be YYYY-MM-DD.");
  }

  if (row.last_donation_date.trim() && !isValidDate(row.last_donation_date.trim())) {
    errors.push("Last donation date must be YYYY-MM-DD.");
  }

  if (row.donation_date.trim() && !isValidDate(row.donation_date.trim())) {
    errors.push("Donation date must be YYYY-MM-DD.");
  }

  const units = row.units.trim() === "" ? "1" : row.units.trim();
  if (!/^\d+$/.test(units) || Number(units) < 1 || Number(units) > 10) {
    errors.push("Units must be a whole number from 1 to 10.");
  }

  if (!campId && !row.donation_date.trim()) {
    errors.push("Donation date is required when no camp is selected.");
  }

  return errors;
}

export function parseImportRows(text: string): { rows: ImportRow[] } | { error: string } {
  // Strip comment lines before parsing.
  const lines = text
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");

  const parsed = parseCsv(lines);

  if (parsed.length === 0) {
    return { error: "The file is empty. Download the template to see the expected columns." };
  }

  const header = parsed[0].map((cell) => cell.trim());
  const missing = COLUMNS.filter((column) => !header.includes(column));

  if (missing.length > 0) {
    return {
      error: `The header is missing: ${missing.join(", ")}. Download the template and keep its first row.`,
    };
  }

  if (parsed.length - 1 > MAX_ROWS) {
    return { error: `Too many rows. Split the file into batches of ${MAX_ROWS}.` };
  }

  const rows: ImportRow[] = parsed.slice(1).map((cells, index) => {
    const row = { line: index + 2 } as ImportRow;
    for (const column of COLUMNS) {
      row[column] = (cells[header.indexOf(column)] ?? "").trim();
    }
    return row;
  });

  return { rows };
}