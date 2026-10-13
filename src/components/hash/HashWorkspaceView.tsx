import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HashAlgorithm,
  ALGORITHM_REGISTRY,
  computeTextHash,
  computeFileHash,
  HashResult,
} from '../../lib/crypto/hasher';
import {
  Hash,
  UploadCloud,
  FileCode,
  Copy,
  Check,
  Download,
  BookmarkPlus,
  GitCompare,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Info,
  Clock,
  HardDrive,
  File,
  X
} from 'lucide-react';
import { downloadBlob } from '../../lib/utils/exportUtils';

export const HashWorkspaceView: React.FC = () => {
  const {
    saveNewRecord,
    preferences,
    setCurrentView,
    setComparePrefill,
    setVerifyPrefill,
    setAiExplainPrefill,
    addToast,
  } = useApp();

  const [inputMode, setInputMode] = useState<'text' | 'file'>(preferences.defaultInputMode || 'text');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<HashAlgorithm>(preferences.defaultAlgorithm || 'SHA-256');

  // Text mode state
  const [inputText, setInputText] = useState<string>('');
  const [textByteCount, setTextByteCount] = useState<number>(0);

  // File mode state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileProgress, setFileProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Result state
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [hashResult, setHashResult] = useState<HashResult | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [recordSaved, setRecordSaved] = useState<boolean>(false);
  const [customLabel, setCustomLabel] = useState<string>('');

  // Update byte count when text changes
  useEffect(() => {
    try {
      const bytes = new TextEncoder().encode(inputText).length;
      setTextByteCount(bytes);
    } catch {
      setTextByteCount(inputText.length);
    }
  }, [inputText]);

  // Handle Text Hash Generation
  const handleGenerateTextHash = async () => {
    setIsHashing(true);
    setRecordSaved(false);
    try {
      const result = await computeTextHash(inputText, selectedAlgorithm);
      setHashResult(result);

      if (preferences.autoSaveHistory) {
        await saveNewRecord({
          algorithm: result.algorithm,
          digest: result.digest,
          input_type: 'text',
          input_size_bytes: result.inputSizeBytes,
          operation_type: 'generate',
          label: customLabel.trim() || (inputText.length === 0 ? 'Empty String' : `Text Hash (${result.algorithm})`),
          notes: inputText.length <= 100 ? `Preview: ${inputText}` : undefined,
        });
        setRecordSaved(true);
      }

      addToast({
        type: 'success',
        title: 'Hash Calculated',
        message: `${selectedAlgorithm} digest computed in ${result.durationMs}ms`,
      });
    } catch (err: unknown) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Hashing Error',
        message: err instanceof Error ? err.message : 'Failed to calculate hash',
      });
    } finally {
      setIsHashing(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (file: File) => {
    // Limit to reasonable in-browser memory buffer (e.g. 500MB)
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Browser memory limit is 500MB for direct ArrayBuffer processing.',
      });
      return;
    }
    setSelectedFile(file);
    setHashResult(null);
    setRecordSaved(false);
    setFileProgress(0);
  };

  // Handle File Hash Generation
  const handleGenerateFileHash = async () => {
    if (!selectedFile) {
      addToast({
        type: 'warning',
        title: 'No File Selected',
        message: 'Please choose or drag a file to hash.',
      });
      return;
    }

    setIsHashing(true);
    setRecordSaved(false);
    setFileProgress(10);

    try {
      const result = await computeFileHash(selectedFile, selectedAlgorithm, (progress) => {
        setFileProgress(progress);
      });
      setHashResult(result);

      if (preferences.autoSaveHistory) {
        await saveNewRecord({
          algorithm: result.algorithm,
          digest: result.digest,
          input_type: 'file',
          input_size_bytes: result.inputSizeBytes,
          operation_type: 'generate',
          file_name: selectedFile.name,
          label: customLabel.trim() || selectedFile.name,
        });
        setRecordSaved(true);
      }

      addToast({
        type: 'success',
        title: 'File Hash Computed',
        message: `${selectedFile.name} hashed with ${selectedAlgorithm}`,
      });
    } catch (err: unknown) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'File Hashing Failed',
        message: err instanceof Error ? err.message : 'Failed to process file binary contents.',
      });
    } finally {
      setIsHashing(false);
      setFileProgress(0);
    }
  };

  // Copy Digest
  const handleCopy = () => {
    if (!hashResult) return;
    navigator.clipboard.writeText(hashResult.digest);
    setIsCopied(true);
    addToast({
      type: 'success',
      title: 'Digest Copied',
      message: 'Hexadecimal hash copied to clipboard.',
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download checksum file
  const handleDownload = () => {
    if (!hashResult) return;
    const content = `${hashResult.digest}  ${hashResult.fileName || 'text_input'} (${hashResult.algorithm})\nGenerated: ${hashResult.timestamp}\nAlgorithm: ${hashResult.algorithm}\nBits: ${hashResult.bitLength}`;
    downloadBlob(
      new Blob([content], { type: 'text/plain;charset=utf-8' }),
      `${hashResult.fileName || 'digest'}_${hashResult.algorithm.toLowerCase()}.txt`
    );
  };

  // Manual save to history
  const handleSaveToHistory = async () => {
    if (!hashResult || recordSaved) return;
    try {
      await saveNewRecord({
        algorithm: hashResult.algorithm,
        digest: hashResult.digest,
        input_type: hashResult.inputType,
        input_size_bytes: hashResult.inputSizeBytes,
        operation_type: 'generate',
        file_name: hashResult.fileName,
        label: customLabel.trim() || (hashResult.inputType === 'file' ? hashResult.fileName || 'File' : 'Text Hash'),
      });
      setRecordSaved(true);
      addToast({
        type: 'success',
        title: 'Record Saved',
        message: 'Saved to persistent cryptographic history.',
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const currentAlgoMeta = ALGORITHM_REGISTRY[selectedAlgorithm];

  return (
    <div className="space-y-6">
      {/* Workspace Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Hash className="h-5 w-5 text-violet-400" />
            Cryptographic Hash Generator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic cryptographic digests computed client-side using Web Crypto API.
          </p>
        </div>

        {/* Mode Toggle Pills */}
        <div className="inline-flex rounded-xl border border-slate-800 bg-[#0f1422] p-1">
          <button
            onClick={() => {
              setInputMode('text');
              setHashResult(null);
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              inputMode === 'text'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            Text Input
          </button>
          <button
            onClick={() => {
              setInputMode('file');
              setHashResult(null);
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              inputMode === 'file'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Binary File
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Input & Algorithm Selection) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Algorithm Selection Panel */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Hash Algorithm
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {currentAlgoMeta.hexLength} hex chars ({currentAlgoMeta.bitLength}-bit)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['SHA-256', 'SHA-512', 'SHA-384', 'SHA-1', 'MD5'] as HashAlgorithm[]).map((algo) => {
                const isSelected = selectedAlgorithm === algo;
                const meta = ALGORITHM_REGISTRY[algo];
                const isLegacy = meta.isLegacy;

                return (
                  <button
                    key={algo}
                    onClick={() => {
                      setSelectedAlgorithm(algo);
                      setHashResult(null);
                    }}
                    className={`flex flex-col text-left rounded-lg p-3 border transition-all ${
                      isSelected
                        ? 'border-violet-500 bg-violet-600/15 shadow-sm ring-1 ring-violet-500/50'
                        : 'border-slate-800 bg-[#0a0d16] hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-xs font-bold text-white">{algo}</span>
                      {isLegacy && (
                        <span className="text-[9px] rounded px-1 py-0.2 bg-amber-500/20 text-amber-300 font-mono">
                          LEGACY
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 font-mono">
                      {meta.bitLength} bits
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Caution warning for legacy algorithms */}
            {currentAlgoMeta.cautionNotice && (
              <div className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold">Security Notice: </span>
                  {currentAlgoMeta.cautionNotice}
                </div>
              </div>
            )}
          </div>

          {/* Input Panel */}
          {inputMode === 'text' ? (
            <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Text Input (UTF-8 Encoded)
                </label>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span>{inputText.length} chars</span>
                  <span>•</span>
                  <span>{textByteCount} bytes</span>
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter string, Unicode text, multiline source, or leave empty for empty string hash..."
                rows={6}
                className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-colors resize-y"
              />

              {/* Sample presets & clear button */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-500">Presets:</span>
                  <button
                    onClick={() => setInputText('abc')}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:bg-slate-700"
                  >
                    "abc"
                  </button>
                  <button
                    onClick={() => setInputText('')}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:bg-slate-700"
                  >
                    "" (Empty)
                  </button>
                  <button
                    onClick={() => setInputText('The quick brown fox jumps over the lazy dog')}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:bg-slate-700"
                  >
                    Fox Pangram
                  </button>
                  <button
                    onClick={() => setInputText('🔐 Cryptographic Integrity 2026 🚀')}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:bg-slate-700"
                  >
                    Unicode & Emoji
                  </button>
                </div>

                {inputText && (
                  <button
                    onClick={() => setInputText('')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>

              {/* Optional Record Label */}
              <div className="pt-2">
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="Optional label for history record (e.g., API Payload v2)"
                  className="w-full rounded-lg border border-slate-800/80 bg-[#0a0d16] px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleGenerateTextHash}
                disabled={isHashing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                <Hash className="h-4 w-4" />
                {isHashing ? 'Computing Digest...' : `Compute ${selectedAlgorithm} Digest`}
              </button>
            </div>
          ) : (
            /* File Input Mode */
            <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Select or Drop Binary File
                </label>
                <span className="text-[11px] text-slate-400">Hashed 100% locally in browser</span>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-violet-500 bg-violet-500/10'
                    : selectedFile
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-slate-800 bg-[#0a0d16] hover:border-slate-700 hover:bg-slate-800/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="rounded-full bg-emerald-500/20 p-3 text-emerald-400">
                      <File className="h-8 w-8" />
                    </div>
                    <div className="text-sm font-semibold text-white">{selectedFile.name}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {formatBytes(selectedFile.size)} • {selectedFile.type || 'Unknown MIME'}
                    </div>
                    <span className="text-[11px] text-violet-400 mt-1">Click to replace file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="rounded-full bg-violet-500/10 p-3 text-violet-400">
                      <UploadCloud className="h-8 w-8" />
                    </div>
                    <div className="text-sm font-semibold text-slate-200">
                      Drag & drop your file here, or browse
                    </div>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Supports executables, archives, images, documents, and raw disk images.
                    </p>
                    <span className="text-[11px] text-slate-500 font-mono">Zero remote upload. Processed in-memory.</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {isHashing && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Reading binary buffer & hashing...</span>
                    <span>{fileProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-violet-500 transition-all duration-300 rounded-full"
                      style={{ width: `${fileProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Optional Record Label */}
              <div>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="Optional custom label (default: filename)"
                  className="w-full rounded-lg border border-slate-800/80 bg-[#0a0d16] px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* File action buttons */}
              <div className="flex gap-2">
                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setHashResult(null);
                    }}
                    className="rounded-xl border border-slate-800 px-4 py-3 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={handleGenerateFileHash}
                  disabled={!selectedFile || isHashing}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  <Hash className="h-4 w-4" />
                  {isHashing ? 'Reading & Hashing...' : `Compute ${selectedAlgorithm} File Hash`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Hash Result Panel & Fast Shortcuts */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-4 sm:p-5 flex flex-col justify-between h-full min-h-[380px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Hash Output Result
                </span>
                {hashResult && (
                  <span className="rounded bg-violet-500/10 px-2 py-0.5 text-[11px] font-mono text-violet-300 border border-violet-500/20">
                    {hashResult.durationMs}ms
                  </span>
                )}
              </div>

              {hashResult ? (
                <div className="mt-4 space-y-4">
                  {/* Complete Hexadecimal Digest Box */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-400">Hexadecimal Digest</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {hashResult.hexLength} chars ({hashResult.bitLength} bits)
                      </span>
                    </div>
                    <div className="relative rounded-lg border border-slate-800 bg-[#090d16] p-3 group">
                      <p className="font-mono text-xs sm:text-sm text-emerald-400 break-all select-all leading-relaxed font-semibold">
                        {hashResult.digest}
                      </p>
                      <button
                        onClick={handleCopy}
                        className="mt-2.5 flex items-center gap-1.5 rounded bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy Hex Digest
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Metadata Summary List */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-[#0a0d16] p-2.5 border border-slate-800/60">
                      <span className="text-slate-400 block text-[11px]">Algorithm</span>
                      <span className="font-mono font-semibold text-slate-200">{hashResult.algorithm}</span>
                    </div>
                    <div className="rounded-lg bg-[#0a0d16] p-2.5 border border-slate-800/60">
                      <span className="text-slate-400 block text-[11px]">Input Size</span>
                      <span className="font-mono font-semibold text-slate-200">
                        {formatBytes(hashResult.inputSizeBytes)}
                      </span>
                    </div>
                    <div className="rounded-lg bg-[#0a0d16] p-2.5 border border-slate-800/60">
                      <span className="text-slate-400 block text-[11px]">Input Type</span>
                      <span className="capitalize font-semibold text-slate-200">{hashResult.inputType}</span>
                    </div>
                    <div className="rounded-lg bg-[#0a0d16] p-2.5 border border-slate-800/60">
                      <span className="text-slate-400 block text-[11px]">Timestamp</span>
                      <span className="font-mono text-[11px] text-slate-300">
                        {new Date(hashResult.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="rounded-full bg-slate-800/40 p-4 text-slate-500 mb-3">
                    <Hash className="h-8 w-8" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-300">No digest computed yet</h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs">
                    Provide text or select a file and click generate to inspect the full cryptographic output.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions & Shortcuts */}
            {hashResult && (
              <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0d16] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Download .txt
                  </button>

                  <button
                    onClick={handleSaveToHistory}
                    disabled={recordSaved}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-[#0a0d16] px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-60"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5 text-violet-400" />
                    {recordSaved ? 'Saved to Registry' : 'Save to Registry'}
                  </button>
                </div>

                {/* Workflow bridge buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setComparePrefill({ hashA: hashResult.digest });
                      setCurrentView('compare');
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-950/20 px-3 py-2 text-xs font-medium text-sky-300 hover:bg-sky-900/40 transition-colors"
                  >
                    <GitCompare className="h-3.5 w-3.5" /> Compare Digest
                  </button>

                  <button
                    onClick={() => {
                      setAiExplainPrefill({
                        algorithm: hashResult.algorithm,
                        digest: hashResult.digest,
                        inputType: hashResult.inputType,
                        inputSizeBytes: hashResult.inputSizeBytes,
                      });
                      setCurrentView('ai-assistant');
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-950/30 px-3 py-2 text-xs font-medium text-violet-300 hover:bg-violet-900/40 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Ask AI Tutor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
