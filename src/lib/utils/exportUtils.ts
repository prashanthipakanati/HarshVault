import { HashRecord } from '../storage/recordRepository';

/**
 * Sanitizes a string against CSV / spreadsheet formula injection
 * Values beginning with =, +, -, @, \t, \r can trigger execution in Excel or Google Sheets.
 */
export function sanitizeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  // If the string starts with dangerous formula execution characters, prepend a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape inner double quotes
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportRecordsToCSV(records: HashRecord[], filename = 'cryptographic_hash_records.csv'): void {
  const headers = [
    'Record ID',
    'Label',
    'Algorithm',
    'Hex Digest',
    'Input Type',
    'Input Size (Bytes)',
    'Operation Type',
    'Verification Status',
    'File Name',
    'Created At (UTC)',
    'Storage Scope',
  ];

  const rows = records.map((r) => [
    sanitizeCsvField(r.id),
    sanitizeCsvField(r.label || ''),
    sanitizeCsvField(r.algorithm),
    sanitizeCsvField(r.digest),
    sanitizeCsvField(r.input_type),
    sanitizeCsvField(r.input_size_bytes ?? ''),
    sanitizeCsvField(r.operation_type),
    sanitizeCsvField(r.verification_status || 'none'),
    sanitizeCsvField(r.file_name || ''),
    sanitizeCsvField(r.created_at),
    sanitizeCsvField('Local Vault'),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function exportRecordsToJSON(records: HashRecord[], filename = 'cryptographic_hash_records.json'): void {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    application: 'Cryptographic Hash Explorer',
    version: '1.0.0',
    totalRecords: records.length,
    records,
  };
  const jsonContent = JSON.stringify(exportPayload, null, 2);
  downloadBlob(new Blob([jsonContent], { type: 'application/json' }), filename);
}

export function exportRecordsToText(records: HashRecord[], filename = 'checksums.txt'): void {
  // Format standard sha256sum / md5sum checksum manifest: "<digest>  <identifier>"
  const lines = [
    `# Cryptographic Hash Explorer - Integrity Checksum Manifest`,
    `# Generated at: ${new Date().toISOString()}`,
    `# Total records: ${records.length}`,
    '',
    ...records.map((r) => `${r.digest}  ${r.file_name || r.label || `input-${r.id.slice(0, 8)}`} (${r.algorithm})`),
  ];
  downloadBlob(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }), filename);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
