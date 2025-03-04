export function jsonToCSV(data: any[], headers?: string[]) {
  if (data.length === 0) return '';
  // generate headers from first row of data if not provided
  if (!headers) {
    headers = Object.keys(data[0]);
  }
  const csv = [
    headers.join(','), // header row first
    ...data.map((row) => headers.map((fieldName) => valueCSV(row[fieldName])).join(',')),
  ].join('\r\n');
  return csv;
}

function valueCSV(v: any) {
  if (typeof v === 'string') {
    v = v.replace(/"/g, '');
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    return `"[${escapeCSVArray(v)}]"`;
  }
  return JSON.stringify(v);
}

function escapeCSVArray(arr: any[]) {
  return arr
    .map((el) => {
      if (typeof el === 'string') {
        return `""${el}""`;
      }
      // handle nested array of arrays
      if (Array.isArray(el)) {
        return `[${escapeCSVArray(el)}]`;
      }
      return `${el}`;
    })
    .join(',');
}
