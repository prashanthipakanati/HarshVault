import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HashAlgorithm,
  ALGORITHM_REGISTRY,
  computeTextHash,
  computeFileHash,
  compareDigests,
} from '../../lib/crypto/hasher';
import { HashRecord } from '../../lib/storage/recordRepository';
import {
  ShieldCheck,
  FileCheck,
  Layers,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  RotateCcw,
  Sparkles,
  BookmarkPlus,
  FileText
} from 'lucide-react';

export const VerifyView: React.FC = () => {
  const { records, saveNewRecord, verifyPrefill, setVerifyPrefill, addToast } = useApp();

  const [workflow, setWorkflow] = useState<'expected' | 'reference'>('expected');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<HashAlgorithm>('SHA-256');

  // Input source: file or text
  const [verifyInputType, setVerifyInputType] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow A: expected hash
  const [expectedDigest, setExpectedDigest] = useState<string>('');

  // Workflow B: reference record selection
  const [selectedReferenceRecordId, setSelectedReferenceRecordId] = useState<string>('');

  // Execution state
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [actualDigest, setActualDigest] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<{
    performed: boolean;
    isMatch: boolean;
    actualDigest: string;
    expectedDigest: string;
    durationMs: number;
    error?: string;
  } | null>(null);

  // Handle prefill
  useEffect(() => {
    if (verifyPrefill) {
      if (verifyPrefill.digest) setExpectedDigest(verifyPrefill.digest);
      if (verifyPrefill.algorithm) setSelectedAlgorithm(verifyPrefill.algorithm);
      if (verifyPrefill.record) {
        setWorkflow('reference');
        setSelectedReferenceRecordId(verifyPrefill.record.id);
        setSelectedAlgorithm(verifyPrefill.record.algorithm);
      }
      setVerifyPrefill(null);
    }
  }, [verifyPrefill, setVerifyPrefill]);

  const handleRunVerification = async () => {
    let targetExpected = expectedDigest.trim();

    if (workflow === 'reference') {
      const refRecord = records.find((r) => r.id === selectedReferenceRecordId);
      if (!refRecord) {
        addToast({
          type: 'error',
          title: 'Reference Missing',
          message: 'Please choose a reference record from your saved history.',
        });
        return;
      }
      targetExpected = refRecord.digest;
      setSelectedAlgorithm(refRecord.algorithm);
    }

    if (!targetExpected) {
      addToast({
        type: 'warning',
        title: 'Expected Digest Required',
        message: 'Provide the expected reference checksum to verify against.',
      });
      return;
    }

    if (verifyInputType === 'file' && !selectedFile) {
      addToast({
        type: 'warning',
        title: 'File Required',
        message: 'Please choose the file you want to verify.',
      });
      return;
    }

    setIsVerifying(true);
    const start = performance.now();

    try {
      let computed = '';
      let inputSize = 0;

      if (verifyInputType === 'file' && selectedFile) {
        const fileRes = await computeFileHash(selectedFile, selectedAlgorithm);
        computed = fileRes.digest;
        inputSize = fileRes.inputSizeBytes;
      } else {
        const textRes = await computeTextHash(textInput, selectedAlgorithm);
        computed = textRes.digest;
        inputSize = textRes.inputSizeBytes;
      }

      setActualDigest(computed);
      const comparison = compareDigests(computed, targetExpected);
      const durationMs = Math.round(performance.now() - start);

      const result = {
        performed: true,
        isMatch: comparison.matches,
        actualDigest: computed,
        expectedDigest: targetExpected,
        durationMs,
        error: comparison.error,
      };

      setVerificationResult(result);

      // Save operation record
      await saveNewRecord({
        algorithm: selectedAlgorithm,
        digest: computed,
        input_type: verifyInputType,
        input_size_bytes: inputSize,
        operation_type: 'verify',
        verification_status: comparison.matches ? 'verified' : 'mismatch',
        file_name: selectedFile?.name,
        label: `Integrity Check (${comparison.matches ? 'Verified' : 'Mismatch'})`,
        notes: `Compared against expected checksum: ${targetExpected.slice(0, 16)}…`,
      });

      if (comparison.matches) {
        addToast({
          type: 'success',
          title: 'Integrity Verified',
          message: 'Computed checksum exactly matches expected digest.',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Integrity Check Failed',
          message: 'Computed checksum does not match expected digest.',
        });
      }
    } catch (err: unknown) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Verification Failed',
        message: err instanceof Error ? err.message : 'Error computing hash.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setTextInput('');
    setExpectedDigest('');
    setActualDigest('');
    setVerificationResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Data Integrity Verification
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare calculated file or text digests against expected vendor release checksums.
          </p>
        </div>

        {/* Workflow Toggle */}
        <div className="inline-flex rounded-xl border border-slate-800 bg-[#0f1422] p-1">
          <button
            onClick={() => {
              setWorkflow('expected');
              setVerificationResult(null);
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              workflow === 'expected'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="h-3.5 w-3.5" />
            Expected Checksum
          </button>
          <button
            onClick={() => {
              setWorkflow('reference');
              setVerificationResult(null);
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              workflow === 'reference'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            History Reference
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration & File/Text Input */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step 1: Expected Digest or Record Selection */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Step 1: {workflow === 'expected' ? 'Expected Checksum Value' : 'Saved Reference Record'}
              </span>
              <span className="text-[11px] font-mono text-emerald-400">Target Standard</span>
            </div>

            {workflow === 'expected' ? (
              <div className="space-y-3">
                <textarea
                  value={expectedDigest}
                  onChange={(e) => {
                    setExpectedDigest(e.target.value);
                    setVerificationResult(null);
                  }}
                  placeholder="Paste official vendor or release checksum (e.g. SHA-256 string from website or security release)..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Algorithm:</label>
                    <select
                      value={selectedAlgorithm}
                      onChange={(e) => setSelectedAlgorithm(e.target.value as HashAlgorithm)}
                      className="rounded-lg border border-slate-800 bg-[#0a0d16] px-2.5 py-1 text-xs font-mono text-slate-200 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="SHA-256">SHA-256</option>
                      <option value="SHA-512">SHA-512</option>
                      <option value="SHA-384">SHA-384</option>
                      <option value="SHA-1">SHA-1 (Legacy)</option>
                      <option value="MD5">MD5 (Legacy Checksum)</option>
                    </select>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {expectedDigest.trim().length} hex chars
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {records.length === 0 ? (
                  <div className="rounded-lg bg-[#0a0d16] p-4 text-center text-xs text-slate-400">
                    No saved records found in history. Generate hashes first or switch to "Expected Checksum" mode.
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Select saved benchmark record:</label>
                    <select
                      value={selectedReferenceRecordId}
                      onChange={(e) => setSelectedReferenceRecordId(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-2.5 text-xs font-mono text-slate-200 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Choose a record --</option>
                      {records.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label || r.file_name || r.id.slice(0, 8)} ({r.algorithm}) - {r.digest.slice(0, 16)}…
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Target Data to Verify (File or Text) */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Step 2: Source Data to Test
              </span>
              <div className="inline-flex rounded-lg border border-slate-800 bg-[#0a0d16] p-0.5">
                <button
                  onClick={() => setVerifyInputType('file')}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    verifyInputType === 'file' ? 'bg-slate-700 text-white' : 'text-slate-400'
                  }`}
                >
                  Binary File
                </button>
                <button
                  onClick={() => setVerifyInputType('text')}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${
                    verifyInputType === 'text' ? 'bg-slate-700 text-white' : 'text-slate-400'
                  }`}
                >
                  Text Buffer
                </button>
              </div>
            </div>

            {verifyInputType === 'file' ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      setVerificationResult(null);
                    }
                  }}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? 'border-emerald-500/50 bg-emerald-950/10'
                      : 'border-slate-800 bg-[#0a0d16] hover:border-slate-700'
                  }`}
                >
                  <UploadCloud className="h-7 w-7 text-emerald-400 mb-2" />
                  {selectedFile ? (
                    <div>
                      <div className="text-xs font-bold text-white">{selectedFile.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {Math.round(selectedFile.size / 1024)} KB • Click to swap file
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-semibold text-slate-300">Click to choose file to verify</div>
                      <div className="text-[11px] text-slate-500">Calculated in-memory client-side</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <textarea
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  setVerificationResult(null);
                }}
                placeholder="Enter exact raw text to verify..."
                rows={4}
                className="w-full rounded-lg border border-slate-800 bg-[#0a0d16] p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            )}

            {/* Run Verification Button */}
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white"
              >
                Reset
              </button>
              <button
                onClick={handleRunVerification}
                disabled={isVerifying}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                {isVerifying ? 'Calculating & Verifying...' : `Verify ${selectedAlgorithm} Integrity`}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Result & Cryptographic Reality */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-xl border border-slate-800/80 bg-[#0f1422] p-5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Integrity Outcome
            </h3>

            {verificationResult && verificationResult.performed ? (
              <div className="space-y-4">
                <div
                  className={`rounded-xl border p-4 ${
                    verificationResult.isMatch
                      ? 'border-emerald-500/50 bg-[#091a13]'
                      : 'border-rose-500/50 bg-[#190910]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {verificationResult.isMatch ? (
                      <CheckCircle2 className="h-7 w-7 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-7 w-7 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div
                        className={`text-sm font-bold ${
                          verificationResult.isMatch ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {verificationResult.isMatch ? 'VERIFIED: Checksum Matches' : 'FAILED: Checksum Mismatch'}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        {verificationResult.isMatch
                          ? 'The computed digest exactly matches the reference checksum.'
                          : 'The computed hash differs. The source may have been altered or corrupted.'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block mb-1">
                      Computed Digest:
                    </span>
                    <div className="rounded bg-[#080b11] p-2.5 font-mono text-[11px] text-emerald-400 break-all select-all">
                      {verificationResult.actualDigest}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block mb-1">
                      Expected Digest:
                    </span>
                    <div className="rounded bg-[#080b11] p-2.5 font-mono text-[11px] text-slate-300 break-all select-all">
                      {verificationResult.expectedDigest}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-full bg-slate-800/40 p-3 text-slate-500 mb-2">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="text-xs font-semibold text-slate-300">Ready for verification</div>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                  Specify expected checksum and choose a file or text buffer to run the comparison.
                </p>
              </div>
            )}
          </div>

          {/* Critical Cryptographic Guidance */}
          <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4 text-xs text-slate-400 space-y-2 leading-relaxed">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Info className="h-4 w-4 text-emerald-400" />
              Cryptographic Distinction: Checksum vs Digital Signature
            </div>
            <p>
              A matching cryptographic checksum guarantees that the data hasn't been altered compared to the reference hash.
            </p>
            <p className="text-slate-400">
              However, <strong>a checksum does NOT prove authenticity</strong> if an attacker can tamper with both the download and the webpage hosting the checksum. True authenticity requires an asymmetric digital signature (such as GPG/PGP or Sigstore) verified with a trusted public key.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
