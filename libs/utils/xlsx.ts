import * as XLSX from 'xlsx';

/**
 * Parses all sheets from an Excel file Blob/File and returns an object
 * mapping sheet names to arrays of typed objects.
 */
export async function xlsxToJson<T extends object>(blob: Blob): Promise<Record<string, T[]>> {
  const arrayBuffer = await readBlobAsArrayBuffer(blob);
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });

  const allSheets: Record<string, T[]> = {};
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // will try to type each row as T
    allSheets[sheetName] = XLSX.utils.sheet_to_json<T>(worksheet, {
      header: undefined, // This will use the first row as keys for each object
      defval: null, // fill missing cells with null
    });
  }
  return allSheets;
}

/** Convert JSON data to xlsx and optionally download (if filename provided) */
export async function jsonToXLSX(data: Record<string, any>[], sheetName: string, downloadFilename?: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  if (downloadFilename) {
    XLSX.writeFile(workbook, downloadFilename);
  }
  return workbook;
}

/**
 * Reads a Blob/File as an ArrayBuffer asynchronously.
 */
function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}
