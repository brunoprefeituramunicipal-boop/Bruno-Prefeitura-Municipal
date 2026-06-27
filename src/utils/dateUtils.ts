/**
 * Utilities for robust, timezone-independent date processing and formatting.
 * Strictly aligned with America/Belem (UTC-3).
 */

/**
 * Formats a YYYY-MM-DD date string safely into DD/MM/YYYY format without parsing it as a Date object.
 * This completely avoids browser timezone shifting.
 */
export function formatarDataParaExibicao(dataStr: string): string {
  if (!dataStr) return "";
  const parts = dataStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dataStr;
}

/**
 * Gets the current local date in America/Belem timezone in YYYY-MM-DD format.
 */
export function obterDataAtualBelem(): string {
  try {
    const dtf = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Belem",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return dtf.format(new Date());
  } catch (e) {
    // Fallback if Intl.DateTimeFormat timezone is unsupported
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Gets tomorrow's date in America/Belem timezone in YYYY-MM-DD format.
 */
export function obterAmanhaBelem(): string {
  try {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dtf = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Belem",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return dtf.format(tomorrow);
  } catch (e) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
