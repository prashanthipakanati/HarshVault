import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { HashAlgorithm, KNOWN_TEST_VECTORS, computeTextHash } from '../../lib/crypto/hasher';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Trash2,
  HardDrive,
  Play,
  Download,
  Upload,
  Lock,
  AlertTriangle,
  RotateCcw,
  FileText,
  Check
} from 'lucide-react';
import { downloadBlob } from '../../lib/utils/exportUtils';
import { HashRecord } from '../../lib/storage/recordRepository';

export const SettingsView: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    clearHistory,
    records,
    storageUsageBytes,
    importHistoryRecords,
    addToast,
  } = useApp();

  // Self test state
  const [testResults, setTestResults] = useState<Array<{ name: string; algorithm: string; passed: boolean; actual: string; expected: string }> | null>(null);
  const [runningTests, setRunningTests] = useState<boolean>(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);

  const importFileInputRef = useRef<HTMLInputElement>(null);

  const handleRunVectorTests = async () => {
    setRunningTests(true);
    const results = [];

    for (const vector of KNOWN_TEST_VECTORS) {
      try {
        const res = await computeTextHash(vector.input, vector.algorithm);
        const passed = res.digest.toLowerCase() === vector.expected.toLowerCase();
        results.push({
          name: vector.name,
          algorithm: vector.algorithm,
          passed,
          actual: res.digest,
          expected: vector.expected,
        });
      } catch (e: any) {
        results.push({
          name: vector.name,
          algorithm: vector.algorithm,
          passed: false,
          actual: `Error: ${e.message}`,
          expected: vector.expected,
        });
      }
    }

    setTestResults(results);
    setRunningTests(false);

    const allPassed = results.every((r) => r.passed);
    if (allPassed) {
      addToast({
        type: 'success',
        title: 'All Test Vectors Passed',
        message: 'Cryptographic engine verified against canonical NIST test vectors.',
      });
    } else {
      addToast({
        type: 'error',
        title: 'Vector Test Failure',
        message: 'One or more test vectors did not match expected output.',
      });
    }
  };

  const handleExportBackup = () => {
    if (records.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Records',
        message: 'Your storage vault is currently empty.',
      });
      return;
    }

    const payload = {
      backupTimestamp: new Date().toISOString(),
      version: '1.0.0',
      totalRecords: records.length,
      records,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    downloadBlob(
      new Blob([jsonStr], { type: 'application/json;charset=utf-8' }),
      `cryptohash_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    addToast({
      type: 'success',
      title: 'Vault Backup Exported',
      message: `${records.length} records exported to JSON backup file.`,
    });
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        const recordsToImport: HashRecord[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.records)
          ? parsed.records
          : [];

        if (recordsToImport.length === 0) {
          throw new Error('No valid cryptographic records found in JSON file.');
        }

        const count = await importHistoryRecords(recordsToImport);
        addToast({
          type: 'success',
          title: 'Records Restored',
          message: `Successfully imported ${count} records into your local vault.`,
        });
      } catch (err: unknown) {
        addToast({
          type: 'error',
          title: 'Import Failed',
          message: err instanceof Error ? err.message : 'Invalid JSON backup format.',
        });
      }
    };
    reader.readAsText(file);
  };

  const formatStorageSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Bytes`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-violet-400" />
          Settings, Storage Vault & Cryptographic Verification
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure default behaviors, manage private local storage backup/restore, and run browser cryptographic vector self-tests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: User Preferences & Test Vectors */}
        <div className="space-y-6">
          {/* General Preferences */}
          <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Workspace Preferences
            </h3>

            {/* Default algorithm */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Default Hash Algorithm:</label>
              <select
                value={preferences.defaultAlgorithm}
                onChange={(e) => updatePreferences({ defaultAlgorithm: e.target.value as HashAlgorithm })}
                className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-2.5 text-xs font-mono text-slate-200 focus:border-violet-500 focus:outline-none"
              >
                <option value="SHA-256">SHA-256 (Default Modern Standard)</option>
                <option value="SHA-512">SHA-512 (Maximum Collision Resistance)</option>
                <option value="SHA-384">SHA-384 (Truncated SHA-512)</option>
                <option value="SHA-1">SHA-1 (Legacy Compatibility Only)</option>
                <option value="MD5">MD5 (Legacy Checksum Only)</option>
              </select>
            </div>

            {/* Default input mode */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Default Input Mode:</label>
              <select
                value={preferences.defaultInputMode}
                onChange={(e) => updatePreferences({ defaultInputMode: e.target.value as any })}
                className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-2.5 text-xs font-mono text-slate-200 focus:border-violet-500 focus:outline-none"
              >
                <option value="text">Text Mode (Unicode / Multiline)</option>
                <option value="file">Binary File Mode (Drag & Drop)</option>
              </select>
            </div>

            {/* Auto save toggle */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <div>
                  <span className="font-medium block">Automatic History Saving</span>
                  <span className="text-[11px] text-slate-500">
                    Automatically record newly generated hashes to your local vault.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.autoSaveHistory}
                  onChange={(e) => updatePreferences({ autoSaveHistory: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-0 h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Cryptographic Known Vector Self-Tests */}
          <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  NIST Known Test Vector Verification
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Verifies browser Web Crypto & RFC 1321 MD5 against canonical test vectors.
                </p>
              </div>

              <button
                onClick={handleRunVectorTests}
                disabled={runningTests}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                {runningTests ? 'Running...' : 'Run Self-Test'}
              </button>
            </div>

            {testResults && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {testResults.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-[#0a0d16] p-2.5 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      {r.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                      <span className="text-slate-200">{r.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        r.passed ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {r.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Local Storage Management, Backup & Restore */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-sky-400" />
                Local Storage Vault Details
              </h3>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 border border-emerald-500/30">
                100% PRIVATE
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              All cryptographic operations, labels, and records are stored exclusively in your browser's local storage. No data is sent to external databases or third-party servers.
            </p>

            {/* Storage Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-[#0a0d16] p-3 border border-slate-800/80">
                <span className="text-[11px] text-slate-500 block">Total Persisted Records</span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">
                  {records.length}
                </span>
              </div>
              <div className="rounded-lg bg-[#0a0d16] p-3 border border-slate-800/80">
                <span className="text-[11px] text-slate-500 block">Storage Quota Consumed</span>
                <span className="text-xl font-bold font-mono text-sky-400 mt-1 block">
                  {formatStorageSize(storageUsageBytes)}
                </span>
              </div>
            </div>

            {/* Backup & Restore Controls */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <div className="text-xs font-medium text-slate-300">
                Backup & Restore Records
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportBackup}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0d16] px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-violet-400" /> Export JSON
                </button>

                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImportFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <button
                  onClick={() => importFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0d16] px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5 text-emerald-400" /> Restore JSON
                </button>
              </div>
            </div>

            {/* Clear Storage Section */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-300 block">Wipe Local Storage</span>
                <span className="text-[11px] text-slate-500">
                  Permanently erase all {records.length} stored cryptographic records.
                </span>
              </div>

              <button
                onClick={() => setConfirmClearOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Wipe Vault
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Wipe Modal */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0f1422] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-sm font-bold text-white">Confirm Wipe</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to erase all {records.length} records from your browser's local storage? This cannot be undone unless you have a JSON backup.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearHistory();
                  setConfirmClearOpen(false);
                }}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Yes, Wipe All Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
