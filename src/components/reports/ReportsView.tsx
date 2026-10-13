import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  FileCode,
  FileText,
  Printer,
  Download,
  ShieldCheck,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { exportRecordsToCSV, exportRecordsToJSON, exportRecordsToText } from '../../lib/utils/exportUtils';

export const ReportsView: React.FC = () => {
  const { records, stats, addToast } = useApp();

  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'text' | 'printable'>('csv');
  const [includeLegacyOnly, setIncludeLegacyOnly] = useState<boolean>(false);

  const reportRecords = includeLegacyOnly
    ? records.filter((r) => r.algorithm === 'SHA-1' || r.algorithm === 'MD5')
    : records;

  const handleExport = () => {
    if (reportRecords.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Records to Export',
        message: 'Your registry is currently empty.',
      });
      return;
    }

    if (selectedFormat === 'csv') {
      exportRecordsToCSV(reportRecords);
      addToast({ type: 'success', title: 'CSV Exported', message: 'Sanitized CSV file downloaded.' });
    } else if (selectedFormat === 'json') {
      exportRecordsToJSON(reportRecords);
      addToast({ type: 'success', title: 'JSON Exported', message: 'Structured JSON file downloaded.' });
    } else if (selectedFormat === 'text') {
      exportRecordsToText(reportRecords);
      addToast({ type: 'success', title: 'Checksums Exported', message: 'Checksum manifest downloaded.' });
    } else if (selectedFormat === 'printable') {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            Export & Cryptographic Reports
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export cryptographic operation logs, checksum manifests, and printable audit sheets.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all"
        >
          {selectedFormat === 'printable' ? (
            <>
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </>
          ) : (
            <>
              <Download className="h-4 w-4" /> Download Report ({reportRecords.length} records)
            </>
          )}
        </button>
      </div>

      {/* Format Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: 'csv',
            title: 'CSV Spreadsheet',
            subtitle: 'Excel & Google Sheets ready',
            description: 'Includes formula injection defense (escapes =, +, -, @).',
            icon: FileSpreadsheet,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
          },
          {
            id: 'json',
            title: 'Structured JSON',
            subtitle: 'Developers & automated tools',
            description: 'Full schema representation with millisecond timestamps.',
            icon: FileCode,
            color: 'text-sky-400',
            bg: 'bg-sky-500/10',
          },
          {
            id: 'text',
            title: 'Checksum Manifest',
            subtitle: 'sha256sum / md5sum format',
            description: 'Standard plain-text lines with digest and filename/label.',
            icon: FileText,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            id: 'printable',
            title: 'Printable Audit Sheet',
            subtitle: 'Visual browser print preview',
            description: 'Clean formatted printable report with summary statistics.',
            icon: Printer,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10',
          },
        ].map((fmt) => {
          const Icon = fmt.icon;
          const isSelected = selectedFormat === fmt.id;
          return (
            <button
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id as any)}
              className={`flex flex-col text-left rounded-xl p-4 border transition-all ${
                isSelected
                  ? 'border-violet-500 bg-violet-950/20 shadow-md ring-1 ring-violet-500'
                  : 'border-slate-800 bg-[#0f1422] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`rounded-lg p-2 ${fmt.bg} ${fmt.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-violet-400" />
                )}
              </div>
              <div className="text-xs font-bold text-white">{fmt.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{fmt.subtitle}</div>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                {fmt.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter / Scope Options */}
      <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeLegacyOnly}
              onChange={(e) => setIncludeLegacyOnly(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-0"
            />
            <span>Export only legacy algorithm records (SHA-1 / MD5) for vulnerability audit</span>
          </label>
        </div>

        <span className="text-xs font-mono text-slate-400">
          Target Records: <strong className="text-white">{reportRecords.length}</strong>
        </span>
      </div>

      {/* Report Preview Container */}
      <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-6 space-y-6 print:border-none print:bg-white print:text-black">
        {/* Printable Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white print:text-black">
              Cryptographic Operation Audit Manifest
            </h3>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
              Generated: {new Date().toUTCString()} • Scope: {reportRecords.length} operations
            </p>
          </div>
          <div className="text-right text-xs text-slate-400 print:text-gray-600">
            <div>Cryptographic Hash Explorer v1.0</div>
            <div className="font-mono text-[10px]">Client-Side Integrity Verification</div>
          </div>
        </div>

        {/* Audit Metric Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg bg-[#0a0d16] p-3 border border-slate-800 print:border-gray-300 print:bg-gray-100">
            <span className="text-slate-400 block text-[11px]">Total Operations</span>
            <span className="text-lg font-bold font-mono text-white print:text-black">
              {reportRecords.length}
            </span>
          </div>
          <div className="rounded-lg bg-[#0a0d16] p-3 border border-slate-800 print:border-gray-300 print:bg-gray-100">
            <span className="text-slate-400 block text-[11px]">Verified Checks</span>
            <span className="text-lg font-bold font-mono text-emerald-400 print:text-green-700">
              {stats.verifiedCount}
            </span>
          </div>
          <div className="rounded-lg bg-[#0a0d16] p-3 border border-slate-800 print:border-gray-300 print:bg-gray-100">
            <span className="text-slate-400 block text-[11px]">Integrity Mismatches</span>
            <span className="text-lg font-bold font-mono text-rose-400 print:text-red-700">
              {stats.mismatchCount}
            </span>
          </div>
          <div className="rounded-lg bg-[#0a0d16] p-3 border border-slate-800 print:border-gray-300 print:bg-gray-100">
            <span className="text-slate-400 block text-[11px]">Modern SHA-2 Family</span>
            <span className="text-lg font-bold font-mono text-violet-400 print:text-purple-700">
              {stats.algorithmDistribution['SHA-256'] +
                stats.algorithmDistribution['SHA-512'] +
                stats.algorithmDistribution['SHA-384']}
            </span>
          </div>
        </div>

        {/* Record Listing */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
              <tr>
                <th className="py-2 px-3">Label / Context</th>
                <th className="py-2 px-3">Algorithm</th>
                <th className="py-2 px-3">Hexadecimal Digest</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {reportRecords.slice(0, 15).map((r) => (
                <tr key={r.id}>
                  <td className="py-2 px-3 font-sans text-slate-200 print:text-black">
                    {r.label || r.file_name || 'Operation'}
                  </td>
                  <td className="py-2 px-3 text-violet-400 print:text-purple-700">{r.algorithm}</td>
                  <td className="py-2 px-3 text-slate-300 print:text-black break-all">
                    {r.digest}
                  </td>
                  <td className="py-2 px-3">
                    {r.verification_status === 'verified' ? (
                      <span className="text-emerald-400 print:text-green-700 font-sans">Verified</span>
                    ) : r.verification_status === 'mismatch' ? (
                      <span className="text-rose-400 print:text-red-700 font-sans">Mismatch</span>
                    ) : (
                      <span className="text-slate-500 font-sans">Calculated</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-400 print:text-gray-600">
                    {new Date(r.created_at).toISOString().slice(0, 19)}Z
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reportRecords.length > 15 && (
            <div className="text-center py-2 text-slate-500 text-[11px] font-mono">
              + {reportRecords.length - 15} additional records included in full download
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="rounded-lg bg-[#0a0d16] p-3 text-[11px] text-slate-500 print:border print:border-gray-300 print:bg-white leading-relaxed">
          <strong>Security Notice:</strong> Checksum equality certifies data integrity and bit-level conformity with the calculated hash. A checksum does not constitute an asymmetric cryptographic certificate or digital signature and does not verify the identity of the signer.
        </div>
      </div>
    </div>
  );
};
