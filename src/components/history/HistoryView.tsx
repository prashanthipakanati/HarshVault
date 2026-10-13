import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { HashRecord } from '../../lib/storage/recordRepository';
import { HashAlgorithm } from '../../lib/crypto/hasher';
import {
  History,
  Search,
  Filter,
  Trash2,
  Download,
  Copy,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
  FileCode,
  FileText,
  GitCompare,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  HardDrive,
  Database
} from 'lucide-react';
import { exportRecordsToCSV, exportRecordsToJSON, exportRecordsToText } from '../../lib/utils/exportUtils';

export const HistoryView: React.FC = () => {
  const {
    records,
    deleteRecord,
    bulkDeleteRecords,
    updateLabel,
    clearHistory,
    setCurrentView,
    setComparePrefill,
    setVerifyPrefill,
    setAiExplainPrefill,
    addToast,
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [algorithmFilter, setAlgorithmFilter] = useState<string>('all');
  const [inputTypeFilter, setInputTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit label modal or prompt
  const [editingRecord, setEditingRecord] = useState<HashRecord | null>(null);
  const [newLabelText, setNewLabelText] = useState<string>('');

  // Details modal
  const [inspectRecord, setInspectRecord] = useState<HashRecord | null>(null);

  // Confirm delete modal
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        // Algorithm filter
        if (algorithmFilter !== 'all' && r.algorithm !== algorithmFilter) return false;
        // Input type filter
        if (inputTypeFilter !== 'all' && r.input_type !== inputTypeFilter) return false;
        // Search term (digest, label, filename, notes)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchDigest = r.digest.toLowerCase().includes(term);
          const matchLabel = r.label ? r.label.toLowerCase().includes(term) : false;
          const matchFile = r.file_name ? r.file_name.toLowerCase().includes(term) : false;
          const matchAlgo = r.algorithm.toLowerCase().includes(term);
          return matchDigest || matchLabel || matchFile || matchAlgo;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [records, searchTerm, algorithmFilter, inputTypeFilter, sortBy]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // Bulk selection helpers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllOnPage = () => {
    if (selectedIds.size === paginatedRecords.length && paginatedRecords.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedRecords.map((r) => r.id)));
    }
  };

  const handleCopy = (digest: string) => {
    navigator.clipboard.writeText(digest);
    addToast({
      type: 'success',
      title: 'Digest Copied',
      message: 'Hexadecimal hash copied to clipboard.',
    });
  };

  const handleSaveLabel = async () => {
    if (!editingRecord) return;
    await updateLabel(editingRecord.id, newLabelText.trim());
    addToast({
      type: 'success',
      title: 'Record Updated',
      message: 'Label updated successfully.',
    });
    setEditingRecord(null);
  };

  const handleExecuteDelete = async (id: string) => {
    await deleteRecord(id);
    setConfirmDeleteId(null);
    if (selectedIds.has(id)) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    addToast({
      type: 'info',
      title: 'Record Deleted',
      message: 'Record removed from persistent registry.',
    });
  };

  const handleExecuteBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    await bulkDeleteRecords(ids);
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
    addToast({
      type: 'info',
      title: 'Bulk Delete Complete',
      message: `${ids.length} records removed from history.`,
    });
  };

  const getSelectedRecordsList = () => {
    return records.filter((r) => selectedIds.has(r.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="h-5 w-5 text-violet-400" />
            Cryptographic Registry & History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Search, filter, inspect, and export your persisted cryptographic operations.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear All History
            </button>
          )}

          {/* Export Dropdown */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const target = selectedIds.size > 0 ? getSelectedRecordsList() : records;
                exportRecordsToCSV(target);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0f1422] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              CSV {selectedIds.size > 0 && `(${selectedIds.size})`}
            </button>
            <button
              onClick={() => {
                const target = selectedIds.size > 0 ? getSelectedRecordsList() : records;
                exportRecordsToJSON(target);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0f1422] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <FileCode className="h-3.5 w-3.5 text-sky-400" />
              JSON
            </button>
            <button
              onClick={() => {
                const target = selectedIds.size > 0 ? getSelectedRecordsList() : records;
                exportRecordsToText(target);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0f1422] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              Text
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by digest, label, filename, or notes..."
              className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Algorithm filter */}
          <div className="flex items-center gap-2">
            <select
              value={algorithmFilter}
              onChange={(e) => {
                setAlgorithmFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-800 bg-[#0a0d16] px-3 py-2 text-xs font-mono text-slate-300 focus:border-violet-500 focus:outline-none"
            >
              <option value="all">All Algorithms</option>
              <option value="SHA-256">SHA-256</option>
              <option value="SHA-512">SHA-512</option>
              <option value="SHA-384">SHA-384</option>
              <option value="SHA-1">SHA-1 (Legacy)</option>
              <option value="MD5">MD5 (Legacy Checksum)</option>
            </select>

            {/* Input type filter */}
            <select
              value={inputTypeFilter}
              onChange={(e) => {
                setInputTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-800 bg-[#0a0d16] px-3 py-2 text-xs text-slate-300 focus:border-violet-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="text">Text Only</option>
              <option value="file">Files Only</option>
            </select>

            {/* Sort order */}
            <button
              onClick={() => setSortBy((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0d16] px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortBy === 'newest' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>

        {/* Bulk Action Strip */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-violet-950/30 border border-violet-500/30 px-3 py-2 text-xs text-violet-200">
            <span className="font-semibold">{selectedIds.size} records selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmBulkDelete(true)}
                className="flex items-center gap-1 rounded bg-rose-600/20 text-rose-300 border border-rose-500/30 px-2 py-1 text-xs hover:bg-rose-600/30 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-400 hover:text-white text-xs"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-[#0c101a] p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400 mb-3">
            <History className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No records saved yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Compute digests in the Hash Generator or run Integrity Verifications to populate your history.
          </p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0f1422] p-8 text-center text-xs text-slate-400">
          No records match your active search and filter criteria.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-[#0a0d16] text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        paginatedRecords.length > 0 &&
                        paginatedRecords.every((r) => selectedIds.has(r.id))
                      }
                      onChange={handleSelectAllOnPage}
                      className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-0"
                    />
                  </th>
                  <th className="px-4 py-3">Label / File</th>
                  <th className="px-4 py-3">Algorithm</th>
                  <th className="px-4 py-3">Digest (Hexadecimal)</th>
                  <th className="px-4 py-3">Type / Size</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedRecords.map((r) => {
                  const isSelected = selectedIds.has(r.id);
                  const isLegacy = r.algorithm === 'SHA-1' || r.algorithm === 'MD5';

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isSelected ? 'bg-violet-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(r.id)}
                          className="rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-0"
                        />
                      </td>

                      {/* Label & Storage badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">
                            {r.label || r.file_name || 'Untitled Record'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingRecord(r);
                              setNewLabelText(r.label || '');
                            }}
                            className="text-slate-500 hover:text-slate-300"
                            title="Edit Label"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5 font-mono">
                          <span className="text-emerald-400">Local Storage</span>
                          {r.file_name && <span>• {r.file_name}</span>}
                        </div>
                      </td>

                      {/* Algorithm */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono font-medium ${
                            isLegacy
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                          }`}
                        >
                          {r.algorithm}
                        </span>
                      </td>

                      {/* Digest */}
                      <td className="px-4 py-3 font-mono whitespace-nowrap text-slate-300">
                        <span className="text-violet-400">{r.digest.slice(0, 10)}</span>
                        <span className="text-slate-500">…</span>
                        <span className="text-slate-400">{r.digest.slice(-8)}</span>
                      </td>

                      {/* Type & Size */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                        <span className="capitalize">{r.input_type}</span>
                        {r.input_size_bytes != null && (
                          <span className="text-slate-500 ml-1">({r.input_size_bytes} B)</span>
                        )}
                      </td>

                      {/* Verification Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.verification_status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </span>
                        ) : r.verification_status === 'mismatch' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                            <XCircle className="h-3 w-3" /> Mismatch
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Calculated</span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap text-[11px] text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => handleCopy(r.digest)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                          title="Copy Digest"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setInspectRecord(r)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-sky-300"
                          title="Inspect Details"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setComparePrefill({ hashA: r.digest });
                            setCurrentView('compare');
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-sky-300"
                          title="Send to Compare"
                        >
                          <GitCompare className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setAiExplainPrefill({
                              algorithm: r.algorithm,
                              digest: r.digest,
                              inputType: r.input_type,
                              inputSizeBytes: r.input_size_bytes || undefined,
                            });
                            setCurrentView('ai-assistant');
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-violet-300"
                          title="Ask AI to Explain"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(r.id)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
                          title="Delete Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-slate-800 bg-[#0a0d16] px-4 py-3 text-xs text-slate-400">
            <div>
              Showing {filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded px-2.5 py-1 text-xs border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-mono text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded px-2.5 py-1 text-xs border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Record Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0f1422] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-400" />
                Record Technical Details
              </h3>
              <button
                onClick={() => setInspectRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] mb-1">Full Hexadecimal Digest</span>
                <div className="rounded-lg bg-[#080b11] p-3 font-mono text-emerald-400 break-all select-all border border-slate-800">
                  {inspectRecord.digest}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded bg-[#0a0d16] p-2.5 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Algorithm</span>
                  <span className="font-mono font-semibold text-slate-200">{inspectRecord.algorithm}</span>
                </div>
                <div className="rounded bg-[#0a0d16] p-2.5 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Operation</span>
                  <span className="font-semibold text-slate-200 capitalize">{inspectRecord.operation_type}</span>
                </div>
                <div className="rounded bg-[#0a0d16] p-2.5 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Input Size</span>
                  <span className="font-mono text-slate-200">{inspectRecord.input_size_bytes ?? 'N/A'} bytes</span>
                </div>
                <div className="rounded bg-[#0a0d16] p-2.5 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Timestamp</span>
                  <span className="font-mono text-slate-200">{new Date(inspectRecord.created_at).toISOString()}</span>
                </div>
              </div>

              {inspectRecord.notes && (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Notes / Context</span>
                  <div className="rounded bg-[#080b11] p-2.5 text-slate-300 font-mono text-[11px]">
                    {inspectRecord.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleCopy(inspectRecord.digest)}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Digest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Label Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0f1422] p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Edit Record Label</h3>
            <input
              type="text"
              value={newLabelText}
              onChange={(e) => setNewLabelText(e.target.value)}
              placeholder="Enter descriptive label..."
              className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-2.5 text-xs text-slate-200 focus:border-violet-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingRecord(null)}
                className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLabel}
                className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
              >
                Save Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Single Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0f1422] p-6 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-white">Confirm Record Deletion</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete this cryptographic record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteDelete(confirmDeleteId)}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Bulk Delete Modal */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0f1422] p-6 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-white">Delete Selected Records</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete {selectedIds.size} selected records from your registry?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkDelete}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Delete {selectedIds.size} Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
